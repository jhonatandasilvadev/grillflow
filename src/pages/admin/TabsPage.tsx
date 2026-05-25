import { Box, Button, Card, CardBody, Divider, FormControl, FormLabel, HStack, Input, Modal, ModalBody, ModalContent, ModalFooter, ModalHeader, ModalOverlay, NumberInput, NumberInputField, Select, SimpleGrid, Text, VStack, useDisclosure, useToast } from '@chakra-ui/react';
import { CreditCard, Plus, Scissors, Trash2 } from 'lucide-react';
import { currency } from '../../lib/format';
import { usePersistedView } from '../../lib/usePersistedView';
import { makeId, useAppState } from '../../state/AppState';
import type { PaymentMethod, TabAccount } from '../../types';
import { PageHeader } from '../../ui/PageHeader';
import { ViewToggle } from '../../ui/ViewToggle';
import { useState } from 'react';

function totalFor(tab: TabAccount, orders: ReturnType<typeof useAppState>['orders']) {
  const subtotal = tab.orderIds.reduce((sum, id) => sum + (orders.find((order) => order.id === id)?.total ?? 0), 0);
  const tax = subtotal * (tab.serviceTax / 100);
  return { subtotal, tax, total: subtotal + tax - tab.discount };
}

export function TabsPage() {
  const { tabs, setTabs, tables, orders, cashFlow, setCashFlow, cashOpen, setTables } = useAppState();
  const [view, setView] = usePersistedView('grillflow.tabs.view');
  const [draft, setDraft] = useState<TabAccount | null>(null);
  const modal = useDisclosure();
  const toast = useToast();

  function openNew() {
    setDraft({ id: makeId('tab'), tableId: tables[0]?.id ?? '', customer: '', status: 'aberta', orderIds: [], discount: 0, serviceTax: 10, paymentMethod: 'pix', createdAt: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) });
    modal.onOpen();
  }

  function saveTab() {
    if (!draft) return;
    if (!draft.tableId) return toast({ title: 'Selecione uma mesa', status: 'warning' });
    if (!draft.customer.trim()) return toast({ title: 'Nome da comanda obrigatorio', status: 'warning' });
    if (draft.discount < 0 || draft.serviceTax < 0) return toast({ title: 'Valores negativos nao sao permitidos', status: 'warning' });
    const exists = tabs.some((tab) => tab.id === draft.id);
    setTabs(exists ? tabs.map((tab) => (tab.id === draft.id ? draft : tab)) : [draft, ...tabs]);
    toast({ title: exists ? 'Comanda atualizada' : 'Comanda aberta', status: 'success' });
    modal.onClose();
  }

  function closeTab(tab: TabAccount) {
    const totals = totalFor(tab, orders);
    if (!cashOpen) return toast({ title: 'Abra o caixa antes de fechar comanda', status: 'warning' });
    if (tab.orderIds.length === 0 || totals.total <= 0) return toast({ title: 'Nao e possivel fechar comanda vazia', status: 'warning' });
    setTabs(tabs.map((item) => (item.id === tab.id ? { ...item, status: 'fechada' } : item)));
    setCashFlow([{ id: makeId('cash'), kind: 'entrada', label: `Comanda ${tab.customer}`, amount: totals.total, method: tab.paymentMethod, time: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) }, ...cashFlow]);
    setTables(tables.map((table) => table.id === tab.tableId ? { ...table, tabs: Math.max(0, table.tabs - 1), status: Math.max(0, table.tabs - 1) === 0 ? 'livre' : table.status } : table));
    toast({ title: 'Comanda fechada e pagamento registrado', status: 'success' });
  }

  function removeTab(tabId: string) {
    if (!window.confirm('Excluir esta comanda?')) return;
    setTabs(tabs.filter((tab) => tab.id !== tabId));
    toast({ title: 'Comanda excluida', status: 'success' });
  }

  const content = tabs.length === 0 ? <Card><CardBody><Text color="whiteAlpha.700">Nenhuma comanda aberta.</Text></CardBody></Card> : (
    view === 'cards' ? <SimpleGrid columns={{ base: 1, xl: 3 }} spacing={4}>{tabs.map((tab) => renderTab(tab))}</SimpleGrid> : <VStack align="stretch">{tabs.map((tab) => renderTab(tab))}</VStack>
  );

  function renderTab(tab: TabAccount) {
    const table = tables.find((item) => item.id === tab.tableId);
    const totals = totalFor(tab, orders);
    return (
      <Card key={tab.id}><CardBody><HStack justify="space-between"><Box><Text fontSize="xl" fontWeight={900}>{table?.name ?? 'Mesa'}</Text><Text color="whiteAlpha.600">{tab.customer} - {tab.status}</Text></Box><Select maxW="150px" size="sm" value={tab.paymentMethod} onChange={(event) => setTabs(tabs.map((item) => item.id === tab.id ? { ...item, paymentMethod: event.target.value as PaymentMethod } : item))}><option value="pix">Pix</option><option value="credito">Credito</option><option value="debito">Debito</option><option value="dinheiro">Dinheiro</option><option value="multiplo">Multiplo</option></Select></HStack><VStack align="stretch" mt={5} spacing={2}>{tab.orderIds.length === 0 ? <Text color="whiteAlpha.600">Sem pedidos vinculados.</Text> : tab.orderIds.map((id) => { const order = orders.find((item) => item.id === id); return order ? <HStack key={id} justify="space-between" p={3} borderRadius="12px" bg="whiteAlpha.100"><Text fontWeight={700}>{order.customer}</Text><Text>{currency.format(order.total)}</Text></HStack> : null; })}</VStack><Divider my={5} borderColor="whiteAlpha.200" /><VStack align="stretch" spacing={2}><HStack justify="space-between"><Text color="whiteAlpha.600">Subtotal</Text><Text>{currency.format(totals.subtotal)}</Text></HStack><HStack justify="space-between"><Text color="whiteAlpha.600">Taxa {tab.serviceTax}%</Text><Text>{currency.format(totals.tax)}</Text></HStack><HStack justify="space-between"><Text color="whiteAlpha.600">Desconto</Text><Text>{currency.format(tab.discount)}</Text></HStack><HStack justify="space-between"><Text fontWeight={900}>Total</Text><Text fontWeight={900}>{currency.format(totals.total)}</Text></HStack></VStack><HStack mt={5} flexWrap="wrap"><Button size="sm" variant="ghost" onClick={() => { setDraft(tab); modal.onOpen(); }}>Editar</Button><Button size="sm" variant="ghost" leftIcon={<Trash2 size={15} />} onClick={() => removeTab(tab.id)}>Excluir</Button><Button size="sm" leftIcon={<CreditCard size={15} />} onClick={() => closeTab(tab)}>Fechar</Button></HStack></CardBody></Card>
    );
  }

  return (
    <VStack align="stretch" spacing={6}>
      <PageHeader eyebrow="Comandas" title="Abertura, divisao e fechamento de contas">
        <ViewToggle value={view} onChange={setView} />
        <Button leftIcon={<Scissors size={17} />} variant="ghost" onClick={() => toast({ title: 'Use desconto/taxa para ajustar a divisao da conta', status: 'info' })}>Dividir conta</Button>
        <Button leftIcon={<Plus size={17} />} onClick={openNew}>Abrir comanda</Button>
      </PageHeader>
      {content}
      <Modal isOpen={modal.isOpen} onClose={modal.onClose} size="xl"><ModalOverlay /><ModalContent bg="brand.panel"><ModalHeader>Comanda</ModalHeader><ModalBody>{draft ? <VStack align="stretch" spacing={4}><HStack align="flex-start"><FormControl isRequired><FormLabel>Cliente</FormLabel><Input value={draft.customer} onChange={(event) => setDraft({ ...draft, customer: event.target.value })} /></FormControl><FormControl><FormLabel>Mesa</FormLabel><Select value={draft.tableId} onChange={(event) => setDraft({ ...draft, tableId: event.target.value })}>{tables.map((table) => <option key={table.id} value={table.id}>{table.name}</option>)}</Select></FormControl></HStack><FormControl><FormLabel>Pedidos vinculados</FormLabel><Select value="" onChange={(event) => event.target.value && setDraft({ ...draft, orderIds: Array.from(new Set([...draft.orderIds, event.target.value])) })}><option value="">Adicionar pedido</option>{orders.map((order) => <option key={order.id} value={order.id}>{order.number} - {order.customer}</option>)}</Select></FormControl><VStack align="stretch">{draft.orderIds.map((id) => { const order = orders.find((item) => item.id === id); return <HStack key={id} justify="space-between" p={3} borderRadius="12px" bg="whiteAlpha.100"><Text>{order?.number ?? id}</Text><Button size="sm" variant="ghost" onClick={() => setDraft({ ...draft, orderIds: draft.orderIds.filter((item) => item !== id) })}>Remover</Button></HStack>; })}</VStack><HStack><FormControl><FormLabel>Desconto</FormLabel><NumberInput min={0} value={draft.discount} onChange={(_, value) => setDraft({ ...draft, discount: Number.isFinite(value) ? value : 0 })}><NumberInputField /></NumberInput></FormControl><FormControl><FormLabel>Taxa %</FormLabel><NumberInput min={0} value={draft.serviceTax} onChange={(_, value) => setDraft({ ...draft, serviceTax: Number.isFinite(value) ? value : 0 })}><NumberInputField /></NumberInput></FormControl></HStack></VStack> : null}</ModalBody><ModalFooter gap={3}><Button variant="ghost" onClick={modal.onClose}>Cancelar</Button><Button onClick={saveTab}>Salvar</Button></ModalFooter></ModalContent></Modal>
    </VStack>
  );
}
