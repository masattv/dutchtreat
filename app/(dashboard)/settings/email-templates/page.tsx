import { Metadata } from 'next'
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { EmailTemplateManager } from './email-template-manager'

export const metadata: Metadata = {
  title: 'メール通知設定',
  description: 'メール通知のテンプレートを管理します',
}

export default async function EmailTemplatesPage() {
  const supabase = createServerComponentClient({ cookies })

  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    redirect('/login')
  }

  // ユーザーのメール通知設定を取得
  const { data: user, error: userError } = await supabase
    .from('users')
    .select('email_preferences')
    .eq('id', session.user.id)
    .single()

  if (userError) {
    redirect('/dashboard')
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="mb-8 text-2xl font-bold">メール通知設定</h1>
      <EmailTemplateManager preferences={user?.email_preferences} />
    </div>
  )
} 