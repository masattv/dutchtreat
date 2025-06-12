'use client'

import { useState, useEffect } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import type { Database } from '@/lib/supabase'

type Notification = {
  id: string
  type: string
  group_id: string
  receipt_id: string | null
  user_id: string
  created_by: string
  created_at: string
  read: boolean
  group: {
    name: string
  }
  receipt: {
    total_amount: number
  } | null
  user: {
    email: string
  }
}

export default function Notifications() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClientComponentClient<Database>()

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()

        if (!session) {
          return
        }

        const { data, error: fetchError } = await supabase
          .from('notifications')
          .select(`
            *,
            group:groups(name),
            receipt:receipts(total_amount),
            user:users(email)
          `)
          .eq('user_id', session.user.id)
          .order('created_at', { ascending: false })

        if (fetchError) {
          throw fetchError
        }

        setNotifications(data || [])
      } catch (err) {
        setError('通知の取得に失敗しました。')
      } finally {
        setIsLoading(false)
      }
    }

    fetchNotifications()

    // リアルタイム更新の購読
    const channel = supabase
      .channel('notifications_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notifications',
        },
        () => {
          fetchNotifications()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [supabase])

  const handleMarkAsRead = async (notificationId: string) => {
    try {
      const { error: updateError } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('id', notificationId)

      if (updateError) {
        throw updateError
      }
    } catch (err) {
      setError('通知の更新に失敗しました。')
    }
  }

  const getNotificationMessage = (notification: Notification) => {
    switch (notification.type) {
      case 'receipt_added':
        return `${notification.group.name}に新しいレシートが追加されました`
      case 'payment_required':
        return `${notification.group.name}で支払いが必要です`
      case 'payment_confirmed':
        return `${notification.group.name}で支払いが確認されました`
      default:
        return '新しい通知があります'
    }
  }

  if (isLoading) {
    return (
      <div className="mt-8">
        <div className="flex justify-center">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary-600 border-t-transparent"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="mt-8">
      <h3 className="text-lg font-medium leading-6 text-gray-900">
        通知
      </h3>
      <div className="mt-4">
        <div className="flow-root">
          <ul role="list" className="-my-5 divide-y divide-gray-200">
            {notifications.map((notification) => (
              <li
                key={notification.id}
                className={`py-4 ${
                  !notification.read ? 'bg-blue-50' : ''
                }`}
              >
                <div className="flex items-center space-x-4">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-gray-900">
                      {getNotificationMessage(notification)}
                    </p>
                    <p className="truncate text-sm text-gray-500">
                      {new Date(notification.created_at).toLocaleString()}
                    </p>
                  </div>
                  {!notification.read && (
                    <div>
                      <button
                        type="button"
                        onClick={() => handleMarkAsRead(notification.id)}
                        className="inline-flex items-center rounded-md border border-transparent bg-primary-600 px-3 py-2 text-sm font-medium leading-4 text-white shadow-sm hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
                      >
                        既読にする
                      </button>
                    </div>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {error && (
        <div className="mt-4 rounded-md bg-red-50 p-4">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}
    </div>
  )
} 