import React, { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import type { ImageSourcePropType } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';

import { useLanguage } from './localization/LanguageContext';
import type { RootStackParamList } from './navigation/types';
import { apiUrl } from './config/backend';
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

const getAuthToken = async (): Promise<string> => {
  try {
    if (Platform.OS === 'web') {
      return (
        localStorage.getItem(AUTH_TOKEN_KEY) ||
        localStorage.getItem(LEGACY_TOKEN_KEY) ||
        ''
      ).trim();
    }

    const secureToken =
      (await SecureStore.getItemAsync(AUTH_TOKEN_KEY)) ||
      (await SecureStore.getItemAsync(LEGACY_TOKEN_KEY));
    if (secureToken && secureToken.trim()) return secureToken.trim();

    const asyncToken =
      (await AsyncStorage.getItem(AUTH_TOKEN_KEY)) ||
      (await AsyncStorage.getItem(LEGACY_TOKEN_KEY));
    return String(asyncToken || '').trim();
  } catch {
    return '';
  }
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

const PacienteCitasScreen: React.FC = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { t } = useLanguage();
  const [user, setUser] = useState<User | null>(null);
  const [loadingUser, setLoadingUser] = useState(true);
  const [loadingCitas, setLoadingCitas] = useState(false);
  const [workingCitaId, setWorkingCitaId] = useState('');
  const [searchText, setSearchText] = useState('');
  const [citas, setCitas] = useState<CitaItem[]>([]);

  const loadUser = useCallback(async () => {
    setLoadingUser(true);
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
  }, []);

  const loadCitas = useCallback(async () => {
    setLoadingCitas(true);
    try {
      const token = await getAuthToken();
      if (!token) {
        setCitas([]);
        return;
      }

      const response = await fetch(apiUrl('/api/users/me/citas?scope=all&limit=100'), {
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
      loadUser();
      loadCitas();
    }, [loadCitas, loadUser])
  );

  const fullName = useMemo(() => getPatientDisplayName(user, 'Paciente'), [user]);

  const planLabel = useMemo(() => {
    const plan = normalizeText(user?.plan);
    return plan ? `Paciente ${plan}` : 'Paciente';
  }, [user]);

  const userAvatarSource: ImageSourcePropType = useMemo(() => resolveAvatarSource(user?.fotoUrl), [user?.fotoUrl]);

  const filteredCitas = useMemo(() => {
    const query = normalizeText(searchText).toLowerCase();
    if (!query) return citas;
    return citas.filter((item) => {
      const doctor = normalizeText(item?.medico?.nombreCompleto).toLowerCase();
      const spec = normalizeText(item?.medico?.especialidad).toLowerCase();
      const estado = normalizeText(item?.estado).toLowerCase();
      return doctor.includes(query) || spec.includes(query) || estado.includes(query);
    });
  }, [citas, searchText]);

  const { upcomingCitas, historyCitas } = useMemo(() => {
    const now = Date.now();
    const upcoming: CitaItem[] = [];
    const history: CitaItem[] = [];
    for (const cita of filteredCitas) {
      const startMs = parseDateMs(cita.fechaHoraInicio);
      if (Number.isFinite(startMs) && startMs >= now) {
        upcoming.push(cita);
      } else {
        history.push(cita);
      }
    }
    upcoming.sort((a, b) => parseDateMs(a.fechaHoraInicio) - parseDateMs(b.fechaHoraInicio));
    history.sort((a, b) => parseDateMs(b.fechaHoraInicio) - parseDateMs(a.fechaHoraInicio));
    return { upcomingCitas: upcoming, historyCitas: history };
  }, [filteredCitas]);

  const handleLogout = async () => {
    await AsyncStorage.removeItem(AUTH_TOKEN_KEY);
    await AsyncStorage.removeItem(LEGACY_TOKEN_KEY);
    await AsyncStorage.removeItem(STORAGE_KEY);
    await AsyncStorage.removeItem(LEGACY_USER_STORAGE_KEY);
    try {
      if (Platform.OS === 'web') {
        localStorage.removeItem(AUTH_TOKEN_KEY);
        localStorage.removeItem(LEGACY_TOKEN_KEY);
        localStorage.removeItem(STORAGE_KEY);
        localStorage.removeItem(LEGACY_USER_STORAGE_KEY);
      } else {
        await SecureStore.deleteItemAsync(AUTH_TOKEN_KEY);
        await SecureStore.deleteItemAsync(LEGACY_TOKEN_KEY);
        await SecureStore.deleteItemAsync(LEGACY_USER_STORAGE_KEY);
      }
    } catch {}
    navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
  };

  const showDetails = (cita: CitaItem) => {
    Alert.alert(
      'Detalle de cita',
      `Doctor: ${normalizeText(cita?.medico?.nombreCompleto || 'Especialista')}\nEspecialidad: ${normalizeText(
        cita?.medico?.especialidad || 'Medicina General'
      )}\nFecha: ${formatDateTime(cita.fechaHoraInicio)}\nEstado: ${normalizeText(cita.estado || 'Pendiente')}`
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

      const response = await fetch(apiUrl(`/api/users/me/citas/${cita.citaid}/postpone`), {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });
      const payload = await response.json().catch(() => null);
      if (!response.ok || !payload?.success) {
        Alert.alert('No se pudo posponer', payload?.message || 'Intenta nuevamente.');
        return;
      }

      Alert.alert('Cita pospuesta', `Nueva fecha: ${formatDateTime(payload?.cita?.fechaHoraInicio || null)}`);
      await loadCitas();
    } catch {
      Alert.alert('Error', 'No se pudo conectar para posponer la cita.');
    } finally {
      setWorkingCitaId('');
    }
  };

  const askPostpone = (cita: CitaItem) => {
    Alert.alert(
      'Posponer cita',
      'Se movera esta cita 24 horas hacia adelante. ¿Deseas continuar?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Posponer', onPress: () => postponeCita(cita) },
      ]
    );
  };

  if (loadingUser) {
    return (
      <View style={styles.loaderWrap}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loaderText}>Cargando citas del paciente...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.sidebar}>
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
          </View>

          <View style={styles.menu}>
            <TouchableOpacity style={styles.menuItemRow} onPress={() => navigation.navigate('DashboardPaciente')}>
              <MaterialIcons name="grid-view" size={20} color={colors.muted} />
              <Text style={styles.menuText}>{t('menu.home')}</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.menuItemRow} onPress={() => navigation.navigate('NuevaConsultaPaciente')}>
              <MaterialIcons name="person-search" size={20} color={colors.muted} />
              <Text style={styles.menuText}>{t('menu.searchDoctor')}</Text>
            </TouchableOpacity>

            <TouchableOpacity style={[styles.menuItemRow, styles.menuItemActive]} onPress={() => navigation.navigate('PacienteCitas')}>
              <MaterialIcons name="calendar-today" size={20} color={colors.primary} />
              <Text style={[styles.menuText, styles.menuTextActive]}>{t('menu.appointments')}</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.menuItemRow} onPress={() => navigation.navigate('SalaEsperaVirtualPaciente')}>
              <MaterialIcons name="videocam" size={20} color={colors.muted} />
              <Text style={styles.menuText}>{t('menu.videocall')}</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.menuItemRow} onPress={() => navigation.navigate('PacienteChat')}>
              <MaterialIcons name="chat-bubble" size={20} color={colors.muted} />
              <Text style={styles.menuText}>{t('menu.chat')}</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.menuItemRow} onPress={() => navigation.navigate('PacienteRecetasDocumentos')}>
              <MaterialIcons name="description" size={20} color={colors.muted} />
              <Text style={styles.menuText}>{t('menu.recipesDocs')}</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.menuItemRow} onPress={() => navigation.navigate('PacientePerfil')}>
              <MaterialIcons name="account-circle" size={20} color={colors.muted} />
              <Text style={styles.menuText}>{t('menu.profile')}</Text>
            </TouchableOpacity>
          </View>
        </View>

        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <MaterialIcons name="logout" size={20} color="#fff" />
          <Text style={styles.logoutText}>{t('menu.logout')}</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.main}>
        <View style={styles.header}>
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

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Proximas citas</Text>
            {loadingCitas ? (
              <Text style={styles.emptyText}>Cargando citas...</Text>
            ) : !upcomingCitas.length ? (
              <Text style={styles.emptyText}>No tienes citas proximas.</Text>
            ) : (
              upcomingCitas.map((cita) => (
                <View key={cita.citaid} style={styles.citaCard}>
                  <Image source={resolveAvatarSource(cita?.medico?.fotoUrl)} style={styles.citaAvatar} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.citaDoctor}>{normalizeText(cita?.medico?.nombreCompleto || 'Especialista')}</Text>
                    <Text style={styles.citaDetail}>
                      {normalizeText(cita?.medico?.especialidad || 'Medicina General')} · {formatDateTime(cita.fechaHoraInicio)}
                    </Text>
                    <Text style={styles.citaState}>{normalizeText(cita.estado || 'Pendiente')}</Text>
                    <View style={styles.citaActions}>
                      <TouchableOpacity
                        style={styles.actionBlue}
                        onPress={() => navigation.navigate('SalaEsperaVirtualPaciente', { citaId: cita.citaid })}
                      >
                        <Text style={styles.actionBlueText}>Videollamada</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.actionGray, workingCitaId === cita.citaid && styles.actionDisabled]}
                        onPress={() => askPostpone(cita)}
                        disabled={workingCitaId === cita.citaid}
                      >
                        <Text style={styles.actionGrayText}>
                          {workingCitaId === cita.citaid ? 'Posponiendo...' : 'Posponer'}
                        </Text>
                      </TouchableOpacity>
                      <TouchableOpacity style={styles.actionGray} onPress={() => showDetails(cita)}>
                        <Text style={styles.actionGrayText}>Detalles</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.actionGray}
                        onPress={() =>
                          navigation.navigate('PacienteChat', {
                            doctorId: String(cita?.medico?.medicoid || ''),
                            doctorName: normalizeText(cita?.medico?.nombreCompleto || 'Especialista'),
                            doctorAvatarUrl: sanitizeFotoUrl(cita?.medico?.fotoUrl) || null,
                          })
                        }
                      >
                        <Text style={styles.actionGrayText}>Chat</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              ))
            )}
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Historial de citas</Text>
            {!historyCitas.length ? (
              <Text style={styles.emptyText}>Aun no tienes historial de citas.</Text>
            ) : (
              historyCitas.map((cita) => (
                <View key={cita.citaid} style={styles.historyRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.historyDoctor}>{normalizeText(cita?.medico?.nombreCompleto || 'Especialista')}</Text>
                    <Text style={styles.historyDetail}>
                      {normalizeText(cita?.medico?.especialidad || 'Medicina General')} · {formatDateTime(cita.fechaHoraInicio)}
                    </Text>
                  </View>
                  <TouchableOpacity style={styles.historyBtn} onPress={() => showDetails(cita)}>
                    <Text style={styles.historyBtnText}>Detalle</Text>
                  </TouchableOpacity>
                </View>
              ))
            )}
          </View>
        </ScrollView>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: Platform.OS === 'web' ? 'row' : 'column',
    backgroundColor: colors.bg,
  },
  loaderWrap: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.bg },
  loaderText: { marginTop: 8, color: colors.muted, fontWeight: '700' },

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
  logoBox: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  logo: { width: 44, height: 44, resizeMode: 'contain' },
  logoTitle: { fontSize: 20, fontWeight: '800', color: colors.dark, letterSpacing: 0.5 },
  logoSubtitle: { fontSize: 11, fontWeight: '700', color: colors.muted },
  userBox: { marginTop: 18, alignItems: 'center', paddingVertical: 12 },
  userAvatar: { width: 76, height: 76, borderRadius: 76, marginBottom: 10, borderWidth: 4, borderColor: '#f5f7fb' },
  userName: { fontWeight: '800', color: colors.dark, fontSize: 14, textAlign: 'center' },
  userPlan: { color: colors.muted, fontSize: 11, fontWeight: '700', marginTop: 2, textAlign: 'center' },
  menu: { marginTop: 10, gap: 6, flex: Platform.OS === 'web' ? 1 : 0, flexDirection: Platform.OS === 'web' ? 'column' : 'row', flexWrap: 'wrap' },
  menuItemRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, paddingHorizontal: 12, borderRadius: 12, minWidth: Platform.OS === 'web' ? 0 : 150 },
  menuItemActive: { backgroundColor: 'rgba(19,127,236,0.10)', borderRightWidth: 3, borderRightColor: colors.primary },
  menuText: { fontSize: 14, fontWeight: '700', color: colors.muted },
  menuTextActive: { color: colors.primary },
  logoutButton: { flexDirection: 'row', gap: 10, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.blue, paddingVertical: 12, borderRadius: 12 },
  logoutText: { color: '#fff', fontWeight: '800' },

  main: { flex: 1, paddingHorizontal: Platform.OS === 'web' ? 26 : 14, paddingTop: Platform.OS === 'web' ? 18 : 12 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 14, flexWrap: 'wrap' },
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
  heading: { marginBottom: 12 },
  title: { fontSize: 32, fontWeight: '900', color: colors.dark },
  subtitle: { marginTop: 4, color: colors.muted, fontWeight: '700' },
  section: { marginTop: 10 },
  sectionTitle: { fontSize: 23, fontWeight: '900', color: colors.dark, marginBottom: 10 },
  emptyText: { color: colors.muted, fontWeight: '700', paddingVertical: 8 },
  citaCard: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e4edf7',
    borderRadius: 18,
    padding: 14,
    marginBottom: 10,
    flexDirection: 'row',
    gap: 12,
  },
  citaAvatar: { width: 58, height: 58, borderRadius: 58, borderWidth: 3, borderColor: '#f2f6fb' },
  citaDoctor: { color: colors.dark, fontWeight: '900', fontSize: 16 },
  citaDetail: { color: colors.muted, fontWeight: '700', marginTop: 2 },
  citaState: { color: colors.success, fontWeight: '800', marginTop: 4, fontSize: 12 },
  citaActions: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 10 },
  actionBlue: { backgroundColor: colors.primary, paddingVertical: 8, paddingHorizontal: 12, borderRadius: 10 },
  actionBlueText: { color: '#fff', fontWeight: '800', fontSize: 12 },
  actionGray: { backgroundColor: '#eef4fb', paddingVertical: 8, paddingHorizontal: 12, borderRadius: 10 },
  actionGrayText: { color: colors.blue, fontWeight: '800', fontSize: 12 },
  actionDisabled: { opacity: 0.65 },

  historyRow: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e4edf7',
    borderRadius: 14,
    padding: 12,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  historyDoctor: { color: colors.dark, fontWeight: '800' },
  historyDetail: { color: colors.muted, fontWeight: '700', marginTop: 2, fontSize: 12 },
  historyBtn: { backgroundColor: '#eef4fb', borderRadius: 10, paddingVertical: 8, paddingHorizontal: 10 },
  historyBtnText: { color: colors.blue, fontWeight: '800', fontSize: 12 },
});

export default PacienteCitasScreen;
