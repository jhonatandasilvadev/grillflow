import { Badge } from '@chakra-ui/react';
import { statusColor, statusLabel } from '../lib/format';

export function StatusBadge({ status }: { status: string }) {
  return (
    <Badge colorScheme={statusColor(status)} borderRadius="999px" px={3} py={1}>
      {statusLabel(status)}
    </Badge>
  );
}
