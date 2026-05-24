import { NextResponse } from "next/server"
import { getTicketImage, saveTicketImage, getOrderByToken } from "@/lib/store"
import { generateTicket } from "@/services/ticketGenerator"

export const dynamic = "force-dynamic"

const EVENT_DATE = process.env.EVENT_DATE || "3 de junho"

export async function GET(_: Request, { params }: { params: { token: string } }) {
  let buffer = await getTicketImage(params.token)

  if (!buffer) {
    const order = await getOrderByToken(params.token)
    if (order && order.status === "approved") {
      try {
        buffer = await generateTicket(order, EVENT_DATE)
        await saveTicketImage(params.token, buffer)
      } catch {
        return new NextResponse("Erro ao gerar ficha", { status: 500 })
      }
    } else {
      return new NextResponse("Imagem não encontrada", { status: 404 })
    }
  }

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "image/png",
      "Cache-Control": "public, max-age=86400",
    },
  })
}
