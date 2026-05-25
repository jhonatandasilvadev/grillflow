import {
  Box,
  Button,
  Card,
  CardBody,
  Grid,
  GridItem,
  HStack,
  Icon,
  SimpleGrid,
  Text,
  VStack,
  useToast
} from '@chakra-ui/react';
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis } from 'recharts';
import { Banknote, Bell, ChefHat, PackageX, ReceiptText, Table2 } from 'lucide-react';
import { revenueSeries } from '../../data/mockData';
import { currency } from '../../lib/format';
import { useAppState } from '../../state/AppState';
import { KpiCard } from '../../ui/KpiCard';
import { PageHeader } from '../../ui/PageHeader';
import { StatusBadge } from '../../ui/StatusBadge';

export function DashboardPage() {
  const { cashFlow, inventory, orders, tables } = useAppState();
  const toast = useToast();
  const daySales = 8468.4;
  const inProgress = orders.filter((order) => ['aguardando', 'preparando'].includes(order.status)).length;
  const occupied = tables.filter((table) => table.status === 'ocupada').length;
  const lowStock = inventory.filter((item) => item.quantity <= item.min).length;

  return (
    <VStack align="stretch" spacing={6}>
      <PageHeader eyebrow="Dashboard principal" title="Resumo inteligente da operacao">
        <Button leftIcon={<Bell size={17} />} onClick={() => toast({ title: 'Use Pedidos > Pedido manual para criar um novo pedido', status: 'info' })}>Novo pedido</Button>
      </PageHeader>

      <SimpleGrid columns={{ base: 1, sm: 2, xl: 4 }} spacing={4}>
        <KpiCard label="Vendas hoje" value={currency.format(daySales)} helper="+18% vs ontem" icon={Banknote} />
        <KpiCard label="Pedidos ativos" value={String(inProgress)} helper="2 com alta prioridade" icon={ReceiptText} tone="brand.amber" />
        <KpiCard label="Mesas ocupadas" value={`${occupied}/${tables.length}`} helper="67% do salao" icon={Table2} tone="brand.cyan" />
        <KpiCard label="Estoque baixo" value={String(lowStock)} helper="Reposicao sugerida" icon={PackageX} tone="brand.red" />
      </SimpleGrid>

      <Grid templateColumns={{ base: '1fr', xl: '1.35fr .65fr' }} gap={5}>
        <Card>
          <CardBody>
            <HStack justify="space-between" mb={5}>
              <Box>
                <Text fontWeight={800} fontSize="lg">
                  Fluxo de caixa semanal
                </Text>
                <Text color="whiteAlpha.600" fontSize="sm">
                  Vendas, lucro e previsao de demanda
                </Text>
              </Box>
              <Button size="sm" variant="ghost">
                Exportar
              </Button>
            </HStack>
            <Box h={{ base: '260px', md: '340px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={revenueSeries}>
                  <defs>
                    <linearGradient id="sales" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ff6b1a" stopOpacity={0.75} />
                      <stop offset="95%" stopColor="#ff6b1a" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke="#243040" vertical={false} />
                  <XAxis dataKey="day" stroke="#718096" tickLine={false} axisLine={false} />
                  <Tooltip
                    contentStyle={{ background: '#10161f', border: '1px solid #243040', borderRadius: 12 }}
                    formatter={(value) => currency.format(Number(value))}
                  />
                  <Area type="monotone" dataKey="vendas" stroke="#ff6b1a" fill="url(#sales)" strokeWidth={3} />
                  <Area type="monotone" dataKey="lucro" stroke="#39d98a" fill="transparent" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </Box>
          </CardBody>
        </Card>

        <GridItem>
          <Card h="full">
            <CardBody>
              <HStack justify="space-between" mb={5}>
                <Text fontWeight={800} fontSize="lg">
                  Cozinha ao vivo
                </Text>
                <Icon as={ChefHat} color="brand.orange" />
              </HStack>
              <VStack align="stretch" spacing={3}>
                {orders.map((order) => (
                  <Box key={order.id} p={4} borderRadius="14px" bg="whiteAlpha.100">
                    <HStack justify="space-between">
                      <Text fontWeight={800}>{order.number}</Text>
                      <StatusBadge status={order.status} />
                    </HStack>
                    <Text mt={2} color="whiteAlpha.700" fontSize="sm">
                      {order.table} - {order.items.map((item) => `${item.qty}x ${item.name}`).join(', ')}
                    </Text>
                  </Box>
                ))}
              </VStack>
            </CardBody>
          </Card>
        </GridItem>
      </Grid>

      <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4}>
        {cashFlow.map((entry) => (
          <Card key={entry.id}>
            <CardBody>
              <HStack justify="space-between">
                <Box>
                  <Text color="whiteAlpha.600" fontSize="sm">
                    {entry.time} - {entry.kind}
                  </Text>
                  <Text fontWeight={800}>{entry.label}</Text>
                </Box>
                <Text color={entry.kind === 'entrada' ? 'brand.green' : 'brand.red'} fontWeight={900}>
                  {currency.format(entry.amount)}
                </Text>
              </HStack>
            </CardBody>
          </Card>
        ))}
      </SimpleGrid>
    </VStack>
  );
}
