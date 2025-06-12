import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { cn } from '@/lib/utils'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Dutch Treat',
  description: 'グループでの支払いを管理しましょう。',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ja" className="h-full">
      <body className={cn(inter.className, 'h-full bg-gray-50')}>
        <div className="min-h-full">
          {children}
        </div>
      </body>
    </html>
  )
} 