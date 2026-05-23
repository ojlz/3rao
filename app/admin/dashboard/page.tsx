"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { CheckCircle, Clock, Package, DollarSign, Trash2, RotateCcw, X } from "lucide-react"
import type { Order } from "@/types"

function formatPrice(cents: number): string {
  return `R$ ${(cents / 100).toFixed(2).replace(".", ",")}`
}

export default function AdminDashboard() {
  const [authenticated, setAuthenticated] = useState(false)
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [toast, setToast] = useState<{ orderId: string; name: string } | null>(null)
  const router = useRouter()

  useEffect(() => {
    fetch("/api/admin/check")
      .then((r) => r.json())
      .then((data) => {
        if (!data.authenticated) {
          router.push("/admin/login")
        } else {
          setAuthenticated(true)
          fetchOrders()
        }
      })
  }, [router])

  async function fetchOrders() {
    try {
      const res = await fetch("/api/orders")
      const data = await res.json()
      setOrders(data.orders || [])
    } catch (e) {
      console.error(e)
    }
    setLoading(false)
  }

  async function approveOrder(orderId: string, customerName: string) {
    const res = await fetch("/api/orders/approve", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderId }),
    })
    if (res.ok) {
      fetchOrders()
      setToast({ orderId, name: customerName })
    }
  }

  async function undoApprove(orderId: string) {
    const res = await fetch("/api/orders/undo", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderId }),
    })
    if (res.ok) {
      setToast(null)
      fetchOrders()
    }
  }

  async function deletePendingOrder(orderId: string) {
    if (!confirm("Excluir este pedido pendente?")) return
    const res = await fetch(`/api/orders?id=${orderId}`, { method: "DELETE" })
    if (res.ok) fetchOrders()
  }

  useEffect(() => {
    if (!toast) return
    const timer = setTimeout(() => setToast(null), 5000)
    return () => clearTimeout(timer)
  }, [toast])

  if (!authenticated) return null

  const pending = orders.filter((o) => o.status === "pending")
  const approved = orders.filter((o) => o.status === "approved")
  const delivered = orders.filter((o) => o.status === "delivered")
  const revenue = [...approved, ...delivered].reduce((acc, o) => acc + o.totalPrice, 0)

  return (
    <div className="min-h-screen pb-20">
      <header className="sticky top-0 z-40 bg-[#1D150D]/95 backdrop-blur-sm border-b border-marrom/30">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <h1 className="text-lg font-bold text-bege">Admin</h1>
          <nav className="flex gap-2 text-xs items-center">
            <a href="/admin/dashboard" className="text-bege">Dashboard</a>
            <a href="/admin/products" className="text-marrom hover:text-bege">Produtos</a>
            <a href="/admin/orders" className="text-marrom hover:text-bege">Pedidos</a>
            <a href="/admin/fichas" className="text-marrom hover:text-bege">Fichas</a>
            <a href="/admin/scanner" className="text-marrom hover:text-bege">Scanner</a>
            <a href="/" className="text-marrom/50 hover:text-bege border-l border-marrom/30 pl-2 ml-1">←</a>
          </nav>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6">

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          <div className="card text-center py-4">
            <Clock className="w-5 h-5 text-yellow-400 mx-auto mb-1" />
            <p className="text-2xl font-bold text-bege">{pending.length}</p>
            <p className="text-[10px] text-marrom uppercase tracking-wide">Pendentes</p>
          </div>
          <div className="card text-center py-4">
            <CheckCircle className="w-5 h-5 text-green-400 mx-auto mb-1" />
            <p className="text-2xl font-bold text-bege">{approved.length}</p>
            <p className="text-[10px] text-marrom uppercase tracking-wide">Aprovados</p>
          </div>
          <div className="card text-center py-4">
            <Package className="w-5 h-5 text-blue-400 mx-auto mb-1" />
            <p className="text-2xl font-bold text-bege">{delivered.length}</p>
            <p className="text-[10px] text-marrom uppercase tracking-wide">Entregues</p>
          </div>
          <div className="card text-center py-4 border-green-500/20">
            <DollarSign className="w-5 h-5 text-green-400 mx-auto mb-1" />
            <p className="text-2xl font-bold text-bege">{formatPrice(revenue)}</p>
            <p className="text-[10px] text-marrom uppercase tracking-wide">Faturamento</p>
          </div>
        </div>

        <h2 className="text-lg font-semibold text-bege mb-4">Pedidos Pendentes</h2>
        {loading ? (
          <p className="text-marrom">Carregando...</p>
        ) : pending.length === 0 ? (
          <p className="text-marrom text-center py-8">Nenhum pedido pendente</p>
        ) : (
          <div className="space-y-3">
            {pending.map((order) => (
              <div key={order.id} className="card">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h3 className="text-bege font-semibold">{order.customerName}</h3>
                    <p className="text-marrom text-xs">{order.customerPhone}</p>
                    <p className="text-marrom text-[10px]">#{order.id}</p>
                  </div>
                  <span className="text-white font-bold tabular-nums">{formatPrice(order.totalPrice)}</span>
                </div>
                <div className="text-xs text-marrom mb-3">
                  {order.items.map((item, i) => (
                    <p key={i}>{item.quantity}x {item.productName}</p>
                  ))}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => approveOrder(order.id, order.customerName)}
                    className="btn-primary text-sm py-2 flex-1"
                  >
                    Aprovar Pagamento
                  </button>
                  <button
                    onClick={() => deletePendingOrder(order.id)}
                    className="w-10 h-10 border border-red-400/30 rounded-xl flex items-center justify-center text-red-400 hover:bg-red-400/10 shrink-0"
                    title="Excluir pedido"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="mt-12 pt-6 border-t border-marrom/20">
          <button
            onClick={async () => {
              if (!confirm("Tem certeza? Isso vai apagar TODOS os pedidos e fichas. Os produtos não serão afetados.")) return
              if (!confirm("Essa ação não pode ser desfeita. Continuar?")) return
              const res = await fetch("/api/admin/reset", { method: "POST" })
              if (res.ok) {
                fetchOrders()
              } else {
                alert("Erro ao resetar")
              }
            }}
            className="flex items-center gap-2 text-xs text-red-400/60 hover:text-red-400 transition-colors mx-auto"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Resetar pedidos e fichas
          </button>
        </div>
      </main>

      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-[90%] max-w-sm"
          >
            <div className="bg-green-900/90 backdrop-blur-sm border border-green-500/30 rounded-xl px-4 py-3 flex items-center gap-3 shadow-lg">
              <CheckCircle className="w-5 h-5 text-green-400 shrink-0" />
              <p className="text-sm text-green-100 flex-1">
                Pedido de <span className="font-semibold">{toast.name}</span> aprovado
              </p>
              <button
                onClick={() => undoApprove(toast.orderId)}
                className="flex items-center gap-1 text-xs font-medium text-yellow-300 hover:text-yellow-200 bg-yellow-400/10 px-2.5 py-1.5 rounded-lg transition shrink-0"
              >
                <RotateCcw className="w-3 h-3" />
                Desfazer
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
