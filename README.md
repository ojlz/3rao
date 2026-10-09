# 3rão — Pré-venda de espetinhos (demonstração com dados fictícios)

🌐 **Demo no ar:** https://3rao.vercel.app *(cardápio vazio sem as envs do Redis — ver abaixo)*

> **Aviso:** este repositório foi higienizado para portfólio. A chave PIX
> é falsa (`pagamento.exemplo.ficticio@exemplo.test`, em nome de
> “Loja Modelo Fictícia — Demonstração”) e **não leva a lugar nenhum**:
> nenhum pagamento é processado de verdade. Os produtos de exemplo em
> `scripts/seed-ficticio.mjs` são inventados. O sistema (pedidos, aprovação,
> fichas com QR) funciona normalmente, mas em modo demonstração.

Sistema de pré-venda com Next.js + Redis (Upstash): cardápio, carrinho,
pedido com PIX, ficha com QR Code, área admin (dashboard, pedidos, produtos,
scanner de QR, fichas).

## Rodar local

```bash
npm install
cp .env.example .env.local   # preencha com seu Redis de TESTE
npm run dev
```

Variáveis (`.env.local`, nunca commitado):

| Var | Exemplo |
| --- | ------- |
| `UPSTASH_REDIS_REST_URL` | seu banco de teste |
| `UPSTASH_REDIS_REST_TOKEN` | seu token de teste |
| `ADMIN_PASSWORD` | senha do painel admin |
| `EVENT_DATE` | data do evento |
| `PIX_KEY` | `pagamento.exemplo.ficticio@exemplo.test` (falsa) |
| `PIX_NAME` | `Loja Modelo Fictícia — Demonstração` (falsa) |

## Demo sem Redis (modo da Vercel)

Sem `UPSTASH_*` configurado, o app liga um **modo demo**: cardápio fictício
embutido (5 espetinhos + 2 refrigerantes + 1 combo) e pedidos/fichas em
memória. Tudo funciona (pedir, pagar PIX falso, aprovar, ficha com QR),
mas os dados zeram quando a instância esfria. Com Redis configurado, usa
o banco normal (persistente) e o cardápio vem de lá.

## Produtos fictícios de exemplo (com Redis)

```bash
npm run seed:ficticio
```

Cadastra 5 produtos inventados no Redis de teste. **Não rode contra o banco
de produção** — ele mistura os itens demo aos reais.

## Estrutura

- `app/` — loja (`/`), acompanhamento (`/pedido/[id]`), admin (`/admin/*`), APIs (`/api/*`)
- `lib/` — Redis e pedidos · `services/` — gerador de ficha com QR · `types/`
- `scripts/seed-ficticio.mjs` — seed de demonstração
