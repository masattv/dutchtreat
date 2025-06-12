import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function POST(request: Request) {
  try {
    const { id, title } = await request.json()

    const { error } = await supabase
      .from('groups')
      .insert([
        {
          id,
          title,
          created_at: new Date().toISOString(),
        },
      ])

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json(
      { error: 'グループの作成に失敗しました' },
      { status: 500 }
    )
  }
} 