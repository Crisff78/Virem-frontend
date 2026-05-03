/**
 * Paleta central de Virem.
 * Antes vivía duplicada en 40+ pantallas. Importar desde aquí.
 */
export const colors = {
  primary: '#2B6CB0',
  primarySoft: 'rgba(43, 108, 176, 0.12)',
  bg: '#F8FAFC',
  surface: '#FFFFFF',
  border: '#E2E8F0',
  borderSoft: '#CBD5E1',
  hover: '#F1F5F9',
  dark: '#0F172A',
  blue: '#1A365D',
  muted: '#475569',
  success: '#10B981',
  warning: '#F59E0B',
  danger: '#EF4444',
  white: '#FFFFFF',
} as const;

export type ColorToken = keyof typeof colors;
