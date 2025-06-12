'use client'

import { useState, useEffect } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useRouter } from 'next/navigation'
import { Shield, Trash2, UserPlus, Upload } from 'lucide-react'

type Member = {
  id: string
  role: 'owner' | 'member'
  user: {
    id: string
    email: string
    name: string
  }
}

type MemberManagementProps = {
  groupId: string
}

export function MemberManagement({ groupId }: MemberManagementProps) {
  const [members, setMembers] = useState<Member[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedMembers, setSelectedMembers] = useState<string[]>([])
  const [isBulkActionLoading, setIsBulkActionLoading] = useState(false)
  const [isImporting, setIsImporting] = useState(false)
  const router = useRouter()
  const supabase = createClientComponentClient()

  useEffect(() => {
    fetchMembers()
  }, [groupId])

  const fetchMembers = async () => {
    try {
      const { data: members, error } = await supabase
        .from('group_members')
        .select(`
          id,
          role,
          user:users (
            id,
            email,
            name
          )
        `)
        .eq('group_id', groupId)

      if (error) throw error

      setMembers(members)
    } catch (error) {
      console.error('Error fetching members:', error)
      setError('メンバーの取得に失敗しました')
    } finally {
      setIsLoading(false)
    }
  }

  const handleChangeRole = async (memberId: string, newRole: 'owner' | 'member') => {
    if (!confirm('メンバーの権限を変更してもよろしいですか？')) return

    try {
      const { error } = await supabase
        .from('group_members')
        .update({ role: newRole })
        .eq('id', memberId)

      if (error) throw error

      fetchMembers()
    } catch (error) {
      console.error('Error updating role:', error)
      setError('権限の変更に失敗しました')
    }
  }

  const handleRemoveMember = async (memberId: string) => {
    if (!confirm('メンバーを削除してもよろしいですか？')) return

    try {
      const { error } = await supabase
        .from('group_members')
        .delete()
        .eq('id', memberId)

      if (error) throw error

      fetchMembers()
    } catch (error) {
      console.error('Error removing member:', error)
      setError('メンバーの削除に失敗しました')
    }
  }

  const handleBulkRemove = async () => {
    if (!confirm('選択したメンバーを削除してもよろしいですか？')) return

    try {
      setIsBulkActionLoading(true)
      const { error } = await supabase
        .from('group_members')
        .delete()
        .in('id', selectedMembers)

      if (error) throw error

      setSelectedMembers([])
      fetchMembers()
    } catch (error) {
      console.error('Error removing members:', error)
      setError('メンバーの削除に失敗しました')
    } finally {
      setIsBulkActionLoading(false)
    }
  }

  const handleBulkChangeRole = async (newRole: 'owner' | 'member') => {
    if (!confirm(`選択したメンバーの権限を${newRole === 'owner' ? '管理者' : 'メンバー'}に変更してもよろしいですか？`)) return

    try {
      setIsBulkActionLoading(true)
      const { error } = await supabase
        .from('group_members')
        .update({ role: newRole })
        .in('id', selectedMembers)

      if (error) throw error

      setSelectedMembers([])
      fetchMembers()
    } catch (error) {
      console.error('Error updating roles:', error)
      setError('権限の変更に失敗しました')
    } finally {
      setIsBulkActionLoading(false)
    }
  }

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedMembers(members.map(member => member.id))
    } else {
      setSelectedMembers([])
    }
  }

  const handleSelectMember = (memberId: string, checked: boolean) => {
    if (checked) {
      setSelectedMembers([...selectedMembers, memberId])
    } else {
      setSelectedMembers(selectedMembers.filter(id => id !== memberId))
    }
  }

  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    try {
      setIsImporting(true)
      setError(null)

      const text = await file.text()
      const rows = text.split('\n').map(row => row.split(',').map(cell => cell.trim()))
      const headers = rows[0]
      const data = rows.slice(1)

      if (headers.length !== 2 || headers[0] !== 'email' || headers[1] !== 'role') {
        throw new Error('CSVファイルの形式が正しくありません')
      }

      const { data: session } = await supabase.auth.getSession()
      if (!session.session) throw new Error('認証エラー')

      const { data: group } = await supabase
        .from('groups')
        .select('id')
        .eq('id', groupId)
        .single()

      if (!group) throw new Error('グループが見つかりません')

      const members = data.map(([email, role]) => ({
        email,
        role: role === 'owner' ? 'owner' : 'member',
      }))

      const { error } = await supabase.functions.invoke('import-members', {
        body: {
          groupId,
          members,
        },
      })

      if (error) throw error

      fetchMembers()
      alert('メンバーのインポートが完了しました')
    } catch (error) {
      console.error('Import error:', error)
      setError('メンバーのインポートに失敗しました')
    } finally {
      setIsImporting(false)
      event.target.value = ''
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
        <h2 className="text-lg font-medium">メンバー管理</h2>
        <div className="flex items-center gap-2">
          <label className="inline-flex cursor-pointer items-center gap-1 rounded-md bg-gray-600 px-3 py-2 text-sm font-semibold text-white hover:bg-gray-500">
            <Upload className="h-4 w-4" />
            CSVインポート
            <input
              type="file"
              accept=".csv"
              onChange={handleImport}
              disabled={isImporting}
              className="hidden"
            />
          </label>
          <button
            onClick={() => router.push(`/groups/${groupId}/invite`)}
            className="inline-flex items-center gap-1 rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-500"
          >
            <UserPlus className="h-4 w-4" />
            メンバーを招待
          </button>
        </div>
      </div>

      {selectedMembers.length > 0 && (
        <div className="flex items-center gap-4 rounded-lg bg-gray-50 p-4">
          <span className="text-sm text-gray-600">
            {selectedMembers.length}件選択中
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleBulkChangeRole('owner')}
              disabled={isBulkActionLoading}
              className="inline-flex items-center gap-1 rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-500 disabled:opacity-50"
            >
              <Shield className="h-4 w-4" />
              管理者に変更
            </button>
            <button
              onClick={() => handleBulkChangeRole('member')}
              disabled={isBulkActionLoading}
              className="inline-flex items-center gap-1 rounded-md bg-gray-600 px-3 py-2 text-sm font-semibold text-white hover:bg-gray-500 disabled:opacity-50"
            >
              <Shield className="h-4 w-4" />
              メンバーに変更
            </button>
            <button
              onClick={handleBulkRemove}
              disabled={isBulkActionLoading}
              className="inline-flex items-center gap-1 rounded-md bg-red-600 px-3 py-2 text-sm font-semibold text-white hover:bg-red-500 disabled:opacity-50"
            >
              <Trash2 className="h-4 w-4" />
              削除
            </button>
          </div>
        </div>
      )}

      <div className="overflow-hidden rounded-lg border border-gray-200">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="relative w-12 px-6 sm:w-16 sm:px-8">
                <input
                  type="checkbox"
                  className="absolute left-4 top-1/2 -mt-2 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 sm:left-6"
                  checked={selectedMembers.length === members.length}
                  onChange={(e) => handleSelectAll(e.target.checked)}
                />
              </th>
              <th
                scope="col"
                className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6"
              >
                名前
              </th>
              <th
                scope="col"
                className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900"
              >
                メールアドレス
              </th>
              <th
                scope="col"
                className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900"
              >
                権限
              </th>
              <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-6">
                <span className="sr-only">操作</span>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {members.map((member) => (
              <tr key={member.id}>
                <td className="relative w-12 px-6 sm:w-16 sm:px-8">
                  <input
                    type="checkbox"
                    className="absolute left-4 top-1/2 -mt-2 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 sm:left-6"
                    checked={selectedMembers.includes(member.id)}
                    onChange={(e) => handleSelectMember(member.id, e.target.checked)}
                  />
                </td>
                <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">
                  {member.user.name}
                </td>
                <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                  {member.user.email}
                </td>
                <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                  <select
                    value={member.role}
                    onChange={(e) => handleChangeRole(member.id, e.target.value as 'owner' | 'member')}
                    className="rounded-md border border-gray-300 px-2 py-1 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="owner">管理者</option>
                    <option value="member">メンバー</option>
                  </select>
                </td>
                <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                  <button
                    onClick={() => handleRemoveMember(member.id)}
                    className="text-red-600 hover:text-red-900"
                  >
                    削除
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="rounded-lg bg-gray-50 p-4">
        <h3 className="text-sm font-medium text-gray-900">CSVインポートについて</h3>
        <p className="mt-2 text-sm text-gray-600">
          CSVファイルは以下の形式で作成してください：
        </p>
        <pre className="mt-2 rounded-md bg-gray-100 p-2 text-sm">
          email,role
          user1@example.com,member
          user2@example.com,owner
        </pre>
        <ul className="mt-2 list-inside list-disc text-sm text-gray-600">
          <li>1行目はヘッダー（email,role）</li>
          <li>roleは「owner」または「member」</li>
          <li>メールアドレスは既存のユーザーのものを使用</li>
        </ul>
      </div>
    </div>
  )
} 