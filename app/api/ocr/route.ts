import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import Tesseract from 'tesseract.js'

export async function POST(request: Request) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const { data: { session } } = await supabase.auth.getSession()

    if (!session) {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    const { filePath } = await request.json()

    // 画像の取得
    const { data: imageData, error: imageError } = await supabase.storage
      .from('receipts')
      .download(filePath)

    if (imageError) {
      throw imageError
    }

    // OCR処理
    const { data: { text } } = await Tesseract.recognize(
      imageData,
      'jpn',
      {
        logger: m => console.log(m),
      }
    )

    // 金額の抽出（正規表現で数値を探す）
    const amountMatch = text.match(/合計[：:]\s*¥?(\d+[,\d]*)/)
    const amount = amountMatch ? parseInt(amountMatch[1].replace(/,/g, '')) : null

    return NextResponse.json({
      text,
      amount,
    })
  } catch (error) {
    console.error('OCR Error:', error)
    return new NextResponse('Internal Server Error', { status: 500 })
  }
} 