import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { redis } from "@/lib/redis"

export async function POST() {
  const cookieStore = cookies()
  const session = cookieStore.get("admin_session")
  if (session?.value !== process.env.ADMIN_PASSWORD) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
  }

  await redis.del("orders")

  let cursor = "0"
  do {
    const [nextCursor, keys] = await redis.scan(cursor, { match: "ticket:*", count: 100 })
    cursor = nextCursor
    if (keys.length > 0) {
      await redis.del(...keys)
    }
  } while (cursor !== "0")

  cursor = "0"
  do {
    const [nextCursor, keys] = await redis.scan(cursor, { match: "ticket_img:*", count: 100 })
    cursor = nextCursor
    if (keys.length > 0) {
      await redis.del(...keys)
    }
  } while (cursor !== "0")

  return NextResponse.json({ success: true })
}
