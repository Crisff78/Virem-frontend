import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { sanitizeRemoteImageUrl, resolveRemoteImageSource } from './utils/imageSources';
import {
  Animated,
  Linking,
  Platform,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ScrollView,
  Switch,
  TextInput,
  useWindowDimensions,
} from 'react-native';
import type { ImageSourcePropType } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { useRoute } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { usePortalAwareNavigation } from './navigation/usePortalAwareNavigation';
import { usePacienteModule } from './navigation/PacienteModuleContext';
import VideoCallFrame from './components/VideoCallFrame';
import { useVideoCall } from './hooks/useVideoCall';

import { useLanguage } from './localization/LanguageContext';
import type { RootStackParamList } from './navigation/types';
import { apiUrl } from './config/backend';
import { useSocketEvent } from './hooks/useSocketEvent';
import { useSocketRoom } from './hooks/useSocketRoom';
import { useAuth } from './providers/AuthProvider';
import { getAuthToken } from './utils/session';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { ensurePatientSessionUser, getPatientDisplayName } from './utils/patientSession';

const ViremLogo = require('./assets/imagenes/descarga.png');
const DefaultAvatar = require('./assets/imagenes/avatar-default.jpg');

const DoctorAvatar: ImageSourcePropType = DefaultAvatar;
const STORAGE_KEY = 'user';
const LEGACY_USER_STORAGE_KEY = 'userProfile';
const AUTH_TOKEN_KEY = 'authToken';
const LEGACY_TOKEN_KEY = 'token';

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

  const { t, tx } = useLanguage();
  const navigation = usePortalAwareNavigation();
  const { isInsidePortal, setNotificationsOpen } = usePacienteModule();
  const route = useRoute<RouteProp<RootStackParamList, 'SalaEsperaVirtualPaciente'>>();
  const { signOut } = useAuth();
  const { width: viewportWidth } = useWindowDimensions();
  const [cameraOn, setCameraOn] = useState(true);
  const [micOn, setMicOn] = useState(true);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [blurBackground, setBlurBackground] = useState(false);
  const [noiseCancellation, setNoiseCancellation] = useState(true);
  const [deviceLoading, setDeviceLoading] = useState(false);
  const [deviceError, setDeviceError] = useState<string | null>(null);
  const [openSelect, setOpenSelect] = useState<'camera' | 'mic' | 'speaker' | null>(null);
  const [cameras, setCameras] = useState<DeviceOption[]>([]);
  const [microphones, setMicrophones] = useState<DeviceOption[]>([]);
  const [speakers, setSpeakers] = useState<DeviceOption[]>([]);
  const [selectedCameraId, setSelectedCameraId] = useState('');
  const [selectedMicId, setSelectedMicId] = useState('');
  const [selectedSpeakerId, setSelectedSpeakerId] = useState('');
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
  const { isInCall, roomInfo, startCall, endCall, error: callError, setError: setCallError } = useVideoCall();
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
            const cachedUserId = String((sessionUser as any)?.usuarioid || (sessionUser as any)?.id || '').trim();
            const profileUserId = String((profileUser as any)?.usuarioid || (profileUser as any)?.id || '').trim();
            if (cachedUserId && profileUserId && cachedUserId !== profileUserId) {
              sessionUser = null;
            }
            sessionUser = {
              ...(sessionUser || {}),
              ...profileUser,
              nombres: String((profileUser as any)?.nombres || '').trim(),
              apellidos: String((profileUser as any)?.apellidos || '').trim(),
              nombre: String((profileUser as any)?.nombres || (profileUser as any)?.nombre || '').trim(),
              apellido: String((profileUser as any)?.apellidos || (profileUser as any)?.apellido || '').trim(),
              fotoUrl: sanitizeRemoteImageUrl((profileUser as any)?.fotoUrl),
            };
          } else {
            const response = await fetch(apiUrl('/api/auth/me'), {
              method: 'GET',
              headers: { Authorization: `Bearer ${token}` },
            });
            const payload = await response.json().catch(() => null);
            if (response.ok && payload?.success && payload?.user) {
              const apiUser = payload.user as User;
              const cachedUserId = String((sessionUser as any)?.usuarioid || (sessionUser as any)?.id || '').trim();
              const apiUserId = String((apiUser as any)?.usuarioid || (apiUser as any)?.id || '').trim();
              if (cachedUserId && apiUserId && cachedUserId !== apiUserId) {
                sessionUser = null;
              }
              const apiRoleId = Number((apiUser as any)?.rolid ?? (apiUser as any)?.rolId ?? (apiUser as any)?.roleId);
              if (apiRoleId === 2) {
                sessionUser = null;
              } else {
                sessionUser = {
                  ...(sessionUser || {}),
                  ...apiUser,
                  fotoUrl: sanitizeRemoteImageUrl((apiUser as any)?.fotoUrl),
                };
              }
            }
          }

          if (sessionUser) {
            const rawNextUser = JSON.stringify(sessionUser);
            await AsyncStorage.setItem(STORAGE_KEY, rawNextUser);
            await AsyncStorage.setItem(LEGACY_USER_STORAGE_KEY, rawNextUser);

            if (Platform.OS === 'web') {
              localStorage.setItem(STORAGE_KEY, rawNextUser);
              localStorage.setItem(LEGACY_USER_STORAGE_KEY, rawNextUser);
            } else {
              await SecureStore.setItemAsync(LEGACY_USER_STORAGE_KEY, rawNextUser);
            }
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

  // Wait timer
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

  const formatWaitTime = useCallback((secs: number) => {
    const m = String(Math.floor(secs / 60)).padStart(2, '0');
    const s = String(secs % 60).padStart(2, '0');
    return `${m}:${s}`;
  }, []);

  const connectionLabel = useMemo(() => {
    if (loadingCita || loadingRoom) return { text: 'Conectando…', color: '#f59e0b', dot: '#f59e0b' };
    if (openingRoom) return { text: 'Conectando a sala…', color: '#f59e0b', dot: '#f59e0b' };
    return { text: 'CONECTADO', color: '#16a34a', dot: '#22c55e' };
  }, [loadingCita, loadingRoom, openingRoom]);

  const isLongWait = useMemo(() => nextCita && !roomCanJoin && waitSeconds >= WAIT_TIMEOUT_SECONDS, [nextCita, roomCanJoin, waitSeconds]);

  // Subtle fade-in when room becomes joinable
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
        if (!token) {
          setUpcomingCitas([]);
          setSelectedCitaId('');
          setNextCita(null);
          return;
        }

        const response = await fetch(apiUrl('/api/agenda/me/citas?scope=upcoming&limit=40'), {
          method: 'GET',
          headers: { Authorization: `Bearer ${token}` },
        });
        const payload = await response.json().catch(() => null);
        if (response.ok && payload?.success && Array.isArray(payload?.citas) && payload.citas.length) {
          const ordered = (payload.citas as CitaItem[])
            .filter((item) => String(item?.modalidad || '').toLowerCase() === 'virtual')
            .filter((item) =>
              ['pendiente', 'confirmada', 'reprogramada'].includes(
                String(item?.estadoCodigo || '').toLowerCase()
              )
            )
            .sort(
            (a, b) => parseDateMs(a?.fechaHoraInicio) - parseDateMs(b?.fechaHoraInicio)
            );
          setUpcomingCitas(ordered);

          const fromParam = requestedCitaId
            ? ordered.find((item) => String(item?.citaid || '').trim() === requestedCitaId)
            : null;
          const chosen = fromParam || ordered[0] || null;
          setSelectedCitaId(String(chosen?.citaid || ''));
          setNextCita(chosen);
        } else {
          setUpcomingCitas([]);
          setSelectedCitaId('');
          setNextCita(null);
        }
      } catch {
        setUpcomingCitas([]);
        setSelectedCitaId('');
        setNextCita(null);
      } finally {
        setLoadingCita(false);
      }
    };

    loadNextCita();
  }, [requestedCitaId]);

  useEffect(() => {
    if (!upcomingCitas.length) {
      setNextCita(null);
      return;
    }
    const selected =
      upcomingCitas.find((item) => String(item?.citaid || '').trim() === selectedCitaId) ||
      upcomingCitas[0];
    setNextCita(selected || null);
    const selectedId = String(selected?.citaid || '').trim();
    if (selectedId && selectedId !== selectedCitaId) {
      setSelectedCitaId(selectedId);
    }
  }, [selectedCitaId, upcomingCitas]);

  useEffect(() => {
    const loadVideoRoom = async () => {
      const citaId = String(selectedCitaId || '').trim();
      if (!citaId) {
        setRoomJoinUrl('');
        setRoomStatus('');
        setRoomCanJoin(false);
        return;
      }

      setLoadingRoom(true);
      try {
        const token = await getAuthToken();
        if (!token) {
          setRoomJoinUrl('');
          setRoomStatus('');
          setRoomCanJoin(false);
          return;
        }

        const response = await fetch(apiUrl(`/api/agenda/me/citas/${citaId}/video-sala`), {
          method: 'GET',
          headers: { Authorization: `Bearer ${token}` },
        });
        const payload = await response.json().catch(() => null);
        if (!response.ok || !payload?.success || !payload?.videoSala) {
          setRoomJoinUrl('');
          setRoomStatus('');
          setRoomCanJoin(false);
          return;
        }

        setRoomJoinUrl(String(payload.videoSala.joinUrl || '').trim());
        setRoomStatus(String(payload.videoSala.estado || '').trim().toLowerCase());
        setRoomCanJoin(Boolean(payload.videoSala.canJoin));
      } catch {
        setRoomJoinUrl('');
        setRoomStatus('');
        setRoomCanJoin(false);
      } finally {
        setLoadingRoom(false);
      }
    };

    loadVideoRoom();
  }, [selectedCitaId]);

  useSocketRoom('cita', selectedCitaId, Boolean(selectedCitaId));

  const enterVideoRoom = async () => {
    if (!nextCita?.citaid) return;
    setRoomError('');
    await startCall(nextCita.citaid, false);
  };

  useEffect(() => {
    if (callError) {
      setRoomError(callError);
    }
  }, [callError]);

  const openSettings = () => {
    setSettingsOpen(true);
    Animated.parallel([
      Animated.timing(panelTranslateX, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }),
      Animated.timing(overlayOpacity, {
        toValue: 1,
        duration: 220,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const closeSettings = () => {
    setOpenSelect(null);
    Animated.parallel([
      Animated.timing(panelTranslateX, {
        toValue: 430,
        duration: 230,
        useNativeDriver: true,
      }),
      Animated.timing(overlayOpacity, {
        toValue: 0,
        duration: 180,
        useNativeDriver: true,
      }),
    ]).start(({ finished }) => {
      if (finished) setSettingsOpen(false);
    });
  };

  const getSelectedLabel = (items: DeviceOption[], selectedId: string, fallback: string) => {
    return items.find((item) => item.id === selectedId)?.label || fallback;
  };

  const loadWebDevices = async () => {
    if (Platform.OS !== 'web') {
      const fallbackCams = [{ id: 'mobile-cam-1', label: 'Cámara del dispositivo' }];
      const fallbackMics = [{ id: 'mobile-mic-1', label: 'Micrófono del dispositivo' }];
      const fallbackSpeakers = [{ id: 'mobile-spk-1', label: 'Altavoz del dispositivo' }];
      setCameras(fallbackCams);
      setMicrophones(fallbackMics);
      setSpeakers(fallbackSpeakers);
      setSelectedCameraId((prev) => prev || fallbackCams[0].id);
      setSelectedMicId((prev) => prev || fallbackMics[0].id);
      setSelectedSpeakerId((prev) => prev || fallbackSpeakers[0].id);
      return;
    }

    setDeviceLoading(true);
    setDeviceError(null);
    let tempStream: MediaStream | null = null;

    try {
      const mediaDevices = (globalThis as any).navigator?.mediaDevices;
      if (!mediaDevices?.enumerateDevices) {
        throw new Error('Tu navegador no soporta enumeración de dispositivos.');
      }

      try {
        tempStream = await mediaDevices.getUserMedia({ audio: true, video: true });
      } catch {
        // Si el usuario bloquea permisos, igual intentamos listar (pueden venir sin labels).
      }

      const rawDevices = await mediaDevices.enumerateDevices();
      const camList: DeviceOption[] = rawDevices
        .filter((d: any) => d.kind === 'videoinput')
        .map((d: any, i: number) => ({
          id: d.deviceId || `cam-${i + 1}`,
          label: d.label || `Cámara ${i + 1}`,
        }));

      const micList: DeviceOption[] = rawDevices
        .filter((d: any) => d.kind === 'audioinput')
        .map((d: any, i: number) => ({
          id: d.deviceId || `mic-${i + 1}`,
          label: d.label || `Micrófono ${i + 1}`,
        }));

      const speakerList: DeviceOption[] = rawDevices
        .filter((d: any) => d.kind === 'audiooutput')
        .map((d: any, i: number) => ({
          id: d.deviceId || `spk-${i + 1}`,
          label: d.label || `Salida ${i + 1}`,
        }));

      if (!camList.length && !micList.length && !speakerList.length) {
        setDeviceError('No se detectaron dispositivos. Revisa permisos del navegador.');
      }

      setCameras(camList);
      setMicrophones(micList);
      setSpeakers(speakerList);
      setSelectedCameraId((prev) => prev || camList[0]?.id || '');
      setSelectedMicId((prev) => prev || micList[0]?.id || '');
      setSelectedSpeakerId((prev) => prev || speakerList[0]?.id || '');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'No se pudieron cargar los dispositivos.';
      setDeviceError(message);
    } finally {
      if (tempStream) {
        tempStream.getTracks().forEach((track) => track.stop());
      }
      setDeviceLoading(false);
    }
  };

  useEffect(() => {
    if (settingsOpen) {
      loadWebDevices();
    }
  }, [settingsOpen]);

  const doctorName =
    String(nextCita?.medico?.nombreCompleto || '').trim() || 'Tu especialista';
  const doctorSpec =
    String(nextCita?.medico?.especialidad || '').trim() || 'Medicina General';
  const citaHora = formatDateTime(nextCita?.fechaHoraInicio);
  const fullName = useMemo(() => getPatientDisplayName(user, 'Paciente'), [user]);
  const planLabel = useMemo(() => {
    const plan = String(user?.plan || '').trim();
    return plan ? `Paciente ${plan}` : 'Paciente';
  }, [user]);
  const userAvatarSource: ImageSourcePropType = useMemo(() => {
    return resolveRemoteImageSource(user?.fotoUrl, DefaultAvatar);
  }, [user]);
  const hasProfilePhoto = useMemo(() => Boolean(sanitizeRemoteImageUrl(user?.fotoUrl)), [user?.fotoUrl]);
  const doctorAvatarSource: ImageSourcePropType = useMemo(() => {
    const foto = sanitizeRemoteImageUrl(nextCita?.medico?.fotoUrl);
    if (foto) return { uri: foto };
    return DoctorAvatar;
  }, [nextCita?.medico?.fotoUrl]);

  const handleLogout = async () => {
    await signOut();
    navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
  };

  if (isInCall && roomInfo) {
    return (
      <View style={styles.fullScreenCall}>
        <VideoCallFrame
          roomName={roomInfo.roomName}
          displayName={fullName}
          onHangup={endCall}
          jwtToken={roomInfo.jwtToken}
          jitsiDomain={roomInfo.jitsiDomain}
        />
      </View>
    );
  }

  return (
    <View style={[styles.container, isInsidePortal ? null : (!isDesktopLayout && styles.containerMobile)]}>
      {!isInsidePortal && (
      <View style={[styles.sidebar, !isDesktopLayout && styles.sidebarMobile]}>
        <View>
          <View style={styles.logoBox}>
            <Image source={ViremLogo} style={styles.logo} />
            <View>
              <Text style={styles.logoTitle}>VIREM</Text>
              <Text style={styles.logoSubtitle}>Portal Paciente</Text>
            </View>
          </View>

          <View style={styles.userBox}>
            <Image source={userAvatarSource} style={styles.userAvatar} />
            <Text style={styles.userName}>{fullName}</Text>
            <Text style={styles.userPlan}>{planLabel}</Text>
            {!hasProfilePhoto ? (
              <Text style={styles.hintText}>No tienes foto. Ve a Perfil para agregarla.</Text>
            ) : null}
          </View>

          <View style={[styles.menu, !isDesktopLayout && styles.menuMobile]}>
            <TouchableOpacity style={styles.menuItem} onPress={() => navigation.navigate('DashboardPaciente')}>
              <MaterialIcons name="grid-view" size={20} color={colors.muted} />
              <Text style={styles.menuText}>{t('menu.home')}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => navigation.navigate('NuevaConsultaPaciente')}
            >
              <MaterialIcons name="person-search" size={20} color={colors.muted} />
              <Text style={styles.menuText}>{t('menu.searchDoctor')}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => navigation.navigate('PacienteCitas')}
            >
              <MaterialIcons name="calendar-today" size={20} color={colors.muted} />
              <Text style={styles.menuText}>{t('menu.appointments')}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.menuItem, styles.menuItemActive]}
              onPress={() => navigation.navigate('SalaEsperaVirtualPaciente')}
            >
              <MaterialIcons name="videocam" size={20} color={colors.primary} />
              <Text style={[styles.menuText, styles.menuTextActive]}>{t('menu.videocall')}</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.menuItem} onPress={() => navigation.navigate('PacienteChat')}>
              <MaterialIcons name="chat-bubble" size={20} color={colors.muted} />
              <Text style={styles.menuText}>{t('menu.chat')}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => navigation.navigate('PacienteRecetasDocumentos')}
            >
              <MaterialIcons name="description" size={20} color={colors.muted} />
              <Text style={styles.menuText}>{t('menu.recipesDocs')}</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.menuItem} onPress={() => navigation.navigate('PacientePerfil')}>
              <MaterialIcons name="account-circle" size={20} color={colors.muted} />
              <Text style={styles.menuText}>{t('menu.profile')}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => navigation.navigate('PacienteConfiguracion')}
            >
              <MaterialIcons name="settings" size={20} color={colors.muted} />
              <Text style={styles.menuText}>{t('menu.settings')}</Text>
            </TouchableOpacity>
          </View>
        </View>

        <TouchableOpacity style={styles.exitBtn} onPress={handleLogout}>
          <MaterialIcons name="logout" size={20} color="#fff" />
          <Text style={styles.exitBtnText}>{t('menu.logout')}</Text>
        </TouchableOpacity>
      </View>
      )}

      <View style={styles.main}>
        <View style={styles.header}>
          <View style={styles.searchBox}>
            <MaterialIcons name="search" size={20} color={colors.muted} />
            <TextInput
              placeholder="Busca un medico para consulta online"
              placeholderTextColor="#8aa7bf"
              style={styles.searchInput}
            />
          </View>

          <TouchableOpacity
            style={styles.notifBtn}
            onPress={() => setNotificationsOpen(true)}
          >
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

        {upcomingCitas.length > 1 ? (
          <View style={styles.selectorCard}>
            <Text style={styles.selectorTitle}>Selecciona la cita a videollamar</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.selectorList}>
              {upcomingCitas.map((cita) => {
                const citaId = String(cita?.citaid || '').trim();
                const active = citaId && citaId === selectedCitaId;
                return (
                  <TouchableOpacity
                    key={citaId || `cita-${formatDateTime(cita?.fechaHoraInicio || null)}`}
                    style={[styles.selectorItem, active && styles.selectorItemActive]}
                    onPress={() => setSelectedCitaId(citaId)}
                  >
                    <Image source={resolveRemoteImageSource(cita?.medico?.fotoUrl, DefaultAvatar)} style={styles.selectorAvatar} />
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.selectorDoctor, active && styles.selectorDoctorActive]} numberOfLines={1}>
                        {String(cita?.medico?.nombreCompleto || 'Especialista').trim() || 'Especialista'}
                      </Text>
                      <Text style={[styles.selectorTime, active && styles.selectorTimeActive]} numberOfLines={1}>
                        {formatDateTime(cita?.fechaHoraInicio || null)}
                      </Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        ) : null}

        <View style={[styles.contentWrap, !isDesktopLayout && styles.contentWrapMobile]}>
          {/* Left: camera preview + waiting */}
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
                <TouchableOpacity style={[styles.cameraControl, !micOn && styles.cameraControlOff]} onPress={() => setMicOn((v) => !v)} activeOpacity={0.8}>
                  <MaterialIcons name={micOn ? 'mic' : 'mic-off'} size={20} color="#fff" />
                </TouchableOpacity>
                <TouchableOpacity style={[styles.cameraControl, !cameraOn && styles.cameraControlOff]} onPress={() => setCameraOn((v) => !v)} activeOpacity={0.8}>
                  <MaterialIcons name={cameraOn ? 'videocam' : 'videocam-off'} size={20} color="#fff" />
                </TouchableOpacity>
                <TouchableOpacity style={styles.cameraControl} onPress={openSettings} activeOpacity={0.8}>
                  <MaterialIcons name="tune" size={20} color="#fff" />
                </TouchableOpacity>
              </View>
            </View>

            {/* Waiting state */}
            <View style={styles.waitSection}>
              <Animated.View style={[styles.doctorAvatarWrap, { transform: [{ scale: avatarScale }] }]}>
                <Image source={doctorAvatarSource} style={styles.doctorAvatar} />
                <View style={styles.verifiedBadge}>
                  <MaterialIcons name="verified" size={14} color="#fff" />
                </View>
              </Animated.View>
              <Text style={styles.waitTitle}>
                {loadingCita ? 'Cargando tu cita...' : nextCita ? (
                  roomCanJoin ? '¡Es hora de tu consulta!' : (
                    new Date(nextCita.fechaHoraInicio || 0).getTime() > Date.now() + 2 * 60 * 1000
                    ? 'Aún no es la hora de tu cita'
                    : isLongWait ? 'El médico aún no se ha conectado' : `Esperando al ${doctorName}…`
                  )
                ) : 'Sin citas de videollamada'}
              </Text>

              {nextCita && !roomCanJoin && new Date(nextCita.fechaHoraInicio || 0).getTime() > Date.now() && (
                 <Text style={styles.waitSub}>
                   Faltan unos minutos para iniciar. Relájate, te avisaremos cuando sea el momento.
                 </Text>
              )}

              {nextCita && !roomCanJoin && !isLongWait && new Date(nextCita.fechaHoraInicio || 0).getTime() <= Date.now() && (
                <Text style={styles.waitSub}>
                  {loadingCita ? 'Sincronizando...' : 'Conectando con el consultorio...'}
                </Text>
              )}

              {isLongWait && (
                <View style={styles.timeoutCard}>
                  <Text style={styles.timeoutMsg}>Parece que hay un retraso. Puedes esperar un poco más o contactar a soporte.</Text>
                  <View style={styles.timeoutActions}>
                    <TouchableOpacity style={styles.timeoutBtnPrimary} onPress={() => navigation.navigate('PacienteCitas')} activeOpacity={0.8}>
                      <MaterialIcons name="event" size={14} color="#fff" />
                      <Text style={styles.timeoutBtnPrimaryText}>Reprogramar</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            </View>
          </View>

          {/* Right: summary + actions */}
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
                <MaterialCommunityIcons name="heart-pulse" size={16} color={colors.primary} />
                <View>
                  <Text style={styles.summaryLabel}>Especialidad</Text>
                  <Text style={styles.summaryValue}>{doctorSpec}</Text>
                </View>
              </View>
              <View style={[styles.summaryRow, styles.summaryRowLast]}>
                <MaterialIcons name="schedule" size={16} color={colors.primary} />
                <View>
                  <Text style={styles.summaryLabel}>Hora programada</Text>
                  <Text style={styles.summaryValue}>{citaHora}</Text>
                </View>
              </View>
              <View style={[styles.summaryRow, styles.summaryRowLast]}>
                <MaterialIcons name="meeting-room" size={16} color={colors.primary} />
                <View>
                  <Text style={styles.summaryLabel}>Estado de sala</Text>
                  <Text style={[styles.summaryValue, roomCanJoin && styles.summaryValueGreen]}>
                    {loadingRoom ? 'Sincronizando...' : roomCanJoin ? '● Lista para entrar' : (
                      new Date(nextCita?.fechaHoraInicio || 0).getTime() > Date.now() + 2 * 60 * 1000 
                      ? 'No disponible aún' 
                      : roomStatus || 'pendiente'
                    )}
                  </Text>
                </View>
              </View>
            </View>

            {/* Inline error */}
            {roomError ? (
              <View style={styles.errorBar}>
                <MaterialIcons name="error-outline" size={16} color="#dc2626" />
                <Text style={styles.errorText}>{roomError}</Text>
                <TouchableOpacity style={styles.errorRetryBtn} onPress={() => { setRoomError(''); enterVideoRoom(); }} activeOpacity={0.8}>
                  <Text style={styles.errorRetryText}>Reintentar</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => setRoomError('')}><MaterialIcons name="close" size={14} color="#dc2626" /></TouchableOpacity>
              </View>
            ) : null}

            {/* Primary CTA */}
            <TouchableOpacity
              style={[styles.joinBtn, (!nextCita || !roomCanJoin || openingRoom) && styles.disabledBtn, roomCanJoin && styles.joinBtnReady]}
              onPress={enterVideoRoom}
              disabled={!nextCita || !roomCanJoin || openingRoom}
              activeOpacity={0.8}
            >
              {openingRoom ? (
                <Animated.View style={{ opacity: signalPulse }}>
                  <MaterialIcons name="sync" size={20} color="#fff" />
                </Animated.View>
              ) : (
                <MaterialIcons name={roomCanJoin ? "video-call" : "lock-clock"} size={20} color="#fff" />
              )}
              <Text style={styles.joinBtnText}>
                {openingRoom ? 'Conectando…' : roomCanJoin ? 'Entrar a la consulta' : 'Aún no es la hora'}
              </Text>
            </TouchableOpacity>

            {/* Subtle room-ready hint */}
            {roomCanJoin && (
              <Animated.View style={[styles.roomReadyHint, { opacity: roomReadyPulse }]}>
                <View style={styles.roomReadyDot} />
                <Text style={styles.roomReadyText}>Sala lista · Puedes entrar ahora</Text>
              </Animated.View>
            )}

            {/* Sound ready placeholder */}
            {roomCanJoin && (
              <View style={styles.soundReadyRow}>
                <MaterialIcons name="volume-up" size={14} color={colors.muted} />
                <Text style={styles.soundReadyText}>Sonido de notificación activado</Text>
              </View>
            )}

            <View style={styles.secondaryActions}>
              <TouchableOpacity style={styles.settingsBtn} onPress={openSettings} activeOpacity={0.8}>
                <MaterialIcons name="tune" size={15} color={colors.primary} />
                <Text style={styles.settingsBtnText}>Ajustes</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.leaveBtn} onPress={() => navigation.navigate('DashboardPaciente')} activeOpacity={0.8}>
                <MaterialIcons name="call-end" size={15} color="#ef4444" />
                <Text style={styles.leaveBtnText}>Salir</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        <View style={styles.footer}>
          <MaterialIcons name="lock" size={12} color={colors.muted} />
          <Text style={styles.footerText}>Sesión Privada y Encriptada</Text>
          <Text style={styles.footerText}>·</Text>
          <Text style={styles.footerText}>Soporte: 0-800-VIREM</Text>
        </View>
      </View>

      {settingsOpen ? (
        <View style={styles.settingsLayer}>
          <Animated.View style={[styles.settingsOverlay, { opacity: overlayOpacity }]}>
            <TouchableOpacity style={StyleSheet.absoluteFillObject} onPress={closeSettings} />
          </Animated.View>

          <Animated.View style={[styles.settingsPanel, { transform: [{ translateX: panelTranslateX }] }]}>
            <View style={styles.settingsHeader}>
              <View style={styles.settingsHeadLeft}>
                <View style={styles.settingsHeadIcon}>
                  <MaterialIcons name="tune" size={18} color={colors.primary} />
                </View>
                <View>
                  <Text style={styles.settingsTitle}>Ajustes de Videollamada</Text>
                  <Text style={styles.settingsSubtitle}>
                    {tx({
                      es: 'Configura tus dispositivos antes de entrar',
                      en: 'Set up your devices before entering',
                      pt: 'Configure seus dispositivos antes de entrar',
                    })}
                  </Text>
                </View>
              </View>

              <TouchableOpacity style={styles.settingsCloseBtn} onPress={closeSettings}>
                <MaterialIcons name="close" size={20} color={colors.muted} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.settingsBody} contentContainerStyle={{ paddingBottom: 20 }}>
              <View style={styles.settingsPreviewBox}>
                <Image source={userAvatarSource} style={styles.settingsPreviewImage} />
                <View style={styles.audioOkTag}>
                  <View style={styles.audioBars}>
                    <View style={styles.audioBar} />
                    <View style={[styles.audioBar, { height: 11 }]} />
                    <View style={[styles.audioBar, { height: 9 }]} />
                  </View>
                  <Text style={styles.audioOkText}>AUDIO OK</Text>
                </View>
              </View>
              <Text style={styles.settingsPreviewCaption}>Previsualización de cámara e iluminación</Text>

              <View style={styles.settingBlock}>
                <Text style={styles.settingLabel}>CÁMARA</Text>
                <TouchableOpacity style={styles.selectLike} onPress={() => setOpenSelect((prev) => (prev === 'camera' ? null : 'camera'))}>
                  <Text style={styles.selectLikeText}>
                    {getSelectedLabel(cameras, selectedCameraId, 'Sin cámara detectada')}
                  </Text>
                  <MaterialIcons name="keyboard-arrow-down" size={18} color={colors.muted} />
                </TouchableOpacity>
                {openSelect === 'camera' ? (
                  <View style={styles.selectMenu}>
                    {cameras.length ? (
                      cameras.map((camera) => (
                        <TouchableOpacity
                          key={camera.id}
                          style={[styles.selectOption, selectedCameraId === camera.id && styles.selectOptionActive]}
                          onPress={() => {
                            setSelectedCameraId(camera.id);
                            setOpenSelect(null);
                          }}
                        >
                          <Text
                            style={[
                              styles.selectOptionText,
                              selectedCameraId === camera.id && styles.selectOptionTextActive,
                            ]}
                          >
                            {camera.label}
                          </Text>
                        </TouchableOpacity>
                      ))
                    ) : (
                      <Text style={styles.selectEmpty}>No hay cámaras disponibles</Text>
                    )}
                  </View>
                ) : null}
              </View>

              <View style={styles.settingBlock}>
                <Text style={styles.settingLabel}>MICRÓFONO</Text>
                <TouchableOpacity style={styles.selectLike} onPress={() => setOpenSelect((prev) => (prev === 'mic' ? null : 'mic'))}>
                  <Text style={styles.selectLikeText}>
                    {getSelectedLabel(microphones, selectedMicId, 'Sin micrófono detectado')}
                  </Text>
                  <MaterialIcons name="keyboard-arrow-down" size={18} color={colors.muted} />
                </TouchableOpacity>
                {openSelect === 'mic' ? (
                  <View style={styles.selectMenu}>
                    {microphones.length ? (
                      microphones.map((mic) => (
                        <TouchableOpacity
                          key={mic.id}
                          style={[styles.selectOption, selectedMicId === mic.id && styles.selectOptionActive]}
                          onPress={() => {
                            setSelectedMicId(mic.id);
                            setOpenSelect(null);
                          }}
                        >
                          <Text
                            style={[
                              styles.selectOptionText,
                              selectedMicId === mic.id && styles.selectOptionTextActive,
                            ]}
                          >
                            {mic.label}
                          </Text>
                        </TouchableOpacity>
                      ))
                    ) : (
                      <Text style={styles.selectEmpty}>No hay micrófonos disponibles</Text>
                    )}
                  </View>
                ) : null}
              </View>

              <View style={styles.settingBlock}>
                <Text style={styles.settingLabel}>SALIDA DE AUDIO</Text>
                <TouchableOpacity style={styles.selectLike} onPress={() => setOpenSelect((prev) => (prev === 'speaker' ? null : 'speaker'))}>
                  <Text style={styles.selectLikeText}>
                    {getSelectedLabel(speakers, selectedSpeakerId, 'Sin salida detectada')}
                  </Text>
                  <MaterialIcons name="keyboard-arrow-down" size={18} color={colors.muted} />
                </TouchableOpacity>
                {openSelect === 'speaker' ? (
                  <View style={styles.selectMenu}>
                    {speakers.length ? (
                      speakers.map((speaker) => (
                        <TouchableOpacity
                          key={speaker.id}
                          style={[styles.selectOption, selectedSpeakerId === speaker.id && styles.selectOptionActive]}
                          onPress={() => {
                            setSelectedSpeakerId(speaker.id);
                            setOpenSelect(null);
                          }}
                        >
                          <Text
                            style={[
                              styles.selectOptionText,
                              selectedSpeakerId === speaker.id && styles.selectOptionTextActive,
                            ]}
                          >
                            {speaker.label}
                          </Text>
                        </TouchableOpacity>
                      ))
                    ) : (
                      <Text style={styles.selectEmpty}>No hay salidas de audio disponibles</Text>
                    )}
                  </View>
                ) : null}
              </View>

              {deviceLoading ? <Text style={styles.deviceInfo}>Detectando dispositivos...</Text> : null}
              {deviceError ? <Text style={styles.deviceError}>{deviceError}</Text> : null}

              <View style={styles.toggleCard}>
                <View style={styles.toggleLeft}>
                  <MaterialIcons name="blur-on" size={18} color={colors.muted} />
                  <View>
                    <Text style={styles.toggleTitle}>Desenfoque de fondo</Text>
                    <Text style={styles.toggleSubtitle}>Oculta tu entorno</Text>
                  </View>
                </View>
                <Switch
                  value={blurBackground}
                  onValueChange={setBlurBackground}
                  trackColor={{ false: '#d1d5db', true: '#93c5fd' }}
                  thumbColor={blurBackground ? colors.primary : '#f8fafc'}
                />
              </View>

              <View style={styles.toggleCard}>
                <View style={styles.toggleLeft}>
                  <MaterialIcons name="surround-sound" size={18} color={colors.muted} />
                  <View>
                    <Text style={styles.toggleTitle}>Cancelación de ruido</Text>
                    <Text style={styles.toggleSubtitle}>Mejora la calidad de voz</Text>
                  </View>
                </View>
                <Switch
                  value={noiseCancellation}
                  onValueChange={setNoiseCancellation}
                  trackColor={{ false: '#d1d5db', true: '#93c5fd' }}
                  thumbColor={noiseCancellation ? colors.primary : '#f8fafc'}
                />
              </View>
            </ScrollView>

            <View style={styles.settingsFooter}>
              <TouchableOpacity style={styles.applyBtn} onPress={closeSettings}>
                <MaterialIcons name="check-circle" size={18} color="#fff" />
                <Text style={styles.applyBtnText}>Listo, aplicar cambios</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </View>
      ) : null}
    </View>
  );
};

const colors = {
  bg: '#F6FAFD',
  dark: '#0A1931',
  primary: '#137fec',
  blue: '#1A3D63',
  muted: '#4A7FA7',
  light: '#B3CFE5',
  white: '#FFFFFF',
};

const styles = StyleSheet.create({
  fullScreenCall: {
    flex: 1,
    backgroundColor: '#000',
  },
  container: {
    flex: 1,
    flexDirection: Platform.OS === 'web' ? 'row' : 'column',
    backgroundColor: colors.bg,
  },
  containerMobile: {
    flexDirection: 'column',
  },
  sidebar: {
    width: Platform.OS === 'web' ? 280 : '100%',
    backgroundColor: colors.white,
    borderRightWidth: Platform.OS === 'web' ? 1 : 0,
    borderBottomWidth: Platform.OS === 'web' ? 0 : 1,
    borderRightColor: '#eef2f7',
    borderBottomColor: '#eef2f7',
    padding: Platform.OS === 'web' ? 20 : 14,
    justifyContent: 'space-between',
  },
  sidebarMobile: {
    width: '100%',
    borderRightWidth: 0,
    borderBottomWidth: 1,
    padding: 14,
  },
  logoBox: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  logo: { width: 44, height: 44, resizeMode: 'contain' },
  logoTitle: { fontSize: 20, fontWeight: '800', color: colors.dark, letterSpacing: 0.5 },
  logoSubtitle: { fontSize: 11, fontWeight: '700', color: colors.muted },
  userBox: {
    marginTop: 18,
    alignItems: 'center',
    paddingVertical: 12,
  },
  userAvatar: {
    width: 76,
    height: 76,
    borderRadius: 76,
    borderWidth: 4,
    borderColor: '#f5f7fb',
    marginBottom: 10,
  },
  userName: {
    color: colors.dark,
    fontSize: 14,
    fontWeight: '800',
    textAlign: 'center',
  },
  userPlan: {
    color: colors.muted,
    fontSize: 11,
    fontWeight: '700',
    marginTop: 2,
    textAlign: 'center',
  },
  hintText: { marginTop: 6, color: colors.muted, fontSize: 11, fontWeight: '700', textAlign: 'center' },
  menu: {
    marginTop: 10,
    gap: 6,
    flex: Platform.OS === 'web' ? 1 : 0,
    flexDirection: Platform.OS === 'web' ? 'column' : 'row',
    flexWrap: 'wrap',
  },
  menuMobile: {
    flex: 0,
    flexDirection: 'row',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderRadius: 12,
    minWidth: Platform.OS === 'web' ? 0 : 150,
  },
  menuItemActive: {
    backgroundColor: 'rgba(19,127,236,0.10)',
    borderRightWidth: 3,
    borderRightColor: colors.primary,
  },
  menuText: { fontSize: 14, fontWeight: '700', color: colors.muted },
  menuTextActive: { color: colors.primary },
  exitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: 12,
    backgroundColor: colors.blue,
    paddingVertical: 12,
  },
  exitBtnText: { color: '#fff', fontWeight: '800' },
  main: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 14,
    flexWrap: 'wrap',
    paddingHorizontal: Platform.OS === 'web' ? 26 : 14,
    paddingTop: Platform.OS === 'web' ? 18 : 12,
  },
  searchBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#fff',
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 10,
    shadowColor: colors.dark,
    shadowOpacity: 0.06,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  searchInput: { flex: 1, color: colors.dark, fontWeight: '600' },
  notifBtn: {
    width: 46,
    height: 46,
    borderRadius: 14,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.dark,
    shadowOpacity: 0.06,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  notifDot: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 10,
    height: 10,
    borderRadius: 10,
    backgroundColor: '#ef4444',
    borderWidth: 2,
    borderColor: '#fff',
  },
  topBar: {
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e7eff7',
    paddingHorizontal: 22,
    paddingVertical: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  liveTag: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  liveTagText: { fontSize: 14, fontWeight: '900', color: colors.muted, letterSpacing: 0.8 },
  connectedBadge: {
    backgroundColor: '#dcfce7',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  connectedDot: { width: 8, height: 8, borderRadius: 8, backgroundColor: '#22c55e' },
  connectedText: { color: '#16a34a', fontWeight: '800', fontSize: 11 },
  selectorCard: {
    marginHorizontal: 20,
    marginTop: 14,
    marginBottom: 8,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#deebf7',
    borderRadius: 14,
    padding: 12,
  },
  selectorTitle: {
    color: colors.dark,
    fontWeight: '800',
    marginBottom: 10,
  },
  selectorList: {
    gap: 8,
    paddingRight: 6,
  },
  selectorItem: {
    width: 260,
    borderWidth: 1,
    borderColor: '#d6e7f7',
    borderRadius: 12,
    backgroundColor: '#f7fbff',
    padding: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  selectorItemActive: {
    backgroundColor: 'rgba(19,127,236,0.10)',
    borderColor: colors.primary,
  },
  selectorAvatar: {
    width: 40,
    height: 40,
    borderRadius: 40,
    borderWidth: 2,
    borderColor: '#f1f6fb',
  },
  selectorDoctor: {
    color: colors.dark,
    fontWeight: '800',
    fontSize: 13,
  },
  selectorDoctorActive: {
    color: colors.primary,
  },
  selectorTime: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: '700',
    marginTop: 2,
  },
  selectorTimeActive: {
    color: colors.blue,
  },
  contentWrap: {
    flex: 1,
    flexDirection: Platform.OS === 'web' ? 'row' : 'column',
    gap: 18,
    paddingHorizontal: Platform.OS === 'web' ? 22 : 14,
    paddingTop: 16,
    paddingBottom: 10,
  },
  contentWrapMobile: { flexDirection: 'column', paddingHorizontal: 14 },
  centerCol: { flex: 1.4, gap: 16 },
  cameraCard: {
    backgroundColor: '#0f1a2e',
    borderRadius: 18,
    overflow: 'hidden',
    position: 'relative',
    minHeight: 220,
  },
  cameraImage: { width: '100%', height: 220 },
  cameraOffOverlay: {
    width: '100%',
    height: 220,
    backgroundColor: '#0f1a2e',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  cameraOffText: { color: '#8aa7bf', fontSize: 12, fontWeight: '700' },
  cameraTag: {
    position: 'absolute',
    top: 10,
    left: 10,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.55)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  cameraLiveDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#22c55e' },
  cameraTagText: { color: '#fff', fontSize: 9, fontWeight: '800', letterSpacing: 0.5 },
  cameraControls: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 12,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 10,
  },
  cameraControl: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.22)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cameraControlOff: { backgroundColor: 'rgba(239,68,68,0.7)' },
  waitSection: { alignItems: 'center', paddingVertical: 10 },
  doctorAvatarWrap: {
    width: 72,
    height: 72,
    borderRadius: 72,
    borderWidth: 3,
    borderColor: '#d8e8f7',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    position: 'relative',
  },
  doctorAvatar: { width: 62, height: 62, borderRadius: 62 },
  verifiedBadge: {
    position: 'absolute',
    right: -2,
    bottom: -2,
    width: 22,
    height: 22,
    borderRadius: 22,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.bg,
  },
  waitTitle: {
    color: '#1F4770',
    fontSize: 18,
    fontWeight: '900',
    textAlign: 'center',
    maxWidth: 340,
  },
  waitDotsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    marginTop: 4,
    marginBottom: 2,
  },
  waitDot: { color: colors.primary, fontSize: 16, fontWeight: '900', lineHeight: 18 },
  waitSub: { color: colors.muted, fontSize: 13, fontWeight: '600', fontStyle: 'italic', textAlign: 'center' },
  waitTimerBox: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 10, backgroundColor: '#f0f6ff', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6, borderWidth: 1, borderColor: '#e4edf7' },
  waitTimerBoxWarn: { backgroundColor: '#fffbeb', borderColor: '#fde68a' },
  waitTimerText: { color: colors.muted, fontSize: 12, fontWeight: '800', fontVariant: ['tabular-nums'] },
  waitTimerTextWarn: { color: '#b45309' },
  timeoutCard: { marginTop: 14, backgroundColor: '#fffbeb', borderWidth: 1, borderColor: '#fde68a', borderRadius: 14, padding: 14, alignItems: 'center', gap: 10 },
  timeoutMsg: { color: '#92400e', fontSize: 12, fontWeight: '700', textAlign: 'center', lineHeight: 18 },
  timeoutActions: { flexDirection: 'row', gap: 8 },
  timeoutBtnPrimary: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: '#1F4770', borderRadius: 10, paddingVertical: 8, paddingHorizontal: 14 },
  timeoutBtnPrimaryText: { color: '#fff', fontWeight: '800', fontSize: 12 },
  timeoutBtnSecondary: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: '#fff', borderWidth: 1, borderColor: '#e4edf7', borderRadius: 10, paddingVertical: 8, paddingHorizontal: 14 },
  timeoutBtnSecondaryText: { color: colors.primary, fontWeight: '800', fontSize: 12 },
  rightCol: { width: 340, gap: 12 },
  rightColMobile: { width: '100%' },
  summaryCard: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e4edf7',
    borderRadius: 18,
    padding: 16,
    shadowColor: colors.dark,
    shadowOpacity: 0.04,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 1,
  },
  summaryTitle: { fontSize: 11, fontWeight: '900', letterSpacing: 1, color: colors.muted, marginBottom: 12, textTransform: 'uppercase' },
  summaryRow: { flexDirection: 'row', gap: 10, marginBottom: 12, alignItems: 'flex-start' },
  summaryRowLast: { marginBottom: 0, paddingTop: 10, borderTopWidth: 1, borderTopColor: '#f1f5f9' },
  summaryLabel: { color: colors.muted, fontSize: 11, fontWeight: '600' },
  summaryValue: { color: colors.dark, fontSize: 14, fontWeight: '800', marginTop: 1 },
  summaryValueGreen: { color: '#16a34a' },
  roomReadyHint: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 4 },
  roomReadyDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: '#22c55e' },
  roomReadyText: { color: '#16a34a', fontSize: 11, fontWeight: '700' },
  errorBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#fef2f2',
    borderWidth: 1,
    borderColor: '#fecaca',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  errorText: { flex: 1, color: '#991b1b', fontSize: 12, fontWeight: '700', lineHeight: 17 },
  errorRetryBtn: { backgroundColor: '#dc2626', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 5 },
  errorRetryText: { color: '#fff', fontSize: 11, fontWeight: '800' },
  joinBtn: {
    borderRadius: 14,
    paddingVertical: 15,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
    backgroundColor: '#1F4770',
    shadowColor: '#1F4770',
    shadowOpacity: 0.35,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 5 },
    elevation: 4,
  },
  joinBtnReady: { backgroundColor: '#1F4770', shadowOpacity: 0.5, shadowRadius: 14, borderWidth: 2, borderColor: '#22c55e' },
  joinBtnText: { color: '#fff', fontWeight: '900', fontSize: 15 },
  disabledBtn: { opacity: 0.5, shadowOpacity: 0 },
  soundReadyRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5 },
  soundReadyText: { color: colors.muted, fontSize: 11, fontWeight: '600', fontStyle: 'italic' },
  secondaryActions: { flexDirection: 'row', gap: 10 },
  settingsBtn: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#e4edf7',
    borderRadius: 12,
    paddingVertical: 10,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    gap: 6,
    backgroundColor: '#fff',
  },
  settingsBtnText: { color: colors.primary, fontWeight: '800', fontSize: 12 },
  leaveBtn: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#fecaca',
    borderRadius: 12,
    paddingVertical: 10,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    gap: 6,
    backgroundColor: '#fef2f2',
  },
  leaveBtnText: { color: '#ef4444', fontWeight: '800', fontSize: 12 },
  footer: {
    height: 40,
    borderTopWidth: 1,
    borderTopColor: '#e7eff7',
    backgroundColor: '#f2f8ff',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
  },
  footerText: { color: colors.muted, fontSize: 11, fontWeight: '700' },
  settingsLayer: {
    ...StyleSheet.absoluteFillObject,
    flexDirection: 'row',
    pointerEvents: 'box-none',
  },
  settingsOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(10, 25, 49, 0.26)',
  },
  settingsPanel: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    width: 420,
    maxWidth: '92%',
    backgroundColor: '#fff',
    borderLeftWidth: 1,
    borderLeftColor: '#e5edf6',
    shadowColor: colors.dark,
    shadowOpacity: 0.24,
    shadowRadius: 18,
    shadowOffset: { width: -4, height: 0 },
    elevation: 12,
  },
  settingsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#eef2f7',
  },
  settingsHeadLeft: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
  settingsHeadIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(19,127,236,0.12)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  settingsTitle: { color: colors.dark, fontSize: 20, fontWeight: '900' },
  settingsSubtitle: { color: colors.muted, fontSize: 12, fontWeight: '600', marginTop: 2 },
  settingsCloseBtn: { width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
  settingsBody: { flex: 1, paddingHorizontal: 16, paddingTop: 16 },
  settingsPreviewBox: { borderRadius: 14, overflow: 'hidden', borderWidth: 1, borderColor: '#d9e5f2', position: 'relative' },
  settingsPreviewImage: { width: '100%', height: 170 },
  audioOkTag: {
    position: 'absolute',
    bottom: 10,
    left: 10,
    backgroundColor: 'rgba(10,25,49,0.62)',
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 4,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  audioBars: { flexDirection: 'row', alignItems: 'flex-end', gap: 2 },
  audioBar: { width: 2, height: 8, borderRadius: 1, backgroundColor: '#22c55e' },
  audioOkText: { color: '#fff', fontSize: 10, fontWeight: '800' },
  settingsPreviewCaption: { marginTop: 8, marginBottom: 14, textAlign: 'center', color: colors.muted, fontSize: 11, fontStyle: 'italic', fontWeight: '600' },
  settingBlock: { marginBottom: 12 },
  settingLabel: { color: '#94a3b8', fontSize: 11, fontWeight: '900', marginBottom: 6 },
  selectLike: { borderWidth: 1, borderColor: '#dbe7f2', borderRadius: 10, backgroundColor: '#f8fbff', paddingHorizontal: 10, paddingVertical: 11, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  selectLikeText: { color: '#475569', fontSize: 12, fontWeight: '600' },
  selectMenu: { marginTop: 6, borderWidth: 1, borderColor: '#dbe7f2', borderRadius: 10, backgroundColor: '#fff', overflow: 'hidden' },
  selectOption: { paddingHorizontal: 10, paddingVertical: 9, borderBottomWidth: 1, borderBottomColor: '#edf2f8' },
  selectOptionActive: { backgroundColor: 'rgba(19,127,236,0.10)' },
  selectOptionText: { color: '#334155', fontSize: 12, fontWeight: '600' },
  selectOptionTextActive: { color: colors.primary, fontWeight: '800' },
  selectEmpty: { color: '#64748b', fontSize: 12, paddingHorizontal: 10, paddingVertical: 10, fontWeight: '600' },
  deviceInfo: { marginTop: 2, color: '#64748b', fontSize: 12, fontWeight: '600' },
  deviceError: { marginTop: 2, color: '#dc2626', fontSize: 12, fontWeight: '700' },
  toggleCard: { marginTop: 6, borderWidth: 1, borderColor: '#e5edf6', borderRadius: 12, paddingHorizontal: 10, paddingVertical: 10, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#f9fbfe' },
  toggleLeft: { flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1, paddingRight: 8 },
  toggleTitle: { color: colors.dark, fontSize: 14, fontWeight: '800' },
  toggleSubtitle: { color: colors.muted, fontSize: 11, fontWeight: '600', marginTop: 2 },
  settingsFooter: { paddingHorizontal: 16, paddingVertical: 14, borderTopWidth: 1, borderTopColor: '#eef2f7' },
  applyBtn: { borderRadius: 12, backgroundColor: '#1F4770', paddingVertical: 12, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 8 },
  applyBtnText: { color: '#fff', fontSize: 15, fontWeight: '900' },
});

export default SalaEsperaVirtualPacienteScreen;
