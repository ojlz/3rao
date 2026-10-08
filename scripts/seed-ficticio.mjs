// Popula o Redis com produtos 100% FICTICIOS de demonstracao.
// Uso:  npm run seed:ficticio   (com .env.local configurado)
// Nada aqui representa produtos, precos ou empresas reais.
import { Redis } from "@upstash/redis";
import { readFileSync, existsSync } from "node:fs";

// Carrega .env.local de forma simples (sem dependencias extras)
if (!process.env.UPSTASH_REDIS_REST_URL && existsSync(".env.local")) {
  for (const line of readFileSync(".env.local", "utf8").split("\n")) {
    const m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/);
    if (m) process.env[m[1]] ??= m[2].replace(/^["']|["']$/g, "");
  }
}

const { UPSTASH_REDIS_REST_URL: url, UPSTASH_REDIS_REST_TOKEN: token } = process.env;
if (!url || !token) {
  console.error("Faltam UPSTASH_REDIS_REST_URL / UPSTASH_REDIS_REST_TOKEN (.env.local).");
  process.exit(1);
}

const redis = new Redis({ url, token });
const now = new Date().toISOString();

const products = [
  {
    id: "demo-carne",
    name: "Espetinho Modelo de Carne (ficticio)",
    description: "Produto de demonstracao — nao existe, nao e vendido.",
    price: 1200,
    imageUrl: "",
    category: "espetinhos",
    complements: [{ name: "Farofa extra (demo)", price: 200, max: 2 }],
    available: true,
  },
  {
    id: "demo-frango",
    name: "Espetinho Modelo de Frango (ficticio)",
    description: "Produto de demonstracao — nao existe, nao e vendido.",
    price: 1000,
    imageUrl: "",
    category: "espetinhos",
    complements: [{ name: "Vinagrete extra (demo)", price: 150, max: 2 }],
    available: true,
  },
  {
    id: "demo-queijo",
    name: "Espetinho Modelo de Queijo (ficticio)",
    description: "Produto de demonstracao — nao existe, nao e vendido.",
    price: 900,
    imageUrl: "",
    category: "espetinhos",
    complements: [],
    available: true,
  },
  {
    id: "demo-refri",
    name: "Refrigerante Lata — Modelo (ficticio)",
    description: "Produto de demonstracao — nao existe, nao e vendido.",
    price: 600,
    imageUrl: "",
    category: "bebidas",
    complements: [],
    available: true,
  },
  {
    id: "demo-combo",
    name: "Combo Demonstracao (ficticio)",
    description: "2 espetinhos modelo + 1 refri modelo. Oferta inventada.",
    price: 2500,
    imageUrl: "",
    category: "combos",
    complements: [],
    available: true,
  },
];

for (const p of products) {
  await redis.hset("products", { [p.id]: JSON.stringify({ ...p, createdAt: now }) });
  console.log("ok:", p.id, "-", p.name);
}
console.log(products.length + " produtos ficticios cadastrados.");
