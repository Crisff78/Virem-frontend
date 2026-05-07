import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { sanitizeRemoteImageUrl, resolveRemoteImageSource } from './utils/imageSources';
import {
  Animated,
  Platform,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ScrollView,
  useWindowDimensions,
} from 'react-native';
import type { ImageSourcePropType } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { useRoute } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import { usePortalAwareNavigation } from './navigation/usePortalAwareNavigation';
import { usePacienteModule } from './navigation/PacienteModuleContext';

import { useLanguage } from './localization/LanguageContext';
import type { RootStackParamList } from './navigation/types';
import { apiUrl } from './config/backend';
import { useSocketRoom } from './hooks/useSocketRoom';
import { useAuth } from './providers/AuthProvider';
import { getAuthToken } from './utils/session';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { ensurePatientSessionUser, getPatientDisplayName } from './utils/patientSession';

const DefaultAvatar = require('./assets/imagenes/avatar-default.jpg');

const DoctorAvatar: ImageSourcePropType = DefaultAvatar;
const STORAGE_KEY = 'user';
const LEGACY_USER_STORAGE_KEY = 'userProfile';

type DeviceOption = {
  id: string;
  label: string;
};

type User = {
  nombres?: string;
  apellidos?: string;
  nombre?: string;
  apellido?: string;
  firstName?: string;
  lastName?: string;
  plan?: string;
  fotoUrl?: string;
};

type CitaItem = {
  citaid?: string;
  fechaHoraInicio?: string | null;
  modalidad?: string;
  estadoCodigo?: string;
  videoSalaId?: string | null;
  medico?: {
    nombreCompleto?: string;
    especialidad?: string;
    fotoUrl?: string | null;
  };
};

const parseUser = (raw: string | null): User | null => {
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
};

const formatDateTime = (value: string | null | undefined) => {
  if (!value) return 'Sin horario';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Sin horario';
  return new Intl.DateTimeFormat('es-DO', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
};

const parseDateMs = (value: string | null | undefined) => {
  if (!value) return Number.POSITIVE_INFINITY;
  const ms = new Date(value).getTime();
  return Number.isFinite(ms) ? ms : Number.POSITIVE_INFINITY;
};

const WAIT_TIMEOUT_SECONDS = 300; // 5 minutes

const SalaEsperaVirtualPacienteScreen: React.FC = () => {
  const { t } = useLanguage();
  const navigation = usePortalAwareNavigation();
  const { isInsidePortal, toggleSidebar, setNotificationsOpen } = usePacienteModule();
  const route = useRoute<RouteProp<RootStackParamList, 'SalaEsperaVirtualPaciente'>>();
  const { signOut } = useAuth();
  const { width: viewportWidth } = useWindowDimensions();
  const [cameraOn, setCameraOn] = useState(true);
  const [micOn, setMicOn] = useState(true);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [nextCita, setNextCita] = useState<CitaItem | null>(null);
  const [upcomingCitas, setUpcomingCitas] = useState<CitaItem[]>([]);
  const [selectedCitaId, setSelectedCitaId] = useState('');
  const [loadingCita, setLoadingCita] = useState(false);
  const [loadingRoom, setLoadingRoom] = useState(false);
  const [openingRoom, setOpeningRoom] = useState(false);
  const [roomJoinUrl, setRoomJoinUrl] = useState('');
  const [roomStatus, setRoomStatus] = useState('');
  const [roomCanJoin, setRoomCanJoin] = useState(false);
  const [roomError, setRoomError] = useState('');
  const [waitSeconds, setWaitSeconds] = useState(0);
  const waitTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const dot1 = useRef(new Animated.Value(0.25)).current;
  const dot2 = useRef(new Animated.Value(0.25)).current;
  const dot3 = useRef(new Animated.Value(0.25)).current;
  const signalPulse = useRef(new Animated.Value(0.35)).current;
  const avatarScale = useRef(new Animated.Value(1)).current;
  const roomReadyPulse = useRef(new Animated.Value(0)).current;
  const panelTranslateX = useRef(new Animated.Value(430)).current;
  const overlayOpacity = useRef(new Animated.Value(0)).current;
  const requestedCitaId = String(route.params?.citaId || '').trim();
  const isDesktopLayout = Platform.OS === 'web' && viewportWidth >= 1024;

  useEffect(() => {
    const loadUser = async () => {
      try {
        let sessionUser: User | null = null;
        if (Platform.OS === 'web') {
          const webUser = parseUser(localStorage.getItem(LEGACY_USER_STORAGE_KEY));
          if (webUser) sessionUser = webUser;
        }
        if (!sessionUser) {
          const secureUser = parseUser(await SecureStore.getItemAsync(LEGACY_USER_STORAGE_KEY));
          if (secureUser) sessionUser = secureUser;
        }
        if (!sessionUser) {
          const asyncUser = parseUser(await AsyncStorage.getItem(STORAGE_KEY));
          if (asyncUser) sessionUser = asyncUser;
        }
        sessionUser = ensurePatientSessionUser(sessionUser);
        const token = await getAuthToken();
        if (token) {
          const profileResponse = await fetch(apiUrl('/api/users/me/paciente-profile'), {
            method: 'GET',
            headers: { Authorization: `Bearer ${token}` },
          });
          const profilePayload = await profileResponse.json().catch(() => null);
          if (profileResponse.ok && profilePayload?.success && profilePayload?.profile) {
            const profileUser = profilePayload.profile as User;
            sessionUser = {
              ...(sessionUser || {}),
              ...profileUser,
              fotoUrl: sanitizeRemoteImageUrl((profileUser as any)?.fotoUrl),
            };
          }
        }
        setUser(sessionUser);
      } catch {
        setUser(null);
      }
    };
    loadUser();
  }, []);

  useEffect(() => {
    const makePulse = (value: Animated.Value, delay: number) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(value, { toValue: 1, duration: 400, useNativeDriver: true }),
          Animated.timing(value, { toValue: 0.2, duration: 400, useNativeDriver: true }),
          Animated.delay(300),
        ])
      );
    const breathe = Animated.loop(
      Animated.sequence([
        Animated.timing(avatarScale, { toValue: 1.06, duration: 1200, useNativeDriver: true }),
        Animated.timing(avatarScale, { toValue: 1, duration: 1200, useNativeDriver: true }),
      ])
    );
    const animation = Animated.parallel([
      makePulse(dot1, 0),
      makePulse(dot2, 180),
      makePulse(dot3, 360),
      makePulse(signalPulse, 0),
      breathe,
    ]);
    animation.start();
    return () => animation.stop();
  }, [dot1, dot2, dot3, signalPulse, avatarScale]);

  useEffect(() => {
    if (nextCita && !roomCanJoin) {
      setWaitSeconds(0);
      waitTimerRef.current = setInterval(() => setWaitSeconds((s) => s + 1), 1000);
    } else {
      setWaitSeconds(0);
      if (waitTimerRef.current) { clearInterval(waitTimerRef.current); waitTimerRef.current = null; }
    }
    return () => { if (waitTimerRef.current) { clearInterval(waitTimerRef.current); waitTimerRef.current = null; } };
  }, [nextCita, roomCanJoin]);

  const connectionLabel = useMemo(() => {
    if (loadingCita || loadingRoom) return { text: 'Conectando…', color: '#f59e0b', dot: '#f59e0b' };
    if (openingRoom) return { text: 'Conectando a sala…', color: '#f59e0b', dot: '#f59e0b' };
    return { text: 'CONECTADO', color: '#16a34a', dot: '#22c55e' };
  }, [loadingCita, loadingRoom, openingRoom]);

  const isLongWait = useMemo(() => nextCita && !roomCanJoin && waitSeconds >= WAIT_TIMEOUT_SECONDS, [nextCita, roomCanJoin, waitSeconds]);

  useEffect(() => {
    if (roomCanJoin) {
      roomReadyPulse.setValue(0);
      Animated.timing(roomReadyPulse, { toValue: 1, duration: 500, useNativeDriver: false }).start();
    } else {
      roomReadyPulse.setValue(0);
    }
  }, [roomCanJoin, roomReadyPulse]);

  useEffect(() => {
    const loadNextCita = async () => {
      setLoadingCita(true);
      try {
        const token = await getAuthToken();
        if (!token) return;
        const response = await fetch(apiUrl('/api/agenda/me/citas?scope=upcoming&limit=40'), {
          method: 'GET',
          headers: { Authorization: `Bearer ${token}` },
        });
        const payload = await response.json().catch(() => null);
        if (response.ok && payload?.success && Array.isArray(payload?.citas) && payload.citas.length) {
          const ordered = (payload.citas as CitaItem[])
            .filter((item) => String(item?.modalidad || '').toLowerCase() === 'virtual')
            .filter((item) => ['pendiente', 'confirmada', 'reprogramada'].includes(String(item?.estadoCodigo || '').toLowerCase()))
            .sort((a, b) => parseDateMs(a?.fechaHoraInicio) - parseDateMs(b?.fechaHoraInicio));
          setUpcomingCitas(ordered);
          const chosen = (requestedCitaId ? ordered.find(i => String(i?.citaid).trim() === requestedCitaId) : ordered[0]) || null;
          setSelectedCitaId(String(chosen?.citaid || ''));
          setNextCita(chosen);
        }
      } catch {
        setNextCita(null);
      } finally {
        setLoadingCita(false);
      }
    };
    loadNextCita();
  }, [requestedCitaId]);

  useEffect(() => {
    const loadVideoRoom = async () => {
      const citaId = String(selectedCitaId || '').trim();
      if (!citaId) return;
      setLoadingRoom(true);
      try {
        const token = await getAuthToken();
        if (!token) return;
        const response = await fetch(apiUrl(`/api/agenda/me/citas/${citaId}/video-sala`), {
          method: 'GET',
          headers: { Authorization: `Bearer ${token}` },
        });
        const payload = await response.json().catch(() => null);
        if (response.ok && payload?.success && payload?.videoSala) {
          setRoomJoinUrl(String(payload.videoSala.joinUrl || '').trim());
          setRoomStatus(String(payload.videoSala.estado || '').trim().toLowerCase());
          setRoomCanJoin(Boolean(payload.videoSala.canJoin));
        }
      } catch {
        setRoomCanJoin(false);
      } finally {
        setLoadingRoom(false);
      }
    };
    loadVideoRoom();
  }, [selectedCitaId]);

  useSocketRoom('cita', selectedCitaId, Boolean(selectedCitaId));

  const enterVideoRoom = () => {
    if (!nextCita?.citaid) return;
    navigation.navigate('VideoCall', { citaId: nextCita.citaid, initiate: false });
  };

  const openSettings = () => {
    setSettingsOpen(true);
    Animated.parallel([
      Animated.timing(panelTranslateX, { toValue: 0, duration: 250, useNativeDriver: true }),
      Animated.timing(overlayOpacity, { toValue: 1, duration: 220, useNativeDriver: true }),
    ]).start();
  };

  const doctorName = String(nextCita?.medico?.nombreCompleto || '').trim() || 'Tu especialista';
  const doctorSpec = String(nextCita?.medico?.especialidad || '').trim() || 'Medicina General';
  const citaHora = formatDateTime(nextCita?.fechaHoraInicio);
  const userAvatarSource: ImageSourcePropType = useMemo(() => resolveRemoteImageSource(user?.fotoUrl, DefaultAvatar), [user]);
  const doctorAvatarSource: ImageSourcePropType = useMemo(() => resolveRemoteImageSource(nextCita?.medico?.fotoUrl, DefaultAvatar), [nextCita?.medico?.fotoUrl]);

  return (
    <View style={styles.container}>
      <View style={styles.main}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.hamburgerBtn} onPress={toggleSidebar}>
            <MaterialIcons name="menu" size={26} color={colors.dark} />
          </TouchableOpacity>
          <View style={{ flex: 1 }} />
          <TouchableOpacity style={styles.notifBtn} onPress={() => setNotificationsOpen(true)}>
            <MaterialIcons name="notifications" size={22} color={colors.dark} />
            <View style={styles.notifDot} />
          </TouchableOpacity>
        </View>

        <View style={styles.topBar}>
          <View style={styles.liveTag}>
            <Animated.View style={{ opacity: signalPulse }}>
              <MaterialIcons name="sensors" size={17} color={colors.primary} />
            </Animated.View>
            <Text style={styles.liveTagText}>SALA DE ESPERA VIRTUAL</Text>
          </View>
          <View style={styles.connectedBadge}>
            <View style={[styles.connectedDot, { backgroundColor: connectionLabel.dot }]} />
            <Text style={[styles.connectedText, { color: connectionLabel.color }]}>{connectionLabel.text}</Text>
          </View>
        </View>

        <ScrollView contentContainerStyle={{ paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
          {upcomingCitas.length > 1 && (
            <View style={styles.selectorCard}>
              <Text style={styles.selectorTitle}>Selecciona la cita a videollamar</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.selectorList}>
                {upcomingCitas.map((cita) => {
                  const citaId = String(cita?.citaid || '').trim();
                  const active = citaId && citaId === selectedCitaId;
                  return (
                    <TouchableOpacity
                      key={citaId}
                      style={[styles.selectorItem, active && styles.selectorItemActive]}
                      onPress={() => setSelectedCitaId(citaId)}
                    >
                      <Image source={resolveRemoteImageSource(cita?.medico?.fotoUrl, DefaultAvatar)} style={styles.selectorAvatar} />
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.selectorDoctor, active && styles.selectorDoctorActive]} numberOfLines={1}>{cita?.medico?.nombreCompleto || 'Especialista'}</Text>
                        <Text style={[styles.selectorTime, active && styles.selectorTimeActive]} numberOfLines={1}>{formatDateTime(cita?.fechaHoraInicio)}</Text>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>
          )}

          <View style={[styles.contentWrap, !isDesktopLayout && styles.contentWrapMobile]}>
            <View style={styles.centerCol}>
              <View style={styles.cameraCard}>
                {cameraOn ? (
                  <Image source={userAvatarSource} style={styles.cameraImage} />
                ) : (
                  <View style={styles.cameraOffOverlay}>
                    <MaterialIcons name="videocam-off" size={36} color="#8aa7bf" />
                    <Text style={styles.cameraOffText}>Cámara desactivada</Text>
                  </View>
                )}
                <View style={styles.cameraTag}>
                  <View style={styles.cameraLiveDot} />
                  <Text style={styles.cameraTagText}>TU CÁMARA</Text>
                </View>
                <View style={styles.cameraControls}>
                  <TouchableOpacity style={[styles.cameraControl, !micOn && styles.cameraControlOff]} onPress={() => setMicOn(!micOn)}>
                    <MaterialIcons name={micOn ? 'mic' : 'mic-off'} size={20} color="#fff" />
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.cameraControl, !cameraOn && styles.cameraControlOff]} onPress={() => setCameraOn(!cameraOn)}>
                    <MaterialIcons name={cameraOn ? 'videocam' : 'videocam-off'} size={20} color="#fff" />
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.cameraControl} onPress={openSettings}>
                    <MaterialIcons name="tune" size={20} color="#fff" />
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.waitSection}>
                <Animated.View style={[styles.doctorAvatarWrap, { transform: [{ scale: avatarScale }] }]}>
                  <Image source={doctorAvatarSource} style={styles.doctorAvatar} />
                  <View style={styles.verifiedBadge}>
                    <MaterialIcons name="verified" size={14} color="#fff" />
                  </View>
                </Animated.View>
                <Text style={styles.waitTitle}>
                  {loadingCita ? 'Cargando...' : roomCanJoin ? '¡Es hora de tu consulta!' : `Esperando al ${doctorName}...`}
                </Text>
                <Text style={styles.waitSub}>
                  {roomCanJoin ? 'El doctor ya está en la sala.' : 'Relájate, te avisaremos cuando el médico inicie la sesión.'}
                </Text>
              </View>
            </View>

            <View style={[styles.rightCol, !isDesktopLayout && styles.rightColMobile]}>
              <View style={styles.summaryCard}>
                <Text style={styles.summaryTitle}>RESUMEN DE LA CITA</Text>
                <View style={styles.summaryRow}>
                  <MaterialIcons name="medical-services" size={16} color={colors.primary} />
                  <View>
                    <Text style={styles.summaryLabel}>Doctor</Text>
                    <Text style={styles.summaryValue}>{doctorName}</Text>
                  </View>
                </View>
                <View style={styles.summaryRow}>
                  <MaterialIcons name="schedule" size={16} color={colors.primary} />
                  <View>
                    <Text style={styles.summaryLabel}>Hora programada</Text>
                    <Text style={styles.summaryValue}>{citaHora}</Text>
                  </View>
                </View>
              </View>

              <TouchableOpacity
                style={[styles.joinBtn, (!nextCita || !roomCanJoin || openingRoom) && styles.disabledBtn, roomCanJoin && styles.joinBtnReady]}
                onPress={enterVideoRoom}
                disabled={!nextCita || !roomCanJoin || openingRoom}
              >
                <MaterialIcons name={roomCanJoin ? "video-call" : "lock-clock"} size={20} color="#fff" />
                <Text style={styles.joinBtnText}>{roomCanJoin ? 'Entrar a la consulta' : 'Esperando sala...'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </View>
    </View>
  );
};

const colors = {
  primary: '#137fec',
  bg: '#F6FAFD',
  dark: '#0A1931',
  blue: '#1A3D63',
  muted: '#4A7FA7',
  light: '#B3CFE5',
  white: '#FFFFFF',
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  main: { flex: 1 },
  header: { height: 60, backgroundColor: colors.white, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, borderBottomWidth: 1, borderBottomColor: '#eef2f7' },
  hamburgerBtn: { padding: 5 },
  notifBtn: { position: 'relative', padding: 5 },
  notifDot: { position: 'absolute', top: 5, right: 5, width: 8, height: 8, borderRadius: 4, backgroundColor: '#ef4444', borderWidth: 1.5, borderColor: colors.white },
  topBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 15 },
  liveTag: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(19,127,236,0.08)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  liveTagText: { fontSize: 11, fontWeight: '800', color: colors.primary, letterSpacing: 0.5 },
  connectedBadge: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  connectedDot: { width: 8, height: 8, borderRadius: 4 },
  connectedText: { fontSize: 11, fontWeight: '800' },
  selectorCard: { marginHorizontal: 20, marginBottom: 20, backgroundColor: '#fff', borderRadius: 18, padding: 15, borderWidth: 1, borderColor: '#eef2f7' },
  selectorTitle: { fontSize: 14, fontWeight: '800', color: colors.dark, marginBottom: 12 },
  selectorList: { gap: 10 },
  selectorItem: { width: 220, flexDirection: 'row', alignItems: 'center', gap: 10, padding: 10, borderRadius: 12, borderWidth: 1, borderColor: '#f1f5f9' },
  selectorItemActive: { borderColor: colors.primary, backgroundColor: 'rgba(19,127,236,0.04)' },
  selectorAvatar: { width: 36, height: 36, borderRadius: 18 },
  selectorDoctor: { fontSize: 13, fontWeight: '800', color: colors.dark },
  selectorDoctorActive: { color: colors.primary },
  selectorTime: { fontSize: 11, color: colors.muted, marginTop: 1 },
  selectorTimeActive: { color: colors.primary, opacity: 0.8 },
  contentWrap: { flexDirection: 'row', gap: 20, paddingHorizontal: 20 },
  contentWrapMobile: { flexDirection: 'column' },
  centerCol: { flex: 2, gap: 20 },
  cameraCard: { height: 300, backgroundColor: colors.dark, borderRadius: 24, overflow: 'hidden', position: 'relative' },
  cameraImage: { width: '100%', height: '100%', resizeMode: 'cover' },
  cameraOffOverlay: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10 },
  cameraOffText: { color: '#8aa7bf', fontSize: 14, fontWeight: '600' },
  cameraTag: { position: 'absolute', top: 15, left: 15, backgroundColor: 'rgba(0,0,0,0.5)', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8, flexDirection: 'row', alignItems: 'center', gap: 6 },
  cameraLiveDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#ef4444' },
  cameraTagText: { color: '#fff', fontSize: 10, fontWeight: '800' },
  cameraControls: { position: 'absolute', bottom: 15, left: 0, right: 0, flexDirection: 'row', justifyContent: 'center', gap: 12 },
  cameraControl: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' },
  cameraControlOff: { backgroundColor: '#ef4444' },
  waitSection: { alignItems: 'center', paddingVertical: 20 },
  doctorAvatarWrap: { position: 'relative', marginBottom: 15 },
  doctorAvatar: { width: 100, height: 100, borderRadius: 50, borderWidth: 4, borderColor: colors.white },
  verifiedBadge: { position: 'absolute', bottom: 0, right: 0, backgroundColor: colors.primary, width: 24, height: 24, borderRadius: 12, alignItems: 'center', justifyContent: 'center', borderWidth: 3, borderColor: colors.white },
  waitTitle: { fontSize: 20, fontWeight: '900', color: colors.dark, textAlign: 'center' },
  waitSub: { fontSize: 14, color: colors.muted, textAlign: 'center', marginTop: 8, maxWidth: 300, lineHeight: 20 },
  rightCol: { flex: 1, gap: 20 },
  rightColMobile: { flex: 0 },
  summaryCard: { backgroundColor: '#fff', borderRadius: 20, padding: 20, borderWidth: 1, borderColor: '#eef2f7' },
  summaryTitle: { fontSize: 12, fontWeight: '800', color: colors.muted, letterSpacing: 1, marginBottom: 15 },
  summaryRow: { flexDirection: 'row', gap: 12, marginBottom: 15 },
  summaryLabel: { fontSize: 11, color: colors.muted, fontWeight: '700' },
  summaryValue: { fontSize: 14, fontWeight: '800', color: colors.dark, marginTop: 2 },
  summaryValueGreen: { color: '#16a34a' },
  joinBtn: { height: 56, borderRadius: 16, backgroundColor: colors.muted, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10 },
  joinBtnReady: { backgroundColor: colors.primary },
  joinBtnText: { color: '#fff', fontSize: 15, fontWeight: '800' },
  disabledBtn: { opacity: 0.6 },
});

export default SalaEsperaVirtualPacienteScreen;
