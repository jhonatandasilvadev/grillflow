import { Button, ButtonGroup } from '@chakra-ui/react';

interface ViewToggleProps {
  value: 'lista' | 'cards';
  onChange: (value: 'lista' | 'cards') => void;
}

export function ViewToggle({ value, onChange }: ViewToggleProps) {
  return (
    <ButtonGroup size="sm" isAttached>
      <Button variant={value === 'lista' ? 'solid' : 'ghost'} onClick={() => onChange('lista')}>
        Lista
      </Button>
      <Button variant={value === 'cards' ? 'solid' : 'ghost'} onClick={() => onChange('cards')}>
        Cards
      </Button>
    </ButtonGroup>
  );
}
