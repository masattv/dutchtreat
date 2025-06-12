import { Metadata } from 'next'
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import GroupList from './group-list'
import CreateGroupButton from './create-group-button'

export const metadata: Metadata = {
  title: 'ダッシュボード - Dutch Treat',
  description: 'グループでの支払いを管理しましょう。',
}

export default async function DashboardPage() {
  const supabase = createServerComponentClient({ cookies })

  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    redirect('/login')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="py-8">
          <div className="sm:flex sm:items-center">
            <div className="sm:flex-auto">
              <h1 className="text-2xl font-semibold text-gray-900">
                グループ一覧
              </h1>
              <p className="mt-2 text-sm text-gray-700">
                参加しているグループの一覧です。新しいグループを作成したり、既存のグループに参加したりできます。
              </p>
            </div>
            <div className="mt-4 sm:ml-16 sm:mt-0 sm:flex-none">
              <CreateGroupButton />
            </div>
          </div>
          <div className="mt-8">
            <GroupList />
          </div>
        </div>
      </div>
    </div>
  )
} 