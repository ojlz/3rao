import { getAdminEmails } from "./store"

const fromName = process.env.BREVO_FROM_NAME || "3 Ano - Nao Responda"
const fromEmail = process.env.BREVO_FROM_EMAIL || ""

function formatPrice(cents: number): string {
  return `R$ ${(cents / 100).toFixed(2).replace(".", ",")}`
}

function pedidoHtml(orderId: string): string {
  return `<p style="margin:0 0 4px;font-size:12px;color:#A68B6B;text-transform:uppercase">Pedido</p>
<p style="margin:0;font-size:22px;font-weight:bold;color:#E8D5B7">#${orderId}</p>`
}

function wrapHtml(content: string): string {
  return `<!DOCTYPE html><html><body>
<div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:24px;background:#1D150D;color:#E8D5B7;border-radius:12px">
${content}
<hr style="border:none;border-top:1px solid #2A1F14;margin:16px 0">
<p style="color:#A68B6B;font-size:11px;text-align:center">Espetao do Terceirao · Terceirao</p>
</div></body></html>`
}

async function send(to: string, subject: string, html: string, attachmentBase64?: string) {
  const key = process.env.BREVO_API_KEY
  if (!key) {
    console.error("BREVO_API_KEY nao configurada")
    return
  }
  if (!fromEmail) {
    console.error("BREVO_FROM_EMAIL nao configurado")
    return
  }

  const body: Record<string, unknown> = {
    sender: { name: fromName, email: fromEmail },
    to: [{ email: to }],
    subject,
    htmlContent: wrapHtml(html),
  }

  if (attachmentBase64) {
    body.attachment = [{ content: attachmentBase64, name: "ficha.png" }]
  }

  try {
    const res = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: {
        "api-key": key,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    })

    const text = await res.text()
    if (!res.ok) {
      console.error("Brevo error", res.status, text)
    }
  } catch (error) {
    console.error("Brevo fetch error:", error)
  }
}

export async function sendOrderConfirmation(
  to: string,
  orderId: string,
  customerName: string,
  totalPrice: number,
  pixKey: string,
  pixAmount: string,
  _token: string,
  trackingUrl: string
) {
  await send(to, `Pedido #${orderId} criado - Espetao do Terceirao`, `
    <h2 style="color:#E8D5B7;margin:0 0 8px">Pedido recebido!</h2>
    <p style="color:#A68B6B;margin:0 0 16px">Ola, <strong style="color:#E8D5B7">${customerName}</strong>!</p>
    <div style="background:#2A1F14;border-radius:8px;padding:16px;margin-bottom:16px">
      ${pedidoHtml(orderId)}
      <div style="border-top:1px solid #2A1F14;margin:12px 0;padding-top:12px">
        <p style="margin:0 0 4px;font-size:12px;color:#A68B6B;text-transform:uppercase">Valor</p>
        <p style="margin:0 0 12px;font-size:20px;font-weight:bold;color:#ffffff">${formatPrice(totalPrice)}</p>
        <p style="margin:0 0 4px;font-size:12px;color:#A68B6B;text-transform:uppercase">Chave PIX</p>
        <p style="margin:0 0 4px;font-family:monospace;color:#E8D5B7;font-size:14px">${pixKey}</p>
        <p style="margin:0 0 4px;font-size:12px;color:#A68B6B;text-transform:uppercase">Valor PIX</p>
        <p style="margin:0;font-size:16px;font-weight:bold;color:#ffffff">R$ ${pixAmount}</p>
      </div>
    </div>
    <p style="color:#A68B6B;font-size:14px">Pague o valor exato e aguarde a aprovacao.</p>
    <a href="${trackingUrl}" style="display:block;background:#8B3A3A;color:#ffffff;text-decoration:none;text-align:center;padding:12px;border-radius:8px;font-weight:bold;font-size:14px;margin:16px 0">Acompanhar Pedido</a>
  `)
}

export async function sendOrderApproved(
  to: string,
  orderId: string,
  customerName: string,
  _token: string,
  ticketImageBase64: string,
  trackingUrl: string
) {
  await send(to, `Pedido #${orderId} aprovado! - Espetao do Terceirao`, `
    <h2 style="color:#4ade80;margin:0 0 8px">Pagamento aprovado!</h2>
    <p style="color:#A68B6B;margin:0 0 16px">Ola, <strong style="color:#E8D5B7">${customerName}</strong>!</p>
    <div style="background:#2A1F14;border-radius:8px;padding:16px;margin-bottom:16px">
      ${pedidoHtml(orderId)}
      <div style="border-top:1px solid #2A1F14;margin:12px 0;padding-top:12px">
        <p style="margin:0 0 4px;font-size:12px;color:#A68B6B;text-transform:uppercase">Token da ficha</p>
        <p style="margin:0;font-family:monospace;color:#E8D5B7;font-size:14px">${orderId}</p>
      </div>
    </div>
    <p style="color:#A68B6B;font-size:14px;margin-bottom:12px">Sua ficha para retirada:</p>
    ${ticketImageBase64 ? `<img src="data:image/png;base64,${ticketImageBase64}" alt="Ficha" style="display:block;max-width:100%;border-radius:12px;margin:0 auto" />` : ""}
    <a href="${trackingUrl}" style="display:block;background:#8B3A3A;color:#ffffff;text-decoration:none;text-align:center;padding:12px;border-radius:8px;font-weight:bold;font-size:14px;margin:8px 0">Baixar Ficha</a>
  `, ticketImageBase64 || undefined)
}

export async function notifyAdminNewOrder(
  customerName: string,
  customerPhone: string,
  customerEmail: string,
  orderId: string,
  totalPrice: number,
  adminUrl: string
) {
  const adminEmails = await getAdminEmails()
  if (!adminEmails || adminEmails.length === 0) return

  for (const email of adminEmails) {
    await send(email, `Pedido pendente #${orderId} - Espetao do Terceirao`, `
      <h2 style="color:#facc15;margin:0 0 12px">Novo pedido pendente!</h2>
      <div style="background:#2A1F14;border-radius:8px;padding:16px;margin-bottom:16px">
        ${pedidoHtml(orderId)}
        <div style="border-top:1px solid #2A1F14;margin:12px 0;padding-top:12px">
          <p style="margin:0 0 4px;font-size:12px;color:#A68B6B;text-transform:uppercase">Cliente</p>
          <p style="margin:0 0 4px;color:#E8D5B7;font-size:14px">${customerName}</p>
          <p style="margin:0 0 12px;color:#A68B6B;font-size:12px">${customerPhone} · ${customerEmail}</p>
          <p style="margin:0 0 4px;font-size:12px;color:#A68B6B;text-transform:uppercase">Valor</p>
          <p style="margin:0;font-size:16px;font-weight:bold;color:#ffffff">${formatPrice(totalPrice)}</p>
        </div>
      </div>
      <a href="${adminUrl}" style="display:block;background:#8B3A3A;color:#ffffff;text-decoration:none;text-align:center;padding:12px;border-radius:8px;font-weight:bold;font-size:14px">Ir para Dashboard</a>
    `)
  }
}
