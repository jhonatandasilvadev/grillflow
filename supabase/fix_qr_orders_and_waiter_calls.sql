create table if not exists public.service_requests (
  id uuid primary key default gen_random_uuid(),
  table_id uuid references public.tables(id) on delete set null,
  command_id text,
  customer_name text,
  kind text not null check (kind in ('waiter', 'bill')),
  status text not null default 'aberta' check (status in ('aberta', 'atendida', 'cancelada')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.tab_accounts (
  id text primary key,
  table_id uuid references public.tables(id) on delete set null,
  customer_name text not null,
  customer_cpf text,
  status text not null default 'aberta' check (status in ('aberta', 'pagamento', 'fechada')),
  order_ids text[] not null default '{}',
  discount numeric(10, 2) not null default 0,
  service_tax numeric(5, 2) not null default 10,
  payment_method payment_method not null default 'pix',
  total numeric(10, 2) not null default 0,
  opened_at timestamptz,
  closed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.service_requests enable row level security;
alter table public.tab_accounts enable row level security;

drop policy if exists "public read orders" on public.orders;
drop policy if exists "public create qr orders" on public.orders;
drop policy if exists "public update order status" on public.orders;
drop policy if exists "public read order items" on public.order_items;
drop policy if exists "public create order items" on public.order_items;
drop policy if exists "public read tab accounts" on public.tab_accounts;
drop policy if exists "public create tab accounts" on public.tab_accounts;
drop policy if exists "public update tab accounts" on public.tab_accounts;
drop policy if exists "public read service requests" on public.service_requests;
drop policy if exists "public create service requests" on public.service_requests;
drop policy if exists "public update service requests" on public.service_requests;

create policy "public read orders" on public.orders for select to anon using (true);
create policy "public create qr orders" on public.orders for insert to anon with check (source in ('qr', 'admin', 'waiter'));
create policy "public update order status" on public.orders for update to anon using (true) with check (true);
create policy "public read order items" on public.order_items for select to anon using (true);
create policy "public create order items" on public.order_items for insert to anon with check (true);
create policy "public read tab accounts" on public.tab_accounts for select to anon, authenticated using (true);
create policy "public create tab accounts" on public.tab_accounts for insert to anon, authenticated with check (true);
create policy "public update tab accounts" on public.tab_accounts for update to anon, authenticated using (true) with check (true);
create policy "public read service requests" on public.service_requests for select to anon, authenticated using (true);
create policy "public create service requests" on public.service_requests for insert to anon, authenticated with check (true);
create policy "public update service requests" on public.service_requests for update to anon, authenticated using (true) with check (true);

do $$
begin
  alter publication supabase_realtime add table public.orders;
exception
  when duplicate_object then null;
end $$;

do $$
begin
  alter publication supabase_realtime add table public.order_items;
exception
  when duplicate_object then null;
end $$;

do $$
begin
  alter publication supabase_realtime add table public.tab_accounts;
exception
  when duplicate_object then null;
end $$;

do $$
begin
  alter publication supabase_realtime add table public.service_requests;
exception
  when duplicate_object then null;
end $$;
