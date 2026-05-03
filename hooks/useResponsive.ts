import { useWindowDimensions } from 'react-native';
import { contentMaxWidth, horizontalPadding } from '../theme/spacing';

const BASE_WIDTH = 390; // iPhone 14 Pro

export const BREAKPOINTS = {
  smallPhone: 360,
  phone: 480,
  tablet: 600,
  desktop: 1024,
  wide: 1440,
} as const;

export const useResponsive = () => {
  const { width, height } = useWindowDimensions();

  const isSmallMobile = width < BREAKPOINTS.smallPhone;
  const isMobile = width < BREAKPOINTS.tablet;
  const isTablet = width >= BREAKPOINTS.tablet && width < BREAKPOINTS.desktop;
  const isDesktop = width >= BREAKPOINTS.desktop;
  const isLargeDesktop = width >= BREAKPOINTS.wide;
  const isPhone = isMobile;
  const isLandscape = width > height;

  /**
   * fs: font scale conservador.
   * Garantiza min 75% (phones pequeños), max 1.6 móvil / 1.1 desktop.
   */
  const fs = (size: number): number => {
    const maxScale = isDesktop ? 1.1 : 1.6;
    const scale = Math.min(Math.max(width / BASE_WIDTH, 0.75), maxScale);
    return Math.round(size * scale);
  };

  /**
   * rs: spacing scale (más conservador que fs).
   */
  const rs = (size: number): number => {
    const maxScale = isDesktop ? 1.05 : 1.4;
    const scale = Math.min(Math.max(width / BASE_WIDTH, 0.8), maxScale);
    return Math.round(size * scale);
  };

  const wp = (percent: number): number => (width * percent) / 100;
  const hp = (percent: number): number => (height * percent) / 100;

  /**
   * Clamp escalado: nunca excede min/max sin importar el dispositivo.
   */
  const clamp = (value: number, min: number, max: number): number => {
    const scaled = rs(value);
    return Math.min(Math.max(scaled, min), max);
  };

  /**
   * Escala tipográfica semántica lista para StyleSheet.
   */
  const typography = {
    xs: fs(10),
    sm: fs(12),
    base: fs(14),
    md: fs(16),
    lg: fs(18),
    xl: fs(22),
    '2xl': fs(22),
    '3xl': fs(28),
    '4xl': fs(34),
  };

  /**
   * select: helper para variar valores por breakpoint.
   */
  const select = <TMobile, TTablet = TMobile, TDesktop = TMobile>(options: {
    mobile: TMobile;
    tablet?: TTablet;
    desktop?: TDesktop;
  }): TMobile | TTablet | TDesktop => {
    if (isDesktop && options.desktop !== undefined) return options.desktop;
    if ((isTablet || isDesktop) && options.tablet !== undefined) return options.tablet;
    return options.mobile;
  };

  const paddingH = horizontalPadding(width);
  const maxContent = contentMaxWidth(width);

  return {
    width,
    height,
    isSmallMobile,
    isMobile,
    isTablet,
    isDesktop,
    isLargeDesktop,
    isPhone,
    isLandscape,
    fs,
    rs,
    wp,
    hp,
    clamp,
    typography,
    select,
    paddingH,
    maxContent,
  };
};
