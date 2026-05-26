import {
  Box,
  Badge,
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
import { Archive, Copy, Download, Eye, FileDown, Pencil, Plus, Power, PowerOff, Users } from 'lucide-react';
import { useRef, useState } from 'react';
import { currency } from '../../lib/format';
import {
  createQrCardDataUrl,
  createQrToken,
  downloadQrPdf,
  downloadQrPng,
  tableQrUrl
} from '../../lib/qrCard';
import { saveTableToSupabase } from '../../lib/tablesRepository';
import { makeId, useAppState } from '../../state/AppState';
import type { RestaurantTable, TableStatus } from '../../types';
import { PageHeader } from '../../ui/PageHeader';
import { StatusBadge } from '../../ui/StatusBadge';

const statuses: TableStatus[] = ['livre', 'ocupada', 'pagamento', 'reservada'];
const gridColumns = 4;
const gridStartX = 14;
const gridStartY = 18;
const gridGapX = 20;
const gridGapY = 26;

function gridPosition(index: number) {
  return {
    x: gridStartX + (index % gridColumns) * gridGapX,
    y: gridStartY + Math.floor(index / gridColumns) * gridGapY
  };
}

function nextGridPosition(tables: RestaurantTable[]) {
  return gridPosition(tables.length);
}

function nearestGridPosition(x: number, y: number) {
  const column = Math.max(0, Math.min(gridColumns - 1, Math.round((x - gridStartX) / gridGapX)));
  const row = Math.max(0, Math.round((y - gridStartY) / gridGapY));
  return gridPosition(row * gridColumns + column);
}

function emptyTable(tables: RestaurantTable[] = []): RestaurantTable {
  const id = makeId('mesa');
  const position = nextGridPosition(tables);
  return {
    id,
    name: '',
    seats: 4,
    status: 'livre',
    active: true,
    archived: false,
    billTotal: 0,
    tabs: 0,
    x: position.x,
    y: position.y,
    width: 150,
    height: 116,
    qrToken: createQrToken()
  };
}

function tableAvailability(table: RestaurantTable) {
  if (table.archived) return { label: 'Arquivada', colorScheme: 'gray' };
  if (!table.active) return { label: 'Desativada', colorScheme: 'red' };
  return { label: 'Ativa', colorScheme: 'green' };
}

function alignTablesToGrid(tables: RestaurantTable[]) {
  return tables.map((table, index) => ({ ...table, ...gridPosition(index), width: 150, height: 116 }));
}

export function TablesPage() {
  const { tables, setTables, tabs, setTabs, settings } = useAppState();
  const [draft, setDraft] = useState<RestaurantTable>(emptyTable);
  const [qrPreview, setQrPreview] = useState<{ table: RestaurantTable; image: string } | null>(null);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const hallRef = useRef<HTMLDivElement | null>(null);
  const latestDraggedTable = useRef<RestaurantTable | null>(null);
  const modal = useDisclosure();
  const qrModal = useDisclosure();
  const toast = useToast();
  const publicBase = settings.publicOrderBaseUrl || `${window.location.origin}/mesa`;

  async function persistTable(table: RestaurantTable) {
    return (await saveTableToSupabase(table)) ?? table;
  }

  async function saveTable() {
    if (!draft.name.trim()) return toast({ title: 'Nome da mesa obrigatorio', status: 'warning' });
    if (draft.seats <= 0) return toast({ title: 'Quantidade de lugares obrigatoria', status: 'warning' });
    const exists = tables.some((table) => table.id === draft.id);
    const nextTable = {
      ...draft,
      width: draft.width ?? 150,
      height: draft.height ?? 116,
      qrToken: draft.qrToken || createQrToken(),
      active: draft.active ?? true,
      archived: draft.archived ?? false
    };
    const persistedTable = await persistTable(nextTable);
    setTables(exists ? tables.map((table) => (table.id === draft.id ? persistedTable : table)) : [...tables, persistedTable]);
    toast({ title: exists ? 'Mesa atualizada' : 'Mesa cadastrada', status: 'success' });
    modal.onClose();
  }

  function alignGrid() {
    const alignedTables = alignTablesToGrid(tables);
    setTables(alignedTables);
    alignedTables.forEach((table) => saveTableToSupabase(table));
    toast({ title: 'Mesas alinhadas na grade', status: 'success' });
  }

  async function toggleTableActive(table: RestaurantTable) {
    const nextTable = table.archived ? { ...table, active: true, archived: false } : { ...table, active: !table.active };
    const persistedTable = await persistTable(nextTable);
    setTables(tables.map((item) => (item.id === table.id ? persistedTable : item)));
    toast({ title: nextTable.active ? 'Mesa ativada' : 'Mesa desativada', status: 'success' });
  }

  async function archiveTable(table: RestaurantTable) {
    if (tabs.some((tab) => tab.tableId === table.id && tab.status !== 'fechada')) {
      return toast({ title: 'Feche as comandas antes de arquivar', status: 'warning' });
    }
    if (!window.confirm('Arquivar esta mesa? O QR Code fisico continuara reservado para ela.')) return;
    const persistedTable = await persistTable({ ...table, active: false, archived: true });
    setTables(tables.map((item) => (item.id === table.id ? persistedTable : item)));
    toast({ title: 'Mesa arquivada', status: 'success' });
  }

  function openTab(table: RestaurantTable) {
    if (!table.active || table.archived) return toast({ title: 'Mesa indisponivel', status: 'warning' });
    const tab = {
      id: makeId('tab'),
      tableId: table.id,
      customer: table.name,
      status: 'aberta' as const,
      orderIds: [],
      discount: 0,
      serviceTax: settings.serviceTax,
      paymentMethod: 'pix' as const,
      createdAt: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
    };
    setTabs([tab, ...tabs]);
    const nextTable = { ...table, status: 'ocupada' as const, tabs: table.tabs + 1 };
    setTables(tables.map((item) => (item.id === table.id ? nextTable : item)));
    saveTableToSupabase(nextTable);
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
    latestDraggedTable.current = table;
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
      latestDraggedTable.current = { ...table, x, y, width, height };
      setTables(tables.map((item) => (item.id === table.id ? { ...item, x, y, width, height } : item)));
    };

    const stop = () => {
      setDraggingId(null);
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', stop);
      if (latestDraggedTable.current) {
        const snappedPosition = nearestGridPosition(latestDraggedTable.current.x, latestDraggedTable.current.y);
        const snappedTable = { ...latestDraggedTable.current, ...snappedPosition };
        setTables(tables.map((item) => (item.id === table.id ? snappedTable : item)));
        saveTableToSupabase(snappedTable);
      }
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
        <Button variant="ghost" onClick={alignGrid}>
          Alinhar grade
        </Button>
        <Button leftIcon={<FileDown size={17} />} variant="ghost" onClick={downloadAll}>
          Baixar todos os QR Codes
        </Button>
        <Button leftIcon={<Plus size={17} />} onClick={() => { setDraft(emptyTable(tables)); modal.onOpen(); }}>Cadastrar mesa</Button>
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
                  bg={!table.active || table.archived ? 'rgba(255,255,255,.07)' : table.status === 'livre' ? 'rgba(57,217,138,.14)' : 'rgba(255,107,26,.16)'}
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
                  <HStack mt={3} spacing={2} wrap="wrap"><StatusBadge status={table.status} /><Badge colorScheme={tableAvailability(table).colorScheme}>{tableAvailability(table).label}</Badge></HStack>
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
                <HStack justify="space-between" align="flex-start" flexWrap="wrap" gap={3}>
                  <Box minW={0} flex="1">
                    <Text fontWeight={900} fontSize="lg">{table.name}</Text>
                    <Badge mt={2} colorScheme={tableAvailability(table).colorScheme}>{tableAvailability(table).label}</Badge>
                    <Text color="whiteAlpha.600" fontSize="sm">{table.tabs} comandas abertas</Text>
                    <Text mt={3} fontWeight={800}>{currency.format(table.billTotal)}</Text>
                    <Select
                      size="sm"
                      mt={3}
                      value={table.status}
                      onChange={(event) => {
                        const nextTable = { ...table, status: event.target.value as TableStatus };
                        setTables(tables.map((item) => (item.id === table.id ? nextTable : item)));
                        saveTableToSupabase(nextTable);
                      }}
                    >
                      {statuses.map((status) => <option key={status} value={status}>{status}</option>)}
                    </Select>
                  </Box>
                  <Box p={2} bg="white" borderRadius="10px" flexShrink={0}>
                    <QRCodeSVG value={tableQrUrl(table, publicBase)} size={74} />
                  </Box>
                </HStack>
                <HStack mt={4} flexWrap="wrap">
                  <Button size="sm" variant="ghost" onClick={() => openTab(table)}>Abrir comanda</Button>
                  <Button
                    size="sm"
                    colorScheme={table.active && !table.archived ? 'green' : 'red'}
                    variant="solid"
                    leftIcon={table.active && !table.archived ? <Power size={15} /> : <PowerOff size={15} />}
                    onClick={() => toggleTableActive(table)}
                  >
                    {table.active && !table.archived ? 'Ativa' : 'Desativada'}
                  </Button>
                  <Button size="sm" variant="ghost" leftIcon={<Eye size={15} />} onClick={() => previewQr(table)}>Visualizar QR</Button>
                  <Button size="sm" variant="ghost" leftIcon={<Download size={15} />} onClick={() => downloadOne(table)}>Baixar QR</Button>
                  <Button size="sm" variant="ghost" leftIcon={<Copy size={15} />} onClick={() => copyLink(table)}>Copiar link</Button>
                  <Button size="sm" variant="ghost" leftIcon={<Pencil size={15} />} onClick={() => { setDraft(table); modal.onOpen(); }}>Editar</Button>
                  <Button size="sm" variant="ghost" leftIcon={<Archive size={15} />} onClick={() => archiveTable(table)}>Arquivar</Button>
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
