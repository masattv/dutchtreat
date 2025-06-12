import { Metadata } from 'next'
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { PaymentAnalytics } from './payment-analytics'

export const metadata: Metadata = {
  title: '支払い分析',
  description: 'グループの支払い状況を分析します',
}

export default async function AnalyticsPage({
  params,
}: {
  params: { id: string }
}) {
  const supabase = createServerComponentClient({ cookies })

  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    redirect('/login')
  }

  // グループの情報を取得
  const { data: group, error: groupError } = await supabase
    .from('groups')
    .select('*')
    .eq('id', params.id)
    .single()

  if (groupError || !group) {
    redirect('/dashboard')
  }

  // ユーザーがグループのメンバーか確認
  const { data: member, error: memberError } = await supabase
    .from('group_members')
    .select('role')
    .eq('group_id', params.id)
    .eq('user_id', session.user.id)
    .single()

  if (memberError || !member) {
    redirect('/dashboard')
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="mb-8 text-2xl font-bold">支払い分析</h1>
      <PaymentAnalytics groupId={params.id} />
    </div>
  )
} 