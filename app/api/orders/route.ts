import { NextResponse } from "next/server"
import { getAllOrders, getOrder } from "@/lib/store"
import { checkAuth } from "@/lib/auth"

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
    const { token: _, ...safeOrder } = order
    return NextResponse.json({ order: safeOrder })
  }

  if (!(await checkAuth())) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
  }

  const orders = await getAllOrders()
  return NextResponse.json({ orders })
}
