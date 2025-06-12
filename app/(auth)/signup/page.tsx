import { Metadata } from 'next'
import Link from 'next/link'
import SignupForm from './signup-form'

export const metadata: Metadata = {
  title: '新規登録 - Dutch Treat',
  description: 'Dutch Treatに新規登録して、グループでの支払いを管理しましょう。',
}

export default function SignupPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-24">
      <div className="w-full max-w-md space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-bold tracking-tight text-gray-900">
            新規登録
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            または{' '}
            <Link
              href="/login"
              className="font-medium text-primary-600 hover:text-primary-500"
            >
              ログイン
            </Link>
          </p>
        </div>
        <SignupForm />
      </div>
    </div>
  )
} 