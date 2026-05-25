import {
  Box,
  Button,
  Card,
  CardBody,
  Container,
  FormControl,
  FormLabel,
  HStack,
  Image,
  Input,
  NumberInput,
  NumberInputField,
  SimpleGrid,
  Text,
  Textarea,
  VStack,
  useToast
} from '@chakra-ui/react';
import { Bell, Minus, Plus, ReceiptText, Send, Trash2 } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { categories } from '../../data/mockData';
import { currency } from '../../lib/format';
import { tableQrSlug } from '../../lib/qrCard';
import { makeId, useAppState } from '../../state/AppState';
import type { TabAccount } from '../../types';

type CartItem = { productId: string; name: string; qty: number; notes?: string };

function onlyDigits(value: string) {
  return value.replace(/\D/g, '');
}

function isValidCpf(value: string) {
  return onlyDigits(value).length === 11;
}

export function PublicMenuPage() {
  const { tableId } = useParams();
  const { products, orders, setOrders, tables, tabs, setTabs, setTables } = useAppState();
  const table = tables.find((item) => item.id === tableId || tableQrSlug(item) === tableId);
  const sessionKey = `grillflow.public-command.${table ? tableQrSlug(table) : tableId}`;
  const storedCommandId = localStorage.getItem(sessionKey);
  const existingCommand = tabs.find((tab) => tab.id === storedCommandId && tab.status === 'aberta');
  const [command, setCommand] = useState<TabAccount | null>(existingCommand ?? null);
  const [name, setName] = useState(existingCommand?.customerName ?? existingCommand?.customer ?? '');
  const [cpf, setCpf] = useState(existingCommand?.customerCpf ?? '');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [orderObservation, setOrderObservation] = useState('');
  const toast = useToast();

  const commandOrders = useMemo(
    () => orders.filter((order) => command?.orderIds.includes(order.id)),
    [orders, command]
  );

  function openCommand() {
    if (!table) return toast({ title: 'Mesa nao encontrada', status: 'error' });
    if (!name.trim()) return toast({ title: 'Informe seu nome completo', status: 'warning' });
    if (!isValidCpf(cpf)) return toast({ title: 'Informe um CPF valido com 11 digitos', status: 'warning' });

    const openedAt = new Date().toISOString();
    const newCommand: TabAccount = {
      id: makeId('comanda'),
      tableId: table.id,
      customer: name.trim(),
      customerName: name.trim(),
      customerCpf: onlyDigits(cpf),
      status: 'aberta',
      orderIds: [],
      discount: 0,
      serviceTax: 10,
      paymentMethod: 'pix',
      createdAt: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
      openedAt,
      total: 0
    };

    setTabs([newCommand, ...tabs]);
    setTables(tables.map((item) => (item.id === table.id ? { ...item, status: 'ocupada', tabs: item.tabs + 1 } : item)));
    localStorage.setItem(sessionKey, newCommand.id);
    setCommand(newCommand);
    toast({ title: 'Comanda aberta', status: 'success' });
  }

  function addProduct(productId: string) {
    const product = products.find((item) => item.id === productId);
    if (!product) return;
    const existing = cart.find((item) => item.productId === productId);
    setCart(existing ? cart.map((item) => item.productId === productId ? { ...item, qty: item.qty + 1 } : item) : [...cart, { productId, name: product.name, qty: 1 }]);
    toast({ title: 'Item adicionado', description: `${product.name} entrou no pedido.`, status: 'success', duration: 1400 });
  }

  function updateQty(productId: string, qty: number) {
    if (qty <= 0) return setCart(cart.filter((item) => item.productId !== productId));
    setCart(cart.map((item) => (item.productId === productId ? { ...item, qty } : item)));
  }

  function sendOrder() {
    if (!table || !command) return toast({ title: 'Abra sua comanda antes de pedir', status: 'warning' });
    if (cart.length === 0) return toast({ title: 'Adicione itens antes de enviar', status: 'warning' });
    const total = cart.reduce((sum, item) => sum + (products.find((product) => product.id === item.productId)?.price ?? 0) * item.qty, 0);
    const now = new Date();
    const order = {
      id: makeId('order'),
      number: `#${Math.floor(1000 + Math.random() * 9000)}`,
      commandId: command.id,
      tableId: table.id,
      table: table.name,
      customer: command.customerName ?? command.customer,
      customerName: command.customerName ?? command.customer,
      createdAt: now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
      updatedAt: now.toISOString(),
      status: 'aguardando' as const,
      priority: 'normal' as const,
      total,
      items: cart.map(({ name, qty, notes }) => ({ name, qty, notes })),
      observation: orderObservation,
      source: 'qr' as const
    };
    const nextCommand = { ...command, orderIds: [...command.orderIds, order.id], total: (command.total ?? 0) + total };

    setOrders([order, ...orders]);
    setTabs(tabs.map((tab) => (tab.id === command.id ? nextCommand : tab)));
    setCommand(nextCommand);
    setCart([]);
    setOrderObservation('');
    toast({ title: 'Pedido enviado para a cozinha', status: 'success' });
  }

  if (!table) {
    return (
      <Box minH="100vh" bg="brand.bg" py={12}>
        <Container maxW="520px"><Card><CardBody><Text fontWeight={900}>Mesa nao encontrada</Text><Text mt={2} color="whiteAlpha.700">Confira o QR Code e tente novamente.</Text></CardBody></Card></Container>
      </Box>
    );
  }

  if (!command) {
    return (
      <Box minH="100vh" bg="brand.bg">
        <Box bgImage="linear-gradient(180deg, rgba(8,11,16,.18), #080b10 88%), url(https://images.unsplash.com/photo-1551782450-a2132b4ba21d?auto=format&fit=crop&w=1400&q=80)" bgSize="cover" bgPos="center" pt={8} pb={20}>
          <Container maxW="620px">
            <Text color="brand.orange" fontWeight={900}>GrillFlow Burger</Text>
            <Text mt={3} fontSize={{ base: '4xl', md: '5xl' }} fontWeight={900} lineHeight="1">Abrir comanda</Text>
            <Text mt={4} color="whiteAlpha.800">Informe seus dados para acessar o cardapio da {table.name}.</Text>
          </Container>
        </Box>
        <Container maxW="620px" mt="-44px" pb={12}>
          <Card>
            <CardBody>
              <VStack align="stretch" spacing={4}>
                <FormControl isRequired><FormLabel>Nome completo</FormLabel><Input value={name} onChange={(event) => setName(event.target.value)} placeholder="Seu nome" /></FormControl>
                <FormControl isRequired><FormLabel>CPF</FormLabel><Input value={cpf} onChange={(event) => setCpf(event.target.value)} placeholder="000.000.000-00" /></FormControl>
                <Button size="lg" onClick={openCommand}>Abrir comanda</Button>
              </VStack>
            </CardBody>
          </Card>
        </Container>
      </Box>
    );
  }

  return (
    <Box minH="100vh" bg="brand.bg">
      <Box bgImage="linear-gradient(180deg, rgba(8,11,16,.18), #080b10 88%), url(https://images.unsplash.com/photo-1551782450-a2132b4ba21d?auto=format&fit=crop&w=1400&q=80)" bgSize="cover" bgPos="center" pt={8} pb={20}>
        <Container maxW="760px">
          <Text color="brand.orange" fontWeight={900}>GrillFlow Burger</Text>
          <Text mt={3} fontSize={{ base: '4xl', md: '5xl' }} fontWeight={900} lineHeight="1">Cardapio da {table.name}</Text>
          <Text mt={4} color="whiteAlpha.800" maxW="520px">Comanda de {command.customerName ?? command.customer}. Escolha seus itens e envie para a cozinha.</Text>
          <HStack mt={6} wrap="wrap"><Button leftIcon={<Bell size={17} />} variant="ghost" bg="whiteAlpha.100" onClick={() => toast({ title: 'Garcom chamado', status: 'success' })}>Chamar garcom</Button><Button leftIcon={<ReceiptText size={17} />} variant="ghost" bg="whiteAlpha.100" onClick={() => toast({ title: 'Solicitacao de conta enviada', status: 'success' })}>Pedir conta</Button></HStack>
        </Container>
      </Box>
      <Container maxW="760px" mt="-44px" pb={cart.length > 0 ? 80 : 28}>
        <HStack overflowX="auto" pb={3} spacing={2}>{categories.map((category) => <Button key={category.id} size="sm" variant="ghost" bg="whiteAlpha.100" flexShrink={0}>{category.name}</Button>)}</HStack>
        {commandOrders.length > 0 ? (
          <Card mb={4}><CardBody><Text fontWeight={900}>Acompanhamento</Text><VStack align="stretch" mt={3}>{commandOrders.map((order) => <HStack key={order.id} justify="space-between"><Text color="whiteAlpha.700">{order.number}</Text><Text fontWeight={800}>{order.status}</Text></HStack>)}</VStack></CardBody></Card>
        ) : null}
        <SimpleGrid columns={{ base: 1, sm: 2 }} spacing={4} mt={4}>{products.filter((product) => product.active).map((product) => <Card key={product.id} overflow="hidden"><Image src={product.image} alt={product.name} h="170px" objectFit="cover" /><CardBody><Text fontWeight={900}>{product.name}</Text><Text mt={1} color="whiteAlpha.600" fontSize="sm">{product.description}</Text><HStack mt={4} justify="space-between"><Text fontWeight={900}>{currency.format(product.price)}</Text><Button size="sm" leftIcon={<Plus size={16} />} onClick={() => addProduct(product.id)}>Adicionar</Button></HStack></CardBody></Card>)}</SimpleGrid>
      </Container>
      <Box position="fixed" left={0} right={0} bottom={0} p={4} bg="rgba(8,11,16,.84)" backdropFilter="blur(18px)" borderTop="1px solid" borderColor="whiteAlpha.100">
        <Container maxW="760px">
          <VStack align="stretch" spacing={3}>
            {cart.map((item) => (
              <Card key={item.productId} bg="whiteAlpha.100">
                <CardBody py={3}>
                  <HStack justify="space-between" align="flex-start">
                    <Box flex="1"><Text fontWeight={800}>{item.name}</Text><Input mt={2} size="sm" placeholder="Observacao do item" value={item.notes ?? ''} onChange={(event) => setCart(cart.map((cartItem) => cartItem.productId === item.productId ? { ...cartItem, notes: event.target.value } : cartItem))} /></Box>
                    <HStack><Button size="sm" variant="ghost" onClick={() => updateQty(item.productId, item.qty - 1)}><Minus size={14} /></Button><NumberInput size="sm" w="64px" min={1} value={item.qty} onChange={(_, value) => updateQty(item.productId, Number.isFinite(value) ? value : 1)}><NumberInputField /></NumberInput><Button size="sm" variant="ghost" onClick={() => updateQty(item.productId, item.qty + 1)}><Plus size={14} /></Button><Button size="sm" variant="ghost" onClick={() => updateQty(item.productId, 0)}><Trash2 size={14} /></Button></HStack>
                  </HStack>
                </CardBody>
              </Card>
            ))}
            {cart.length > 0 ? <Textarea placeholder="Observacao geral do pedido" value={orderObservation} onChange={(event) => setOrderObservation(event.target.value)} /> : null}
            <Button w="100%" size="lg" leftIcon={<Send size={18} />} onClick={sendOrder}>Enviar pedido</Button>
          </VStack>
        </Container>
      </Box>
    </Box>
  );
}
