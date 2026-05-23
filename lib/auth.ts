import { cookies } from "next/headers"

function encode(str: string): string {
  return Buffer.from(str).toString("base64url")
}

function decode(str: string): string {
  return Buffer.from(str, "base64url").toString()
}

function sign(payload: string): string {
  const secret = process.env.ADMIN_PASSWORD || ""
  const { createHmac } = require("crypto")
  return createHmac("sha256", secret).update(payload).digest("base64url")
}

export function createToken(): string {
  const { randomUUID } = require("crypto")
  const id = randomUUID()
  const payload = `${id}.${Date.now()}`
  const signature = sign(payload)
  return `${payload}.${signature}`
}

export function validateToken(token: string): boolean {
  try {
    const parts = token.split(".")
    if (parts.length !== 3) return false
    const payload = `${parts[0]}.${parts[1]}`
    const expectedSig = sign(payload)
    if (parts[2] !== expectedSig) return false
    const ts = parseInt(parts[1], 10)
    if (Date.now() - ts > 86400000) return false
    return true
  } catch {
    return false
  }
}

export async function checkAuth(): Promise<boolean> {
  try {
    const cookieStore = cookies()
    const session = cookieStore.get("admin_session")
    if (!session?.value) return false
    return validateToken(session.value)
  } catch (e) {
    console.error("checkAuth error:", e)
    return false
  }
}
