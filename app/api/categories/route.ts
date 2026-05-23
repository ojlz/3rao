import { NextResponse } from "next/server"
import { getCategoryOrder, saveCategoryOrder } from "@/lib/store"
import { checkAuth } from "@/lib/auth"

export async function GET() {
  const order = await getCategoryOrder()
  return NextResponse.json({ order })
}

export async function PUT(request: Request) {
  if (!(await checkAuth())) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { order } = body

    if (!Array.isArray(order)) {
      return NextResponse.json({ error: "Lista de categorias obrigatória" }, { status: 400 })
    }

    await saveCategoryOrder(order)
    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: "Erro ao reordenar" }, { status: 500 })
  }
}
