import React, { useEffect, useMemo } from 'react';
import { Alert, Platform, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';

import VideoContainer from '../../components/video/VideoContainer';
import CallControls from '../../components/video/CallControls';
import ConnectionStatus from '../../components/video/ConnectionStatus';
import { useZegoCall } from '../../hooks/useZegoCall';
import { useWebRTCCall } from '../../hooks/useWebRTCCall';
import { useCallSignaler } from '../../hooks/useCallSignaling';
import { useAppointmentVideoAccess, formatCountdown } from '../../hooks/useAppointmentVideoAccess';
import { isZegoAvailable } from '../../services/zegoService';
import type { RootStackParamList } from '../../navigation/types';

type VideoRoute = RouteProp<RootStackParamList, 'VideoCall'>;

const VideoCallScreen: React.FC = () => {
  const route = useRoute<VideoRoute>();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const citaId = String(route.params?.citaId || '');
  const initiate = Boolean(route.params?.initiate);

  const access = useAppointmentVideoAccess(citaId);

  // Siempre llamamos ambos hooks (regla de hooks: no condicionales).
  // Cada uno detecta su plataforma y es no-op en la plataforma incorrecta.
  const zegoCall = useZegoCall(citaId);
  const webCall = useWebRTCCall(citaId, initiate);

  // Usamos el hook adecuado según la plataforma
  const call = Platform.OS === 'web' ? webCall : zegoCall;

  const signaler = useCallSignaler();

  /** Iniciar la llamada cuando el acceso esté disponible */
  useEffect(() => {
    if (!citaId) return;
    if (call.state !== 'idle') return;
    if (!access.canJoin) return;

    // Native: requiere Zego SDK (dev client)
    if (Platform.OS !== 'web' && !isZegoAvailable()) return;

    call.start();

    // Notificar al otro extremo que hay una llamada entrante
    if (initiate) {
      signaler.invite(citaId).catch(() => undefined);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [citaId, access.canJoin, call.state, initiate]);

  /** Salir si access deja de ser válido mientras la llamada está activa */
  useEffect(() => {
    if (!access.canJoin && call.state === 'live') {
      const t = setTimeout(() => call.end('time_up'), 1500);
      return () => clearTimeout(t);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [access.canJoin]);

  const handleEnd = async () => {
    await call.end();
    if (citaId) signaler.end(citaId).catch(() => undefined);
    navigation.goBack();
  };

  const durationLabel = useMemo(() => {
    if (call.state !== 'live') return undefined;
    return `${formatCountdown(call.durationSec)}  ·  cierra en ${formatCountdown(
      Math.floor(call.remainingMs / 1000)
    )}`;
  }, [call.state, call.durationSec, call.remainingMs]);

  // ── Fallback para native sin SDK Zego ────────────────────────────────────
  if (!isZegoAvailable() && Platform.OS !== 'web') {
    return (
      <View style={styles.fallbackWrap}>
        <MaterialIcons name="warning" size={42} color="#fbbf24" />
        <Text style={styles.fallbackTitle}>SDK de video no disponible</Text>
        <Text style={styles.fallbackBody}>
          Esta versión corre en Expo Go. La videollamada requiere el dev client (npx expo
          prebuild + EAS build) con `zego-express-engine-reactnative` instalado.
        </Text>
        <TouchableOpacity style={styles.fallbackBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.fallbackBtnTxt}>Volver</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor="#000" />

      {/* Video remoto fullscreen */}
      <VideoContainer
        mode="remote"
        streamId={call.remoteStreamId}
        stream={call.remoteStream}
        enabled={Boolean(call.remoteStreamId || call.remoteStream)}
        avatarLabel={call.remoteUserName || 'Esperando al otro participante...'}
        fullscreen
      />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() =>
            Alert.alert('Salir', '¿Finalizar la llamada?', [
              { text: 'Cancelar', style: 'cancel' },
              { text: 'Finalizar', style: 'destructive', onPress: handleEnd },
            ])
          }
        >
          <MaterialIcons name="close" size={24} color="#fff" />
        </TouchableOpacity>
        <ConnectionStatus state={call.state} remoteUserName={call.remoteUserName} />
        <View style={{ width: 24 }} />
      </View>

      {/* Mensaje de error */}
      {call.error ? (
        <View style={styles.errorBanner}>
          <MaterialIcons name="error-outline" size={16} color="#fff" />
          <Text style={styles.errorTxt}>{call.error}</Text>
        </View>
      ) : null}

      {/* Video local PiP */}
      <View style={styles.localPip}>
        <VideoContainer
          mode="local"
          streamId={call.localStreamId || null}
          stream={call.localStream}
          enabled={call.cameraEnabled}
          avatarLabel="Tu cámara"
        />
      </View>

      {/* Controles */}
      <View style={styles.controlsWrap}>
        <CallControls
          micEnabled={call.micEnabled}
          cameraEnabled={call.cameraEnabled}
          onToggleMic={call.toggleMic}
          onToggleCamera={call.toggleCamera}
          onFlipCamera={call.flipCamera}
          onEnd={handleEnd}
          durationLabel={durationLabel}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#000' },
  header: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 50 : 20,
    left: 16,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  errorBanner: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 100 : 70,
    left: 16,
    right: 16,
    backgroundColor: 'rgba(220,53,69,0.9)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  errorTxt: { color: '#fff', flex: 1, fontSize: 12, fontWeight: '700' },
  localPip: {
    position: 'absolute',
    right: 16,
    top: Platform.OS === 'ios' ? 100 : 80,
    width: 110,
    height: 160,
    borderRadius: 14,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.4)',
  },
  controlsWrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
  },
  fallbackWrap: {
    flex: 1,
    backgroundColor: '#0a1931',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    gap: 12,
  },
  fallbackTitle: { color: '#fff', fontSize: 18, fontWeight: '900', textAlign: 'center' },
  fallbackBody: { color: '#cbd5e1', fontSize: 13, textAlign: 'center', lineHeight: 19 },
  fallbackBtn: {
    marginTop: 16,
    paddingHorizontal: 22,
    paddingVertical: 10,
    backgroundColor: '#137fec',
    borderRadius: 10,
  },
  fallbackBtnTxt: { color: '#fff', fontWeight: '800' },
});

export default VideoCallScreen;
