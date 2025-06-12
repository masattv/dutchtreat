'use client'

import { useState, useEffect } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import type { Database } from '@/lib/supabase'

interface PaymentSummaryProps {
  groupId: string
}

type PaymentSummary = {
  user_id: string
  email: string
  total_paid: number
  total_owed: number
  balance: number
}

export default function PaymentSummary({ groupId }: PaymentSummaryProps) {
  const [summary, setSummary] = useState<PaymentSummary[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClientComponentClient<Database>()

  useEffect(() => {
    const fetchSummary = async () => {
      try {
        // グループの全レシートを取得
        const { data: receipts, error: receiptsError } = await supabase
          .from('receipts')
          .select('*')
          .eq('group_id', groupId)

        if (receiptsError) {
          throw receiptsError
        }

        // グループの全メンバーを取得
        const { data: members, error: membersError } = await supabase
          .from('group_members')
          .select(`
            *,
            user:users(email)
          `)
          .eq('group_id', groupId)

        if (membersError) {
          throw membersError
        }

        // 支払い状況を取得
        const { data: payments, error: paymentsError } = await supabase
          .from('receipt_payments')
          .select('*')
          .in(
            'receipt_id',
            receipts.map((r) => r.id)
          )

        if (paymentsError) {
          throw paymentsError
        }

        // 集計を計算
        const summaryData = members.map((member) => {
          const userReceipts = receipts.filter(
            (r) => r.created_by === member.user_id
          )
          const userPayments = payments.filter(
            (p) => p.user_id === member.user_id && p.status === 'confirmed'
          )

          const totalPaid = userPayments.reduce((sum, payment) => {
            const receipt = receipts.find((r) => r.id === payment.receipt_id)
            return sum + (receipt?.total_amount || 0) / (receipt?.people || 1)
          }, 0)

          const totalOwed = userReceipts.reduce((sum, receipt) => {
            return sum + (receipt.total_amount || 0) / (receipt.people || 1)
          }, 0)

          return {
            user_id: member.user_id,
            email: member.user.email,
            total_paid: totalPaid,
            total_owed: totalOwed,
            balance: totalPaid - totalOwed,
          }
        })

        setSummary(summaryData)
      } catch (err) {
        setError('支払い集計の取得に失敗しました。')
      } finally {
        setIsLoading(false)
      }
    }

    fetchSummary()

    // リアルタイム更新の購読
    const channel = supabase
      .channel('payment_summary_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'receipt_payments',
        },
        () => {
          fetchSummary()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [groupId, supabase])

  if (isLoading) {
    return (
      <div className="mt-8">
        <div className="flex justify-center">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary-600 border-t-transparent"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="mt-8">
      <h3 className="text-lg font-medium leading-6 text-gray-900">
        支払い集計
      </h3>
      <div className="mt-4">
        <div className="flow-root">
          <div className="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
            <div className="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8">
              <table className="min-w-full divide-y divide-gray-300">
                <thead>
                  <tr>
                    <th
                      scope="col"
                      className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-0"
                    >
                      メンバー
                    </th>
                    <th
                      scope="col"
                      className="px-3 py-3.5 text-right text-sm font-semibold text-gray-900"
                    >
                      支払い済み
                    </th>
                    <th
                      scope="col"
                      className="px-3 py-3.5 text-right text-sm font-semibold text-gray-900"
                    >
                      支払い予定
                    </th>
                    <th
                      scope="col"
                      className="px-3 py-3.5 text-right text-sm font-semibold text-gray-900"
                    >
                      差額
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {summary.map((item) => (
                    <tr key={item.user_id}>
                      <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-0">
                        {item.email}
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-right text-sm text-gray-500">
                        ¥{Math.round(item.total_paid).toLocaleString()}
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-right text-sm text-gray-500">
                        ¥{Math.round(item.total_owed).toLocaleString()}
                      </td>
                      <td
                        className={`whitespace-nowrap px-3 py-4 text-right text-sm font-medium ${
                          item.balance > 0
                            ? 'text-green-600'
                            : item.balance < 0
                            ? 'text-red-600'
                            : 'text-gray-900'
                        }`}
                      >
                        ¥{Math.round(item.balance).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {error && (
        <div className="mt-4 rounded-md bg-red-50 p-4">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}
    </div>
  )
} 