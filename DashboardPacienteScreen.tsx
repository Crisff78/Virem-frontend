import React, { useCallback, useMemo, useRef, useState } from 'react';
import {
  Alert,
  Modal,
  Image,
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Platform,
} from 'react-native';
import { useResponsive } from './hooks/useResponsive';
import type { ImageSourcePropType } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { usePortalAwareNavigation } from './navigation/usePortalAwareNavigation';
import { usePacienteModule } from './navigation/PacienteModuleContext';
import { useAuth } from './providers/AuthProvider';
import { apiClient } from './utils/api';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { useLanguage } from './localization/LanguageContext';
import { usePatientSessionProfile, type PatientSessionUser } from './hooks/usePatientSessionProfile';
import { ensurePatientSessionUser, getPatientDisplayName } from './utils/patientSession';

const ViremLogo = require('./assets/imagenes/descarga.png');
const DefaultAvatar = require('./assets/imagenes/avatar-default.jpg');

const MIN_REFRESH_INTERVAL_MS = 15000;

const colors = {
  primary: '#137fec',
  brand: '#137fec',
  dark: '#0f172a',
  muted: '#64748b',
  light: '#f8fafc',
  bg: '#f5f7fb',
  white: '#ffffff',
};

const normalizeString = (value: unknown) => String(value || '').trim();

const sanitizeFotoUrl = (value: unknown) => {
  const clean = normalizeString(value);
  if (!clean || clean.toLowerCase().startsWith('blob:')) return '';
  return clean;
};

const resolveAvatarSource = (value: unknown): ImageSourcePropType => {
  const clean = sanitizeFotoUrl(value);
  return clean ? { uri: clean } : DefaultAvatar;
};

const formatDateTime = (value: string | null) => {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
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

const sortCitasByStartAsc = (items: CitaItem[]) =>
  [...items].sort((a, b) => parseDateMs(a?.fechaHoraInicio) - parseDateMs(b?.fechaHoraInicio));

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
  title: string;
  text: string;
  time: string;
  icon: string;
  color: string;
  unread: boolean;
};

/* ===================== PANTALLA ===================== */
const DashboardPacienteScreen: React.FC = () => {
  const navigation = usePortalAwareNavigation();
  const { isInsidePortal } = usePacienteModule();
  const { signOut } = useAuth();
  const { syncProfile } = usePatientSessionProfile();
  const { t } = useLanguage();
  const { isDesktop, isTablet, isMobile, select, fs, rs, wp, hp } = useResponsive();

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [loadingUser, setLoadingUser] = useState(true);
  const [loadingCitas, setLoadingCitas] = useState(false);
  const [upcomingCitas, setUpcomingCitas] = useState<CitaItem[]>([]);
  const [historyCitas, setHistoryCitas] = useState<CitaItem[]>([]);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [workingCitaId, setWorkingCitaId] = useState('');
  const lastRefreshRef = useRef(0);

  const [notifications, setNotifications] = useState<NotificationItem[]>([
    { id: 'n1', title: 'Recordatorio', text: 'Consulta en 15 min', time: '15m', icon: 'videocam', color: '#137fec', unread: true },
    { id: 'n2', title: 'Receta', text: 'Nueva receta digital', time: '1h', icon: 'description', color: '#22c55e', unread: true },
  ]);

  // -------------------------------------------------------------
  // ESTILOS DINÁMICOS
  // -------------------------------------------------------------
  const styles = useMemo(() => StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.bg },
    containerDesktop: { flexDirection: 'row' },
    containerMobile: { flexDirection: 'column' },
    
    mobileMenuBar: { paddingHorizontal: rs(14), paddingTop: rs(12), paddingBottom: rs(8), backgroundColor: colors.bg },
    mobileMenuButton: { alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: rs(8), paddingHorizontal: rs(12), paddingVertical: rs(8), borderRadius: rs(10), borderWidth: 1, borderColor: '#d8e4f0', backgroundColor: colors.white },
    mobileMenuButtonText: { color: colors.dark, fontWeight: '700', fontSize: fs(13) },

    sidebar: { backgroundColor: colors.white, justifyContent: 'space-between' },
    sidebarDesktop: { width: rs(260), borderRightWidth: 1, borderRightColor: '#eef2f7', padding: rs(20) },
    sidebarMobile: { width: '100%', borderBottomWidth: 1, borderBottomColor: '#eef2f7', padding: rs(14) },

    logoBox: { flexDirection: 'row', alignItems: 'center', gap: rs(10) },
    logo: { width: rs(44), height: rs(44), resizeMode: 'contain' },
    logoTitle: { fontSize: fs(20), fontWeight: '800', color: colors.dark, letterSpacing: 0.5 },
    logoSubtitle: { fontSize: fs(11), fontWeight: '700', color: colors.muted },

    userBox: { marginTop: rs(18), alignItems: 'center', paddingVertical: rs(12) },
    userAvatar: { width: rs(70), height: rs(70), borderRadius: rs(70), marginBottom: rs(10), borderWidth: 4, borderColor: '#f5f7fb' },
    userName: { fontWeight: '800', color: colors.dark, fontSize: fs(14), textAlign: 'center' },
    userPlan: { color: colors.muted, fontSize: fs(11), fontWeight: '700', marginTop: rs(2), textAlign: 'center' },

    menu: { marginTop: rs(10), gap: rs(6) },
    menuItemRow: { flexDirection: 'row', alignItems: 'center', gap: rs(12), paddingVertical: rs(12), paddingHorizontal: rs(12), borderRadius: rs(12) },
    menuItemActive: { backgroundColor: 'rgba(19,127,236,0.10)', borderRightWidth: 3, borderRightColor: colors.primary },
    menuText: { fontSize: fs(14), fontWeight: '700', color: colors.muted },
    menuTextActive: { color: colors.primary },

    logoutButton: { flexDirection: 'row', gap: rs(10), alignItems: 'center', justifyContent: 'center', backgroundColor: colors.brand, paddingVertical: rs(12), borderRadius: rs(12) },
    logoutText: { color: '#fff', fontWeight: '800', fontSize: fs(14) },

    main: { flex: 1, paddingHorizontal: rs(24), paddingTop: rs(18) },
    mainMobile: { paddingHorizontal: rs(14), paddingTop: rs(12) },

    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: rs(12), marginBottom: rs(10) },
    searchBox: { flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: rs(14), paddingHorizontal: rs(14), height: rs(44) },
    searchInput: { flex: 1, marginLeft: rs(10), fontSize: fs(13), color: colors.dark },
    notifBtn: { width: rs(44), height: rs(44), borderRadius: rs(14), backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' },
    notifDot: { position: 'absolute', top: rs(10), right: rs(10), width: rs(10), height: rs(10), borderRadius: rs(10), backgroundColor: '#ef4444', borderWidth: 2, borderColor: '#fff' },

    title: { fontSize: fs(28), fontWeight: '900', color: colors.dark, marginTop: rs(8) },
    subtitle: { fontSize: fs(14), color: colors.muted, marginTop: rs(4), marginBottom: rs(16) },

    bigCard: { backgroundColor: '#fff', borderRadius: rs(24), padding: rs(20), marginBottom: rs(20), shadowColor: colors.dark, shadowOpacity: 0.06, shadowRadius: 12, elevation: 3 },
    bigCardTitle: { fontSize: fs(18), fontWeight: '900', color: colors.dark, marginBottom: rs(6) },
    bigCardSub: { fontSize: fs(14), color: colors.muted, fontWeight: '700', marginBottom: rs(14) },
    primaryBtn: { flexDirection: 'row', alignItems: 'center', gap: rs(8), backgroundColor: colors.primary, paddingVertical: rs(12), paddingHorizontal: rs(16), borderRadius: rs(16) },
    primaryBtnText: { color: '#fff', fontWeight: '900', fontSize: fs(14) },
    
    apptCard: { flexDirection: 'row', alignItems: 'center', gap: rs(12), backgroundColor: '#fff', padding: rs(14), borderRadius: rs(18), marginTop: rs(10) },
    apptAvatar: { width: rs(52), height: rs(52), borderRadius: rs(16) },
    apptDoctor: { fontWeight: '900', color: colors.dark, fontSize: fs(14) },
    apptDetail: { color: colors.muted, fontWeight: '700', fontSize: fs(12) },

    emptyStateCard: { alignItems: 'center', padding: rs(24), backgroundColor: '#fff', borderRadius: rs(22), borderWidth: 1, borderColor: '#eef2f7', borderStyle: 'dashed', marginTop: rs(10) },
  }), [fs, rs, isDesktop]);

  const loadUser = useCallback(async () => {
    setLoadingUser(true);
    try {
      const sessionUser = (await syncProfile()) as PatientSessionUser | null;
      setUser((ensurePatientSessionUser(sessionUser) as User | null) || null);

      setLoadingCitas(true);
      try {
        const [up, hist] = await Promise.all([
          apiClient.get<any>('/api/agenda/me/citas', { authenticated: true, query: { scope: 'upcoming', limit: 5 } }),
          apiClient.get<any>('/api/agenda/me/citas', { authenticated: true, query: { scope: 'history', limit: 5 } }),
        ]);
        if (up?.success) setUpcomingCitas(sortCitasByStartAsc(up.citas));
        if (hist?.success) setHistoryCitas(hist.citas);
      } finally {
        setLoadingCitas(false);
      }
    } finally {
      setLoadingUser(false);
    }
  }, [syncProfile]);

  useFocusEffect(
    useCallback(() => {
      const now = Date.now();
      if (now - lastRefreshRef.current > MIN_REFRESH_INTERVAL_MS) {
        lastRefreshRef.current = now;
        loadUser();
      }
    }, [loadUser])
  );

  const fullName = useMemo(() => getPatientDisplayName(user, 'Paciente'), [user]);
  const userAvatarSource = resolveAvatarSource(user?.fotoUrl);
  const primaryCita = upcomingCitas[0] || null;

  const handleLogout = async () => {
    await signOut();
    navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
  };

  return (
    <View style={[styles.container, !isInsidePortal && (isDesktop ? styles.containerDesktop : styles.containerMobile)]}>
      {/* Menú móvil */}
      {!isInsidePortal && !isDesktop && (
        <View style={styles.mobileMenuBar}>
          <TouchableOpacity style={styles.mobileMenuButton} onPress={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
            <MaterialIcons name={isMobileMenuOpen ? 'close' : 'menu'} size={22} color={colors.dark} />
            <Text style={styles.mobileMenuButtonText}>{isMobileMenuOpen ? 'Cerrar' : 'Menú'}</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Sidebar */}
      {!isInsidePortal && (isDesktop || isMobileMenuOpen) && (
        <View style={[styles.sidebar, isDesktop ? styles.sidebarDesktop : styles.sidebarMobile]}>
          <View>
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
              <Text style={styles.userPlan}>{user?.plan || 'Básico'}</Text>
            </View>
            <View style={styles.menu}>
              <TouchableOpacity style={[styles.menuItemRow, styles.menuItemActive]}>
                <MaterialIcons name="grid-view" size={20} color={colors.primary} />
                <Text style={[styles.menuText, styles.menuTextActive]}>{t('menu.home')}</Text>
              </TouchableOpacity>
              {/* Otros items simplificados */}
            </View>
          </View>
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <MaterialIcons name="logout" size={20} color="#fff" />
            <Text style={styles.logoutText}>{t('menu.logout')}</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Main Content */}
      <ScrollView style={[styles.main, !isDesktop && styles.mainMobile]}>
        <View style={styles.header}>
          <View style={styles.searchBox}>
            <MaterialIcons name="search" size={20} color={colors.muted} />
            <TextInput placeholder="Busca un médico..." style={styles.searchInput} />
          </View>
          <TouchableOpacity style={styles.notifBtn}>
            <MaterialIcons name="notifications" size={22} color={colors.dark} />
            <View style={styles.notifDot} />
          </TouchableOpacity>
        </View>

        <Text style={styles.title}>Hola, {fullName.split(' ')[0]}</Text>
        <Text style={styles.subtitle}>Gestiona tus consultas de hoy.</Text>

        <View style={styles.bigCard}>
          <Text style={styles.bigCardTitle}>
            {primaryCita ? `Cita con ${primaryCita.medico?.nombreCompleto}` : 'No hay citas próximas'}
          </Text>
          <Text style={styles.bigCardSub}>
            {primaryCita ? `${formatDateTime(primaryCita.fechaHoraInicio)} (${formatRelativeIn(primaryCita.fechaHoraInicio)})` : 'Agenda una nueva consulta ahora.'}
          </Text>
          <TouchableOpacity style={styles.primaryBtn} onPress={() => navigation.navigate('NuevaConsultaPaciente')}>
            <MaterialIcons name="add" size={20} color="#fff" />
            <Text style={styles.primaryBtnText}>Nueva consulta</Text>
          </TouchableOpacity>
        </View>

        <Text style={{ fontSize: fs(16), fontWeight: '800', color: colors.dark, marginTop: rs(10) }}>Citas pendientes</Text>
        {upcomingCitas.length > 0 ? (
          upcomingCitas.map((cita) => (
            <View key={cita.citaid} style={styles.apptCard}>
              <Image source={resolveAvatarSource(cita.medico?.fotoUrl)} style={styles.apptAvatar} />
              <View>
                <Text style={styles.apptDoctor}>{cita.medico?.nombreCompleto}</Text>
                <Text style={styles.apptDetail}>{formatDateTime(cita.fechaHoraInicio)}</Text>
              </View>
            </View>
          ))
        ) : (
          <View style={styles.emptyStateCard}>
            <Text style={{ color: colors.muted, fontWeight: '600' }}>Sin citas programadas.</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
};

export default DashboardPacienteScreen;
