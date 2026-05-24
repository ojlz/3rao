import type { Metadata, Viewport } from "next"
import { Outfit } from "next/font/google"
import "./globals.css"

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
})

export const metadata: Metadata = {
  title: "Espetão do Terceirão",
  description: "Pré-venda de espetinhos para formatura do Terceirão",
  openGraph: {
    title: "Espetão do Terceirão",
    description: "Pré-venda de espetinhos para formatura do Terceirão",
    type: "website",
    locale: "pt_BR",
  },
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={outfit.variable}>
      <body className="min-h-screen gradient-bg font-sans">
        <div className="noise-overlay" />
        {children}
      </body>
    </html>
  )
}
