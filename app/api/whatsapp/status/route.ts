import { NextResponse } from "next/server"
import { isConfigured } from "@/services/whatsappCloud"

export const dynamic = "force-dynamic"

export async function GET() {
  return NextResponse.json({ configured: isConfigured() })
}
