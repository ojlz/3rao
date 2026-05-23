import { makeWASocket, initAuthCreds, Browsers, BufferJSON, DisconnectReason } from "@whiskeysockets/baileys"
import pino from "pino"

const creds = initAuthCreds()
const keys = {
  get: async () => ({}),
  set: async () => {},
  clear: async () => {},
}

console.log("Creds registered:", creds.registered)
console.log("Connecting...")

let attempts = 0
function connect() {
  attempts++
  console.log(`\n--- Attempt ${attempts} ---`)
  
  const socket = makeWASocket({
    auth: { creds, keys },
    browser: Browsers.macOS("Desktop"),
    logger: pino({ level: "error" }),
    syncFullHistory: false,
  })

  socket.ev.on("connection.update", async (update) => {
    console.log("Connection update:", JSON.stringify(update, (k, v) => {
      if (k === 'qr') return v ? v.substring(0, 30) + '...' : v
      return v
    }, 2))

    if (update.qr) {
      console.log("✅ QR CODE RECEIVED! Scan with WhatsApp.")
    }

    if (update.connection === "open") {
      console.log("✅ CONNECTED!")
    }

    if (update.connection === "close") {
      const err = update.lastDisconnect?.error
      const statusCode = err?.output?.statusCode
      const msg = err?.message || err?.toString() || "unknown"
      console.log(`❌ Closed: statusCode=${statusCode}, message=${msg}`)
      
      if (statusCode === DisconnectReason.restartRequired && attempts < 3) {
        console.log("Server requested restart, reconnecting in 3s...")
        setTimeout(connect, 3000)
      }
    }
  })
}

connect()

setTimeout(() => {
  console.log("\nTest finished after 30 seconds")
  process.exit(0)
}, 30000)
