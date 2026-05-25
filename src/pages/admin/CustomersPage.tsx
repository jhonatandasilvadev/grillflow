import { Button, Card, CardBody, FormControl, FormLabel, HStack, Input, Modal, ModalBody, ModalContent, ModalFooter, ModalHeader, ModalOverlay, NumberInput, NumberInputField, SimpleGrid, Text, VStack, useDisclosure, useToast } from '@chakra-ui/react';
import { Search, Trash2, UserPlus } from 'lucide-react';
import { useMemo, useState } from 'react';
import { currency } from '../../lib/format';
import { makeId, useAppState } from '../../state/AppState';
import type { Customer } from '../../types';
import { PageHeader } from '../../ui/PageHeader';

function emptyCustomer(): Customer {
  return { id: makeId('customer'), name: '', phone: '', orders: 0, totalSpent: 0, preference: '' };
}

export function CustomersPage() {
  const { customers, setCustomers } = useAppState();
  const [query, setQuery] = useState('');
  const [draft, setDraft] = useState<Customer>(emptyCustomer);
  const modal = useDisclosure();
  const toast = useToast();
  const filtered = useMemo(() => customers.filter((customer) => `${customer.name} ${customer.phone}`.toLowerCase().includes(query.toLowerCase())), [customers, query]);

  function saveCustomer() {
    if (!draft.name.trim()) return toast({ title: 'Nome obrigatorio', status: 'warning' });
    if (draft.orders < 0 || draft.totalSpent < 0) return toast({ title: 'Valores negativos nao sao permitidos', status: 'warning' });
    const exists = customers.some((customer) => customer.id === draft.id);
    setCustomers(exists ? customers.map((customer) => (customer.id === draft.id ? draft : customer)) : [draft, ...customers]);
    toast({ title: exists ? 'Cliente atualizado' : 'Cliente cadastrado', status: 'success' });
    modal.onClose();
  }

  function removeCustomer(customerId: string) {
    if (!window.confirm('Excluir este cliente?')) return;
    setCustomers(customers.filter((customer) => customer.id !== customerId));
    toast({ title: 'Cliente excluido', status: 'success' });
  }

  return (
    <VStack align="stretch" spacing={6}>
      <PageHeader eyebrow="Clientes" title="Historico e preferencias">
        <Button leftIcon={<UserPlus size={17} />} onClick={() => { setDraft(emptyCustomer()); modal.onOpen(); }}>Novo cliente</Button>
      </PageHeader>
      <HStack>
        <Input placeholder="Buscar por nome ou telefone" maxW="420px" value={query} onChange={(event) => setQuery(event.target.value)} />
        <Button leftIcon={<Search size={17} />} variant="ghost" onClick={() => setQuery('')}>Limpar</Button>
      </HStack>
      {filtered.length === 0 ? <Card><CardBody><Text color="whiteAlpha.700">Nenhum cliente encontrado.</Text></CardBody></Card> : (
        <SimpleGrid columns={{ base: 1, md: 2, xl: 3 }} spacing={4}>
          {filtered.map((customer) => (
            <Card key={customer.id}>
              <CardBody>
                <Text fontWeight={900} fontSize="lg">{customer.name}</Text>
                <Text color="whiteAlpha.600">{customer.phone}</Text>
                <HStack mt={5} justify="space-between"><Text color="whiteAlpha.600">Pedidos</Text><Text fontWeight={800}>{customer.orders}</Text></HStack>
                <HStack mt={2} justify="space-between"><Text color="whiteAlpha.600">Total gasto</Text><Text fontWeight={800}>{currency.format(customer.totalSpent)}</Text></HStack>
                <Text mt={4} p={3} borderRadius="12px" bg="whiteAlpha.100" color="whiteAlpha.800">Preferencia: {customer.preference || 'Nao informada'}</Text>
                <HStack mt={4}><Button size="sm" variant="ghost" onClick={() => { setDraft(customer); modal.onOpen(); }}>Editar</Button><Button size="sm" variant="ghost" leftIcon={<Trash2 size={15} />} onClick={() => removeCustomer(customer.id)}>Excluir</Button></HStack>
              </CardBody>
            </Card>
          ))}
        </SimpleGrid>
      )}
      <Modal isOpen={modal.isOpen} onClose={modal.onClose} size="lg"><ModalOverlay /><ModalContent bg="brand.panel"><ModalHeader>Cliente</ModalHeader><ModalBody><VStack align="stretch" spacing={4}><FormControl isRequired><FormLabel>Nome</FormLabel><Input value={draft.name} onChange={(event) => setDraft({ ...draft, name: event.target.value })} /></FormControl><FormControl><FormLabel>Telefone</FormLabel><Input value={draft.phone} onChange={(event) => setDraft({ ...draft, phone: event.target.value })} /></FormControl><HStack><FormControl><FormLabel>Pedidos</FormLabel><NumberInput min={0} value={draft.orders} onChange={(_, value) => setDraft({ ...draft, orders: Number.isFinite(value) ? value : 0 })}><NumberInputField /></NumberInput></FormControl><FormControl><FormLabel>Total gasto</FormLabel><NumberInput min={0} value={draft.totalSpent} onChange={(_, value) => setDraft({ ...draft, totalSpent: Number.isFinite(value) ? value : 0 })}><NumberInputField /></NumberInput></FormControl></HStack><FormControl><FormLabel>Preferencias</FormLabel><Input value={draft.preference} onChange={(event) => setDraft({ ...draft, preference: event.target.value })} /></FormControl></VStack></ModalBody><ModalFooter gap={3}><Button variant="ghost" onClick={modal.onClose}>Cancelar</Button><Button onClick={saveCustomer}>Salvar</Button></ModalFooter></ModalContent></Modal>
    </VStack>
  );
}
