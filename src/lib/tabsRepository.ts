import type { PaymentMethod, TabAccount } from '../types';
import { supabase } from './supabase';

type TabRow = {
  id: string;
  table_id?: string | null;
  customer_name?: string | null;
  customer_cpf?: string | null;
  status: 'aberta' | 'pagamento' | 'fechada';
  order_ids?: string[] | null;
  discount?: number | string | null;
  service_tax?: number | string | null;
  payment_method?: PaymentMethod | null;
  total?: number | string | null;
  created_at?: string | null;
  opened_at?: string | null;
  closed_at?: string | null;
};

function isUuid(value?: string) {
  return Boolean(value?.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i));
}

function timeFromIso(value?: string | null) {
  if (!value) return new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  return new Date(value).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}

function tabFromRow(row: TabRow): TabAccount {
  return {
    id: row.id,
    tableId: row.table_id ?? '',
    customer: row.customer_name ?? 'Cliente',
    customerName: row.customer_name ?? 'Cliente',
    customerCpf: row.customer_cpf ?? undefined,
    status: row.status,
    orderIds: row.order_ids ?? [],
    discount: Number(row.discount ?? 0),
    serviceTax: Number(row.service_tax ?? 10),
    paymentMethod: row.payment_method ?? 'pix',
    createdAt: timeFromIso(row.created_at),
    openedAt: row.opened_at ?? undefined,
    closedAt: row.closed_at ?? undefined,
    total: Number(row.total ?? 0)
  };
}

export async function fetchTabsFromSupabase() {
  if (!supabase) return null;

  const { data, error } = await supabase
    .from('tab_accounts')
    .select('id,table_id,customer_name,customer_cpf,status,order_ids,discount,service_tax,payment_method,total,created_at,opened_at,closed_at')
    .neq('status', 'fechada')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Erro ao carregar comandas do Supabase', error);
    return null;
  }

  return ((data ?? []) as unknown as TabRow[]).map(tabFromRow);
}

export async function saveTabToSupabase(tab: TabAccount) {
  if (!supabase) return null;

  const { data, error } = await supabase
    .from('tab_accounts')
    .upsert({
      id: tab.id,
      table_id: isUuid(tab.tableId) ? tab.tableId : null,
      customer_name: tab.customerName ?? tab.customer,
      customer_cpf: tab.customerCpf ?? null,
      status: tab.status,
      order_ids: tab.orderIds,
      discount: tab.discount,
      service_tax: tab.serviceTax,
      payment_method: tab.paymentMethod,
      total: tab.total ?? 0,
      opened_at: tab.openedAt ?? null,
      closed_at: tab.closedAt ?? null,
      updated_at: new Date().toISOString()
    }, { onConflict: 'id' })
    .select('id,table_id,customer_name,customer_cpf,status,order_ids,discount,service_tax,payment_method,total,created_at,opened_at,closed_at')
    .single();

  if (error || !data) {
    console.error('Erro ao salvar comanda no Supabase', error);
    return null;
  }

  return tabFromRow(data as unknown as TabRow);
}
