import { NextResponse } from "next/server"
import { getTicketImage } from "@/lib/store"

export const dynamic = "force-dynamic"

export async function GET(_: Request, { params }: { params: { token: string } }) {
  const buffer = await getTicketImage(params.token)
  if (!buffer) {
    return new NextResponse("Imagem não encontrada", { status: 404 })
  }
  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "image/png",
      "Cache-Control": "public, max-age=86400",
    },
  })
}
