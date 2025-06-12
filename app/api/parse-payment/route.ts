import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  const { text, participants } = await req.json()
  const apiKey = process.env.OPENAI_API_KEY

  if (!apiKey) {
    return NextResponse.json({ error: 'OpenAI APIキーが設定されていません' }, { status: 500 })
  }

  const prompt = `
あなたは割り勘アプリのアシスタントです。
以下の自然言語の文章から、支払った人（payer）、金額（amount）、対象者（targets: 配列）、備考（note: 任意）をJSONで抽出してください。
参加者リスト: ${participants.join(', ')}

例:
入力: "AがBとCに2000円を立て替えた"
出力: {"payer": "A", "amount": 2000, "targets": ["B", "C"], "note": ""}

入力: "BがCに1000円払った"
出力: {"payer": "B", "amount": 1000, "targets": ["C"], "note": ""}

入力: "Dは今回関係ない"
出力: {"payer": "", "amount": 0, "targets": [], "note": "Dは関係ない"}

入力: "${text}"
出力:
`

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'gpt-3.5-turbo',
      messages: [
        { role: 'system', content: 'あなたはJSONでのみ返答するアシスタントです。' },
        { role: 'user', content: prompt },
      ],
      max_tokens: 256,
      temperature: 0,
    }),
  })

  const data = await response.json()
  let parsed = null
  try {
    parsed = JSON.parse(data.choices[0].message.content)
  } catch (e) {
    return NextResponse.json({ error: 'OpenAIの応答をパースできませんでした', raw: data }, { status: 500 })
  }

  return NextResponse.json(parsed)
} 