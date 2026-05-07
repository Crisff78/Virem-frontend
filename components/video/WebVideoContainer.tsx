import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';

type Props = {
  stream: any;
  muted?: boolean;
  fullscreen?: boolean;
  avatarLabel?: string;
  enabled?: boolean;
  fit?: 'cover' | 'contain';
};

/**
 * Versión segura para móvil. 
 * En móvil se usan componentes nativos de Zego, no este contenedor web.
 */
const WebVideoContainer: React.FC<Props> = ({
  fullscreen = false,
  avatarLabel,
}) => {
  return (
    <View style={[styles.wrap, fullscreen ? styles.fullscreen : null]}>
      <View style={styles.avatarWrap}>
        <View style={styles.avatarCircle}>
          <MaterialIcons name="person" size={fullscreen ? 80 : 36} color="#fff" />
        </View>
        {avatarLabel && <Text style={styles.avatarLabel}>{avatarLabel}</Text>}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: { backgroundColor: '#0a1931', borderRadius: 14, overflow: 'hidden' },
  fullscreen: { flex: 1, borderRadius: 0 },
  avatarWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#0a1931' },
  avatarCircle: { width: 96, height: 96, borderRadius: 96, backgroundColor: 'rgba(255,255,255,0.12)', alignItems: 'center', justifyContent: 'center' },
  avatarLabel: { color: '#fff', fontSize: 14, fontWeight: '700', marginTop: 8 },
});

export default WebVideoContainer;
