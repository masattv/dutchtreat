'use client'

import { useState, useEffect } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'
import { Download, Calendar, BarChart2, PieChart } from 'lucide-react'

type PaymentAnalyticsProps = {
  groupId: string
}

type PaymentData = {
  id: string
  amount: number
  status: 'pending' | 'paid'
  created_at: string
  user: {
    id: string
    name: string
  }
}

type MonthlyData = {
  month: string
  total: number
  paid: number
  pending: number
}

type DateRange = {
  start: string
  end: string
}

type ChartType = 'bar' | 'pie'

export function PaymentAnalytics({ groupId }: PaymentAnalyticsProps) {
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [userData, setUserData] = useState<{ [key: string]: { total: number; paid: number; pending: number } }>({})
  const [monthlyData, setMonthlyData] = useState<MonthlyData[]>([])
  const [dateRange, setDateRange] = useState<DateRange>({
    start: new Date(new Date().getFullYear(), new Date().getMonth() - 5, 1).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0],
  })
  const [isExporting, setIsExporting] = useState(false)
  const [chartType, setChartType] = useState<ChartType>('bar')
  const [showLegend, setShowLegend] = useState(true)
  const [showGrid, setShowGrid] = useState(true)
  const [showTooltip, setShowTooltip] = useState(true)
  const [chartHeight, setChartHeight] = useState(400)
  const [barSize, setBarSize] = useState(30)
  const [animationDuration, setAnimationDuration] = useState(1500)

  const supabase = createClientComponentClient()

  useEffect(() => {
    fetchAnalytics()
  }, [groupId, dateRange])

  const fetchAnalytics = async () => {
    try {
      setIsLoading(true)
      setError(null)

      const { data: payments, error } = await supabase
        .from('payments')
        .select(`
          id,
          amount,
          status,
          created_at,
          user:users (
            id,
            name
          )
        `)
        .eq('group_id', groupId)
        .gte('created_at', dateRange.start)
        .lte('created_at', dateRange.end)

      if (error) throw error

      // ユーザーごとの集計
      const userTotals: { [key: string]: { total: number; paid: number; pending: number } } = {}
      payments.forEach((payment: PaymentData) => {
        const userId = payment.user.id
        if (!userTotals[userId]) {
          userTotals[userId] = { total: 0, paid: 0, pending: 0 }
        }
        userTotals[userId].total += payment.amount
        if (payment.status === 'paid') {
          userTotals[userId].paid += payment.amount
        } else {
          userTotals[userId].pending += payment.amount
        }
      })

      // 月ごとの集計
      const monthlyTotals: { [key: string]: { total: number; paid: number; pending: number } } = {}
      payments.forEach((payment: PaymentData) => {
        const month = new Date(payment.created_at).toLocaleString('ja-JP', { year: 'numeric', month: 'long' })
        if (!monthlyTotals[month]) {
          monthlyTotals[month] = { total: 0, paid: 0, pending: 0 }
        }
        monthlyTotals[month].total += payment.amount
        if (payment.status === 'paid') {
          monthlyTotals[month].paid += payment.amount
        } else {
          monthlyTotals[month].pending += payment.amount
        }
      })

      setUserData(userTotals)
      setMonthlyData(
        Object.entries(monthlyTotals).map(([month, data]) => ({
          month,
          ...data,
        }))
      )
    } catch (error) {
      console.error('Error fetching analytics:', error)
      setError('データの取得に失敗しました')
    } finally {
      setIsLoading(false)
    }
  }

  const handleExport = async () => {
    try {
      setIsExporting(true)
      const csvContent = [
        ['ユーザー', '合計金額', '支払済み', '未払い'],
        ...Object.entries(userData).map(([userId, data]) => [
          userId,
          data.total.toString(),
          data.paid.toString(),
          data.pending.toString(),
        ]),
      ].map(row => row.join(',')).join('\n')

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
      const link = document.createElement('a')
      link.href = URL.createObjectURL(blob)
      link.download = `payment-analytics-${new Date().toISOString().split('T')[0]}.csv`
      link.click()
    } catch (error) {
      console.error('Export error:', error)
      setError('エクスポートに失敗しました')
    } finally {
      setIsExporting(false)
    }
  }

  if (isLoading) {
    return <div>読み込み中...</div>
  }

  if (error) {
    return <div className="text-red-600">{error}</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-medium">支払い分析</h2>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 rounded-lg border border-gray-200 p-2">
            <button
              onClick={() => setChartType('bar')}
              className={`rounded-md px-3 py-1 text-sm ${
                chartType === 'bar'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              <BarChart2 className="h-4 w-4" />
            </button>
            <button
              onClick={() => setChartType('pie')}
              className={`rounded-md px-3 py-1 text-sm ${
                chartType === 'pie'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              <PieChart className="h-4 w-4" />
            </button>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="date"
              value={dateRange.start}
              onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
              className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
            <span className="text-gray-500">〜</span>
            <input
              type="date"
              value={dateRange.end}
              onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
              className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
          <button
            onClick={handleExport}
            disabled={isExporting}
            className="inline-flex items-center gap-1 rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-500 disabled:opacity-50"
          >
            <Download className="h-4 w-4" />
            {isExporting ? 'エクスポート中...' : 'エクスポート'}
          </button>
        </div>
      </div>

      <div className="rounded-lg border border-gray-200 bg-white p-4">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-medium">グラフ設定</h3>
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={showLegend}
                onChange={(e) => setShowLegend(e.target.checked)}
                className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-600">凡例を表示</span>
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={showGrid}
                onChange={(e) => setShowGrid(e.target.checked)}
                className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-600">グリッドを表示</span>
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={showTooltip}
                onChange={(e) => setShowTooltip(e.target.checked)}
                className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-600">ツールチップを表示</span>
            </label>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">グラフの高さ</label>
            <input
              type="range"
              min="200"
              max="800"
              step="50"
              value={chartHeight}
              onChange={(e) => setChartHeight(Number(e.target.value))}
              className="w-full"
            />
            <span className="text-sm text-gray-500">{chartHeight}px</span>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">バーの太さ</label>
            <input
              type="range"
              min="10"
              max="50"
              step="5"
              value={barSize}
              onChange={(e) => setBarSize(Number(e.target.value))}
              className="w-full"
            />
            <span className="text-sm text-gray-500">{barSize}px</span>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">アニメーション時間</label>
            <input
              type="range"
              min="0"
              max="3000"
              step="500"
              value={animationDuration}
              onChange={(e) => setAnimationDuration(Number(e.target.value))}
              className="w-full"
            />
            <span className="text-sm text-gray-500">{animationDuration}ms</span>
          </div>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="rounded-lg border border-gray-200 bg-white p-4">
          <h3 className="mb-4 text-lg font-medium">ユーザー別支払い状況</h3>
          <div style={{ height: chartHeight }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={Object.entries(userData).map(([userId, data]) => ({
                  name: userId,
                  total: data.total,
                  paid: data.paid,
                  pending: data.pending,
                }))}
                margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
              >
                {showGrid && <CartesianGrid strokeDasharray="3 3" />}
                <XAxis dataKey="name" />
                <YAxis />
                {showTooltip && <Tooltip />}
                {showLegend && <Legend />}
                <Bar
                  dataKey="total"
                  name="合計"
                  fill="#3B82F6"
                  barSize={barSize}
                  animationDuration={animationDuration}
                />
                <Bar
                  dataKey="paid"
                  name="支払済み"
                  fill="#10B981"
                  barSize={barSize}
                  animationDuration={animationDuration}
                />
                <Bar
                  dataKey="pending"
                  name="未払い"
                  fill="#EF4444"
                  barSize={barSize}
                  animationDuration={animationDuration}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-lg border border-gray-200 bg-white p-4">
          <h3 className="mb-4 text-lg font-medium">月別支払い状況</h3>
          <div style={{ height: chartHeight }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={monthlyData}
                margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
              >
                {showGrid && <CartesianGrid strokeDasharray="3 3" />}
                <XAxis dataKey="month" />
                <YAxis />
                {showTooltip && <Tooltip />}
                {showLegend && <Legend />}
                <Bar
                  dataKey="total"
                  name="合計"
                  fill="#3B82F6"
                  barSize={barSize}
                  animationDuration={animationDuration}
                />
                <Bar
                  dataKey="paid"
                  name="支払済み"
                  fill="#10B981"
                  barSize={barSize}
                  animationDuration={animationDuration}
                />
                <Bar
                  dataKey="pending"
                  name="未払い"
                  fill="#EF4444"
                  barSize={barSize}
                  animationDuration={animationDuration}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="rounded-lg border border-gray-200 bg-white p-4">
        <h3 className="mb-4 text-lg font-medium">支払い詳細</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500"
                >
                  ユーザー
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500"
                >
                  合計金額
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500"
                >
                  支払済み
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500"
                >
                  未払い
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {Object.entries(userData).map(([userId, data]) => (
                <tr key={userId}>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900">
                    {userId}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900">
                    ¥{data.total.toLocaleString()}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900">
                    ¥{data.paid.toLocaleString()}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900">
                    ¥{data.pending.toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
} 