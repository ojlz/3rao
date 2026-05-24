import webpush from "web-push"
import { redis } from "./redis"

if (
  process.env.VAPID_PUBLIC_KEY &&
  process.env.VAPID_PRIVATE_KEY &&
  process.env.VAPID_SUBJECT
) {
  webpush.setVapidDetails(
    process.env.VAPID_SUBJECT,
    process.env.VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY
  )
}

const SUBSCRIPTIONS_KEY = "push_subscriptions"

export async function saveSubscription(subscription: webpush.PushSubscription): Promise<void> {
  const raw = JSON.stringify(subscription)
  const existing = await redis.smembers(SUBSCRIPTIONS_KEY)
  const alreadyExists = existing.some((s: string) => {
    try {
      const parsed = JSON.parse(s)
      return parsed.endpoint === subscription.endpoint
    } catch {
      return false
    }
  })
  if (!alreadyExists) {
    await redis.sadd(SUBSCRIPTIONS_KEY, raw)
  }
}

export async function notifyAdminsNewOrder(
  orderId: string,
  customerName: string,
  totalPrice: number
): Promise<void> {
  const subscriptions = await redis.smembers(SUBSCRIPTIONS_KEY)
  if (!subscriptions || subscriptions.length === 0) return

  const payload = JSON.stringify({
    title: "🆕 Novo pedido pendente!",
    body: `${customerName} · R$ ${(totalPrice / 100).toFixed(2).replace(".", ",")}`,
    url: `${process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"}/admin/dashboard`,
  })

  for (const raw of subscriptions) {
    try {
      const subscription = JSON.parse(raw)
      await webpush.sendNotification(subscription, payload)
    } catch (error: unknown) {
      if (error instanceof webpush.WebPushError) {
        if (error.statusCode === 410 || error.statusCode === 404) {
          await redis.srem(SUBSCRIPTIONS_KEY, raw)
        }
      }
      console.error("Push send error:", error)
    }
  }
}
