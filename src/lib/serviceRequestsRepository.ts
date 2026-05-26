import type { ServiceRequest } from '../types';
import { supabase } from './supabase';

type ServiceRequestRow = {
  id: string;
  table_id?: string | null;
  tables?: { name?: string | null } | null;
  command_id?: string | null;
  customer_name?: string | null;
  kind: 'waiter' | 'bill';
  status: 'aberta' | 'atendida' | 'cancelada';
  created_at?: string | null;
};

function isUuid(value?: string) {
  return Boolean(value?.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i));
}

function timeFromIso(value?: string | null) {
  if (!value) return new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  return new Date(value).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}

function requestFromRow(row: ServiceRequestRow): ServiceRequest {
  return {
    id: row.id,
    tableId: row.table_id ?? undefined,
    table: row.tables?.name ?? 'Mesa',
    commandId: row.command_id ?? undefined,
    customer: row.customer_name ?? 'Cliente',
    kind: row.kind,
    status: row.status,
    createdAt: timeFromIso(row.created_at)
  };
}

export async function fetchOpenServiceRequests() {
  if (!supabase) return null;

  const { data, error } = await supabase
    .from('service_requests')
    .select('id,table_id,command_id,customer_name,kind,status,created_at,tables(name)')
    .eq('status', 'aberta')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Erro ao carregar chamados do Supabase', error);
    return null;
  }

  return ((data ?? []) as unknown as ServiceRequestRow[]).map(requestFromRow);
}

export async function createServiceRequest(request: Omit<ServiceRequest, 'id' | 'status' | 'createdAt'>) {
  if (!supabase) return null;

  const { data, error } = await supabase
    .from('service_requests')
    .insert({
      table_id: isUuid(request.tableId) ? request.tableId : null,
      command_id: request.commandId ?? null,
      customer_name: request.customer,
      kind: request.kind,
      status: 'aberta'
    })
    .select('id,table_id,command_id,customer_name,kind,status,created_at,tables(name)')
    .single();

  if (error || !data) {
    console.error('Erro ao criar chamado no Supabase', error);
    return null;
  }

  return requestFromRow(data as unknown as ServiceRequestRow);
}
