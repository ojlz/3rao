import { NextResponse } from "next/server"
import { createSession, checkRateLimit, resetRateLimit } from "@/lib/store"
import { headers } from "next/headers"

export async function POST(request: Request) {
  try {
    const headersList = headers()
    const ip = headersList.get("x-forwarded-for") || headersList.get("x-real-ip") || "unknown"

    const allowed = await checkRateLimit(ip)
    if (!allowed) {
      return NextResponse.json({ error: "Muitas tentativas. Aguarde 1 minuto." }, { status: 429 })
    }

    const body = await request.json()
    const { password } = body

    if (password === process.env.ADMIN_PASSWORD) {
      await resetRateLimit(ip)
      const sessionId = await createSession()
      const isSecure = request.headers.get("x-forwarded-proto") !== "http" && process.env.NODE_ENV === "production"
      const response = NextResponse.json({ success: true })
      response.cookies.set("admin_session", sessionId, {
        httpOnly: true,
        secure: isSecure,
        sameSite: "strict",
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
