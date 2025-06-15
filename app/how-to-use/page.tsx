import Image from 'next/image'
import { UserGroupIcon, UserPlusIcon, CurrencyYenIcon, CheckCircleIcon } from '@heroicons/react/24/solid'

export default function HowToUse() {
  return (
    <main className="max-w-2xl mx-auto py-8 px-4">
      <h1 className="text-2xl font-bold mb-6 flex items-center gap-2">
        <UserGroupIcon className="w-7 h-7 text-pink-400" />
        使い方ガイド
      </h1>
      <ol className="space-y-6">
        <li className="bg-gray-800 rounded-lg p-4 flex items-start gap-4 shadow">
          <UserGroupIcon className="w-8 h-8 text-pink-300 flex-shrink-0" />
          <div>
            <h2 className="font-semibold mb-2">1. グループを作成</h2>
            <p>トップページからグループ名を入力して「グループを作成」ボタンを押します。</p>
            {/* <Image src="/howto-step1.png" alt="グループ作成画面" width={600} height={300} /> */}
          </div>
        </li>
        <li className="bg-gray-800 rounded-lg p-4 flex items-start gap-4 shadow">
          <UserPlusIcon className="w-8 h-8 text-pink-300 flex-shrink-0" />
          <div>
            <h2 className="font-semibold mb-2">2. メンバーを追加</h2>
            <p>グループ画面で「メンバーを追加」ボタンから参加者を登録します。</p>
            {/* <Image src="/howto-step2.png" alt="メンバー追加画面" width={600} height={300} /> */}
          </div>
        </li>
        <li className="bg-gray-800 rounded-lg p-4 flex items-start gap-4 shadow">
          <CurrencyYenIcon className="w-8 h-8 text-pink-300 flex-shrink-0" />
          <div>
            <h2 className="font-semibold mb-2">3. 支払いを入力</h2>
            <p>「支払いを追加」から誰がいくら払ったかを記録します。</p>
            {/* <Image src="/howto-step3.png" alt="支払い入力画面" width={600} height={300} /> */}
          </div>
        </li>
        <li className="bg-gray-800 rounded-lg p-4 flex items-start gap-4 shadow">
          <CheckCircleIcon className="w-8 h-8 text-pink-300 flex-shrink-0" />
          <div>
            <h2 className="font-semibold mb-2">4. 精算結果を確認</h2>
            <p>自動計算された精算リストを確認し、最小限の送金で割り勘が完了します。</p>
            {/* <Image src="/howto-step4.png" alt="精算結果画面" width={600} height={300} /> */}
          </div>
        </li>
      </ol>
    </main>
  )
} 