"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"

export default function AdminLogin() {
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function handleLogin() {
    setError("")
    if (!password) {
      setError("Digite a senha")
      return
    }
    setLoading(true)
    const res = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    })
    if (res.ok) {
      router.push("/admin/dashboard")
    } else {
      setError("Senha inválida")
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="card max-w-sm w-full">
        <h1 className="text-2xl font-bold text-bege text-center mb-6">Admin</h1>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Senha de admin"
          onKeyDown={(e) => e.key === "Enter" && handleLogin()}
        />
        {error && <p className="text-red-400 text-sm mt-2">{error}</p>}
        <button
          onClick={handleLogin}
          disabled={loading}
          className="btn-primary mt-4"
        >
          {loading ? "Entrando..." : "Entrar"}
        </button>
      </div>
    </div>
  )
}
