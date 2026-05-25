import { Box, Button, Card, CardBody, FormControl, FormLabel, Grid, HStack, Input, Modal, ModalBody, ModalContent, ModalFooter, ModalHeader, ModalOverlay, NumberInput, NumberInputField, Select, SimpleGrid, Text, VStack, useDisclosure, useToast } from '@chakra-ui/react';
import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis } from 'recharts';
import { Banknote, Download, MinusCircle, PlusCircle, Wallet } from 'lucide-react';
import { paymentSeries, revenueSeries } from '../../data/mockData';
import { currency } from '../../lib/format';
import { makeId, useAppState } from '../../state/AppState';
import type { CashEntry, PaymentMethod } from '../../types';
import { KpiCard } from '../../ui/KpiCard';
import { PageHeader } from '../../ui/PageHeader';
import { useState } from 'react';

const colors = ['#ff6b1a', '#49c6e5', '#39d98a', '#ffb000'];

export function FinancePage() {
  const { cashFlow, setCashFlow, cashOpen, setCashOpen } = useAppState();
  const [draft, setDraft] = useState<Omit<CashEntry, 'id' | 'time'>>({ kind: 'entrada', label: '', amount: 0, method: 'pix' });
  const modal = useDisclosure();
  const toast = useToast();
  const entries = cashFlow.filter((entry) => ['entrada', 'suprimento'].includes(entry.kind)).reduce((sum, entry) => sum + entry.amount, 0);
  const exits = cashFlow.filter((entry) => ['saida', 'sangria', 'despesa'].includes(entry.kind)).reduce((sum, entry) => sum + entry.amount, 0);
  const profit = entries - exits;

  function openMovement(kind: CashEntry['kind']) {
    if (!cashOpen && kind !== 'entrada') return toast({ title: 'Abra o caixa antes de registrar movimentos', status: 'warning' });
    setDraft({ kind, label: '', amount: 0, method: 'pix' });
    modal.onOpen();
  }

  function saveMovement() {
    if (!cashOpen) return toast({ title: 'Abra o caixa antes de registrar movimentos', status: 'warning' });
    if (!draft.label.trim()) return toast({ title: 'Descricao obrigatoria', status: 'warning' });
    if (draft.amount <= 0) return toast({ title: 'Valor obrigatorio', status: 'warning' });
    setCashFlow([{ id: makeId('cash'), ...draft, time: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) }, ...cashFlow]);
    toast({ title: 'Movimento registrado', status: 'success' });
    modal.onClose();
  }

  function exportCsv() {
    const csv = ['tipo,descricao,valor,metodo,hora', ...cashFlow.map((entry) => `${entry.kind},"${entry.label}",${entry.amount},${entry.method},${entry.time}`)].join('\n');
    navigator.clipboard?.writeText(csv).catch((error) => console.error('Erro ao copiar CSV', error));
    toast({ title: 'CSV copiado para a area de transferencia', status: 'success' });
  }

  return (
    <VStack align="stretch" spacing={6}>
      <PageHeader eyebrow="Financeiro completo" title="Caixa, lucro e despesas">
        <Button leftIcon={<Download size={17} />} variant="ghost" onClick={exportCsv}>Relatorio</Button>
        <Button leftIcon={<Wallet size={17} />} onClick={() => { if (!cashOpen) { setCashOpen(true); toast({ title: 'Caixa aberto', status: 'success' }); } else { setCashOpen(false); toast({ title: 'Caixa fechado', status: 'success' }); } }}>{cashOpen ? 'Fechar caixa' : 'Abrir caixa'}</Button>
      </PageHeader>

      <HStack flexWrap="wrap">
        <Button size="sm" variant="ghost" onClick={() => openMovement('entrada')}>Entrada</Button>
        <Button size="sm" variant="ghost" onClick={() => openMovement('saida')}>Saida</Button>
        <Button size="sm" variant="ghost" onClick={() => openMovement('sangria')}>Sangria</Button>
        <Button size="sm" variant="ghost" onClick={() => openMovement('suprimento')}>Suprimento</Button>
        <Button size="sm" variant="ghost" onClick={() => openMovement('despesa')}>Despesa</Button>
      </HStack>

      <SimpleGrid columns={{ base: 1, md: 2, xl: 4 }} spacing={4}>
        <KpiCard label="Entradas" value={currency.format(entries)} helper={cashOpen ? 'Caixa aberto' : 'Caixa fechado'} icon={PlusCircle} />
        <KpiCard label="Saidas" value={currency.format(exits)} helper="Inclui sangria e despesas" icon={MinusCircle} tone="brand.red" />
        <KpiCard label="Lucro diario" value={currency.format(profit)} helper={profit >= 0 ? 'Resultado positivo' : 'Prejuizo'} icon={Banknote} tone="brand.green" />
        <KpiCard label="Lucro mensal" value={currency.format(profit * 22)} helper="Projecao da POC" icon={Wallet} tone="brand.cyan" />
      </SimpleGrid>

      <Grid templateColumns={{ base: '1fr', xl: '1.25fr .75fr' }} gap={5}>
        <Card><CardBody><Text fontWeight={900} fontSize="lg" mb={5}>Performance financeira</Text><Box h="330px"><ResponsiveContainer width="100%" height="100%"><BarChart data={revenueSeries}><CartesianGrid stroke="#243040" vertical={false} /><XAxis dataKey="day" stroke="#718096" tickLine={false} axisLine={false} /><Tooltip contentStyle={{ background: '#10161f', border: '1px solid #243040', borderRadius: 12 }} formatter={(value) => currency.format(Number(value))} /><Bar dataKey="vendas" fill="#ff6b1a" radius={[8, 8, 0, 0]} /><Bar dataKey="lucro" fill="#39d98a" radius={[8, 8, 0, 0]} /></BarChart></ResponsiveContainer></Box></CardBody></Card>
        <Card><CardBody><Text fontWeight={900} fontSize="lg" mb={5}>Formas de pagamento</Text><Box h="250px"><ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={paymentSeries} dataKey="value" innerRadius={62} outerRadius={92} paddingAngle={5}>{paymentSeries.map((entry, index) => <Cell key={entry.name} fill={colors[index % colors.length]} />)}</Pie><Tooltip contentStyle={{ background: '#10161f', border: '1px solid #243040', borderRadius: 12 }} /></PieChart></ResponsiveContainer></Box><VStack align="stretch">{paymentSeries.map((entry, index) => <HStack key={entry.name} justify="space-between"><HStack><Box boxSize="10px" borderRadius="full" bg={colors[index]} /><Text>{entry.name}</Text></HStack><Text fontWeight={800}>{entry.value}%</Text></HStack>)}</VStack></CardBody></Card>
      </Grid>

      <Card><CardBody><Text fontWeight={900} fontSize="lg" mb={4}>Movimento do caixa</Text><VStack align="stretch">{cashFlow.length === 0 ? <Text color="whiteAlpha.700">Nenhuma movimentacao financeira.</Text> : cashFlow.map((entry) => <HStack key={entry.id} justify="space-between" p={3} borderRadius="12px" bg="whiteAlpha.100"><Box><Text fontWeight={800}>{entry.label}</Text><Text color="whiteAlpha.600" fontSize="sm">{entry.time} - {entry.method} - {entry.kind}</Text></Box><Text color={['entrada', 'suprimento'].includes(entry.kind) ? 'brand.green' : 'brand.red'} fontWeight={900}>{['entrada', 'suprimento'].includes(entry.kind) ? '+' : '-'}{currency.format(entry.amount)}</Text></HStack>)}</VStack></CardBody></Card>

      <Modal isOpen={modal.isOpen} onClose={modal.onClose} size="lg"><ModalOverlay /><ModalContent bg="brand.panel"><ModalHeader>Movimento financeiro</ModalHeader><ModalBody><VStack align="stretch" spacing={4}><FormControl><FormLabel>Tipo</FormLabel><Select value={draft.kind} onChange={(event) => setDraft({ ...draft, kind: event.target.value as CashEntry['kind'] })}><option value="entrada">Entrada</option><option value="saida">Saida</option><option value="sangria">Sangria</option><option value="suprimento">Suprimento</option><option value="despesa">Despesa</option></Select></FormControl><FormControl isRequired><FormLabel>Descricao</FormLabel><Input value={draft.label} onChange={(event) => setDraft({ ...draft, label: event.target.value })} /></FormControl><FormControl isRequired><FormLabel>Valor</FormLabel><NumberInput min={0} value={draft.amount} onChange={(_, value) => setDraft({ ...draft, amount: Number.isFinite(value) ? value : 0 })}><NumberInputField /></NumberInput></FormControl><FormControl><FormLabel>Forma</FormLabel><Select value={draft.method} onChange={(event) => setDraft({ ...draft, method: event.target.value as PaymentMethod })}><option value="pix">Pix</option><option value="credito">Credito</option><option value="debito">Debito</option><option value="dinheiro">Dinheiro</option><option value="multiplo">Multiplo</option></Select></FormControl></VStack></ModalBody><ModalFooter gap={3}><Button variant="ghost" onClick={modal.onClose}>Cancelar</Button><Button onClick={saveMovement}>Salvar</Button></ModalFooter></ModalContent></Modal>
    </VStack>
  );
}
