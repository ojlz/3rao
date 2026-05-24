import { NextResponse } from "next/server"
import { getOrder, updateOrder, saveTicket, saveTicketImage } from "@/lib/store"
import { generateTicket } from "@/services/ticketGenerator"
import { sendOrderApproved } from "@/lib/email"
import { checkAuth } from "@/lib/auth"
import QRCode from "qrcode"

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

    await updateOrder(orderId, {
      status: "approved",
      approvedAt: new Date().toISOString(),
      whatsappSent: false,
    })

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || `${request.headers.get("origin") || "http://localhost:3000"}`
    const trackingUrl = `${baseUrl}/pedido/${order.id}?token=${order.token}`

    const qrBuffer = await QRCode.toBuffer(order.token, {
      width: 300,
      margin: 2,
      color: { dark: "#1D150D", light: "#FFFFFF" },
    })
    const qrBase64 = qrBuffer.toString("base64")

    if (order.customerEmail) {
      sendOrderApproved(
        order.customerEmail,
        order.id,
        order.customerName,
        order.token,
        qrBase64,
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
