import { NextResponse } from "next/server"
import { checkAuth } from "@/lib/auth"

export async function GET() {
  if (!(await checkAuth())) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
  }

  const key = process.env.BREVO_API_KEY
  const fromEmail = process.env.BREVO_FROM_EMAIL

  if (!key) return NextResponse.json({ error: "BREVO_API_KEY nao configurada" }, { status: 500 })
  if (!fromEmail) return NextResponse.json({ error: "BREVO_FROM_EMAIL nao configurado" }, { status: 500 })

  try {
    const res = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: { "api-key": key, "Content-Type": "application/json" },
      body: JSON.stringify({
        sender: { email: fromEmail },
        to: [{ email: "feardeadx@gmail.com" }],
        subject: "Teste Brevo - Espetao do Terceirao",
        htmlContent: "<p>Funcionou! Brevo no Vercel ✅</p>",
      }),
    })

    const text = await res.text()
    return NextResponse.json({ status: res.status, response: text })
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}
