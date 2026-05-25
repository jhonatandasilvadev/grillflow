import { createBrowserRouter, Navigate } from 'react-router-dom';
import { AdminLayout } from './ui/AdminLayout';
import { DashboardPage } from './pages/admin/DashboardPage';
import { TablesPage } from './pages/admin/TablesPage';
import { OrdersPage } from './pages/admin/OrdersPage';
import { KitchenPage } from './pages/admin/KitchenPage';
import { MenuPage } from './pages/admin/MenuPage';
import { InventoryPage } from './pages/admin/InventoryPage';
import { FinancePage } from './pages/admin/FinancePage';
import { TabsPage } from './pages/admin/TabsPage';
import { CustomersPage } from './pages/admin/CustomersPage';
import { SettingsPage } from './pages/admin/SettingsPage';
import { PublicMenuPage } from './pages/public/PublicMenuPage';

export const router = createBrowserRouter([
  { path: '/', element: <Navigate to="/admin" replace /> },
  {
    path: '/admin',
    element: <AdminLayout />,
    children: [
      { index: true, element: <DashboardPage /> },
      { path: 'mesas', element: <TablesPage /> },
      { path: 'pedidos', element: <OrdersPage /> },
      { path: 'cozinha', element: <KitchenPage /> },
      { path: 'cardapio', element: <MenuPage /> },
      { path: 'estoque', element: <InventoryPage /> },
      { path: 'financeiro', element: <FinancePage /> },
      { path: 'comandas', element: <TabsPage /> },
      { path: 'clientes', element: <CustomersPage /> },
      { path: 'configuracoes', element: <SettingsPage /> }
    ]
  },
  { path: '/mesa/:tableId', element: <PublicMenuPage /> },
  { path: '/menu/:tableId', element: <PublicMenuPage /> },
  { path: '*', element: <Navigate to="/admin" replace /> }
]);
