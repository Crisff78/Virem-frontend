import React, { useCallback, useMemo, useRef, useState } from 'react';
import {
<<<<<<< HEAD
  ActivityIndicator,
=======
  Alert,
>>>>>>> feature-cris
  Image,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
<<<<<<< HEAD
  View,
=======
  ScrollView,
  Platform,
  Dimensions,
>>>>>>> feature-cris
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';

import { resolveRemoteImageSource } from './utils/imageSources';
import { usePortalAwareNavigation } from './navigation/usePortalAwareNavigation';
import { usePacienteModule } from './navigation/PacienteModuleContext';
import { useAuth } from './providers/AuthProvider';
import { apiClient } from './utils/api';
import { useLanguage } from './localization/LanguageContext';
import {
  usePatientSessionProfile,
  type PatientSessionUser,
} from './hooks/usePatientSessionProfile';
import { ensurePatientSessionUser, getPatientDisplayName } from './utils/patientSession';
import { useResponsive } from './hooks/useResponsive';
import { ScreenScaffold } from './components/ScreenScaffold';
import { ResponsiveContainer } from './components/ResponsiveContainer';
import Skeleton from './components/Skeleton';
import FadeInView from './components/FadeInView';
import { spacing, radii } from './theme/spacing';
import { colors } from './theme/colors';

const DefaultAvatar = require('./assets/imagenes/avatar-default.jpg');

const MIN_REFRESH_INTERVAL_MS = 15000;

<<<<<<< HEAD


type CitaItem = {
  citaid: string;
  fechaHoraInicio: string | null;
  estado: string;
  modalidad?: string;
  medico?: {
    nombreCompleto?: string;
    especialidad?: string;
    fotoUrl?: string | null;
  };
};

type QuickAction = {
  key: string;
  icon: string;
  label: string;
  color: string;
  bg: string;
  route: string;
};

const QUICK_ACTIONS: QuickAction[] = [
  { key: 'find', icon: 'person-search', label: 'Buscar médico', color: colors.primary, bg: '#EBF8FF', route: 'NuevaConsultaPaciente' },
  { key: 'cit', icon: 'calendar-today', label: 'Mis citas', color: colors.success, bg: '#ECFDF5', route: 'PacienteCitas' },
  { key: 'video', icon: 'videocam', label: 'Sala virtual', color: '#8B5CF6', bg: '#F5F3FF', route: 'SalaEsperaVirtualPaciente' },
  { key: 'rx', icon: 'description', label: 'Recetas', color: colors.warning, bg: '#FFFBEB', route: 'PacienteRecetasDocumentos' },
];

const greetingFor = (date: Date): string => {
  const h = date.getHours();
  if (h < 12) return 'Buenos días';
  if (h < 19) return 'Buenas tardes';
  return 'Buenas noches';
=======
const colors = {
  primary: '#1e40af',
  brand: '#1e40af',
  dark: '#0f172a',
  muted: '#64748b',
  light: '#f8fafc',
  bg: '#f5f7fb',
  white: '#ffffff',
  green: '#22c55e',
  red: '#ef4444',
};

/* ===================== HELPERS ===================== */
const normalizeString = (value: unknown) => String(value || '').trim();
const sanitizeFotoUrl = (value: unknown) => {
  const clean = normalizeString(value);
  if (!clean || clean.toLowerCase().startsWith('blob:')) return '';
  return clean;
};
const resolveAvatarSource = (value: unknown): ImageSourcePropType => {
  const clean = sanitizeFotoUrl(value);
  return clean ? { uri: clean } : DefaultAvatar;
>>>>>>> feature-cris
};
const formatDateTime = (value: string | null) => {
  if (!value) return 'Sin horario';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Sin horario';
  return new Intl.DateTimeFormat('es-DO', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
};
const formatRelativeIn = (value: string | null) => {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const diffMs = date.getTime() - Date.now();
  const diffMin = Math.round(diffMs / 60000);
  if (diffMin <= 0) return 'Inicia pronto';
  if (diffMin < 60) return `en ${diffMin} min`;
  const diffHour = Math.round(diffMin / 60);
  if (diffHour < 24) return `en ${diffHour} h`;
  return `en ${Math.round(diffHour / 24)} día(s)`;
};
const parseDateMs = (value: string | null | undefined) => {
  if (!value) return Number.POSITIVE_INFINITY;
  const ms = new Date(value).getTime();
  return Number.isFinite(ms) ? ms : Number.POSITIVE_INFINITY;
};

<<<<<<< HEAD
const sortCitasByStartAsc = (items: CitaItem[]) =>
  [...items].sort((a, b) => parseDateMs(a?.fechaHoraInicio) - parseDateMs(b?.fechaHoraInicio));

const DashboardPacienteScreen: React.FC = () => {
  const navigation = usePortalAwareNavigation();
  const { isInsidePortal, setNotificationsOpen } = usePacienteModule();
  const { signOut } = useAuth();
  const { sessionUser, syncProfile } = usePatientSessionProfile();
  const { t } = useLanguage();
  const { fs, isDesktop, isTablet, width } = useResponsive();

  const [user, setUser] = useState<PatientSessionUser | null>(
    () => (ensurePatientSessionUser(sessionUser) as PatientSessionUser | null) || null
  );
  const [loadingUser, setLoadingUser] = useState(true);
  const [loadingCitas, setLoadingCitas] = useState(false);
  const [upcomingCitas, setUpcomingCitas] = useState<CitaItem[]>([]);
  const [searchText, setSearchText] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const lastRefreshRef = useRef(0);

  const fullName = useMemo(() => getPatientDisplayName(user, 'Paciente'), [user]);
  const firstName = useMemo(() => fullName.split(' ')[0] || 'Paciente', [fullName]);
  const greeting = useMemo(() => greetingFor(new Date()), []);
  const primaryCita = upcomingCitas[0] || null;
  const primaryCitaName = primaryCita?.medico?.nombreCompleto || 'tu próximo médico';
  const primaryCitaSpec = primaryCita?.medico?.especialidad || '';
  const unreadNotifications = 2; // hardcoded por ahora — en backend pendiente

  const loadData = useCallback(async () => {
    setLoadingUser(true);
    setErrorMessage('');
    try {
      const fresh = (await syncProfile()) as PatientSessionUser | null;
      setUser((ensurePatientSessionUser(fresh) as PatientSessionUser | null) || null);
    } catch {
      // perfil cacheado se mantiene
    } finally {
      setLoadingUser(false);
    }

    setLoadingCitas(true);
    try {
      const upcoming = await apiClient.get<any>('/api/agenda/me/citas', {
        authenticated: true,
        query: { scope: 'upcoming', limit: 5 },
      });
      if (upcoming?.success) {
        setUpcomingCitas(sortCitasByStartAsc(upcoming.citas || []));
      }
    } catch (error: any) {
      setErrorMessage(error?.message || 'No se pudieron cargar tus citas.');
    } finally {
      setLoadingCitas(false);
    }
=======
/* ===================== TIPOS ===================== */
type User = {
  usuarioid?: number | string;
  nombres?: string;
  apellidos?: string;
  plan?: string;
  fotoUrl?: string;
};

type CitaItem = {
  citaid: string;
  fechaHoraInicio: string | null;
  estado: string;
  medico?: {
    nombreCompleto?: string;
    especialidad?: string;
    fotoUrl?: string | null;
  };
};

type NotificationItem = {
  id: string;
  titulo: string;
  contenido: string;
  leida: boolean;
  createdAt: string;
  tipo?: string;
};

/* ===================== PANTALLA ===================== */
const DashboardPacienteScreen: React.FC = () => {
  const navigation = usePortalAwareNavigation();
  const { isInsidePortal, isSidebarOpen, toggleSidebar } = usePacienteModule();
  const { signOut } = useAuth();
  const { sessionUser, syncProfile } = usePatientSessionProfile();
  const { t } = useLanguage();
  const { isDesktop, isTablet, isMobile, select, fs, rs, wp, hp } = useResponsive();
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isExpressModalOpen, setIsExpressModalOpen] = useState(true);
  const [user, setUser] = useState<User | null>(() => (ensurePatientSessionUser(sessionUser) as User | null) || null);
  const [loadingCitas, setLoadingCitas] = useState(false);
  const [upcomingCitas, setUpcomingCitas] = useState<CitaItem[]>([]);
  const [historyCitas, setHistoryCitas] = useState<CitaItem[]>([]);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const lastRefreshRef = useRef(0);

  useEffect(() => {
    if (sessionUser) {
      setUser((ensurePatientSessionUser(sessionUser) as User | null) || null);
    }
  }, [sessionUser]);

  // --- Sub-componentes internos ---
  const AppointmentRow: React.FC<{ name: string; detail: string; avatar: ImageSourcePropType; onPress?: () => void }> = ({ name, detail, avatar, onPress }) => (
    <View style={styles.docRow}>
      <View style={styles.docLeft}>
        <View style={styles.docIconBox}>
          <Image source={avatar} style={styles.docAvatar} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.docTitle} numberOfLines={1}>{name}</Text>
          <Text style={styles.docSub} numberOfLines={1}>{detail}</Text>
        </View>
      </View>
      <TouchableOpacity onPress={onPress}>
        <MaterialIcons name="chevron-right" size={20} color={colors.muted} />
      </TouchableOpacity>
    </View>
  );

  // -------------------------------------------------------------
  // ESTILOS DINÁMICOS
  // -------------------------------------------------------------
  const styles = useMemo(() => StyleSheet.create({
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
      backgroundColor: colors.brand,
      paddingVertical: 12,
      borderRadius: 12,
      marginTop: 20,
    },
    logoutText: {
      color: '#fff',
      fontWeight: '800',
    },

    container: { flex: 1, backgroundColor: '#F6FAFD' },
    
    // Sidebar Overlay (Drawer)
    overlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.4)', zIndex: 2000 },
    drawer: { position: 'absolute', top: 0, bottom: 0, backgroundColor: '#fff', zIndex: 2001, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 10, elevation: 5 },
    drawerLeft: { left: 0, width: rs(300) },
    drawerRight: { right: 0, width: rs(320) },

    drawerHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: rs(16), borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
    drawerTitle: { fontSize: fs(18), fontWeight: '900', color: colors.dark },

    sidebar: { flex: 1, backgroundColor: colors.white, justifyContent: 'space-between', padding: rs(20) },

    logoBox: { flexDirection: 'row', alignItems: 'center', gap: rs(10) },
    logo: { width: rs(44), height: rs(44), resizeMode: 'contain' },
    logoTitle: { fontSize: fs(20), fontWeight: '800', color: colors.dark },
    logoSubtitle: { fontSize: fs(11), fontWeight: '700', color: colors.muted },

    userBox: { marginTop: rs(18), alignItems: 'center', paddingVertical: rs(12) },
    userAvatar: { width: rs(70), height: rs(70), borderRadius: rs(70), marginBottom: rs(10), borderWidth: 4, borderColor: '#f5f7fb' },
    userName: { fontWeight: '800', color: colors.dark, fontSize: fs(14), textAlign: 'center' },
    userPlan: { color: colors.muted, fontSize: fs(11), fontWeight: '700', marginTop: rs(2), textAlign: 'center' },

    main: { flex: 1, paddingHorizontal: rs(24), paddingTop: rs(12) },
    mainMobile: { paddingHorizontal: rs(14), paddingTop: rs(8) },

    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: rs(12), marginBottom: rs(2) },
    headerLeft: { flexDirection: 'row', alignItems: 'center', gap: rs(12) },
    menuToggle: { width: rs(40), height: rs(40), alignItems: 'center', justifyContent: 'center', borderRadius: rs(10), backgroundColor: '#fff', shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 5, elevation: 2 },
    
    notifBtn: { width: rs(40), height: rs(40), borderRadius: rs(12), backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', shadowColor: colors.dark, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
    notifDot: { position: 'absolute', top: rs(8), right: rs(8), width: rs(8), height: rs(8), borderRadius: rs(8), backgroundColor: '#ef4444', borderWidth: 2, borderColor: '#fff' },

    title: { fontSize: fs(22), fontWeight: '900', color: colors.dark, marginTop: 0 },
    subtitle: { fontSize: fs(13), color: colors.muted, marginTop: rs(4), marginBottom: rs(16), fontWeight: '600' },

    bigCard: { backgroundColor: '#fff', borderRadius: rs(24), padding: rs(16), flexDirection: isDesktop ? 'row' : 'column', gap: rs(16), marginBottom: rs(20), shadowColor: colors.dark, shadowOpacity: 0.06, shadowRadius: 12, elevation: 3 },
    bigCardLeft: { flex: 1 },
    bigCardRight: { width: isDesktop ? rs(160) : '100%', justifyContent: 'center', alignItems: 'center' },
    bigCardImage: { width: rs(130), height: rs(130), borderRadius: rs(20) },
    liveRow: { flexDirection: 'row', alignItems: 'center', gap: rs(8), marginBottom: rs(10) },
    liveDot: { width: rs(10), height: rs(10), borderRadius: rs(10), backgroundColor: '#22c55e' },
    liveText: { color: colors.primary, fontSize: fs(11), fontWeight: '900', letterSpacing: 1, textTransform: 'uppercase' },
    bigCardTitle: { fontSize: fs(16), fontWeight: '900', color: colors.dark, marginBottom: rs(6) },
    bigCardSub: { fontSize: fs(13), color: colors.muted, fontWeight: '700', marginBottom: rs(14) },
    bigCardActions: { flexDirection: 'row', flexWrap: 'wrap', gap: rs(10) },
    primaryBtn: { flexDirection: 'row', alignItems: 'center', gap: rs(8), backgroundColor: colors.primary, paddingVertical: rs(12), paddingHorizontal: rs(16), borderRadius: rs(16), shadowColor: colors.primary, shadowOpacity: 0.3, shadowRadius: 8, elevation: 3 },
    primaryBtnText: { color: '#fff', fontWeight: '900', fontSize: fs(14) },
    secondaryBtn: { backgroundColor: '#f1f5f9', paddingVertical: rs(12), paddingHorizontal: rs(16), borderRadius: rs(16) },
    secondaryBtnText: { color: colors.muted, fontWeight: '900', fontSize: fs(14) },

    quickRow: { flexDirection: 'row', gap: rs(10), marginBottom: rs(18), flexWrap: 'wrap' },
    quickTile: { flex: 1, minWidth: rs(100), backgroundColor: '#fff', borderRadius: rs(16), paddingVertical: rs(16), paddingHorizontal: rs(10), alignItems: 'center', borderWidth: 1, borderColor: '#eef3fa', shadowColor: colors.dark, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
    quickTileIcon: { width: rs(44), height: rs(44), borderRadius: rs(12), alignItems: 'center', justifyContent: 'center', marginBottom: rs(8) },
    quickTileLabel: { fontSize: fs(12), fontWeight: '800', color: colors.dark, textAlign: 'center' },

    twoCols: { flexDirection: isDesktop ? 'row' : 'column', gap: rs(16), marginTop: rs(16) },
    colLeft: { flex: 2 },
    colRight: { flex: 1.2 },
    sectionTitle: { fontSize: fs(15), fontWeight: '900', color: colors.dark, marginBottom: rs(10), marginTop: rs(10) },
    rowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    link: { color: colors.primary, fontWeight: '900', fontSize: fs(12) },

    docRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: rs(12), borderBottomWidth: 1, borderBottomColor: '#eef2f7' },
    docLeft: { flexDirection: 'row', alignItems: 'center', gap: rs(12), flex: 1 },
    docIconBox: { width: rs(40), height: rs(40), borderRadius: rs(12), backgroundColor: '#f4f8fc', alignItems: 'center', justifyContent: 'center' },
    docAvatar: { width: '100%', height: '100%', borderRadius: rs(12) },
    docTitle: { color: colors.dark, fontWeight: '700', fontSize: fs(13) },
    docSub: { color: colors.muted, fontSize: fs(11), marginTop: rs(2) },

    emptyCard: { alignItems: 'center', padding: rs(24), backgroundColor: '#fff', borderRadius: rs(18), borderWidth: 1, borderColor: '#eef2f7', borderStyle: 'dashed', marginTop: rs(10) },
    emptyText: { color: colors.muted, fontWeight: '600', marginTop: rs(10), fontSize: fs(14) },

    expressBanner: { backgroundColor: '#0f172a', borderRadius: rs(20), padding: rs(18), flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: rs(24), shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 10, elevation: 4 },
    expressLeft: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: rs(14) },
    expressIconBox: { width: rs(44), height: rs(44), borderRadius: rs(44), backgroundColor: 'rgba(255,255,255,0.1)', alignItems: 'center', justifyContent: 'center' },
    expressTitle: { color: '#fff', fontSize: fs(16), fontWeight: '900' },
    expressSub: { color: 'rgba(255,255,255,0.6)', fontSize: fs(12), fontWeight: '600', marginTop: rs(2) },
    expressBtn: { backgroundColor: colors.primary, paddingVertical: rs(10), paddingHorizontal: rs(16), borderRadius: rs(12), flexDirection: 'row', alignItems: 'center', gap: rs(6) },
    expressBtnText: { color: '#fff', fontWeight: '900', fontSize: fs(13) },

    // Notificaciones List
    notifItem: { padding: rs(14), borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
    notifUnread: { backgroundColor: 'rgba(30,64,175,0.03)' },
    notifTitle: { fontWeight: '800', color: colors.dark, fontSize: fs(13) },
    notifMsg: { color: colors.muted, fontSize: fs(12), marginTop: rs(4), lineHeight: fs(18) },
    notifTime: { color: '#94a3b8', fontSize: fs(11), marginTop: rs(6), fontWeight: '700' },

    // Modal Express
    modalOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.6)', zIndex: 3000, alignItems: 'center', justifyContent: 'center', padding: rs(20) },
    modalContent: { backgroundColor: '#0f172a', borderRadius: rs(28), padding: rs(24), width: '100%', maxWidth: rs(450), shadowColor: '#000', shadowOpacity: 0.3, shadowRadius: 20, elevation: 10 },
    modalHeader: { flexDirection: 'row', justifyContent: 'flex-end', marginBottom: rs(10) },
    modalIconBox: { width: rs(60), height: rs(60), borderRadius: rs(30), backgroundColor: 'rgba(255,255,255,0.1)', alignItems: 'center', justifyContent: 'center', marginBottom: rs(20), alignSelf: 'center' },
    modalTitle: { color: '#fff', fontSize: fs(22), fontWeight: '900', textAlign: 'center', marginBottom: rs(10) },
    modalSub: { color: 'rgba(255,255,255,0.7)', fontSize: fs(14), fontWeight: '600', textAlign: 'center', lineHeight: fs(20), marginBottom: rs(24) },
    modalAction: { backgroundColor: colors.primary, paddingVertical: rs(16), borderRadius: rs(18), flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: rs(10) },
    modalActionText: { color: '#fff', fontWeight: '900', fontSize: fs(16) },
  }), [fs, rs, isDesktop]);

  const loadData = useCallback(async () => {
    try {
      const sessionUser = (await syncProfile()) as PatientSessionUser | null;
      setUser((ensurePatientSessionUser(sessionUser) as User | null) || null);

      setLoadingCitas(true);
      try {
        const [up, hist, notifs] = await Promise.all([
          apiClient.get<any>('/api/agenda/me/citas', { authenticated: true, query: { scope: 'upcoming', limit: 5 } }),
          apiClient.get<any>('/api/agenda/me/citas', { authenticated: true, query: { scope: 'history', limit: 5 } }),
          apiClient.get<any>('/api/agenda/me/notificaciones', { authenticated: true, query: { limit: 15 } }),
        ]);
        if (up?.success) setUpcomingCitas(up.citas.sort((a: any, b: any) => parseDateMs(a.fechaHoraInicio) - parseDateMs(b.fechaHoraInicio)));
        if (hist?.success) setHistoryCitas(hist.citas);
        if (notifs?.success) setNotifications(notifs.notificaciones || []);
      } finally {
        setLoadingCitas(false);
      }
    } catch {}
>>>>>>> feature-cris
  }, [syncProfile]);

  useFocusEffect(
    useCallback(() => {
      const now = Date.now();
      if (now - lastRefreshRef.current > MIN_REFRESH_INTERVAL_MS) {
        lastRefreshRef.current = now;
        loadData();
      }
    }, [loadData])
  );

<<<<<<< HEAD
  const handleLogout = useCallback(async () => {
=======
  const handleLogout = async () => {
>>>>>>> feature-cris
    await signOut();
    navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
  }, [navigation, signOut]);

<<<<<<< HEAD
  const handleNuevaConsulta = useCallback(() => {
    navigation.navigate('NuevaConsultaPaciente');
  }, [navigation]);

  const handleQuickAction = useCallback(
    (route: string) => {
      navigation.navigate(route as any);
    },
    [navigation]
  );

  const handleSearchSubmit = useCallback(() => {
    navigation.navigate('NuevaConsultaPaciente' as any);
  }, [navigation]);

  const handleNotificationsPress = useCallback(() => {
    setNotificationsOpen(true);
  }, [setNotificationsOpen]);

  const handleVerCitas = useCallback(() => {
    navigation.navigate('PacienteCitas' as any);
  }, [navigation]);

  const numColumns = isDesktop ? 4 : isTablet ? 4 : width >= 380 ? 4 : 2;
  const quickGap = spacing.md;

  // Bloque de contenido (no incluye sidebar — ya lo provee el portal cuando aplica).
  const content = (
    <ScrollView
      style={styles.flex}
      contentContainerStyle={[styles.scroll, { paddingHorizontal: spacing.base }]}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      <ResponsiveContainer maxWidth={1100} horizontalPadding={0}>
        <FadeInView>
          {/* Header */}
          <View style={styles.headerRow}>
            <View style={styles.searchBox}>
              <MaterialIcons name="search" size={20} color={colors.muted} />
              <TextInput
                placeholder="Busca un médico o especialidad..."
                placeholderTextColor={colors.muted}
                value={searchText}
                onChangeText={setSearchText}
                onSubmitEditing={handleSearchSubmit}
                returnKeyType="search"
                style={[styles.searchInput, { fontSize: fs(13) }]}
                accessibilityLabel="Buscar médico"
              />
            </View>

            <TouchableOpacity
              style={styles.iconBtn}
              onPress={handleNotificationsPress}
              accessibilityRole="button"
              accessibilityLabel="Ver notificaciones"
            >
              <MaterialIcons name="notifications" size={22} color={colors.dark} />
              {unreadNotifications > 0 ? (
                <View style={styles.notifBadge}>
                  <Text style={styles.notifBadgeText} numberOfLines={1}>
                    {unreadNotifications > 9 ? '9+' : unreadNotifications}
                  </Text>
                </View>
              ) : null}
            </TouchableOpacity>

            {!isInsidePortal ? (
              <TouchableOpacity
                style={[styles.iconBtn, styles.iconBtnDanger]}
                onPress={handleLogout}
                accessibilityRole="button"
                accessibilityLabel="Cerrar sesión"
              >
                <MaterialIcons name="logout" size={20} color={colors.danger} />
              </TouchableOpacity>
            ) : null}
          </View>

          {/* Greeting */}
          <View style={styles.greetingBlock}>
            {loadingUser ? (
              <>
                <Skeleton width={180} height={fs(18)} borderRadius={6} />
                <View style={{ height: spacing.xs }} />
                <Skeleton width={240} height={fs(28)} borderRadius={6} />
              </>
            ) : (
              <>
                <Text style={[styles.greetingText, { fontSize: fs(14) }]} numberOfLines={1}>
                  {greeting},
                </Text>
                <Text style={[styles.title, { fontSize: fs(28) }]} numberOfLines={2}>
                  {firstName} 👋
                </Text>
              </>
            )}
            <Text style={[styles.subtitle, { fontSize: fs(13) }]} numberOfLines={2}>
              Aquí tienes un resumen de tu actividad médica.
            </Text>
          </View>

          {/* Big card — próxima cita / CTA */}
          <View style={styles.bigCard}>
            {loadingCitas || loadingUser ? (
              <View style={{ gap: spacing.sm }}>
                <Skeleton width="80%" height={fs(20)} borderRadius={6} style={styles.skeletonOnPrimary} />
                <Skeleton width="60%" height={fs(14)} borderRadius={6} style={styles.skeletonOnPrimary} />
                <Skeleton width={140} height={42} borderRadius={radii.md} style={styles.skeletonOnPrimary} />
              </View>
            ) : (
              <>
                <View style={styles.bigCardHeader}>
                  <View style={styles.bigCardLabelPill}>
                    <MaterialIcons
                      name={primaryCita ? 'event-available' : 'event-busy'}
                      size={14}
                      color="#fff"
                    />
                    <Text style={styles.bigCardLabel} numberOfLines={1}>
                      {primaryCita ? 'Próxima cita' : 'Sin citas'}
                    </Text>
                  </View>
                  {primaryCita ? (
                    <Text style={styles.bigCardRelative} numberOfLines={1}>
                      {formatRelativeIn(primaryCita.fechaHoraInicio)}
                    </Text>
                  ) : null}
                </View>

                <Text style={[styles.bigCardTitle, { fontSize: fs(20) }]} numberOfLines={2}>
                  {primaryCita ? `Cita con ${primaryCitaName}` : 'No tienes citas próximas'}
                </Text>
                {primaryCita ? (
                  <Text style={[styles.bigCardSub, { fontSize: fs(13) }]} numberOfLines={2}>
                    {primaryCitaSpec ? `${primaryCitaSpec} · ` : ''}
                    {formatDateTime(primaryCita.fechaHoraInicio)}
                  </Text>
                ) : (
                  <Text style={[styles.bigCardSub, { fontSize: fs(13) }]} numberOfLines={2}>
                    Agenda una nueva consulta para empezar a cuidar tu salud.
                  </Text>
                )}

                <View style={styles.bigCardActions}>
                  <TouchableOpacity
                    style={styles.primaryBtn}
                    onPress={handleNuevaConsulta}
                    accessibilityRole="button"
                  >
                    <MaterialIcons name="add" size={18} color={colors.primary} />
                    <Text style={[styles.primaryBtnText, { fontSize: fs(13) }]} numberOfLines={1}>
                      Nueva consulta
                    </Text>
                  </TouchableOpacity>
                  {primaryCita ? (
                    <TouchableOpacity
                      style={styles.ghostBtn}
                      onPress={handleVerCitas}
                      accessibilityRole="button"
                    >
                      <Text style={[styles.ghostBtnText, { fontSize: fs(13) }]} numberOfLines={1}>
                        Ver agenda
                      </Text>
                    </TouchableOpacity>
                  ) : null}
                </View>
              </>
            )}
          </View>


          {/* Quick actions */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { fontSize: fs(15) }]}>Accesos rápidos</Text>
          </View>
          <View style={[styles.quickGrid, { gap: quickGap }]}>
            {QUICK_ACTIONS.map((action) => {
              const itemWidth =
                numColumns === 2
                  ? '48%'
                  : `${100 / numColumns - (numColumns - 1) * 0.5}%`;
              return (
                <Pressable
                  key={action.key}
                  onPress={() => handleQuickAction(action.route)}
                  style={({ pressed, hovered }: any) => [
                    styles.quickItem,
                    { width: itemWidth as any },
                    hovered && styles.quickItemHover,
                    pressed && styles.quickItemPressed,
                  ]}
                  accessibilityRole="button"
                  accessibilityLabel={action.label}
                >
                  <View style={[styles.quickIcon, { backgroundColor: action.bg }]}>
                    <MaterialIcons name={action.icon} size={22} color={action.color} />
                  </View>
                  <Text
                    style={[styles.quickLabel, { fontSize: fs(12) }]}
                    numberOfLines={2}
                  >
                    {action.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          {/* Citas pendientes */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { fontSize: fs(15) }]}>Citas pendientes</Text>
            {upcomingCitas.length > 0 ? (
              <TouchableOpacity onPress={handleVerCitas} accessibilityRole="button">
                <Text style={[styles.sectionAction, { fontSize: fs(12) }]}>Ver todas</Text>
              </TouchableOpacity>
            ) : null}
          </View>

          {errorMessage ? (
            <View style={styles.errorCard}>
              <MaterialIcons name="error-outline" size={20} color={colors.danger} />
              <Text style={[styles.errorText, { fontSize: fs(13) }]} numberOfLines={3}>
                {errorMessage}
              </Text>
              <TouchableOpacity onPress={loadData} accessibilityRole="button">
                <Text style={[styles.errorRetry, { fontSize: fs(13) }]}>Reintentar</Text>
              </TouchableOpacity>
            </View>
          ) : loadingCitas ? (
            <View style={{ gap: spacing.sm }}>
              <Skeleton width="100%" height={84} borderRadius={radii.lg} />
              <Skeleton width="100%" height={84} borderRadius={radii.lg} />
            </View>
          ) : upcomingCitas.length > 0 ? (
            <View style={{ gap: spacing.sm }}>
              {upcomingCitas.map((cita) => (
                <Pressable
                  key={cita.citaid}
                  onPress={handleVerCitas}
                  style={({ pressed, hovered }: any) => [
                    styles.apptCard,
                    hovered && styles.apptCardHover,
                    pressed && styles.apptCardPressed,
                  ]}
                  accessibilityRole="button"
                  accessibilityLabel={`Cita con ${cita.medico?.nombreCompleto || 'médico'}`}
                >
                  <Image
                    source={resolveRemoteImageSource(cita.medico?.fotoUrl, DefaultAvatar)}
                    style={styles.apptAvatar}
                  />
                  <View style={styles.apptBody}>
                    <Text
                      style={[styles.apptDoctor, { fontSize: fs(14) }]}
                      numberOfLines={1}
                    >
                      {cita.medico?.nombreCompleto || 'Médico asignado'}
                    </Text>
                    {cita.medico?.especialidad ? (
                      <Text
                        style={[styles.apptSpec, { fontSize: fs(12) }]}
                        numberOfLines={1}
                      >
                        {cita.medico.especialidad}
                      </Text>
                    ) : null}
                    <Text
                      style={[styles.apptDetail, { fontSize: fs(12) }]}
                      numberOfLines={1}
                    >
                      {formatDateTime(cita.fechaHoraInicio)}
                    </Text>
                  </View>
                  <View style={styles.apptRight}>
                    <View style={styles.apptStatusPill}>
                      <Text style={styles.apptStatusText} numberOfLines={1}>
                        {formatRelativeIn(cita.fechaHoraInicio) || cita.estado || 'Confirmada'}
                      </Text>
                    </View>
                    <MaterialIcons
                      name="chevron-right"
                      size={20}
                      color={colors.muted}
                    />
                  </View>
                </Pressable>
              ))}
            </View>
          ) : (
            <View style={styles.emptyCard}>
              <View style={styles.emptyIconWrap}>
                <MaterialIcons name="event-busy" size={28} color={colors.primary} />
              </View>
              <Text style={[styles.emptyTitle, { fontSize: fs(14) }]}>
                Sin citas programadas
              </Text>
              <Text
                style={[styles.emptySub, { fontSize: fs(12) }]}
                numberOfLines={2}
              >
                Cuando agendes una consulta, aparecerá aquí.
              </Text>
              <TouchableOpacity
                style={styles.emptyCta}
                onPress={handleNuevaConsulta}
                accessibilityRole="button"
              >
                <MaterialIcons name="add" size={16} color="#fff" />
                <Text style={[styles.emptyCtaText, { fontSize: fs(13) }]}>
                  Agendar consulta
                </Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Express Consultation Card */}
          <View style={styles.expressCard}>
            <View style={styles.expressLeft}>
              <View style={styles.expressIconWrap}>
                <MaterialIcons name="bolt" size={24} color="#fff" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.expressTitle, { fontSize: fs(18) }]}>¿Necesitas atención inmediata?</Text>
                <Text style={[styles.expressSubtitle, { fontSize: fs(12) }]}>
                  Médicos de guardia disponibles 24/7 para videoconsultas de urgencia.
                </Text>
              </View>
            </View>

            <TouchableOpacity
              style={styles.expressBtn}
              onPress={() => navigation.navigate('NuevaConsultaPaciente')}
            >
              <Text style={[styles.expressBtnText, { fontSize: fs(13) }]}>Consulta Express</Text>
              <MaterialIcons name="arrow-forward" size={16} color="#fff" />
            </TouchableOpacity>
          </View>

          <View style={{ height: spacing.xxl }} />
        </FadeInView>
      </ResponsiveContainer>
    </ScrollView>
  );

  // Si está dentro del portal, no renderizamos SafeArea (lo maneja el portal).
  if (isInsidePortal) {
    return <View style={styles.portalRoot}>{content}</View>;
  }

  return (
    <ScreenScaffold scroll={false} background={colors.bg}>
      {content}
    </ScreenScaffold>
=======
  const fullName = useMemo(() => getPatientDisplayName(user, 'Paciente'), [user]);
  const userAvatarSource = resolveAvatarSource(user?.fotoUrl);
  const primaryCita = upcomingCitas[0] || null;
  const unreadCount = notifications.filter(n => !n.leida).length;


  return (
    <View style={styles.container}>

      {/* Drawer Overlay for Notifications (Optional: keep separate or unify) */}
      {isNotificationsOpen && (
        <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={() => setIsNotificationsOpen(false)} />
      )}
      {/* Ya no hay sidebar fija en Desktop. Todo se maneja a través del Drawer (Hamburguesa). */}

      {/* Notificaciones Sidebar (Drawer Derecho) */}
      {isNotificationsOpen && (
        <View style={[styles.drawer, styles.drawerRight]}>
          <View style={styles.drawerHeader}>
            <Text style={styles.drawerTitle}>Notificaciones</Text>
            <TouchableOpacity onPress={() => setIsNotificationsOpen(false)}>
              <MaterialIcons name="close" size={24} color={colors.dark} />
            </TouchableOpacity>
          </View>
          <ScrollView>
            {notifications.length > 0 ? (
              notifications.map((n) => (
                <TouchableOpacity key={n.id} style={[styles.notifItem, !n.leida && styles.notifUnread]}>
                  <Text style={styles.notifTitle}>{n.titulo}</Text>
                  <Text style={styles.notifMsg} numberOfLines={2}>{n.contenido}</Text>
                  <Text style={styles.notifTime}>Hace un momento</Text>
                </TouchableOpacity>
              ))
            ) : (
              <View style={[styles.emptyCard, { borderStyle: 'solid', marginTop: rs(40) }]}>
                <MaterialIcons name="notifications-none" size={40} color={colors.muted} />
                <Text style={styles.emptyText}>No tienes notificaciones</Text>
              </View>
            )}
          </ScrollView>
        </View>
      )}

      {/* Modal Consulta Express */}
      {isExpressModalOpen && (
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <TouchableOpacity style={styles.modalHeader} onPress={() => setIsExpressModalOpen(false)}>
              <MaterialIcons name="close" size={24} color="rgba(255,255,255,0.5)" />
            </TouchableOpacity>
            
            <View style={styles.modalIconBox}>
              <MaterialIcons name="emergency" size={32} color="#fff" />
            </View>

            <Text style={styles.modalTitle}>¿Necesitas atención inmediata?</Text>
            <Text style={styles.modalSub}>
              Contamos con médicos de guardia disponibles 24/7 para videoconsultas de urgencia.
            </Text>

            <TouchableOpacity style={styles.modalAction} onPress={() => { setIsExpressModalOpen(false); navigation.navigate('EspecialistasPorEspecialidad', { specialty: 'Medicina General' }); }}>
              <MaterialIcons name="bolt" size={20} color="#fff" />
              <Text style={styles.modalActionText}>Iniciar Consulta Express</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Main Content */}
      <View style={{ flex: 1 }}>
        <View style={[styles.header, { paddingHorizontal: rs(24), paddingTop: rs(12), backgroundColor: '#F6FAFD', zIndex: 10, borderBottomWidth: 1, borderBottomColor: '#eef4fb' }]}>
          <View style={styles.headerLeft}>
            {!isSidebarOpen && (
              <TouchableOpacity style={styles.menuToggle} onPress={toggleSidebar}>
                <MaterialIcons name="menu" size={24} color={colors.dark} />
              </TouchableOpacity>
            )}
            <Text style={styles.title}>Hola, {fullName.split(' ')[0]}</Text>
          </View>
          <View style={{ flexDirection: 'row', gap: rs(10) }}>
            <TouchableOpacity style={styles.notifBtn} onPress={() => setIsNotificationsOpen(true)}>
              <MaterialIcons name="notifications" size={22} color={colors.dark} />
              {unreadCount > 0 && <View style={styles.notifDot} />}
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView style={[styles.main, !isDesktop && styles.mainMobile]} contentContainerStyle={{ paddingBottom: 40 }}>
          <Text style={styles.subtitle}>Gestiona tus consultas y salud desde aquí.</Text>

          {/* Big Card */}
          <View style={styles.bigCard}>
            <View style={styles.bigCardLeft}>
              <View style={styles.liveRow}>
                <View style={[styles.liveDot, { backgroundColor: primaryCita ? colors.green : colors.primary }]} />
                <Text style={styles.liveText}>{primaryCita ? 'Cita próxima' : 'Sistema listo'}</Text>
              </View>
              <Text style={styles.bigCardTitle}>
                {primaryCita ? `Tienes una cita con ${primaryCita.medico?.nombreCompleto}` : `¡Bienvenido de nuevo, ${fullName.split(' ')[0]}!`}
              </Text>
              <Text style={styles.bigCardSub}>
                {primaryCita 
                  ? `${formatDateTime(primaryCita.fechaHoraInicio)} (${formatRelativeIn(primaryCita.fechaHoraInicio)})` 
                  : '¿Necesitas hablar con un especialista? Agenda tu consulta ahora.'}
              </Text>
              <View style={styles.bigCardActions}>
                {primaryCita ? (
                  <>
                    <TouchableOpacity style={styles.primaryBtn} onPress={() => navigation.navigate('PacienteChat')}>
                      <MaterialIcons name="videocam" size={20} color="#fff" />
                      <Text style={styles.primaryBtnText}>Entrar a consulta</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.secondaryBtn} onPress={() => navigation.navigate('PacienteCitas')}>
                      <Text style={styles.secondaryBtnText}>Ver detalles</Text>
                    </TouchableOpacity>
                  </>
                ) : (
                  <TouchableOpacity style={styles.primaryBtn} onPress={() => navigation.navigate('NuevaConsultaPaciente')}>
                    <MaterialIcons name="add" size={20} color="#fff" />
                    <Text style={styles.primaryBtnText}>Nueva consulta</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
            <View style={styles.bigCardRight}>
              <Image source={primaryCita ? resolveAvatarSource(primaryCita.medico?.fotoUrl) : userAvatarSource} style={styles.bigCardImage} />
            </View>
          </View>

          {/* Quick Actions */}
          <View style={styles.quickRow}>
            <TouchableOpacity style={styles.quickTile} onPress={() => navigation.navigate('NuevaConsultaPaciente')}>
              <View style={[styles.quickTileIcon, { backgroundColor: 'rgba(19,127,236,0.1)' }]}>
                <MaterialIcons name="add-circle" size={24} color={colors.primary} />
              </View>
              <Text style={styles.quickTileLabel}>Agendar</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.quickTile} onPress={() => navigation.navigate('PacienteCitas')}>
              <View style={[styles.quickTileIcon, { backgroundColor: 'rgba(34,197,94,0.1)' }]}>
                <MaterialIcons name="event" size={24} color="#22c55e" />
              </View>
              <Text style={styles.quickTileLabel}>Mis Citas</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.quickTile} onPress={() => navigation.navigate('PacienteRecetasDocumentos')}>
              <View style={[styles.quickTileIcon, { backgroundColor: 'rgba(245,158,11,0.1)' }]}>
                <MaterialIcons name="description" size={24} color="#f59e0b" />
              </View>
              <Text style={styles.quickTileLabel}>Recetas</Text>
            </TouchableOpacity>
          </View>

          {/* Two Columns */}
          <View style={styles.twoCols}>
            <View style={styles.colLeft}>
              <View style={styles.rowBetween}>
                <Text style={styles.sectionTitle}>Próximas consultas</Text>
                <TouchableOpacity onPress={() => navigation.navigate('PacienteCitas')}>
                  <Text style={styles.link}>Ver todas</Text>
                </TouchableOpacity>
              </View>
              {upcomingCitas.length > 0 ? (
                upcomingCitas.map((cita) => (
                  <AppointmentRow 
                    key={cita.citaid}
                    name={cita.medico?.nombreCompleto || 'Médico'}
                    detail={`${cita.medico?.especialidad || 'Consulta'} • ${formatDateTime(cita.fechaHoraInicio)}`}
                    avatar={resolveAvatarSource(cita.medico?.fotoUrl)}
                    onPress={() => navigation.navigate('PacienteCitas')}
                  />
                ))
              ) : (
                <View style={styles.emptyCard}>
                  <MaterialIcons name="event-busy" size={32} color={colors.muted} />
                  <Text style={styles.emptyText}>No tienes citas programadas</Text>
                </View>
              )}
            </View>

            <View style={styles.colRight}>
              <View style={styles.rowBetween}>
                <Text style={styles.sectionTitle}>Médicos recientes</Text>
                <TouchableOpacity>
                  <Text style={styles.link}>Ver todos</Text>
                </TouchableOpacity>
              </View>
              {historyCitas.slice(0, 3).length > 0 ? (
                historyCitas.slice(0, 3).map((cita) => (
                  <AppointmentRow 
                    key={cita.citaid}
                    name={cita.medico?.nombreCompleto || 'Médico'}
                    detail={cita.medico?.especialidad || 'Medicina General'}
                    avatar={resolveAvatarSource(cita.medico?.fotoUrl)}
                  />
                ))
              ) : (
                <View style={styles.emptyCard}>
                  <MaterialIcons name="history" size={32} color={colors.muted} />
                  <Text style={styles.emptyText}>Sin historial reciente</Text>
                </View>
              )}
            </View>
          </View>

        </ScrollView>
      </View>
    </View>
>>>>>>> feature-cris
  );
};

export default DashboardPacienteScreen;

const styles = StyleSheet.create({
  flex: { flex: 1 },
  portalRoot: { flex: 1, backgroundColor: colors.bg },
  scroll: {
    paddingTop: spacing.base,
    paddingBottom: spacing.xxxl,
  },

  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.base,
  },
  searchBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    paddingHorizontal: spacing.md,
    minHeight: 44,
    borderWidth: 1,
    borderColor: colors.border,
  },
  searchInput: { flex: 1, color: colors.dark, paddingVertical: spacing.sm },

  iconBtn: {
    width: 44,
    height: 44,
    borderRadius: radii.md,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  iconBtnDanger: {},

  notifBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    paddingHorizontal: 4,
    backgroundColor: colors.danger,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.surface,
  },
  notifBadgeText: { color: '#fff', fontSize: 9, fontWeight: '800' },

  greetingBlock: { marginTop: spacing.xs },
  greetingText: { color: colors.muted, fontWeight: '700' },
  title: { fontWeight: '900', color: colors.dark, marginTop: spacing.xxs },
  subtitle: {
    color: colors.muted,
    marginTop: spacing.xs,
    marginBottom: spacing.base,
    lineHeight: 18,
  },

  bigCard: {
    backgroundColor: colors.primary,
    borderRadius: radii.xl,
    padding: spacing.xl,
    marginTop: spacing.sm,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: colors.primary,
        shadowOpacity: 0.25,
        shadowRadius: 20,
        shadowOffset: { width: 0, height: 8 },
      },
      android: { elevation: 6 },
      web: { boxShadow: '0 8px 24px rgba(43,108,176,0.25)' as any },
    }),
  },
  bigCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  bigCardLabelPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255,255,255,0.18)',
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radii.pill,
  },
  bigCardLabel: { color: '#fff', fontWeight: '800', fontSize: 11, letterSpacing: 0.4 },
  bigCardRelative: { color: 'rgba(255,255,255,0.88)', fontWeight: '700', fontSize: 12 },
  bigCardTitle: {
    fontWeight: '900',
    color: '#fff',
    marginTop: spacing.xs,
  },
  bigCardSub: {
    color: 'rgba(255,255,255,0.85)',
    fontWeight: '600',
    marginTop: spacing.xs,
    marginBottom: spacing.base,
    lineHeight: 18,
  },
  bigCardActions: {
    flexDirection: 'row',
    gap: spacing.sm,
    flexWrap: 'wrap',
  },
  skeletonOnPrimary: { backgroundColor: 'rgba(255,255,255,0.25)' },

  primaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: '#fff',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.base,
    borderRadius: radii.md,
    minHeight: 40,
  },
  primaryBtnText: { color: colors.primary, fontWeight: '900' },

  ghostBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.base,
    borderRadius: radii.md,
    minHeight: 40,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.6)',
    backgroundColor: 'transparent',
  },
  ghostBtnText: { color: '#fff', fontWeight: '800' },

  section: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    marginTop: spacing.xl,
    marginBottom: spacing.sm,
    gap: spacing.sm,
  },
  sectionTitle: { fontWeight: '900', color: colors.dark },
  sectionAction: { color: colors.primary, fontWeight: '700' },

  quickGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  quickItem: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    padding: spacing.md,
    alignItems: 'center',
    justifyContent: 'flex-start',
    minHeight: 96,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.sm,
  },
  quickItemHover: { borderColor: colors.primarySoft, backgroundColor: '#fcfdff' },
  quickItemPressed: { opacity: 0.85, transform: [{ scale: 0.98 }] },
  quickIcon: {
    width: 44,
    height: 44,
    borderRadius: radii.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickLabel: {
    color: colors.dark,
    fontWeight: '700',
    textAlign: 'center',
  },

  apptCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  apptCardHover: { borderColor: colors.primarySoft, backgroundColor: '#fcfdff' },
  apptCardPressed: { opacity: 0.9 },
  apptAvatar: { width: 52, height: 52, borderRadius: radii.md },
  apptBody: { flex: 1, minWidth: 0, gap: 2 },
  apptDoctor: { fontWeight: '900', color: colors.dark },
  apptSpec: { color: colors.muted, fontWeight: '700' },
  apptDetail: { color: colors.muted, fontWeight: '600' },
  apptRight: {
    alignItems: 'flex-end',
    gap: spacing.xs,
    flexShrink: 0,
  },
  apptStatusPill: {
    backgroundColor: colors.primarySoft,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radii.pill,
    maxWidth: 120,
  },
  apptStatusText: { color: colors.primary, fontWeight: '800', fontSize: 11 },

  emptyCard: {
    alignItems: 'center',
    padding: spacing.xl,
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    borderStyle: 'dashed',
    gap: spacing.sm,
  },
  emptyIconWrap: {
    width: 56,
    height: 56,
    borderRadius: radii.pill,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: { fontWeight: '900', color: colors.dark, textAlign: 'center' },
  emptySub: { color: colors.muted, textAlign: 'center', lineHeight: 18 },
  emptyCta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.sm,
    borderRadius: radii.md,
    minHeight: 40,
    marginTop: spacing.xs,
  },
  emptyCtaText: { color: '#fff', fontWeight: '800' },

  errorCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: '#fef2f2',
    borderColor: '#fecaca',
    borderWidth: 1,
    padding: spacing.md,
    borderRadius: radii.md,
    flexWrap: 'wrap',
  },
  errorText: { flex: 1, minWidth: 0, color: '#991b1b', fontWeight: '600' },
  errorRetry: { color: colors.danger, fontWeight: '800' },
  expressCard: {
    marginTop: spacing.md,
    backgroundColor: '#0F172A',
    borderRadius: radii.xl,
    padding: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
    flexWrap: 'wrap',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 4,
  },
  expressLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    flex: 1,
    minWidth: 260,
  },
  expressIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  expressTitle: {
    color: '#fff',
    fontWeight: '900',
  },
  expressSubtitle: {
    marginTop: 2,
    color: '#94A3B8',
  },
  expressBtn: {
    backgroundColor: colors.primary,
    borderRadius: radii.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  expressBtnText: {
    color: '#fff',
    fontWeight: '800',
  },
});
