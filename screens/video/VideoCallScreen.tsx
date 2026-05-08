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

import LocalVideo from '../../components/video/LocalVideo';
import RemoteVideo from '../../components/video/RemoteVideo';
import CallControls from '../../components/video/CallControls';
import ConnectionStatus from '../../components/video/ConnectionStatus';
import { useVideoCall } from '../../hooks/useVideoCall';
import { useCallSignaler } from '../../hooks/useCallSignaling';
import { useAppointmentVideoAccess, formatCountdown } from '../../hooks/useAppointmentVideoAccess';
import type { RootStackParamList } from '../../navigation/types';

type VideoRoute = RouteProp<RootStackParamList, 'VideoCall'>;

const VideoCallScreen: React.FC = () => {
  const route = useRoute<VideoRoute>();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const citaId = String(route.params?.citaId || '');
  const initiate = Boolean(route.params?.initiate);

  const access = useAppointmentVideoAccess(citaId);
  const call = useVideoCall(citaId);
  const signaler = useCallSignaler();

  // ── Permission denied modal state ──
  const [permissionDenied, setPermissionDenied] = useState(false);
  const [permissionType, setPermissionType] = useState<'camera' | 'mic' | 'both'>('both');

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

    call.start();
  }, [citaId, access.canJoin, call.state]);

  /** Salir si access deja de ser válido mientras la llamada está activa */
  useEffect(() => {
    if (!access.canJoin && (call.state === 'connected' || call.state === 'joining')) {
      const t = setTimeout(() => call.end('time_up'), 1500);
      return () => clearTimeout(t);
    }
  }, [access.canJoin, call.state]);

  const handleEnd = async () => {
    await call.end();
    if (citaId) signaler.end(citaId).catch(() => undefined);
    navigation.goBack();
  };

  // ── Auto-redirect when the OTHER side ends the call ──
  useEffect(() => {
    if (call.state !== 'ended') return;
    if (!initiate) {
      const timer = setTimeout(() => {
        Alert.alert(
          'Consulta Finalizada',
          'La consulta ha finalizado.',
          [
            { text: 'Ver Recetas', onPress: () => navigation.navigate('PacienteRecetasDocumentos' as any) },
            { text: 'Volver', onPress: () => navigation.goBack() },
          ]
        );
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [call.state, initiate, navigation]);

  const durationLabel = useMemo(() => {
    if (call.state !== 'connected') return undefined;
    return `${formatCountdown(call.durationSec)}  ·  cierra en ${formatCountdown(
      Math.floor(call.remainingMs / 1000)
    )}`;
  }, [call.state, call.durationSec, call.remainingMs]);

  const waitingLabel = useMemo(() => {
    if (call.remoteParticipants.length > 0) {
      return call.remoteParticipants[0].name || 'Participante';
    }
    return initiate
      ? 'Esperando a que el paciente se una...'
      : 'Esperando a que el médico se una...';
  }, [call.remoteParticipants, initiate]);

  const openAppSettings = () => {
    if (Platform.OS === 'ios') {
      Linking.openURL('app-settings:');
    } else if (Platform.OS === 'android') {
      Linking.openSettings();
    }
  };

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor="#000" />

      {/* Video remoto fullscreen */}
      <RemoteVideo
        participant={call.remoteParticipants[0]}
        enabled={call.remoteParticipants.length > 0}
        avatarLabel={waitingLabel}
        fullscreen
      />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() =>
            Alert.alert('Salir', '¿Finalizar la consulta?', [
              { text: 'Cancelar', style: 'cancel' },
              { text: 'Finalizar', style: 'destructive', onPress: handleEnd },
            ])
          }
        >
          <MaterialIcons name="close" size={24} color="#fff" />
        </TouchableOpacity>
        <ConnectionStatus 
           state={call.state as any} 
           remoteUserName={call.remoteParticipants[0]?.name || null} 
        />
        <View style={{ width: 24 }} />
      </View>

      {/* Error Banner */}
      {call.error && !permissionDenied ? (
        <View style={styles.errorBanner}>
          <MaterialIcons name="error-outline" size={16} color="#fff" />
          <Text style={styles.errorTxt}>{call.error}</Text>
        </View>
      ) : null}

      {/* Video local PiP */}
      <View style={styles.localPip}>
        <LocalVideo
          participant={call.localParticipant}
          enabled={call.cameraEnabled}
          avatarLabel="Tú"
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

      {/* Permission Denied Modal */}
      <Modal
        visible={permissionDenied}
        transparent
        animationType="fade"
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <MaterialIcons
              name={permissionType === 'camera' ? 'videocam-off' : permissionType === 'mic' ? 'mic-off' : 'block'}
              size={40}
              color="#ef4444"
            />
            <Text style={styles.modalTitle}>Permisos necesarios</Text>
            <Text style={styles.modalBody}>
              VIREM necesita acceso a tu {permissionType === 'both' ? 'cámara y micrófono' : permissionType} para la videollamada.
            </Text>
            <TouchableOpacity style={styles.modalPrimaryBtn} onPress={openAppSettings}>
              <Text style={styles.modalPrimaryBtnText}>Abrir configuración</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.modalSecondaryBtn}
              onPress={() => {
                setPermissionDenied(false);
                call.start();
              }}
            >
              <Text style={styles.modalSecondaryBtnText}>Reintentar</Text>
            </TouchableOpacity>
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
    zIndex: 10,
  },
  errorBanner: {
    position: 'absolute',
    top: 100,
    left: 16,
    right: 16,
    backgroundColor: 'rgba(220,53,69,0.9)',
    padding: 12,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    zIndex: 10,
  },
  errorTxt: { color: '#fff', fontSize: 12, fontWeight: '700' },
  localPip: {
    position: 'absolute',
    right: 16,
    top: 100,
    width: 110,
    height: 160,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.4)',
    zIndex: 5,
  },
  controlsWrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 10,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 24,
    width: '100%',
    alignItems: 'center',
  },
  modalTitle: { fontSize: 18, fontWeight: '800', marginVertical: 12 },
  modalBody: { fontSize: 14, textAlign: 'center', marginBottom: 20 },
  modalPrimaryBtn: { backgroundColor: '#137fec', padding: 14, borderRadius: 12, width: '100%', alignItems: 'center' },
  modalPrimaryBtnText: { color: '#fff', fontWeight: '700' },
  modalSecondaryBtn: { marginTop: 12, padding: 10 },
  modalSecondaryBtnText: { color: '#137fec', fontWeight: '600' },
});

export default VideoCallScreen;
