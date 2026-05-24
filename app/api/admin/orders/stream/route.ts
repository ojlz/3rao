import { checkAuth } from "@/lib/auth"
import { redis } from "@/lib/redis"

export const dynamic = "force-dynamic"

export async function GET() {
  if (!(await checkAuth())) {
    return new Response("Não autorizado", { status: 401 })
  }

  const encoder = new TextEncoder()

  const stream = new ReadableStream({
    async start(controller) {
      let lastJson = "[]"

      try {
        const raw = await redis.hgetall("orders")
        const list = raw ? Object.values(raw).map((o) => JSON.parse(o as string)) : []
        lastJson = JSON.stringify(list)
        controller.enqueue(encoder.encode(`data: ${lastJson}\n\n`))
      } catch {
        controller.enqueue(encoder.encode(`data: []\n\n`))
      }

      while (true) {
        await new Promise((r) => setTimeout(r, 5000))

        try {
          const raw = await redis.hgetall("orders")
          const list = raw ? Object.values(raw).map((o) => JSON.parse(o as string)) : []
          const json = JSON.stringify(list)

          if (json !== lastJson) {
            lastJson = json
            controller.enqueue(encoder.encode(`data: ${json}\n\n`))
          }
        } catch {
          // connection dropped, stream will close naturally
          break
        }
      }
    },
  })

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  })
}
