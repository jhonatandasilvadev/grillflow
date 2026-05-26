import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import {
  cashFlow as initialCashFlow,
  categories as initialCategories,
  customers as initialCustomers,
  inventory as initialInventory,
  orders as initialOrders,
  products as initialProducts,
  tables as initialTables
} from '../data/mockData';
import type {
  AppNotification,
  CashEntry,
  Category,
  Customer,
  InventoryItem,
  InventoryMovement,
  Order,
  Product,
  RestaurantSettings,
  RestaurantTable,
  TabAccount
} from '../types';
import { createQrToken } from '../lib/qrCard';
import { fetchTablesFromSupabase, saveTableToSupabase } from '../lib/tablesRepository';

interface AppData {
  tables: RestaurantTable[];
  categories: Category[];
  products: Product[];
  orders: Order[];
  inventory: InventoryItem[];
  cashFlow: CashEntry[];
  customers: Customer[];
  tabs: TabAccount[];
  inventoryMovements: InventoryMovement[];
  cashOpen: boolean;
  notifications: AppNotification[];
  settings: RestaurantSettings;
}

interface AppState extends AppData {
  setTables: (items: RestaurantTable[]) => void;
  setProducts: (items: Product[]) => void;
  setOrders: (items: Order[]) => void;
  setInventory: (items: InventoryItem[]) => void;
  setCashFlow: (items: CashEntry[]) => void;
  setCustomers: (items: Customer[]) => void;
  setTabs: (items: TabAccount[]) => void;
  setInventoryMovements: (items: InventoryMovement[]) => void;
  setCashOpen: (open: boolean) => void;
  setNotifications: (items: AppNotification[]) => void;
  setSettings: (settings: RestaurantSettings) => void;
  resetDemoData: () => void;
}

export const STORAGE_KEY = 'grillflow.app-state.v1';

const initialTabs: TabAccount[] = [
  {
    id: 'tab-1',
    tableId: '1',
    customer: 'Ana Paula',
    status: 'aberta',
    orderIds: ['o1'],
    discount: 0,
    serviceTax: 10,
    paymentMethod: 'pix',
    createdAt: '14:10'
  },
  {
    id: 'tab-2',
    tableId: '3',
    customer: 'Rafael',
    status: 'pagamento',
    orderIds: ['o2'],
    discount: 12,
    serviceTax: 10,
    paymentMethod: 'credito',
    createdAt: '14:16'
  }
];

const initialData: AppData = {
  tables: normalizeTables(initialTables),
  categories: initialCategories,
  products: initialProducts,
  orders: initialOrders,
  inventory: initialInventory,
  cashFlow: initialCashFlow,
  customers: initialCustomers,
  tabs: initialTabs,
  inventoryMovements: [],
  cashOpen: true,
  notifications: [],
  settings: {
    restaurantName: 'GrillFlow Burger',
    serviceTax: 10,
    publicOrderBaseUrl: typeof window === 'undefined' ? '/mesa' : `${window.location.origin}/mesa`,
    profileImage: ''
  }
};

const AppStateContext = createContext<AppState | null>(null);

function loadData(): AppData {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return initialData;
    const parsed = { ...initialData, ...JSON.parse(stored) } as AppData;
    return { ...parsed, tables: mergeDefaultTables(parsed.tables) };
  } catch (error) {
    console.error('Erro ao carregar dados locais do GrillFlow', error);
    return initialData;
  }
}

function normalizeTables(tables: RestaurantTable[]) {
  return tables.map((table) => ({
    ...table,
    active: table.active ?? true,
    archived: table.archived ?? false,
    width: table.width ?? 150,
    height: table.height ?? 116,
    qrToken: table.qrToken ?? table.qrSlug ?? createQrToken()
  }));
}

function mergeDefaultTables(tables: RestaurantTable[]) {
  const defaultTables = normalizeTables(initialTables);
  const defaultIds = new Set(defaultTables.map((table) => table.id));
  const defaultTokens = new Set(defaultTables.map((table) => table.qrToken));
  const existingTables = normalizeTables(tables).filter((table) => {
    const legacyDemoTable = table.qrToken?.startsWith('mesa-demo-') && defaultIds.has(table.id);
    return !legacyDemoTable;
  });
  const customTables = existingTables.filter((table) => !defaultIds.has(table.id) && !defaultTokens.has(table.qrToken));
  const defaultsWithLocalEdits = defaultTables.map((defaultTable) => {
    const storedTable = existingTables.find((table) => table.id === defaultTable.id || table.qrToken === defaultTable.qrToken);
    return storedTable ? { ...storedTable, qrToken: defaultTable.qrToken } : defaultTable;
  });

  return normalizeTables([...defaultsWithLocalEdits, ...customTables]);
}

export function AppStateProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<AppData>(loadData);

  useEffect(() => {
    let active = true;

    async function loadRemoteTables() {
      const remoteTables = await fetchTablesFromSupabase();
      if (!active || !remoteTables) return;

      if (remoteTables.length > 0) {
        const mergedTables = mergeDefaultTables(remoteTables);
        const remoteTokens = new Set(remoteTables.map((table) => table.qrToken));
        const missingDefaultTables = normalizeTables(initialTables).filter((table) => !remoteTokens.has(table.qrToken));
        setData((current) => ({ ...current, tables: mergedTables }));
        await Promise.all(missingDefaultTables.map((table) => saveTableToSupabase(table)));
        return;
      }

      const localTables = mergeDefaultTables(loadData().tables);
      await Promise.all(localTables.map((table) => saveTableToSupabase(table)));
    }

    loadRemoteTables();
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (error) {
      console.error('Erro ao salvar dados locais do GrillFlow', error);
    }
  }, [data]);

  const value = useMemo<AppState>(
    () => ({
      ...data,
      setTables: (tables) => setData((current) => ({ ...current, tables })),
      setProducts: (products) => setData((current) => ({ ...current, products })),
      setOrders: (orders) => setData((current) => ({ ...current, orders })),
      setInventory: (inventory) => setData((current) => ({ ...current, inventory })),
      setCashFlow: (cashFlow) => setData((current) => ({ ...current, cashFlow })),
      setCustomers: (customers) => setData((current) => ({ ...current, customers })),
      setTabs: (tabs) => setData((current) => ({ ...current, tabs })),
      setInventoryMovements: (inventoryMovements) =>
        setData((current) => ({ ...current, inventoryMovements })),
      setCashOpen: (cashOpen) => setData((current) => ({ ...current, cashOpen })),
      setNotifications: (notifications) => setData((current) => ({ ...current, notifications })),
      setSettings: (settings) => setData((current) => ({ ...current, settings })),
      resetDemoData: () => setData(initialData)
    }),
    [data]
  );

  return <AppStateContext.Provider value={value}>{children}</AppStateContext.Provider>;
}

export function useAppState() {
  const context = useContext(AppStateContext);
  if (!context) throw new Error('useAppState deve ser usado dentro de AppStateProvider');
  return context;
}

export function makeId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}
