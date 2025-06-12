'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import type { Database } from '@/lib/supabase'

type SplitMethod = 'equal' | 'custom'

interface ReceiptDetailProps {
  receipt: Database['public']['Tables']['receipts']['Row']
  groupId: string
  isOwner: boolean
}

export default function ReceiptDetail({
  receipt,
  groupId,
  isOwner,
}: ReceiptDetailProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [totalAmount, setTotalAmount] = useState(receipt.total_amount || 0)
  const [people, setPeople] = useState(receipt.people || 1)
  const [splitMethod, setSplitMethod] = useState<SplitMethod>('equal')
  const [customSplits, setCustomSplits] = useState<number[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClientComponentClient<Database>()

  const handleSave = async () => {
    try {
      setIsLoading(true)
      setError(null)

      const { error: updateError } = await supabase
        .from('receipts')
        .update({
          total_amount: totalAmount,
          people,
          split_method: splitMethod,
          custom_splits: splitMethod === 'custom' ? customSplits : null,
          version: receipt.version + 1,
        })
        .eq('id', receipt.id)

      if (updateError) {
        throw updateError
      }

      setIsEditing(false)
      router.refresh()
    } catch (err) {
      setError('更新に失敗しました。もう一度お試しください。')
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!window.confirm('このレシートを削除してもよろしいですか？')) {
      return
    }

    try {
      setIsLoading(true)
      setError(null)

      // ストレージからファイルを削除
      const { error: storageError } = await supabase.storage
        .from('receipts')
        .remove([receipt.file_path])

      if (storageError) {
        throw storageError
      }

      // レシートレコードを削除
      const { error: deleteError } = await supabase
        .from('receipts')
        .delete()
        .eq('id', receipt.id)

      if (deleteError) {
        throw deleteError
      }

      router.push(`/groups/${groupId}`)
    } catch (err) {
      setError('削除に失敗しました。もう一度お試しください。')
    } finally {
      setIsLoading(false)
    }
  }

  const calculateSplitAmount = (index: number) => {
    if (splitMethod === 'equal') {
      return Math.ceil(totalAmount / people)
    } else {
      return customSplits[index] || 0
    }
  }

  const handleCustomSplitChange = (index: number, value: number) => {
    const newSplits = [...customSplits]
    newSplits[index] = value
    setCustomSplits(newSplits)
  }

  return (
    <div className="overflow-hidden bg-white shadow sm:rounded-lg">
      <div className="px-4 py-5 sm:px-6">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium leading-6 text-gray-900">
            レシート情報
          </h3>
          {isOwner && (
            <div className="flex space-x-3">
              {isEditing ? (
                <>
                  <button
                    type="button"
                    onClick={handleSave}
                    disabled={isLoading}
                    className="inline-flex items-center rounded-md border border-transparent bg-primary-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
                  >
                    保存
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsEditing(false)}
                    disabled={isLoading}
                    className="inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
                  >
                    キャンセル
                  </button>
                </>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={() => setIsEditing(true)}
                    className="inline-flex items-center rounded-md border border-transparent bg-primary-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
                  >
                    編集
                  </button>
                  <button
                    type="button"
                    onClick={handleDelete}
                    className="inline-flex items-center rounded-md border border-red-300 bg-white px-4 py-2 text-sm font-medium text-red-700 shadow-sm hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                  >
                    削除
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      </div>
      <div className="border-t border-gray-200">
        <dl>
          <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
            <dt className="text-sm font-medium text-gray-500">レシート画像</dt>
            <dd className="mt-1 text-sm text-gray-900 sm:col-span-2 sm:mt-0">
              <img
                src={supabase.storage.from('receipts').getPublicUrl(receipt.file_path).data.publicUrl}
                alt="レシート画像"
                className="max-w-lg rounded-lg shadow-sm"
              />
            </dd>
          </div>
          <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
            <dt className="text-sm font-medium text-gray-500">OCRテキスト</dt>
            <dd className="mt-1 text-sm text-gray-900 sm:col-span-2 sm:mt-0">
              {receipt.ocr_text || 'OCRテキストはありません'}
            </dd>
          </div>
          <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
            <dt className="text-sm font-medium text-gray-500">合計金額</dt>
            <dd className="mt-1 text-sm text-gray-900 sm:col-span-2 sm:mt-0">
              {isEditing ? (
                <input
                  type="number"
                  value={totalAmount}
                  onChange={(e) => setTotalAmount(Number(e.target.value))}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                />
              ) : (
                `¥${totalAmount.toLocaleString()}`
              )}
            </dd>
          </div>
          <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
            <dt className="text-sm font-medium text-gray-500">分割方法</dt>
            <dd className="mt-1 text-sm text-gray-900 sm:col-span-2 sm:mt-0">
              {isEditing ? (
                <div className="space-y-4">
                  <div className="flex space-x-4">
                    <label className="inline-flex items-center">
                      <input
                        type="radio"
                        value="equal"
                        checked={splitMethod === 'equal'}
                        onChange={(e) => setSplitMethod(e.target.value as SplitMethod)}
                        className="h-4 w-4 border-gray-300 text-primary-600 focus:ring-primary-500"
                      />
                      <span className="ml-2">均等分割</span>
                    </label>
                    <label className="inline-flex items-center">
                      <input
                        type="radio"
                        value="custom"
                        checked={splitMethod === 'custom'}
                        onChange={(e) => setSplitMethod(e.target.value as SplitMethod)}
                        className="h-4 w-4 border-gray-300 text-primary-600 focus:ring-primary-500"
                      />
                      <span className="ml-2">カスタム分割</span>
                    </label>
                  </div>
                  {splitMethod === 'custom' && (
                    <div className="space-y-2">
                      {Array.from({ length: people }).map((_, index) => (
                        <div key={index} className="flex items-center space-x-2">
                          <span className="text-sm text-gray-500">
                            人{index + 1}:
                          </span>
                          <input
                            type="number"
                            value={customSplits[index] || 0}
                            onChange={(e) =>
                              handleCustomSplitChange(index, Number(e.target.value))
                            }
                            className="block w-32 rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                          />
                          <span className="text-sm text-gray-500">円</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                receipt.split_method === 'equal' ? '均等分割' : 'カスタム分割'
              )}
            </dd>
          </div>
          <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
            <dt className="text-sm font-medium text-gray-500">分割人数</dt>
            <dd className="mt-1 text-sm text-gray-900 sm:col-span-2 sm:mt-0">
              {isEditing ? (
                <input
                  type="number"
                  value={people}
                  onChange={(e) => setPeople(Number(e.target.value))}
                  min="1"
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                />
              ) : (
                `${people}人`
              )}
            </dd>
          </div>
          <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
            <dt className="text-sm font-medium text-gray-500">分割金額</dt>
            <dd className="mt-1 text-sm text-gray-900 sm:col-span-2 sm:mt-0">
              <div className="space-y-2">
                {Array.from({ length: people }).map((_, index) => (
                  <div key={index} className="flex items-center space-x-2">
                    <span className="text-sm text-gray-500">
                      人{index + 1}:
                    </span>
                    <span className="text-sm font-medium">
                      ¥{calculateSplitAmount(index).toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
            </dd>
          </div>
          <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
            <dt className="text-sm font-medium text-gray-500">作成日時</dt>
            <dd className="mt-1 text-sm text-gray-900 sm:col-span-2 sm:mt-0">
              {new Date(receipt.created_at).toLocaleString()}
            </dd>
          </div>
        </dl>
      </div>

      {error && (
        <div className="mt-4 rounded-md bg-red-50 p-4">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}
    </div>
  )
} 