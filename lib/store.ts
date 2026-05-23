import { redis } from "./redis"
import type { Product, Order, OrderItem } from "@/types"

const PRODUCTS_KEY = "products"
const ORDERS_KEY = "orders"
const TICKETS_KEY = "tickets"

function parseValue<T>(v: unknown): T {
  if (typeof v === "string") return JSON.parse(v)
  return v as T
}

export async function getProducts(): Promise<Product[]> {
  const products = await redis.hgetall(PRODUCTS_KEY)
  if (!products) return []
  return Object.values(products).map((p) => parseValue<Product>(p))
}

export async function getProduct(id: string): Promise<Product | null> {
  const data = await redis.hget(PRODUCTS_KEY, id)
  return data ? parseValue<Product>(data) : null
}

export async function saveProduct(product: Product): Promise<void> {
  await redis.hset(PRODUCTS_KEY, { [product.id]: JSON.stringify(product) })
}

export async function deleteProduct(id: string): Promise<void> {
  await redis.hdel(PRODUCTS_KEY, id)
}

export async function reorderProducts(ids: string[]): Promise<void> {
  const products = await getProducts()
  const productMap = new Map(products.map((p) => [p.id, p]))
  for (let i = 0; i < ids.length; i++) {
    const product = productMap.get(ids[i])
    if (product) {
      product.order = i
      await saveProduct(product)
    }
  }
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

  await redis.hset(ORDERS_KEY, { [id]: JSON.stringify(order) })
  return order
}

export async function getOrder(id: string): Promise<Order | null> {
  const data = await redis.hget(ORDERS_KEY, id)
  return data ? parseValue<Order>(data) : null
}

export async function getAllOrders(): Promise<Order[]> {
  const orders = await redis.hgetall(ORDERS_KEY)
  if (!orders) return []
  return Object.values(orders).map((o) => parseValue<Order>(o))
}

export async function updateOrder(id: string, updates: Partial<Order>): Promise<Order | null> {
  const order = await getOrder(id)
  if (!order) return null
  const updated = { ...order, ...updates }
  await redis.hset(ORDERS_KEY, { [id]: JSON.stringify(updated) })
  return updated
}

export async function saveTicket(ticket: { orderId: string; token: string; customerName: string; items: OrderItem[]; totalPrice: number; status: string; qrData: string; createdAt: string }): Promise<void> {
  const key = `ticket:${ticket.token}`
  await redis.set(key, JSON.stringify(ticket))
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
  const data = await redis.get(`ticket:${token}`)
  return data ? parseValue(data) : null
}

export async function invalidateTicket(token: string): Promise<void> {
  const ticket = await getTicket(token)
  if (ticket) {
    ticket.status = "used"
    await redis.set(`ticket:${token}`, JSON.stringify(ticket))
  }
}

export async function deleteTicket(token: string): Promise<void> {
  await redis.del(`ticket:${token}`)
}

export async function getOrderByToken(token: string): Promise<Order | null> {
  const orders = await getAllOrders()
  return orders.find((o) => o.token === token) || null
}

const CATEGORIES_ORDER_KEY = "categories_order"

export async function getCategoryOrder(): Promise<string[]> {
  const data = await redis.get<string>(CATEGORIES_ORDER_KEY)
  return data ? parseValue<string[]>(data) : []
}

export async function saveCategoryOrder(order: string[]): Promise<void> {
  await redis.set(CATEGORIES_ORDER_KEY, JSON.stringify(order))
}

const TICKET_IMG_PREFIX = "ticket_img:"

export async function saveTicketImage(token: string, buffer: Buffer): Promise<void> {
  await redis.set(`${TICKET_IMG_PREFIX}${token}`, buffer.toString("base64"))
}

export async function getTicketImage(token: string): Promise<Buffer | null> {
  const data = await redis.get<string>(`${TICKET_IMG_PREFIX}${token}`)
  return data ? Buffer.from(data, "base64") : null
}

export async function deleteTicketImage(token: string): Promise<void> {
  await redis.del(`${TICKET_IMG_PREFIX}${token}`)
}
