'use client'

import { useState, useEffect } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import type { Database } from '@/lib/supabase'

interface PaymentHistoryProps {
  receipt: Database['public']['Tables']['receipts']['Row']
}

type PaymentHistory = {
  id: string
  receipt_id: string
  user_id: string
  status: 'pending' | 'paid' | 'confirmed'
  updated_at: string
  user: {
    email: string
  }
}

export default function PaymentHistory({ receipt }: PaymentHistoryProps) {
  const [history, setHistory] = useState<PaymentHistory[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClientComponentClient<Database>()

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const { data, error: fetchError } = await supabase
          .from('receipt_payments')
          .select(`
            *,
            user:users(email)
          `)
          .eq('receipt_id', receipt.id)
          .order('updated_at', { ascending: false })

        if (fetchError) {
          throw fetchError
        }

        setHistory(data || [])
      } catch (err) {
        setError('支払い履歴の取得に失敗しました。')
      } finally {
        setIsLoading(false)
      }
    }

    fetchHistory()

    // リアルタイム更新の購読
    const channel = supabase
      .channel('payment_history_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'receipt_payments',
          filter: `receipt_id=eq.${receipt.id}`,
        },
        () => {
          fetchHistory()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [receipt.id, supabase])

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'pending':
        return '未払い'
      case 'paid':
        return '支払い済み'
      case 'confirmed':
        return '確認済み'
      default:
        return status
    }
  }

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
        支払い履歴
      </h3>
      <div className="mt-4">
        <div className="flow-root">
          <ul role="list" className="-my-5 divide-y divide-gray-200">
            {history.map((item) => (
              <li key={item.id} className="py-4">
                <div className="flex items-center space-x-4">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-gray-900">
                      {item.user.email}
                    </p>
                    <p className="truncate text-sm text-gray-500">
                      {new Date(item.updated_at).toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        item.status === 'confirmed'
                          ? 'bg-green-100 text-green-800'
                          : item.status === 'paid'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}
                    >
                      {getStatusLabel(item.status)}
                    </span>
                  </div>
                </div>
              </li>
            ))}
          </ul>
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