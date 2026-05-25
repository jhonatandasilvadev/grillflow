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
  useColorMode,
  useToast,
  useDisclosure,
  Drawer,
  DrawerContent,
  DrawerOverlay,
  VStack
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
  Utensils
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

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

function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <VStack align="stretch" spacing={2} h="full">
      <HStack px={3} py={4} spacing={3}>
        <Flex align="center" justify="center" boxSize="42px" borderRadius="14px" bg="brand.orange">
          <Icon as={Utensils} boxSize={5} color="white" />
        </Flex>
        <Box>
          <Text fontWeight={900} fontSize="lg">
            GrillFlow
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
  const { setColorMode } = useColorMode();
  const toast = useToast();
  const location = useLocation();

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
          <Sidebar />
        </Box>
      </Show>

      <Drawer isOpen={isOpen} placement="left" onClose={onClose}>
        <DrawerOverlay />
        <DrawerContent bg="brand.bg" p={4}>
          <Sidebar onNavigate={onClose} />
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
            <Text display={{ base: 'none', md: 'block' }} color="whiteAlpha.600" fontSize="sm">
              {location.pathname}
            </Text>
            <IconButton
              aria-label="Tema escuro fixo"
              icon={<Settings />}
              variant="ghost"
              onClick={() => {
                setColorMode('dark');
                toast({ title: 'Tema escuro premium fixo', status: 'info', duration: 1200 });
              }}
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
