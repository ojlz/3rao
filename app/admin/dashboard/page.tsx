"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { CheckCircle, Clock, Package } from "lucide-react"
import type { Order } from "@/types"

function formatPrice(cents: number): string {
  return `R$ ${(cents / 100).toFixed(2).replace(".", ",")}`
}

export default function AdminDashboard() {
  const [authenticated, setAuthenticated] = useState(false)
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
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

  async function approveOrder(orderId: string) {
    const res = await fetch("/api/orders/approve", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderId }),
    })
    if (res.ok) fetchOrders()
  }

  if (!authenticated) return null

  const pending = orders.filter((o) => o.status === "pending")
  const approved = orders.filter((o) => o.status === "approved")
  const delivered = orders.filter((o) => o.status === "delivered")

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

        <div className="grid grid-cols-3 gap-3 mb-6">
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
                <button
                  onClick={() => approveOrder(order.id)}
                  className="btn-primary text-sm py-2"
                >
                  Aprovar Pagamento
                </button>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
