import { redis } from "./redis"
import type { Product, Order, OrderItem } from "@/types"

const PRODUCTS_KEY = "products"
const ORDERS_KEY = "orders"
const TICKETS_KEY = "tickets"

// ---------------------------------------------------------------------------
// Fallback em memória (demo sem Redis, ex.: Vercel sem env).
// Tudo funciona igual; os dados duram enquanto a instância estiver quente.
// ---------------------------------------------------------------------------
const memProducts = new Map<string, string>()
const memOrders = new Map<string, string>()
const memTickets = new Map<string, string>()
const memTicketImgs = new Map<string, string>()
let redisDown = false
let demoSeeded = false

async function rcall<T>(fn: () => Promise<T>): Promise<T | null> {
  if (!redisDown) {
    try {
      return await fn()
    } catch {
      redisDown = true
    }
  }
  return null
}

// Cardápio fictício de demonstração (só usado quando não há Redis).
const DEMO_PRODUCTS: Omit<Product, "createdAt">[] = [
  { id: "demo-carne", name: "Espetinho de Carne (demo)", description: "Produto fictício de demonstração.", price: 1200, imageUrl: "", category: "espetinhos", complements: [{ name: "Farofa extra", price: 200, max: 2 }, { name: "Vinagrete extra", price: 150, max: 2 }], available: true },
  { id: "demo-frango", name: "Espetinho de Frango (demo)", description: "Produto fictício de demonstração.", price: 1000, imageUrl: "", category: "espetinhos", complements: [{ name: "Farofa extra", price: 200, max: 2 }], available: true },
  { id: "demo-queijo", name: "Espetinho de Queijo Coalho (demo)", description: "Produto fictício de demonstração.", price: 900, imageUrl: "", category: "espetinhos", complements: [], available: true },
  { id: "demo-coracao", name: "Espetinho de Coração (demo)", description: "Produto fictício de demonstração.", price: 1100, imageUrl: "", category: "espetinhos", complements: [{ name: "Vinagrete extra", price: 150, max: 2 }], available: true },
  { id: "demo-linguica", name: "Espetinho de Linguiça (demo)", description: "Produto fictício de demonstração.", price: 1000, imageUrl: "", category: "espetinhos", complements: [], available: true },
  { id: "demo-refri-lata", name: "Refrigerante Lata 350ml (demo)", description: "Produto fictício de demonstração.", price: 600, imageUrl: "", category: "bebidas", complements: [], available: true },
  { id: "demo-refri-2l", name: "Refrigerante 2L (demo)", description: "Produto fictício de demonstração.", price: 1200, imageUrl: "", category: "bebidas", complements: [], available: true },
  { id: "demo-combo", name: "Combo Churrasco (demo)", description: "3 espetinhos + refrigerante 2L. Oferta fictícia.", price: 4500, imageUrl: "", category: "combos", complements: [], available: true },
]

function seedDemoProducts(): void {
  if (demoSeeded) return
  demoSeeded = true
  const now = new Date().toISOString()
  for (const p of DEMO_PRODUCTS) {
    if (!memProducts.has(p.id)) {
      memProducts.set(p.id, JSON.stringify({ ...p, createdAt: now }))
    }
  }
}

function parseValue<T>(v: unknown): T {
  if (typeof v === "string") return JSON.parse(v)
  return v as T
}

export async function getProducts(): Promise<Product[]> {
  const products = await rcall(() => redis.hgetall(PRODUCTS_KEY))
  if (products) return Object.values(products).map((p) => parseValue<Product>(p))
  seedDemoProducts()
  return [...memProducts.values()].map((p) => parseValue<Product>(p))
}

export async function getProduct(id: string): Promise<Product | null> {
  const data = await rcall(() => redis.hget(PRODUCTS_KEY, id))
  if (data) return parseValue<Product>(data)
  const mem = memProducts.get(id)
  return mem ? parseValue<Product>(mem) : null
}

export async function saveProduct(product: Product): Promise<void> {
  const done = await rcall(() => redis.hset(PRODUCTS_KEY, { [product.id]: JSON.stringify(product) }).then(() => true as const))
  if (done === null) memProducts.set(product.id, JSON.stringify(product))
}

export async function deleteProduct(id: string): Promise<void> {
  const done = await rcall(() => redis.hdel(PRODUCTS_KEY, id).then(() => true as const))
  if (done === null) memProducts.delete(id)
}

export async function createOrder(
  customerName: string,
  customerPhone: string,
  items: OrderItem[],
  totalPrice: number
): Promise<Order> {
  const { randomBytes } = await import("crypto")
  const id = randomBytes(3).toString("hex").toUpperCase().slice(0, 6)
  const token = randomBytes(12).toString("base64url").slice(0, 16)

  const order: Order = {
    id,
    token,
    customerName,
    customerPhone,
    items,
    totalPrice,
    status: "pending",
    ticketQr: "",
    createdAt: new Date().toISOString(),
    approvedAt: null,
    deliveredAt: null,
    whatsappSent: false,
  }

  const done = await rcall(() => redis.hset(ORDERS_KEY, { [id]: JSON.stringify(order) }).then(() => true as const))
  if (done === null) memOrders.set(id, JSON.stringify(order))
  return order
}

export async function getOrder(id: string): Promise<Order | null> {
  const data = await rcall(() => redis.hget(ORDERS_KEY, id))
  if (data) return parseValue<Order>(data)
  const mem = memOrders.get(id)
  return mem ? parseValue<Order>(mem) : null
}

export async function getAllOrders(): Promise<Order[]> {
  const orders = await rcall(() => redis.hgetall(ORDERS_KEY))
  if (orders) return Object.values(orders).map((o) => parseValue<Order>(o))
  return [...memOrders.values()].map((o) => parseValue<Order>(o))
}

export async function updateOrder(id: string, updates: Partial<Order>): Promise<Order | null> {
  const order = await getOrder(id)
  if (!order) return null
  const updated = { ...order, ...updates }
  const done = await rcall(() => redis.hset(ORDERS_KEY, { [id]: JSON.stringify(updated) }).then(() => true as const))
  if (done === null) memOrders.set(id, JSON.stringify(updated))
  return updated
}

export async function saveTicket(ticket: { orderId: string; token: string; customerName: string; items: OrderItem[]; totalPrice: number; status: string; qrData: string; createdAt: string }): Promise<void> {
  const key = `ticket:${ticket.token}`
  const done = await rcall(() => redis.set(key, JSON.stringify(ticket)).then(() => true as const))
  if (done === null) memTickets.set(key, JSON.stringify(ticket))
}

export async function getTicket(token: string): Promise<{
  orderId: string
  token: string
  customerName: string
  items: OrderItem[]
  totalPrice: number
  status: string
  qrData: string
  createdAt: string
} | null> {
  const data = await rcall(() => redis.get(`ticket:${token}`))
  if (data) return parseValue(data)
  const mem = memTickets.get(`ticket:${token}`)
  return mem ? parseValue(mem) : null
}

export async function invalidateTicket(token: string): Promise<void> {
  const ticket = await getTicket(token)
  if (ticket) {
    ticket.status = "used"
    const done = await rcall(() => redis.set(`ticket:${token}`, JSON.stringify(ticket)).then(() => true as const))
    if (done === null) memTickets.set(`ticket:${token}`, JSON.stringify(ticket))
  }
}

export async function getOrderByToken(token: string): Promise<Order | null> {
  const orders = await getAllOrders()
  return orders.find((o) => o.token === token) || null
}

const TICKET_IMG_PREFIX = "ticket_img:"

export async function saveTicketImage(token: string, buffer: Buffer): Promise<void> {
  const done = await rcall(() => redis.set(`${TICKET_IMG_PREFIX}${token}`, buffer.toString("base64")).then(() => true as const))
  if (done === null) memTicketImgs.set(`${TICKET_IMG_PREFIX}${token}`, buffer.toString("base64"))
}

export async function getTicketImage(token: string): Promise<Buffer | null> {
  const data = await rcall(() => redis.get<string>(`${TICKET_IMG_PREFIX}${token}`))
  if (data) return Buffer.from(data, "base64")
  const mem = memTicketImgs.get(`${TICKET_IMG_PREFIX}${token}`)
  return mem ? Buffer.from(mem, "base64") : null
}
