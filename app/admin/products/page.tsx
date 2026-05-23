"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Plus, Trash2, Pencil, ChevronUp, ChevronDown, Layout } from "lucide-react"
import type { Product } from "@/types"

export default function AdminProducts() {
  const [authenticated, setAuthenticated] = useState(false)
  const [products, setProducts] = useState<Product[]>([])
  const [categoryOrder, setCategoryOrder] = useState<string[]>([])
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
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
    fetchCategoryOrder()
  }, [router])

  function openNewForm() {
    setEditingId(null)
    setForm({ name: "", description: "", price: "", category: "", imageUrl: "", complements: "" })
    setShowForm(true)
  }

  function openEditForm(product: Product) {
    setEditingId(product.id)
    setForm({
      name: product.name,
      description: product.description,
      price: (product.price / 100).toFixed(2).replace(".", ","),
      category: product.category,
      imageUrl: product.imageUrl,
      complements: product.complements.map((c) => c.name).join(", "),
    })
    setShowForm(true)
  }

  async function fetchProducts() {
    const res = await fetch("/api/products")
    const data = await res.json()
    setProducts(data.products)
  }

  async function fetchCategoryOrder() {
    const res = await fetch("/api/categories")
    const data = await res.json()
    setCategoryOrder(data.order || [])
  }

  async function saveProduct() {
    const complements = form.complements
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean)
      .map((name) => ({ name, price: 0, max: 1 }))

    const body: Record<string, unknown> = {
      name: form.name,
      description: form.description,
      price: Math.round(parseFloat(form.price.replace(",", ".")) * 100),
      category: form.category,
      imageUrl: form.imageUrl,
      complements,
    }

    if (editingId) body.id = editingId

    const res = await fetch("/api/products", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    })
    if (res.ok) {
      setShowForm(false)
      setEditingId(null)
      setForm({ name: "", description: "", price: "", category: "", imageUrl: "", complements: "" })
      fetchProducts()
      fetchCategoryOrder()
    }
  }

  async function removeProduct(id: string) {
    if (!confirm("Excluir este produto?")) return
    const res = await fetch(`/api/products?id=${id}`, { method: "DELETE" })
    if (res.ok) fetchProducts()
  }

  async function moveProduct(index: number, direction: -1 | 1) {
    const target = index + direction
    if (target < 0 || target >= products.length) return

    const ids = products.map((p) => p.id)
    ;[ids[index], ids[target]] = [ids[target], ids[index]]

    const res = await fetch("/api/products", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids }),
    })
    if (res.ok) fetchProducts()
  }

  async function moveCategory(index: number, direction: -1 | 1) {
    const target = index + direction
    if (target < 0 || target >= categoryOrder.length) return

    const newOrder = [...categoryOrder]
    ;[newOrder[index], newOrder[target]] = [newOrder[target], newOrder[index]]

    const res = await fetch("/api/categories", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ order: newOrder }),
    })
    if (res.ok) setCategoryOrder(newOrder)
  }

  const usedCategories = Array.from(new Set(products.map((p) => p.category || "geral")))
  const orderedCategories = categoryOrder.filter((c) => usedCategories.includes(c))
  const missingCategories = usedCategories.filter((c) => !categoryOrder.includes(c))
  const allOrdered = [...orderedCategories, ...missingCategories]

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
          <button onClick={openNewForm} className="w-9 h-9 bg-bordo rounded-lg flex items-center justify-center">
            <Plus className="w-5 h-5 text-white" />
          </button>
        </div>
      </header>
      <main className="max-w-4xl mx-auto px-4 py-6">
        {showForm && (
          <div className="card mb-6 space-y-3">
            <h3 className="text-bege font-semibold text-sm">{editingId ? "Editar" : "Novo"} Produto</h3>
            <input placeholder="Nome" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            <input placeholder="Descrição" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            <input placeholder="Preço (ex: 15,00)" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} />
            <input placeholder="URL da imagem (opcional)" value={form.imageUrl} onChange={(e) => setForm({ ...form, imageUrl: e.target.value })} />
            <input placeholder="Categoria" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} />
            <input placeholder="Complementos separados por vírgula" value={form.complements} onChange={(e) => setForm({ ...form, complements: e.target.value })} />
            <div className="flex gap-2">
              <button onClick={saveProduct} className="btn-primary flex-1">Salvar</button>
              <button onClick={() => { setShowForm(false); setEditingId(null) }} className="btn-secondary">Cancelar</button>
            </div>
          </div>
        )}

        {allOrdered.length > 1 && (
          <div className="card mb-6">
            <div className="flex items-center gap-2 mb-3">
              <Layout className="w-4 h-4 text-marrom" />
              <h3 className="text-sm font-semibold text-bege">Ordem das Categorias</h3>
            </div>
            <div className="space-y-2">
              {allOrdered.map((cat, index) => (
                <div key={cat} className="flex items-center gap-3 bg-dark rounded-lg px-3 py-2">
                  <div className="flex flex-col items-center gap-0.5">
                    <button
                      onClick={() => moveCategory(index, -1)}
                      disabled={index === 0}
                      className="w-5 h-5 flex items-center justify-center text-marrom hover:text-bege disabled:opacity-20 disabled:cursor-not-allowed"
                    >
                      <ChevronUp className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => moveCategory(index, 1)}
                      disabled={index === allOrdered.length - 1}
                      className="w-5 h-5 flex items-center justify-center text-marrom hover:text-bege disabled:opacity-20 disabled:cursor-not-allowed"
                    >
                      <ChevronDown className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <span className="text-sm text-bege font-medium capitalize">{cat}</span>
                  <span className="text-[10px] text-marrom ml-auto">{products.filter((p) => (p.category || "geral") === cat).length} itens</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="grid gap-4">
          {products.map((product, index) => (
            <div key={product.id} className="card flex items-center gap-4">
              <div className="flex flex-col items-center gap-1 shrink-0">
                <button
                  onClick={() => moveProduct(index, -1)}
                  disabled={index === 0}
                  className="w-7 h-7 flex items-center justify-center text-marrom hover:text-bege disabled:opacity-20 disabled:cursor-not-allowed rounded"
                >
                  <ChevronUp className="w-4 h-4" />
                </button>
                <span className="text-[10px] text-marrom font-mono">{index + 1}</span>
                <button
                  onClick={() => moveProduct(index, 1)}
                  disabled={index === products.length - 1}
                  className="w-7 h-7 flex items-center justify-center text-marrom hover:text-bege disabled:opacity-20 disabled:cursor-not-allowed rounded"
                >
                  <ChevronDown className="w-4 h-4" />
                </button>
              </div>
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
              <div className="flex gap-2 shrink-0">
                <button onClick={() => openEditForm(product)} className="w-9 h-9 border border-marrom/40 rounded-lg flex items-center justify-center text-marrom hover:text-bege hover:border-bege/40">
                  <Pencil className="w-4 h-4" />
                </button>
                <button onClick={() => removeProduct(product.id)} className="w-9 h-9 border border-red-400/30 rounded-lg flex items-center justify-center text-red-400 hover:bg-red-400/10 shrink-0">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  )
}
