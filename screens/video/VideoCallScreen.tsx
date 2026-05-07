import React, { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Linking,
  Modal,
  Platform,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
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

  // ── Permission denied modal state ──
  const [permissionDenied, setPermissionDenied] = useState(false);
  const [permissionType, setPermissionType] = useState<'camera' | 'mic' | 'both'>('both');

  // Siempre llamamos ambos hooks (regla de hooks: no condicionales).
  // Cada uno detecta su plataforma y es no-op en la plataforma incorrecta.
  const zegoCall = useZegoCall(citaId);
  const webCall = useWebRTCCall(citaId, initiate);

  // Usamos el hook adecuado según la plataforma
  const call = Platform.OS === 'web' ? webCall : zegoCall;

  const signaler = useCallSignaler();

  /** Detectar errores de permisos y mostrar modal instructivo */
  useEffect(() => {
    if (!call.error) {
      setPermissionDenied(false);
      return;
    }
    const errorLower = call.error.toLowerCase();
    if (
      errorLower.includes('permitir') ||
      errorLower.includes('permission') ||
      errorLower.includes('notallowederror') ||
      errorLower.includes('cámara') ||
      errorLower.includes('micrófono') ||
      errorLower.includes('camara') ||
      errorLower.includes('microfono')
    ) {
      if (errorLower.includes('cámara') || errorLower.includes('camara')) {
        setPermissionType('camera');
      } else if (errorLower.includes('micrófono') || errorLower.includes('microfono')) {
        setPermissionType('mic');
      } else {
        setPermissionType('both');
      }
      setPermissionDenied(true);
    }
  }, [call.error]);

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

  const openAppSettings = () => {
    if (Platform.OS === 'ios') {
      Linking.openURL('app-settings:');
    } else if (Platform.OS === 'android') {
      Linking.openSettings();
    }
    // Web: user needs to use browser UI
  };

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

      {/* Mensaje de error (solo si no es error de permisos — eso lo maneja el modal) */}
      {call.error && !permissionDenied ? (
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

      {/* ── Permission Denied Modal ── */}
      <Modal
        visible={permissionDenied}
        transparent
        animationType="fade"
        onRequestClose={() => setPermissionDenied(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalIconWrap}>
              <MaterialIcons
                name={permissionType === 'camera' ? 'videocam-off' : permissionType === 'mic' ? 'mic-off' : 'block'}
                size={40}
                color="#ef4444"
              />
            </View>
            <Text style={styles.modalTitle}>Permisos necesarios</Text>
            <Text style={styles.modalBody}>
              {permissionType === 'camera'
                ? 'VIREM necesita acceso a tu cámara para la videollamada.'
                : permissionType === 'mic'
                ? 'VIREM necesita acceso a tu micrófono para la videollamada.'
                : 'VIREM necesita acceso a tu cámara y micrófono para iniciar la videollamada.'}
            </Text>

            <View style={styles.modalSteps}>
              <Text style={styles.modalStepTitle}>¿Cómo habilitarlos?</Text>
              {Platform.OS === 'web' ? (
                <>
                  <Text style={styles.modalStep}>
                    1. Haz clic en el icono de candado 🔒 junto a la barra de direcciones
                  </Text>
                  <Text style={styles.modalStep}>
                    2. Activa los permisos de cámara y micrófono
                  </Text>
                  <Text style={styles.modalStep}>3. Recarga la página</Text>
                </>
              ) : (
                <>
                  <Text style={styles.modalStep}>
                    1. Abre la configuración de tu dispositivo
                  </Text>
                  <Text style={styles.modalStep}>2. Busca la app VIREM</Text>
                  <Text style={styles.modalStep}>
                    3. Habilita los permisos de cámara y micrófono
                  </Text>
                </>
              )}
            </View>

            <View style={styles.modalActions}>
              {Platform.OS !== 'web' && (
                <TouchableOpacity style={styles.modalPrimaryBtn} onPress={openAppSettings}>
                  <MaterialIcons name="settings" size={18} color="#fff" />
                  <Text style={styles.modalPrimaryBtnText}>Abrir configuración</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity
                style={styles.modalSecondaryBtn}
                onPress={() => {
                  setPermissionDenied(false);
                  call.start();
                }}
              >
                <MaterialIcons name="refresh" size={18} color="#137fec" />
                <Text style={styles.modalSecondaryBtnText}>Reintentar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalGhostBtn}
                onPress={() => {
                  setPermissionDenied(false);
                  navigation.goBack();
                }}
              >
                <Text style={styles.modalGhostBtnText}>Volver sin videollamada</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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

  // ── Permission Modal styles ──
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalCard: {
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 28,
    width: '100%',
    maxWidth: 400,
    alignItems: 'center',
  },
  modalIconWrap: {
    width: 72,
    height: 72,
    borderRadius: 20,
    backgroundColor: '#fef2f2',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: '#0a1931',
    textAlign: 'center',
    marginBottom: 8,
  },
  modalBody: {
    fontSize: 14,
    color: '#4a7fa7',
    fontWeight: '600',
    textAlign: 'center',
    lineHeight: 21,
    marginBottom: 16,
  },
  modalSteps: {
    width: '100%',
    backgroundColor: '#f8fafc',
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
  },
  modalStepTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0a1931',
    marginBottom: 10,
  },
  modalStep: {
    fontSize: 13,
    color: '#4a7fa7',
    fontWeight: '600',
    lineHeight: 22,
    marginBottom: 4,
  },
  modalActions: {
    width: '100%',
    gap: 10,
  },
  modalPrimaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#137fec',
    paddingVertical: 14,
    borderRadius: 14,
  },
  modalPrimaryBtnText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '800',
  },
  modalSecondaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#f1f5f9',
    paddingVertical: 14,
    borderRadius: 14,
  },
  modalSecondaryBtnText: {
    color: '#137fec',
    fontSize: 15,
    fontWeight: '800',
  },
  modalGhostBtn: {
    alignItems: 'center',
    paddingVertical: 10,
  },
  modalGhostBtnText: {
    color: '#94a3b8',
    fontSize: 13,
    fontWeight: '700',
  },
});

export default VideoCallScreen;
