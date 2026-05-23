import { NextResponse } from "next/server"
import { cookies } from "next/headers"

export async function GET() {
  const cookieStore = cookies()
  const session = cookieStore.get("admin_session")
  const authenticated = session?.value === process.env.ADMIN_PASSWORD
  return NextResponse.json({ authenticated })
}
