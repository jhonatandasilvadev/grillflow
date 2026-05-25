import {
  Box,
  Button,
  Card,
  CardBody,
  FormControl,
  FormLabel,
  HStack,
  Input,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  NumberInput,
  NumberInputField,
  Select,
  SimpleGrid,
  Text,
  Textarea,
  VStack,
  useDisclosure,
  useToast
} from '@chakra-ui/react';
import { Bell, Filter, Pencil, Plus, Send, Trash2 } from 'lucide-react';
import { useMemo, useState } from 'react';
import { products, tables } from '../../data/mockData';
import { currency } from '../../lib/format';
import { makeId, useAppState } from '../../state/AppState';
import type { Order, OrderStatus } from '../../types';
import { PageHeader } from '../../ui/PageHeader';
import { StatusBadge } from '../../ui/StatusBadge';

const emptyItem = { name: products[0]?.name ?? 'Item', qty: 1, notes: '' };
const statuses: OrderStatus[] = ['aguardando', 'preparando', 'pronto', 'entregue', 'cancelado'];

function emptyOrder(): Order {
  return {
    id: makeId('order'),
    number: `#${Math.floor(1000 + Math.random() * 9000)}`,
    table: tables[0]?.name ?? 'Mesa 01',
    customer: '',
    createdAt: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
    status: 'aguardando',
    priority: 'normal',
    total: 0,
    items: [{ ...emptyItem }]
  };
}

export function OrdersPage() {
  const { orders, setOrders } = useAppState();
  const [draft, setDraft] = useState<Order>(emptyOrder);
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const { isOpen, onOpen, onClose } = useDisclosure();
  const toast = useToast();

  const filteredOrders = useMemo(
    () =>
      orders.filter((order) => {
        const text = `${order.number} ${order.table} ${order.customer}`.toLowerCase();
        return text.includes(query.toLowerCase()) && (!statusFilter || order.status === statusFilter);
      }),
    [orders, query, statusFilter]
  );

  function openNew() {
    setDraft(emptyOrder());
    onOpen();
  }

  function openEdit(order: Order) {
    setDraft({ ...order, items: order.items.map((item) => ({ ...item })) });
    onOpen();
  }

  function calculateTotal(order: Order) {
    return order.items.reduce((sum, item) => {
      const product = products.find((entry) => entry.name === item.name);
      return sum + (product?.price ?? 0) * item.qty;
    }, 0);
  }

  function saveOrder() {
    if (!draft.customer.trim()) {
      toast({ title: 'Informe o cliente', status: 'warning' });
      return;
    }
    if (!draft.items.length || draft.items.some((item) => !item.name || item.qty <= 0)) {
      toast({ title: 'Adicione itens validos ao pedido', status: 'warning' });
      return;
    }
    const order = { ...draft, total: calculateTotal(draft) };
    const exists = orders.some((item) => item.id === order.id);
    setOrders(exists ? orders.map((item) => (item.id === order.id ? order : item)) : [order, ...orders]);
    toast({ title: exists ? 'Pedido atualizado' : 'Pedido criado', status: 'success' });
    onClose();
  }

  function removeOrder(orderId: string) {
    if (!window.confirm('Excluir este pedido?')) return;
    setOrders(orders.filter((order) => order.id !== orderId));
    toast({ title: 'Pedido excluido', status: 'success' });
  }

  function updateStatus(order: Order, status: OrderStatus) {
    setOrders(orders.map((item) => (item.id === order.id ? { ...item, status } : item)));
    toast({ title: `Pedido ${order.number} atualizado`, status: 'success' });
  }

  return (
    <VStack align="stretch" spacing={6}>
      <PageHeader eyebrow="Pedidos" title="Fila de pedidos em tempo real">
        <Button leftIcon={<Filter size={17} />} variant="ghost" onClick={() => { setQuery(''); setStatusFilter(''); }}>
          Limpar
        </Button>
        <Button leftIcon={<Bell size={17} />} onClick={openNew}>Pedido manual</Button>
      </PageHeader>
      <HStack flexWrap="wrap">
        <Input maxW={{ base: '100%', md: '320px' }} placeholder="Buscar pedido" value={query} onChange={(event) => setQuery(event.target.value)} />
        <Select maxW={{ base: '100%', md: '220px' }} value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
          <option value="">Todos status</option>
          {statuses.map((status) => <option key={status} value={status}>{status}</option>)}
        </Select>
      </HStack>

      {filteredOrders.length === 0 ? (
        <Card><CardBody><Text color="whiteAlpha.700">Nenhum pedido encontrado.</Text></CardBody></Card>
      ) : (
        <SimpleGrid columns={{ base: 1, lg: 3 }} spacing={4}>
          {filteredOrders.map((order) => (
            <Card key={order.id}>
              <CardBody>
                <HStack justify="space-between" mb={4}>
                  <Text fontSize="xl" fontWeight={900}>{order.number}</Text>
                  <StatusBadge status={order.status} />
                </HStack>
                <Text color="whiteAlpha.600" fontSize="sm">{order.createdAt} - {order.table} - {order.customer}</Text>
                <VStack align="stretch" mt={4} spacing={2}>
                  {order.items.map((item, index) => (
                    <HStack key={`${order.id}-${item.name}-${index}`} justify="space-between" p={3} borderRadius="12px" bg="whiteAlpha.100">
                      <Text fontWeight={700}>{item.qty}x {item.name}</Text>
                      <Text color="whiteAlpha.600" fontSize="sm">{item.notes ?? 'Sem obs.'}</Text>
                    </HStack>
                  ))}
                </VStack>
                <HStack justify="space-between" mt={5}>
                  <Text color="whiteAlpha.600">Total</Text>
                  <Text fontWeight={900}>{currency.format(order.total)}</Text>
                </HStack>
                <HStack mt={5} flexWrap="wrap">
                  <Select size="sm" value={order.status} onChange={(event) => updateStatus(order, event.target.value as OrderStatus)} maxW="170px">
                    {statuses.map((status) => <option key={status} value={status}>{status}</option>)}
                  </Select>
                  <Button size="sm" variant="ghost" leftIcon={<Send size={15} />} onClick={() => updateStatus(order, 'aguardando')}>Cozinha</Button>
                  <Button size="sm" variant="ghost" leftIcon={<Pencil size={15} />} onClick={() => openEdit(order)}>Editar</Button>
                  <Button size="sm" variant="ghost" leftIcon={<Trash2 size={15} />} onClick={() => removeOrder(order.id)}>Excluir</Button>
                </HStack>
              </CardBody>
            </Card>
          ))}
        </SimpleGrid>
      )}

      <Modal isOpen={isOpen} onClose={onClose} size="xl">
        <ModalOverlay />
        <ModalContent bg="brand.panel">
          <ModalHeader>{orders.some((order) => order.id === draft.id) ? 'Editar pedido' : 'Criar pedido'}</ModalHeader>
          <ModalBody>
            <VStack align="stretch" spacing={4}>
              <HStack align="flex-start">
                <FormControl isRequired><FormLabel>Cliente</FormLabel><Input value={draft.customer} onChange={(event) => setDraft({ ...draft, customer: event.target.value })} /></FormControl>
                <FormControl><FormLabel>Mesa</FormLabel><Select value={draft.table} onChange={(event) => setDraft({ ...draft, table: event.target.value })}>{tables.map((table) => <option key={table.id}>{table.name}</option>)}</Select></FormControl>
              </HStack>
              <FormControl><FormLabel>Status</FormLabel><Select value={draft.status} onChange={(event) => setDraft({ ...draft, status: event.target.value as OrderStatus })}>{statuses.map((status) => <option key={status} value={status}>{status}</option>)}</Select></FormControl>
              <VStack align="stretch">
                {draft.items.map((item, index) => (
                  <Box key={index} p={3} borderRadius="12px" bg="whiteAlpha.100">
                    <HStack align="flex-start">
                      <Select value={item.name} onChange={(event) => {
                        const items = [...draft.items];
                        items[index] = { ...item, name: event.target.value };
                        setDraft({ ...draft, items });
                      }}>{products.map((product) => <option key={product.id}>{product.name}</option>)}</Select>
                      <NumberInput min={1} value={item.qty} onChange={(_, value) => {
                        const items = [...draft.items];
                        items[index] = { ...item, qty: Number.isFinite(value) ? value : 1 };
                        setDraft({ ...draft, items });
                      }} maxW="110px"><NumberInputField /></NumberInput>
                      <Button variant="ghost" onClick={() => setDraft({ ...draft, items: draft.items.filter((_, itemIndex) => itemIndex !== index) })}>Remover</Button>
                    </HStack>
                    <Textarea mt={3} placeholder="Observacao" value={item.notes ?? ''} onChange={(event) => {
                      const items = [...draft.items];
                      items[index] = { ...item, notes: event.target.value };
                      setDraft({ ...draft, items });
                    }} />
                  </Box>
                ))}
              </VStack>
              <Button leftIcon={<Plus size={16} />} variant="ghost" onClick={() => setDraft({ ...draft, items: [...draft.items, { ...emptyItem }] })}>Adicionar item</Button>
            </VStack>
          </ModalBody>
          <ModalFooter gap={3}>
            <Button variant="ghost" onClick={onClose}>Cancelar</Button>
            <Button onClick={saveOrder}>Salvar</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </VStack>
  );
}
