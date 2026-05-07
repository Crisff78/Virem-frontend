import React from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import type { CallConnectionState } from '../../hooks/useZegoCall';

type Props = {
  state: CallConnectionState;
  remoteUserName?: string | null;
};

const STATE_LABELS: Record<CallConnectionState, { text: string; color: string; icon: string }> = {
  idle: { text: 'Listo para conectar', color: '#94a8be', icon: 'hourglass-empty' },
  connecting: { text: 'Conectando...', color: '#137fec', icon: 'wifi-tethering' },
  live: { text: 'En llamada', color: '#22c55e', icon: 'check-circle' },
  reconnecting: { text: 'Reconectando...', color: '#f59e0b', icon: 'autorenew' },
  ended: { text: 'Llamada finalizada', color: '#94a8be', icon: 'call-end' },
  error: { text: 'Error de conexion', color: '#dc3545', icon: 'error-outline' },
};

const ConnectionStatus: React.FC<Props> = ({ state, remoteUserName }) => {
  const cfg = STATE_LABELS[state];
  return (
    <View style={[styles.bar, { backgroundColor: cfg.color }]}>
      {state === 'connecting' || state === 'reconnecting' ? (
        <ActivityIndicator size="small" color="#fff" />
      ) : (
        <MaterialIcons name={cfg.icon as any} size={16} color="#fff" />
      )}
      <Text style={styles.txt}>
        {cfg.text}
        {remoteUserName && state === 'live' ? ` con ${remoteUserName}` : ''}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    alignSelf: 'center',
    marginTop: 12,
  },
  txt: { color: '#fff', fontWeight: '800', fontSize: 12 },
});

export default ConnectionStatus;
