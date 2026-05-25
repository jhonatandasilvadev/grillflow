import {
  Box,
  Button,
  Card,
  CardBody,
  FormControl,
  FormLabel,
  Grid,
  HStack,
  Icon,
  Image,
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
  VStack,
  useDisclosure,
  useToast
} from '@chakra-ui/react';
import { QRCodeSVG } from 'qrcode.react';
import { Copy, Download, Eye, FileDown, Pencil, Plus, Trash2, Users } from 'lucide-react';
import { useRef, useState } from 'react';
import { currency } from '../../lib/format';
import {
  createQrCardDataUrl,
  downloadQrPdf,
  downloadQrPng,
  slugifyTable,
  tableQrSlug,
  tableQrUrl
} from '../../lib/qrCard';
import { makeId, useAppState } from '../../state/AppState';
import type { RestaurantTable, TableStatus } from '../../types';
import { PageHeader } from '../../ui/PageHeader';
import { StatusBadge } from '../../ui/StatusBadge';

const statuses: TableStatus[] = ['livre', 'ocupada', 'pagamento', 'reservada'];

function emptyTable(): RestaurantTable {
  const id = makeId('mesa');
  return {
    id,
    name: '',
    seats: 4,
    status: 'livre',
    billTotal: 0,
    tabs: 0,
    x: 50,
    y: 50,
    width: 150,
    height: 116,
    qrSlug: id
  };
}

export function TablesPage() {
  const { tables, setTables, tabs, setTabs } = useAppState();
  const [draft, setDraft] = useState<RestaurantTable>(emptyTable);
  const [qrPreview, setQrPreview] = useState<{ table: RestaurantTable; image: string } | null>(null);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const hallRef = useRef<HTMLDivElement | null>(null);
  const modal = useDisclosure();
  const qrModal = useDisclosure();
  const toast = useToast();
  const publicBase = import.meta.env.VITE_PUBLIC_ORDER_BASE_URL ?? `${window.location.origin}/menu`;

  function saveTable() {
    if (!draft.name.trim()) return toast({ title: 'Nome da mesa obrigatorio', status: 'warning' });
    if (draft.seats <= 0) return toast({ title: 'Quantidade de lugares obrigatoria', status: 'warning' });
    const exists = tables.some((table) => table.id === draft.id);
    const nextTable = {
      ...draft,
      width: draft.width ?? 150,
      height: draft.height ?? 116,
      qrSlug: draft.qrSlug ?? slugifyTable(draft.name, draft.id)
    };
    setTables(exists ? tables.map((table) => (table.id === draft.id ? nextTable : table)) : [...tables, nextTable]);
    toast({ title: exists ? 'Mesa atualizada' : 'Mesa cadastrada', status: 'success' });
    modal.onClose();
  }

  function removeTable(tableId: string) {
    if (tabs.some((tab) => tab.tableId === tableId && tab.status !== 'fechada')) {
      return toast({ title: 'Feche as comandas antes de excluir', status: 'warning' });
    }
    if (!window.confirm('Excluir esta mesa?')) return;
    setTables(tables.filter((table) => table.id !== tableId));
    toast({ title: 'Mesa excluida', status: 'success' });
  }

  function openTab(table: RestaurantTable) {
    const tab = {
      id: makeId('tab'),
      tableId: table.id,
      customer: table.name,
      status: 'aberta' as const,
      orderIds: [],
      discount: 0,
      serviceTax: 10,
      paymentMethod: 'pix' as const,
      createdAt: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
    };
    setTabs([tab, ...tabs]);
    setTables(tables.map((item) => (item.id === table.id ? { ...item, status: 'ocupada', tabs: item.tabs + 1 } : item)));
    toast({ title: 'Comanda aberta pela mesa', status: 'success' });
  }

  function startDrag(table: RestaurantTable, event: React.PointerEvent<HTMLDivElement>) {
    const hall = hallRef.current;
    if (!hall) return;
    const target = event.currentTarget;
    const targetRect = target.getBoundingClientRect();
    const offsetX = event.clientX - targetRect.left;
    const offsetY = event.clientY - targetRect.top;
    setDraggingId(table.id);
    target.setPointerCapture(event.pointerId);

    const move = (moveEvent: PointerEvent) => {
      const hallRect = hall.getBoundingClientRect();
      const width = targetRect.width;
      const height = targetRect.height;
      const left = moveEvent.clientX - hallRect.left - offsetX;
      const top = moveEvent.clientY - hallRect.top - offsetY;
      const centerX = Math.min(Math.max(left + width / 2, width / 2), hallRect.width - width / 2);
      const centerY = Math.min(Math.max(top + height / 2, height / 2), hallRect.height - height / 2);
      const x = Number(((centerX / hallRect.width) * 100).toFixed(2));
      const y = Number(((centerY / hallRect.height) * 100).toFixed(2));
      setTables(tables.map((item) => (item.id === table.id ? { ...item, x, y, width, height } : item)));
    };

    const stop = () => {
      setDraggingId(null);
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', stop);
      toast({ title: 'Posicao da mesa salva', status: 'success', duration: 900 });
    };

    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', stop);
  }

  async function previewQr(table: RestaurantTable) {
    try {
      const image = await createQrCardDataUrl(table, publicBase);
      setQrPreview({ table, image });
      qrModal.onOpen();
    } catch (error) {
      console.error('Erro ao visualizar QR Code', error);
      toast({ title: 'Nao foi possivel gerar o QR Code', status: 'error' });
    }
  }

  async function copyLink(table: RestaurantTable) {
    try {
      await navigator.clipboard.writeText(tableQrUrl(table, publicBase));
      toast({ title: 'Link da mesa copiado', status: 'success' });
    } catch (error) {
      console.error('Erro ao copiar link da mesa', error);
      toast({ title: 'Nao foi possivel copiar o link', status: 'error' });
    }
  }

  async function downloadOne(table: RestaurantTable) {
    try {
      await downloadQrPng(table, publicBase);
      toast({ title: 'QR Code baixado em PNG', status: 'success' });
    } catch (error) {
      console.error('Erro ao baixar QR Code', error);
      toast({ title: 'Nao foi possivel baixar o QR Code', status: 'error' });
    }
  }

  async function downloadAll() {
    if (tables.length === 0) return toast({ title: 'Nenhuma mesa para exportar', status: 'warning' });
    try {
      await downloadQrPdf(tables, publicBase);
      toast({ title: 'PDF com QR Codes gerado', status: 'success' });
    } catch (error) {
      console.error('Erro ao baixar QR Codes em lote', error);
      toast({ title: 'Nao foi possivel gerar o PDF', status: 'error' });
    }
  }

  return (
    <VStack align="stretch" spacing={6}>
      <PageHeader eyebrow="Gestao de mesas" title="Mapa visual do salao">
        <Button leftIcon={<FileDown size={17} />} variant="ghost" onClick={downloadAll}>
          Baixar todos os QR Codes
        </Button>
        <Button leftIcon={<Plus size={17} />} onClick={() => { setDraft(emptyTable()); modal.onOpen(); }}>Cadastrar mesa</Button>
      </PageHeader>
      <Grid templateColumns={{ base: '1fr', xl: '1.2fr .8fr' }} gap={5}>
        <Card>
          <CardBody>
            <Box
              ref={hallRef}
              position="relative"
              minH={{ base: '460px', md: '590px' }}
              borderRadius="16px"
              bg="linear-gradient(135deg, rgba(255,255,255,.08), rgba(255,255,255,.03))"
              backgroundImage="linear-gradient(rgba(255,255,255,.035) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.035) 1px, transparent 1px)"
              backgroundSize="44px 44px"
              border="1px solid"
              borderColor="whiteAlpha.100"
              overflow="hidden"
              sx={{ touchAction: 'none' }}
            >
              {tables.map((table) => (
                <Box
                  key={table.id}
                  position="absolute"
                  left={`${table.x}%`}
                  top={`${table.y}%`}
                  transform="translate(-50%, -50%)"
                  w={{ base: '120px', md: `${table.width ?? 150}px` }}
                  minH={`${table.height ?? 116}px`}
                  p={4}
                  borderRadius="18px"
                  bg={table.status === 'livre' ? 'rgba(57,217,138,.14)' : 'rgba(255,107,26,.16)'}
                  border="1px solid"
                  borderColor={draggingId === table.id ? 'brand.orange' : 'whiteAlpha.200'}
                  boxShadow="0 20px 50px rgba(0,0,0,.25)"
                  cursor="grab"
                  transition={draggingId === table.id ? 'none' : 'box-shadow .18s ease, border-color .18s ease'}
                  userSelect="none"
                  onPointerDown={(event) => startDrag(table, event)}
                >
                  <HStack justify="space-between">
                    <Text fontWeight={900}>{table.name}</Text>
                    <Icon as={Users} boxSize={4} color="whiteAlpha.700" />
                  </HStack>
                  <Text color="whiteAlpha.700" fontSize="sm">{table.seats} lugares</Text>
                  <Box mt={3}><StatusBadge status={table.status} /></Box>
                </Box>
              ))}
            </Box>
          </CardBody>
        </Card>
        <SimpleGrid columns={{ base: 1, md: 2, xl: 1 }} spacing={4}>
          {tables.length === 0 ? (
            <Card><CardBody><Text color="whiteAlpha.700">Nenhuma mesa cadastrada.</Text></CardBody></Card>
          ) : tables.map((table) => (
            <Card key={table.id}>
              <CardBody>
                <HStack justify="space-between" align="flex-start">
                  <Box>
                    <Text fontWeight={900} fontSize="lg">{table.name}</Text>
                    <Text color="whiteAlpha.600" fontSize="sm">{tables.length ? tableQrSlug(table) : ''}</Text>
                    <Text color="whiteAlpha.600" fontSize="sm">{table.tabs} comandas abertas</Text>
                    <Text mt={3} fontWeight={800}>{currency.format(table.billTotal)}</Text>
                    <Select size="sm" mt={3} value={table.status} onChange={(event) => setTables(tables.map((item) => (item.id === table.id ? { ...item, status: event.target.value as TableStatus } : item)))}>
                      {statuses.map((status) => <option key={status} value={status}>{status}</option>)}
                    </Select>
                  </Box>
                  <Box p={2} bg="white" borderRadius="10px">
                    <QRCodeSVG value={tableQrUrl(table, publicBase)} size={74} />
                  </Box>
                </HStack>
                <HStack mt={4} flexWrap="wrap">
                  <Button size="sm" variant="ghost" onClick={() => openTab(table)}>Abrir comanda</Button>
                  <Button size="sm" variant="ghost" leftIcon={<Eye size={15} />} onClick={() => previewQr(table)}>Visualizar QR</Button>
                  <Button size="sm" variant="ghost" leftIcon={<Download size={15} />} onClick={() => downloadOne(table)}>Baixar QR</Button>
                  <Button size="sm" variant="ghost" leftIcon={<Copy size={15} />} onClick={() => copyLink(table)}>Copiar link</Button>
                  <Button size="sm" variant="ghost" leftIcon={<Pencil size={15} />} onClick={() => { setDraft(table); modal.onOpen(); }}>Editar</Button>
                  <Button size="sm" variant="ghost" leftIcon={<Trash2 size={15} />} onClick={() => removeTable(table.id)}>Excluir</Button>
                </HStack>
              </CardBody>
            </Card>
          ))}
        </SimpleGrid>
      </Grid>
      <Modal isOpen={modal.isOpen} onClose={modal.onClose} size="lg">
        <ModalOverlay />
        <ModalContent bg="brand.panel">
          <ModalHeader>Mesa</ModalHeader>
          <ModalBody>
            <VStack align="stretch" spacing={4}>
              <FormControl isRequired><FormLabel>Nome</FormLabel><Input value={draft.name} onChange={(event) => setDraft({ ...draft, name: event.target.value })} /></FormControl>
              <FormControl><FormLabel>Lugares</FormLabel><NumberInput min={1} value={draft.seats} onChange={(_, value) => setDraft({ ...draft, seats: Number.isFinite(value) ? value : 1 })}><NumberInputField /></NumberInput></FormControl>
              <FormControl><FormLabel>Status</FormLabel><Select value={draft.status} onChange={(event) => setDraft({ ...draft, status: event.target.value as TableStatus })}>{statuses.map((status) => <option key={status} value={status}>{status}</option>)}</Select></FormControl>
            </VStack>
          </ModalBody>
          <ModalFooter gap={3}><Button variant="ghost" onClick={modal.onClose}>Cancelar</Button><Button onClick={saveTable}>Salvar</Button></ModalFooter>
        </ModalContent>
      </Modal>
      <Modal isOpen={qrModal.isOpen} onClose={qrModal.onClose} size="lg">
        <ModalOverlay />
        <ModalContent bg="brand.panel">
          <ModalHeader>{qrPreview?.table.name}</ModalHeader>
          <ModalBody>
            {qrPreview ? <Image src={qrPreview.image} alt={`QR Code ${qrPreview.table.name}`} borderRadius="16px" /> : null}
          </ModalBody>
          <ModalFooter gap={3}>
            <Button variant="ghost" onClick={qrModal.onClose}>Fechar</Button>
            {qrPreview ? <Button onClick={() => downloadOne(qrPreview.table)}>Baixar QR Code</Button> : null}
          </ModalFooter>
        </ModalContent>
      </Modal>
    </VStack>
  );
}
