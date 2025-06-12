'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@supabase/supabase-js'
import { MoonIcon, SunIcon } from '@heroicons/react/24/solid'
import { useDarkMode } from '../../components/DarkModeProvider'

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
  targets?: string[]
}

type Participant = {
  id: string
  name: string
  created_at: string
}

interface Settlement {
  id?: string;
  from_participant: string
  to_participant: string
  amount: number
  status?: 'pending' | 'completed'
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
  const [editingPayment, setEditingPayment] = useState<Payment | null>(null)
  const [settlements, setSettlements] = useState<Settlement[]>([])
  const [isEditingGroup, setIsEditingGroup] = useState(false)
  const [groupTitle, setGroupTitle] = useState('')
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null)
  const [toast, setToast] = useState('')
  const [nlInput, setNlInput] = useState('')
  const [nlLoading, setNlLoading] = useState(false)
  const [nlError, setNlError] = useState('')
  const [selectedTargets, setSelectedTargets] = useState<string[]>([])

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
        calculateSettlements()
      }
    } catch (error) {
      console.error('Error:', error)
      alert('データの取得に失敗しました\n' + ((error as any)?.message || JSON.stringify(error)))
    } finally {
      setIsLoading(false)
      setTimeout(() => {
        setSettlements(prev => (payments.length === 0 ? [] : (prev && prev.length > 0 ? prev : calculateSettlements())));
      }, 0);
    }
  }

  const calculateSettlements = () => {
    // 支払い履歴から最新の情報を取得
    const latestPayments = payments.map(payment => ({
      ...payment,
      targets: payment.targets || []
    }))

    // 参加者ごとの支払い合計を計算
    const balances = new Map<string, number>()
    participants.forEach(p => balances.set(p.name, 0))

    latestPayments.forEach(payment => {
      // 支払った人の残高を増やす
      const currentBalance = balances.get(payment.paid_by) || 0
      balances.set(payment.paid_by, currentBalance + payment.amount)

      // 支払った人とtargetsを合成し、重複なしの全員で割る
      const allTargets = Array.from(new Set([...(payment.targets || []), payment.paid_by]))
      if (allTargets.length === 0) return;
      const perPerson = payment.amount / allTargets.length
      allTargets.forEach(target => {
        const currentBalance = balances.get(target) || 0
        balances.set(target, currentBalance - perPerson)
      })
    })

    // 精算リストの作成
    const settlements: Settlement[] = []
    const positiveBalances = Array.from(balances.entries())
      .filter(([_, balance]) => balance > 0)
      .sort((a, b) => b[1] - a[1])
    const negativeBalances = Array.from(balances.entries())
      .filter(([_, balance]) => balance < 0)
      .sort((a, b) => a[1] - b[1])

    positiveBalances.forEach(([payer, positiveBalance]) => {
      let remaining = positiveBalance
      negativeBalances.forEach(([receiver, negativeBalance]) => {
        if (remaining <= 0 || negativeBalance >= 0) return

        const amount = Math.min(remaining, -negativeBalance)
        if (amount > 0) {
          settlements.push({
            from_participant: receiver,
            to_participant: payer,
            amount: Math.round(amount),
            status: 'pending'
          })
          remaining -= amount
          negativeBalances[negativeBalances.findIndex(([name]) => name === receiver)][1] += amount
        }
      })
    })

    return settlements
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

  // settlementsをリセット＆再計算・再insertする関数
  const resetAndRecreateSettlements = async () => {
    // 既存のsettlementsを全削除
    await supabase.from('settlements').delete().eq('group_id', params.id);
    // 支払いが0件ならinsertしない
    if (payments.length === 0) return;
    // 再計算してinsert
    const newSettlements = calculateSettlements();
    for (const s of newSettlements) {
      await supabase.from('settlements').insert({
        group_id: params.id,
        from_participant: s.from_participant,
        to_participant: s.to_participant,
        amount: s.amount,
        status: 'pending',
      });
    }
  }

  // 支払い追加・編集・削除時に呼び出す
  const handleAddPayment = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      // 支払った人がtargetsに含まれていなければ追加
      const fixedTargets = selectedTargets.includes(newPayment.paid_by)
        ? selectedTargets
        : [...selectedTargets, newPayment.paid_by]
      const { error } = await supabase
        .from('payments')
        .insert({
          group_id: params.id,
          title: newPayment.title,
          amount: Number(newPayment.amount),
          paid_by: newPayment.paid_by,
          targets: fixedTargets
        })
      if (error) throw error
      setNewPayment({ title: '', amount: '', paid_by: '' })
      setSelectedTargets([])
      setToast('支払いを追加しました')
      await resetAndRecreateSettlements()
      await fetchGroupData()
    } catch (e: any) {
      console.error('支払いの追加に失敗:', e)
      setToast(`支払いの追加に失敗しました: ${e.message || e.details || e.toString()}`)
    }
  }

  const handleEditPayment = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingPayment) return
    try {
      // 支払った人がtargetsに含まれていなければ追加
      const fixedTargets = selectedTargets.includes(newPayment.paid_by)
        ? selectedTargets
        : [...selectedTargets, newPayment.paid_by]
      const { error } = await supabase
        .from('payments')
        .update({
          title: newPayment.title,
          amount: Number(newPayment.amount),
          paid_by: newPayment.paid_by,
          targets: fixedTargets
        })
        .eq('id', editingPayment.id)
      if (error) throw error
      setNewPayment({ title: '', amount: '', paid_by: '' })
      setSelectedTargets([])
      setEditingPayment(null)
      setToast('支払いを更新しました')
      await resetAndRecreateSettlements()
      await fetchGroupData()
    } catch (e) {
      console.error('支払いの更新に失敗:', e)
      setToast('支払いの更新に失敗しました')
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
      setToast('支払いを削除しました')
      await resetAndRecreateSettlements()
      await fetchGroupData()
    } catch (e) {
      console.error('支払いの削除に失敗:', e)
      setToast('支払いの削除に失敗しました')
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

  // 自然言語解析API呼び出し
  const handleParseNaturalLanguage = async () => {
    setNlLoading(true)
    setNlError('')
    try {
      const res = await fetch('/api/parse-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: nlInput, participants: participants.map(p => p.name) })
      })
      const data = await res.json()
      if (data.error) throw new Error(data.error)

      // 必須情報のチェック
      if (!data.amount) throw new Error('金額が解析できませんでした')
      if (!data.payer) throw new Error('支払った人が解析できませんでした')
      if (!data.targets || data.targets.length === 0) throw new Error('対象者が解析できませんでした')

      // 直接支払いを追加
      const { error } = await supabase
        .from('payments')
        .insert({
          group_id: params.id,
          title: data.note || '支払い',
          amount: data.amount,
          paid_by: data.payer,
          targets: data.targets
        })

      if (error) throw error

      // 成功時の処理
      setNlInput('')
      setToast('支払いを追加しました')
      await fetchGroupData()
    } catch (e: any) {
      setNlError(e.message || '解析に失敗しました')
    } finally {
      setNlLoading(false)
    }
  }

  // 対象者全員選択/解除
  const toggleAllParticipants = () => {
    if (selectedTargets.length === participants.length) {
      setSelectedTargets([])
    } else {
      setSelectedTargets(participants.map(p => p.name))
    }
  }

  if (isLoading) {
    return <div className="p-4">読み込み中...</div>
  }

  if (!group) {
    return <div className="p-4">グループが見つかりません</div>
  }

  return (
    <div className="max-w-7xl mx-auto px-2 sm:px-4 py-8">
      {/* トースト通知 */}
      {toast && (
        <div className="fixed top-4 right-4 z-50 card text-white px-4 py-2 rounded-lg shadow-lg animate-fade-in">
          {toast}
        </div>
      )}

      {/* ヘッダー */}
      <div className="flex items-start justify-between mb-6 gap-4">
        <div className="flex-1 min-w-0">
          {isEditingGroup ? (
            <form onSubmit={handleUpdateGroup} className="flex gap-2 items-center">
              <input
                type="text"
                value={groupTitle}
                onChange={(e) => setGroupTitle(e.target.value)}
                className="input-primary text-2xl font-bold w-full"
                required
              />
              <button type="submit" className="btn-primary">保存</button>
              <button type="button" onClick={() => { setIsEditingGroup(false); setGroupTitle(group.title) }} className="btn-secondary">キャンセル</button>
            </form>
          ) : (
            <h1 className="text-3xl font-extrabold text-white truncate">{group.title}</h1>
          )}
        </div>
        <div className="flex gap-2 flex-shrink-0">
          <button onClick={() => router.push(`/groups/${params.id}/members`)} className="bg-white text-gray-900 rounded-lg px-4 py-2 shadow-sm transition">メンバーを追加</button>
          <button onClick={handleCopyUrl} className="bg-white border border-gray-300 hover:bg-gray-100 text-gray-700 rounded-lg px-4 py-2 shadow-sm transition">URLコピー</button>
          <button onClick={handleDeleteGroup} className="bg-red-50 hover:bg-red-100 text-red-600 rounded-lg px-4 py-2 transition">削除</button>
        </div>
      </div>

      {/* 2カラムレイアウト */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* 左カラム */}
        <div className="md:col-span-1 flex flex-col gap-6">
          {/* 支払い追加カード */}
          <div className="card">
            <h2 className="text-lg font-semibold mb-4 text-white">支払いを追加</h2>
            {/* 自然言語入力欄・支払い追加フォームはそのまま */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-white mb-1">自然言語で追加</label>
              <textarea
                value={nlInput}
                onChange={e => setNlInput(e.target.value)}
                className="input-primary"
                rows={2}
                placeholder="例: AがBとCに2000円を立て替えた"
              />
              <button
                type="button"
                onClick={handleParseNaturalLanguage}
                disabled={nlLoading || !nlInput}
                className="btn-primary mt-2"
              >
                {nlLoading ? '解析中...' : '支払いを追加'}
              </button>
              {nlError && <div className="text-red-500 text-sm mt-1">{nlError}</div>}
            </div>
            <form onSubmit={editingPayment ? handleEditPayment : handleAddPayment} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-white mb-1">タイトル</label>
                <input
                  type="text"
                  className="input-primary"
                  value={newPayment.title}
                  onChange={e => setNewPayment({ ...newPayment, title: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-white mb-1">金額</label>
                <input
                  type="number"
                  className="input-primary"
                  value={newPayment.amount}
                  onChange={e => setNewPayment({ ...newPayment, amount: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-white mb-1">支払った人</label>
                <select
                  className="input-primary"
                  value={newPayment.paid_by}
                  onChange={e => setNewPayment({ ...newPayment, paid_by: e.target.value })}
                  required
                >
                  <option value="">選択してください</option>
                  {participants.map((p) => (
                    <option key={p.id} value={p.name}>{p.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-white">対象者（複数選択可）</label>
                  <button
                    type="button"
                    onClick={toggleAllParticipants}
                    className="btn-secondary text-xs px-3 py-1"
                  >
                    {selectedTargets.length === participants.length ? '全解除' : '全選択'}
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {participants.map((p) => (
                    <label key={p.id} className="flex items-center gap-1">
                      <input
                        type="checkbox"
                        checked={selectedTargets.includes(p.name)}
                        onChange={e => {
                          if (e.target.checked) {
                            setSelectedTargets([...selectedTargets, p.name])
                          } else {
                            setSelectedTargets(selectedTargets.filter(n => n !== p.name))
                          }
                        }}
                      />
                      <span>{p.name}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div className="flex gap-2">
                <button type="submit" className="btn-primary">{editingPayment ? '更新' : '追加'}</button>
                {editingPayment && (
                  <button type="button" onClick={() => { setEditingPayment(null); setNewPayment({ title: '', amount: '', paid_by: '' }) }} className="btn-secondary">キャンセル</button>
                )}
              </div>
            </form>
          </div>
        </div>
        {/* 右カラム */}
        <div className="md:col-span-2 flex flex-col gap-6">
          {/* 合計金額カード */}
          <div className="card">
            <h2 className="text-lg font-semibold mb-4 text-white">合計金額</h2>
            <div className="text-2xl font-bold text-white">
              ¥{payments.reduce((sum, p) => sum + Number(p.amount), 0).toLocaleString()}
            </div>
          </div>
          {/* 精算リストカード */}
          <div className="card">
            <h2 className="text-lg font-semibold mb-4 text-white">精算リスト</h2>
            {settlements.length === 0 && !isLoading && calculateSettlements().length > 0 && (
              <button
                className="btn-primary mb-4"
                onClick={async () => {
                  const newSettlements = calculateSettlements();
                  for (const s of newSettlements) {
                    await supabase.from('settlements').insert({
                      group_id: params.id,
                      from_participant: s.from_participant,
                      to_participant: s.to_participant,
                      amount: s.amount,
                      status: 'pending',
                    });
                  }
                  fetchGroupData();
                }}
              >
                精算リストを確定
              </button>
            )}
            <div className="space-y-2">
              {(settlements.length > 0 ? settlements : calculateSettlements()).map((settlement, index) => (
                <div
                  key={settlement.id ?? index}
                  className={`flex items-center justify-between p-3 bg-gray-700 rounded-lg transition-opacity ${settlement.status === 'completed' ? 'opacity-50 line-through' : ''}`}
                >
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={settlement.status === 'completed'}
                      disabled={!settlement.id}
                      onChange={() => {
                        if (settlement.id) handleUpdateSettlementStatus(settlement.id, settlement.status === 'completed' ? 'pending' : 'completed')
                      }}
                      className="mr-2 accent-pink-400 w-5 h-5"
                    />
                    <span className="font-bold text-white">{settlement.from_participant}</span>
                    <span className="text-white">→</span>
                    <span className="font-bold text-white">{settlement.to_participant}</span>
                    {!settlement.id && (
                      <span className="ml-2 text-xs text-gray-300">（確定後に有効化）</span>
                    )}
                  </div>
                  <span className="font-bold text-white">¥{settlement.amount.toLocaleString()}</span>
                </div>
              ))}
              {(settlements.length === 0 && calculateSettlements().length === 0) && (
                <p className="text-white text-center py-4">精算は必要ありません</p>
              )}
            </div>
          </div>
          {/* 支払い履歴カード */}
          <div className="card">
            <h2 className="text-lg font-semibold mb-4 text-white">支払い履歴</h2>
            <div className="space-y-4">
              {payments.map((payment) => (
                <div key={payment.id} className="border rounded-lg p-4 bg-gray-700 shadow-sm cursor-pointer hover:bg-indigo-800 transition">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-bold text-white">{payment.title}</h3>
                      <p className="text-xs text-white">{new Date(payment.created_at).toLocaleString()}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-white">¥{payment.amount.toLocaleString()}</p>
                      <p className="text-xs text-white">支払い: {payment.paid_by}</p>
                      {payment.targets && payment.targets.length > 0 && (
                        <p className="text-xs text-white">対象者: {(payment.targets || []).filter(t => t !== payment.paid_by).join(', ')}</p>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <button onClick={(e) => { e.stopPropagation(); setEditingPayment(payment); setNewPayment({ title: payment.title, amount: payment.amount.toString(), paid_by: payment.paid_by }); setSelectedTargets((payment.targets || []).filter(t => t !== payment.paid_by)); }} className="text-indigo-400 hover:text-indigo-200 text-sm">編集</button>
                      <button onClick={(e) => { e.stopPropagation(); handleDeletePayment(payment.id) }} className="text-pink-400 hover:text-pink-300 text-sm">削除</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
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
    </div>
  )
} 