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
  useWindowDimensions,
} from 'react-native';
import type { ImageSourcePropType } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import type { RootStackParamList } from './navigation/types';
import { usePortalAwareNavigation } from './navigation/usePortalAwareNavigation';
import { usePacienteModule } from './navigation/PacienteModuleContext';
import { useAuth } from './providers/AuthProvider';
import { apiClient } from './utils/api';

// Nota: si usas Expo, comenta los imports de abajo y usa:
// import { MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';

import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useLanguage } from './localization/LanguageContext';
import { usePatientSessionProfile, type PatientSessionUser } from './hooks/usePatientSessionProfile';
import { ensurePatientSessionUser, getPatientDisplayName } from './utils/patientSession';

const ViremLogo = require('./assets/imagenes/descarga.png');

// Avatar default (local) -> crea una imagen en tu proyecto:
// ./assets/imagenes/avatar-default.png
const DefaultAvatar = require('./assets/imagenes/avatar-default.jpg');

const MIN_REFRESH_INTERVAL_MS = 15000;

const normalizeString = (value: unknown) =>
  String(value || '')
    .replace(/\s+/g, ' ')
    .trim();

const sanitizeFotoUrl = (value: unknown) => {
  const clean = normalizeString(value);
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
  const diffDay = Math.round(diffHour / 24);
  return `en ${diffDay} dia(s)`;
};

const formatPrice = (value: number | null | undefined) => {
  if (!Number.isFinite(value as number) || Number(value) <= 0) return 'No especificado';
  return new Intl.NumberFormat('es-DO', {
    style: 'currency',
    currency: 'DOP',
    maximumFractionDigits: 2,
  }).format(Number(value));
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
  id?: number | string;
  usuarioid?: number | string;
  nombres?: string;
  apellidos?: string;
  nombre?: string;
  apellido?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  plan?: string;        // "Premium" / "Básico"
  fotoUrl?: string;     // URL de la foto si la subió
  telefono?: string;
  cedula?: string;
  genero?: string;
  fechanacimiento?: string;
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

type AppointmentCardProps = {
  doctor: string;
  detail: string;
  avatar: ImageSourcePropType;
  simple?: boolean;
  showPostpone?: boolean;
  postponeDisabled?: boolean;
  postponeLabel?: string;
  onPostpone?: () => void;
  onDetails?: () => void;
};

type DocRowProps = {
  icon: string;
  title: string;
  sub: string;
  onDownload?: () => void;
};

type DoctorCardProps = {
  name: string;
  spec: string;
  avatar: ImageSourcePropType;
  onReserve?: () => void;
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

/* ===================== COMPONENTES ===================== */
const AppointmentCard: React.FC<AppointmentCardProps> = ({
  doctor,
  detail,
  avatar,
  simple = false,
  showPostpone,
  postponeDisabled = false,
  postponeLabel = 'Posponer',
  onPostpone,
  onDetails,
}) => {
  const shouldRenderPostpone = typeof showPostpone === 'boolean' ? showPostpone : !simple;
  return (
    <View style={styles.apptCard}>
      <Image source={avatar} style={styles.apptAvatar} />
      <View style={{ flex: 1 }}>
        <Text style={styles.apptDoctor}>{doctor}</Text>
        <Text style={styles.apptDetail}>{detail}</Text>
      </View>

      <View style={styles.apptBtns}>
        {shouldRenderPostpone ? (
          <TouchableOpacity
            style={[styles.smallBtnGray, postponeDisabled && styles.smallBtnGrayDisabled]}
            onPress={onPostpone}
            disabled={postponeDisabled}
          >
            <Text style={[styles.smallBtnGrayText, postponeDisabled && styles.smallBtnGrayTextDisabled]}>
              {postponeLabel}
            </Text>
          </TouchableOpacity>
        ) : null}
        <TouchableOpacity style={styles.smallBtnBlue} onPress={onDetails}>
          <Text style={styles.smallBtnBlueText}>Detalles</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const DocRow: React.FC<DocRowProps> = ({ icon, title, sub, onDownload }) => (
  <View style={styles.docRow}>
    <View style={styles.docLeft}>
      <View style={styles.docIconBox}>
        <MaterialIcons name={icon} size={20} color={colors.primary} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.docTitle} numberOfLines={1}>
          {title}
        </Text>
        <Text style={styles.docSub} numberOfLines={1}>
          {sub}
        </Text>
      </View>
    </View>
    <TouchableOpacity onPress={onDownload}>
      <MaterialIcons name="download" size={20} color={colors.muted} />
    </TouchableOpacity>
  </View>
);

const DoctorCard: React.FC<DoctorCardProps> = ({ name, spec, avatar, onReserve }) => (
  <View style={styles.doctorCard}>
    <Image source={avatar} style={styles.doctorAvatar} />
    <Text style={styles.doctorName} numberOfLines={1}>
      {name}
    </Text>
    <Text style={styles.doctorSpec} numberOfLines={1}>
      {spec}
    </Text>
    <TouchableOpacity style={styles.reserveBtn} onPress={onReserve}>
      <Text style={styles.reserveText}>RESERVAR</Text>
    </TouchableOpacity>
  </View>
);

/* ===================== PANTALLA ===================== */
const DashboardPacienteScreen: React.FC = () => {
  const navigation = usePortalAwareNavigation();
  const { isInsidePortal } = usePacienteModule();
  const { signOut } = useAuth();
  const { syncProfile } = usePatientSessionProfile();
  const { width: viewportWidth } = useWindowDimensions();
  const { t, tx } = useLanguage();
  const isDesktopLayout = Platform.OS === 'web' && viewportWidth >= 1024;
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [loadingUser, setLoadingUser] = useState(true);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([
    {
      id: 'n1',
      title: 'Tu consulta empieza en 15 min',
      text: 'Prepárate para la videollamada programada con el especialista.',
      time: '15m',
      icon: 'videocam',
      color: '#137fec',
      unread: true,
    },
    {
      id: 'n2',
      title: 'Nueva receta disponible',
      text: 'El Dr. Gómez ha emitido tu receta digital para el tratamiento.',
      time: '1h',
      icon: 'description',
      color: '#22c55e',
      unread: true,
    },
    {
      id: 'n3',
      title: 'Mensaje del Dr. Ruiz',
      text: '"Hola, he revisado tus últimos análisis. Todo parece estar en orden..."',
      time: '3h',
      icon: 'chat-bubble-outline',
      color: '#4A7FA7',
      unread: true,
    },
    {
      id: 'n4',
      title: 'Cita confirmada',
      text: 'Tu cita con Dermatología ha sido confirmada para el 25 de Octubre.',
      time: 'Ayer',
      icon: 'calendar-today',
      color: '#94a3b8',
      unread: false,
    },
  ]);
  const [upcomingCitas, setUpcomingCitas] = useState<CitaItem[]>([]);
  const [historyCitas, setHistoryCitas] = useState<CitaItem[]>([]);
  const [loadingCitas, setLoadingCitas] = useState(false);
  const [workingCitaId, setWorkingCitaId] = useState('');
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [selectedCita, setSelectedCita] = useState<CitaItem | null>(null);
  const lastRefreshRef = useRef(0);

  const loadUser = useCallback(async () => {
    setLoadingUser(true);
    try {
      const sessionUser = (await syncProfile()) as PatientSessionUser | null;
      setUser((ensurePatientSessionUser(sessionUser) as User | null) || null);

      setLoadingCitas(true);
      try {
        const [upcomingPayload, historyPayload] = await Promise.all([
          apiClient.get<any>('/api/agenda/me/citas', {
            authenticated: true,
            query: { scope: 'upcoming', limit: 10 },
          }),
          apiClient.get<any>('/api/agenda/me/citas', {
            authenticated: true,
            query: { scope: 'history', limit: 10 },
          }),
        ]);

        if (upcomingPayload?.success && Array.isArray(upcomingPayload?.citas)) {
          setUpcomingCitas(sortCitasByStartAsc(upcomingPayload.citas as CitaItem[]));
        } else {
          setUpcomingCitas([]);
        }

        if (historyPayload?.success && Array.isArray(historyPayload?.citas)) {
          setHistoryCitas(historyPayload.citas as CitaItem[]);
        } else {
          setHistoryCitas([]);
        }
      } catch {
        setUpcomingCitas([]);
        setHistoryCitas([]);
      } finally {
        setLoadingCitas(false);
      }
    } catch {
      setUser(null);
      setUpcomingCitas([]);
      setHistoryCitas([]);
      setLoadingCitas(false);
    } finally {
      setLoadingUser(false);
    }
  }, [syncProfile]);

  useFocusEffect(
    useCallback(() => {
      const now = Date.now();
      if (now - lastRefreshRef.current < MIN_REFRESH_INTERVAL_MS) {
        return;
      }
      lastRefreshRef.current = now;
      loadUser();
    }, [loadUser])
  );

  const fullName = useMemo(() => getPatientDisplayName(user, 'Paciente'), [user]);

  const planLabel = useMemo(() => {
    const plan = (user?.plan || '').trim();
    return plan ? `Paciente ${plan}` : 'Paciente';
  }, [user]);

  // Foto: si no hay fotoUrl, usar avatar default
  const userAvatarSource: ImageSourcePropType = useMemo(() => {
    const fotoUrl = sanitizeFotoUrl(user?.fotoUrl);
    if (fotoUrl) {
      return { uri: fotoUrl };
    }
    return DefaultAvatar;
  }, [user]);

  const getDoctorAvatar = useCallback(
    (cita: CitaItem | null | undefined): ImageSourcePropType =>
      resolveAvatarSource(cita?.medico?.fotoUrl),
    []
  );

  const primaryCita = upcomingCitas.length ? upcomingCitas[0] : null;
  const pendingCitas = useMemo(() => {
    if (!upcomingCitas.length) return [];
    return upcomingCitas.slice(primaryCita ? 1 : 0, (primaryCita ? 1 : 0) + 2);
  }, [upcomingCitas, primaryCita]);
  const isCitaPostponable = useCallback((cita: CitaItem | null | undefined) => {
    if (!cita?.citaid) return false;
    const estado = normalizeString(cita.estado || '').toLowerCase();
    const isClosed =
      estado.includes('cancel') ||
      estado.includes('complet') ||
      estado.includes('finaliz') ||
      estado.includes('realiz');
    if (isClosed) return false;
    const startMs = parseDateMs(cita.fechaHoraInicio);
    return Number.isFinite(startMs) && startMs > Date.now();
  }, []);

  const primaryDoctorName = normalizeString(primaryCita?.medico?.nombreCompleto || '');
  const primaryDoctorSpec = normalizeString(primaryCita?.medico?.especialidad || 'Medicina General');
  const primaryDoctorAvatar = useMemo(() => getDoctorAvatar(primaryCita), [getDoctorAvatar, primaryCita]);
  const primaryDateLabel = formatDateTime(primaryCita?.fechaHoraInicio || null);
  const primaryRelative = formatRelativeIn(primaryCita?.fechaHoraInicio || null);

  const handleLogout = async () => {
    await signOut();
    navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
  };

  const handleJoinVideoCall = () => {
    if (!primaryCita) {
      Alert.alert('Videollamada', 'No tienes citas activas para entrar ahora.');
      return;
    }
    navigation.navigate('SalaEsperaVirtualPaciente', { citaId: primaryCita.citaid });
  };

  const openCitaDetails = (cita: CitaItem) => {
    setSelectedCita(cita);
    setDetailsOpen(true);
  };

  const handlePostponeCita = async (cita: CitaItem) => {
    const citaId = normalizeString(cita?.citaid);
    if (!citaId) {
      Alert.alert('No disponible', 'Esta cita no tiene un identificador válido para posponer.');
      return;
    }
    if (workingCitaId === citaId) return;
    if (!isCitaPostponable(cita)) {
      Alert.alert('No disponible', 'Esta cita ya no puede posponerse por su estado o fecha.');
      return;
    }

    setWorkingCitaId(citaId);
    try {
      const currentStart = cita?.fechaHoraInicio ? new Date(cita.fechaHoraInicio) : new Date();
      const nextStart = new Date(currentStart.getTime() + 24 * 60 * 60 * 1000);

      const payload = await apiClient.patch<any>(`/api/agenda/me/citas/${citaId}/reprogramar`, {
        authenticated: true,
        body: {
          fechaHoraInicio: nextStart.toISOString(),
          motivo: 'Reprogramada desde dashboard paciente',
        },
      });
      if (!payload?.success) {
        Alert.alert('No se pudo posponer', payload?.message || 'Intenta nuevamente.');
        return;
      }

      Alert.alert('Cita pospuesta', `Nueva fecha: ${formatDateTime(payload?.cita?.fechaHoraInicio || null)}`);
      setDetailsOpen(false);
      loadUser();
    } catch {
      Alert.alert('Error', 'No se pudo conectar para posponer la cita.');
    } finally {
      setWorkingCitaId('');
    }
  };

  const unreadNotifications = notifications.filter((n) => n.unread).length;

  const markAllNotificationsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, unread: false })));
  };

  const toggleMobileMenu = () => setIsMobileMenuOpen((prev) => !prev);
  const closeMobileMenu = () => setIsMobileMenuOpen(false);
  const handleSidebarNavigation = (
    route:
      | 'DashboardPaciente'
      | 'NuevaConsultaPaciente'
      | 'PacienteCitas'
      | 'PacienteChat'
      | 'PacienteRecetasDocumentos'
      | 'PacientePerfil'
      | 'PacienteConfiguracion'
  ) => {
    closeMobileMenu();
    navigation.navigate(route);
  };

  return (
    <View style={[styles.container, isInsidePortal ? null : (isDesktopLayout ? styles.containerDesktop : styles.containerMobile)]}>
      {!isInsidePortal && !isDesktopLayout ? (
        <View style={styles.mobileMenuBar}>
          <TouchableOpacity style={styles.mobileMenuButton} onPress={toggleMobileMenu}>
            <MaterialIcons name={isMobileMenuOpen ? 'close' : 'menu'} size={22} color={colors.dark} />
            <Text style={styles.mobileMenuButtonText}>
              {isMobileMenuOpen ? 'Cerrar menú' : 'Abrir menú'}
            </Text>
          </TouchableOpacity>
        </View>
      ) : null}

      {/* ===================== SIDEBAR ===================== */}
      {!isInsidePortal && (isDesktopLayout || isMobileMenuOpen) && (
      <View style={[styles.sidebar, isDesktopLayout ? styles.sidebarDesktop : styles.sidebarMobile]}>
        <View>
          {/* Logo */}
          <View style={styles.logoBox}>
            <Image source={ViremLogo} style={styles.logo} />
            <View>
              <Text style={styles.logoTitle}>VIREM</Text>
              <Text style={styles.logoSubtitle}>Portal Paciente</Text>
            </View>
          </View>

          {/* Perfil mini (REAL) */}
          <View style={styles.userBox}>
            <Image source={userAvatarSource} style={styles.userAvatar} />
            <Text style={styles.userName}>{fullName}</Text>
            <Text style={styles.userPlan}>{planLabel}</Text>

          </View>

          {/* Menú */}
          <View style={[styles.menu, isDesktopLayout ? styles.menuDesktop : styles.menuMobile]}>
            <TouchableOpacity
              style={[styles.menuItemRow, styles.menuItemActive]}
              onPress={() => handleSidebarNavigation('DashboardPaciente')}
            >
              <MaterialIcons name="grid-view" size={20} color={colors.primary} />
              <Text style={[styles.menuText, styles.menuTextActive]}>{t('menu.home')}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.menuItemRow}
              onPress={() => handleSidebarNavigation('NuevaConsultaPaciente')}
            >
              <MaterialIcons name="person-search" size={20} color={colors.muted} />
              <Text style={styles.menuText}>{t('menu.searchDoctor')}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.menuItemRow}
              onPress={() => handleSidebarNavigation('PacienteCitas')}
            >
              <MaterialIcons name="calendar-today" size={20} color={colors.muted} />
              <Text style={styles.menuText}>{t('menu.appointments')}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.menuItemRow}
              onPress={() => handleSidebarNavigation('PacienteChat')}
            >
              <MaterialIcons name="chat-bubble" size={20} color={colors.muted} />
              <Text style={styles.menuText}>{t('menu.chat')}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.menuItemRow}
              onPress={() => handleSidebarNavigation('PacienteRecetasDocumentos')}
            >
              <MaterialIcons name="description" size={20} color={colors.muted} />
              <Text style={styles.menuText}>{t('menu.recipesDocs')}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.menuItemRow}
              onPress={() => handleSidebarNavigation('PacientePerfil')}
            >
              <MaterialIcons name="account-circle" size={20} color={colors.muted} />
              <Text style={styles.menuText}>{t('menu.profile')}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.menuItemRow}
              onPress={() => handleSidebarNavigation('PacienteConfiguracion')}
            >
              <MaterialIcons name="settings" size={20} color={colors.muted} />
              <Text style={styles.menuText}>{t('menu.settings')}</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Cerrar sesión */}
        <TouchableOpacity
          style={styles.logoutButton}
          onPress={() => {
            closeMobileMenu();
            handleLogout();
          }}
        >
          <MaterialIcons name="logout" size={20} color="#fff" />
          <Text style={styles.logoutText}>{t('menu.logout')}</Text>
        </TouchableOpacity>
      </View>
      )}

      {/* ===================== MAIN ===================== */}
      <ScrollView style={[styles.main, !isDesktopLayout ? styles.mainMobile : null]} contentContainerStyle={{ paddingBottom: 30 }}>
        <View style={styles.header}>
          <View style={styles.searchBox}>
            <MaterialIcons name="search" size={20} color={colors.muted} />
            <TextInput
              placeholder="Busca un médico para consulta online"
              placeholderTextColor="#8aa7bf"
              style={styles.searchInput}
            />
          </View>

          <TouchableOpacity style={styles.notifBtn} onPress={() => setNotificationsOpen(true)}>
            <MaterialIcons name="notifications" size={22} color={colors.dark} />
            {unreadNotifications > 0 ? <View style={styles.notifDot} /> : null}
          </TouchableOpacity>
        </View>

        <Text style={styles.title}>Hola, {fullName.split(' ')[0] || 'Paciente'} 👋</Text>
        <Text style={styles.subtitle}>
          {loadingCitas
            ? 'Cargando tus citas...'
            : primaryCita
              ? `Tu próxima cita es con ${primaryDoctorName || 'tu especialista'}.`
              : 'Aún no tienes citas programadas.'}
        </Text>

        {/* Card grande */}
        <View style={styles.bigCard}>
          <View style={styles.bigCardLeft}>
            {primaryCita && (
              <View style={styles.liveRow}>
                <View style={styles.liveDot} />
                <Text style={styles.liveText}>Próxima consulta</Text>
              </View>
            )}

            <Text style={styles.bigCardTitle}>
              {primaryCita
                ? `${primaryDoctorName || 'Especialista'}`
                : 'Sin consultas pendientes'}
            </Text>

            <Text style={styles.bigCardSub}>
              {primaryCita
                ? `${primaryDoctorSpec || 'Medicina General'} · ${primaryDateLabel} · ${primaryRelative}`
                : 'Agenda tu primera consulta médica.'}
            </Text>

            <View style={styles.bigCardActions}>
              <TouchableOpacity
                style={styles.primaryBtn}
                activeOpacity={0.8}
                onPress={primaryCita ? handleJoinVideoCall : () => navigation.navigate('NuevaConsultaPaciente')}
              >
                <MaterialIcons name={primaryCita ? 'videocam' : 'add-circle-outline'} size={18} color="#fff" />
                <Text style={styles.primaryBtnText}>
                  {primaryCita ? 'Entrar a la consulta' : 'Nueva consulta'}
                </Text>
              </TouchableOpacity>

              {primaryCita && (
                <TouchableOpacity
                  style={styles.secondaryBtn}
                  activeOpacity={0.8}
                  onPress={() => navigation.navigate('PacienteCitas')}
                >
                  <Text style={styles.secondaryBtnText}>Ver mis citas</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>

          <View style={styles.bigCardRight}>
            <Image source={primaryDoctorAvatar} style={styles.bigCardImage} />
          </View>
        </View>

        {/* CTA Principal */}
        <TouchableOpacity
          style={styles.ctaButton}
          activeOpacity={0.85}
          onPress={() => navigation.navigate('NuevaConsultaPaciente')}
        >
          <View style={styles.ctaIconBox}>
            <MaterialIcons name="video-call" size={24} color="#fff" />
          </View>
          <View style={styles.ctaTextBox}>
            <Text style={styles.ctaTitle}>Consultar ahora</Text>
            <Text style={styles.ctaSub}>Agenda una consulta con un especialista</Text>
          </View>
          <MaterialIcons name="arrow-forward-ios" size={16} color="#fff" />
        </TouchableOpacity>

        <View style={styles.quickRow}>
          <TouchableOpacity
            style={styles.quickTile}
            onPress={() => navigation.navigate('NuevaConsultaPaciente')}
            activeOpacity={0.7}
          >
            <View style={[styles.quickTileIcon, { backgroundColor: 'rgba(19,127,236,0.12)' }]}>
              <MaterialIcons name="add-circle-outline" size={22} color={colors.primary} />
            </View>
            <Text style={styles.quickTileLabel}>Nueva consulta</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.quickTile}
            onPress={() => navigation.navigate('PacienteCitas')}
            activeOpacity={0.7}
          >
            <View style={[styles.quickTileIcon, { backgroundColor: '#fff7ed' }]}>
              <MaterialIcons name="calendar-today" size={22} color="#f97316" />
            </View>
            <Text style={styles.quickTileLabel}>Mis citas</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.quickTile}
            onPress={() => navigation.navigate('PacienteRecetasDocumentos')}
            activeOpacity={0.7}
          >
            <View style={[styles.quickTileIcon, { backgroundColor: '#faf5ff' }]}>
              <MaterialIcons name="description" size={22} color="#a855f7" />
            </View>
            <Text style={styles.quickTileLabel}>Mis recetas</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.twoCols}>
          <View style={[styles.colLeft, styles.colLeftFull]}>
            <View style={styles.rowBetween}>
              <Text style={styles.sectionTitle}>Citas pendientes</Text>
              <TouchableOpacity onPress={() => navigation.navigate('PacienteCitas')} activeOpacity={0.7}>
                <Text style={styles.link}>Ver todas</Text>
              </TouchableOpacity>
            </View>

            {pendingCitas.length ? (
              pendingCitas.map((cita, index) => (
                <AppointmentCard
                  key={cita.citaid || `${cita.fechaHoraInicio}-${index}`}
                  doctor={normalizeString(cita?.medico?.nombreCompleto || 'Especialista')}
                  detail={`${normalizeString(cita?.medico?.especialidad || 'Medicina General')} · ${formatDateTime(cita.fechaHoraInicio)}`}
                  avatar={getDoctorAvatar(cita)}
                  showPostpone={isCitaPostponable(cita)}
                  postponeDisabled={workingCitaId === normalizeString(cita.citaid)}
                  postponeLabel={
                    workingCitaId === normalizeString(cita.citaid) ? 'Posponiendo...' : 'Posponer'
                  }
                  onPostpone={() =>
                    Alert.alert(
                      'Posponer cita',
                      `Se movera 24 horas hacia adelante.\nCita actual: ${formatDateTime(cita.fechaHoraInicio)}`,
                      [
                        { text: 'Cancelar', style: 'cancel' },
                        { text: 'Posponer', onPress: () => handlePostponeCita(cita) },
                      ]
                    )
                  }
                  onDetails={() => openCitaDetails(cita)}
                />
              ))
            ) : (
              <View style={styles.emptyStateCard}>
                <View style={styles.emptyStateIconBox}>
                  <MaterialIcons name="event-available" size={32} color={colors.muted} />
                </View>
                <Text style={styles.emptyStateTitle}>
                  {loadingCitas ? 'Cargando citas...' : 'Sin citas pendientes'}
                </Text>
                <Text style={styles.emptyStateText}>
                  {loadingCitas
                    ? 'Estamos buscando tu información.'
                    : 'No tienes citas programadas por el momento.'}
                </Text>
                {!loadingCitas && (
                  <TouchableOpacity
                    style={styles.emptyStateBtn}
                    activeOpacity={0.8}
                    onPress={() => navigation.navigate('NuevaConsultaPaciente')}
                  >
                    <MaterialIcons name="add" size={18} color="#fff" />
                    <Text style={styles.emptyStateBtnText}>Agendar consulta</Text>
                  </TouchableOpacity>
                )}
              </View>
            )}
          </View>
        </View>

      </ScrollView>

      {notificationsOpen ? (
        <>
          <TouchableOpacity style={styles.notificationsOverlay} onPress={() => setNotificationsOpen(false)} />
          <View style={styles.notificationsPanel}>
            <View style={styles.notificationsHead}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <MaterialIcons name="notifications" size={20} color={colors.dark} />
                <Text style={styles.notificationsTitle}>Notificaciones</Text>
              </View>
              <TouchableOpacity onPress={() => setNotificationsOpen(false)}>
                <MaterialIcons name="close" size={22} color={colors.muted} />
              </TouchableOpacity>
            </View>

            <View style={styles.notificationsBody}>
              <View style={styles.notificationsSubhead}>
                <Text style={styles.notificationsSubheadText}>Recientes</Text>
                <TouchableOpacity onPress={markAllNotificationsRead}>
                  <Text style={styles.markReadText}>Marcar como leídas</Text>
                </TouchableOpacity>
              </View>

              <ScrollView showsVerticalScrollIndicator={false}>
                {notifications.map((item) => (
                  <View
                    key={item.id}
                    style={[
                      styles.notificationCard,
                      !item.unread && styles.notificationCardMuted,
                    ]}
                  >
                    <View style={[styles.notificationAccent, { backgroundColor: item.color }]} />
                    <View style={[styles.notificationIconBox, { backgroundColor: `${item.color}20` }]}>
                      <MaterialIcons name={item.icon as any} size={20} color={item.color} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <View style={styles.notificationTitleRow}>
                        <Text style={styles.notificationTitle}>{item.title}</Text>
                        <Text style={styles.notificationTime}>{item.time}</Text>
                      </View>
                      <Text style={styles.notificationText}>{item.text}</Text>
                    </View>
                  </View>
                ))}
              </ScrollView>
            </View>

            <View style={styles.notificationsFooter}>
              <TouchableOpacity
                style={styles.notificationsButton}
                onPress={() => {
                  setNotificationsOpen(false);
                  navigation.navigate('PacienteNotificaciones');
                }}
              >
                <Text style={styles.notificationsButtonText}>Ver todas las notificaciones</Text>
                <MaterialIcons name="arrow-forward" size={16} color="#fff" />
              </TouchableOpacity>
            </View>
          </View>
        </>
      ) : null}

      <Modal
        visible={detailsOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setDetailsOpen(false)}
      >
        <View style={styles.detailsOverlay}>
          <View style={styles.detailsModal}>
            <View style={styles.detailsHead}>
              <Text style={styles.detailsTitle}>Detalle de consulta</Text>
              <TouchableOpacity onPress={() => setDetailsOpen(false)}>
                <MaterialIcons name="close" size={22} color={colors.muted} />
              </TouchableOpacity>
            </View>

            {selectedCita ? (
              <>
                <View style={styles.detailsRow}>
                  <Text style={styles.detailsLabel}>Doctor</Text>
                  <Text style={styles.detailsValue}>
                    {normalizeString(selectedCita?.medico?.nombreCompleto || 'Especialista')}
                  </Text>
                </View>
                <View style={styles.detailsRow}>
                  <Text style={styles.detailsLabel}>Especialidad</Text>
                  <Text style={styles.detailsValue}>
                    {normalizeString(selectedCita?.medico?.especialidad || 'Medicina General')}
                  </Text>
                </View>
                <View style={styles.detailsRow}>
                  <Text style={styles.detailsLabel}>Inicio</Text>
                  <Text style={styles.detailsValue}>
                    {formatDateTime(selectedCita.fechaHoraInicio) || 'Sin horario'}
                  </Text>
                </View>
                <View style={styles.detailsRow}>
                  <Text style={styles.detailsLabel}>Fin</Text>
                  <Text style={styles.detailsValue}>
                    {formatDateTime(selectedCita.fechaHoraFin) || 'Sin horario'}
                  </Text>
                </View>
                <View style={styles.detailsRow}>
                  <Text style={styles.detailsLabel}>Duración</Text>
                  <Text style={styles.detailsValue}>
                    {Number.isFinite(selectedCita.duracionMin) ? `${selectedCita.duracionMin} min` : 'No especificada'}
                  </Text>
                </View>
                <View style={styles.detailsRow}>
                  <Text style={styles.detailsLabel}>Estado</Text>
                  <Text style={styles.detailsValue}>{normalizeString(selectedCita.estado || 'Pendiente')}</Text>
                </View>
                <View style={styles.detailsRow}>
                  <Text style={styles.detailsLabel}>Precio</Text>
                  <Text style={styles.detailsValue}>{formatPrice(selectedCita.precio)}</Text>
                </View>
                <View style={styles.detailsNoteBox}>
                  <Text style={styles.detailsLabel}>Nota</Text>
                  <Text style={styles.detailsNoteText}>
                    {normalizeString(selectedCita.nota || '') || 'Sin nota clínica registrada.'}
                  </Text>
                </View>

                <View style={styles.detailsActions}>
                  <TouchableOpacity
                    style={[
                      styles.detailsSecondaryBtn,
                      (!isCitaPostponable(selectedCita) || workingCitaId === normalizeString(selectedCita.citaid)) &&
                        styles.detailsSecondaryBtnDisabled,
                    ]}
                    disabled={
                      !isCitaPostponable(selectedCita) ||
                      workingCitaId === normalizeString(selectedCita.citaid)
                    }
                    onPress={() =>
                      Alert.alert(
                        'Posponer cita',
                        `Se movera 24 horas hacia adelante.\nCita actual: ${formatDateTime(selectedCita.fechaHoraInicio)}`,
                        [
                          { text: 'Cancelar', style: 'cancel' },
                          { text: 'Posponer', onPress: () => handlePostponeCita(selectedCita) },
                        ]
                      )
                    }
                  >
                    <Text
                      style={[
                        styles.detailsSecondaryBtnText,
                        (!isCitaPostponable(selectedCita) || workingCitaId === normalizeString(selectedCita.citaid)) &&
                          styles.detailsSecondaryBtnTextDisabled,
                      ]}
                    >
                      {workingCitaId === normalizeString(selectedCita.citaid)
                        ? 'Posponiendo...'
                        : 'Posponer 24h'}
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.detailsPrimaryBtn}
                    onPress={() => {
                      setDetailsOpen(false);
                      if (selectedCita?.citaid) {
                        navigation.navigate('SalaEsperaVirtualPaciente', { citaId: selectedCita.citaid });
                      } else {
                        navigation.navigate('SalaEsperaVirtualPaciente');
                      }
                    }}
                  >
                    <Text style={styles.detailsPrimaryBtnText}>Ir a videollamada</Text>
                  </TouchableOpacity>
                </View>
              </>
            ) : (
              <Text style={styles.detailsNoteText}>No se encontró información de la cita.</Text>
            )}
          </View>
        </View>
      </Modal>

    </View>
  );
};

/* ===================== COLORES ===================== */
const colors = {
  primary: '#137fec',
  brand: '#1F4770',
  bg: '#F6FAFD',
  dark: '#0A1931',
  blue: '#1F4770',
  muted: '#4A7FA7',
  light: '#B3CFE5',
  white: '#FFFFFF',
};

/* ===================== ESTILOS ===================== */
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
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#d8e4f0',
    backgroundColor: colors.white,
  },
  mobileMenuButtonText: {
    color: colors.dark,
    fontWeight: '700',
    fontSize: 13,
  },

  sidebar: {
    backgroundColor: colors.white,
    justifyContent: 'space-between',
  },
  sidebarDesktop: {
    width: 280,
    borderRightWidth: 1,
    borderRightColor: '#eef2f7',
    padding: 20,
  },
  sidebarMobile: {
    width: '100%',
    borderBottomWidth: 1,
    borderBottomColor: '#eef2f7',
    padding: 14,
  },

  logoBox: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  logo: { width: 44, height: 44, resizeMode: 'contain' },
  logoTitle: { fontSize: 20, fontWeight: '800', color: colors.dark, letterSpacing: 0.5 },
  logoSubtitle: { fontSize: 11, fontWeight: '700', color: colors.muted },

  userBox: { marginTop: 18, alignItems: 'center', paddingVertical: 12 },
  userAvatar: {
    width: 76,
    height: 76,
    borderRadius: 76,
    marginBottom: 10,
    borderWidth: 4,
    borderColor: '#f5f7fb',
  },
  userName: { fontWeight: '800', color: colors.dark, fontSize: 14 },
  userPlan: { color: colors.muted, fontSize: 11, fontWeight: '700', marginTop: 2 },
  hintText: { marginTop: 6, color: colors.muted, fontSize: 11, fontWeight: '700' },

  menu: {
    marginTop: 10,
    gap: 6,
  },
  menuDesktop: { flex: 1 },
  menuMobile: { flexDirection: 'row', flexWrap: 'wrap' },
  menuItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 12,
    minWidth: 150,
  },
  menuItemActive: {
    backgroundColor: 'rgba(19,127,236,0.10)',
    borderRightWidth: 3,
    borderRightColor: colors.primary,
  },
  menuText: { fontSize: 14, fontWeight: '700', color: colors.muted },
  menuTextActive: { color: colors.primary },

  logoutButton: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.brand,
    paddingVertical: 12,
    borderRadius: 12,
  },
  logoutText: { color: '#fff', fontWeight: '800' },

  main: {
    flex: 1,
    paddingHorizontal: 26,
    paddingTop: 18,
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
    marginBottom: 10,
    flexWrap: 'wrap',
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

  title: { fontSize: 30, fontWeight: '900', color: colors.dark, marginTop: 8, letterSpacing: -0.3 },
  subtitle: { fontSize: 14, color: colors.muted, marginTop: 4, marginBottom: 16, fontWeight: '600', lineHeight: 20 },

  bigCard: {
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 18,
    flexDirection: Platform.OS === 'web' ? 'row' : 'column',
    gap: 16,
    marginBottom: 18,
    shadowColor: colors.dark,
    shadowOpacity: 0.06,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 3,
  },
  bigCardLeft: { flex: 1 },
  bigCardRight: {
    width: Platform.OS === 'web' ? 160 : '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  bigCardImage: { width: 140, height: 140, borderRadius: 20 },

  liveRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  liveDot: { width: 10, height: 10, borderRadius: 10, backgroundColor: '#22c55e' },
  liveText: { color: colors.primary, fontSize: 11, fontWeight: '900', letterSpacing: 1, textTransform: 'uppercase' },

  bigCardTitle: { fontSize: 18, fontWeight: '900', color: colors.dark, marginBottom: 6 },
  bigCardSub: { color: colors.muted, fontWeight: '700', marginBottom: 14 },

  bigCardActions: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  primaryBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: colors.primary, paddingVertical: 12, paddingHorizontal: 16, borderRadius: 16, shadowColor: colors.primary, shadowOpacity: 0.3, shadowRadius: 8, shadowOffset: { width: 0, height: 4 }, elevation: 3 },
  primaryBtnText: { color: '#fff', fontWeight: '900' },
  secondaryBtn: { backgroundColor: '#f1f5f9', paddingVertical: 12, paddingHorizontal: 16, borderRadius: 16 },
  secondaryBtnText: { color: colors.muted, fontWeight: '900' },

  sectionTitle: { fontSize: 16, fontWeight: '900', color: colors.dark, marginBottom: 10, marginTop: 10 },
  link: { color: colors.primary, fontWeight: '900', fontSize: 12 },

  quickRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 18,
  },
  quickTile: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#eef3fa',
    shadowColor: colors.dark,
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },
  quickTileIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  quickTileLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.dark,
    textAlign: 'center',
  },

  twoCols: {
    flexDirection: Platform.OS === 'web' ? 'row' : 'column',
    gap: 16,
    marginTop: 16,
  },
  colLeft: { flex: 2 },
  colRight: { flex: 1.2 },
  colLeftFull: { flex: 1 },
  rowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },

  apptCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#fff',
    padding: 14,
    borderRadius: 18,
    marginTop: 10,
    shadowColor: colors.dark,
    shadowOpacity: 0.05,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  apptAvatar: { width: 52, height: 52, borderRadius: 16 },
  apptDoctor: { fontWeight: '900', color: colors.dark },
  apptDetail: { color: colors.muted, fontWeight: '700', marginTop: 2, fontSize: 12 },

  apptBtns: { flexDirection: 'row', gap: 8 },

  smallBtnGray: { backgroundColor: '#f1f5f9', paddingVertical: 8, paddingHorizontal: 12, borderRadius: 12 },
  smallBtnGrayDisabled: { backgroundColor: '#e2e8f0' },
  smallBtnGrayText: { color: colors.muted, fontWeight: '900', fontSize: 12 },
  smallBtnGrayTextDisabled: { color: '#94a3b8' },
  smallBtnBlue: { backgroundColor: 'rgba(19,127,236,0.12)', paddingVertical: 8, paddingHorizontal: 12, borderRadius: 12 },
  smallBtnBlueText: { color: colors.primary, fontWeight: '900', fontSize: 12 },

  chatCard: { backgroundColor: '#fff', borderRadius: 22, overflow: 'hidden', marginTop: 10, shadowColor: colors.dark, shadowOpacity: 0.05, shadowRadius: 10, shadowOffset: { width: 0, height: 4 }, elevation: 2 },
  chatHeader: { flexDirection: 'row', gap: 10, alignItems: 'center', backgroundColor: '#f8fafc', padding: 12, borderBottomWidth: 1, borderBottomColor: '#eef2f7' },
  chatAvatar: { width: 40, height: 40, borderRadius: 40 },
  chatName: { fontWeight: '900', color: colors.dark, fontSize: 12 },
  onlineRow: { flexDirection: 'row', gap: 6, alignItems: 'center', marginTop: 2 },
  onlineDot: { width: 8, height: 8, borderRadius: 8, backgroundColor: '#22c55e' },
  onlineText: { color: colors.muted, fontSize: 10, fontWeight: '900', letterSpacing: 1, textTransform: 'uppercase' },
  chatBody: { padding: 12, gap: 10, minHeight: 200 },
  msgLeft: { backgroundColor: '#f1f5f9', padding: 10, borderRadius: 16, alignSelf: 'flex-start', maxWidth: '90%' },
  msgLeftText: { color: colors.dark, fontWeight: '700', fontSize: 12 },
  msgRight: { backgroundColor: colors.primary, padding: 10, borderRadius: 16, alignSelf: 'flex-end', maxWidth: '90%' },
  msgRightText: { color: '#fff', fontWeight: '700', fontSize: 12 },
  chatInputRow: { flexDirection: 'row', gap: 10, alignItems: 'center', padding: 12, borderTopWidth: 1, borderTopColor: '#eef2f7' },
  chatInput: { flex: 1, backgroundColor: '#f8fafc', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10, color: colors.dark, fontWeight: '700' },
  chatFloatingPanel: {
    position: 'absolute',
    right: 24,
    bottom: 96,
    width: 360,
    maxWidth: '92%',
    backgroundColor: '#fff',
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: colors.dark,
    shadowOpacity: 0.2,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
  },
  chatFab: {
    position: 'absolute',
    right: 24,
    bottom: 24,
    width: 62,
    height: 62,
    borderRadius: 31,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.dark,
    shadowOpacity: 0.2,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
  },
  notificationsOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.18)',
    zIndex: 60,
  },
  notificationsPanel: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    width: 380,
    maxWidth: '94%',
    backgroundColor: colors.bg,
    borderLeftWidth: 1,
    borderLeftColor: '#d9e5f2',
    zIndex: 70,
    shadowColor: colors.dark,
    shadowOpacity: 0.18,
    shadowRadius: 16,
    shadowOffset: { width: -6, height: 0 },
    elevation: 12,
  },
  notificationsHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e7eff8',
  },
  notificationsTitle: { color: colors.dark, fontSize: 20, fontWeight: '900' },
  notificationsBody: { flex: 1, paddingHorizontal: 14, paddingTop: 12 },
  notificationsSubhead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 },
  notificationsSubheadText: { color: '#8aa7bf', fontSize: 11, fontWeight: '900', textTransform: 'uppercase' },
  markReadText: { color: colors.primary, fontSize: 12, fontWeight: '800' },
  notificationCard: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e4edf7',
    borderRadius: 12,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    marginBottom: 10,
    position: 'relative',
  },
  notificationCardMuted: { opacity: 0.7 },
  notificationAccent: {
    position: 'absolute',
    left: 0,
    top: 14,
    width: 3,
    height: 26,
    borderTopRightRadius: 3,
    borderBottomRightRadius: 3,
  },
  notificationIconBox: {
    width: 38,
    height: 38,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notificationTitleRow: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 6 },
  notificationTitle: { flex: 1, color: colors.dark, fontSize: 14, fontWeight: '900' },
  notificationTime: { color: '#9bb1c7', fontSize: 11, fontWeight: '700' },
  notificationText: { color: colors.muted, fontSize: 12, fontWeight: '600', lineHeight: 17, marginTop: 3 },
  notificationsFooter: {
    padding: 14,
    borderTopWidth: 1,
    borderTopColor: '#e7eff8',
    backgroundColor: '#fff',
  },
  notificationsButton: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  notificationsButtonText: { color: '#fff', fontSize: 14, fontWeight: '900' },

  listCard: { backgroundColor: '#fff', borderRadius: 22, overflow: 'hidden', marginTop: 10, shadowColor: colors.dark, shadowOpacity: 0.05, shadowRadius: 10, shadowOffset: { width: 0, height: 4 }, elevation: 2 },
  emptyStateCard: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingVertical: 30,
    backgroundColor: '#fff',
    borderRadius: 18,
    marginTop: 10,
    borderWidth: 1,
    borderColor: '#e4edf7',
    borderStyle: 'dashed',
  },
  emptyStateIconBox: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#f0f6ff',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  emptyStateTitle: {
    color: colors.dark,
    fontSize: 15,
    fontWeight: '800',
    marginBottom: 4,
  },
  emptyStateText: {
    color: colors.muted,
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
    lineHeight: 18,
  },
  emptyStateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 14,
    backgroundColor: colors.brand,
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 12,
  },
  emptyStateBtnText: {
    color: '#fff',
    fontWeight: '800',
    fontSize: 13,
  },

  ctaButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: colors.brand,
    borderRadius: 18,
    paddingVertical: 16,
    paddingHorizontal: 18,
    marginBottom: 18,
    shadowColor: colors.brand,
    shadowOpacity: 0.25,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
    elevation: 5,
  },
  ctaIconBox: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctaTextBox: {
    flex: 1,
  },
  ctaTitle: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '900',
    letterSpacing: 0.3,
  },
  ctaSub: {
    color: 'rgba(255,255,255,0.72)',
    fontSize: 12,
    fontWeight: '600',
    marginTop: 2,
  },
  docRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 14, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  docLeft: { flexDirection: 'row', gap: 12, alignItems: 'center', flex: 1 },
  docIconBox: { width: 44, height: 44, borderRadius: 16, backgroundColor: 'rgba(19,127,236,0.12)', alignItems: 'center', justifyContent: 'center' },
  docTitle: { fontWeight: '900', color: colors.dark, fontSize: 12 },
  docSub: { color: colors.muted, fontWeight: '700', fontSize: 11, marginTop: 2 },

  doctorsGrid: { flexDirection: 'row', gap: 12, marginTop: 10, flexWrap: 'wrap' },
  doctorCard: {
    width: Platform.OS === 'web' ? '48%' : '100%',
    backgroundColor: '#fff',
    padding: 14,
    borderRadius: 22,
    alignItems: 'center',
    shadowColor: colors.dark,
    shadowOpacity: 0.05,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  doctorAvatar: { width: 64, height: 64, borderRadius: 64, marginBottom: 10, borderWidth: 4, borderColor: '#f5f7fb' },
  doctorName: { fontWeight: '900', color: colors.dark, textAlign: 'center', fontSize: 12 },
  doctorSpec: { color: colors.muted, fontWeight: '900', fontSize: 10, marginTop: 4, marginBottom: 10, letterSpacing: 1, textTransform: 'uppercase' },
  reserveBtn: { width: '100%', paddingVertical: 10, borderRadius: 14, backgroundColor: '#f1f5f9', alignItems: 'center' },
  reserveText: { color: colors.primary, fontWeight: '900', fontSize: 11 },

  summaryCard: { backgroundColor: colors.dark, borderRadius: 24, padding: 16, marginTop: 18 },
  summaryHead: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 },
  summaryIconBox: { width: 34, height: 34, borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.12)', alignItems: 'center', justifyContent: 'center' },
  summaryTitle: { color: '#fff', fontWeight: '900', fontSize: 14 },
  summaryInner: { backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 18, padding: 14, borderWidth: 1, borderColor: 'rgba(255,255,255,0.10)' },
  summaryLabel: { color: colors.light, fontWeight: '900', fontSize: 10, letterSpacing: 1, textTransform: 'uppercase' },
  summaryDiag: { color: '#fff', fontWeight: '900', fontSize: 16, marginTop: 4 },
  summaryDate: { color: '#fff', opacity: 0.8, fontWeight: '800', fontSize: 11, backgroundColor: 'rgba(255,255,255,0.10)', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999 },
  summaryText: { color: colors.light, fontWeight: '600', fontSize: 12, marginTop: 10, lineHeight: 18 },

  detailsOverlay: {
    flex: 1,
    backgroundColor: 'rgba(10, 25, 49, 0.42)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  detailsModal: {
    width: '100%',
    maxWidth: 640,
    backgroundColor: '#fff',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#d7e4f2',
    padding: 18,
  },
  detailsHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  detailsTitle: {
    color: colors.dark,
    fontSize: 22,
    fontWeight: '900',
  },
  detailsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#edf2f8',
  },
  detailsLabel: {
    color: '#64748b',
    fontSize: 12,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  detailsValue: {
    color: colors.dark,
    fontSize: 13,
    fontWeight: '700',
    textAlign: 'right',
    flexShrink: 1,
  },
  detailsNoteBox: {
    marginTop: 12,
    borderWidth: 1,
    borderColor: '#dce8f5',
    borderRadius: 12,
    padding: 12,
    backgroundColor: '#f8fbff',
    gap: 6,
  },
  detailsNoteText: {
    color: colors.muted,
    fontSize: 13,
    fontWeight: '600',
    lineHeight: 19,
  },
  detailsActions: {
    marginTop: 14,
    flexDirection: Platform.OS === 'web' ? 'row' : 'column',
    gap: 10,
  },
  detailsPrimaryBtn: {
    flex: 1,
    backgroundColor: colors.primary,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
  },
  detailsPrimaryBtnText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '900',
  },
  detailsSecondaryBtn: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#d6e3f0',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    backgroundColor: '#f8fbff',
  },
  detailsSecondaryBtnDisabled: {
    backgroundColor: '#e2e8f0',
    borderColor: '#e2e8f0',
  },
  detailsSecondaryBtnText: {
    color: colors.blue,
    fontSize: 14,
    fontWeight: '900',
  },
  detailsSecondaryBtnTextDisabled: {
    color: '#94a3b8',
  },

  prepOverlay: {
    flex: 1,
    backgroundColor: 'rgba(10, 25, 49, 0.42)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingVertical: 20,
  },
  prepModal: {
    width: '100%',
    maxWidth: 980,
    backgroundColor: colors.bg,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#d9e6f2',
    padding: 22,
    maxHeight: '90%',
  },
  prepHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  prepBreadcrumb: {
    color: colors.muted,
    fontSize: 13,
    fontWeight: '800',
  },
  prepTitle: {
    marginTop: 8,
    fontSize: 34,
    fontWeight: '900',
    color: colors.dark,
    lineHeight: 40,
  },
  prepSub: {
    marginTop: 6,
    marginBottom: 16,
    fontSize: 18,
    fontWeight: '700',
    color: colors.muted,
  },
  prepGrid: {
    flexDirection: 'row',
    gap: 16,
  },
  prepCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#cfe0ee',
    borderRadius: 16,
    padding: 16,
  },
  prepCardTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: colors.dark,
    marginBottom: 11,
  },
  prepItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    backgroundColor: '#f8fbff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e6eef6',
    paddingVertical: 10,
    paddingHorizontal: 10,
    marginBottom: 10,
  },
  prepItemTitle: {
    color: colors.dark,
    fontWeight: '900',
    fontSize: 14,
  },
  prepItemSub: {
    marginTop: 2,
    color: colors.muted,
    fontWeight: '600',
    fontSize: 13,
    lineHeight: 18,
  },
  testBox: {
    backgroundColor: '#edf3fa',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#d8e4f0',
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 12,
  },
  testBar: {
    marginTop: 10,
    width: '78%',
    height: 8,
    borderRadius: 999,
    backgroundColor: '#d7e3ef',
    overflow: 'hidden',
  },
  testBarFill: {
    width: '4%',
    height: '100%',
    borderRadius: 999,
    backgroundColor: '#22c55e',
  },
  testBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 2,
    borderColor: colors.blue,
    borderRadius: 12,
    paddingVertical: 11,
    paddingHorizontal: 12,
    marginBottom: 12,
    backgroundColor: '#fff',
  },
  testBtnText: {
    color: colors.blue,
    fontWeight: '900',
    fontSize: 15,
  },
  testStatusText: {
    marginTop: 8,
    marginBottom: 12,
    color: colors.muted,
    fontWeight: '600',
    fontSize: 12,
    textAlign: 'center',
  },
  readyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 13,
    paddingHorizontal: 12,
    shadowColor: colors.dark,
    shadowOpacity: 0.14,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  readyBtnDisabled: {
    backgroundColor: '#e2e8f0',
    shadowOpacity: 0,
    elevation: 0,
  },
  readyBtnText: {
    color: '#fff',
    fontWeight: '900',
    fontSize: 18,
  },
  readyBtnTextDisabled: {
    color: '#94a3b8',
  },
  readySub: {
    marginTop: 10,
    textAlign: 'center',
    color: colors.muted,
    fontWeight: '600',
    fontSize: 11,
    lineHeight: 15,
  },
});

export default DashboardPacienteScreen;




