"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import type { Order } from "@/types"

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/")
  const rawData = atob(base64)
  const output = new Uint8Array(rawData.length)
  for (let i = 0; i < rawData.length; i++) {
    output[i] = rawData.charCodeAt(i)
  }
  return output
}

export default function AdminOrders() {
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

  useEffect(() => {
    if (!authenticated) return
    if (!("Notification" in window)) return
    if (Notification.permission === "granted") {
      subscribePush()
    } else if (Notification.permission === "default") {
      Notification.requestPermission().then((permission) => {
        if (permission === "granted") subscribePush()
      })
    }
  }, [authenticated])

  async function subscribePush() {
    try {
      const registration = await navigator.serviceWorker.register("/sw.js")
      const existing = await registration.pushManager.getSubscription()
      if (existing) return
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || "") as any,
      })
      await fetch("/api/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subscription }),
      })
    } catch (e) {
      console.error("Push subscribe error:", e)
    }
  }

  async function fetchOrders() {
    const res = await fetch("/api/orders")
    const data = await res.json()
    setOrders(data.orders || [])
  }

  async function approveOrder(orderId: string) {
    await fetch("/api/orders/approve", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderId }),
    })
    fetchOrders()
  }

  if (!authenticated) return null

  const statusOrder = { pending: 0, approved: 1, delivered: 2, cancelled: 3 }
  const sorted = [...orders].sort((a, b) => (statusOrder[a.status] || 0) - (statusOrder[b.status] || 0))

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-40 bg-[#1D150D]/95 backdrop-blur-sm border-b border-marrom/30">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-lg font-bold text-bege">Pedidos</h1>
          <nav className="flex gap-2 text-xs items-center">
            <a href="/admin/dashboard" className="text-marrom hover:text-bege">Dashboard</a>
            <a href="/admin/products" className="text-marrom hover:text-bege">Produtos</a>
            <a href="/admin/orders" className="text-bege">Pedidos</a>
            <a href="/admin/fichas" className="text-marrom hover:text-bege">Fichas</a>
            <a href="/admin/scanner" className="text-marrom hover:text-bege">Scanner</a>
            <a href="/" className="text-marrom/50 hover:text-bege border-l border-marrom/30 pl-2 ml-1">←</a>
          </nav>
        </div>
      </header>
      <main className="max-w-4xl mx-auto px-4 py-6">
        <div className="space-y-4">
          {sorted.map((order) => (
            <div key={order.id} className="card">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h3 className="text-bege font-semibold">{order.customerName}</h3>
                  <p className="text-marrom text-sm">{order.customerPhone}</p>
                  <p className="text-marrom text-xs">#{order.id}</p>
                </div>
                <div className="text-right">
                  <span className="text-white font-bold">R$ {(order.totalPrice / 100).toFixed(2).replace(".", ",")}</span>
                  <p className={`text-xs mt-1 ${
                    order.status === "pending" ? "text-yellow-400" :
                    order.status === "approved" ? "text-green-400" :
                    order.status === "delivered" ? "text-blue-400" : "text-red-400"
                  }`}>
                    {order.status === "pending" ? "Pendente" :
                     order.status === "approved" ? "Aprovado" :
                     order.status === "delivered" ? "Entregue" : "Cancelado"}
                  </p>
                </div>
              </div>
              <div className="text-sm text-marrom mb-3">
                {order.items.map((item, i) => (
                  <p key={i}>{item.quantity}x {item.productName}{item.complements.length > 0 && ` (+${item.complements.join(", ")})`}</p>
                ))}
              </div>
              {order.status === "pending" && (
                <div className="flex gap-2">
                  <button onClick={() => approveOrder(order.id)} className="btn-primary text-sm py-2">Aprovar</button>
                </div>
              )}
            </div>
          ))}
        </div>
      </main>
    </div>
  )
}
