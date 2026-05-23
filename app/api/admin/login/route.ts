import { NextResponse } from "next/server"
import { createToken } from "@/lib/auth"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { password } = body

    if (password === process.env.ADMIN_PASSWORD) {
      const token = createToken()
      const isSecure = process.env.NODE_ENV === "production"
      const response = NextResponse.json({ success: true })
      response.cookies.set("admin_session", token, {
        httpOnly: true,
        secure: isSecure,
        sameSite: "lax",
        maxAge: 60 * 60 * 24,
        path: "/",
      })
      return response
    }

    return NextResponse.json({ error: "Senha inválida" }, { status: 401 })
  } catch {
    return NextResponse.json({ error: "Erro no login" }, { status: 500 })
  }
}
