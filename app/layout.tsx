import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { cn } from '@/lib/utils'
import HtmlClassProvider from './components/HtmlClassProvider'
import DarkModeProvider from './components/DarkModeProvider'
import NavMenu from './components/NavMenu'

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
    <html lang="ja" className="h-full" suppressHydrationWarning>
      <body className={cn(inter.className)}>
        <DarkModeProvider>
          <script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-7578897320709624" crossOrigin="anonymous"></script>
          <div className="min-h-full">
            {children}
            <NavMenu />
          </div>
        </DarkModeProvider>
      </body>
    </html>
  )
} 