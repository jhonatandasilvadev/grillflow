import {
  Badge,
  Box,
  Button,
  Card,
  CardBody,
  FormControl,
  FormLabel,
  HStack,
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
  Switch,
  Text,
  Textarea,
  VStack,
  useDisclosure,
  useToast
} from '@chakra-ui/react';
import { ImagePlus, Pencil, Plus, Search, Trash2 } from 'lucide-react';
import { useMemo, useState } from 'react';
import { currency } from '../../lib/format';
import { usePersistedView } from '../../lib/usePersistedView';
import { makeId, useAppState } from '../../state/AppState';
import type { Product } from '../../types';
import { PageHeader } from '../../ui/PageHeader';
import { ViewToggle } from '../../ui/ViewToggle';

const fallbackImage = 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=900&q=80';

function emptyProduct(categoryId: string): Product {
  return {
    id: makeId('product'),
    categoryId,
    name: '',
    description: '',
    price: 0,
    image: fallbackImage,
    active: true,
    additions: []
  };
}

export function MenuPage() {
  const { categories, products, setProducts } = useAppState();
  const [view, setView] = usePersistedView('grillflow.menu.view');
  const [query, setQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [draft, setDraft] = useState<Product>(emptyProduct(categories[0]?.id ?? 'burgers'));
  const { isOpen, onOpen, onClose } = useDisclosure();
  const toast = useToast();

  const filteredProducts = useMemo(
    () =>
      products.filter((product) => {
        const text = `${product.name} ${product.description}`.toLowerCase();
        return text.includes(query.toLowerCase()) && (!categoryFilter || product.categoryId === categoryFilter);
      }),
    [products, query, categoryFilter]
  );

  function openNew() {
    setDraft(emptyProduct(categories[0]?.id ?? 'burgers'));
    onOpen();
  }

  function saveProduct() {
    if (!draft.name.trim()) return toast({ title: 'Nome obrigatorio', status: 'warning' });
    if (draft.price <= 0) return toast({ title: 'Preco deve ser maior que zero', status: 'warning' });
    const exists = products.some((product) => product.id === draft.id);
    setProducts(exists ? products.map((product) => (product.id === draft.id ? draft : product)) : [draft, ...products]);
    toast({ title: exists ? 'Produto atualizado' : 'Produto criado', status: 'success' });
    onClose();
  }

  function removeProduct(productId: string) {
    if (!window.confirm('Excluir este produto?')) return;
    setProducts(products.filter((product) => product.id !== productId));
    toast({ title: 'Produto excluido', status: 'success' });
  }

  function toggleProduct(product: Product) {
    setProducts(products.map((item) => (item.id === product.id ? { ...item, active: !item.active } : item)));
    toast({ title: product.active ? 'Produto desativado' : 'Produto ativado', status: 'success' });
  }

  return (
    <VStack align="stretch" spacing={6}>
      <PageHeader eyebrow="Cardapio inteligente" title="Produtos, categorias e disponibilidade">
        <ViewToggle value={view} onChange={setView} />
        <Button leftIcon={<ImagePlus size={17} />} variant="ghost" onClick={() => toast({ title: 'Informe uma URL de imagem ao editar o produto', status: 'info' })}>Upload</Button>
        <Button leftIcon={<Plus size={17} />} onClick={openNew}>Novo produto</Button>
      </PageHeader>

      <HStack flexWrap="wrap">
        <Input maxW={{ base: '100%', md: '360px' }} placeholder="Buscar produto" value={query} onChange={(event) => setQuery(event.target.value)} />
        <Select maxW={{ base: '100%', md: '220px' }} value={categoryFilter} onChange={(event) => setCategoryFilter(event.target.value)}>
          <option value="">Todas categorias</option>
          {categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
        </Select>
        <Button leftIcon={<Search size={17} />} variant="ghost" onClick={() => { setQuery(''); setCategoryFilter(''); }}>Limpar</Button>
      </HStack>

      {filteredProducts.length === 0 ? (
        <Card><CardBody><Text color="whiteAlpha.700">Nenhum produto cadastrado.</Text></CardBody></Card>
      ) : view === 'cards' ? (
        <SimpleGrid columns={{ base: 1, md: 2, xl: 3 }} spacing={4}>
          {filteredProducts.map((product) => (
            <Card key={product.id} overflow="hidden">
              <Box position="relative">
                <Image src={product.image || fallbackImage} alt={product.name} h="210px" w="100%" objectFit="cover" />
                <Badge position="absolute" top={3} left={3} colorScheme={product.active ? 'green' : 'red'} borderRadius="999px" px={3}>{product.active ? 'Ativo' : 'Inativo'}</Badge>
              </Box>
              <CardBody>
                <HStack justify="space-between" align="flex-start">
                  <Box><Text fontWeight={900} fontSize="lg">{product.name}</Text><Text color="whiteAlpha.600" fontSize="sm">{categories.find((category) => category.id === product.categoryId)?.name}</Text></Box>
                  <Switch isChecked={product.active} colorScheme="orange" onChange={() => toggleProduct(product)} />
                </HStack>
                <Text mt={3} color="whiteAlpha.700" minH="48px">{product.description}</Text>
                <HStack mt={4} justify="space-between">
                  <Text fontWeight={900} fontSize="xl">{currency.format(product.price)}</Text>
                  <HStack>
                    <Button size="sm" variant="ghost" leftIcon={<Pencil size={15} />} onClick={() => { setDraft(product); onOpen(); }}>Editar</Button>
                    <Button size="sm" variant="ghost" leftIcon={<Trash2 size={15} />} onClick={() => removeProduct(product.id)}>Excluir</Button>
                  </HStack>
                </HStack>
              </CardBody>
            </Card>
          ))}
        </SimpleGrid>
      ) : (
        <VStack align="stretch">
          {filteredProducts.map((product) => (
            <Card key={product.id}>
              <CardBody>
                <HStack justify="space-between" align="center" flexWrap="wrap">
                  <HStack><Image src={product.image || fallbackImage} alt={product.name} boxSize="58px" borderRadius="12px" objectFit="cover" /><Box><Text fontWeight={900}>{product.name}</Text><Text color="whiteAlpha.600" fontSize="sm">{currency.format(product.price)}</Text></Box></HStack>
                  <HStack><Switch isChecked={product.active} colorScheme="orange" onChange={() => toggleProduct(product)} /><Button size="sm" variant="ghost" onClick={() => { setDraft(product); onOpen(); }}>Editar</Button><Button size="sm" variant="ghost" onClick={() => removeProduct(product.id)}>Excluir</Button></HStack>
                </HStack>
              </CardBody>
            </Card>
          ))}
        </VStack>
      )}

      <Modal isOpen={isOpen} onClose={onClose} size="xl">
        <ModalOverlay />
        <ModalContent bg="brand.panel">
          <ModalHeader>{products.some((product) => product.id === draft.id) ? 'Editar produto' : 'Novo produto'}</ModalHeader>
          <ModalBody>
            <VStack align="stretch" spacing={4}>
              <FormControl isRequired><FormLabel>Nome</FormLabel><Input value={draft.name} onChange={(event) => setDraft({ ...draft, name: event.target.value })} /></FormControl>
              <HStack align="flex-start"><FormControl isRequired><FormLabel>Preco</FormLabel><NumberInput min={0} value={draft.price} onChange={(_, value) => setDraft({ ...draft, price: Number.isFinite(value) ? value : 0 })}><NumberInputField /></NumberInput></FormControl><FormControl><FormLabel>Categoria</FormLabel><Select value={draft.categoryId} onChange={(event) => setDraft({ ...draft, categoryId: event.target.value })}>{categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}</Select></FormControl></HStack>
              <FormControl><FormLabel>Imagem URL</FormLabel><Input value={draft.image} onChange={(event) => setDraft({ ...draft, image: event.target.value })} /></FormControl>
              <FormControl><FormLabel>Descricao</FormLabel><Textarea value={draft.description} onChange={(event) => setDraft({ ...draft, description: event.target.value })} /></FormControl>
            </VStack>
          </ModalBody>
          <ModalFooter gap={3}><Button variant="ghost" onClick={onClose}>Cancelar</Button><Button onClick={saveProduct}>Salvar</Button></ModalFooter>
        </ModalContent>
      </Modal>
    </VStack>
  );
}
