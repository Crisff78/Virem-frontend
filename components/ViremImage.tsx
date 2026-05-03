import React from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';
import { Image, ImageProps } from 'expo-image';

interface ViremImageProps extends ImageProps {
  containerStyle?: ViewStyle;
}

const blurhash = 'L6PZfSaD00jE.AyE_3t7t7Rj4n9G';

const ViremImage: React.FC<ViremImageProps> = ({ 
  source, 
  style, 
  containerStyle,
  contentFit = 'cover',
  transition = 300,
  ...props 
}) => {
  // Determine if it's a local asset (number) or remote/URI (object with uri or string)
  const isLocalAsset = typeof source === 'number';

  return (
    <View style={[styles.container, style, containerStyle]}>
      <Image
        source={source}
        style={[styles.image, style]}
        placeholder={isLocalAsset ? undefined : { blurhash }} // Don't use blurhash for local icons/logos
        contentFit={contentFit}
        transition={transition}
        cachePolicy="memory-disk"
        {...props}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
  image: {
    width: '100%',
    height: '100%',
  },
});

export default ViremImage;
