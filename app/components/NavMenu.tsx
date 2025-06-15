import Link from 'next/link'
import { BookOpenIcon, SparklesIcon } from '@heroicons/react/24/solid'

export default function NavMenu() {
  return (
    <nav className="w-full bg-gray-900 text-white py-3 mb-6 shadow">
      <ul className="flex flex-wrap gap-4 justify-center">
        <li><Link href="/">ホーム</Link></li>
        <li>
          <Link href="/how-to-use" className="flex items-center gap-1 hover:text-pink-300 transition">
            <BookOpenIcon className="w-5 h-5 text-pink-300" />
            使い方ガイド
          </Link>
        </li>
        <li>
          <Link href="/scenes" className="flex items-center gap-1 hover:text-pink-300 transition">
            <SparklesIcon className="w-5 h-5 text-pink-300" />
            利用シーン
          </Link>
        </li>
        <li><Link href="/reports">レポート出力</Link></li>
        <li><Link href="/history">履歴</Link></li>
        <li><Link href="/news">お知らせ</Link></li>
      </ul>
    </nav>
  )
} 