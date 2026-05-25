import { Box, Flex, Heading, HStack, Text } from '@chakra-ui/react';
import type { ReactNode } from 'react';

interface PageHeaderProps {
  title: string;
  eyebrow: string;
  children?: ReactNode;
}

export function PageHeader({ title, eyebrow, children }: PageHeaderProps) {
  return (
    <Flex
      align={{ base: 'flex-start', md: 'center' }}
      justify="space-between"
      gap={4}
      direction={{ base: 'column', md: 'row' }}
    >
      <Box>
        <Text color="brand.orange" fontSize="sm" fontWeight={800} textTransform="uppercase">
          {eyebrow}
        </Text>
        <Heading mt={1} size={{ base: 'lg', md: 'xl' }} letterSpacing="0">
          {title}
        </Heading>
      </Box>
      {children ? <HStack wrap="wrap">{children}</HStack> : null}
    </Flex>
  );
}
