import { getAdminEmails } from "./store"

const RESEND_API_KEY = process.env.RESEND_API_KEY
const fromName = process.env.SMTP_FROM_NAME || "Espetão do Terceirão"
const fromEmail = process.env.RESEND_FROM_EMAIL || "onboarding@resend.dev"

function formatPrice(cents: number): string {
  return `R$ ${(cents / 100).toFixed(2).replace(".", ",")}`
}

function pedidoHtml(orderId: string): string {
  return `<p style="margin:0 0 4px;font-size:12px;color:#A68B6B;text-transform:uppercase">Pedido</p>
<p style="margin:0;font-size:22px;font-weight:bold;color:#E8D5B7">#${orderId}</p>`
}

async function sendEmail(to: string[], subject: string, html: string, attachments?: { filename: string; content: string; cid: string }[]) {
  if (!RESEND_API_KEY) {
    console.error("RESEND_API_KEY não configurada")
    return
  }

  try {
    const body: Record<string, unknown> = {
      from: `${fromName} <${fromEmail}>`,
      to,
      subject,
      html,
    }
    if (attachments) {
      body.attachments = attachments
    }
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    })
    if (!res.ok) {
      const text = await res.text()
      console.error("Resend error:", res.status, text)
    } else {
      console.log("Email sent successfully to:", to, "subject:", subject)
    }
  } catch (error) {
    console.error("Send email error:", error)
  }
}

export async function sendOrderConfirmation(
  to: string,
  orderId: string,
  customerName: string,
  totalPrice: number,
  pixKey: string,
  pixAmount: string,
  token: string,
  trackingUrl: string
) {
  await sendEmail([to], `Pedido #${orderId} criado - Espetão do Terceirão`, `
    <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:24px;background:#1D150D;color:#E8D5B7;border-radius:12px">
      <h2 style="color:#E8D5B7;margin:0 0 8px">Pedido recebido!</h2>
      <p style="color:#A68B6B;margin:0 0 16px">Ol\u00e1, <strong style="color:#E8D5B7">${customerName}</strong>!</p>

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

      <p style="color:#A68B6B;font-size:14px">Pague o valor exato e aguarde a aprova\u00e7\u00e3o.</p>
      <p style="color:#A68B6B;font-size:14px">Salve o link abaixo para acompanhar:</p>

      <a href="${trackingUrl}" style="display:block;background:#8B3A3A;color:#ffffff;text-decoration:none;text-align:center;padding:12px;border-radius:8px;font-weight:bold;font-size:14px;margin:16px 0">
        Acompanhar Pedido
      </a>

      <p style="color:#A68B6B;font-size:12px;word-break:break-all">${trackingUrl}</p>

      <hr style="border:none;border-top:1px solid #2A1F14;margin:16px 0">
      <p style="color:#A68B6B;font-size:11px;text-align:center">Espet\u00e3o do Terceir\u00e3o \u00b7 Terceir\u00e3o</p>
    </div>
  `)
}

export async function sendOrderApproved(
  to: string,
  orderId: string,
  customerName: string,
  token: string,
  ticketImageBase64: string,
  trackingUrl: string
) {
  await sendEmail([to], `Pedido #${orderId} aprovado! - Espetão do Terceirão`, `
    <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:24px;background:#1D150D;color:#E8D5B7;border-radius:12px">
      <h2 style="color:#4ade80;margin:0 0 8px">Pagamento aprovado!</h2>
      <p style="color:#A68B6B;margin:0 0 16px">Ol\u00e1, <strong style="color:#E8D5B7">${customerName}</strong>!</p>

      <div style="background:#2A1F14;border-radius:8px;padding:16px;margin-bottom:16px">
        ${pedidoHtml(orderId)}

        <div style="border-top:1px solid #2A1F14;margin:12px 0;padding-top:12px">
          <p style="margin:0 0 4px;font-size:12px;color:#A68B6B;text-transform:uppercase">Token da ficha</p>
          <p style="margin:0;font-family:monospace;color:#E8D5B7;font-size:14px">${token}</p>
        </div>
      </div>

      <p style="color:#A68B6B;font-size:14px;margin-bottom:12px">Sua ficha para retirada:</p>
      <img src="cid:ticket" alt="Ficha ${orderId}" style="display:block;max-width:100%;border-radius:12px;margin:0 auto" />

      <p style="color:#A68B6B;font-size:12px;text-align:center;margin-top:12px">Ou acesse o link para baixar:</p>
      <a href="${trackingUrl}" style="display:block;background:#8B3A3A;color:#ffffff;text-decoration:none;text-align:center;padding:12px;border-radius:8px;font-weight:bold;font-size:14px;margin:8px 0">
        Baixar Ficha
      </a>

      <hr style="border:none;border-top:1px solid #2A1F14;margin:16px 0">
      <p style="color:#A68B6B;font-size:11px;text-align:center">Apresente o QR Code no dia da retirada.</p>
    </div>
  `, ticketImageBase64 ? [
    {
      filename: `ficha-${orderId}.png`,
      content: ticketImageBase64,
      cid: "ticket",
    },
  ] : undefined)
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

  await sendEmail(adminEmails, `🆕 Pedido pendente #${orderId} - Espetão do Terceirão`, `
    <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:24px;background:#1D150D;color:#E8D5B7;border-radius:12px">
      <h2 style="color:#facc15;margin:0 0 12px">Novo pedido pendente!</h2>

      <div style="background:#2A1F14;border-radius:8px;padding:16px;margin-bottom:16px">
        ${pedidoHtml(orderId)}

        <div style="border-top:1px solid #2A1F14;margin:12px 0;padding-top:12px">
          <p style="margin:0 0 4px;font-size:12px;color:#A68B6B;text-transform:uppercase">Cliente</p>
          <p style="margin:0 0 4px;color:#E8D5B7;font-size:14px">${customerName}</p>
          <p style="margin:0 0 12px;color:#A68B6B;font-size:12px">${customerPhone} \u00b7 ${customerEmail}</p>

          <p style="margin:0 0 4px;font-size:12px;color:#A68B6B;text-transform:uppercase">Valor</p>
          <p style="margin:0;font-size:16px;font-weight:bold;color:#ffffff">${formatPrice(totalPrice)}</p>
        </div>
      </div>

      <a href="${adminUrl}" style="display:block;background:#8B3A3A;color:#ffffff;text-decoration:none;text-align:center;padding:12px;border-radius:8px;font-weight:bold;font-size:14px">
        Ir para Dashboard
      </a>
    </div>
  `)
}
