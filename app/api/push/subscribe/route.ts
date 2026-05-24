import { NextResponse } from "next/server"
import { checkAuth } from "@/lib/auth"
import { saveSubscription } from "@/lib/push"

export async function POST(request: Request) {
  if (!(await checkAuth())) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { subscription } = body

    if (!subscription || !subscription.endpoint) {
      return NextResponse.json({ error: "Subscription inválida" }, { status: 400 })
    }

    await saveSubscription(subscription)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Push subscribe error:", error)
    return NextResponse.json({ error: "Erro ao salvar inscrição" }, { status: 500 })
  }
}
