import { NextResponse } from "next/server"
import { checkAuth } from "@/lib/auth"

export async function GET() {
  const authenticated = await checkAuth()
  return NextResponse.json({ authenticated })
}
