"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { ShoppingCart, Plus, Minus, Check, Send, Phone, User, ChevronRight, Shield, Copy, ImageOff, Scale } from "lucide-react"
import type { Product, OrderItem } from "@/types"

function formatPrice(cents: number): string {
  return `R$ ${(cents / 100).toFixed(2).replace(".", ",")}`
}

function LoadingScreen() {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-dark">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-center"
      >
        <motion.div
          animate={{ rotate: [0, 10, 0, -10, 0] }}
          transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
          className="w-14 h-14 bg-bordo/20 rounded-full flex items-center justify-center mx-auto mb-4"
        >
          <Scale className="w-7 h-7 text-bege" />
        </motion.div>
        <h1 className="text-3xl font-bold text-bege mb-2 text-balance tracking-tight">Espetão do Terceirão</h1>
        <p className="text-sm text-marrom mb-4">Terceirão</p>
        <div className="flex gap-2 justify-center">
          <motion.div className="w-3 h-3 bg-bordo rounded-full loading-dot" />
          <motion.div className="w-3 h-3 bg-bordo rounded-full loading-dot" />
          <motion.div className="w-3 h-3 bg-bordo rounded-full loading-dot" />
        </div>
      </motion.div>
    </div>
  )
}

function EmailInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const isValid = value.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)

  return (
    <div>
      <label className="text-sm text-marrom block mb-1">
        <span className="inline mr-1">@</span>
        E-mail
      </label>
      <div className="relative">
        <input
          type="email"
          inputMode="email"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="seu@email.com"
          className={isValid && value.length > 0 ? "border-green-500/50" : ""}
        />
        {isValid && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute right-3 top-1/2 -translate-y-1/2"
          >
            <Check className="w-4 h-4 text-green-400" />
          </motion.div>
        )}
      </div>

      {value.length > 0 && !isValid && (
        <p className="text-xs text-red-400 mt-1">Digite um e-mail válido</p>
      )}
    </div>
  )
}

function PhoneInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const display = value.replace(/(\d{2})(\d{5})(\d{4})/, "($1) $2-$3")

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const digits = e.target.value.replace(/\D/g, "").slice(0, 11)
    onChange(digits)
  }

  const isValid = value.length === 11

  return (
    <div>
      <label className="text-sm text-marrom block mb-1">
        <Phone className="w-4 h-4 inline mr-1" />
        WhatsApp com DDD
      </label>
      <div className="relative">
        <input
          type="tel"
          inputMode="numeric"
          value={display}
          onChange={handleChange}
          placeholder="(67) 99999-9999"
          className={`${isValid && value.length > 0 ? "border-green-500/50" : ""}`}
        />
        {isValid && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute right-3 top-1/2 -translate-y-1/2"
          >
            <Check className="w-4 h-4 text-green-400" />
          </motion.div>
        )}
      </div>
      {value.length > 0 && !isValid && (
        <p className="text-xs text-red-400 mt-1">Digite 11 dígitos com DDD</p>
      )}
    </div>
  )
}

function ProductCard({ product, index, cart, imageErrors, setImageErrors, addToCart, removeFromCart, formatPrice }: {
  product: Product
  index: number
  cart: Map<string, { product: Product; quantity: number }>
  imageErrors: Set<string>
  setImageErrors: (fn: (prev: Set<string>) => Set<string>) => void
  addToCart: (p: Product) => void
  removeFromCart: (id: string) => void
  formatPrice: (cents: number) => string
}) {
  return (
    <motion.div
      key={product.id}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      layout
      className="card overflow-hidden p-0"
    >
      <div className="flex">
        {product.imageUrl && !imageErrors.has(product.id) ? (
          <div className="w-28 h-28 shrink-0 bg-dark flex items-center justify-center overflow-hidden rounded-xl">
            <img
              src={product.imageUrl}
              alt={product.name}
              className="w-full h-full object-cover"
              onError={() => setImageErrors((prev) => new Set(prev).add(product.id))}
            />
          </div>
        ) : product.imageUrl ? (
          <div className="w-28 h-28 shrink-0 bg-dark flex items-center justify-center rounded-xl">
            <ImageOff className="w-5 h-5 text-marrom" />
          </div>
        ) : null}
        <div className="flex-1 p-4">
          <div className="flex justify-between items-start">
            <div className="flex-1 min-w-0">
              <h3 className="text-bege font-semibold text-base truncate">{product.name}</h3>
              {product.description && (
                <p className="text-marrom text-xs mt-0.5 line-clamp-2">{product.description}</p>
              )}
              <p className="text-white font-bold text-lg mt-2">{formatPrice(product.price)}</p>
            </div>
          </div>
          <div className="flex items-center justify-between mt-3">
            <AnimatePresence mode="wait">
              {!cart.has(product.id) ? (
                <motion.button
                  key="add"
                  whileTap={{ scale: 0.9 }}
                  onClick={() => addToCart(product)}
                  initial={{ opacity: 0, scale: 0.5 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.5 }}
                  className="w-10 h-10 bg-bordo rounded-xl flex items-center justify-center hover:bg-bordo/80 transition active:scale-95"
                >
                  <Plus className="w-5 h-5 text-white" />
                </motion.button>
              ) : (
                <motion.div
                  key="qty"
                  initial={{ opacity: 0, scale: 0.5 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.5 }}
                  className="flex items-center gap-2"
                >
                  <motion.button
                    whileTap={{ scale: 0.9 }}
                    onClick={() => removeFromCart(product.id)}
                    className="w-8 h-8 rounded-lg bg-bordo flex items-center justify-center text-white"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </motion.button>
                  <span className="text-bege font-bold w-6 text-center tabular-nums">
                    {cart.get(product.id)!.quantity}
                  </span>
                  <motion.button
                    whileTap={{ scale: 0.9 }}
                    onClick={() => addToCart(product)}
                    className="w-8 h-8 rounded-lg bg-green-600 flex items-center justify-center text-white"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </motion.button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </motion.div>
  )
}

export default function Home() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [cart, setCart] = useState<Map<string, { product: Product; quantity: number }>>(new Map())
  const [step, setStep] = useState<"products" | "cart" | "checkout" | "success" | "cancelled">("products")
  const [customerName, setCustomerName] = useState("")
  const [customerPhone, setCustomerPhone] = useState("")
  const [customerEmail, setCustomerEmail] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [orderResult, setOrderResult] = useState<{ orderId: string; token: string; pixKey: string; pixAmount: string; pixName: string } | null>(null)
  const [error, setError] = useState("")
  const [copied, setCopied] = useState(false)
  const [pixCopied, setPixCopied] = useState(false)
  const [cancelling, setCancelling] = useState(false)
  const [cancelled, setCancelled] = useState(false)
  const [imageErrors, setImageErrors] = useState<Set<string>>(new Set())
  const [category, setCategory] = useState("")

  useEffect(() => {
    fetch("/api/products")
      .then((r) => r.json())
      .then((data) => {
        const sorted = (data.products as Product[])
          .filter((p) => p.available)
          .sort((a, b) => a.order - b.order)
        setProducts(sorted)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  const [categoryOrder, setCategoryOrder] = useState<string[]>([])

  useEffect(() => {
    fetch("/api/categories")
      .then((r) => r.json())
      .then((data) => setCategoryOrder(data.order || []))
      .catch(() => {})
  }, [])

  const categoriesRaw = Array.from(new Set(products.map((p) => p.category || "geral")))
  const orderedPart = categoryOrder.filter((c) => categoriesRaw.includes(c))
  const missingPart = categoriesRaw.filter((c) => !categoryOrder.includes(c))
  const categories = [...orderedPart, ...missingPart]
  const filtered = category ? products.filter((p) => (p.category || "geral") === category) : products
  const grouped = category ? null : Object.entries(
    filtered.reduce<Record<string, Product[]>>((acc, p) => {
      const cat = p.category || "geral"
      if (!acc[cat]) acc[cat] = []
      acc[cat].push(p)
      return acc
    }, {})
  ).sort(([a], [b]) => categories.indexOf(a) - categories.indexOf(b))

  const totalItems = Array.from(cart.values()).reduce((acc, item) => acc + item.quantity, 0)
  const totalPrice = Array.from(cart.values()).reduce(
    (acc, item) => acc + item.product.price * item.quantity,
    0
  )

  function addToCart(product: Product) {
    setCart((prev) => {
      const next = new Map(prev)
      const existing = next.get(product.id)
      next.set(product.id, {
        product,
        quantity: existing ? existing.quantity + 1 : 1,
      })
      return next
    })
  }

  function removeFromCart(productId: string) {
    setCart((prev) => {
      const next = new Map(prev)
      const existing = next.get(productId)
      if (existing) {
        if (existing.quantity <= 1) {
          next.delete(productId)
        } else {
          next.set(productId, { ...existing, quantity: existing.quantity - 1 })
        }
      }
      return next
    })
  }

  async function handleCancelOrder() {
    if (!orderResult) return
    if (!confirm("Tem certeza que deseja cancelar este pedido?")) return
    setCancelling(true)
    try {
      const res = await fetch("/api/orders/cancel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId: orderResult.orderId,
          token: orderResult.token,
        }),
      })
      if (res.ok) {
        setCancelled(true)
        setStep("products")
      } else {
        const data = await res.json()
        alert(data.error || "Erro ao cancelar")
      }
    } catch {
      alert("Erro ao cancelar. Tente novamente.")
    }
    setCancelling(false)
  }

  async function handleSubmit() {
    setError("")
    if (!customerName.trim()) {
      setError("Digite seu nome")
      return
    }
    if (customerPhone.length !== 11) {
      setError("Telefone inválido (DDD + 9 dígitos)")
      return
    }
    if (cart.size === 0) {
      setError("Carrinho vazio")
      return
    }

    setSubmitting(true)
    const items: OrderItem[] = Array.from(cart.values()).map((item) => ({
      productId: item.product.id,
      productName: item.product.name,
      quantity: item.quantity,
      price: item.product.price,
      complements: [],
    }))

    try {
      const res = await fetch("/api/orders/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerName: customerName.trim(),
          customerPhone: customerPhone,
          customerEmail: customerEmail.trim(),
          items,
          totalPrice,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error)
        setSubmitting(false)
        return
      }
      setOrderResult(data)
      setStep("success")
      setCart(new Map())

      sessionStorage.setItem(`order_token_${data.orderId}`, data.token)
      localStorage.setItem(`order_token_${data.orderId}`, data.token)
      const link = `${window.location.origin}/pedido/${data.orderId}?token=${data.token}`
      try {
        await navigator.clipboard.writeText(link)
        setCopied(true)
      } catch {}
    } catch {
      setError("Erro ao criar pedido. Tente novamente.")
    }
    setSubmitting(false)
  }

  if (loading) return <LoadingScreen />

  return (
    <div className="min-h-screen pb-32">
      <header className="sticky top-0 z-40 bg-dark/95 backdrop-blur-sm border-b border-marrom/30">
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center justify-between">
          <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}>
            <div className="flex items-center gap-2">
              <Scale className="w-4 h-4 text-bordo" />
              <h1 className="text-lg font-bold text-bege tracking-tight">Espetão do Terceirão</h1>
            </div>
            <p className="text-[10px] text-marrom tracking-[0.15em] uppercase">Pré-venda · Terceirão</p>
          </motion.div>
          <div className="flex items-center gap-2">
            <motion.a
              href="/admin/login"
              whileTap={{ scale: 0.9 }}
              className="w-9 h-9 rounded-lg border border-marrom/50 flex items-center justify-center text-marrom hover:text-bege hover:border-bege transition-colors"
            >
              <Shield className="w-4 h-4" />
            </motion.a>
            <motion.button
              onClick={() => setStep("cart")}
              whileTap={{ scale: 0.9 }}
              className="relative p-2"
            >
              <ShoppingCart className="w-5 h-5 text-bege" />
              <AnimatePresence>
                {totalItems > 0 && (
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    exit={{ scale: 0 }}
                    className="absolute -top-1 -right-1 bg-bordo text-white text-xs w-5 h-5 rounded-full flex items-center justify-center font-bold"
                  >
                    {totalItems}
                  </motion.span>
                )}
              </AnimatePresence>
            </motion.button>
          </div>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 pt-6">
        {step === "products" && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <div className="flex items-center gap-2 mb-4">
              <Scale className="w-4 h-4 text-bordo" />
              <h2 className="text-lg font-semibold text-bege tracking-tight">Cardápio</h2>
            </div>

            <div className="flex gap-2 mb-4 overflow-x-auto pb-1 scrollbar-none">
              <button
                onClick={() => setCategory("")}
                className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                  !category ? "bg-bordo text-white" : "bg-marrom/20 text-marrom hover:text-bege"
                }`}
              >
                Tudo
              </button>
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setCategory(cat)}
                  className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-medium capitalize transition-colors ${
                    category === cat ? "bg-bordo text-white" : "bg-marrom/20 text-marrom hover:text-bege"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            <div className="grid gap-4">
              {category && filtered.map((product, index) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  index={index}
                  cart={cart}
                  imageErrors={imageErrors}
                  setImageErrors={setImageErrors}
                  addToCart={addToCart}
                  removeFromCart={removeFromCart}
                  formatPrice={formatPrice}
                />
              ))}
              {!category && grouped && grouped.map(([cat, prods]) => (
                <div key={cat}>
                  <h3 className="text-sm font-semibold text-marrom uppercase tracking-[0.12em] mb-3 capitalize">{cat}</h3>
                  <div className="grid gap-3">
                    {prods.map((product, index) => (
                      <ProductCard
                        key={product.id}
                        product={product}
                        index={index}
                        cart={cart}
                        imageErrors={imageErrors}
                        setImageErrors={setImageErrors}
                        addToCart={addToCart}
                        removeFromCart={removeFromCart}
                        formatPrice={formatPrice}
                      />
                    ))}
                  </div>
                </div>
              ))}
              {filtered.length === 0 && (
                <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-marrom text-center py-12">
                  Nenhum produto nesta categoria
                </motion.p>
              )}
            </div>
          </motion.div>
        )}

        {step === "cart" && (
          <motion.div initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }}>
            <button
              onClick={() => setStep("products")}
              className="text-marrom text-sm mb-4 hover:text-bege transition flex items-center gap-1"
            >
              <ChevronRight className="w-4 h-4 rotate-180" />
              Continuar comprando
            </button>
            <h2 className="text-lg font-semibold text-bege mb-4 tracking-tight">Carrinho</h2>
            <AnimatePresence>
              {cart.size === 0 ? (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-marrom text-center py-12"
                >
                  Carrinho vazio
                </motion.p>
              ) : (
                <motion.div className="space-y-3">
                  {Array.from(cart.values()).map((item) => (
                    <motion.div
                      key={item.product.id}
                      layout
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="card flex items-center justify-between"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        {item.product.imageUrl && !imageErrors.has(item.product.id) && (
                          <div className="w-12 h-12 rounded-lg overflow-hidden shrink-0 bg-dark">
                            <img
                              src={item.product.imageUrl}
                              alt=""
                              className="w-full h-full object-cover"
                              onError={() => setImageErrors((p) => new Set(p).add(item.product.id))}
                            />
                          </div>
                        )}
                        <div className="min-w-0">
                          <h3 className="text-bege font-medium text-sm truncate">{item.product.name}</h3>
                          <p className="text-marrom text-xs">{formatPrice(item.product.price)} un</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <motion.button
                          whileTap={{ scale: 0.9 }}
                          onClick={() => removeFromCart(item.product.id)}
                          className="w-8 h-8 rounded-lg bg-bordo flex items-center justify-center text-white"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </motion.button>
                        <span className="text-bege font-bold w-6 text-center tabular-nums">{item.quantity}</span>
                        <motion.button
                          whileTap={{ scale: 0.9 }}
                          onClick={() => addToCart(item.product)}
                          className="w-8 h-8 rounded-lg bg-green-600 flex items-center justify-center text-white"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </motion.button>
                      </div>
                    </motion.div>
                  ))}
                  <motion.div
                    layout
                    className="card border-bordo/50"
                  >
                    <div className="flex justify-between items-center">
                      <span className="text-bege font-semibold">Total</span>
                      <span className="text-white font-bold text-xl tabular-nums">{formatPrice(totalPrice)}</span>
                    </div>
                    <motion.button
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setStep("checkout")}
                      className="btn-primary mt-4 flex items-center justify-center gap-2"
                    >
                      Finalizar Pedido
                      <ChevronRight className="w-5 h-5" />
                    </motion.button>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}

        {step === "checkout" && (
          <motion.div initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }}>
            <button
              onClick={() => setStep("cart")}
              className="text-marrom text-sm mb-4 hover:text-bege transition flex items-center gap-1"
            >
              <ChevronRight className="w-4 h-4 rotate-180" />
              Voltar
            </button>
            <h2 className="text-lg font-semibold text-bege mb-4 tracking-tight">Seus dados</h2>
            <div className="space-y-4">
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
              >
                <label className="text-sm text-marrom block mb-1">
                  <User className="w-4 h-4 inline mr-1" />
                  Nome completo
                </label>
                <input
                  type="text"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="Seu nome"
                />
              </motion.div>
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
              >
                <PhoneInput value={customerPhone} onChange={setCustomerPhone} />
              </motion.div>
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }}
              >
                <EmailInput value={customerEmail} onChange={setCustomerEmail} />
              </motion.div>
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="card border-bege/20"
              >
                <h3 className="text-bege font-semibold mb-3 text-sm">Resumo do pedido</h3>
                {Array.from(cart.values()).map((item) => (
                  <div key={item.product.id} className="flex justify-between text-sm text-marrom py-1">
                    <span className="truncate mr-2">{item.quantity}x {item.product.name}</span>
                    <span className="tabular-nums shrink-0">{formatPrice(item.product.price * item.quantity)}</span>
                  </div>
                ))}
                <div className="border-t border-marrom/30 mt-2 pt-2 flex justify-between text-bege font-bold">
                  <span>Total</span>
                  <span className="tabular-nums">{formatPrice(totalPrice)}</span>
                </div>
              </motion.div>
              <AnimatePresence>
                {error && (
                  <motion.p
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -5 }}
                    className="text-red-400 text-sm bg-red-400/10 rounded-lg p-3"
                  >
                    {error}
                  </motion.p>
                )}
              </AnimatePresence>
              <motion.button
                whileTap={{ scale: 0.98 }}
                onClick={handleSubmit}
                disabled={submitting}
                className="btn-primary flex items-center justify-center gap-2"
              >
                {submitting ? (
                  <>
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                      className="w-5 h-5 border-2 border-white border-t-transparent rounded-full"
                    />
                    Processando...
                  </>
                ) : (
                  <>
                    <Send className="w-5 h-5" />
                    Finalizar Pedido
                  </>
                )}
              </motion.button>
            </div>
          </motion.div>
        )}

        {step === "success" && orderResult ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <div className="text-center mb-6">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 200 }}
                className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4"
              >
                <Check className="w-8 h-8 text-green-400" />
              </motion.div>
              <h2 className="text-xl font-bold text-bege tracking-tight">Pedido criado</h2>
              <p className="text-marrom text-sm mt-0.5">Pedido #{orderResult.orderId}</p>
              {copied && (
                <motion.p
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-green-400 text-xs mt-2 flex items-center justify-center gap-1"
                >
                  <Copy className="w-3 h-3" />
                  Link copiado! Guarde para acompanhar.
                </motion.p>
              )}
            </div>

            <div className="card border-bege/30 mb-4">
              <h3 className="text-bege font-semibold mb-3">Pagamento PIX</h3>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="bg-dark rounded-xl p-4 mb-3 space-y-2"
              >
                  <div>
                    <p className="text-[10px] text-marrom uppercase tracking-wide mb-0.5">Chave PIX</p>
                    <div className="flex items-center gap-2">
                      <p className="text-bege font-mono text-sm break-all select-all flex-1">{orderResult.pixKey}</p>
                      <motion.button
                        whileTap={{ scale: 0.9 }}
                        onClick={async () => {
                          try {
                            await navigator.clipboard.writeText(orderResult.pixKey)
                            setPixCopied(true)
                            setTimeout(() => setPixCopied(false), 2000)
                          } catch {}
                        }}
                        className="shrink-0 w-8 h-8 flex items-center justify-center rounded-lg border border-marrom/40 text-marrom hover:text-bege"
                      >
                        {pixCopied ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
                      </motion.button>
                    </div>
                  </div>
                <div>
                  <p className="text-[10px] text-marrom uppercase tracking-wide mb-0.5">Nome</p>
                  <p className="text-bege text-sm">{orderResult.pixName}</p>
                </div>
                <div>
                  <p className="text-[10px] text-marrom uppercase tracking-wide mb-0.5">Valor</p>
                  <p className="text-white font-bold text-xl tabular-nums">R$ {Number(orderResult.pixAmount).toFixed(2).replace(".", ",")}</p>
                </div>
              </motion.div>
              <p className="text-xs text-marrom text-center">
                Pague o valor exato e aguarde a aprovação
              </p>
            </div>

            <div className="card border-yellow-400/20">
              <div className="bg-yellow-400/10 border border-yellow-400/20 rounded-lg p-3 mb-3">
                <p className="text-xs text-yellow-300 font-semibold text-center">
                  ⚠️ Guarde o link abaixo para acompanhar seu pedido!
                </p>
                <p className="text-[10px] text-marrom text-center mt-1">
                  Quando o pagamento for aprovado, a ficha aparecerá na página de acompanhamento. Volte lá para baixar.
                </p>
              </div>
              <p className="text-xs text-marrom text-center">
                Pedido: <span className="text-bege font-bold">{orderResult.orderId}</span>
              </p>
              <div className="mt-3 flex gap-2">
                <a
                  href={`/pedido/${orderResult.orderId}`}
                  className="btn-secondary text-sm py-2 flex-1 text-center"
                >
                  Acompanhar
                </a>
                <motion.button
                  whileTap={{ scale: 0.9 }}
                  onClick={async () => {
                    const link = `${window.location.origin}/pedido/${orderResult.orderId}?token=${orderResult.token}`
                    try {
                      await navigator.clipboard.writeText(link)
                      setCopied(true)
                    } catch {}
                  }}
                  className="btn-secondary text-sm py-2 flex items-center justify-center gap-1"
                >
                  <Copy className="w-3.5 h-3.5" />
                </motion.button>
              </div>
              <div className="mt-6 pt-4 border-t border-marrom/20">
                <button
                  onClick={handleCancelOrder}
                  disabled={cancelling}
                  className="w-full text-center text-xs text-red-400/60 hover:text-red-400 transition-colors py-2"
                >
                  {cancelling ? "Cancelando..." : "Cancelar pedido"}
                </button>
              </div>
            </div>
          </motion.div>
        ) : step === "cancelled" ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-12"
          >
            <div className="w-16 h-16 bg-red-400/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl text-red-400">✕</span>
            </div>
            <h2 className="text-xl font-bold text-bege tracking-tight">Pedido cancelado</h2>
            <p className="text-marrom text-sm mt-2">Se você pagou o PIX, entre em contato para reembolso.</p>
            <button onClick={() => setStep("products")} className="btn-primary mt-6">
              Novo Pedido
            </button>
          </motion.div>
        ) : null}
      </main>
    </div>
  )
}
