import { supabase } from './supabase';
import type { RestaurantTable, TableStatus } from '../types';

interface TableRow {
  id: string;
  name: string;
  seats: number;
  status: TableStatus;
  active?: boolean;
  archived?: boolean;
  qr_token: string;
  position_x: number | string;
  position_y: number | string;
  width?: number | string | null;
  height?: number | string | null;
}

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

function numberFromRow(value: number | string | null | undefined, fallback: number) {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : fallback;
}

export function tableFromSupabase(row: TableRow): RestaurantTable {
  return {
    id: row.id,
    name: row.name,
    seats: row.seats,
    status: row.status,
    active: row.active ?? true,
    archived: row.archived ?? false,
    billTotal: 0,
    tabs: 0,
    x: numberFromRow(row.position_x, 50),
    y: numberFromRow(row.position_y, 50),
    width: numberFromRow(row.width, 150),
    height: numberFromRow(row.height, 116),
    qrToken: row.qr_token
  };
}

export async function fetchTableByQrToken(qrToken: string) {
  if (!supabase) return null;

  const { data, error } = await supabase
    .from('tables')
    .select('id,name,seats,status,active,archived,qr_token,position_x,position_y,width,height')
    .eq('qr_token', qrToken)
    .maybeSingle<TableRow>();

  if (error) {
    console.error('Erro ao buscar mesa por QR Code', error);
    return null;
  }

  return data ? tableFromSupabase(data) : null;
}

export async function fetchTablesFromSupabase() {
  if (!supabase) return null;

  const { data, error } = await supabase
    .from('tables')
    .select('id,name,seats,status,active,archived,qr_token,position_x,position_y,width,height')
    .order('created_at', { ascending: true });

  if (error) {
    console.error('Erro ao carregar mesas do Supabase', error);
    return null;
  }

  return (data ?? []).map((row) => tableFromSupabase(row as TableRow));
}

export async function saveTableToSupabase(table: RestaurantTable) {
  if (!supabase) return null;

  const payload = {
    ...(isUuid(table.id) ? { id: table.id } : {}),
    name: table.name,
    seats: table.seats,
    status: table.status,
    active: table.active,
    archived: table.archived,
    qr_token: table.qrToken,
    position_x: table.x,
    position_y: table.y,
    width: table.width ?? 150,
    height: table.height ?? 116,
    updated_at: new Date().toISOString()
  };

  const { data, error } = await supabase
    .from('tables')
    .upsert(payload, { onConflict: 'qr_token' })
    .select('id,name,seats,status,active,archived,qr_token,position_x,position_y,width,height')
    .single<TableRow>();

  if (error) {
    console.error('Erro ao salvar mesa no Supabase', error);
    return null;
  }

  return tableFromSupabase(data);
}
