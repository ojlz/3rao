export interface Product {
  id: string
  name: string
  description: string
  price: number
  imageUrl: string
  category: string
  complements: Complement[]
  available: boolean
  createdAt: string
}

export interface Complement {
  name: string
  price: number
  max: number
}

export interface OrderItem {
  productId: string
  productName: string
  quantity: number
  price: number
  complements: string[]
}

export interface Order {
  id: string
  token: string
  customerName: string
  customerPhone: string
  items: OrderItem[]
  totalPrice: number
  status: "pending" | "approved" | "delivered" | "cancelled"
  ticketQr: string
  createdAt: string
  approvedAt: string | null
  deliveredAt: string | null
  whatsappSent: boolean
}

export interface Ticket {
  orderId: string
  token: string
  customerName: string
  items: OrderItem[]
  totalPrice: number
  status: "active" | "used" | "invalid"
  qrData: string
  createdAt: string
}

export interface AdminSession {
  authenticated: boolean
  timestamp: number
}
