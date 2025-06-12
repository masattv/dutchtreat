'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import type { Database } from '@/lib/supabase'

type Receipt = Database['public']['Tables']['receipts']['Row']

interface ReceiptListProps {
  groupId: string
}

export default function ReceiptList({ groupId }: ReceiptListProps) {
  const [receipts, setReceipts] = useState<Receipt[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const supabase = createClientComponentClient<Database>()

  useEffect(() => {
    const fetchReceipts = async () => {
      try {
        const { data, error } = await supabase
          .from('receipts')
          .select('*')
          .eq('group_id', groupId)
          .order('created_at', { ascending: false })

        if (error) {
          throw error
        }

        setReceipts(data || [])
      } catch (error) {
        console.error('Error fetching receipts:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchReceipts()

    const channel = supabase
      .channel('receipts_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'receipts',
          filter: `group_id=eq.${groupId}`,
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setReceipts((current) => [payload.new as Receipt, ...current])
          } else if (payload.eventType === 'DELETE') {
            setReceipts((current) =>
              current.filter((receipt) => receipt.id !== payload.old.id)
            )
          } else if (payload.eventType === 'UPDATE') {
            setReceipts((current) =>
              current.map((receipt) =>
                receipt.id === payload.new.id ? (payload.new as Receipt) : receipt
              )
            )
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [supabase, groupId])

  if (isLoading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
        <p className="mt-4 text-sm text-gray-500">読み込み中...</p>
      </div>
    )
  }

  if (receipts.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-sm text-gray-500">
          レシートがありません。新しいレシートを追加しましょう。
        </p>
      </div>
    )
  }

  return (
    <div className="mt-8 flow-root">
      <div className="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
        <div className="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8">
          <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 sm:rounded-lg">
            <table className="min-w-full divide-y divide-gray-300">
              <thead className="bg-gray-50">
                <tr>
                  <th
                    scope="col"
                    className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6"
                  >
                    レシート
                  </th>
                  <th
                    scope="col"
                    className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900"
                  >
                    金額
                  </th>
                  <th
                    scope="col"
                    className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900"
                  >
                    作成日
                  </th>
                  <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-6">
                    <span className="sr-only">編集</span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {receipts.map((receipt) => (
                  <tr key={receipt.id}>
                    <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">
                      <Link
                        href={`/receipts/${receipt.id}`}
                        className="text-primary-600 hover:text-primary-500"
                      >
                        {receipt.ocr_text || '未処理'}
                      </Link>
                    </td>
                    <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                      {receipt.total_amount
                        ? `¥${receipt.total_amount.toLocaleString()}`
                        : '-'}
                    </td>
                    <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                      {new Date(receipt.created_at).toLocaleDateString('ja-JP')}
                    </td>
                    <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                      <Link
                        href={`/receipts/${receipt.id}/edit`}
                        className="text-primary-600 hover:text-primary-500"
                      >
                        編集
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
} 