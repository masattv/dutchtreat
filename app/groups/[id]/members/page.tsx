"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

type Participant = {
  id: string
  name: string
  created_at: string
}

export default function MembersPage() {
  const params = useParams()
  const router = useRouter()
  const [participants, setParticipants] = useState<Participant[]>([])
  const [newParticipant, setNewParticipant] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    fetchParticipants()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.id])

  const fetchParticipants = async () => {
    setIsLoading(true)
    setError("")
    try {
      const { data, error } = await supabase
        .from("group_participants")
        .select("*")
        .eq("group_id", params.id)
        .order("created_at", { ascending: true })
      if (error) throw error
      setParticipants(data)
    } catch (e: any) {
      setError(e.message || "取得に失敗しました")
    } finally {
      setIsLoading(false)
    }
  }

  const handleAddParticipant = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newParticipant.trim()) return
    try {
      const { error } = await supabase.from("group_participants").insert([
        {
          group_id: params.id,
          name: newParticipant.trim(),
        },
      ])
      if (error) throw error
      setNewParticipant("")
      fetchParticipants()
    } catch (e: any) {
      setError(e.message || "追加に失敗しました")
    }
  }

  const handleRemoveParticipant = async (participantId: string) => {
    if (!confirm("このメンバーを削除してもよろしいですか？")) return
    try {
      const { error } = await supabase
        .from("group_participants")
        .delete()
        .eq("id", participantId)
      if (error) throw error
      fetchParticipants()
    } catch (e: any) {
      setError(e.message || "削除に失敗しました")
    }
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-white mb-6">メンバー管理</h1>
      <form onSubmit={handleAddParticipant} className="flex gap-2 mb-6">
        <input
          type="text"
          value={newParticipant}
          onChange={e => setNewParticipant(e.target.value)}
          className="input-primary flex-1"
          placeholder="メンバー名"
          required
        />
        <button type="submit" className="btn-primary">追加</button>
      </form>
      {error && <div className="text-red-500 mb-4">{error}</div>}
      {isLoading ? (
        <div className="text-white">読み込み中...</div>
      ) : (
        <div className="space-y-2">
          {participants.length === 0 && <div className="text-white">メンバーがいません</div>}
          {participants.map((p) => (
            <div key={p.id} className="flex justify-between items-center bg-gray-50 p-3 rounded-lg border border-gray-100">
              <span className="text-gray-800">{p.name}</span>
              <button onClick={() => handleRemoveParticipant(p.id)} className="text-red-500 hover:text-red-700 text-sm">削除</button>
            </div>
          ))}
        </div>
      )}
      <div className="mt-8">
        <button onClick={() => router.back()} className="btn-secondary">グループに戻る</button>
      </div>
    </div>
  )
} 