"use client"

import { useState, useEffect } from "react"
import { useParams, useSearchParams } from "next/navigation"
import { motion } from "framer-motion"
import QRCode from "qrcode"
import { Check, Clock, Package, Copy, Download } from "lucide-react"
import type { Order } from "@/types"

function copyToClipboard(text: string): Promise<boolean> {
  if (navigator.clipboard?.writeText) {
    return navigator.clipboard.writeText(text).then(() => true).catch(() => false)
  }
  try {
    const ta = document.createElement("textarea")
    ta.value = text
    ta.style.position = "fixed"
    ta.style.opacity = "0"
    document.body.appendChild(ta)
    ta.select()
    document.execCommand("copy")
    document.body.removeChild(ta)
    return Promise.resolve(true)
  } catch {
    return Promise.resolve(false)
  }
}

export default function OrderPage() {
  const params = useParams()
  const searchParams = useSearchParams()
  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [qrDataUrl, setQrDataUrl] = useState("")
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    const id = params.id as string
    const token = searchParams.get("token")

    if (!id || !token) {
      setError("Link inválido")
      setLoading(false)
      return
    }

    fetch(`/api/orders?id=${id}&token=${token}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.error) {
          setError(data.error)
        } else {
          setOrder(data.order)
          if (data.order.status === "approved" || data.order.status === "delivered") {
            QRCode.toDataURL(token, {
              width: 300,
              margin: 2,
              color: { dark: "#1D150D", light: "#E8D5B7" },
            }).then(setQrDataUrl)
          }
        }
        setLoading(false)
      })
      .catch(() => {
        setError("Erro ao carregar pedido")
        setLoading(false)
      })
  }, [params.id, searchParams])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex gap-2">
          <motion.div className="w-3 h-3 bg-bordo rounded-full loading-dot" />
          <motion.div className="w-3 h-3 bg-bordo rounded-full loading-dot" />
          <motion.div className="w-3 h-3 bg-bordo rounded-full loading-dot" />
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="card text-center max-w-sm w-full"
        >
          <div className="w-14 h-14 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-3">
            <span className="text-2xl text-red-400">!</span>
          </div>
          <h2 className="text-lg font-bold text-red-400 mb-1">Erro</h2>
          <p className="text-marrom text-sm mb-4">{error}</p>
          <a href="/" className="btn-secondary text-sm inline-block w-full text-center">Voltar</a>
        </motion.div>
      </div>
    )
  }

  if (!order) return null

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-40 bg-[#1D150D]/95 backdrop-blur-sm border-b border-marrom/30">
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center justify-between">
          <h1 className="text-base font-bold text-bege">Pedido #{order.id}</h1>
          <a
            href="/"
            className="text-xs text-marrom hover:text-bege transition"
          >
            Novo pedido
          </a>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 pt-6 pb-20">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-6"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 200 }}
            className={`w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-3 ${
              order.status === "pending" ? "bg-yellow-400/20" :
              order.status === "approved" ? "bg-green-400/20" :
              order.status === "delivered" ? "bg-blue-400/20" : "bg-red-400/20"
            }`}
          >
            {order.status === "pending" && <Clock className="w-6 h-6 text-yellow-400" />}
            {order.status === "approved" && <Check className="w-6 h-6 text-green-400" />}
            {order.status === "delivered" && <Package className="w-6 h-6 text-blue-400" />}
          </motion.div>
          <p className={`font-semibold ${
            order.status === "pending" ? "text-yellow-400" :
            order.status === "approved" ? "text-green-400" :
            order.status === "delivered" ? "text-blue-400" : "text-red-400"
          }`}>
            {order.status === "pending" ? "Pagamento aguardando aprovação" :
             order.status === "approved" ? "Pagamento aprovado" :
             order.status === "delivered" ? "Retirado" : "Cancelado"}
          </p>
          <p className="text-marrom text-xs mt-1">{order.customerName}</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="card mb-4"
        >
          <h3 className="text-bege font-semibold mb-3 text-sm">Itens</h3>
          {order.items.map((item, i) => (
            <div key={i} className="flex justify-between text-sm text-marrom py-1.5 border-b border-marrom/10 last:border-0">
              <span>{item.quantity}x {item.productName}</span>
              <span className="text-bege tabular-nums">R$ {(item.price * item.quantity / 100).toFixed(2).replace(".", ",")}</span>
            </div>
          ))}
          <div className="border-t border-marrom/30 mt-3 pt-3 flex justify-between font-bold">
            <span className="text-bege">Total</span>
            <span className="text-white tabular-nums">R$ {(order.totalPrice / 100).toFixed(2).replace(".", ",")}</span>
          </div>
        </motion.div>

        {(order.status === "approved" || order.status === "delivered") && qrDataUrl && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className="card border-green-400/30 text-center mb-4"
          >
            <p className="text-green-400 font-semibold text-sm mb-3">✅ Pedido aprovado!</p>
            <div className="bg-bege/10 rounded-xl p-3 inline-block mx-auto">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={qrDataUrl}
                alt="QR Code da ficha"
                className="w-48 h-48 mx-auto"
              />
            </div>
            <p className="text-[10px] text-marrom mt-2 uppercase tracking-wide">
              Apresente este QR no dia da retirada
            </p>
            <a
              href={`/api/ticket-image/${order.token}`}
              download={`ficha-${order.id}.png`}
              className="btn-primary text-sm py-2 mt-3 inline-flex items-center justify-center gap-2 w-full"
            >
              <Download className="w-4 h-4" />
              Baixar ficha
            </a>
          </motion.div>
        )}

        {order.status === "pending" && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="card border-yellow-400/30"
          >
            <p className="text-sm text-marrom text-center">
              Faça o PIX e aguarde a aprovação.
            </p>
            <div className="bg-yellow-400/10 border border-yellow-400/20 rounded-lg p-3 mt-3">
              <p className="text-xs text-yellow-300 font-semibold text-center">
                ⚠️ Salve o link abaixo para acompanhar seu pedido!
              </p>
              <p className="text-[10px] text-marrom text-center mt-1">
                Quando o pagamento for aprovado, a ficha aparecerá aqui. Volte nesta página para fazer o download.
              </p>
            </div>
          </motion.div>
        )}

        {order.status === "delivered" && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="card border-blue-400/30 text-center"
          >
            <p className="text-blue-400 font-semibold text-sm">📦 Retirado com sucesso!</p>
          </motion.div>
        )}

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="card mt-4"
        >
          <p className="text-xs text-yellow-300 font-semibold text-center mb-2">
            🔗 Guarde este link para acessar seu pedido
          </p>
          <div className="flex items-center gap-2 bg-marrom/10 rounded-lg p-3">
            <code className="flex-1 text-xs font-mono text-bege break-all select-all">
              {typeof window !== "undefined" && `${window.location.origin}/pedido/${order.id}?token=${order.token}`}
            </code>
            <button
              onClick={async () => {
                const url = typeof window !== "undefined" ? `${window.location.origin}/pedido/${order.id}?token=${order.token}` : order.token
                const ok = await copyToClipboard(url)
                if (ok) {
                  setCopied(true)
                  setTimeout(() => setCopied(false), 2000)
                }
              }}
              className="shrink-0 w-8 h-8 flex items-center justify-center text-marrom hover:text-bege rounded-lg hover:bg-marrom/10 transition"
              title="Copiar link"
            >
              {copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>
          <p className="text-[10px] text-marrom text-center mt-2">
            Salve este link para voltar e ver sua ficha quando for aprovado.
          </p>
        </motion.div>
      </main>
    </div>
  )
}
