import { createClient } from '@supabase/supabase-js'
import sgMail from '@sendgrid/mail'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// SendGridの初期化
sgMail.setApiKey(process.env.SENDGRID_API_KEY!)

type EmailTemplate = {
  subject: string
  body: string
}

const templates: Record<string, EmailTemplate> = {
  receipt_added: {
    subject: '新しいレシートが追加されました',
    body: `
      {group_name}に新しいレシートが追加されました。
      金額: ¥{amount}
      支払いが必要な場合は、アプリにログインして確認してください。
    `,
  },
  payment_required: {
    subject: '支払いが必要です',
    body: `
      {group_name}で支払いが必要です。
      金額: ¥{amount}
      アプリにログインして支払い状況を更新してください。
    `,
  },
  payment_confirmed: {
    subject: '支払いが確認されました',
    body: `
      {group_name}での支払いが確認されました。
      金額: ¥{amount}
      ありがとうございます。
    `,
  },
}

export async function sendEmail(
  to: string,
  template: string,
  variables: Record<string, string>
) {
  try {
    const { data: user } = await supabase
      .from('users')
      .select('email_preferences')
      .eq('email', to)
      .single()

    // ユーザーのメール通知設定を確認
    if (user?.email_preferences?.enabled === false) {
      return
    }

    const emailTemplate = templates[template]
    if (!emailTemplate) {
      throw new Error(`Template ${template} not found`)
    }

    // テンプレートの変数を置換
    let subject = emailTemplate.subject
    let body = emailTemplate.body

    Object.entries(variables).forEach(([key, value]) => {
      const regex = new RegExp(`{${key}}`, 'g')
      subject = subject.replace(regex, value)
      body = body.replace(regex, value)
    })

    // SendGridでメール送信
    const msg = {
      to,
      from: process.env.SENDGRID_FROM_EMAIL!,
      subject,
      text: body,
      html: body.replace(/\n/g, '<br>'),
    }

    await sgMail.send(msg)
    return true
  } catch (error) {
    console.error('Email sending error:', error)
    throw error
  }
} 