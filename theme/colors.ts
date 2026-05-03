/**
 * Paleta central de Virem.
 * Antes vivía duplicada en 40+ pantallas. Importar desde aquí.
 */
export const colors = {
  primary: '#137fec',
  primarySoft: 'rgba(19,127,236,0.10)',
  bg: '#F6FAFD',
  surface: '#FFFFFF',
  border: '#eef2f7',
  borderSoft: '#d8e4f0',
  hover: '#f4f8fc',
  dark: '#0A1931',
  blue: '#1A3D63',
  muted: '#4A7FA7',
  success: '#16a34a',
  warning: '#f59e0b',
  danger: '#dc2626',
  white: '#FFFFFF',
} as const;

export type ColorToken = keyof typeof colors;
