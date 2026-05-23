import fs from 'fs'
const c = fs.readFileSync('node_modules/@whiskeysockets/baileys/lib/Socket/socket.js', 'utf8')
const lines = c.split('\n')
lines.forEach((l, i) => {
  if (l.includes("ws.on('") || l.includes('ws.on("')) console.log(i + 1, l.trim())
})
