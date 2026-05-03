import { useWindowDimensions } from 'react-native';

// iPhone 14 Pro es la referencia de diseño base
const BASE_WIDTH = 390;

export const BREAKPOINTS = {
  tablet: 600,
  desktop: 1024,
};

export const useResponsive = () => {
  const { width, height } = useWindowDimensions();

  const isMobile  = width < BREAKPOINTS.tablet;
  const isTablet  = width >= BREAKPOINTS.tablet && width < BREAKPOINTS.desktop;
  const isDesktop = width >= BREAKPOINTS.desktop;

  const isSmallMobile  = width < 360;
  const isLargeDesktop = width >= 1440;

  // Escala tipografía relativa al ancho de pantalla.
  // Clamp: mínimo 75% (phones pequeños), máximo 160% (tablets grandes).
  const fs = (size: number): number => {
    // For desktop, we use a much more conservative scale
    const maxScale = isDesktop ? 1.1 : 1.6;
    const scale = Math.min(Math.max(width / BASE_WIDTH, 0.75), maxScale);
    return Math.round(size * scale);
  };

  const rs = (size: number): number => {
    // For desktop, we use a much more conservative scale
    const maxScale = isDesktop ? 1.05 : 1.4;
    const scale = Math.min(Math.max(width / BASE_WIDTH, 0.8), maxScale);
    return Math.round(size * scale);
  };

  // Porcentaje del ancho/alto de pantalla
  const wp = (percent: number): number => (width  * percent) / 100;
  const hp = (percent: number): number => (height * percent) / 100;

  // Escala semántica de tipografía lista para usar en StyleSheet
  const typography = {
    xs:    fs(10),
    sm:    fs(12),
    base:  fs(14),
    lg:    fs(16),
    xl:    fs(18),
    '2xl': fs(22),
    '3xl': fs(28),
    '4xl': fs(34),
  };

  // Helper para elegir valor según breakpoint
  const select = <TMobile, TTablet = TMobile, TDesktop = TMobile>(
    options: { mobile: TMobile; tablet?: TTablet; desktop?: TDesktop }
  ): TMobile | TTablet | TDesktop => {
    if (isDesktop && options.desktop !== undefined) return options.desktop;
    if ((isTablet || isDesktop) && options.tablet !== undefined) return options.tablet;
    return options.mobile;
  };

  return {
    width,
    height,
    isMobile,
    isTablet,
    isDesktop,
    isSmallMobile,
    isLargeDesktop,
    fs,
    rs,
    wp,
    hp,
    typography,
    select,
  };
};
