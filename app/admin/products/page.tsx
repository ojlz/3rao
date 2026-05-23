"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Plus, Trash2 } from "lucide-react"
import type { Product } from "@/types"

export default function AdminProducts() {
  const [authenticated, setAuthenticated] = useState(false)
  const [products, setProducts] = useState<Product[]>([])
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ name: "", description: "", price: "", category: "", imageUrl: "", complements: "" })
  const router = useRouter()

  useEffect(() => {
    fetch("/api/admin/check")
      .then((r) => r.json())
      .then((data) => {
        if (!data.authenticated) router.push("/admin/login")
        else setAuthenticated(true)
      })
    fetchProducts()
  }, [router])

  async function fetchProducts() {
    const res = await fetch("/api/products")
    const data = await res.json()
    setProducts(data.products)
  }

  async function saveProduct() {
    const complements = form.complements
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean)
      .map((name) => ({ name, price: 0, max: 1 }))

    const res = await fetch("/api/products", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: form.name,
        description: form.description,
        price: Math.round(parseFloat(form.price.replace(",", ".")) * 100),
        category: form.category,
        imageUrl: form.imageUrl,
        complements,
      }),
    })
    if (res.ok) {
      setShowForm(false)
      setForm({ name: "", description: "", price: "", category: "", imageUrl: "", complements: "" })
      fetchProducts()
    }
  }

  async function removeProduct(id: string) {
    const res = await fetch(`/api/products?id=${id}`, { method: "DELETE" })
    if (res.ok) fetchProducts()
  }

  if (!authenticated) return null

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-40 bg-[#1D150D]/95 backdrop-blur-sm border-b border-marrom/30">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-lg font-bold text-bege">Produtos</h1>
          <nav className="flex gap-2 text-xs items-center">
            <a href="/admin/dashboard" className="text-marrom hover:text-bege">Dashboard</a>
            <a href="/admin/products" className="text-bege">Produtos</a>
            <a href="/admin/orders" className="text-marrom hover:text-bege">Pedidos</a>
            <a href="/admin/fichas" className="text-marrom hover:text-bege">Fichas</a>
            <a href="/admin/scanner" className="text-marrom hover:text-bege">Scanner</a>
            <a href="/" className="text-marrom/50 hover:text-bege border-l border-marrom/30 pl-2 ml-1">←</a>
          </nav>
          <button onClick={() => setShowForm(!showForm)} className="w-9 h-9 bg-bordo rounded-lg flex items-center justify-center">
            <Plus className="w-5 h-5 text-white" />
          </button>
        </div>
      </header>
      <main className="max-w-4xl mx-auto px-4 py-6">
        {showForm && (
          <div className="card mb-6 space-y-3">
            <input placeholder="Nome" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            <input placeholder="Descrição" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            <input placeholder="Preço (ex: 15,00)" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} />
            <input placeholder="URL da imagem (opcional)" value={form.imageUrl} onChange={(e) => setForm({ ...form, imageUrl: e.target.value })} />
            <input placeholder="Categoria" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} />
            <input placeholder="Complementos separados por vírgula" value={form.complements} onChange={(e) => setForm({ ...form, complements: e.target.value })} />
            <button onClick={saveProduct} className="btn-primary">Salvar</button>
          </div>
        )}
        <div className="grid gap-4">
          {products.map((product) => (
            <div key={product.id} className="card flex items-center gap-4">
              {product.imageUrl && (
                <div className="w-16 h-16 rounded-xl overflow-hidden shrink-0 bg-dark">
                  <img src={product.imageUrl} alt="" className="w-full h-full object-cover" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <h3 className="text-bege font-semibold truncate">{product.name}</h3>
                {product.description && <p className="text-marrom text-xs truncate">{product.description}</p>}
                <p className="text-white font-bold mt-1">R$ {(product.price / 100).toFixed(2).replace(".", ",")}</p>
              </div>
              <button onClick={() => removeProduct(product.id)} className="w-9 h-9 border border-red-400/30 rounded-lg flex items-center justify-center text-red-400 hover:bg-red-400/10 shrink-0">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      </main>
    </div>
  )
}
