import type {
  CashEntry,
  Category,
  Customer,
  InventoryItem,
  Order,
  Product,
  RestaurantTable
} from '../types';

export const tables: RestaurantTable[] = [
  { id: '1', name: 'Mesa 01', seats: 4, status: 'livre', active: true, archived: false, billTotal: 0, tabs: 0, x: 14, y: 18, width: 150, height: 116, qrToken: 'a8f72d9e1cf5a6b00000000000000001' },
  { id: '2', name: 'Mesa 02', seats: 4, status: 'livre', active: true, archived: false, billTotal: 0, tabs: 0, x: 34, y: 18, width: 150, height: 116, qrToken: 'a8f72d9e1cf5a6b00000000000000002' },
  { id: '3', name: 'Mesa 03', seats: 4, status: 'livre', active: true, archived: false, billTotal: 0, tabs: 0, x: 54, y: 18, width: 150, height: 116, qrToken: 'a8f72d9e1cf5a6b00000000000000003' },
  { id: '4', name: 'Mesa 04', seats: 4, status: 'livre', active: true, archived: false, billTotal: 0, tabs: 0, x: 74, y: 18, width: 150, height: 116, qrToken: 'a8f72d9e1cf5a6b00000000000000004' },
  { id: '5', name: 'Mesa 05', seats: 4, status: 'livre', active: true, archived: false, billTotal: 0, tabs: 0, x: 14, y: 44, width: 150, height: 116, qrToken: 'a8f72d9e1cf5a6b00000000000000005' },
  { id: '6', name: 'Mesa 06', seats: 4, status: 'livre', active: true, archived: false, billTotal: 0, tabs: 0, x: 34, y: 44, width: 150, height: 116, qrToken: 'a8f72d9e1cf5a6b00000000000000006' },
  { id: '7', name: 'Mesa 07', seats: 4, status: 'livre', active: true, archived: false, billTotal: 0, tabs: 0, x: 54, y: 44, width: 150, height: 116, qrToken: 'a8f72d9e1cf5a6b00000000000000007' },
  { id: '8', name: 'Mesa 08', seats: 4, status: 'livre', active: true, archived: false, billTotal: 0, tabs: 0, x: 74, y: 44, width: 150, height: 116, qrToken: 'a8f72d9e1cf5a6b00000000000000008' },
  { id: '9', name: 'Mesa 09', seats: 4, status: 'livre', active: true, archived: false, billTotal: 0, tabs: 0, x: 14, y: 70, width: 150, height: 116, qrToken: 'a8f72d9e1cf5a6b00000000000000009' },
  { id: '10', name: 'Mesa 10', seats: 4, status: 'livre', active: true, archived: false, billTotal: 0, tabs: 0, x: 34, y: 70, width: 150, height: 116, qrToken: 'a8f72d9e1cf5a6b00000000000000010' },
  { id: '11', name: 'Mesa 11', seats: 4, status: 'livre', active: true, archived: false, billTotal: 0, tabs: 0, x: 54, y: 70, width: 150, height: 116, qrToken: 'a8f72d9e1cf5a6b00000000000000011' },
  { id: '12', name: 'Mesa 12', seats: 4, status: 'livre', active: true, archived: false, billTotal: 0, tabs: 0, x: 74, y: 70, width: 150, height: 116, qrToken: 'a8f72d9e1cf5a6b00000000000000012' }
];

export const categories: Category[] = [
  { id: 'burgers', name: 'Hamburgueres', active: true },
  { id: 'combos', name: 'Combos', active: true },
  { id: 'drinks', name: 'Bebidas', active: true },
  { id: 'desserts', name: 'Sobremesas', active: true },
  { id: 'extras', name: 'Adicionais', active: true }
];

export const products: Product[] = [
  {
    id: 'p1',
    categoryId: 'burgers',
    name: 'Smash Flow',
    description: 'Blend 120g, cheddar, cebola caramelizada e molho da casa no brioche.',
    price: 31.9,
    image:
      'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=900&q=80',
    active: true,
    additions: ['Bacon', 'Cheddar extra', 'Ovo', 'Picles']
  },
  {
    id: 'p2',
    categoryId: 'burgers',
    name: 'Brasa Bacon',
    description: 'Burger alto, bacon crocante, queijo prato, maionese defumada e alface.',
    price: 39.9,
    image:
      'https://images.unsplash.com/photo-1550547660-d9450f859349?auto=format&fit=crop&w=900&q=80',
    active: true,
    additions: ['Bacon extra', 'Duplo burger', 'Molho spicy']
  },
  {
    id: 'p3',
    categoryId: 'combos',
    name: 'Combo Casal',
    description: 'Dois Smash Flow, batata grande e duas bebidas.',
    price: 89.9,
    image:
      'https://images.unsplash.com/photo-1594212699903-ec8a3eca50f5?auto=format&fit=crop&w=900&q=80',
    active: true,
    additions: ['Trocar bebida', 'Batata cheddar']
  },
  {
    id: 'p4',
    categoryId: 'drinks',
    name: 'Pink Lemonade',
    description: 'Limone artesanal com frutas vermelhas e gelo.',
    price: 14.9,
    image:
      'https://images.unsplash.com/photo-1621263764928-df1444c5e859?auto=format&fit=crop&w=900&q=80',
    active: true,
    additions: ['Sem gelo', 'Hortela']
  },
  {
    id: 'p5',
    categoryId: 'desserts',
    name: 'Brownie Flame',
    description: 'Brownie quente, calda de chocolate e sorvete de creme.',
    price: 24.9,
    image:
      'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?auto=format&fit=crop&w=900&q=80',
    active: true,
    additions: ['Calda extra', 'Sem sorvete']
  }
];

export const orders: Order[] = [
  {
    id: 'o1',
    number: '#1048',
    table: 'Mesa 01',
    customer: 'Ana Paula',
    createdAt: '14:12',
    status: 'preparando',
    priority: 'alta',
    total: 72.8,
    items: [
      { name: 'Smash Flow', qty: 2, notes: 'Sem picles' },
      { name: 'Pink Lemonade', qty: 2 }
    ]
  },
  {
    id: 'o2',
    number: '#1049',
    table: 'Mesa 03',
    customer: 'Rafael',
    createdAt: '14:18',
    status: 'aguardando',
    priority: 'normal',
    total: 114.8,
    items: [
      { name: 'Brasa Bacon', qty: 2 },
      { name: 'Batata cheddar', qty: 1, notes: 'Caprichar no bacon' }
    ]
  },
  {
    id: 'o3',
    number: '#1050',
    table: 'Balcao',
    customer: 'Delivery',
    createdAt: '14:25',
    status: 'pronto',
    priority: 'normal',
    total: 89.9,
    items: [{ name: 'Combo Casal', qty: 1 }]
  }
];

export const inventory: InventoryItem[] = [
  { id: 'i1', name: 'Blend bovino', quantity: 9, min: 12, unit: 'kg', cost: 32, supplier: 'Frigorifico Prime' },
  { id: 'i2', name: 'Pao brioche', quantity: 68, min: 40, unit: 'un', cost: 1.7, supplier: 'Padaria Central' },
  { id: 'i3', name: 'Cheddar', quantity: 4, min: 6, unit: 'kg', cost: 38, supplier: 'Laticinios Vale' },
  { id: 'i4', name: 'Batata congelada', quantity: 22, min: 10, unit: 'kg', cost: 14, supplier: 'Food Service' }
];

export const cashFlow: CashEntry[] = [
  { id: 'c1', kind: 'entrada', label: 'Mesa 01', amount: 128.7, method: 'pix', time: '13:42' },
  { id: 'c2', kind: 'entrada', label: 'Delivery', amount: 89.9, method: 'credito', time: '14:02' },
  { id: 'c3', kind: 'saida', label: 'Fornecedor bebidas', amount: 240, method: 'pix', time: '14:08' },
  { id: 'c4', kind: 'sangria', label: 'Sangria parcial', amount: 300, method: 'dinheiro', time: '14:30' }
];

export const customers: Customer[] = [
  { id: 'u1', name: 'Ana Paula', phone: '(11) 98888-0101', orders: 12, totalSpent: 846.4, preference: 'Sem picles' },
  { id: 'u2', name: 'Rafael Lima', phone: '(11) 97777-0202', orders: 8, totalSpent: 512.9, preference: 'Bacon extra' },
  { id: 'u3', name: 'Camila Torres', phone: '(11) 96666-0303', orders: 17, totalSpent: 1320.1, preference: 'Combo casal' }
];

export const revenueSeries = [
  { day: 'Seg', vendas: 2200, lucro: 720 },
  { day: 'Ter', vendas: 3100, lucro: 1100 },
  { day: 'Qua', vendas: 2850, lucro: 980 },
  { day: 'Qui', vendas: 3900, lucro: 1510 },
  { day: 'Sex', vendas: 6200, lucro: 2440 },
  { day: 'Sab', vendas: 7800, lucro: 3290 },
  { day: 'Dom', vendas: 4700, lucro: 1670 }
];

export const paymentSeries = [
  { name: 'Pix', value: 42 },
  { name: 'Credito', value: 31 },
  { name: 'Debito', value: 18 },
  { name: 'Dinheiro', value: 9 }
];
