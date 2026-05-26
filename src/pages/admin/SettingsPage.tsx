import { Avatar, Button, Card, CardBody, FormControl, FormLabel, HStack, Input, SimpleGrid, Switch, Text, VStack, useToast } from '@chakra-ui/react';
import { ImagePlus, Save } from 'lucide-react';
import { useRef, useState } from 'react';
import { fileToImageDataUrl } from '../../lib/imageFiles';
import { isSupabaseConfigured } from '../../lib/supabase';
import { useAppState } from '../../state/AppState';
import { PageHeader } from '../../ui/PageHeader';

export function SettingsPage() {
  const { resetDemoData, settings, setSettings } = useAppState();
  const [draft, setDraft] = useState(settings);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const toast = useToast();

  function saveSettings() {
    setSettings(draft);
    toast({ title: 'Configuracoes salvas localmente', status: 'success' });
  }

  async function selectProfileImage(file?: File) {
    if (!file) return;

    try {
      const image = await fileToImageDataUrl(file, { maxSize: 720, quality: 0.84 });
      setDraft((current) => ({ ...current, profileImage: image }));
      toast({ title: 'Foto carregada', status: 'success' });
    } catch (error) {
      toast({
        title: 'Nao foi possivel carregar a foto',
        description: error instanceof Error ? error.message : undefined,
        status: 'error'
      });
    }
  }

  return (
    <VStack align="stretch" spacing={6}>
      <PageHeader eyebrow="Configuracoes" title="Operacao, Supabase e experiencia">
        <Button leftIcon={<Save size={17} />} onClick={saveSettings}>Salvar</Button>
      </PageHeader>
      <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={4}>
        <Card>
          <CardBody>
            <Text fontWeight={900} fontSize="lg" mb={5}>Restaurante</Text>
            <VStack align="stretch" spacing={4}>
              <HStack spacing={4} align="center">
                <Avatar name={draft.restaurantName} src={draft.profileImage} size="xl" bg="brand.orange" />
                <VStack align="flex-start" spacing={2}>
                  <Button leftIcon={<ImagePlus size={17} />} variant="ghost" onClick={() => fileInputRef.current?.click()}>
                    Alterar foto
                  </Button>
                  <Input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    display="none"
                    onChange={(event) => selectProfileImage(event.target.files?.[0])}
                  />
                </VStack>
              </HStack>
              <FormControl>
                <FormLabel>Nome</FormLabel>
                <Input value={draft.restaurantName} onChange={(event) => setDraft({ ...draft, restaurantName: event.target.value })} />
              </FormControl>
              <FormControl>
                <FormLabel>Taxa de servico</FormLabel>
                <Input
                  type="number"
                  min={0}
                  value={draft.serviceTax}
                  onChange={(event) => setDraft({ ...draft, serviceTax: Number(event.target.value) || 0 })}
                />
              </FormControl>
              <FormControl>
                <FormLabel>Base URL QR Code</FormLabel>
                <Input value={draft.publicOrderBaseUrl} onChange={(event) => setDraft({ ...draft, publicOrderBaseUrl: event.target.value })} />
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
