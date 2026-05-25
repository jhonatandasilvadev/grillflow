# GrillFlow POS

Sistema POC profissional para hamburgueria/restaurante, criado com React, TypeScript, Vite, Chakra UI, Framer Motion e Supabase-ready.

## Recursos

- Dashboard com KPIs, pedidos ativos, estoque baixo e fluxo de caixa.
- Gestao de mesas com mapa visual, status, comandas e QR Code por mesa.
- Pedidos por atendente ou cliente via rota publica `/menu/:tableId`.
- Painel da cozinha com cards grandes, prioridade e botoes de preparo.
- Cardapio com categorias, produtos, imagens, busca e disponibilidade.
- Estoque com minimo, custo, fornecedor e alertas.
- Financeiro com entradas, saidas, sangria, lucro diario/mensal e graficos.
- Comandas com subtotal, taxa, desconto e multiplas formas de pagamento.
- Clientes com historico e preferencias.
- Dark mode, mobile-first, PWA-ready e arquitetura preparada para Supabase.

## Stack

- React + TypeScript + Vite
- Chakra UI
- Framer Motion
- Recharts
- Supabase JS
- qrcode.react
- Vercel-ready

## Instalacao

```bash
npm install
npm run dev
```

A aplicacao roda em `http://localhost:5173`.

## Variaveis de ambiente

Copie `.env.example` para `.env`:

```bash
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_PUBLIC_ORDER_BASE_URL=https://your-domain.vercel.app/menu
```

Sem essas variaveis, o frontend continua funcionando com dados mockados.

## Supabase

1. Crie um projeto no Supabase.
2. Rode o arquivo `supabase/schema.sql` no SQL Editor.
3. Configure Authentication para os usuarios administrativos.
4. Use o bucket `product-images` para fotos de produtos.
5. Ative Realtime para pedidos, itens de pedido, mesas, estoque e caixa.

Tabelas preparadas:

- `tables`
- `orders`
- `order_items`
- `products`
- `categories`
- `inventory`
- `cash_flow`
- `expenses`
- `customers`
- `settings`

## Deploy na Vercel

1. Importe o repositorio na Vercel.
2. Configure as variaveis `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` e `VITE_PUBLIC_ORDER_BASE_URL`.
3. Use `npm run build` como build command.
4. Use `dist` como output directory.

## Estrutura

```text
src/
  data/          mocks centralizados da POC
  lib/           formatadores e cliente Supabase
  pages/admin/   modulos administrativos
  pages/public/  experiencia publica via QR Code
  styles/        CSS global
  ui/            componentes compartilhados
  router.tsx     rotas principais
  theme.ts       tema Chakra premium
supabase/
  schema.sql     contrato inicial do backend
public/
  manifest.webmanifest
  sw.js
```

## Proximos passos de producao

- Trocar mocks por hooks de dados com Supabase.
- Implementar autenticacao e permissoes por cargo.
- Persistir abertura/fechamento de caixa.
- Adicionar upload real de imagens no bucket `product-images`.
- Implementar sons, impressao termica e notificacoes push.
- Cobrir fluxos criticos com testes.
