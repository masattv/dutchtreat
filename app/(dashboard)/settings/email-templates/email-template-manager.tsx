'use client'

import { useState } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Eye, Send } from 'lucide-react'

type EmailPreferences = {
  enabled: boolean
  templates: {
    receipt_added: {
      subject: string
      body: string
    }
    payment_required: {
      subject: string
      body: string
    }
    payment_confirmed: {
      subject: string
      body: string
    }
  }
}

const templateSchema = z.object({
  enabled: z.boolean(),
  templates: z.object({
    receipt_added: z.object({
      subject: z.string().min(1, '件名は必須です'),
      body: z.string().min(1, '本文は必須です'),
    }),
    payment_required: z.object({
      subject: z.string().min(1, '件名は必須です'),
      body: z.string().min(1, '本文は必須です'),
    }),
    payment_confirmed: z.object({
      subject: z.string().min(1, '件名は必須です'),
      body: z.string().min(1, '本文は必須です'),
    }),
  }),
})

type EmailTemplateManagerProps = {
  preferences: EmailPreferences | null
}

export function EmailTemplateManager({ preferences }: EmailTemplateManagerProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [previewTemplate, setPreviewTemplate] = useState<string | null>(null)
  const [testEmail, setTestEmail] = useState('')
  const [isSendingTest, setIsSendingTest] = useState(false)
  const router = useRouter()
  const supabase = createClientComponentClient()

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(templateSchema),
    defaultValues: preferences || {
      enabled: true,
      templates: {
        receipt_added: {
          subject: '新しいレシートが追加されました',
          body: `
            {group_name}に新しいレシートが追加されました。
            金額: ¥{amount}
            支払いが必要な場合は、アプリにログインして確認してください。
          `,
        },
        payment_required: {
          subject: '支払いが必要です',
          body: `
            {group_name}で支払いが必要です。
            金額: ¥{amount}
            アプリにログインして支払い状況を更新してください。
          `,
        },
        payment_confirmed: {
          subject: '支払いが確認されました',
          body: `
            {group_name}での支払いが確認されました。
            金額: ¥{amount}
            ありがとうございます。
          `,
        },
      },
    },
  })

  const onSubmit = async (data: z.infer<typeof templateSchema>) => {
    try {
      setIsLoading(true)
      setError(null)

      const { error } = await supabase
        .from('users')
        .update({
          email_preferences: data,
        })
        .eq('id', (await supabase.auth.getUser()).data.user?.id)

      if (error) throw error

      router.refresh()
    } catch (error) {
      console.error('Update error:', error)
      setError('設定の更新に失敗しました')
    } finally {
      setIsLoading(false)
    }
  }

  const handlePreview = (template: string) => {
    setPreviewTemplate(template)
  }

  const handleSendTest = async (template: string) => {
    if (!testEmail) {
      setError('テスト用のメールアドレスを入力してください')
      return
    }

    try {
      setIsSendingTest(true)
      setError(null)

      const templateData = watch(`templates.${template}`)
      const testData = {
        group_name: 'テストグループ',
        amount: '1,000',
        user_name: 'テストユーザー',
      }

      let subject = templateData.subject
      let body = templateData.body

      Object.entries(testData).forEach(([key, value]) => {
        const regex = new RegExp(`{${key}}`, 'g')
        subject = subject.replace(regex, value)
        body = body.replace(regex, value)
      })

      const { error } = await supabase.functions.invoke('send-test-email', {
        body: {
          to: testEmail,
          subject,
          body,
        },
      })

      if (error) throw error

      alert('テストメールを送信しました')
      setTestEmail('')
    } catch (error) {
      console.error('Send test error:', error)
      setError('テストメールの送信に失敗しました')
    } finally {
      setIsSendingTest(false)
    }
  }

  const renderPreview = () => {
    if (!previewTemplate) return null

    const template = watch(`templates.${previewTemplate}`)
    const previewData = {
      group_name: 'サンプルグループ',
      amount: '1,000',
      user_name: 'サンプルユーザー',
    }

    let subject = template.subject
    let body = template.body

    Object.entries(previewData).forEach(([key, value]) => {
      const regex = new RegExp(`{${key}}`, 'g')
      subject = subject.replace(regex, value)
      body = body.replace(regex, value)
    })

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
        <div className="w-full max-w-2xl rounded-lg bg-white p-6">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-lg font-medium">プレビュー</h3>
            <button
              onClick={() => setPreviewTemplate(null)}
              className="text-gray-500 hover:text-gray-700"
            >
              ✕
            </button>
          </div>
          <div className="space-y-4">
            <div>
              <div className="text-sm font-medium text-gray-700">件名</div>
              <div className="mt-1 rounded-md border border-gray-200 bg-gray-50 p-2">
                {subject}
              </div>
            </div>
            <div>
              <div className="text-sm font-medium text-gray-700">本文</div>
              <div className="mt-1 whitespace-pre-wrap rounded-md border border-gray-200 bg-gray-50 p-2">
                {body}
              </div>
            </div>
            <div className="mt-4">
              <div className="text-sm font-medium text-gray-700">テスト送信</div>
              <div className="mt-1 flex items-center gap-2">
                <input
                  type="email"
                  value={testEmail}
                  onChange={(e) => setTestEmail(e.target.value)}
                  placeholder="テスト用メールアドレス"
                  className="flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
                <button
                  onClick={() => handleSendTest(previewTemplate)}
                  disabled={isSendingTest || !testEmail}
                  className="inline-flex items-center gap-1 rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-500 disabled:opacity-50"
                >
                  <Send className="h-4 w-4" />
                  {isSendingTest ? '送信中...' : 'テスト送信'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              {...register('enabled')}
              className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-sm font-medium text-gray-700">
              メール通知を有効にする
            </span>
          </label>
        </div>

        <div className="space-y-6">
          <div>
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium">レシート追加時の通知</h3>
              <button
                type="button"
                onClick={() => handlePreview('receipt_added')}
                className="inline-flex items-center gap-1 text-sm text-blue-600 hover:text-blue-500"
              >
                <Eye className="h-4 w-4" />
                プレビュー
              </button>
            </div>
            <div className="mt-4 space-y-4">
              <div>
                <label
                  htmlFor="receipt_added.subject"
                  className="block text-sm font-medium text-gray-700"
                >
                  件名
                </label>
                <input
                  type="text"
                  id="receipt_added.subject"
                  {...register('templates.receipt_added.subject')}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
                {errors.templates?.receipt_added?.subject && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.templates.receipt_added.subject.message}
                  </p>
                )}
              </div>
              <div>
                <label
                  htmlFor="receipt_added.body"
                  className="block text-sm font-medium text-gray-700"
                >
                  本文
                </label>
                <textarea
                  id="receipt_added.body"
                  {...register('templates.receipt_added.body')}
                  rows={4}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
                {errors.templates?.receipt_added?.body && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.templates.receipt_added.body.message}
                  </p>
                )}
              </div>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium">支払い必要時の通知</h3>
              <button
                type="button"
                onClick={() => handlePreview('payment_required')}
                className="inline-flex items-center gap-1 text-sm text-blue-600 hover:text-blue-500"
              >
                <Eye className="h-4 w-4" />
                プレビュー
              </button>
            </div>
            <div className="mt-4 space-y-4">
              <div>
                <label
                  htmlFor="payment_required.subject"
                  className="block text-sm font-medium text-gray-700"
                >
                  件名
                </label>
                <input
                  type="text"
                  id="payment_required.subject"
                  {...register('templates.payment_required.subject')}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
                {errors.templates?.payment_required?.subject && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.templates.payment_required.subject.message}
                  </p>
                )}
              </div>
              <div>
                <label
                  htmlFor="payment_required.body"
                  className="block text-sm font-medium text-gray-700"
                >
                  本文
                </label>
                <textarea
                  id="payment_required.body"
                  {...register('templates.payment_required.body')}
                  rows={4}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
                {errors.templates?.payment_required?.body && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.templates.payment_required.body.message}
                  </p>
                )}
              </div>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium">支払い確認時の通知</h3>
              <button
                type="button"
                onClick={() => handlePreview('payment_confirmed')}
                className="inline-flex items-center gap-1 text-sm text-blue-600 hover:text-blue-500"
              >
                <Eye className="h-4 w-4" />
                プレビュー
              </button>
            </div>
            <div className="mt-4 space-y-4">
              <div>
                <label
                  htmlFor="payment_confirmed.subject"
                  className="block text-sm font-medium text-gray-700"
                >
                  件名
                </label>
                <input
                  type="text"
                  id="payment_confirmed.subject"
                  {...register('templates.payment_confirmed.subject')}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
                {errors.templates?.payment_confirmed?.subject && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.templates.payment_confirmed.subject.message}
                  </p>
                )}
              </div>
              <div>
                <label
                  htmlFor="payment_confirmed.body"
                  className="block text-sm font-medium text-gray-700"
                >
                  本文
                </label>
                <textarea
                  id="payment_confirmed.body"
                  {...register('templates.payment_confirmed.body')}
                  rows={4}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
                {errors.templates?.payment_confirmed?.body && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.templates.payment_confirmed.body.message}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isLoading}
            className="rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-500 disabled:opacity-50"
          >
            {isLoading ? '保存中...' : '保存'}
          </button>
        </div>
      </form>

      <div className="rounded-lg bg-gray-50 p-4">
        <h3 className="text-sm font-medium text-gray-900">利用可能な変数</h3>
        <ul className="mt-2 list-inside list-disc text-sm text-gray-600">
          <li>{'{group_name} - グループ名'}</li>
          <li>{'{amount} - 金額'}</li>
          <li>{'{user_name} - ユーザー名'}</li>
        </ul>
      </div>

      {renderPreview()}
    </div>
  )
} 