import { Platform, ViewStyle } from 'react-native';

/**
 * Utility to handle shadows cross-platform and avoid deprecation warnings on react-native-web.
 * On web, it uses boxShadow. On mobile, it uses standard shadow props.
 */
export const shadow = (
  color: string = '#000',
  opacity: number = 0.1,
  radius: number = 10,
  offset: { width: number; height: number } = { width: 0, height: 2 },
  elevation: number = 5
): any => {
  return Platform.select({
    web: {
      boxShadow: `${offset.width}px ${offset.height}px ${radius}px ${color}`,
      // We rely on the browser to handle the opacity if color is rgba, 
      // or we can wrap the color if it's hex but we want to apply opacity.
      // For simplicity, we'll just pass the color as is and let the user handle rgba if needed.
      shadowOpacity: opacity, // Still useful for mobile
    },
    default: {
      shadowColor: color,
      shadowOpacity: opacity,
      shadowRadius: radius,
      shadowOffset: offset,
      elevation,
    },
  });
};

export const textShadow = (
  color: string = 'rgba(0,0,0,0.5)',
  offset: { width: number; height: number } = { width: 0, height: 2 },
  radius: number = 4
): any => {
  return Platform.select({
    web: {
      textShadow: `${offset.width}px ${offset.height}px ${radius}px ${color}`,
    },
    default: {
      textShadowColor: color,
      textShadowOffset: offset,
      textShadowRadius: radius,
    },
  });
};

