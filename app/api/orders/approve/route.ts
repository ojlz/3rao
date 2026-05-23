import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { getOrder, updateOrder, saveTicket, saveTicketImage } from "@/lib/store"
import { generateTicket } from "@/services/ticketGenerator"
import { sendImage, sendText, isConfigured } from "@/services/whatsappCloud"

const EVENT_DATE = process.env.EVENT_DATE || "3 de junho"

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
    if (order.status !== "pending") {
      return NextResponse.json({ error: "Pedido já processado" }, { status: 400 })
    }

    await updateOrder(orderId, {
      status: "approved",
      approvedAt: new Date().toISOString(),
    })

    const ticketBuffer = await generateTicket(order, EVENT_DATE)
    const baseUrl = process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : `http://localhost:${process.env.PORT || 3000}`

    await saveTicket({
      orderId: order.id,
      token: order.token,
      customerName: order.customerName,
      items: order.items,
      totalPrice: order.totalPrice,
      status: "active",
      qrData: order.token,
      createdAt: new Date().toISOString(),
    })

    await saveTicketImage(order.token, ticketBuffer)

    let whatsappSent = false
    if (isConfigured()) {
      const caption = `✅ Pedido Aprovado!\n\nPedido: ${order.id}\nCliente: ${order.customerName}\nTotal: R$ ${(order.totalPrice / 100).toFixed(2).replace(".", ",")}\n\nApresente o QR Code no dia ${EVENT_DATE} para retirar seus espetinhos!`
      const imageUrl = `${baseUrl}/api/ticket-image/${order.token}`
      whatsappSent = await sendImage(order.customerPhone, imageUrl, caption)
    }

    await updateOrder(orderId, { whatsappSent })

    return NextResponse.json({
      success: true,
      orderId: order.id,
      status: "approved",
      whatsappSent,
    })
  } catch (error) {
    console.error("Approve error:", error)
    return NextResponse.json({ error: "Erro ao aprovar" }, { status: 500 })
  }
}
