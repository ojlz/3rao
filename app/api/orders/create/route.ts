import { NextResponse } from "next/server"
import { createOrder, getProduct } from "@/lib/store"
import { sendOrderConfirmation, notifyAdminNewOrder } from "@/lib/email"
import { notifyAdminsNewOrder } from "@/lib/push"
import type { OrderItem } from "@/types"

export async function POST(request: Request) {
  try {
    const contentLength = request.headers.get("content-length")
    if (contentLength && parseInt(contentLength) > 50000) {
      return NextResponse.json({ error: "Requisição muito grande" }, { status: 413 })
    }

    const body = await request.json()
    const { customerName, customerPhone, customerEmail, items } = body

    if (!customerName || !customerName.trim()) {
      return NextResponse.json({ error: "Nome obrigatório" }, { status: 400 })
    }
    if (customerName.trim().length > 100) {
      return NextResponse.json({ error: "Nome muito longo (máx 100 caracteres)" }, { status: 400 })
    }
    if (!customerPhone || !customerPhone.replace(/\D/g, "").match(/^\d{10,11}$/)) {
      return NextResponse.json({ error: "Telefone inválido" }, { status: 400 })
    }
    if (customerEmail && customerEmail.length > 200) {
      return NextResponse.json({ error: "E-mail muito longo" }, { status: 400 })
    }
    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: "Selecione pelo menos 1 item" }, { status: 400 })
    }
    if (items.length > 50) {
      return NextResponse.json({ error: "Máximo de 50 itens por pedido" }, { status: 400 })
    }

    const validatedItems: OrderItem[] = []
    for (const item of items) {
      if (!item.productId || !item.quantity || item.quantity < 1 || item.quantity > 99) {
        return NextResponse.json({ error: "Item inválido" }, { status: 400 })
      }

      const product = await getProduct(item.productId)
      if (!product || !product.available) {
        return NextResponse.json({ error: `Produto "${item.productName || item.productId}" indisponível` }, { status: 400 })
      }

      validatedItems.push({
        productId: product.id,
        productName: product.name,
        quantity: item.quantity,
        price: product.price,
        complements: [],
      })
    }

    const totalPrice = validatedItems.reduce((acc, item) => acc + item.price * item.quantity, 0)

    const order = await createOrder(
      customerName.trim(),
      customerPhone.replace(/\D/g, ""),
      customerEmail.trim().toLowerCase(),
      validatedItems,
      totalPrice
    )

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || `${request.headers.get("origin") || "http://localhost:3000"}`
    const trackingUrl = `${baseUrl}/pedido/${order.id}?token=${order.token}`
    const adminUrl = `${baseUrl}/admin/dashboard`

    await Promise.allSettled([
      customerEmail ? sendOrderConfirmation(
        order.customerEmail,
        order.id,
        order.customerName,
        order.totalPrice,
        process.env.PIX_KEY || "espetodoterceirao@pix.com",
        (order.totalPrice / 100).toFixed(2),
        order.token,
        trackingUrl
      ) : Promise.resolve(),
      notifyAdminNewOrder(
        order.customerName,
        order.customerPhone,
        order.customerEmail,
        order.id,
        order.totalPrice,
        adminUrl
      ),
      notifyAdminsNewOrder(order.id, order.customerName, order.totalPrice),
    ])

    return NextResponse.json({
      orderId: order.id,
      token: order.token,
      totalPrice: order.totalPrice,
      status: order.status,
      pixKey: process.env.PIX_KEY || "espetodoterceirao@pix.com",
      pixName: process.env.PIX_NAME || "Espetão do Terceirão",
      pixAmount: (order.totalPrice / 100).toFixed(2),
    })
  } catch (error) {
    console.error("Create order error:", error)
    return NextResponse.json({ error: "Erro ao criar pedido" }, { status: 500 })
  }
}
