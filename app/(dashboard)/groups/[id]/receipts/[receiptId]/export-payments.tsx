'use client'

import { useState } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { Download } from 'lucide-react'

type Payment = {
  id: string
  user_id: string
  amount: number
  status: 'pending' | 'paid'
  created_at: string
  user: {
    email: string
  }
}

type ExportPaymentsProps = {
  receiptId: string
}

export function ExportPayments({ receiptId }: ExportPaymentsProps) {
  const [isLoading, setIsLoading] = useState(false)
  const supabase = createClientComponentClient()

  const handleExport = async () => {
    try {
      setIsLoading(true)

      // 支払い履歴を取得
      const { data: payments, error } = await supabase
        .from('payments')
        .select(`
          id,
          user_id,
          amount,
          status,
          created_at,
          user:users (
            email
          )
        `)
        .eq('receipt_id', receiptId)
        .order('created_at', { ascending: false })

      if (error) throw error

      // CSVデータを生成
      const headers = ['ユーザー', '金額', 'ステータス', '日時']
      const rows = payments.map((payment: Payment) => [
        payment.user.email,
        payment.amount,
        payment.status === 'paid' ? '支払済' : '未払い',
        new Date(payment.created_at).toLocaleString('ja-JP'),
      ])

      const csvContent = [
        headers.join(','),
        ...rows.map((row) => row.join(',')),
      ].join('\n')

      // CSVファイルをダウンロード
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `payments-${receiptId}.csv`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Export error:', error)
      alert('エクスポートに失敗しました')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <button
      onClick={handleExport}
      disabled={isLoading}
      className="inline-flex items-center gap-2 rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-500 disabled:opacity-50"
    >
      <Download className="h-4 w-4" />
      {isLoading ? 'エクスポート中...' : 'CSVエクスポート'}
    </button>
  )
} 