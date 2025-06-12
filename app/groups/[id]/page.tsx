'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

type Group = {
  id: string
  title: string
  created_at: string
}

type Payment = {
  id: string
  title: string
  amount: number
  paid_by: string
  created_at: string
}

type Participant = {
  id: string
  name: string
  created_at: string
}

type Settlement = {
  id?: string
  from_participant: string
  to_participant: string
  amount: number
  created_at?: string
  status: 'pending' | 'completed'
}

export default function GroupPage() {
  const params = useParams()
  const router = useRouter()
  const [group, setGroup] = useState<Group | null>(null)
  const [payments, setPayments] = useState<Payment[]>([])
  const [participants, setParticipants] = useState<Participant[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [newPayment, setNewPayment] = useState({
    title: '',
    amount: '',
    paid_by: '',
  })
  const [newParticipant, setNewParticipant] = useState('')
  const [editingPayment, setEditingPayment] = useState<Payment | null>(null)
  const [settlements, setSettlements] = useState<Settlement[]>([])
  const [isEditingGroup, setIsEditingGroup] = useState(false)
  const [groupTitle, setGroupTitle] = useState('')
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null)
  const [toast, setToast] = useState('')

  useEffect(() => {
    fetchGroupData()
  }, [params.id])

  const fetchGroupData = async () => {
    try {
      const { data: groupData, error: groupError } = await supabase
        .from('groups')
        .select('*')
        .eq('id', params.id)
        .single()
      if (groupError) {
        console.error('groupError:', groupError)
        alert('グループ取得失敗: ' + (groupError.message || JSON.stringify(groupError)))
        throw groupError
      }
      setGroup(groupData)
      setGroupTitle(groupData.title)

      const { data: paymentsData, error: paymentsError } = await supabase
        .from('payments')
        .select('*')
        .eq('group_id', params.id)
        .order('created_at', { ascending: false })
      if (paymentsError) {
        console.error('paymentsError:', paymentsError)
        alert('支払い取得失敗: ' + (paymentsError.message || JSON.stringify(paymentsError)))
        throw paymentsError
      }
      setPayments(paymentsData)

      const { data: participantsData, error: participantsError } = await supabase
        .from('group_participants')
        .select('*')
        .eq('group_id', params.id)
        .order('created_at', { ascending: true })
      if (participantsError) {
        console.error('participantsError:', participantsError)
        alert('参加者取得失敗: ' + (participantsError.message || JSON.stringify(participantsError)))
        throw participantsError
      }
      setParticipants(participantsData)

      const { data: settlementsData, error: settlementsError } = await supabase
        .from('settlements')
        .select('*')
        .eq('group_id', params.id)
        .order('created_at', { ascending: false })
      if (settlementsError) {
        console.error('settlementsError:', settlementsError)
        alert('精算履歴取得失敗: ' + (settlementsError.message || JSON.stringify(settlementsError)))
        throw settlementsError
      }

      if (settlementsData && settlementsData.length > 0) {
        setSettlements(settlementsData)
      } else {
        calculateSettlements(paymentsData, participantsData)
      }
    } catch (error) {
      console.error('Error:', error)
      alert('データの取得に失敗しました\n' + (error?.message || JSON.stringify(error)))
    } finally {
      setIsLoading(false)
    }
  }

  const calculateSettlements = async (payments: Payment[], participants: Participant[]) => {
    // 各参加者の支払い合計を計算
    const paymentTotals = new Map<string, number>()
    participants.forEach(participant => {
      paymentTotals.set(participant.name, 0)
    })

    payments.forEach(payment => {
      const currentTotal = paymentTotals.get(payment.paid_by) || 0
      paymentTotals.set(payment.paid_by, currentTotal + payment.amount)
    })

    // 一人あたりの支払い額を計算
    const totalAmount = payments.reduce((sum, payment) => sum + payment.amount, 0)
    const perPersonAmount = totalAmount / participants.length

    // 精算額を計算
    const balances = new Map<string, number>()
    participants.forEach(participant => {
      const paid = paymentTotals.get(participant.name) || 0
      balances.set(participant.name, paid - perPersonAmount)
    })

    // 精算リストを作成
    const newSettlements: Settlement[] = []
    const debtors = Array.from(balances.entries())
      .filter(([_, balance]) => balance < 0)
      .sort((a, b) => a[1] - b[1])
    const creditors = Array.from(balances.entries())
      .filter(([_, balance]) => balance > 0)
      .sort((a, b) => b[1] - a[1])

    debtors.forEach(([debtor, debt]) => {
      let remainingDebt = Math.abs(debt)
      creditors.forEach(([creditor, credit]) => {
        if (remainingDebt > 0 && credit > 0) {
          const amount = Math.min(remainingDebt, credit)
          newSettlements.push({
            from_participant: debtor,
            to_participant: creditor,
            amount: Math.round(amount),
            status: 'pending'
          })
          remainingDebt -= amount
        }
      })
    })

    setSettlements(newSettlements)

    // 精算リストをデータベースに保存
    try {
      const { error } = await supabase.from('settlements').insert(
        newSettlements.map(settlement => ({
          ...settlement,
          group_id: params.id
        }))
      )
      if (error) throw error
    } catch (error) {
      console.error('Error saving settlements:', error)
    }
  }

  const handleUpdateGroup = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const { error } = await supabase
        .from('groups')
        .update({ title: groupTitle })
        .eq('id', params.id)

      if (error) throw error

      setIsEditingGroup(false)
      fetchGroupData()
    } catch (error) {
      console.error('Error:', error)
      alert('グループの更新に失敗しました')
    }
  }

  const handleDeleteGroup = async () => {
    if (!confirm('このグループを削除してもよろしいですか？')) return

    try {
      const { error } = await supabase
        .from('groups')
        .delete()
        .eq('id', params.id)

      if (error) throw error

      router.push('/')
    } catch (error) {
      console.error('Error:', error)
      alert('グループの削除に失敗しました')
    }
  }

  const handleUpdateSettlementStatus = async (settlementId: string, status: 'completed' | 'pending') => {
    try {
      const { error } = await supabase
        .from('settlements')
        .update({ status })
        .eq('id', settlementId)

      if (error) throw error

      fetchGroupData()
    } catch (error) {
      console.error('Error:', error)
      alert('精算状態の更新に失敗しました')
    }
  }

  const handleAddPayment = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const { error } = await supabase.from('payments').insert([
        {
          group_id: params.id,
          title: newPayment.title,
          amount: parseFloat(newPayment.amount),
          paid_by: newPayment.paid_by,
        },
      ])

      if (error) throw error

      setNewPayment({ title: '', amount: '', paid_by: '' })
      fetchGroupData()
    } catch (error) {
      console.error('Error:', error)
      alert('支払いの追加に失敗しました')
    }
  }

  const handleEditPayment = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingPayment) return

    try {
      const { error } = await supabase
        .from('payments')
        .update({
          title: newPayment.title,
          amount: parseFloat(newPayment.amount),
          paid_by: newPayment.paid_by,
        })
        .eq('id', editingPayment.id)

      if (error) throw error

      setEditingPayment(null)
      setNewPayment({ title: '', amount: '', paid_by: '' })
      fetchGroupData()
    } catch (error) {
      console.error('Error:', error)
      alert('支払いの編集に失敗しました')
    }
  }

  const handleDeletePayment = async (paymentId: string) => {
    if (!confirm('この支払いを削除してもよろしいですか？')) return

    try {
      const { error } = await supabase
        .from('payments')
        .delete()
        .eq('id', paymentId)

      if (error) throw error

      fetchGroupData()
    } catch (error) {
      console.error('Error:', error)
      alert('支払いの削除に失敗しました')
    }
  }

  const handleAddParticipant = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newParticipant.trim()) return

    try {
      const { error } = await supabase.from('group_participants').insert([
        {
          group_id: params.id,
          name: newParticipant.trim(),
        },
      ])

      if (error) throw error

      setNewParticipant('')
      fetchGroupData()
    } catch (error) {
      console.error('Error:', error)
      alert('参加者の追加に失敗しました')
    }
  }

  const handleRemoveParticipant = async (participantId: string) => {
    try {
      const { error } = await supabase
        .from('group_participants')
        .delete()
        .eq('id', participantId)

      if (error) throw error

      fetchGroupData()
    } catch (error) {
      console.error('Error:', error)
      alert('参加者の削除に失敗しました')
    }
  }

  // クリップボードにURLをコピー
  const handleCopyUrl = () => {
    const url = window.location.href
    navigator.clipboard.writeText(url)
      .then(() => {
        setToast('URLをコピーしました！')
        setTimeout(() => setToast(''), 2000)
      })
      .catch(() => {
        setToast('コピーに失敗しました')
        setTimeout(() => setToast(''), 2000)
      })
  }

  if (isLoading) {
    return <div className="p-4">読み込み中...</div>
  }

  if (!group) {
    return <div className="p-4">グループが見つかりません</div>
  }

  return (
    <div className="max-w-3xl mx-auto px-2 sm:px-4 py-8">
      {/* トースト通知 */}
      {toast && (
        <div className="fixed top-4 right-4 z-50 bg-green-600 text-white px-4 py-2 rounded-lg shadow-lg animate-fade-in">
          {toast}
        </div>
      )}

      {/* ヘッダー */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-4">
        <div className="flex-1 min-w-0">
          {isEditingGroup ? (
            <form onSubmit={handleUpdateGroup} className="flex gap-2 items-center">
              <input
                type="text"
                value={groupTitle}
                onChange={(e) => setGroupTitle(e.target.value)}
                className="text-2xl font-bold border-2 border-gray-200 rounded-lg px-3 py-2 focus:border-indigo-500 transition w-full"
                required
              />
              <button type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg px-4 py-2 transition">保存</button>
              <button type="button" onClick={() => { setIsEditingGroup(false); setGroupTitle(group.title) }} className="bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg px-4 py-2 transition">キャンセル</button>
            </form>
          ) : (
            <h1 className="text-3xl font-extrabold text-gray-900 truncate">{group.title}</h1>
          )}
        </div>
        <div className="flex gap-2 flex-shrink-0">
          <button onClick={handleCopyUrl} className="bg-white border border-gray-300 hover:bg-gray-100 text-gray-700 rounded-lg px-4 py-2 shadow-sm transition">URLコピー</button>
          <button onClick={() => setIsEditingGroup(true)} className="bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg px-4 py-2 transition">編集</button>
          <button onClick={handleDeleteGroup} className="bg-red-50 hover:bg-red-100 text-red-600 rounded-lg px-4 py-2 transition">削除</button>
        </div>
      </div>

      {/* 参加者管理・支払い追加 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {/* 参加者管理カード */}
        <div className="bg-white rounded-xl shadow p-6">
          <h2 className="text-lg font-semibold mb-4 text-gray-900">参加者管理</h2>
          <form onSubmit={handleAddParticipant} className="flex gap-2 mb-4">
            <input
              type="text"
              value={newParticipant}
              onChange={(e) => setNewParticipant(e.target.value)}
              className="flex-1 border-2 border-gray-200 rounded-lg px-3 py-2 focus:border-indigo-500 transition"
              placeholder="参加者名"
              required
            />
            <button type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg px-4 py-2 transition">追加</button>
          </form>
          <div className="space-y-2">
            {participants.map((participant) => (
              <div key={participant.id} className="flex justify-between items-center bg-gray-50 p-3 rounded-lg border border-gray-100">
                <span className="text-gray-800">{participant.name}</span>
                <button onClick={() => handleRemoveParticipant(participant.id)} className="text-red-500 hover:text-red-700 text-sm">削除</button>
              </div>
            ))}
          </div>
        </div>
        {/* 支払い追加カード */}
        <div className="bg-white rounded-xl shadow p-6">
          <h2 className="text-lg font-semibold mb-4 text-gray-900">{editingPayment ? '支払いを編集' : '新しい支払いを追加'}</h2>
          <form onSubmit={editingPayment ? handleEditPayment : handleAddPayment} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">タイトル</label>
              <input
                type="text"
                value={newPayment.title}
                onChange={(e) => setNewPayment({ ...newPayment, title: e.target.value })}
                className="w-full border-2 border-gray-200 rounded-lg px-3 py-2 focus:border-indigo-500 transition"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">金額</label>
              <input
                type="number"
                value={newPayment.amount}
                onChange={(e) => setNewPayment({ ...newPayment, amount: e.target.value })}
                className="w-full border-2 border-gray-200 rounded-lg px-3 py-2 focus:border-indigo-500 transition"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">支払った人</label>
              <select
                value={newPayment.paid_by}
                onChange={(e) => setNewPayment({ ...newPayment, paid_by: e.target.value })}
                className="w-full border-2 border-gray-200 rounded-lg px-3 py-2 focus:border-indigo-500 transition"
                required
              >
                <option value="">選択してください</option>
                {participants.map((participant) => (
                  <option key={participant.id} value={participant.name}>{participant.name}</option>
                ))}
              </select>
            </div>
            <div className="flex gap-2">
              <button type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg px-4 py-2 transition">{editingPayment ? '更新' : '追加'}</button>
              {editingPayment && (
                <button type="button" onClick={() => { setEditingPayment(null); setNewPayment({ title: '', amount: '', paid_by: '' }) }} className="bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg px-4 py-2 transition">キャンセル</button>
              )}
            </div>
          </form>
        </div>
      </div>

      {/* 支払い履歴カード */}
      <div className="bg-white rounded-xl shadow p-6 mb-6">
        <h2 className="text-lg font-semibold mb-4 text-gray-900">支払い履歴</h2>
        <div className="space-y-4">
          {payments.map((payment) => (
            <div key={payment.id} className="border rounded-lg p-4 bg-gray-50 shadow-sm cursor-pointer hover:bg-indigo-50 transition" onClick={() => setSelectedPayment(payment)}>
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-medium text-gray-900">{payment.title}</h3>
                  <p className="text-xs text-gray-500">{new Date(payment.created_at).toLocaleString()}</p>
                </div>
                <div className="text-right">
                  <p className="font-medium text-indigo-700">¥{payment.amount.toLocaleString()}</p>
                  <p className="text-xs text-gray-500">支払い: {payment.paid_by}</p>
                </div>
                <div className="flex gap-2">
                  <button onClick={(e) => { e.stopPropagation(); setEditingPayment(payment); setNewPayment({ title: payment.title, amount: payment.amount.toString(), paid_by: payment.paid_by }) }} className="text-indigo-500 hover:text-indigo-700 text-sm">編集</button>
                  <button onClick={(e) => { e.stopPropagation(); handleDeletePayment(payment.id) }} className="text-red-500 hover:text-red-700 text-sm">削除</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 支払い詳細モーダル */}
      {selectedPayment && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 max-w-lg w-full shadow-xl relative">
            <button onClick={() => setSelectedPayment(null)} className="absolute top-2 right-2 text-gray-400 hover:text-gray-700 text-2xl">×</button>
            <h3 className="text-xl font-bold mb-4">{selectedPayment.title}</h3>
            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-500">金額</p>
                <p className="text-lg text-indigo-700">¥{selectedPayment.amount.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">支払った人</p>
                <p className="text-lg">{selectedPayment.paid_by}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">日時</p>
                <p className="text-lg">{new Date(selectedPayment.created_at).toLocaleString()}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 精算リストカード */}
      <div className="bg-white rounded-xl shadow p-6">
        <h2 className="text-lg font-semibold mb-4 text-gray-900">精算リスト</h2>
        <div className="space-y-4">
          {settlements.map((settlement) => (
            <div key={settlement.id} className="border rounded-lg p-4 bg-gray-50 shadow-sm flex justify-between items-center">
              <div>
                <p className="font-medium text-gray-900">{settlement.from_participant} → {settlement.to_participant}</p>
                <p className="text-xs text-gray-500">{settlement.created_at && new Date(settlement.created_at).toLocaleString()}</p>
              </div>
              <div className="text-right">
                <p className="font-medium text-indigo-700">¥{settlement.amount.toLocaleString()}</p>
                <select value={settlement.status} onChange={(e) => handleUpdateSettlementStatus(settlement.id!, e.target.value as 'completed' | 'pending')} className="text-sm border rounded px-2 py-1 mt-2">
                  <option value="pending">未精算</option>
                  <option value="completed">精算済み</option>
                </select>
              </div>
            </div>
          ))}
          {settlements.length === 0 && (
            <p className="text-gray-500 text-center">精算は必要ありません</p>
          )}
        </div>
      </div>
    </div>
  )
} 