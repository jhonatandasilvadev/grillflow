import { extendTheme, type ThemeConfig } from '@chakra-ui/react';

const config: ThemeConfig = {
  initialColorMode: 'dark',
  useSystemColorMode: false
};

export const theme = extendTheme({
  config,
  fonts: {
    heading: 'Inter, ui-sans-serif, system-ui',
    body: 'Inter, ui-sans-serif, system-ui'
  },
  styles: {
    global: {
      body: {
        bg: 'brand.bg',
        color: 'whiteAlpha.900'
      },
      '*::selection': {
        bg: 'brand.orange',
        color: 'white'
      }
    }
  },
  colors: {
    brand: {
      bg: '#080b10',
      panel: '#10161f',
      panel2: '#151d29',
      line: '#243040',
      red: '#ff2e2e',
      orange: '#ff6b1a',
      amber: '#ffb000',
      green: '#39d98a',
      cyan: '#49c6e5'
    }
  },
  components: {
    Button: {
      baseStyle: {
        borderRadius: '12px',
        fontWeight: 700
      },
      variants: {
        solid: {
          bg: 'brand.orange',
          color: 'white',
          _hover: { bg: '#ff7d34', transform: 'translateY(-1px)' },
          _active: { transform: 'translateY(0)' }
        },
        ghost: {
          color: 'whiteAlpha.800',
          _hover: { bg: 'whiteAlpha.100', color: 'white' }
        }
      }
    },
    Card: {
      baseStyle: {
        container: {
          bg: 'rgba(16, 22, 31, 0.86)',
          border: '1px solid',
          borderColor: 'whiteAlpha.100',
          borderRadius: '16px',
          boxShadow: '0 18px 50px rgba(0,0,0,.28)'
        }
      }
    },
    Input: {
      variants: {
        filled: {
          field: {
            bg: 'whiteAlpha.100',
            border: '1px solid',
            borderColor: 'whiteAlpha.100',
            _hover: { bg: 'whiteAlpha.200' },
            _focus: { bg: 'whiteAlpha.100', borderColor: 'brand.orange' }
          }
        }
      },
      defaultProps: { variant: 'filled' }
    },
    Select: {
      variants: {
        filled: {
          field: {
            bg: 'whiteAlpha.100',
            borderColor: 'whiteAlpha.100'
          }
        }
      },
      defaultProps: { variant: 'filled' }
    }
  }
});
