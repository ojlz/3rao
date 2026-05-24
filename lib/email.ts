import nodemailer from "nodemailer"

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
})

const fromName = process.env.SMTP_FROM_NAME || "Espetão do Terceirão"
const fromEmail = process.env.SMTP_USER || "noreply@espeto.com"

function formatPrice(cents: number): string {
  return `R$ ${(cents / 100).toFixed(2).replace(".", ",")}`
}

function pedidoHtml(orderId: string): string {
  return `<p style="margin:0 0 4px;font-size:12px;color:#A68B6B;text-transform:uppercase">Pedido</p>
<p style="margin:0;font-size:22px;font-weight:bold;color:#E8D5B7">#${orderId}</p>`
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
  try {
    await transporter.sendMail({
      from: `"${fromName}" <${fromEmail}>`,
      to,
      subject: `Pedido #${orderId} criado - Espetão do Terceirão`,
      html: `
        <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:24px;background:#1D150D;color:#E8D5B7;border-radius:12px">
          <h2 style="color:#E8D5B7;margin:0 0 8px">Pedido recebido!</h2>
          <p style="color:#A68B6B;margin:0 0 16px">Olá, <strong style="color:#E8D5B7">${customerName}</strong>!</p>

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

          <p style="color:#A68B6B;font-size:14px">Pague o valor exato e aguarde a aprovação.</p>
          <p style="color:#A68B6B;font-size:14px">Salve o link abaixo para acompanhar:</p>

          <a href="${trackingUrl}" style="display:block;background:#8B3A3A;color:#ffffff;text-decoration:none;text-align:center;padding:12px;border-radius:8px;font-weight:bold;font-size:14px;margin:16px 0">
            Acompanhar Pedido
          </a>

          <p style="color:#A68B6B;font-size:12px;word-break:break-all">${trackingUrl}</p>

          <hr style="border:none;border-top:1px solid #2A1F14;margin:16px 0">
          <p style="color:#A68B6B;font-size:11px;text-align:center">Espetão do Terceirão · Terceirão</p>
        </div>
      `,
    })
  } catch (error) {
    console.error("Send order confirmation email error:", error)
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
  try {
    const imgCid = "ticket"
    await transporter.sendMail({
      from: `"${fromName}" <${fromEmail}>`,
      to,
      subject: `Pedido #${orderId} aprovado! - Espetão do Terceirão`,
      html: `
        <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:24px;background:#1D150D;color:#E8D5B7;border-radius:12px">
          <h2 style="color:#4ade80;margin:0 0 8px">Pagamento aprovado!</h2>
          <p style="color:#A68B6B;margin:0 0 16px">Olá, <strong style="color:#E8D5B7">${customerName}</strong>!</p>

          <div style="background:#2A1F14;border-radius:8px;padding:16px;margin-bottom:16px">
            ${pedidoHtml(orderId)}

            <div style="border-top:1px solid #2A1F14;margin:12px 0;padding-top:12px">
              <p style="margin:0 0 4px;font-size:12px;color:#A68B6B;text-transform:uppercase">Token da ficha</p>
              <p style="margin:0;font-family:monospace;color:#E8D5B7;font-size:14px">${token}</p>
            </div>
          </div>

          <p style="color:#A68B6B;font-size:14px;margin-bottom:12px">Sua ficha para retirada:</p>
          <img src="cid:${imgCid}" alt="Ficha ${orderId}" style="display:block;max-width:100%;border-radius:12px;margin:0 auto" />

          <p style="color:#A68B6B;font-size:12px;text-align:center;margin-top:12px">Ou acesse o link para baixar:</p>
          <a href="${trackingUrl}" style="display:block;background:#8B3A3A;color:#ffffff;text-decoration:none;text-align:center;padding:12px;border-radius:8px;font-weight:bold;font-size:14px;margin:8px 0">
            Baixar Ficha
          </a>

          <hr style="border:none;border-top:1px solid #2A1F14;margin:16px 0">
          <p style="color:#A68B6B;font-size:11px;text-align:center">Apresente o QR Code no dia da retirada.</p>
        </div>
      `,
      attachments: [
        {
          filename: `ficha-${orderId}.png`,
          content: ticketImageBase64,
          encoding: "base64",
          cid: imgCid,
        },
      ],
    })
  } catch (error) {
    console.error("Send order approved email error:", error)
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
  const adminEmail = process.env.ADMIN_EMAIL
  if (!adminEmail) return

  try {
    await transporter.sendMail({
      from: `"${fromName}" <${fromEmail}>`,
      to: adminEmail,
      subject: `🆕 Pedido pendente #${orderId} - Espetão do Terceirão`,
      html: `
        <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:24px;background:#1D150D;color:#E8D5B7;border-radius:12px">
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
        </div>
      `,
    })
  } catch (error) {
    console.error("Notify admin email error:", error)
  }
}
