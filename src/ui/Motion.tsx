import { motion } from 'framer-motion';
import { Box, type BoxProps } from '@chakra-ui/react';

export const MotionBox = motion<BoxProps>(Box);

export const fadeUp = {
  initial: { opacity: 0, y: 18 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.35, ease: [0.22, 1, 0.36, 1] }
};
