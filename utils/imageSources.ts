import type { ImageSourcePropType } from 'react-native';

const normalizeText = (value: unknown) => String(value || '').trim();

export const sanitizeRemoteImageUrl = (value: unknown) => {
  const clean = normalizeText(value);
  if (!clean) return '';
  if (clean.toLowerCase().startsWith('blob:')) return '';
  return clean;
};

export const resolveRemoteImageSource = (
  value: unknown,
  fallback: ImageSourcePropType
): ImageSourcePropType => {
  const clean = sanitizeRemoteImageUrl(value);
  if (clean) {
    return { uri: clean };
  }
  return fallback;
};
