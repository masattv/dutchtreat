import { GlobeAltIcon, UsersIcon, SparklesIcon } from '@heroicons/react/24/solid'

export default function Scenes() {
  return (
    <main className="max-w-2xl mx-auto py-8 px-4">
      <h1 className="text-2xl font-bold mb-6 flex items-center gap-2">
        <SparklesIcon className="w-7 h-7 text-pink-400" />
        利用シーン紹介
      </h1>
      <section className="mb-8 bg-gray-800 rounded-lg p-4 flex items-start gap-4 shadow">
        <GlobeAltIcon className="w-8 h-8 text-pink-300 flex-shrink-0" />
        <div>
          <h2 className="font-semibold mb-2">旅行での割り勘</h2>
          <p>交通費や宿泊費、食事代など、複数人での出費を簡単に管理できます。</p>
        </div>
      </section>
      <section className="mb-8 bg-gray-800 rounded-lg p-4 flex items-start gap-4 shadow">
        <UsersIcon className="w-8 h-8 text-pink-300 flex-shrink-0" />
        <div>
          <h2 className="font-semibold mb-2">飲み会・食事会</h2>
          <p>誰がどれだけ払ったかを記録し、後からスムーズに精算できます。</p>
        </div>
      </section>
      <section className="mb-8 bg-gray-800 rounded-lg p-4 flex items-start gap-4 shadow">
        <SparklesIcon className="w-8 h-8 text-pink-300 flex-shrink-0" />
        <div>
          <h2 className="font-semibold mb-2">イベント・合宿</h2>
          <p>大人数のイベントでも、支払い履歴や精算が一目で分かります。</p>
        </div>
      </section>
    </main>
  )
} 
 