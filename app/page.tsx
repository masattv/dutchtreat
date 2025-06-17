'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { v4 as uuidv4 } from 'uuid'
import { UserGroupIcon, CurrencyYenIcon, LinkIcon, CalculatorIcon } from '@heroicons/react/24/solid'

export default function Home() {
  const router = useRouter()
  const [title, setTitle] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const groupId = uuidv4()
      const response = await fetch('/api/groups', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: groupId,
          title,
        }),
      })

      if (!response.ok) {
        throw new Error('グループの作成に失敗しました')
      }

      router.push(`/groups/${groupId}`)
    } catch (error) {
      console.error('Error:', error)
      alert('エラーが発生しました。もう一度お試しください。')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-[#18181b] flex flex-col items-center justify-center px-4 py-8 sm:py-12">
      {/* ヒーローセクション */}
      <section className="w-full max-w-2xl mx-auto text-center mb-8 sm:mb-16">
        <h1 className="text-3xl sm:text-5xl font-extrabold text-white mb-3 sm:mb-4 drop-shadow-lg">WariMemoで、<br /><span className="text-pink-400">かんたん割り勘</span></h1>
        <p className="text-base sm:text-xl text-gray-300 mb-6 sm:mb-8 font-medium">グループでの支払い・精算を、<span className="text-pink-300">URL共有</span>だけでスムーズに。<br className="hidden sm:inline"/>ストレスフリーな割り勘体験を。</p>
        <form onSubmit={handleCreate} className="flex flex-col sm:flex-row gap-3 justify-center items-center bg-[#23272f] rounded-xl shadow-xl p-4 sm:p-6 mx-auto max-w-xl">
          <input
            id="title"
            name="title"
            type="text"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="input-primary flex-1 min-w-0 text-base sm:text-lg w-full"
            placeholder=""
          />
          <button
            type="submit"
            disabled={isLoading}
            className="btn-primary w-full sm:w-auto text-base sm:text-lg px-6 sm:px-8 py-2"
          >
            {isLoading ? '作成中...' : 'グループを作成'}
          </button>
        </form>
      </section>

      {/* 特徴セクション */}
      <section className="w-full max-w-4xl mx-auto grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
        <div className="card flex flex-col items-center py-6 sm:py-8">
          <UserGroupIcon className="w-8 h-8 sm:w-10 sm:h-10 mb-2 sm:mb-3 icon-accent" />
          <h3 className="text-base sm:text-lg font-bold text-white mb-1">メンバー管理</h3>
          <p className="text-white text-xs sm:text-sm text-center">参加者の追加・削除もワンクリック。グループごとに管理できます。</p>
        </div>
        <div className="card flex flex-col items-center py-6 sm:py-8">
          <CurrencyYenIcon className="w-8 h-8 sm:w-10 sm:h-10 mb-2 sm:mb-3 icon-accent" />
          <h3 className="text-base sm:text-lg font-bold text-white mb-1">支払い履歴</h3>
          <p className="text-white text-xs sm:text-sm text-center">誰がいくら払ったか、履歴で一目瞭然。編集・削除も簡単。</p>
        </div>
        <div className="card flex flex-col items-center py-6 sm:py-8">
          <CalculatorIcon className="w-8 h-8 sm:w-10 sm:h-10 mb-2 sm:mb-3 icon-accent" />
          <h3 className="text-base sm:text-lg font-bold text-white mb-1">自動精算</h3>
          <p className="text-white text-xs sm:text-sm text-center">複雑な割り勘も自動で計算。最小限の送金でOK。</p>
        </div>
        <div className="card flex flex-col items-center py-6 sm:py-8">
          <LinkIcon className="w-8 h-8 sm:w-10 sm:h-10 mb-2 sm:mb-3 icon-accent" />
          <h3 className="text-base sm:text-lg font-bold text-white mb-1">URL共有</h3>
          <p className="text-white text-xs sm:text-sm text-center">グループURLをコピーして、誰でもすぐに参加可能。</p>
        </div>
      </section>

      {/* フッター */}
      <footer className="w-full text-center mt-8">
        <a 
          href="https://x.com/mk_dev_0430" 
          target="_blank" 
          rel="noopener noreferrer" 
          className="text-gray-500 hover:text-gray-400 text-sm transition-colors"
        >
          @mk_dev_0430
        </a>
      </footer>
    </main>
  )
} 