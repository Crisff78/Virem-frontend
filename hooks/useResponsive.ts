import { useWindowDimensions, Platform } from 'react-native';

export const BREAKPOINTS = {
  mobile: 768,
  tablet: 1024,
};

export const useResponsive = () => {
  const { width, height } = useWindowDimensions();

  const isMobile = width < BREAKPOINTS.mobile;
  const isTablet = width >= BREAKPOINTS.mobile && width < BREAKPOINTS.tablet;
  const isDesktop = width >= BREAKPOINTS.tablet && Platform.OS === 'web';

  const isSmallMobile = width < 380;
  const isLargeDesktop = width >= 1440;

  // Helper to choose value based on breakpoint
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
    select,
  };
};
