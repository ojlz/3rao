import { NextResponse } from "next/server"
import { checkAuth } from "@/lib/auth"
import { getAdminEmails, addAdminEmail, removeAdminEmail } from "@/lib/store"

export async function GET() {
  if (!(await checkAuth())) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
  }
  const emails = await getAdminEmails()
  return NextResponse.json({ emails })
}

export async function POST(request: Request) {
  if (!(await checkAuth())) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
  }

  const body = await request.json()
  const { email } = body

  if (!email || !email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
    return NextResponse.json({ error: "E-mail inválido" }, { status: 400 })
  }

  await addAdminEmail(email.trim().toLowerCase())
  return NextResponse.json({ success: true })
}

export async function DELETE(request: Request) {
  if (!(await checkAuth())) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const email = searchParams.get("email")

  if (!email) {
    return NextResponse.json({ error: "E-mail obrigatório" }, { status: 400 })
  }

  await removeAdminEmail(email)
  return NextResponse.json({ success: true })
}
