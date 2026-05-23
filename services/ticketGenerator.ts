import sharp from "sharp"
import QRCode from "qrcode"
import type { Order, OrderItem } from "@/types"

function formatCurrency(value: number): string {
  return `R$ ${(value / 100).toFixed(2).replace(".", ",")}`
}

export async function generateTicket(order: Order, eventDate: string): Promise<Buffer> {
  const qrBuffer = await QRCode.toBuffer(order.token, {
    width: 300,
    margin: 2,
    color: { dark: "#1D150D", light: "#FFFFFF" },
  })

  const textLines = [
    { text: "FICHA ESPETÃO DO TERCEIRÃO", size: 28, weight: "bold" as const },
    { text: "", size: 12 },
    { text: `Pedido: ${order.id}`, size: 18 },
    { text: `Cliente: ${order.customerName}`, size: 18 },
    { text: "", size: 12 },
    { text: "ITENS:", size: 20, weight: "bold" as const },
    ...order.items.map(
      (item: OrderItem) =>
        `${item.quantity}x ${item.productName}${item.complements.length > 0 ? ` (+${item.complements.join(", ")})` : ""}`
    ).map((t: string) => ({ text: t, size: 16 })),
    { text: "", size: 12 },
    { text: `Total: ${formatCurrency(order.totalPrice)}`, size: 20, weight: "bold" as const },
    { text: "", size: 8 },
    { text: `Token: ${order.token}`, size: 14 },
    { text: `Retirada: ${eventDate}`, size: 14 },
    { text: "", size: 16 },
    { text: "RETIRADA SOMENTE DOS ITENS MOSTRADOS NO SISTEMA", size: 14, weight: "bold" as const },
  ]

  const lineHeight = 32
  const padding = 40
  const qrSize = 200
  const width = 600
  const textHeight = textLines.reduce((acc, l) => acc + (l.text ? lineHeight : 16), 0)
  const height = padding * 2 + textHeight + qrSize + 40

  const svgRects = `<rect width="${width}" height="${height}" fill="#1D150D" rx="20"/><rect x="4" y="4" width="${width - 8}" height="${height - 8}" fill="none" stroke="#8B5E3C" stroke-width="2" rx="18"/>`
  const svgText = textLines
    .map((l, i) => {
      const y = padding + textLines.slice(0, i).reduce((acc, t) => acc + (t.text ? lineHeight : 16), 0) + 28
      const color = "#E8D5B7"
      const weight = l.weight || "normal"
      const fontSize = l.size
      return l.text
        ? `<text x="${width / 2}" y="${y}" font-family="monospace" font-size="${fontSize}" font-weight="${weight}" fill="${color}" text-anchor="middle">${escapeXml(l.text)}</text>`
        : ""
    })
    .join("")

  const qrX = (width - qrSize) / 2
  const qrY = height - padding - qrSize

  const svgContent = `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
    ${svgRects}
    ${svgText}
  </svg>`

  const svgOverlay = sharp(Buffer.from(svgContent))
  const pngOverlay = await svgOverlay.png().toBuffer()

  const qrResized = await sharp(qrBuffer).resize(qrSize, qrSize).png().toBuffer()

  const result = await sharp(pngOverlay)
    .composite([{ input: qrResized, top: qrY, left: qrX }])
    .png()
    .toBuffer()

  return result
}

function escapeXml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;")
}
