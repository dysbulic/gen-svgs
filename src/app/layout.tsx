import './globals.css'
import { Inter } from 'next/font/google'

const inter = Inter({ subsets: ['latin'] })

export const metadata = {
  title: 'Generate SVGs',
  description: 'Creates MetaGame player card SVGs from a Hasura JSON dump.',
  colorScheme: 'dark light',
}

export default function RootLayout(
  { children }: { children: React.ReactNode }
) {
  return (
    <html lang="en">
      <body className={inter.className}>{children}</body>
    </html>
  )
}
