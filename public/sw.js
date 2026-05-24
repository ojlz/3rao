self.addEventListener("push", (event) => {
  let data
  try {
    data = event.data.json()
  } catch {
    return
  }

  const options = {
    body: data.body || "",
    icon: "/icon.png",
    badge: "/favicon.ico",
    data: { url: data.url || "/admin/dashboard" },
    vibrate: [200, 100, 200],
  }

  event.waitUntil(
    self.registration.showNotification(data.title || "Espetão do Terceirão", options)
  )
})

self.addEventListener("notificationclick", (event) => {
  event.notification.close()
  const url = event.notification.data?.url || "/admin/dashboard"
  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes(url.split("?")[0]) && "focus" in client) {
          return client.focus()
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(url)
      }
    })
  )
})
