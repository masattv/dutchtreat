# アーキテクチャ設計

## システム概要
Dutch Treatは、グループでの支払いを簡単に管理・分割できるアプリケーションです。

## 技術スタック
- フロントエンド: Next.js 14 (App Router)
- バックエンド: Supabase
- データベース: PostgreSQL (Supabase)
- 認証: Supabase Auth
- OCR処理: Tesseract.js (Deno Edge Functions)
- ストレージ: Supabase Storage
- デプロイ: Vercel

## システムアーキテクチャ

### フロントエンド構造
```
app/
├── (auth)/
│   ├── login/
│   ├── signup/
│   └── forgot-password/
├── (dashboard)/
│   ├── groups/
│   ├── receipts/
│   └── settings/
├── api/
└── components/
```

### データベーススキーマ
```sql
-- グループテーブル
create table groups (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  created_by uuid references auth.users(id),
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- グループメンバーテーブル
create table group_members (
  id uuid primary key default uuid_generate_v4(),
  group_id uuid references groups(id),
  user_id uuid references auth.users(id),
  role text check (role in ('owner', 'member')),
  created_at timestamp with time zone default now()
);

-- レシートテーブル
create table receipts (
  id uuid primary key default uuid_generate_v4(),
  group_id uuid references groups(id),
  file_path text not null,
  created_by uuid references auth.users(id),
  ocr_text text,
  total_amount decimal(10,2),
  version integer default 1,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- レシート監査ログテーブル
create table receipt_audit_logs (
  id uuid primary key default uuid_generate_v4(),
  receipt_id uuid references receipts(id),
  user_id uuid references auth.users(id),
  action text not null,
  timestamp timestamp with time zone default now()
);
```

## セキュリティ設計
1. 行レベルセキュリティ（RLS）ポリシー
2. レート制限の実装
3. データの暗号化（保存時・転送時）
4. アクセストークンの適切な管理

## パフォーマンス最適化
1. CDNキャッシングの活用
2. 画像の最適化
3. データベースインデックスの適切な設定
4. エッジ関数の活用

## 監視とロギング
1. エラーアラート（Slack連携）
2. パフォーマンスメトリクスの収集
3. ユーザーアクティビティのログ記録
4. システムヘルスチェック 