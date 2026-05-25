import { Button, Card, CardBody, FormControl, FormLabel, HStack, Input, Modal, ModalBody, ModalContent, ModalFooter, ModalHeader, ModalOverlay, NumberInput, NumberInputField, Progress, Select, SimpleGrid, Text, VStack, useDisclosure, useToast } from '@chakra-ui/react';
import { Pencil, PackageMinus, PackagePlus, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { currency } from '../../lib/format';
import { usePersistedView } from '../../lib/usePersistedView';
import { makeId, useAppState } from '../../state/AppState';
import type { InventoryItem } from '../../types';
import { PageHeader } from '../../ui/PageHeader';
import { ViewToggle } from '../../ui/ViewToggle';

function emptyItem(): InventoryItem {
  return { id: makeId('stock'), name: '', quantity: 0, min: 0, unit: 'un', cost: 0, supplier: '' };
}

export function InventoryPage() {
  const { inventory, setInventory, inventoryMovements, setInventoryMovements } = useAppState();
  const [view, setView] = usePersistedView('grillflow.inventory.view');
  const [draft, setDraft] = useState<InventoryItem>(emptyItem);
  const [movement, setMovement] = useState({ itemId: '', kind: 'entrada', quantity: 1, note: '' });
  const [query, setQuery] = useState('');
  const itemModal = useDisclosure();
  const movementModal = useDisclosure();
  const toast = useToast();
  const filtered = inventory.filter((item) => `${item.name} ${item.supplier}`.toLowerCase().includes(query.toLowerCase()));

  function saveItem() {
    if (!draft.name.trim()) return toast({ title: 'Nome obrigatorio', status: 'warning' });
    if (draft.quantity < 0 || draft.min < 0 || draft.cost < 0) return toast({ title: 'Valores negativos nao sao permitidos', status: 'warning' });
    const exists = inventory.some((item) => item.id === draft.id);
    setInventory(exists ? inventory.map((item) => (item.id === draft.id ? draft : item)) : [draft, ...inventory]);
    toast({ title: exists ? 'Item atualizado' : 'Item criado', status: 'success' });
    itemModal.onClose();
  }

  function removeItem(id: string) {
    if (!window.confirm('Excluir item de estoque?')) return;
    setInventory(inventory.filter((item) => item.id !== id));
    toast({ title: 'Item excluido', status: 'success' });
  }

  function applyMovement() {
    if (!movement.itemId) return toast({ title: 'Selecione um item', status: 'warning' });
    if (movement.quantity <= 0) return toast({ title: 'Quantidade obrigatoria', status: 'warning' });
    const current = inventory.find((item) => item.id === movement.itemId);
    if (!current) return;
    const nextQty = movement.kind === 'entrada' ? current.quantity + movement.quantity : current.quantity - movement.quantity;
    if (nextQty < 0) return toast({ title: 'Estoque nao pode ficar negativo', status: 'warning' });
    setInventory(inventory.map((item) => (item.id === current.id ? { ...item, quantity: nextQty } : item)));
    setInventoryMovements([{ id: makeId('mov'), inventoryId: current.id, kind: movement.kind as 'entrada' | 'saida', quantity: movement.quantity, note: movement.note, time: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) }, ...inventoryMovements]);
    toast({ title: 'Movimentacao registrada', status: 'success' });
    movementModal.onClose();
  }

  return (
    <VStack align="stretch" spacing={6}>
      <PageHeader eyebrow="Estoque" title="Entradas, saidas e alertas">
        <ViewToggle value={view} onChange={setView} />
        <Button leftIcon={<PackageMinus size={17} />} variant="ghost" onClick={() => { setMovement({ itemId: inventory[0]?.id ?? '', kind: 'saida', quantity: 1, note: '' }); movementModal.onOpen(); }}>Saida</Button>
        <Button leftIcon={<PackagePlus size={17} />} onClick={() => { setMovement({ itemId: inventory[0]?.id ?? '', kind: 'entrada', quantity: 1, note: '' }); movementModal.onOpen(); }}>Nova entrada</Button>
        <Button leftIcon={<PackagePlus size={17} />} variant="ghost" onClick={() => { setDraft(emptyItem()); itemModal.onOpen(); }}>Novo item</Button>
      </PageHeader>
      <Input placeholder="Buscar estoque" maxW="360px" value={query} onChange={(event) => setQuery(event.target.value)} />
      {filtered.length === 0 ? (
        <Card><CardBody><Text color="whiteAlpha.700">Nenhum item de estoque encontrado.</Text></CardBody></Card>
      ) : view === 'cards' ? (
        <SimpleGrid columns={{ base: 1, md: 2, xl: 4 }} spacing={4}>
          {filtered.map((item) => {
            const percent = item.min > 0 ? Math.min(100, (item.quantity / (item.min * 2)) * 100) : 100;
            const low = item.quantity <= item.min;
            return (
              <Card key={item.id} borderColor={low ? 'brand.red' : 'whiteAlpha.100'}>
                <CardBody>
                  <HStack justify="space-between"><Text fontWeight={900}>{item.name}</Text><Text color={low ? 'brand.red' : 'brand.green'} fontWeight={900}>{item.quantity} {item.unit}</Text></HStack>
                  <Progress mt={4} value={percent} colorScheme={low ? 'red' : 'green'} borderRadius="999px" bg="whiteAlpha.100" />
                  <Text mt={3} color="whiteAlpha.600" fontSize="sm">Minimo: {item.min} {item.unit}</Text>
                  <Text mt={1} color="whiteAlpha.600" fontSize="sm">{item.supplier} - custo {currency.format(item.cost)}</Text>
                  <HStack mt={4}><Button size="sm" variant="ghost" leftIcon={<Pencil size={15} />} onClick={() => { setDraft(item); itemModal.onOpen(); }}>Editar</Button><Button size="sm" variant="ghost" leftIcon={<Trash2 size={15} />} onClick={() => removeItem(item.id)}>Excluir</Button></HStack>
                </CardBody>
              </Card>
            );
          })}
        </SimpleGrid>
      ) : (
        <VStack align="stretch">
          {filtered.map((item) => (
            <Card key={item.id}><CardBody><HStack justify="space-between" flexWrap="wrap"><Text fontWeight={900}>{item.name}</Text><Text>{item.quantity} {item.unit}</Text><Text color="whiteAlpha.600">{item.supplier}</Text><HStack><Button size="sm" variant="ghost" onClick={() => { setDraft(item); itemModal.onOpen(); }}>Editar</Button><Button size="sm" variant="ghost" onClick={() => removeItem(item.id)}>Excluir</Button></HStack></HStack></CardBody></Card>
          ))}
        </VStack>
      )}

      <Modal isOpen={itemModal.isOpen} onClose={itemModal.onClose} size="lg"><ModalOverlay /><ModalContent bg="brand.panel"><ModalHeader>Item de estoque</ModalHeader><ModalBody><VStack align="stretch" spacing={4}><FormControl isRequired><FormLabel>Nome</FormLabel><Input value={draft.name} onChange={(event) => setDraft({ ...draft, name: event.target.value })} /></FormControl><HStack><FormControl><FormLabel>Quantidade</FormLabel><NumberInput min={0} value={draft.quantity} onChange={(_, value) => setDraft({ ...draft, quantity: Number.isFinite(value) ? value : 0 })}><NumberInputField /></NumberInput></FormControl><FormControl><FormLabel>Minimo</FormLabel><NumberInput min={0} value={draft.min} onChange={(_, value) => setDraft({ ...draft, min: Number.isFinite(value) ? value : 0 })}><NumberInputField /></NumberInput></FormControl></HStack><HStack><FormControl><FormLabel>Unidade</FormLabel><Input value={draft.unit} onChange={(event) => setDraft({ ...draft, unit: event.target.value })} /></FormControl><FormControl><FormLabel>Custo</FormLabel><NumberInput min={0} value={draft.cost} onChange={(_, value) => setDraft({ ...draft, cost: Number.isFinite(value) ? value : 0 })}><NumberInputField /></NumberInput></FormControl></HStack><FormControl><FormLabel>Fornecedor</FormLabel><Input value={draft.supplier} onChange={(event) => setDraft({ ...draft, supplier: event.target.value })} /></FormControl></VStack></ModalBody><ModalFooter gap={3}><Button variant="ghost" onClick={itemModal.onClose}>Cancelar</Button><Button onClick={saveItem}>Salvar</Button></ModalFooter></ModalContent></Modal>
      <Modal isOpen={movementModal.isOpen} onClose={movementModal.onClose} size="lg"><ModalOverlay /><ModalContent bg="brand.panel"><ModalHeader>Movimentar estoque</ModalHeader><ModalBody><VStack align="stretch" spacing={4}><FormControl><FormLabel>Item</FormLabel><Select value={movement.itemId} onChange={(event) => setMovement({ ...movement, itemId: event.target.value })}>{inventory.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</Select></FormControl><FormControl><FormLabel>Tipo</FormLabel><Select value={movement.kind} onChange={(event) => setMovement({ ...movement, kind: event.target.value })}><option value="entrada">Entrada</option><option value="saida">Saida</option></Select></FormControl><FormControl isRequired><FormLabel>Quantidade</FormLabel><NumberInput min={1} value={movement.quantity} onChange={(_, value) => setMovement({ ...movement, quantity: Number.isFinite(value) ? value : 1 })}><NumberInputField /></NumberInput></FormControl><FormControl><FormLabel>Observacao</FormLabel><Input value={movement.note} onChange={(event) => setMovement({ ...movement, note: event.target.value })} /></FormControl></VStack></ModalBody><ModalFooter gap={3}><Button variant="ghost" onClick={movementModal.onClose}>Cancelar</Button><Button onClick={applyMovement}>Registrar</Button></ModalFooter></ModalContent></Modal>
    </VStack>
  );
}
