import { Box, Button, Card, CardBody, Container, HStack, Image, SimpleGrid, Text, VStack, useToast } from '@chakra-ui/react';
import { Bell, Plus, ReceiptText, Send } from 'lucide-react';
import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { categories } from '../../data/mockData';
import { currency } from '../../lib/format';
import { tableQrSlug } from '../../lib/qrCard';
import { makeId, useAppState } from '../../state/AppState';

export function PublicMenuPage() {
  const { tableId } = useParams();
  const { products, orders, setOrders, tables } = useAppState();
  const [cart, setCart] = useState<Array<{ name: string; qty: number; notes?: string }>>([]);
  const toast = useToast();
  const table = tables.find((item) => item.id === tableId || tableQrSlug(item) === tableId);

  function addProduct(name: string) {
    const existing = cart.find((item) => item.name === name);
    setCart(existing ? cart.map((item) => item.name === name ? { ...item, qty: item.qty + 1 } : item) : [...cart, { name, qty: 1 }]);
    toast({ title: 'Item adicionado', description: `${name} entrou na comanda.`, status: 'success', duration: 1600 });
  }

  function sendOrder() {
    if (cart.length === 0) return toast({ title: 'Adicione itens antes de enviar', status: 'warning' });
    const total = cart.reduce((sum, item) => sum + (products.find((product) => product.name === item.name)?.price ?? 0) * item.qty, 0);
    setOrders([{ id: makeId('order'), number: `#${Math.floor(1000 + Math.random() * 9000)}`, table: table?.name ?? 'Mesa QR', customer: 'Cliente QR', createdAt: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }), status: 'aguardando', priority: 'normal', total, items: cart }, ...orders]);
    setCart([]);
    toast({ title: 'Pedido enviado para a cozinha', status: 'success' });
  }

  return (
    <Box minH="100vh" bg="brand.bg">
      <Box bgImage="linear-gradient(180deg, rgba(8,11,16,.18), #080b10 88%), url(https://images.unsplash.com/photo-1551782450-a2132b4ba21d?auto=format&fit=crop&w=1400&q=80)" bgSize="cover" bgPos="center" pt={8} pb={20}>
        <Container maxW="760px">
          <Text color="brand.orange" fontWeight={900}>GrillFlow Burger</Text>
          <Text mt={3} fontSize={{ base: '4xl', md: '5xl' }} fontWeight={900} lineHeight="1">Cardapio da {table?.name ?? 'mesa'}</Text>
          <Text mt={4} color="whiteAlpha.800" maxW="520px">Escolha seus itens, envie para a cozinha e acompanhe tudo sem chamar o atendente.</Text>
          <HStack mt={6} wrap="wrap"><Button leftIcon={<Bell size={17} />} variant="ghost" bg="whiteAlpha.100" onClick={() => toast({ title: 'Garcom chamado', status: 'success' })}>Chamar garcom</Button><Button leftIcon={<ReceiptText size={17} />} variant="ghost" bg="whiteAlpha.100" onClick={() => toast({ title: 'Solicitacao de conta enviada', status: 'success' })}>Pedir conta</Button></HStack>
        </Container>
      </Box>
      <Container maxW="760px" mt="-44px" pb={28}>
        <HStack overflowX="auto" pb={3} spacing={2}>{categories.map((category) => <Button key={category.id} size="sm" variant="ghost" bg="whiteAlpha.100" flexShrink={0}>{category.name}</Button>)}</HStack>
        <SimpleGrid columns={{ base: 1, sm: 2 }} spacing={4} mt={4}>{products.filter((product) => product.active).map((product) => <Card key={product.id} overflow="hidden"><Image src={product.image} alt={product.name} h="170px" objectFit="cover" /><CardBody><Text fontWeight={900}>{product.name}</Text><Text mt={1} color="whiteAlpha.600" fontSize="sm">{product.description}</Text><HStack mt={4} justify="space-between"><Text fontWeight={900}>{currency.format(product.price)}</Text><Button size="sm" leftIcon={<Plus size={16} />} onClick={() => addProduct(product.name)}>Adicionar</Button></HStack></CardBody></Card>)}</SimpleGrid>
      </Container>
      <Box position="fixed" left={0} right={0} bottom={0} p={4} bg="rgba(8,11,16,.84)" backdropFilter="blur(18px)" borderTop="1px solid" borderColor="whiteAlpha.100"><Container maxW="760px"><VStack align="stretch" spacing={3}>{cart.length > 0 ? <Text color="whiteAlpha.700">{cart.reduce((sum, item) => sum + item.qty, 0)} itens no pedido</Text> : null}<Button w="100%" size="lg" leftIcon={<Send size={18} />} onClick={sendOrder}>Enviar pedido para cozinha</Button></VStack></Container></Box>
    </Box>
  );
}
