'use client'

import { Metadata } from 'next'
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { GroupSettings } from './group-settings'
import { InviteHistory } from './invite-history'

export const metadata: Metadata = {
  title: 'グループ設定',
  description: 'グループの設定を管理します',
}

export default async function GroupSettingsPage({
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

  // 管理者のみアクセス可能
  if (member.role !== 'owner') {
    redirect(`/groups/${params.id}`)
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="mb-8 text-2xl font-bold">グループ設定</h1>
      <GroupSettings group={group} />
      <InviteHistory groupId={params.id} />
    </div>
  )
} 