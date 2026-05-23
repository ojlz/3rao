import { NextResponse } from "next/server"
import { createOrder } from "@/lib/store"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { customerName, customerPhone, items, totalPrice } = body

    if (!customerName || !customerName.trim()) {
      return NextResponse.json({ error: "Nome obrigatório" }, { status: 400 })
    }
    if (!customerPhone || !customerPhone.replace(/\D/g, "").match(/^\d{10,11}$/)) {
      return NextResponse.json({ error: "Telefone inválido" }, { status: 400 })
    }
    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: "Selecione pelo menos 1 item" }, { status: 400 })
    }
    if (!totalPrice || totalPrice <= 0) {
      return NextResponse.json({ error: "Valor inválido" }, { status: 400 })
    }

    const order = await createOrder(
      customerName.trim(),
      customerPhone.replace(/\D/g, ""),
      items,
      totalPrice
    )

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
