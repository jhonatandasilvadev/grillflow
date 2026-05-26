import { Button, Card, CardBody, Grid, HStack, Text, VStack, useToast } from '@chakra-ui/react';
import { BellRing, Printer } from 'lucide-react';
import { updateOrderStatusInSupabase } from '../../lib/ordersRepository';
import { useAppState } from '../../state/AppState';
import type { OrderStatus } from '../../types';
import { PageHeader } from '../../ui/PageHeader';
import { StatusBadge } from '../../ui/StatusBadge';

export function KitchenPage() {
  const { orders, setOrders } = useAppState();
  const toast = useToast();
  const kitchenOrders = orders.filter((order) => !['entregue', 'cancelado'].includes(order.status));

  function updateStatus(orderId: string, status: OrderStatus) {
    setOrders(orders.map((order) => (order.id === orderId ? { ...order, status } : order)));
    updateOrderStatusInSupabase(orderId, status);
    toast({ title: 'Status atualizado na cozinha', status: 'success' });
  }

  return (
    <VStack align="stretch" spacing={6}>
      <PageHeader eyebrow="KDS" title="Painel da cozinha">
        <Button leftIcon={<BellRing size={17} />} variant="ghost" onClick={() => toast({ title: 'Som de pedidos ativo', status: 'info' })}>
          Som de pedidos
        </Button>
        <Button leftIcon={<Printer size={17} />} onClick={() => toast({ title: 'Fila de impressao preparada', status: 'info' })}>Impressao</Button>
      </PageHeader>
      {kitchenOrders.length === 0 ? (
        <Card><CardBody><Text color="whiteAlpha.700">Nenhum pedido pendente na cozinha.</Text></CardBody></Card>
      ) : (
        <Grid templateColumns={{ base: '1fr', xl: 'repeat(3, 1fr)' }} gap={4}>
          {kitchenOrders.map((order) => (
            <Card key={order.id} borderColor={order.status === 'aguardando' || order.priority === 'alta' ? 'brand.orange' : 'whiteAlpha.100'}>
              <CardBody>
                <HStack justify="space-between">
                  <Text fontSize="3xl" fontWeight={900}>{order.number}</Text>
                  <StatusBadge status={order.status} />
                </HStack>
                <Text mt={1} color="whiteAlpha.600">{order.table} - {order.createdAt}</Text>
                <VStack align="stretch" mt={6} spacing={3}>
                  {order.items.map((item, index) => (
                    <Card key={`${item.name}-${index}`} bg="whiteAlpha.100">
                      <CardBody>
                        <Text fontSize="xl" fontWeight={900}>{item.qty}x {item.name}</Text>
                        {item.notes ? <Text mt={2} color="brand.amber" fontWeight={700}>{item.notes}</Text> : null}
                      </CardBody>
                    </Card>
                  ))}
                </VStack>
                <HStack mt={6} flexWrap="wrap">
                  <Button flex="1" variant="ghost" onClick={() => updateStatus(order.id, 'preparando')}>Preparar</Button>
                  <Button flex="1" onClick={() => updateStatus(order.id, 'pronto')}>Pronto</Button>
                  <Button flex="1" variant="ghost" onClick={() => updateStatus(order.id, 'entregue')}>Entregue</Button>
                </HStack>
              </CardBody>
            </Card>
          ))}
        </Grid>
      )}
    </VStack>
  );
}
