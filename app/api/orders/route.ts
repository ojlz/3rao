import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { getAllOrders, getOrder } from "@/lib/store"
import type { Order } from "@/types"

function checkAuth(): boolean {
  const cookieStore = cookies()
  const session = cookieStore.get("admin_session")
  return session?.value === process.env.ADMIN_PASSWORD
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const id = searchParams.get("id")
  const token = searchParams.get("token")

  if (id && token) {
    const order = await getOrder(id)
    if (!order) {
      return NextResponse.json({ error: "Pedido não encontrado" }, { status: 404 })
    }
    if (order.token !== token) {
      return NextResponse.json({ error: "Token inválido" }, { status: 401 })
    }
    return NextResponse.json({ order })
  }

  if (!checkAuth()) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
  }

  const orders = await getAllOrders()
  return NextResponse.json({ orders })
}
