import { NavLink, Outlet, useLocation } from 'react-router-dom';
import {
  Box,
  Button,
  Flex,
  HStack,
  Icon,
  IconButton,
  Show,
  Text,
  useToast,
  useDisclosure,
  Drawer,
  DrawerContent,
  DrawerOverlay,
  Badge,
  Popover,
  PopoverTrigger,
  PopoverContent,
  PopoverBody,
  Divider,
  VStack,
  Avatar
} from '@chakra-ui/react';
import {
  Banknote,
  BookOpen,
  ChefHat,
  ClipboardList,
  CreditCard,
  LayoutDashboard,
  Menu,
  Package,
  Settings,
  Table2,
  Users,
  Utensils,
  Bell
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { isQrOrder, playOrderAlert, SOUND_ENABLED_KEY } from '../lib/adminAlerts';
import { fetchOpenServiceRequests } from '../lib/serviceRequestsRepository';
import { supabase } from '../lib/supabase';
import { STORAGE_KEY, useAppState } from '../state/AppState';
import type { AppNotification, Order, ServiceRequest } from '../types';

const navItems: Array<{ label: string; href: string; icon: LucideIcon }> = [
  { label: 'Dashboard', href: '/admin', icon: LayoutDashboard },
  { label: 'Mesas', href: '/admin/mesas', icon: Table2 },
  { label: 'Pedidos', href: '/admin/pedidos', icon: ClipboardList },
  { label: 'Cozinha', href: '/admin/cozinha', icon: ChefHat },
  { label: 'Cardapio', href: '/admin/cardapio', icon: BookOpen },
  { label: 'Estoque', href: '/admin/estoque', icon: Package },
  { label: 'Financeiro', href: '/admin/financeiro', icon: Banknote },
  { label: 'Comandas', href: '/admin/comandas', icon: CreditCard },
  { label: 'Clientes', href: '/admin/clientes', icon: Users },
  { label: 'Configuracoes', href: '/admin/configuracoes', icon: Settings }
];

function Sidebar({ onNavigate, restaurantName, profileImage }: { onNavigate?: () => void; restaurantName: string; profileImage: string }) {
  return (
    <VStack align="stretch" spacing={2} h="full">
      <HStack px={3} py={4} spacing={3}>
        {profileImage ? (
          <Avatar name={restaurantName} src={profileImage} boxSize="42px" borderRadius="14px" />
        ) : (
          <Flex align="center" justify="center" boxSize="42px" borderRadius="14px" bg="brand.orange">
            <Icon as={Utensils} boxSize={5} color="white" />
          </Flex>
        )}
        <Box>
          <Text fontWeight={900} fontSize="lg">
            {restaurantName}
          </Text>
          <Text color="whiteAlpha.600" fontSize="xs" fontWeight={700}>
            Restaurant OS
          </Text>
        </Box>
      </HStack>
      <VStack align="stretch" spacing={1} flex="1">
        {navItems.map((item) => (
          <Button
            as={NavLink}
            key={item.href}
            to={item.href}
            onClick={onNavigate}
            justifyContent="flex-start"
            leftIcon={<Icon as={item.icon} boxSize={4} />}
            variant="ghost"
            px={3}
            h="42px"
            fontSize="sm"
            color="whiteAlpha.700"
            _activeLink={{ bg: 'whiteAlpha.100', color: 'white', boxShadow: 'inset 3px 0 0 #ff6b1a' }}
            end={item.href === '/admin'}
          >
            {item.label}
          </Button>
        ))}
      </VStack>
    </VStack>
  );
}

export function AdminLayout() {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const toast = useToast();
  const location = useLocation();
  const navigate = useNavigate();
  const { orders, setOrders, notifications, setNotifications, settings } = useAppState();
  const [soundEnabled, setSoundEnabled] = useState(localStorage.getItem(SOUND_ENABLED_KEY) === 'true');
  const notifiedOrders = useRef(new Set(notifications.map((notification) => notification.orderId)));
  const notifiedRequests = useRef(new Set(notifications.map((notification) => notification.requestId)));
  const unread = notifications.filter((notification) => notification.status === 'unread');

  const qrOrders = useMemo(() => orders.filter(isQrOrder), [orders]);

  const registerNewOrder = useCallback((order: Order) => {
    if (notifiedOrders.current.has(order.id)) return;
    notifiedOrders.current.add(order.id);
    const notification: AppNotification = {
      id: `notification-${order.id}`,
      orderId: order.id,
      kind: 'order',
      table: order.table,
      customer: order.customerName ?? order.customer,
      createdAt: order.createdAt,
      status: 'unread'
    };
    setNotifications((current) => [notification, ...current]);
    toast({
      title: 'Novo pedido recebido',
      description: `${order.table} - Cliente: ${order.customerName ?? order.customer}`,
      status: 'info',
      duration: 6000,
      isClosable: true
    });
    if (soundEnabled) playOrderAlert();
  }, [setNotifications, soundEnabled, toast]);

  const registerNewRequest = useCallback((request: ServiceRequest) => {
    if (notifiedRequests.current.has(request.id)) return;
    notifiedRequests.current.add(request.id);
    const notification: AppNotification = {
      id: `notification-${request.id}`,
      requestId: request.id,
      kind: request.kind,
      table: request.table,
      customer: request.customer,
      createdAt: request.createdAt,
      status: 'unread',
      message: request.kind === 'waiter' ? 'Chamar garcom' : 'Pedido de conta'
    };
    setNotifications((current) => [notification, ...current]);
    toast({
      title: notification.message,
      description: `${request.table} - Cliente: ${request.customer}`,
      status: 'info',
      duration: 6000,
      isClosable: true
    });
    if (soundEnabled) playOrderAlert();
  }, [setNotifications, soundEnabled, toast]);

  useEffect(() => {
    qrOrders.forEach(registerNewOrder);
  }, [qrOrders, registerNewOrder]);

  useEffect(() => {
    let active = true;

    async function syncRequests() {
      const requests = await fetchOpenServiceRequests();
      if (!active) return;
      requests?.forEach(registerNewRequest);

      try {
        const stored = JSON.parse(localStorage.getItem('grillflow.public-service-requests') ?? '[]') as ServiceRequest[];
        stored.filter((request) => request.status === 'aberta').forEach(registerNewRequest);
      } catch (error) {
        console.error('Erro ao consultar chamados locais', error);
      }
    }

    syncRequests();
    const interval = window.setInterval(syncRequests, 3000);

    const supabaseClient = supabase;
    if (!supabaseClient) {
      return () => {
        active = false;
        window.clearInterval(interval);
      };
    }

    const channel = supabaseClient
      .channel('grillflow-service-requests-alerts')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'service_requests' }, syncRequests)
      .subscribe();

    return () => {
      active = false;
      window.clearInterval(interval);
      supabaseClient.removeChannel(channel);
    };
  }, [registerNewRequest]);

  useEffect(() => {
    const interval = window.setInterval(() => {
      try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (!stored) return;
        const parsed = JSON.parse(stored) as { orders?: Order[] };
        if (parsed.orders && parsed.orders.length !== orders.length) {
          setOrders(parsed.orders);
        }
        parsed.orders?.filter(isQrOrder).forEach(registerNewOrder);
      } catch (error) {
        console.error('Erro ao consultar pedidos novos no localStorage', error);
      }
    }, 3000);
    return () => window.clearInterval(interval);
  }, [orders.length, registerNewOrder, setOrders]);

  function enableSound() {
    localStorage.setItem(SOUND_ENABLED_KEY, 'true');
    setSoundEnabled(true);
    playOrderAlert();
    toast({ title: 'Alertas sonoros ativados', status: 'success' });
  }

  function markAllRead() {
    setNotifications(notifications.map((notification) => ({ ...notification, status: 'read' })));
  }

  return (
    <Flex minH="100vh">
      <Show above="lg">
        <Box
          as="aside"
          pos="sticky"
          top="0"
          h="100vh"
          w="260px"
          p={4}
          bg="rgba(8, 11, 16, .78)"
          borderRight="1px solid"
          borderColor="whiteAlpha.100"
          backdropFilter="blur(22px)"
        >
          <Sidebar restaurantName={settings.restaurantName} profileImage={settings.profileImage} />
        </Box>
      </Show>

      <Drawer isOpen={isOpen} placement="left" onClose={onClose}>
        <DrawerOverlay />
        <DrawerContent bg="brand.bg" p={4}>
          <Sidebar onNavigate={onClose} restaurantName={settings.restaurantName} profileImage={settings.profileImage} />
        </DrawerContent>
      </Drawer>

      <Box flex="1" minW={0}>
        <Flex
          as="header"
          pos="sticky"
          top="0"
          zIndex="10"
          align="center"
          justify="space-between"
          px={{ base: 4, md: 8 }}
          py={4}
          bg="rgba(8, 11, 16, .72)"
          borderBottom="1px solid"
          borderColor="whiteAlpha.100"
          backdropFilter="blur(18px)"
        >
          <HStack>
            <Show below="lg">
              <IconButton aria-label="Abrir menu" icon={<Menu />} variant="ghost" onClick={onOpen} />
            </Show>
            <Box>
              <Text color="whiteAlpha.600" fontSize="xs" fontWeight={700}>
                Turno ativo
              </Text>
              <Text fontWeight={800}>Operacao do dia</Text>
            </Box>
          </HStack>
          <HStack>
            <Popover placement="bottom-end">
              <PopoverTrigger>
                <Box position="relative">
                  <IconButton aria-label="Notificacoes" icon={<Bell />} variant="ghost" onClick={markAllRead} />
                  {unread.length > 0 ? (
                    <Badge position="absolute" top="-1" right="-1" colorScheme="red" borderRadius="999px">
                      {unread.length}
                    </Badge>
                  ) : null}
                </Box>
              </PopoverTrigger>
              <PopoverContent bg="brand.panel" borderColor="whiteAlpha.200" w="320px">
                <PopoverBody>
                  <HStack justify="space-between" mb={3}>
                    <Text fontWeight={900}>Notificacoes</Text>
                    <Button size="xs" variant="ghost" onClick={soundEnabled ? () => { localStorage.setItem(SOUND_ENABLED_KEY, 'false'); setSoundEnabled(false); } : enableSound}>
                      {soundEnabled ? 'Som ativo' : 'Ativar alertas sonoros'}
                    </Button>
                  </HStack>
                  <Divider borderColor="whiteAlpha.200" mb={3} />
                  <VStack align="stretch" spacing={2}>
                    {notifications.length === 0 ? (
                      <Text color="whiteAlpha.600" fontSize="sm">Nenhum pedido novo.</Text>
                    ) : notifications.slice(0, 8).map((notification) => (
                      <Box key={notification.id} p={3} borderRadius="12px" bg={notification.status === 'unread' ? 'whiteAlpha.200' : 'whiteAlpha.100'}>
                        <Text fontWeight={900}>{notification.message ?? 'Novo pedido recebido'}</Text>
                        <Text color="whiteAlpha.700" fontSize="sm">{notification.table} - Cliente: {notification.customer}</Text>
                        <HStack justify="space-between" mt={2}>
                          <Text color="whiteAlpha.500" fontSize="xs">{notification.createdAt}</Text>
                          <Button size="xs" onClick={() => navigate(notification.kind === 'order' ? '/admin/pedidos' : '/admin/mesas')}>
                            {notification.kind === 'order' ? 'Ver pedido' : 'Ver mesa'}
                          </Button>
                        </HStack>
                      </Box>
                    ))}
                  </VStack>
                </PopoverBody>
              </PopoverContent>
            </Popover>
            <Text display={{ base: 'none', md: 'block' }} color="whiteAlpha.600" fontSize="sm">
              {location.pathname}
            </Text>
            <IconButton
              aria-label="Abrir configuracoes"
              icon={<Settings />}
              variant="ghost"
              onClick={() => navigate('/admin/configuracoes')}
            />
          </HStack>
        </Flex>
        <Box as="main" px={{ base: 4, md: 8 }} py={{ base: 5, md: 8 }} maxW="1500px" mx="auto">
          <Outlet />
        </Box>
      </Box>
    </Flex>
  );
}
