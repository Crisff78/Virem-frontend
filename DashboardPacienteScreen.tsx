import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
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
import Skeleton from './components/Skeleton';
import ViremImage from './components/ViremImage';
import FadeInView from './components/FadeInView';

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

const resolveAvatarSource = (value: unknown): any => {
  const clean = sanitizeFotoUrl(value);
  return clean || DefaultAvatar;
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
  const { sessionUser, syncProfile } = usePatientSessionProfile();
  const { t } = useLanguage();
  const { isDesktop, isTablet, isMobile, select, fs, rs, wp, hp } = useResponsive();

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [user, setUser] = useState<User | null>(() => (ensurePatientSessionUser(sessionUser) as User | null) || null);
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

  useEffect(() => {
    if (sessionUser) {
      setUser((ensurePatientSessionUser(sessionUser) as User | null) || null);
    }
  }, [sessionUser]);

  // -------------------------------------------------------------
  // ESTILOS DINÁMICOS
  // -------------------------------------------------------------
  const styles = useMemo(() => StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.bg },
    containerDesktop: { flexDirection: 'row' },
    mobileHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: rs(16),
      paddingVertical: rs(12),
      backgroundColor: '#fff',
      borderBottomWidth: 1,
      borderBottomColor: '#eef2f7',
    },
    main: { flex: 1, padding: rs(16) },
    mainMobile: { padding: rs(12) },
    overlay: {
      position: 'absolute',
      top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.4)',
      zIndex: 90,
    },
    sidebar: {
      backgroundColor: '#fff',
      padding: rs(20),
      justifyContent: 'space-between',
      zIndex: 100,
    },
    sidebarDesktop: {
      width: rs(260),
      borderRightWidth: 1,
      borderRightColor: '#eef2f7',
    },
    sidebarMobile: {
      position: 'absolute',
      left: 0, top: 0, bottom: 0,
      width: '80%',
      maxWidth: 300,
      shadowColor: '#000',
      shadowOpacity: 0.25,
      shadowRadius: 20,
      elevation: 20,
    },
    logoContainer: { flexDirection: 'row', alignItems: 'center', gap: rs(12), marginBottom: rs(30) },
    logo: { width: rs(40), height: rs(40) },
    logoText: { fontSize: fs(22), fontWeight: '900', color: colors.primary, letterSpacing: 1 },
    logoSub: { fontSize: fs(10), fontWeight: '800', color: colors.muted, letterSpacing: 2 },
    userBox: { alignItems: 'center', marginBottom: rs(30), padding: rs(16), backgroundColor: '#f8fafc', borderRadius: rs(20) },
    userAvatar: { width: rs(60), height: rs(60), borderRadius: rs(30), marginBottom: rs(12), borderWidth: 3, borderColor: '#fff' },
    userName: { fontSize: fs(15), fontWeight: '800', color: colors.dark, textAlign: 'center' },
    menu: { gap: rs(8) },
    menuItemRow: { flexDirection: 'row', alignItems: 'center', gap: rs(12), padding: rs(12), borderRadius: rs(14) },
    menuItemActive: { backgroundColor: 'rgba(19, 127, 236, 0.1)' },
    menuText: { fontSize: fs(14), fontWeight: '700', color: colors.muted },
    menuTextActive: { color: colors.primary },
    logoutButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: rs(10), backgroundColor: colors.brand, padding: rs(14), borderRadius: rs(16) },
    logoutText: { color: '#fff', fontWeight: '800', fontSize: fs(14) },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: rs(12), marginBottom: rs(10) },
    searchBox: { flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: rs(14), paddingHorizontal: rs(14), height: rs(44) },
    searchInput: { flex: 1, marginLeft: rs(10), fontSize: fs(13), color: colors.dark },
    notifBtn: { width: rs(44), height: rs(44), borderRadius: rs(14), backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' },
    notifDot: { position: 'absolute', top: rs(10), right: rs(10), width: rs(10), height: rs(10), borderRadius: rs(10), backgroundColor: '#ef4444', borderWidth: 2, borderColor: '#fff' },
    title: { fontSize: fs(28), fontWeight: '900', color: colors.dark, marginTop: rs(8) },
    subtitle: { fontSize: fs(14), color: colors.muted, marginTop: rs(4), marginBottom: rs(16) },
    bigCard: {
      backgroundColor: colors.primary,
      borderRadius: rs(28),
      padding: rs(24),
      marginTop: rs(20),
      shadowColor: colors.primary,
      shadowOpacity: 0.2,
      shadowRadius: 20,
      shadowOffset: { width: 0, height: 10 },
      elevation: 8,
    },
    bigCardTitle: { fontSize: fs(18), fontWeight: '900', color: colors.white, marginBottom: rs(6) },
    bigCardSub: { fontSize: fs(14), color: 'rgba(255,255,255,0.8)', fontWeight: '700', marginBottom: rs(14) },
    primaryBtn: { flexDirection: 'row', alignItems: 'center', gap: rs(8), backgroundColor: '#fff', paddingVertical: rs(12), paddingHorizontal: rs(16), borderRadius: rs(16) },
    primaryBtnText: { color: colors.primary, fontWeight: '900', fontSize: fs(14) },
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
  const primaryCita = upcomingCitas[0] || null;

  const handleLogout = async () => {
    await signOut();
    navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
  };

  return (
    <View style={[styles.container, !isInsidePortal && isDesktop && styles.containerDesktop]}>
      
      {/* Menú móvil barra superior */}
      {!isDesktop && (
        <View style={styles.mobileHeader}>
          <TouchableOpacity onPress={() => setIsMobileMenuOpen(true)}>
            <MaterialIcons name="menu" size={24} color={colors.dark} />
          </TouchableOpacity>
          <ViremImage source={ViremLogo} style={{ width: 32, height: 32 }} />
        </View>
      )}

      {isMobileMenuOpen && (
        <TouchableOpacity 
          activeOpacity={1} 
          style={styles.overlay} 
          onPress={() => setIsMobileMenuOpen(false)} 
        />
      )}

      {/* Sidebar (Drawer en móvil) */}
      {(isDesktop || isMobileMenuOpen) && (
        <View style={[styles.sidebar, isDesktop ? styles.sidebarDesktop : styles.sidebarMobile]}>
          <View>
            <View style={styles.logoContainer}>
              <ViremImage source={ViremLogo} style={styles.logo} />
              <View>
                <Text style={styles.logoText}>VIREM</Text>
                <Text style={styles.logoSub}>PACIENTE</Text>
              </View>
            </View>
            <View style={styles.userBox}>
              <ViremImage source={resolveAvatarSource(sessionUser?.fotoUrl)} style={styles.userAvatar} />
              <Text style={styles.userName}>{fullName}</Text>
            </View>
            <View style={styles.menu}>
              <TouchableOpacity style={[styles.menuItemRow, styles.menuItemActive]}>
                <MaterialIcons name="grid-view" size={20} color={colors.primary} />
                <Text style={[styles.menuText, styles.menuTextActive]}>{t('menu.home')}</Text>
              </TouchableOpacity>
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
        <FadeInView>
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
            {loadingUser ? (
              <View style={{ gap: 10 }}>
                <Skeleton width="80%" height={24} />
                <Skeleton width="60%" height={16} />
                <Skeleton width={120} height={40} borderRadius={16} />
              </View>
            ) : (
              <>
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
              </>
            )}
          </View>

          <Text style={{ fontSize: fs(16), fontWeight: '800', color: colors.dark, marginTop: rs(10) }}>Citas pendientes</Text>
          {loadingCitas ? (
            <View style={{ gap: 10, marginTop: 10 }}>
              <Skeleton width="100%" height={rs(80)} borderRadius={rs(18)} />
              <Skeleton width="100%" height={rs(80)} borderRadius={rs(18)} />
            </View>
          ) : (
            upcomingCitas.length > 0 ? (
              upcomingCitas.map((cita) => (
                <View key={cita.citaid} style={styles.apptCard}>
                  <ViremImage source={resolveAvatarSource(cita.medico?.fotoUrl)} style={styles.apptAvatar} />
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
            )
          )}
        </FadeInView>
      </ScrollView>
    </View>
  );
};

export default DashboardPacienteScreen;
