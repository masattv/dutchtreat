# 認証設定ドキュメント

## 保留中の設定

### 5. セキュリティ設定
以下の設定は現在保留中です。必要に応じて後日設定してください。

**Authentication** → **Security** で以下の設定が必要です：

- JWT Expiry: JWTトークンの有効期限（デフォルト: 3600秒）
- Refresh Token Reuse Interval: リフレッシュトークンの再利用間隔（デフォルト: 10秒）
- Enable Row Level Security: 行レベルセキュリティの有効化（必須）

### 6. URL設定
以下の設定は現在保留中です。必要に応じて後日設定してください。

**Authentication** → **URL Configuration** で以下の設定が必要です：

1. Site URL
   - アプリケーションのメインURLを設定
   - 例: `https://あなたのドメイン`

2. Redirect URLs
   - 認証後のリダイレクト先URLを設定
   - 開発環境: `http://localhost:3000/auth/callback`
   - 本番環境: `https://あなたのドメイン/auth/callback`

## 設定手順

1. Supabaseダッシュボードにログイン
2. 左メニューから「Authentication」を選択
3. 「Security」タブでセキュリティ設定を実施
4. 「URL Configuration」タブでURL設定を実施

## 注意事項

- 本番環境に移行する前に、必ずこれらの設定を完了させてください
- セキュリティ設定は、アプリケーションの要件に応じて適切な値を設定してください
- URL設定は、開発環境と本番環境で異なる設定が必要です
- 設定変更後は、アプリケーションの再起動が必要な場合があります 