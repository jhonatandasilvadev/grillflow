export const currency = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL'
});

export const number = new Intl.NumberFormat('pt-BR');

export function statusLabel(status: string) {
  const labels: Record<string, string> = {
    livre: 'Livre',
    ocupada: 'Ocupada',
    pagamento: 'Pagamento',
    reservada: 'Reservada',
    aguardando: 'Aguardando',
    preparando: 'Preparando',
    pronto: 'Pronto',
    entregue: 'Entregue',
    cancelado: 'Cancelado'
  };

  return labels[status] ?? status;
}

export function statusColor(status: string) {
  const colors: Record<string, string> = {
    livre: 'green',
    ocupada: 'orange',
    pagamento: 'purple',
    reservada: 'blue',
    aguardando: 'yellow',
    preparando: 'orange',
    pronto: 'green',
    entregue: 'cyan',
    cancelado: 'red'
  };

  return colors[status] ?? 'gray';
}
