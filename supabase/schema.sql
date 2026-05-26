create extension if not exists "pgcrypto";

create type table_status as enum ('livre', 'ocupada', 'pagamento', 'reservada');
create type order_status as enum ('aguardando', 'preparando', 'pronto', 'entregue', 'cancelado');
create type cash_kind as enum ('entrada', 'saida', 'sangria');
create type payment_method as enum ('dinheiro', 'pix', 'debito', 'credito', 'multiplo');

create table public.settings (
  id uuid primary key default gen_random_uuid(),
  restaurant_name text not null default 'GrillFlow Burger',
  service_tax numeric(5, 2) not null default 10,
  public_order_base_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.tables (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  seats int not null default 4,
  status table_status not null default 'livre',
  qr_token text not null unique default encode(gen_random_bytes(16), 'hex'),
  active boolean not null default true,
  archived boolean not null default false,
  position_x numeric(5, 2) not null default 50,
  position_y numeric(5, 2) not null default 50,
  width numeric(6, 2) not null default 150,
  height numeric(6, 2) not null default 116,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  sort_order int not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.products (
  id uuid primary key default gen_random_uuid(),
  category_id uuid references public.categories(id) on delete set null,
  name text not null,
  description text,
  price numeric(10, 2) not null,
  image_url text,
  active boolean not null default true,
  additions jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.customers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  phone text,
  preferences text,
  created_at timestamptz not null default now()
);

create table public.orders (
  id uuid primary key default gen_random_uuid(),
  number text not null unique,
  table_id uuid references public.tables(id) on delete set null,
  customer_id uuid references public.customers(id) on delete set null,
  customer_name text,
  status order_status not null default 'aguardando',
  priority text not null default 'normal',
  source text not null default 'waiter',
  total numeric(10, 2) not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  product_id uuid references public.products(id) on delete set null,
  name text not null,
  quantity int not null default 1,
  unit_price numeric(10, 2) not null default 0,
  notes text,
  additions jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);

create table public.inventory (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  quantity numeric(12, 3) not null default 0,
  min_quantity numeric(12, 3) not null default 0,
  unit text not null default 'un',
  cost numeric(10, 2) not null default 0,
  supplier text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.cash_flow (
  id uuid primary key default gen_random_uuid(),
  kind cash_kind not null,
  label text not null,
  amount numeric(10, 2) not null,
  method payment_method not null,
  order_id uuid references public.orders(id) on delete set null,
  created_at timestamptz not null default now()
);

create table public.expenses (
  id uuid primary key default gen_random_uuid(),
  label text not null,
  amount numeric(10, 2) not null,
  fixed boolean not null default false,
  due_date date,
  paid_at timestamptz,
  created_at timestamptz not null default now()
);

alter table public.settings enable row level security;
alter table public.tables enable row level security;
alter table public.categories enable row level security;
alter table public.products enable row level security;
alter table public.customers enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.inventory enable row level security;
alter table public.cash_flow enable row level security;
alter table public.expenses enable row level security;

alter table public.tables add column if not exists qr_token text;
update public.tables set qr_token = encode(gen_random_bytes(16), 'hex') where qr_token is null or qr_token = '';
alter table public.tables alter column qr_token set not null;
create unique index if not exists tables_qr_token_key on public.tables (qr_token);
alter table public.tables add column if not exists active boolean not null default true;
alter table public.tables add column if not exists archived boolean not null default false;
alter table public.tables add column if not exists width numeric(6, 2) not null default 150;
alter table public.tables add column if not exists height numeric(6, 2) not null default 116;

create policy "authenticated read settings" on public.settings for select to authenticated using (true);
create policy "public read tables by qr" on public.tables for select to anon, authenticated using (true);
create policy "public manage tables" on public.tables for all to anon using (true) with check (true);
create policy "authenticated full tables" on public.tables for all to authenticated using (true) with check (true);
create policy "public read active categories" on public.categories for select to anon, authenticated using (active = true);
create policy "authenticated full categories" on public.categories for all to authenticated using (true) with check (true);
create policy "public read active products" on public.products for select to anon, authenticated using (active = true);
create policy "authenticated full products" on public.products for all to authenticated using (true) with check (true);
create policy "authenticated full customers" on public.customers for all to authenticated using (true) with check (true);
create policy "authenticated full orders" on public.orders for all to authenticated using (true) with check (true);
create policy "authenticated full order items" on public.order_items for all to authenticated using (true) with check (true);
create policy "authenticated full inventory" on public.inventory for all to authenticated using (true) with check (true);
create policy "authenticated full cash flow" on public.cash_flow for all to authenticated using (true) with check (true);
create policy "authenticated full expenses" on public.expenses for all to authenticated using (true) with check (true);

insert into storage.buckets (id, name, public)
values ('product-images', 'product-images', true)
on conflict (id) do nothing;

alter publication supabase_realtime add table public.tables;
alter publication supabase_realtime add table public.orders;
alter publication supabase_realtime add table public.order_items;
alter publication supabase_realtime add table public.inventory;
alter publication supabase_realtime add table public.cash_flow;

insert into public.tables (name, seats, status, qr_token, active, archived, position_x, position_y, width, height)
values
  ('Mesa 01', 4, 'livre', 'a8f72d9e1cf5a6b00000000000000001', true, false, 14, 18, 150, 116),
  ('Mesa 02', 4, 'livre', 'a8f72d9e1cf5a6b00000000000000002', true, false, 34, 18, 150, 116),
  ('Mesa 03', 4, 'livre', 'a8f72d9e1cf5a6b00000000000000003', true, false, 54, 18, 150, 116),
  ('Mesa 04', 4, 'livre', 'a8f72d9e1cf5a6b00000000000000004', true, false, 74, 18, 150, 116),
  ('Mesa 05', 4, 'livre', 'a8f72d9e1cf5a6b00000000000000005', true, false, 14, 44, 150, 116),
  ('Mesa 06', 4, 'livre', 'a8f72d9e1cf5a6b00000000000000006', true, false, 34, 44, 150, 116),
  ('Mesa 07', 4, 'livre', 'a8f72d9e1cf5a6b00000000000000007', true, false, 54, 44, 150, 116),
  ('Mesa 08', 4, 'livre', 'a8f72d9e1cf5a6b00000000000000008', true, false, 74, 44, 150, 116),
  ('Mesa 09', 4, 'livre', 'a8f72d9e1cf5a6b00000000000000009', true, false, 14, 70, 150, 116),
  ('Mesa 10', 4, 'livre', 'a8f72d9e1cf5a6b00000000000000010', true, false, 34, 70, 150, 116),
  ('Mesa 11', 4, 'livre', 'a8f72d9e1cf5a6b00000000000000011', true, false, 54, 70, 150, 116),
  ('Mesa 12', 4, 'livre', 'a8f72d9e1cf5a6b00000000000000012', true, false, 74, 70, 150, 116)
on conflict (qr_token) do nothing;
