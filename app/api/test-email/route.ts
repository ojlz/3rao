import { NextResponse } from "next/server"
import { checkAuth } from "@/lib/auth"

export async function GET() {
  if (!(await checkAuth())) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
  }

  const key = process.env.RESEND_API_KEY
  if (!key) {
    return NextResponse.json({ error: "RESEND_API_KEY não está configurada no Vercel" }, { status: 500 })
  }

  const masked = key.slice(0, 10) + "..." + key.slice(-4)

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: `${process.env.SMTP_FROM_NAME || "Teste"} <${process.env.RESEND_FROM_EMAIL || "onboarding@resend.dev"}>`,
        to: "feardeadx@gmail.com",
        subject: "Teste - Espetao do Terceirao",
        html: "<p>Se vc leu isso, o email funciona no Vercel!</p>",
      }),
    })

    const text = await res.text()
    return NextResponse.json({
      status: res.status,
      response: text,
      keyMasked: masked,
    })
  } catch (error) {
    return NextResponse.json({
      error: String(error),
      keyMasked: masked,
    }, { status: 500 })
  }
}
