'use client'

import { useState } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import type { Database } from '@/lib/supabase'

interface PaymentStatusProps {
  receipt: Database['public']['Tables']['receipts']['Row']
  groupId: string
  isOwner: boolean
}

type PaymentStatus = 'pending' | 'paid' | 'confirmed'

export default function PaymentStatus({
  receipt,
  groupId,
  isOwner,
}: PaymentStatusProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClientComponentClient<Database>()

  const handleStatusChange = async (userId: string, newStatus: PaymentStatus) => {
    try {
      setIsLoading(true)
      setError(null)

      const { error: updateError } = await supabase
        .from('receipt_payments')
        .upsert({
          receipt_id: receipt.id,
          user_id: userId,
          status: newStatus,
          updated_at: new Date().toISOString(),
        })

      if (updateError) {
        throw updateError
      }
    } catch (err) {
      setError('支払い状況の更新に失敗しました。もう一度お試しください。')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="mt-8">
      <h3 className="text-lg font-medium leading-6 text-gray-900">
        支払い状況
      </h3>
      <div className="mt-4">
        <div className="flow-root">
          <ul role="list" className="-my-5 divide-y divide-gray-200">
            {Array.from({ length: receipt.people || 1 }).map((_, index) => (
              <li key={index} className="py-4">
                <div className="flex items-center space-x-4">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-gray-900">
                      人{index + 1}
                    </p>
                    <p className="truncate text-sm text-gray-500">
                      ¥{Math.ceil((receipt.total_amount || 0) / (receipt.people || 1)).toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <select
                      className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                      onChange={(e) =>
                        handleStatusChange(
                          `user_${index}`,
                          e.target.value as PaymentStatus
                        )
                      }
                      disabled={isLoading}
                    >
                      <option value="pending">未払い</option>
                      <option value="paid">支払い済み</option>
                      <option value="confirmed">確認済み</option>
                    </select>
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