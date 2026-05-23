import { NextResponse } from "next/server"
import { getProducts, getProduct, saveProduct, deleteProduct, reorderProducts } from "@/lib/store"
import { checkAuth } from "@/lib/auth"
import type { Product } from "@/types"

export async function GET() {
  const products = await getProducts()
  products.sort((a, b) => a.order - b.order)
  return NextResponse.json({ products })
}

export async function POST(request: Request) {
  if (!(await checkAuth())) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { id, name, description, price, category, imageUrl, complements, available } = body

    if (!name || !price) {
      return NextResponse.json({ error: "Nome e preço obrigatórios" }, { status: 400 })
    }

    let order: number

    if (id) {
      const existing = await getProduct(id)
      order = existing?.order ?? 0
    } else {
      const all = await getProducts()
      order = all.length > 0 ? Math.max(...all.map((p) => p.order)) + 1 : 0
    }

    const product: Product = {
      id: id || Math.random().toString(36).slice(2, 8),
      name,
      description: description || "",
      price: Number(price),
      imageUrl: imageUrl || "",
      category: category || "geral",
      complements: complements || [],
      available: available !== false,
      order,
      createdAt: id ? (await getProduct(id))?.createdAt || new Date().toISOString() : new Date().toISOString(),
    }

    await saveProduct(product)
    return NextResponse.json({ success: true, product })
  } catch {
    return NextResponse.json({ error: "Erro ao salvar" }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  if (!(await checkAuth())) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { ids } = body

    if (!Array.isArray(ids)) {
      return NextResponse.json({ error: "Lista de IDs obrigatória" }, { status: 400 })
    }

    await reorderProducts(ids)
    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: "Erro ao reordenar" }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  if (!(await checkAuth())) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const id = searchParams.get("id")
  if (!id) {
    return NextResponse.json({ error: "ID obrigatório" }, { status: 400 })
  }

  await deleteProduct(id)
  return NextResponse.json({ success: true })
}
