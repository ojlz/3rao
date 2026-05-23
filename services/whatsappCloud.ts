const API_VERSION = "v21.0"
const BASE_URL = `https://graph.facebook.com/${API_VERSION}`

function getConfig() {
  const token = process.env.WHATSAPP_API_TOKEN
  const phoneId = process.env.WHATSAPP_PHONE_ID
  if (!token || !phoneId) return null
  return { token, phoneId }
}

export function isConfigured(): boolean {
  return !!getConfig()
}

export async function sendText(to: string, text: string): Promise<boolean> {
  const config = getConfig()
  if (!config) return false

  try {
    const res = await fetch(`${BASE_URL}/${config.phoneId}/messages`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${config.token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to: to.replace(/\D/g, ""),
        type: "text",
        text: { body: text },
      }),
    })
    return res.ok
  } catch {
    return false
  }
}

export async function sendImage(to: string, imageUrl: string, caption?: string): Promise<boolean> {
  const config = getConfig()
  if (!config) return false

  try {
    const body: any = {
      messaging_product: "whatsapp",
      to: to.replace(/\D/g, ""),
      type: "image",
      image: { link: imageUrl },
    }
    if (caption) body.image.caption = caption

    const res = await fetch(`${BASE_URL}/${config.phoneId}/messages`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${config.token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    })
    return res.ok
  } catch {
    return false
  }
}
