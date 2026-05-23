"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { Camera, CameraOff, AlertTriangle } from "lucide-react"

interface ScanResult {
  valid: boolean
  message?: string
  error?: string
  order?: {
    customerName: string
    customerPhone: string
    items: { productName: string; quantity: number; complements: string[] }[]
    totalPrice: number
    orderId: string
    token: string
  }
}

export default function AdminScanner() {
  const [authenticated, setAuthenticated] = useState(false)
  const [scanning, setScanning] = useState(false)
  const [result, setResult] = useState<ScanResult | null>(null)
  const [manualToken, setManualToken] = useState("")
  const [cameraError, setCameraError] = useState("")
  const [status, setStatus] = useState("")
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const router = useRouter()

  useEffect(() => {
    fetch("/api/admin/check")
      .then((r) => r.json())
      .then((data) => {
        if (!data.authenticated) router.push("/admin/login")
        else setAuthenticated(true)
      })
    return () => stopCamera()
  }, [router])

  function stopCamera() {
    if (intervalRef.current) clearInterval(intervalRef.current)
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop())
      streamRef.current = null
    }
  }

  async function startScan() {
    setResult(null)
    setCameraError("")
    setStatus("Iniciando câmera...")
    setScanning(true)

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment", width: { ideal: 640 }, height: { ideal: 480 } },
        audio: false,
      })

      streamRef.current = stream

      if (videoRef.current) {
        videoRef.current.srcObject = stream
        await videoRef.current.play()
      }

      setStatus("Aponte a câmera para o QR Code da ficha")

      const canvas = canvasRef.current
      if (!canvas) return
      const ctx = canvas.getContext("2d")
      if (!ctx) return

      intervalRef.current = setInterval(async () => {
        const video = videoRef.current
        if (!video || !ctx) return

        if (video.readyState < 2) return

        canvas.width = video.videoWidth || 640
        canvas.height = video.videoHeight || 480

        ctx.drawImage(video, 0, 0, canvas.width, canvas.height)

        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)

        try {
          const jsQR = (await import("jsqr")).default
          const code = jsQR(imageData.data, imageData.width, imageData.height)

          if (code && code.data) {
            clearInterval(intervalRef.current!)
            intervalRef.current = null
            stopCamera()
            setScanning(false)
            validateToken(code.data)
          }
        } catch {}
      }, 500)
    } catch (err: any) {
      stopCamera()
      setScanning(false)
      const msg = err?.message || ""
      const name = err?.name || ""
      console.error("[Scanner] Erro completo:", err)
      if (msg.includes("NotAllowed") || msg.includes("Permission") || msg.includes("permission") || name === "NotAllowedError") {
        setCameraError("Permissão da câmera negada. Permita o acesso pelo navegador e tente novamente.")
      } else if (msg.includes("NotFound") || name === "NotFoundError") {
        setCameraError("Nenhuma câmera encontrada neste dispositivo.")
      } else if (msg.includes("undefined") || msg.includes("mediaDevices")) {
        setCameraError("Câmera não disponível. O site precisa ser acessado via HTTPS (use ngrok ou deploy na Vercel).")
      } else {
        setCameraError(`${name}${msg ? ": " + msg.slice(0, 80) : ""}. Use o campo abaixo para digitar o token.`)
      }
    }
  }

  async function validateToken(token: string) {
    const cleanToken = token.trim()
    const res = await fetch("/api/orders/validate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token: cleanToken }),
    })
    const data = await res.json()
    setResult(data)
  }

  function handleManualValidate() {
    if (manualToken.trim()) {
      validateToken(manualToken.trim())
    }
  }

  if (!authenticated) return null

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-40 bg-[#1D150D]/95 backdrop-blur-sm border-b border-marrom/30">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <h1 className="text-lg font-bold text-bege">Scanner QR</h1>
          <nav className="flex gap-2 text-xs items-center">
            <a href="/admin/dashboard" className="text-marrom hover:text-bege">Dashboard</a>
            <a href="/admin/products" className="text-marrom hover:text-bege">Produtos</a>
            <a href="/admin/orders" className="text-marrom hover:text-bege">Pedidos</a>
            <a href="/admin/fichas" className="text-marrom hover:text-bege">Fichas</a>
            <a href="/admin/scanner" className="text-bege">Scanner</a>
            <a href="/" className="text-marrom/50 hover:text-bege border-l border-marrom/30 pl-2 ml-1">←</a>
          </nav>
        </div>
      </header>
      <main className="max-w-lg mx-auto px-4 py-6">

        {!scanning && !result && (
          <div className="space-y-4">
            <button
              onClick={startScan}
              className="btn-primary flex items-center justify-center gap-2"
            >
              <Camera className="w-5 h-5" />
              Escanear QR Code
            </button>

            {cameraError && (
              <div className="card border-yellow-500/30 text-sm">
                <p className="text-yellow-400 flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
                  {cameraError}
                </p>
                {cameraError.includes("Permissão") && (
                  <p className="text-marrom text-xs mt-2">
                    No Chrome: clique no cadeado 🔒 na barra de endereço → Permissões → Câmera → Permitir. Depois recarregue.
                  </p>
                )}
              </div>
            )}

            <div className="relative">
              <div className="border-t border-marrom/30 my-6" />
              <span className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-[#1D150D] px-3 text-xs text-marrom">ou digite o token</span>
            </div>

            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="text"
                value={manualToken}
                onChange={(e) => setManualToken(e.target.value)}
                placeholder="Cole o token do pedido"
                className="w-full"
                onKeyDown={(e) => e.key === "Enter" && handleManualValidate()}
              />
              <button onClick={handleManualValidate} className="btn-primary w-full sm:w-auto sm:px-6 whitespace-nowrap">
                Validar
              </button>
            </div>
          </div>
        )}

        {scanning && (
          <div>
            <div className="relative w-full max-w-sm mx-auto rounded-xl overflow-hidden bg-black" style={{ aspectRatio: "4/3" }}>
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
              />
              <canvas ref={canvasRef} className="hidden" />
              <div className="absolute inset-0 border-2 border-dashed border-bege/40 rounded-xl m-6 flex items-center justify-center pointer-events-none">
                <div className="w-48 h-48 border-2 border-bege/60 rounded-lg" />
              </div>
            </div>
            <p className="text-sm text-marrom text-center mt-3 flex items-center justify-center gap-2">
              <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
              {status}
            </p>
            <button
              onClick={() => { stopCamera(); setScanning(false) }}
              className="btn-secondary mt-4 w-full"
            >
              Cancelar
            </button>
          </div>
        )}

        {result && (
          <div>
            <div className={`card mb-4 ${result.valid ? "border-green-500/50" : "border-red-500/50"}`}>
              <div className="text-center mb-4">
                <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-3 ${
                  result.valid ? "bg-green-500/20" : "bg-red-500/20"
                }`}>
                  <span className={`text-2xl ${result.valid ? "text-green-400" : "text-red-400"}`}>
                    {result.valid ? "✓" : "✗"}
                  </span>
                </div>
                <h2 className={`text-xl font-bold ${result.valid ? "text-green-400" : "text-red-400"}`}>
                  {result.valid ? "PEDIDO VÁLIDO" : result.error || "PEDIDO INVÁLIDO"}
                </h2>
              </div>
              {result.order && (
                <div className="space-y-2 text-sm">
                  <p><span className="text-marrom">Nome:</span> <span className="text-bege">{result.order.customerName}</span></p>
                  <p><span className="text-marrom">Telefone:</span> <span className="text-bege">{result.order.customerPhone}</span></p>
                  <div>
                    <p className="text-marrom mb-1">Itens:</p>
                    {result.order.items.map((item, i) => (
                      <p key={i} className="text-bege ml-2">
                        {item.quantity}x {item.productName}
                        {item.complements.length > 0 && ` (+${item.complements.join(", ")})`}
                      </p>
                    ))}
                  </div>
                  <p><span className="text-marrom">Total:</span> <span className="text-white font-bold">R$ {(result.order.totalPrice / 100).toFixed(2).replace(".", ",")}</span></p>
                  <p><span className="text-marrom">Pedido:</span> <span className="text-bege">#{result.order.orderId}</span></p>
                  <p><span className="text-marrom">Token:</span> <code className="text-bege bg-dark px-2 py-0.5 rounded text-xs">{result.order.token}</code></p>
                </div>
              )}
            </div>
            <button onClick={() => { setResult(null); setManualToken(""); setCameraError("") }} className="btn-primary">
              Nova Validação
            </button>
          </div>
        )}
      </main>
    </div>
  )
}
