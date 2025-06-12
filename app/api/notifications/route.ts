import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const { data: { session } } = await supabase.auth.getSession()

    if (!session) {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    const { type, groupId, receiptId, userId } = await request.json()

    // 通知レコードを作成
    const { error: notificationError } = await supabase
      .from('notifications')
      .insert([
        {
          type,
          group_id: groupId,
          receipt_id: receiptId,
          user_id: userId,
          created_by: session.user.id,
        },
      ])

    if (notificationError) {
      throw notificationError
    }

    // メール通知の送信（実装は省略）
    // TODO: メール送信機能の実装

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Notification Error:', error)
    return new NextResponse('Internal Server Error', { status: 500 })
  }
} 