import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { getProducts, getProduct, saveProduct, deleteProduct } from "@/lib/store"
import type { Product } from "@/types"

function checkAuth(): boolean {
  const cookieStore = cookies()
  const session = cookieStore.get("admin_session")
  return session?.value === process.env.ADMIN_PASSWORD
}

export async function GET() {
  const products = await getProducts()
  return NextResponse.json({ products })
}

export async function POST(request: Request) {
  if (!checkAuth()) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { id, name, description, price, category, imageUrl, complements, available } = body

    if (!name || !price) {
      return NextResponse.json({ error: "Nome e preço obrigatórios" }, { status: 400 })
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
      createdAt: new Date().toISOString(),
    }

    await saveProduct(product)
    return NextResponse.json({ success: true, product })
  } catch {
    return NextResponse.json({ error: "Erro ao salvar" }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  if (!checkAuth()) {
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
