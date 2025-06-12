'use client'

import { useState } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useRouter } from 'next/navigation'
import { UserPlus, Upload, X } from 'lucide-react'

type InviteMember = {
  email: string
  role: 'owner' | 'member'
}

export default function InvitePage({ params }: { params: { id: string } }) {
  const [members, setMembers] = useState<InviteMember[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClientComponentClient()

  const handleAddMember = () => {
    setMembers([...members, { email: '', role: 'member' }])
  }

  const handleRemoveMember = (index: number) => {
    setMembers(members.filter((_, i) => i !== index))
  }

  const handleMemberChange = (index: number, field: keyof InviteMember, value: string) => {
    const newMembers = [...members]
    newMembers[index] = { ...newMembers[index], [field]: value }
    setMembers(newMembers)
  }

  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    try {
      const text = await file.text()
      const rows = text.split('\n').map(row => row.split(',').map(cell => cell.trim()))
      const headers = rows[0]
      const data = rows.slice(1)

      if (headers.length !== 2 || headers[0] !== 'email' || headers[1] !== 'role') {
        throw new Error('CSVファイルの形式が正しくありません')
      }

      const importedMembers = data.map(([email, role]) => ({
        email,
        role: role === 'owner' ? 'owner' : 'member',
      }))

      setMembers(importedMembers)
    } catch (error) {
      console.error('Import error:', error)
      setError('CSVファイルの読み込みに失敗しました')
    } finally {
      event.target.value = ''
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)
    setSuccess(null)

    try {
      const { error } = await supabase.functions.invoke('invite-members', {
        body: {
          groupId: params.id,
          members,
        },
      })

      if (error) throw error

      setSuccess('メンバーの招待が完了しました')
      setMembers([])
      setTimeout(() => {
        router.push(`/groups/${params.id}`)
      }, 2000)
    } catch (error) {
      console.error('Invite error:', error)
      setError('メンバーの招待に失敗しました')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">メンバーを招待</h1>
        <div className="flex items-center gap-2">
          <label className="inline-flex cursor-pointer items-center gap-1 rounded-md bg-gray-600 px-3 py-2 text-sm font-semibold text-white hover:bg-gray-500">
            <Upload className="h-4 w-4" />
            CSVインポート
            <input
              type="file"
              accept=".csv"
              onChange={handleImport}
              className="hidden"
            />
          </label>
        </div>
      </div>

      {error && (
        <div className="rounded-md bg-red-50 p-4 text-sm text-red-600">
          {error}
        </div>
      )}

      {success && (
        <div className="rounded-md bg-green-50 p-4 text-sm text-green-600">
          {success}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-4">
          {members.map((member, index) => (
            <div key={index} className="flex items-center gap-4">
              <div className="flex-1">
                <input
                  type="email"
                  value={member.email}
                  onChange={(e) => handleMemberChange(index, 'email', e.target.value)}
                  placeholder="メールアドレス"
                  required
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <div className="w-32">
                <select
                  value={member.role}
                  onChange={(e) => handleMemberChange(index, 'role', e.target.value as 'owner' | 'member')}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="member">メンバー</option>
                  <option value="owner">管理者</option>
                </select>
              </div>
              <button
                type="button"
                onClick={() => handleRemoveMember(index)}
                className="rounded-md p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-500"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          ))}
        </div>

        <button
          type="button"
          onClick={handleAddMember}
          className="inline-flex items-center gap-1 rounded-md bg-gray-600 px-3 py-2 text-sm font-semibold text-white hover:bg-gray-500"
        >
          <UserPlus className="h-4 w-4" />
          メンバーを追加
        </button>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isLoading || members.length === 0}
            className="inline-flex items-center gap-1 rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-500 disabled:opacity-50"
          >
            {isLoading ? '招待中...' : '招待を送信'}
          </button>
        </div>
      </form>

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
          <li>メールアドレスは有効な形式である必要があります</li>
        </ul>
      </div>
    </div>
  )
} 