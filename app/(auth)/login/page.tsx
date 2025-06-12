import { Metadata } from 'next'
import Link from 'next/link'
import LoginForm from './login-form'

export const metadata: Metadata = {
  title: 'ログイン - Dutch Treat',
  description: 'Dutch Treatにログインして、グループでの支払いを管理しましょう。',
}

export default function LoginPage() {
  return (
    <div className="flex min-h-screen flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center text-3xl font-bold tracking-tight text-gray-900">
          Dutch Treat
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          グループでの支払いを管理しましょう
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white px-4 py-8 shadow sm:rounded-lg sm:px-10">
          <LoginForm />
          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="bg-white px-2 text-gray-500">または</span>
              </div>
            </div>

            <div className="mt-6">
              <Link
                href="/signup"
                className="btn-secondary w-full"
              >
                新規登録
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 