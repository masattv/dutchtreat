'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { PlusIcon } from '@heroicons/react/24/outline'
import { supabase } from '@/lib/supabase'

export default function CreateGroupButton() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)

  const handleCreateGroup = async () => {
    try {
      setIsLoading(true)
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) throw new Error('ログインが必要です')

      const { data, error } = await supabase
        .from('groups')
        .insert([
          {
            name: '新しいグループ',
            description: 'グループの説明を入力してください',
            created_by: session.user.id,
          },
        ])
        .select()
        .single()

      if (error) throw error
      router.push(`/dashboard/groups/${data.id}/edit`)
    } catch (err: any) {
      console.error('Error creating group:', err)
      alert(err.message)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <button
      type="button"
      onClick={handleCreateGroup}
      disabled={isLoading}
      className="btn-primary"
    >
      <PlusIcon className="-ml-0.5 mr-1.5 h-5 w-5" aria-hidden="true" />
      {isLoading ? '作成中...' : 'グループを作成'}
    </button>
  )
} 