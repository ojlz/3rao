import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { getOrder, updateOrder, deleteTicket, deleteTicketImage } from "@/lib/store"

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
    const { orderId } = body

    const order = await getOrder(orderId)
    if (!order) {
      return NextResponse.json({ error: "Pedido não encontrado" }, { status: 404 })
    }
    if (order.status !== "approved") {
      return NextResponse.json({ error: "Pedido não está aprovado" }, { status: 400 })
    }

    await deleteTicket(order.token)
    await deleteTicketImage(order.token)

    await updateOrder(orderId, {
      status: "pending",
      approvedAt: null,
      whatsappSent: false,
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Undo error:", error)
    return NextResponse.json({ error: "Erro ao desfazer" }, { status: 500 })
  }
}
