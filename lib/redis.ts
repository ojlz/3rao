import { Redis } from "@upstash/redis"

// Cliente lazy: só exige as variáveis quando realmente usado (build e
// páginas públicas não quebram sem env; as rotas de API/pedidos sim).
let _client: Redis | null = null

function getClient(): Redis {
  if (_client) return _client
  const url = process.env.UPSTASH_REDIS_REST_URL
  const token = process.env.UPSTASH_REDIS_REST_TOKEN
  if (!url || !token) {
    throw new Error(
      "UPSTASH_REDIS_REST_URL e UPSTASH_REDIS_REST_TOKEN são obrigatórios. " +
      "Configure .env.local com os valores do seu banco Redis no Upstash (https://upstash.com)."
    )
  }
  _client = new Redis({ url, token })
  return _client
}

export const redis = new Proxy({} as Redis, {
  get: (_target, prop) => {
    const client = getClient() as unknown as Record<string | symbol, unknown>
    const value = client[prop]
    return typeof value === "function"
      ? (value as (...args: unknown[]) => unknown).bind(client)
      : value
  },
})