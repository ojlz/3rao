import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { getTicket, getOrder, invalidateTicket, updateOrder } from "@/lib/store"

function checkAuth(): boolean {
  const cookieStore = cookies()
  const session = cookieStore.get("admin_session")
  return session?.value === process.env.ADMIN_PASSWORD
}

export async function POST(request: Request) {
  if (!checkAuth()) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { token } = body

    if (!token) {
      return NextResponse.json({ error: "Token obrigatório" }, { status: 400 })
    }

    const ticket = await getTicket(token)
    if (!ticket) {
      return NextResponse.json({ error: "Ficha não encontrada" }, { status: 404 })
    }

    if (ticket.status === "used") {
      const order = await getOrder(ticket.orderId)
      return NextResponse.json({
        valid: false,
        status: "used",
        error: "QR Code já utilizado",
        order: order
          ? {
              customerName: order.customerName,
              customerPhone: order.customerPhone,
              items: order.items,
              totalPrice: order.totalPrice,
              orderId: order.id,
            }
          : null,
      })
    }

    if (ticket.status === "invalid") {
      return NextResponse.json({ valid: false, status: "invalid", error: "QR Code inválido" })
    }

    const order = await getOrder(ticket.orderId)

    await invalidateTicket(token)
    if (order) {
      await updateOrder(order.id, { status: "delivered", deliveredAt: new Date().toISOString() })
    }

    return NextResponse.json({
      valid: true,
      status: "active",
      message: "✅ PEDIDO VÁLIDO",
      order: order
        ? {
            customerName: order.customerName,
            customerPhone: order.customerPhone,
            items: order.items,
            totalPrice: order.totalPrice,
            orderId: order.id,
            token: order.token,
          }
        : null,
    })
  } catch (error) {
    console.error("Validate error:", error)
    return NextResponse.json({ error: "Erro ao validar" }, { status: 500 })
  }
}
