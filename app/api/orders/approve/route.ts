import { NextResponse } from "next/server"
import { getOrder, updateOrder, saveTicket, saveTicketImage, getTicketImage } from "@/lib/store"
import { generateTicket } from "@/services/ticketGenerator"
import { sendOrderApproved } from "@/lib/email"
import { checkAuth } from "@/lib/auth"

const EVENT_DATE = process.env.EVENT_DATE || "3 de junho"

export async function POST(request: Request) {
  if (!(await checkAuth())) {
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

    await updateOrder(orderId, { whatsappSent: false })

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || `${request.headers.get("origin") || "http://localhost:3000"}`
    const trackingUrl = `${baseUrl}/pedido/${order.id}?token=${order.token}`

    const ticketImageBuffer = await getTicketImage(order.token)
    const ticketImageBase64 = ticketImageBuffer?.toString("base64") || ""

    if (order.customerEmail) {
      sendOrderApproved(
        order.customerEmail,
        order.id,
        order.customerName,
        order.token,
        ticketImageBase64,
        trackingUrl
      )
    }

    return NextResponse.json({
      success: true,
      orderId: order.id,
      status: "approved",
      whatsappSent: false,
    })
  } catch (error) {
    console.error("Approve error:", error)
    return NextResponse.json({ error: "Erro ao aprovar" }, { status: 500 })
  }
}
