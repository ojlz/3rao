import { Resend } from "resend"
import { getAdminEmails } from "./store"

const apiKey = process.env.RESEND_API_KEY
const resend = apiKey ? new Resend(apiKey) : null
const fromName = process.env.SMTP_FROM_NAME || "3 Ano - Nao Responda"
const fromEmail = process.env.RESEND_FROM_EMAIL || "onboarding@resend.dev"

function formatPrice(cents: number): string {
  return `R$ ${(cents / 100).toFixed(2).replace(".", ",")}`
}

function pedidoHtml(orderId: string): string {
  return `<p style="margin:0 0 4px;font-size:12px;color:#A68B6B;text-transform:uppercase">Pedido</p>
<p style="margin:0;font-size:22px;font-weight:bold;color:#E8D5B7">#${orderId}</p>`
}

const wrapHtml = (content: string) => `
<!DOCTYPE html>
<html><body>
<div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:24px;background:#1D150D;color:#E8D5B7;border-radius:12px">
${content}
<hr style="border:none;border-top:1px solid #2A1F14;margin:16px 0">
<p style="color:#A68B6B;font-size:11px;text-align:center">Espetao do Terceirao · Terceirao</p>
</div>
</body></html>`

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
  if (!resend) return console.error("Resend nao configurado (falta RESEND_API_KEY)")
  try {
    await resend.emails.send({
      from: `${fromName} <${fromEmail}>`,
      to,
      subject: `Pedido #${orderId} criado - Espetao do Terceirao`,
      html: wrapHtml(`
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
        <a href="${trackingUrl}" style="display:block;background:#8B3A3A;color:#ffffff;text-decoration:none;text-align:center;padding:12px;border-radius:8px;font-weight:bold;font-size:14px;margin:16px 0">
          Acompanhar Pedido
        </a>
      `),
    })
    console.log("Order confirmation sent to", to)
  } catch (error) {
    console.error("SendOrderConfirmation error:", error)
  }
}

export async function sendOrderApproved(
  to: string,
  orderId: string,
  customerName: string,
  token: string,
  ticketImageBase64: string,
  trackingUrl: string
) {
  if (!resend) return console.error("Resend nao configurado (falta RESEND_API_KEY)")
  try {
    await resend.emails.send({
      from: `${fromName} <${fromEmail}>`,
      to,
      subject: `Pedido #${orderId} aprovado! - Espetao do Terceirao`,
      html: wrapHtml(`
        <h2 style="color:#4ade80;margin:0 0 8px">Pagamento aprovado!</h2>
        <p style="color:#A68B6B;margin:0 0 16px">Ola, <strong style="color:#E8D5B7">${customerName}</strong>!</p>
        <div style="background:#2A1F14;border-radius:8px;padding:16px;margin-bottom:16px">
          ${pedidoHtml(orderId)}
          <div style="border-top:1px solid #2A1F14;margin:12px 0;padding-top:12px">
            <p style="margin:0 0 4px;font-size:12px;color:#A68B6B;text-transform:uppercase">Token da ficha</p>
            <p style="margin:0;font-family:monospace;color:#E8D5B7;font-size:14px">${token}</p>
          </div>
        </div>
        <p style="color:#A68B6B;font-size:14px;margin-bottom:12px">Sua ficha para retirada:</p>
        ${ticketImageBase64 ? `<img src="cid:ticket" alt="Ficha ${orderId}" style="display:block;max-width:100%;border-radius:12px;margin:0 auto" />` : ""}
        <p style="color:#A68B6B;font-size:12px;text-align:center;margin-top:12px">Ou acesse o link para baixar:</p>
        <a href="${trackingUrl}" style="display:block;background:#8B3A3A;color:#ffffff;text-decoration:none;text-align:center;padding:12px;border-radius:8px;font-weight:bold;font-size:14px;margin:8px 0">
          Baixar Ficha
        </a>
      `),
      attachments: ticketImageBase64 ? [
        {
          filename: `ficha-${orderId}.png`,
          content: ticketImageBase64,
        },
      ] : undefined,
    })
    console.log("Order approved email sent to", to)
  } catch (error) {
    console.error("SendOrderApproved error:", error)
  }
}

export async function notifyAdminNewOrder(
  customerName: string,
  customerPhone: string,
  customerEmail: string,
  orderId: string,
  totalPrice: number,
  adminUrl: string
) {
  if (!resend) return console.error("Resend nao configurado (falta RESEND_API_KEY)")
  const adminEmails = await getAdminEmails()
  if (!adminEmails || adminEmails.length === 0) return

  for (const email of adminEmails) {
    try {
      await resend.emails.send({
        from: `${fromName} <${fromEmail}>`,
        to: email,
        subject: `Pedido pendente #${orderId} - Espetao do Terceirao`,
        html: wrapHtml(`
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
          <a href="${adminUrl}" style="display:block;background:#8B3A3A;color:#ffffff;text-decoration:none;text-align:center;padding:12px;border-radius:8px;font-weight:bold;font-size:14px">
            Ir para Dashboard
          </a>
        `),
      })
      console.log("Admin notified:", email)
    } catch (error) {
      console.error("NotifyAdminNewOrder error:", error)
    }
  }
}
