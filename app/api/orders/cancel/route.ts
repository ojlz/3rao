import { NextResponse } from "next/server"
import { getOrder, deleteOrder, deleteTicket, deleteTicketImage } from "@/lib/store"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { orderId, token } = body

    if (!orderId || !token) {
      return NextResponse.json({ error: "Dados incompletos" }, { status: 400 })
    }

    const order = await getOrder(orderId)
    if (!order) {
      return NextResponse.json({ error: "Pedido não encontrado" }, { status: 404 })
    }
    if (order.token !== token) {
      return NextResponse.json({ error: "Token inválido" }, { status: 401 })
    }
    if (order.status !== "pending") {
      return NextResponse.json({ error: "Só é possível cancelar pedidos pendentes" }, { status: 400 })
    }

    await deleteTicket(order.token)
    await deleteTicketImage(order.token)
    await deleteOrder(orderId)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Cancel order error:", error)
    return NextResponse.json({ error: "Erro ao cancelar pedido" }, { status: 500 })
  }
}
