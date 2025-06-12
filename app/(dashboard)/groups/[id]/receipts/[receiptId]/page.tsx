import { Metadata } from 'next'
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import ReceiptDetail from './receipt-detail'

export const metadata: Metadata = {
  title: 'レシート詳細 | Dutch Treat',
  description: 'レシートの詳細を確認・編集します',
}

interface ReceiptPageProps {
  params: {
    id: string
    receiptId: string
  }
}

export default async function ReceiptPage({ params }: ReceiptPageProps) {
  const supabase = createServerComponentClient({ cookies })

  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    redirect('/login')
  }

  // グループの存在確認とメンバーシップチェック
  const { data: group } = await supabase
    .from('groups')
    .select('*')
    .eq('id', params.id)
    .single()

  if (!group) {
    redirect('/dashboard')
  }

  const { data: membership } = await supabase
    .from('group_members')
    .select('*')
    .eq('group_id', params.id)
    .eq('user_id', session.user.id)
    .single()

  if (!membership) {
    redirect('/dashboard')
  }

  // レシートの取得
  const { data: receipt } = await supabase
    .from('receipts')
    .select('*')
    .eq('id', params.receiptId)
    .single()

  if (!receipt) {
    redirect(`/groups/${params.id}`)
  }

  return (
    <div className="py-10">
      <header>
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold leading-tight tracking-tight text-gray-900">
            レシート詳細
          </h1>
        </div>
      </header>
      <main>
        <div className="mx-auto max-w-7xl sm:px-6 lg:px-8">
          <div className="px-4 py-8 sm:px-0">
            <ReceiptDetail
              receipt={receipt}
              groupId={params.id}
              isOwner={membership.role === 'owner'}
            />
          </div>
        </div>
      </main>
    </div>
  )
} 