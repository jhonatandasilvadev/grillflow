import { Button, Card, CardBody, FormControl, FormLabel, HStack, Input, SimpleGrid, Switch, Text, VStack, useToast } from '@chakra-ui/react';
import { Save } from 'lucide-react';
import { isSupabaseConfigured } from '../../lib/supabase';
import { useAppState } from '../../state/AppState';
import { PageHeader } from '../../ui/PageHeader';

export function SettingsPage() {
  const { resetDemoData } = useAppState();
  const toast = useToast();
  return (
    <VStack align="stretch" spacing={6}>
      <PageHeader eyebrow="Configuracoes" title="Operacao, Supabase e experiencia">
        <Button leftIcon={<Save size={17} />} onClick={() => toast({ title: 'Configuracoes salvas localmente', status: 'success' })}>Salvar</Button>
      </PageHeader>
      <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={4}>
        <Card>
          <CardBody>
            <Text fontWeight={900} fontSize="lg" mb={5}>Restaurante</Text>
            <VStack align="stretch" spacing={4}>
              <FormControl>
                <FormLabel>Nome</FormLabel>
                <Input defaultValue="GrillFlow Burger" />
              </FormControl>
              <FormControl>
                <FormLabel>Taxa de servico</FormLabel>
                <Input defaultValue="10%" />
              </FormControl>
              <FormControl>
                <FormLabel>Base URL QR Code</FormLabel>
                <Input defaultValue={import.meta.env.VITE_PUBLIC_ORDER_BASE_URL ?? `${window.location.origin}/menu`} />
              </FormControl>
            </VStack>
          </CardBody>
        </Card>
        <Card>
          <CardBody>
            <Text fontWeight={900} fontSize="lg" mb={5}>Recursos premium</Text>
            <VStack align="stretch" spacing={4}>
              <HStack justify="space-between"><Text>Realtime Supabase</Text><Switch colorScheme="orange" isChecked={isSupabaseConfigured} /></HStack>
              <HStack justify="space-between"><Text>Som de novo pedido</Text><Switch colorScheme="orange" defaultChecked /></HStack>
              <HStack justify="space-between"><Text>Impressao automatica</Text><Switch colorScheme="orange" /></HStack>
              <HStack justify="space-between"><Text>PWA instalavel</Text><Switch colorScheme="orange" defaultChecked /></HStack>
              <Button variant="ghost" onClick={() => { if (window.confirm('Restaurar dados de demonstracao?')) { resetDemoData(); toast({ title: 'Dados restaurados', status: 'success' }); } }}>Restaurar demonstracao</Button>
            </VStack>
          </CardBody>
        </Card>
      </SimpleGrid>
    </VStack>
  );
}
