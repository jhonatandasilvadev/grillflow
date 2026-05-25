import { Box, Card, Flex, HStack, Icon, Text } from '@chakra-ui/react';
import type { LucideIcon } from 'lucide-react';
import { ArrowUpRight } from 'lucide-react';

interface KpiCardProps {
  label: string;
  value: string;
  helper: string;
  icon: LucideIcon;
  tone?: string;
}

export function KpiCard({ label, value, helper, icon, tone = 'brand.orange' }: KpiCardProps) {
  return (
    <Card
      p={{ base: 4, md: 5 }}
    >
      <Flex align="flex-start" justify="space-between" gap={4}>
        <Box>
          <Text color="whiteAlpha.600" fontSize="sm" fontWeight={700}>
            {label}
          </Text>
          <Text mt={2} fontSize={{ base: '2xl', md: '3xl' }} fontWeight={800}>
            {value}
          </Text>
          <HStack mt={3} color="whiteAlpha.700" fontSize="sm">
            <Icon as={ArrowUpRight} boxSize={4} color={tone} />
            <Text>{helper}</Text>
          </HStack>
        </Box>
        <Flex
          align="center"
          justify="center"
          boxSize="46px"
          borderRadius="14px"
          bg="whiteAlpha.100"
          color={tone}
        >
          <Icon as={icon} boxSize={5} />
        </Flex>
      </Flex>
    </Card>
  );
}
