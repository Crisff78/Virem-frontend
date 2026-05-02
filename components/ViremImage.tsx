import React from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';
import { Image, ImageProps } from 'expo-image';

interface ViremImageProps extends ImageProps {
  containerStyle?: ViewStyle;
}

const blurhash =
  '|rF?hV%2WCj[ayWD_4f6g[#S%2WCj[ayWD_4f6g[j[ayWD_4f6g[#S%2WCj[ayWD_4f6g[j[ayWD_4f6g[#S%2WCj[ayWD_4f6g[j[ayWD_4f6g[#S%2WCj[ayWD_4f6g[j[ayWD_4f6g[#S%2WCj[ayWD_4f6g[';

const ViremImage: React.FC<ViremImageProps> = ({ 
  source, 
  style, 
  containerStyle,
  contentFit = 'cover',
  transition = 300,
  ...props 
}) => {
  return (
    <View style={[styles.container, containerStyle]}>
      <Image
        source={source}
        style={[styles.image, style]}
        placeholder={{ blurhash }}
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
    backgroundColor: '#f0f0f0',
  },
  image: {
    width: '100%',
    height: '100%',
  },
});

export default ViremImage;
