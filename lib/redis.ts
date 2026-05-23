import { Redis } from "@upstash/redis"

const url = process.env.UPSTASH_REDIS_REST_URL
const token = process.env.UPSTASH_REDIS_REST_TOKEN

if (!url || !token) {
  throw new Error(
    "UPSTASH_REDIS_REST_URL e UPSTASH_REDIS_REST_TOKEN são obrigatórios. " +
    "Configure .env.local com os valores do seu banco Redis no Upstash (https://upstash.com)."
  )
}

export const redis = new Redis({ url, token })