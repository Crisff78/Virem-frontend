import React, { useCallback, useMemo, useRef, useState } from 'react';
import {
  Alert,
  Image,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native';
import type { ImageSourcePropType } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { useFocusEffect } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { usePortalAwareNavigation } from './navigation/usePortalAwareNavigation';
import { usePacienteModule } from './navigation/PacienteModuleContext';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';

import { useLanguage } from './localization/LanguageContext';
import type { RootStackParamList } from './navigation/types';
import { apiUrl } from './config/backend';
import { useSocketEvent } from './hooks/useSocketEvent';
import { useAuth } from './providers/AuthProvider';
import { getAuthToken } from './utils/session';
import { ensurePatientSessionUser, getPatientDisplayName } from './utils/patientSession';

const ViremLogo = require('./assets/imagenes/descarga.png');
const DefaultAvatar = require('./assets/imagenes/avatar-default.jpg');

const STORAGE_KEY = 'user';
const LEGACY_USER_STORAGE_KEY = 'userProfile';
const AUTH_TOKEN_KEY = 'authToken';
const LEGACY_TOKEN_KEY = 'token';

type User = {
  id?: number | string;
  usuarioid?: number | string;
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
  citaid: string;
  fechaHoraInicio: string | null;
  fechaHoraFin: string | null;
  duracionMin: number;
  nota: string;
  precio: number | null;
  estado: string;
  estadoCodigo?: string;
  modalidad?: string;
  conversacionId?: string | null;
  medico?: {
    medicoid?: string;
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

const normalizeText = (value: unknown) =>
  String(value || '')
    .replace(/\s+/g, ' ')
    .trim();

const sanitizeFotoUrl = (value: unknown) => {
  const clean = normalizeText(value);
  if (!clean) return '';
  if (clean.toLowerCase().startsWith('blob:')) return '';
  return clean;
};

const resolveAvatarSource = (value: unknown): ImageSourcePropType => {
  const clean = sanitizeFotoUrl(value);
  if (clean) {
    return { uri: clean };
  }
  return DefaultAvatar;
};

const parseDateMs = (value: string | null | undefined) => {
  if (!value) return Number.POSITIVE_INFINITY;
  const ms = new Date(value).getTime();
  return Number.isFinite(ms) ? ms : Number.POSITIVE_INFINITY;
};

const formatDateTime = (value: string | null) => {
  if (!value) return 'Sin horario';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Sin horario';
  return new Intl.DateTimeFormat('es-DO', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
};

const colors = {
  primary: '#137fec',
  bg: '#F6FAFD',
  dark: '#0A1931',
  blue: '#1A3D63',
  muted: '#4A7FA7',
  white: '#FFFFFF',
  success: '#16a34a',
  warning: '#f59e0b',
};

const MIN_REFRESH_INTERVAL_MS = 15000;

const PacienteCitasScreen: React.FC = () => {
  const navigation = usePortalAwareNavigation();
  const { isInsidePortal } = usePacienteModule();
  const { signOut } = useAuth();
  const { width: viewportWidth } = useWindowDimensions();
  const isDesktopLayout = Platform.OS === 'web' && viewportWidth >= 1024;
  const { t } = useLanguage();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [loadingUser, setLoadingUser] = useState(true);
  const [loadingCitas, setLoadingCitas] = useState(false);
  const [workingCitaId, setWorkingCitaId] = useState('');
  const [searchText, setSearchText] = useState('');
  const [citas, setCitas] = useState<CitaItem[]>([]);
  const [activeTab, setActiveTab] = useState<'upcoming' | 'history' | 'cancelled'>('upcoming');
  const [confirmCancelId, setConfirmCancelId] = useState<string | null>(null);
  const lastRefreshRef = useRef(0);

  const loadUser = useCallback(async () => {
    if (!user) {
      setLoadingUser(true);
    }
    try {
      const rawUserFromStorage =
        Platform.OS === 'web'
          ? localStorage.getItem(LEGACY_USER_STORAGE_KEY)
          : await SecureStore.getItemAsync(LEGACY_USER_STORAGE_KEY);
      const rawUserFromAsync = await AsyncStorage.getItem(STORAGE_KEY);
      let sessionUser = ensurePatientSessionUser(parseUser(rawUserFromStorage) || parseUser(rawUserFromAsync));

      const token = await getAuthToken();
      if (token) {
        const profileResponse = await fetch(apiUrl('/api/users/me/paciente-profile'), {
          method: 'GET',
          headers: { Authorization: `Bearer ${token}` },
        });
        const profilePayload = await profileResponse.json().catch(() => null);
        if (profileResponse.ok && profilePayload?.success && profilePayload?.profile) {
          const profileUser = profilePayload.profile as User;
          const cachedUserId = normalizeText((sessionUser as any)?.usuarioid || (sessionUser as any)?.id);
          const profileUserId = normalizeText((profileUser as any)?.usuarioid || (profileUser as any)?.id);
          if (cachedUserId && profileUserId && cachedUserId !== profileUserId) {
            sessionUser = null;
          }
          sessionUser = {
            ...(sessionUser || {}),
            ...profileUser,
            nombres: normalizeText((profileUser as any)?.nombres),
            apellidos: normalizeText((profileUser as any)?.apellidos),
            nombre: normalizeText((profileUser as any)?.nombres || (profileUser as any)?.nombre),
            apellido: normalizeText((profileUser as any)?.apellidos || (profileUser as any)?.apellido),
            fotoUrl: sanitizeFotoUrl((profileUser as any)?.fotoUrl),
          };
        }
      }

      setUser(sessionUser);
      if (sessionUser) {
        const raw = JSON.stringify(sessionUser);
        try {
          await AsyncStorage.setItem(STORAGE_KEY, raw);
          await AsyncStorage.setItem(LEGACY_USER_STORAGE_KEY, raw);
        } catch {}
        try {
          if (Platform.OS === 'web') {
            localStorage.setItem(STORAGE_KEY, raw);
            localStorage.setItem(LEGACY_USER_STORAGE_KEY, raw);
          } else {
            await SecureStore.setItemAsync(LEGACY_USER_STORAGE_KEY, raw);
          }
        } catch {}
      }
    } catch {
      setUser(null);
    } finally {
      setLoadingUser(false);
    }
  }, [user]);

  const loadCitas = useCallback(async () => {
    setLoadingCitas(true);
    try {
      const token = await getAuthToken();
      if (!token) {
        setCitas([]);
        return;
      }

      const response = await fetch(apiUrl('/api/agenda/me/citas?scope=all&limit=120'), {
        method: 'GET',
        headers: { Authorization: `Bearer ${token}` },
      });
      const payload = await response.json().catch(() => null);
      if (response.ok && payload?.success && Array.isArray(payload?.citas)) {
        setCitas(payload.citas as CitaItem[]);
      } else {
        setCitas([]);
      }
    } catch {
      setCitas([]);
    } finally {
      setLoadingCitas(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      const now = Date.now();
      if (now - lastRefreshRef.current < MIN_REFRESH_INTERVAL_MS) {
        return;
      }
      lastRefreshRef.current = now;
      loadUser();
      loadCitas();
    }, [loadCitas, loadUser])
  );

  const upsertCita = useCallback((nextCita: CitaItem) => {
    if (!nextCita?.citaid) return;
    setCitas((prev) => {
      const idx = prev.findIndex((item) => item.citaid === nextCita.citaid);
      if (idx === -1) return [nextCita, ...prev];
      const next = [...prev];
      next[idx] = { ...prev[idx], ...nextCita };
      return next;
    });
  }, []);

  const handleRealtimeCitaEvent = useCallback(
    (payload: any) => {
      const citaPayload = payload?.cita as CitaItem | undefined;
      if (citaPayload?.citaid) {
        upsertCita(citaPayload);
        return;
      }
      loadCitas();
    },
    [loadCitas, upsertCita]
  );

  useSocketEvent('cita_creada', handleRealtimeCitaEvent);
  useSocketEvent('cita_actualizada', handleRealtimeCitaEvent);
  useSocketEvent('cita_cancelada', handleRealtimeCitaEvent);
  useSocketEvent('cita_reprogramada', handleRealtimeCitaEvent);

  const fullName = useMemo(() => getPatientDisplayName(user, 'Paciente'), [user]);

  const planLabel = useMemo(() => {
    const plan = normalizeText(user?.plan);
    return plan ? `Paciente ${plan}` : 'Paciente';
  }, [user]);

  const userAvatarSource: ImageSourcePropType = useMemo(() => resolveAvatarSource(user?.fotoUrl), [user?.fotoUrl]);
  const hasProfilePhoto = useMemo(() => Boolean(sanitizeFotoUrl(user?.fotoUrl)), [user?.fotoUrl]);

  const filteredCitas = useMemo(() => {
    const query = normalizeText(searchText).toLowerCase();
    if (!query) return citas;
    return citas.filter((item) => {
      const doctor = normalizeText(item?.medico?.nombreCompleto).toLowerCase();
      const spec = normalizeText(item?.medico?.especialidad).toLowerCase();
      const estado = normalizeText(item?.estado).toLowerCase();
      const modalidad = normalizeText(item?.modalidad).toLowerCase();
      return doctor.includes(query) || spec.includes(query) || estado.includes(query) || modalidad.includes(query);
    });
  }, [citas, searchText]);

  const { upcomingCitas, historyCitas, cancelledCitas } = useMemo(() => {
    const now = Date.now();
    const upcoming: CitaItem[] = [];
    const history: CitaItem[] = [];
    const cancelled: CitaItem[] = [];
    for (const cita of filteredCitas) {
      const estado = normalizeText(cita.estado).toLowerCase();
      if (estado.includes('cancel')) {
        cancelled.push(cita);
        continue;
      }
      const startMs = parseDateMs(cita.fechaHoraInicio);
      if (Number.isFinite(startMs) && startMs >= now) {
        upcoming.push(cita);
      } else {
        history.push(cita);
      }
    }
    upcoming.sort((a, b) => parseDateMs(a.fechaHoraInicio) - parseDateMs(b.fechaHoraInicio));
    history.sort((a, b) => parseDateMs(b.fechaHoraInicio) - parseDateMs(a.fechaHoraInicio));
    cancelled.sort((a, b) => parseDateMs(b.fechaHoraInicio) - parseDateMs(a.fechaHoraInicio));
    return { upcomingCitas: upcoming, historyCitas: history, cancelledCitas: cancelled };
  }, [filteredCitas]);

  const getEstadoBadge = useCallback((estado: string) => {
    const e = normalizeText(estado).toLowerCase();
    if (e.includes('confirm')) return { label: 'Confirmada', color: '#16a34a', bg: '#f0fdf4' };
    if (e.includes('complet') || e.includes('realiz') || e.includes('finaliz')) return { label: 'Completada', color: '#6366f1', bg: '#eef2ff' };
    if (e.includes('cancel')) return { label: 'Cancelada', color: '#ef4444', bg: '#fef2f2' };
    if (e.includes('pospuesta') || e.includes('reprog')) return { label: 'Reprogramada', color: '#f59e0b', bg: '#fffbeb' };
    return { label: 'Pendiente', color: '#f59e0b', bg: '#fffbeb' };
  }, []);

  const handleLogout = async () => {
    await signOut();
    navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
  };

  const showDetails = (cita: CitaItem) => {
    Alert.alert(
      'Detalle de cita',
      `Doctor: ${normalizeText(cita?.medico?.nombreCompleto || 'Especialista')}\nEspecialidad: ${normalizeText(
        cita?.medico?.especialidad || 'Medicina General'
      )}\nFecha: ${formatDateTime(cita.fechaHoraInicio)}\nModalidad: ${normalizeText(
        cita.modalidad || 'presencial'
      )}\nEstado: ${normalizeText(cita.estado || 'Pendiente')}`
    );
  };

  const postponeCita = async (cita: CitaItem) => {
    setWorkingCitaId(cita.citaid);
    try {
      const token = await getAuthToken();
      if (!token) {
        Alert.alert('Sesion expirada', 'Inicia sesion nuevamente.');
        navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
        return;
      }

      const currentStart = cita?.fechaHoraInicio ? new Date(cita.fechaHoraInicio) : new Date();
      const nextStart = new Date(currentStart.getTime() + 24 * 60 * 60 * 1000);

      const response = await fetch(apiUrl(`/api/agenda/me/citas/${cita.citaid}/reprogramar`), {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          fechaHoraInicio: nextStart.toISOString(),
          motivo: 'Reprogramada desde panel del paciente',
        }),
      });
      const payload = await response.json().catch(() => null);
      if (!response.ok || !payload?.success) {
        Alert.alert('No se pudo posponer', payload?.message || 'Intenta nuevamente.');
        return;
      }

      if (payload?.cita) {
        upsertCita(payload.cita as CitaItem);
      } else {
        await loadCitas();
      }
      Alert.alert('Cita pospuesta', `Nueva fecha: ${formatDateTime(payload?.cita?.fechaHoraInicio || null)}`);
    } catch {
      Alert.alert('Error', 'No se pudo conectar para posponer la cita.');
    } finally {
      setWorkingCitaId('');
    }
  };

  const cancelCita = async (cita: CitaItem) => {
    setWorkingCitaId(cita.citaid);
    try {
      const token = await getAuthToken();
      if (!token) {
        Alert.alert('Sesion expirada', 'Inicia sesion nuevamente.');
        navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
        return;
      }

      const response = await fetch(apiUrl(`/api/agenda/me/citas/${cita.citaid}/cancelar`), {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          motivo: 'Cancelada desde panel del paciente',
        }),
      });
      const payload = await response.json().catch(() => null);
      if (!response.ok || !payload?.success) {
        Alert.alert('No se pudo cancelar', payload?.message || 'Intenta nuevamente.');
        return;
      }

      if (payload?.cita) {
        upsertCita(payload.cita as CitaItem);
      } else {
        await loadCitas();
      }
      Alert.alert('Cita cancelada', 'La cita fue cancelada correctamente.');
    } catch {
      Alert.alert('Error', 'No se pudo conectar para cancelar la cita.');
    } finally {
      setWorkingCitaId('');
    }
  };

  const askPostpone = (cita: CitaItem) => {
    Alert.alert(
      'Posponer cita',
      'Se movera esta cita 24 horas hacia adelante. Deseas continuar?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Posponer', onPress: () => postponeCita(cita) },
      ]
    );
  };

  const askCancel = (cita: CitaItem) => {
    Alert.alert(
      'Cancelar cita',
      'Se cancelara esta cita y el horario volvera a estar disponible.',
      [
        { text: 'Volver', style: 'cancel' },
        { text: 'Cancelar cita', style: 'destructive', onPress: () => cancelCita(cita) },
      ]
    );
  };

  // --- Sidebar Content Standardized ---
  const SidebarContent = () => (
    <View style={styles.sidebarContent}>
      <View style={styles.logoBox}>
        <Image source={ViremLogo} style={styles.logo} />
        <View>
          <Text style={styles.logoTitle}>VIREM</Text>
          <Text style={styles.logoSubtitle}>Paciente</Text>
        </View>
      </View>

      <View style={styles.userBox}>
        <Image source={userAvatarSource} style={styles.userAvatar} />
        <Text style={styles.userName}>{fullName}</Text>
        <Text style={styles.userPlan}>{planLabel}</Text>
      </View>

      <ScrollView style={styles.menuScroll} showsVerticalScrollIndicator={false}>
        <TouchableOpacity 
          style={styles.menuItemRow} 
          onPress={() => { setIsSidebarOpen(false); navigation.navigate('DashboardPaciente'); }}
        >
          <MaterialIcons name="grid-view" size={20} color={colors.muted} />
          <Text style={styles.menuText}>Inicio</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.menuItemRow} 
          onPress={() => { setIsSidebarOpen(false); navigation.navigate('NuevaConsultaPaciente'); }}
        >
          <MaterialIcons name="person-search" size={20} color={colors.muted} />
          <Text style={styles.menuText}>Buscar Médico</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.menuItemRow, styles.menuItemActive]} 
          onPress={() => { setIsSidebarOpen(false); }}
        >
          <MaterialIcons name="calendar-today" size={20} color={colors.primary} />
          <Text style={[styles.menuText, styles.menuTextActive]}>Mis Citas</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.menuItemRow} 
          onPress={() => { setIsSidebarOpen(false); navigation.navigate('SalaEsperaVirtualPaciente'); }}
        >
          <MaterialIcons name="videocam" size={20} color={colors.muted} />
          <Text style={styles.menuText}>Videollamada</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.menuItemRow} 
          onPress={() => { setIsSidebarOpen(false); navigation.navigate('PacienteChat'); }}
        >
          <MaterialIcons name="chat-bubble" size={20} color={colors.muted} />
          <Text style={styles.menuText}>Mensajes</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.menuItemRow} 
          onPress={() => { setIsSidebarOpen(false); navigation.navigate('PacienteRecetasDocumentos'); }}
        >
          <MaterialIcons name="description" size={20} color={colors.muted} />
          <Text style={styles.menuText}>Recetas / Doc.</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.menuItemRow} 
          onPress={() => { setIsSidebarOpen(false); navigation.navigate('PacienteNotificaciones'); }}
        >
          <MaterialIcons name="notifications" size={20} color={colors.muted} />
          <Text style={styles.menuText}>Notificaciones</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.menuItemRow} 
          onPress={() => { setIsSidebarOpen(false); navigation.navigate('PacientePerfil'); }}
        >
          <MaterialIcons name="account-circle" size={20} color={colors.muted} />
          <Text style={styles.menuText}>Perfil</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.menuItemRow} 
          onPress={() => { setIsSidebarOpen(false); navigation.navigate('PacienteConfiguracion'); }}
        >
          <MaterialIcons name="settings" size={20} color={colors.muted} />
          <Text style={styles.menuText}>Configuración</Text>
        </TouchableOpacity>
      </ScrollView>

      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <MaterialIcons name="logout" size={20} color="#fff" />
        <Text style={styles.logoutText}>Cerrar Sesión</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Drawer Overlay */}
      {isSidebarOpen && (
        <TouchableOpacity 
          style={styles.drawerOverlay} 
          activeOpacity={1} 
          onPress={() => setIsSidebarOpen(false)}
        >
          <View style={styles.drawerContent}>
            <SidebarContent />
          </View>
        </TouchableOpacity>
      )}

      <View style={[styles.main, !isDesktopLayout ? styles.mainMobile : null]}>
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.hamburgerBtn} 
            onPress={() => setIsSidebarOpen(true)}
          >
            <MaterialIcons name="menu" size={26} color={colors.dark} />
          </TouchableOpacity>

          <View style={styles.searchBox}>
            <MaterialIcons name="search" size={20} color={colors.muted} />
            <TextInput
              placeholder="Buscar por medico, especialidad o estado"
              placeholderTextColor="#8aa7bf"
              style={styles.searchInput}
              value={searchText}
              onChangeText={setSearchText}
            />
          </View>
          <TouchableOpacity style={styles.notifBtn} onPress={() => navigation.navigate('PacienteNotificaciones')}>
            <MaterialIcons name="notifications" size={22} color={colors.dark} />
            <View style={styles.notifDot} />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} contentContainerStyle={{ paddingBottom: 28 }}>
          <View style={styles.heading}>
            <Text style={styles.title}>Mis citas</Text>
            <Text style={styles.subtitle}>Gestiona tus consultas, videollamadas y mensajes con tus especialistas.</Text>
          </View>

          {/* Tabs */}
          <View style={styles.tabBar}>
            <TouchableOpacity
              style={[styles.tab, activeTab === 'upcoming' && styles.tabActive]}
              activeOpacity={0.8}
              onPress={() => setActiveTab('upcoming')}
            >
              <MaterialIcons name="event" size={16} color={activeTab === 'upcoming' ? '#fff' : colors.muted} />
              <Text style={[styles.tabText, activeTab === 'upcoming' && styles.tabTextActive]}>Próximas</Text>
              {upcomingCitas.length > 0 && (
                <View style={[styles.tabBadge, activeTab === 'upcoming' && styles.tabBadgeActive]}>
                  <Text style={[styles.tabBadgeText, activeTab === 'upcoming' && styles.tabBadgeTextActive]}>{upcomingCitas.length}</Text>
                </View>
              )}
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tab, activeTab === 'history' && styles.tabActive]}
              activeOpacity={0.8}
              onPress={() => setActiveTab('history')}
            >
              <MaterialIcons name="history" size={16} color={activeTab === 'history' ? '#fff' : colors.muted} />
              <Text style={[styles.tabText, activeTab === 'history' && styles.tabTextActive]}>Historial</Text>
              {historyCitas.length > 0 && (
                <View style={[styles.tabBadge, activeTab === 'history' && styles.tabBadgeActive]}>
                  <Text style={[styles.tabBadgeText, activeTab === 'history' && styles.tabBadgeTextActive]}>{historyCitas.length}</Text>
                </View>
              )}
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tab, activeTab === 'cancelled' && styles.tabActive]}
              activeOpacity={0.8}
              onPress={() => setActiveTab('cancelled')}
            >
              <MaterialIcons name="cancel" size={16} color={activeTab === 'cancelled' ? '#fff' : colors.muted} />
              <Text style={[styles.tabText, activeTab === 'cancelled' && styles.tabTextActive]}>Canceladas</Text>
              {cancelledCitas.length > 0 && (
                <View style={[styles.tabBadge, activeTab === 'cancelled' && styles.tabBadgeActive]}>
                  <Text style={[styles.tabBadgeText, activeTab === 'cancelled' && styles.tabBadgeTextActive]}>{cancelledCitas.length}</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>

          {/* Tab: Próximas */}
          {activeTab === 'upcoming' && (
            <View style={styles.section}>
              {loadingCitas ? (
                <View style={styles.emptyState}>
                  <MaterialIcons name="hourglass-top" size={36} color={colors.muted} />
                  <Text style={styles.emptyTitle}>Cargando citas...</Text>
                </View>
              ) : !upcomingCitas.length ? (
                <View style={styles.emptyState}>
                  <View style={styles.emptyIconBox}>
                    <MaterialIcons name="event-available" size={36} color={colors.primary} />
                  </View>
                  <Text style={styles.emptyTitle}>Sin citas próximas</Text>
                  <Text style={styles.emptySubtitle}>Agenda una consulta con un especialista para comenzar.</Text>
                  <TouchableOpacity
                    style={styles.emptyCta}
                    activeOpacity={0.8}
                    onPress={() => navigation.navigate('NuevaConsultaPaciente')}
                  >
                    <MaterialIcons name="add" size={18} color="#fff" />
                    <Text style={styles.emptyCtaText}>Agendar consulta</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                upcomingCitas.map((cita) => {
                  const badge = getEstadoBadge(cita.estado);
                  const isVirtual = normalizeText(cita?.modalidad).toLowerCase() === 'virtual';
                  const isBusy = workingCitaId === cita.citaid;
                  const isConfirmingCancel = confirmCancelId === cita.citaid;
                  return (
                    <View key={cita.citaid} style={styles.citaCard}>
                      <View style={styles.citaTop}>
                        <Image source={resolveAvatarSource(cita?.medico?.fotoUrl)} style={styles.citaAvatar} />
                        <View style={{ flex: 1 }}>
                          <Text style={styles.citaDoctor}>{normalizeText(cita?.medico?.nombreCompleto || 'Especialista')}</Text>
                          <Text style={styles.citaSpec}>{normalizeText(cita?.medico?.especialidad || 'Medicina General')}</Text>
                        </View>
                        <View style={[styles.statusBadge, { backgroundColor: badge.bg }]}>
                          <View style={[styles.statusDot, { backgroundColor: badge.color }]} />
                          <Text style={[styles.statusText, { color: badge.color }]}>{badge.label}</Text>
                        </View>
                      </View>
                      <View style={styles.citaMeta}>
                        <View style={styles.citaMetaItem}>
                          <MaterialIcons name="calendar-today" size={14} color={colors.muted} />
                          <Text style={styles.citaMetaText}>{formatDateTime(cita.fechaHoraInicio)}</Text>
                        </View>
                        <View style={styles.citaMetaItem}>
                          <MaterialIcons name={isVirtual ? 'videocam' : 'location-on'} size={14} color={colors.muted} />
                          <Text style={styles.citaMetaText}>{normalizeText(cita?.modalidad || 'Presencial')}</Text>
                        </View>
                      </View>

                      {isConfirmingCancel ? (
                        <View style={styles.confirmBar}>
                          <Text style={styles.confirmText}>¿Cancelar esta cita?</Text>
                          <View style={styles.confirmActions}>
                            <TouchableOpacity style={styles.confirmNo} activeOpacity={0.8} onPress={() => setConfirmCancelId(null)}>
                              <Text style={styles.confirmNoText}>Volver</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.confirmYes} activeOpacity={0.8} onPress={() => { setConfirmCancelId(null); cancelCita(cita); }}>
                              <Text style={styles.confirmYesText}>Sí, cancelar</Text>
                            </TouchableOpacity>
                          </View>
                        </View>
                      ) : (
                        <View style={styles.citaActions}>
                          {isVirtual && (
                            <TouchableOpacity
                              style={styles.actionJoin}
                              activeOpacity={0.8}
                              onPress={() => navigation.navigate('SalaEsperaVirtualPaciente', { citaId: cita.citaid })}
                            >
                              <MaterialIcons name="videocam" size={16} color="#fff" />
                              <Text style={styles.actionJoinText}>Unirse</Text>
                            </TouchableOpacity>
                          )}
                          <TouchableOpacity
                            style={[styles.actionOutline, isBusy && styles.actionDisabled]}
                            activeOpacity={0.8}
                            onPress={() => askPostpone(cita)}
                            disabled={isBusy}
                          >
                            <MaterialIcons name="update" size={14} color={colors.blue} />
                            <Text style={styles.actionOutlineText}>{isBusy ? 'Posponiendo...' : 'Posponer'}</Text>
                          </TouchableOpacity>
                          <TouchableOpacity
                            style={[styles.actionDanger, isBusy && styles.actionDisabled]}
                            activeOpacity={0.8}
                            onPress={() => setConfirmCancelId(cita.citaid)}
                            disabled={isBusy}
                          >
                            <MaterialIcons name="close" size={14} color="#ef4444" />
                            <Text style={styles.actionDangerText}>Cancelar</Text>
                          </TouchableOpacity>
                          <TouchableOpacity
                            style={styles.actionOutline}
                            activeOpacity={0.8}
                            onPress={() => navigation.navigate('PacienteChat', {
                              doctorId: String(cita?.medico?.medicoid || ''),
                              doctorName: normalizeText(cita?.medico?.nombreCompleto || 'Especialista'),
                              doctorAvatarUrl: sanitizeFotoUrl(cita?.medico?.fotoUrl) || null,
                            })}
                          >
                            <MaterialIcons name="chat-bubble-outline" size={14} color={colors.blue} />
                            <Text style={styles.actionOutlineText}>Chat</Text>
                          </TouchableOpacity>
                        </View>
                      )}
                    </View>
                  );
                })
              )}
            </View>
          )}

          {/* Tab: Historial */}
          {activeTab === 'history' && (
            <View style={styles.section}>
              {!historyCitas.length ? (
                <View style={styles.emptyState}>
                  <View style={styles.emptyIconBox}>
                    <MaterialIcons name="history" size={36} color={colors.muted} />
                  </View>
                  <Text style={styles.emptyTitle}>Sin historial</Text>
                  <Text style={styles.emptySubtitle}>Tus consultas completadas aparecerán aquí.</Text>
                </View>
              ) : (
                historyCitas.map((cita) => {
                  const badge = getEstadoBadge(cita.estado);
                  return (
                    <View key={cita.citaid} style={styles.citaCard}>
                      <View style={styles.citaTop}>
                        <Image source={resolveAvatarSource(cita?.medico?.fotoUrl)} style={styles.citaAvatar} />
                        <View style={{ flex: 1 }}>
                          <Text style={styles.citaDoctor}>{normalizeText(cita?.medico?.nombreCompleto || 'Especialista')}</Text>
                          <Text style={styles.citaSpec}>{normalizeText(cita?.medico?.especialidad || 'Medicina General')}</Text>
                        </View>
                        <View style={[styles.statusBadge, { backgroundColor: badge.bg }]}>
                          <View style={[styles.statusDot, { backgroundColor: badge.color }]} />
                          <Text style={[styles.statusText, { color: badge.color }]}>{badge.label}</Text>
                        </View>
                      </View>
                      <View style={styles.citaMeta}>
                        <View style={styles.citaMetaItem}>
                          <MaterialIcons name="calendar-today" size={14} color={colors.muted} />
                          <Text style={styles.citaMetaText}>{formatDateTime(cita.fechaHoraInicio)}</Text>
                        </View>
                      </View>
                      <View style={styles.citaActions}>
                        <TouchableOpacity style={styles.actionOutline} activeOpacity={0.8} onPress={() => showDetails(cita)}>
                          <MaterialIcons name="info-outline" size={14} color={colors.blue} />
                          <Text style={styles.actionOutlineText}>Ver detalle</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  );
                })
              )}
            </View>
          )}

          {/* Tab: Canceladas */}
          {activeTab === 'cancelled' && (
            <View style={styles.section}>
              {!cancelledCitas.length ? (
                <View style={styles.emptyState}>
                  <View style={styles.emptyIconBox}>
                    <MaterialIcons name="block" size={36} color={colors.muted} />
                  </View>
                  <Text style={styles.emptyTitle}>Sin cancelaciones</Text>
                  <Text style={styles.emptySubtitle}>No tienes citas canceladas.</Text>
                </View>
              ) : (
                cancelledCitas.map((cita) => (
                  <View key={cita.citaid} style={[styles.citaCard, styles.citaCardCancelled]}>
                    <View style={styles.citaTop}>
                      <Image source={resolveAvatarSource(cita?.medico?.fotoUrl)} style={[styles.citaAvatar, { opacity: 0.6 }]} />
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.citaDoctor, { color: colors.muted }]}>{normalizeText(cita?.medico?.nombreCompleto || 'Especialista')}</Text>
                        <Text style={styles.citaSpec}>{normalizeText(cita?.medico?.especialidad || 'Medicina General')}</Text>
                      </View>
                      <View style={[styles.statusBadge, { backgroundColor: '#fef2f2' }]}>
                        <View style={[styles.statusDot, { backgroundColor: '#ef4444' }]} />
                        <Text style={[styles.statusText, { color: '#ef4444' }]}>Cancelada</Text>
                      </View>
                    </View>
                    <View style={styles.citaMeta}>
                      <View style={styles.citaMetaItem}>
                        <MaterialIcons name="calendar-today" size={14} color={colors.muted} />
                        <Text style={styles.citaMetaText}>{formatDateTime(cita.fechaHoraInicio)}</Text>
                      </View>
                    </View>
                  </View>
                ))
              )}
            </View>
          )}
        </ScrollView>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  containerDesktop: { flexDirection: 'row' },
  containerMobile: { flexDirection: 'column' },
  mobileMenuBar: {
    paddingHorizontal: 14,
    paddingTop: 12,
    paddingBottom: 8,
    backgroundColor: colors.bg,
  },
  mobileMenuButton: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
  },
  drawerOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    zIndex: 2000,
  },
  drawerContent: {
    width: 280,
    height: '100%',
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 15,
    elevation: 20,
  },
  sidebarContent: {
    flex: 1,
    padding: 20,
    backgroundColor: '#fff',
  },
  logoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 30,
    paddingHorizontal: 5,
  },
  logo: {
    width: 40,
    height: 40,
    resizeMode: 'contain',
  },
  logoTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: colors.primary,
    letterSpacing: 1,
  },
  logoSubtitle: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.muted,
    marginTop: -2,
    textTransform: 'uppercase',
  },
  userBox: {
    padding: 16,
    backgroundColor: '#f8fbff',
    borderRadius: 16,
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#eef4fb',
  },
  userAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginBottom: 10,
    borderWidth: 2,
    borderColor: '#fff',
  },
  userName: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.dark,
    textAlign: 'center',
  },
  userPlan: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.primary,
    marginTop: 2,
  },
  hamburgerBtn: {
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
  menuScroll: {
    flex: 1,
    marginTop: 20,
  },
  menuItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 12,
    marginBottom: 4,
  },
  menuItemActive: {
    backgroundColor: 'rgba(19,127,236,0.1)',
  },
  menuText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.muted,
  },
  menuTextActive: {
    color: colors.primary,
  },
  logoutButton: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.blue,
    paddingVertical: 12,
    borderRadius: 12,
    marginTop: 20,
  },
  logoutText: {
    color: '#fff',
    fontWeight: '800',
  },

  main: {
    flex: 1,
    paddingHorizontal: Platform.OS === 'web' ? 26 : 14,
    paddingTop: Platform.OS === 'web' ? 18 : 12,
  },
  mainMobile: {
    paddingHorizontal: 14,
    paddingTop: 12,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 14,
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
  notifDot: { position: 'absolute', top: 12, right: 12, width: 10, height: 10, borderRadius: 10, backgroundColor: '#ef4444', borderWidth: 2, borderColor: '#fff' },

  content: { flex: 1 },
  heading: { marginBottom: 6 },
  title: { fontSize: 30, fontWeight: '900', color: colors.dark, letterSpacing: -0.3 },
  subtitle: { marginTop: 4, color: colors.muted, fontWeight: '600', lineHeight: 20 },

  /* Tabs */
  tabBar: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 14,
    marginBottom: 16,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e4edf7',
  },
  tabActive: {
    backgroundColor: colors.blue,
    borderColor: colors.blue,
  },
  tabText: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.muted,
  },
  tabTextActive: {
    color: '#fff',
  },
  tabBadge: {
    backgroundColor: '#eef4fb',
    borderRadius: 10,
    paddingHorizontal: 7,
    paddingVertical: 2,
    minWidth: 22,
    alignItems: 'center',
  },
  tabBadgeActive: {
    backgroundColor: 'rgba(255,255,255,0.25)',
  },
  tabBadgeText: {
    fontSize: 11,
    fontWeight: '900',
    color: colors.blue,
  },
  tabBadgeTextActive: {
    color: '#fff',
  },

  section: { marginTop: 4 },

  /* Empty states */
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
    backgroundColor: '#fff',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#e4edf7',
    borderStyle: 'dashed',
  },
  emptyIconBox: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#f0f6ff',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  emptyTitle: {
    color: colors.dark,
    fontSize: 16,
    fontWeight: '800',
    marginTop: 4,
  },
  emptySubtitle: {
    color: colors.muted,
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
    marginTop: 4,
    lineHeight: 18,
    maxWidth: 280,
  },
  emptyCta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 16,
    backgroundColor: '#1F4770',
    paddingVertical: 11,
    paddingHorizontal: 20,
    borderRadius: 12,
    shadowColor: '#1F4770',
    shadowOpacity: 0.25,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  emptyCtaText: {
    color: '#fff',
    fontWeight: '800',
    fontSize: 14,
  },

  /* Cita card */
  citaCard: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e4edf7',
    borderRadius: 18,
    padding: 16,
    marginBottom: 12,
    shadowColor: colors.dark,
    shadowOpacity: 0.04,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 1,
  },
  citaCardCancelled: {
    opacity: 0.7,
    backgroundColor: '#fafbfc',
  },
  citaTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  citaAvatar: { width: 48, height: 48, borderRadius: 48, borderWidth: 2, borderColor: '#f2f6fb' },
  citaDoctor: { color: colors.dark, fontWeight: '800', fontSize: 15 },
  citaSpec: { color: colors.muted, fontWeight: '600', fontSize: 12, marginTop: 1 },

  /* Status badge */
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
  },
  statusDot: {
    width: 7,
    height: 7,
    borderRadius: 7,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '800',
  },

  /* Meta row */
  citaMeta: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  citaMetaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  citaMetaText: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: '700',
  },

  /* Actions */
  citaActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 12,
  },
  actionJoin: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.primary,
    paddingVertical: 9,
    paddingHorizontal: 14,
    borderRadius: 10,
    shadowColor: colors.primary,
    shadowOpacity: 0.3,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },
  actionJoinText: { color: '#fff', fontWeight: '800', fontSize: 13 },
  actionOutline: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#f1f5f9',
    paddingVertical: 9,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  actionOutlineText: { color: colors.blue, fontWeight: '800', fontSize: 12 },
  actionDanger: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#fef2f2',
    paddingVertical: 9,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#fecaca',
  },
  actionDangerText: { color: '#ef4444', fontWeight: '800', fontSize: 12 },
  actionDisabled: { opacity: 0.55 },

  /* Inline cancel confirmation */
  confirmBar: {
    marginTop: 12,
    backgroundColor: '#fef2f2',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#fecaca',
    padding: 12,
    flexDirection: Platform.OS === 'web' ? 'row' : 'column',
    alignItems: Platform.OS === 'web' ? 'center' : 'stretch',
    justifyContent: 'space-between',
    gap: 10,
  },
  confirmText: {
    color: '#991b1b',
    fontWeight: '800',
    fontSize: 13,
  },
  confirmActions: {
    flexDirection: 'row',
    gap: 8,
  },
  confirmNo: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 10,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  confirmNoText: { color: colors.dark, fontWeight: '800', fontSize: 12 },
  confirmYes: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 10,
    backgroundColor: '#ef4444',
  },
  confirmYesText: { color: '#fff', fontWeight: '800', fontSize: 12 },
});

export default PacienteCitasScreen;

