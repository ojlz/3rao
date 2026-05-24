"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import type { Order } from "@/types"

export default function AdminFichas() {
  const [authenticated, setAuthenticated] = useState(false)
  const [orders, setOrders] = useState<Order[]>([])
  const router = useRouter()

  useEffect(() => {
    fetch("/api/admin/check")
      .then((r) => r.json())
      .then((data) => {
        if (!data.authenticated) router.push("/admin/login")
        else setAuthenticated(true)
      })
    fetchOrders()
  }, [router])

  async function fetchOrders() {
    const res = await fetch("/api/orders")
    const data = await res.json()
    setOrders(data.orders || [])
  }

  if (!authenticated) return null

  const approvedOrders = orders.filter((o) => o.status === "approved" || o.status === "delivered")

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-40 bg-dark/95 backdrop-blur-sm border-b border-marrom/30">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-lg font-bold text-bege">Fichas</h1>
          <nav className="flex gap-2 text-xs items-center">
            <a href="/admin/dashboard" className="text-marrom hover:text-bege">Dashboard</a>
            <a href="/admin/products" className="text-marrom hover:text-bege">Produtos</a>
            <a href="/admin/orders" className="text-marrom hover:text-bege">Pedidos</a>
            <a href="/admin/fichas" className="text-bege">Fichas</a>
            <a href="/admin/scanner" className="text-marrom hover:text-bege">Scanner</a>
            <a href="/" className="text-marrom/50 hover:text-bege border-l border-marrom/30 pl-2 ml-1">←</a>
          </nav>
        </div>
      </header>
      <main className="max-w-4xl mx-auto px-4 py-6">
        <div className="space-y-4">
          {approvedOrders.map((order) => (
            <div key={order.id} className="card">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h3 className="text-bege font-semibold">{order.customerName}</h3>
                  <p className="text-marrom text-sm">{order.customerPhone}</p>
                </div>
                <span className={`text-xs px-2 py-1 rounded-full ${
                  order.status === "delivered" ? "bg-blue-400/20 text-blue-400" : "bg-green-400/20 text-green-400"
                }`}>
                  {order.status === "delivered" ? "Usado" : "Ativo"}
                </span>
              </div>
              <div className="text-sm text-marrom mb-2">
                {order.items.map((item, i) => (
                  <p key={i}>{item.quantity}x {item.productName}</p>
                ))}
              </div>
              <div className="flex items-center gap-2 text-xs">
                <span className="text-marrom">Token:</span>
                <code className="text-bege bg-dark px-2 py-0.5 rounded">{order.token}</code>
                <button
                  onClick={() => navigator.clipboard.writeText(order.token)}
                  className="text-marrom hover:text-bege ml-auto"
                >
                  Copiar
                </button>
              </div>
            </div>
          ))}
          {approvedOrders.length === 0 && (
            <p className="text-marrom text-center py-8">Nenhuma ficha emitida</p>
          )}
        </div>
      </main>
    </div>
  )
}
