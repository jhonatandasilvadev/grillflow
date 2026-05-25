export type TableStatus = 'livre' | 'ocupada' | 'pagamento' | 'reservada';
export type OrderStatus = 'aguardando' | 'preparando' | 'pronto' | 'entregue' | 'cancelado';
export type PaymentMethod = 'dinheiro' | 'pix' | 'debito' | 'credito' | 'multiplo';

export interface RestaurantTable {
  id: string;
  name: string;
  seats: number;
  status: TableStatus;
  billTotal: number;
  tabs: number;
  x: number;
  y: number;
  width?: number;
  height?: number;
  qrSlug?: string;
}

export interface Category {
  id: string;
  name: string;
  active: boolean;
}

export interface Product {
  id: string;
  categoryId: string;
  name: string;
  description: string;
  price: number;
  image: string;
  active: boolean;
  additions: string[];
}

export interface Order {
  id: string;
  number: string;
  table: string;
  customer: string;
  createdAt: string;
  status: OrderStatus;
  priority: 'normal' | 'alta';
  total: number;
  items: Array<{ name: string; qty: number; notes?: string }>;
}

export interface InventoryItem {
  id: string;
  name: string;
  quantity: number;
  min: number;
  unit: string;
  cost: number;
  supplier: string;
}

export interface CashEntry {
  id: string;
  kind: 'entrada' | 'saida' | 'sangria' | 'suprimento' | 'despesa';
  label: string;
  amount: number;
  method: PaymentMethod;
  time: string;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  orders: number;
  totalSpent: number;
  preference: string;
}

export interface TabAccount {
  id: string;
  tableId: string;
  customer: string;
  status: 'aberta' | 'pagamento' | 'fechada';
  orderIds: string[];
  discount: number;
  serviceTax: number;
  paymentMethod: PaymentMethod;
  createdAt: string;
}

export interface InventoryMovement {
  id: string;
  inventoryId: string;
  kind: 'entrada' | 'saida';
  quantity: number;
  note: string;
  time: string;
}
