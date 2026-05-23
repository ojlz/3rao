import { NextResponse } from "next/server"
import { redis } from "@/lib/redis"
import { checkAuth } from "@/lib/auth"

export async function POST() {
  if (!(await checkAuth())) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
  }

  console.warn("ADMIN RESET triggered at", new Date().toISOString())

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
