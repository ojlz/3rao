import { cookies } from "next/headers"
import { validateSession, deleteSession } from "./store"

export async function checkAuth(): Promise<boolean> {
  const cookieStore = cookies()
  const session = cookieStore.get("admin_session")
  if (!session?.value) return false
  return validateSession(session.value)
}

export async function logout(): Promise<void> {
  const cookieStore = cookies()
  const session = cookieStore.get("admin_session")
  if (session?.value) {
    await deleteSession(session.value)
  }
}