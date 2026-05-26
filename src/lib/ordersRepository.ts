import type { Order, OrderStatus } from '../types';
import { supabase } from './supabase';

type OrderItemRow = {
  id?: string;
  name: string;
  quantity: number;
  unit_price?: number | string | null;
  notes?: string | null;
};

type OrderRow = {
  id: string;
  number: string;
  table_id?: string | null;
  tables?: { name?: string | null } | null;
  customer_name?: string | null;
  status: OrderStatus;
  priority?: 'normal' | 'alta' | string | null;
  source?: 'admin' | 'qr' | string | null;
  total?: number | string | null;
  created_at?: string | null;
  updated_at?: string | null;
  order_items?: OrderItemRow[] | null;
};

function isUuid(value?: string) {
  return Boolean(value?.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i));
}

function timeFromIso(value?: string | null) {
  if (!value) return new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  return new Date(value).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}

function orderFromRow(row: OrderRow): Order {
  return {
    id: row.id,
    number: row.number,
    tableId: row.table_id ?? undefined,
    table: row.tables?.name ?? 'Mesa',
    customer: row.customer_name ?? 'Cliente',
    customerName: row.customer_name ?? 'Cliente',
    createdAt: timeFromIso(row.created_at),
    updatedAt: row.updated_at ?? row.created_at ?? undefined,
    status: row.status,
    priority: row.priority === 'alta' ? 'alta' : 'normal',
    total: Number(row.total ?? 0),
    items: (row.order_items ?? []).map((item) => ({
      name: item.name,
      qty: item.quantity,
      notes: item.notes ?? undefined
    })),
    source: row.source === 'qr' ? 'qr' : 'admin'
  };
}

export async function fetchOrdersFromSupabase() {
  if (!supabase) return null;

  const { data, error } = await supabase
    .from('orders')
    .select('id,number,table_id,customer_name,status,priority,source,total,created_at,updated_at,tables(name),order_items(name,quantity,unit_price,notes)')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Erro ao carregar pedidos do Supabase', error);
    return null;
  }

  return ((data ?? []) as unknown as OrderRow[]).map(orderFromRow);
}

export async function saveOrderToSupabase(order: Order) {
  if (!supabase) return null;

  const { data, error } = await supabase
    .from('orders')
    .insert({
      number: order.number,
      table_id: isUuid(order.tableId) ? order.tableId : null,
      customer_name: order.customerName ?? order.customer,
      status: order.status,
      priority: order.priority,
      source: order.source ?? 'admin',
      total: order.total
    })
    .select('id,number,table_id,customer_name,status,priority,source,total,created_at,updated_at,tables(name)')
    .single();

  if (error || !data) {
    console.error('Erro ao salvar pedido no Supabase', error);
    return null;
  }

  const savedOrder = orderFromRow({ ...(data as unknown as OrderRow), order_items: [] });
  const items = order.items.map((item) => ({
    order_id: savedOrder.id,
    name: item.name,
    quantity: item.qty,
    unit_price: order.total > 0 ? order.total / Math.max(1, order.items.reduce((sum, entry) => sum + entry.qty, 0)) : 0,
    notes: item.notes ?? null
  }));

  if (items.length > 0) {
    const { error: itemsError } = await supabase.from('order_items').insert(items);
    if (itemsError) {
      console.error('Erro ao salvar itens do pedido no Supabase', itemsError);
    }
  }

  return { ...order, id: savedOrder.id, createdAt: savedOrder.createdAt, updatedAt: savedOrder.updatedAt };
}

export async function updateOrderStatusInSupabase(orderId: string, status: OrderStatus) {
  if (!supabase || !isUuid(orderId)) return;

  const { error } = await supabase
    .from('orders')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', orderId);

  if (error) console.error('Erro ao atualizar status do pedido no Supabase', error);
}
