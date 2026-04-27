import React, { useCallback, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  TextInput,
  Platform,
  Linking,
  useWindowDimensions,
} from 'react-native';
import type { ImageSourcePropType } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { usePortalAwareMedicoNavigation } from './navigation/usePortalAwareMedicoNavigation';
import { useMedicoModule } from './navigation/MedicoModuleContext';
import { useAuth } from './providers/AuthProvider';
import { apiClient } from './utils/api';
import { getApiErrorMessage } from './utils/apiErrors';
import { useMedicoSessionProfile, type MedicoSessionUser } from './hooks/useMedicoSessionProfile';

import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

const ViremLogo = require('./assets/imagenes/descarga.png');
type MaterialIconName = any;

const DefaultAvatar = require('./assets/imagenes/avatar-default.jpg');
const PatientAvatar: ImageSourcePropType = DefaultAvatar;

// -------------------------------------------------------------
// COLORES Y CONSTANTES (Renovados)
// -------------------------------------------------------------
const colors = {
  primary: '#137fec',
  bg: '#F6FAFD',
  dark: '#0A1931',
  blue: '#1A3D63',
  green: '#22c55e',
  red: '#ef4444',
  muted: '#4A7FA7',
  white: '#FFFFFF',
  brand: '#137fec',
  viremLight: '#E8EFF5',
  viremMuted: '#7D95A9',
};

const MIN_REFRESH_INTERVAL_MS = 15000;

// -------------------------------------------------------------
// UTILS
// -------------------------------------------------------------
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
  return `en ${diffDay} día(s)`;
};

const parseDateMs = (value: string | null | undefined) => {
  if (!value) return Number.POSITIVE_INFINITY;
  const ms = new Date(value).getTime();
  return Number.isFinite(ms) ? ms : Number.POSITIVE_INFINITY;
};

function addDoctorPrefix(name: string) {
  const clean = name.trim();
  if (!clean) return 'Doctor';
  if (/^dr\.|^dra\./i.test(clean)) return clean;
  return `Dr. ${clean}`;
}

// -------------------------------------------------------------
// TYPES
// -------------------------------------------------------------
type SideItem = {
  icon: MaterialIconName;
  label: string;
  badge?: { text: string; color: string };
  active?: boolean;
  route?: 'DashboardMedico' | 'MedicoPerfil' | 'MedicoCitas' | 'MedicoPacientes' | 'MedicoChat';
};

type DashboardStats = {
  citasCompletadas: number;
  citasHoy: number;
  nuevosPacientesMes: number;
  mensajesPendientes: number;
};

type DashboardAgendaItem = {
  id: string;
  time: string;
  name: string;
  detail: string;
  patientId?: string;
  patientCode?: string;
  fechaHoraInicio?: string | null;
};

type DashboardExpedienteItem = {
  id: string;
  name: string;
  code: string;
  lastSeenText: string;
  lastSeenAt?: string | null;
};

type DashboardPayload = {
  stats: DashboardStats;
  agendaHoy: DashboardAgendaItem[];
  expedientesRecientes: DashboardExpedienteItem[];
};

type MedicoUpcomingCita = {
  citaid: string;
  fechaHoraInicio: string | null;
  estado: string;
  modalidad?: string;
  paciente: {
    pacienteid: string;
    nombreCompleto: string;
    fotoUrl?: string;
  };
};

const EMPTY_DASHBOARD: DashboardPayload = {
  stats: {
    citasCompletadas: 0,
    citasHoy: 0,
    nuevosPacientesMes: 0,
    mensajesPendientes: 0,
  },
  agendaHoy: [],
  expedientesRecientes: [],
};

// -------------------------------------------------------------
// COMPONENTES MODERNOS
// -------------------------------------------------------------
type AppointmentCardProps = {
  patient: string;
  detail: string;
  avatar: ImageSourcePropType;
  onVideoCall?: () => void;
  onDetails?: () => void;
  videoCallDisabled?: boolean;
  videoCallLabel?: string;
};

const AppointmentCard: React.FC<AppointmentCardProps> = ({
  patient,
  detail,
  avatar,
  onVideoCall,
  onDetails,
  videoCallDisabled,
  videoCallLabel = 'Videollamada',
}) => {
  return (
    <View style={styles.apptCard}>
      <Image source={avatar} style={styles.apptAvatar} />
      <View style={{ flex: 1 }}>
        <Text style={styles.apptDoctor}>{patient}</Text>
        <Text style={styles.apptDetail}>{detail}</Text>
      </View>

      <View style={styles.apptBtns}>
        {onVideoCall && (
          <TouchableOpacity
            style={[styles.smallBtnBlue, videoCallDisabled && styles.smallBtnGrayDisabled]}
            onPress={onVideoCall}
            disabled={videoCallDisabled}
          >
            <Text style={[styles.smallBtnBlueText, videoCallDisabled && styles.smallBtnGrayTextDisabled]}>
              {videoCallLabel}
            </Text>
          </TouchableOpacity>
        )}
        {onDetails && (
          <TouchableOpacity style={styles.smallBtnGray} onPress={onDetails}>
            <Text style={styles.smallBtnGrayText}>Detalles</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const FileCard: React.FC<{ name: string; id: string; lastSeen: string; onPress?: () => void }> = ({ name, id, lastSeen, onPress }) => (
  <View style={styles.docRow}>
    <View style={styles.docLeft}>
      <View style={styles.docIconBox}>
        <MaterialIcons name="folder-shared" size={20} color={colors.primary} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.docTitle} numberOfLines={1}>
          {name}
        </Text>
        <Text style={styles.docSub} numberOfLines={1}>
          Expediente #{id} • {lastSeen}
        </Text>
      </View>
    </View>
    <TouchableOpacity onPress={onPress}>
      <MaterialIcons name="chevron-right" size={20} color={colors.muted} />
    </TouchableOpacity>
  </View>
);

const StatPill: React.FC<{ title: string; value: string; icon: MaterialIconName; trendText: string; trendUp?: boolean }> = ({ title, value, icon, trendText, trendUp = true }) => {
  return (
    <View style={styles.statCard}>
      <View style={styles.statTopRow}>
        <Text style={styles.statTitle}>{title}</Text>
        <MaterialIcons name={icon} size={20} color={colors.primary} />
      </View>

      <View style={styles.statBottomRow}>
        <Text style={styles.statValue}>{value}</Text>
        <View style={styles.trendRow}>
          <MaterialIcons
            name={trendUp ? 'trending-up' : 'trending-down'}
            size={16}
            color={trendUp ? colors.green : colors.red}
          />
          <Text style={[styles.trendText, { color: trendUp ? colors.green : colors.red }]}>
            {trendText}
          </Text>
        </View>
      </View>
    </View>
  );
};

// -------------------------------------------------------------
// PANTALLA PRINCIPAL
// -------------------------------------------------------------
const DashboardMedico: React.FC = () => {
  const navigation = usePortalAwareMedicoNavigation();
  const { isInsidePortal } = useMedicoModule();
  const { signOut } = useAuth();
  const { syncProfile } = useMedicoSessionProfile();
  const { width: viewportWidth } = useWindowDimensions();
  const isDesktopLayout = Platform.OS === 'web' && viewportWidth >= 1024;
  
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [doctorName, setDoctorName] = useState('Doctor');
  const [doctorSpec, setDoctorSpec] = useState('Especialidad no definida');
  const [doctorAvatar, setDoctorAvatar] = useState<ImageSourcePropType>(DefaultAvatar);
  
  const [dashboardData, setDashboardData] = useState<DashboardPayload>(EMPTY_DASHBOARD);
  const [upcomingCitas, setUpcomingCitas] = useState<MedicoUpcomingCita[]>([]);
  const [loadingDashboard, setLoadingDashboard] = useState(false);
  const [profileReady, setProfileReady] = useState(false);
  const [openingCitaId, setOpeningCitaId] = useState('');
  
  const lastRefreshRef = useRef(0);

  const toggleMobileMenu = () => setIsMobileMenuOpen((prev) => !prev);
  const closeMobileMenu = () => setIsMobileMenuOpen(false);

  const loadDashboardData = useCallback(async () => {
    setLoadingDashboard(true);
    try {
      const payload = await apiClient.get<any>('/api/users/me/dashboard-medico', {
        authenticated: true,
      });
      if (!(payload?.success && payload?.dashboard)) {
        setDashboardData(EMPTY_DASHBOARD);
        return;
      }

      const dashboard = payload.dashboard;
      const profile = dashboard?.profile || {};

      const nextStats: DashboardStats = {
        citasCompletadas: Number(dashboard?.stats?.citasCompletadas || 0),
        citasHoy: Number(dashboard?.stats?.citasHoy || 0),
        nuevosPacientesMes: Number(dashboard?.stats?.nuevosPacientesMes || 0),
        mensajesPendientes: Number(dashboard?.stats?.mensajesPendientes || 0),
      };

      const nextAgenda: DashboardAgendaItem[] = Array.isArray(dashboard?.agendaHoy)
        ? dashboard.agendaHoy.map((item: any) => ({
            id: String(item?.id || ''),
            time: String(item?.time || ''),
            name: String(item?.name || 'Paciente'),
            detail: String(item?.detail || 'Consulta programada'),
            patientId: String(item?.patientId || ''),
            patientCode: String(item?.patientCode || ''),
            fechaHoraInicio: item?.fechaHoraInicio || null,
          }))
        : [];

      const nextExpedientes: DashboardExpedienteItem[] = Array.isArray(dashboard?.expedientesRecientes)
        ? dashboard.expedientesRecientes.map((item: any) => ({
            id: String(item?.id || ''),
            name: String(item?.name || 'Paciente'),
            code: String(item?.code || ''),
            lastSeenText: String(item?.lastSeenText || 'Sin historial'),
            lastSeenAt: item?.lastSeenAt || null,
          }))
        : [];

      setDashboardData({
        stats: nextStats,
        agendaHoy: nextAgenda,
        expedientesRecientes: nextExpedientes,
      });

      const backendName = String(profile?.nombreCompleto || '').replace(/\s+/g, ' ').trim();
      const backendSpec = String(profile?.especialidad || '').replace(/\s+/g, ' ').trim();
      const backendFoto = sanitizeFotoUrl(profile?.fotoUrl);

      if (backendName) setDoctorName(addDoctorPrefix(backendName));
      if (backendSpec) setDoctorSpec(backendSpec);
      if (backendFoto) setDoctorAvatar({ uri: backendFoto });
    } catch {
      setDashboardData(EMPTY_DASHBOARD);
    } finally {
      setLoadingDashboard(false);
    }
  }, []);

  const loadUpcomingCitas = useCallback(async () => {
    try {
      const payload = await apiClient.get<any>('/api/agenda/me/citas', {
        authenticated: true,
        query: { scope: 'upcoming', limit: 20 },
      });
      if (!(payload?.success && Array.isArray(payload?.citas))) {
        setUpcomingCitas([]);
        return;
      }

      const mapped = (payload.citas as any[]).map((item) => ({
        citaid: String(item?.citaid || ''),
        fechaHoraInicio: item?.fechaHoraInicio || null,
        estado: String(item?.estado || 'Pendiente'),
        modalidad: String(item?.modalidad || ''),
        paciente: {
          pacienteid: String(item?.paciente?.pacienteid || ''),
          nombreCompleto: String(item?.paciente?.nombreCompleto || 'Paciente'),
          fotoUrl: item?.paciente?.fotoUrl || '',
        },
      })).filter((item) => String(item?.modalidad || '').toLowerCase() === 'virtual');

      mapped.sort((a, b) => parseDateMs(a?.fechaHoraInicio) - parseDateMs(b?.fechaHoraInicio));
      setUpcomingCitas(mapped);
    } catch {
      setUpcomingCitas([]);
    }
  }, []);

  const loadMedicoProfile = useCallback(async () => {
    try {
      const nextUser = (await syncProfile()) as MedicoSessionUser | null;
      await Promise.all([loadDashboardData(), loadUpcomingCitas()]);

      const nombreBase = String(
        nextUser?.nombreCompleto || nextUser?.medico?.nombreCompleto || ''
      )
        .replace(/\s+/g, ' ')
        .trim();
      const especialidadBase = String(
        nextUser?.especialidad || nextUser?.medico?.especialidad || ''
      )
        .replace(/\s+/g, ' ')
        .trim();
      const fotoBase = sanitizeFotoUrl(
        nextUser?.fotoUrl || nextUser?.medico?.fotoUrl || ''
      );

      setDoctorName(nombreBase ? addDoctorPrefix(nombreBase) : 'Doctor');
      setDoctorSpec(especialidadBase || 'Especialidad no definida');
      setDoctorAvatar(fotoBase ? { uri: fotoBase } : DefaultAvatar);
    } catch {
      setDoctorName('Doctor');
    } finally {
      setProfileReady(true);
    }
  }, [syncProfile, loadDashboardData, loadUpcomingCitas]);

  useFocusEffect(
    useCallback(() => {
      const now = Date.now();
      if (!profileReady || now - lastRefreshRef.current > MIN_REFRESH_INTERVAL_MS) {
        lastRefreshRef.current = now;
        loadMedicoProfile();
      }
    }, [profileReady, loadMedicoProfile])
  );

  const handleLogout = async () => {
    closeMobileMenu();
    await signOut();
    navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
  };

  const handleSidebarNavigation = (route: string) => {
    closeMobileMenu();
    navigation.navigate(route as any);
  };

  const handleVideoCall = async (citaId?: string) => {
    const targetCita = citaId 
      ? upcomingCitas.find(c => c.citaid === citaId) 
      : upcomingCitas[0];
      
    if (!targetCita) return;

    setOpeningCitaId(targetCita.citaid);
    try {
      const payload = await apiClient.post<any>(
        `/api/jitsi/citas/${targetCita.citaid}/sala`,
        { authenticated: true }
      );
      if (!payload?.success || !payload?.salaUrl) {
        throw new Error(payload?.message || 'Error al obtener la sala.');
      }
      if (Platform.OS === 'web') {
        window.open(payload.salaUrl, '_blank', 'noopener,noreferrer');
      } else {
        await Linking.openURL(payload.salaUrl);
      }
    } catch (error: any) {
      Alert.alert('Error', getApiErrorMessage(error, 'No se pudo abrir la sala de espera'));
    } finally {
      setOpeningCitaId('');
    }
  };

  const nextCita = upcomingCitas[0] || null;
  const bannerPatientName = nextCita ? nextCita.paciente.nombreCompleto : '';
  const bannerPatientAvatar = resolveAvatarSource(nextCita?.paciente?.fotoUrl);
  
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
              <Text style={styles.logoSubtitle}>Portal Médico</Text>
            </View>
          </View>

          {/* User mini */}
          <View style={styles.userBox}>
            <Image source={doctorAvatar} style={styles.userAvatar} />
            <Text style={styles.userName}>{doctorName}</Text>
            <Text style={styles.userPlan}>{doctorSpec}</Text>
          </View>

          {/* Menú */}
          <View style={[styles.menu, isDesktopLayout ? styles.menuDesktop : styles.menuMobile]}>
            <TouchableOpacity
              style={[styles.menuItemRow, styles.menuItemActive]}
              onPress={() => handleSidebarNavigation('DashboardMedico')}
            >
              <MaterialIcons name="grid-view" size={20} color={colors.primary} />
              <Text style={[styles.menuText, styles.menuTextActive]}>Inicio</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.menuItemRow} onPress={() => handleSidebarNavigation('MedicoCitas')}>
              <MaterialIcons name="calendar-today" size={20} color={colors.muted} />
              <Text style={styles.menuText}>Agenda</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.menuItemRow} onPress={() => handleSidebarNavigation('MedicoPacientes')}>
              <MaterialIcons name="group" size={20} color={colors.muted} />
              <Text style={styles.menuText}>Pacientes</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.menuItemRow} onPress={() => handleSidebarNavigation('MedicoChat')}>
              <MaterialIcons name="chat-bubble" size={20} color={colors.muted} />
              <Text style={styles.menuText}>Mensajes</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.menuItemRow} onPress={() => handleSidebarNavigation('MedicoPerfil')}>
              <MaterialIcons name="account-circle" size={20} color={colors.muted} />
              <Text style={styles.menuText}>Perfil</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Cerrar sesión */}
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <MaterialIcons name="logout" size={18} color="#fff" />
          <Text style={styles.logoutText}>Cerrar sesión</Text>
        </TouchableOpacity>
      </View>
      )}

      {/* ===================== MAIN ===================== */}
      <ScrollView style={[styles.main, !isDesktopLayout ? styles.mainMobile : null]} contentContainerStyle={{ paddingBottom: 40 }}>
        
        {/* Header simple */}
        <View style={styles.header}>
          <Text style={styles.title}>Panel Médico</Text>
          <TouchableOpacity style={styles.notifBtn}>
            <MaterialIcons name="notifications-none" size={24} color={colors.dark} />
            {dashboardData.stats.mensajesPendientes > 0 && <View style={styles.notifDot} />}
          </TouchableOpacity>
        </View>
        <Text style={styles.subtitle}>Aquí tienes un resumen de tu jornada y próximos pacientes.</Text>

        {/* Hero Card (Big Card) */}
        <View style={styles.bigCard}>
          <View style={styles.bigCardLeft}>
            <View style={styles.liveRow}>
              <View style={[styles.liveDot, { backgroundColor: nextCita ? '#22c55e' : colors.primary }]} />
              <Text style={[styles.liveText, { color: nextCita ? '#22c55e' : colors.primary }]}>
                {nextCita ? 'PRÓXIMA CITA' : 'JORNADA ACTIVA'}
              </Text>
            </View>
            <Text style={styles.bigCardTitle}>Bienvenido de nuevo, {doctorName}</Text>
            <Text style={styles.bigCardSub}>
              {nextCita 
                ? `Tienes una videollamada programada con ${bannerPatientName} para las ${formatDateTime(nextCita.fechaHoraInicio)}.` 
                : 'No tienes citas virtuales programadas para este momento.'}
            </Text>

            <View style={styles.bigCardActions}>
              <TouchableOpacity
                style={styles.primaryBtn}
                activeOpacity={0.8}
                onPress={() => nextCita ? handleVideoCall(nextCita.citaid) : navigation.navigate('MedicoCitas')}
                disabled={openingCitaId === (nextCita?.citaid || '')}
              >
                <MaterialIcons name={nextCita ? 'videocam' : 'calendar-today'} size={18} color="#fff" />
                <Text style={styles.primaryBtnText}>
                  {openingCitaId === (nextCita?.citaid || '') 
                    ? 'Abriendo...' 
                    : (nextCita ? 'Iniciar Videollamada' : 'Ver agenda completa')}
                </Text>
              </TouchableOpacity>

              {nextCita && (
                <TouchableOpacity
                  style={styles.secondaryBtn}
                  activeOpacity={0.8}
                  onPress={() => navigation.navigate('MedicoPacientes')}
                >
                  <Text style={styles.secondaryBtnText}>Ver paciente</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>

          <View style={styles.bigCardRight}>
            <Image source={doctorAvatar} style={styles.bigCardImage} />
          </View>
        </View>

        {/* Quick Tiles */}
        <View style={styles.quickRow}>
          <TouchableOpacity
            style={styles.quickTile}
            onPress={() => navigation.navigate('MedicoCitas')}
            activeOpacity={0.7}
          >
            <View style={[styles.quickTileIcon, { backgroundColor: 'rgba(19,127,236,0.12)' }]}>
              <MaterialIcons name="event-note" size={22} color={colors.primary} />
            </View>
            <Text style={styles.quickTileLabel}>Agenda</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.quickTile}
            onPress={() => navigation.navigate('MedicoPacientes')}
            activeOpacity={0.7}
          >
            <View style={[styles.quickTileIcon, { backgroundColor: '#fff7ed' }]}>
              <MaterialIcons name="people-outline" size={22} color="#f97316" />
            </View>
            <Text style={styles.quickTileLabel}>Pacientes</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.quickTile}
            onPress={() => navigation.navigate('MedicoChat')}
            activeOpacity={0.7}
          >
            <View style={[styles.quickTileIcon, { backgroundColor: '#faf5ff' }]}>
              <MaterialIcons name="chat-bubble-outline" size={22} color="#a855f7" />
            </View>
            <Text style={styles.quickTileLabel}>Mensajes</Text>
          </TouchableOpacity>
        </View>

        {/* Two Columns */}
        <View style={styles.twoCols}>
          <View style={[styles.colLeft, styles.colLeftFull]}>
            <View style={styles.rowBetween}>
              <Text style={styles.sectionTitle}>Próximas videocitas</Text>
              <TouchableOpacity onPress={() => navigation.navigate('MedicoCitas')} activeOpacity={0.7}>
                <Text style={styles.link}>Ver todas</Text>
              </TouchableOpacity>
            </View>

            {loadingDashboard && upcomingCitas.length === 0 ? (
              <ActivityIndicator size="small" color={colors.primary} style={{ marginTop: 20 }} />
            ) : upcomingCitas.length ? (
              upcomingCitas.slice(0, 5).map((cita) => (
                <AppointmentCard
                  key={cita.citaid}
                  patient={cita.paciente.nombreCompleto}
                  detail={`Virtual • ${formatDateTime(cita.fechaHoraInicio)}`}
                  avatar={resolveAvatarSource(cita.paciente.fotoUrl)}
                  onVideoCall={() => handleVideoCall(cita.citaid)}
                  videoCallDisabled={openingCitaId === cita.citaid}
                  videoCallLabel={openingCitaId === cita.citaid ? 'Abriendo...' : 'Iniciar Sala'}
                  onDetails={() => navigation.navigate('MedicoCitas')}
                />
              ))
            ) : (
              <View style={styles.emptyCard}>
                <MaterialCommunityIcons name="calendar-blank" size={32} color={colors.muted} />
                <Text style={styles.emptyText}>No hay videocitas programadas.</Text>
              </View>
            )}

            <View style={styles.rowBetween}>
              <Text style={styles.sectionTitle}>Expedientes Recientes</Text>
              <TouchableOpacity onPress={() => navigation.navigate('MedicoPacientes')} activeOpacity={0.7}>
                <Text style={styles.link}>Buscar paciente</Text>
              </TouchableOpacity>
            </View>

            {dashboardData.expedientesRecientes.length > 0 ? (
              dashboardData.expedientesRecientes.map((exp) => (
                <FileCard 
                  key={exp.id} 
                  name={exp.name} 
                  id={exp.code} 
                  lastSeen={exp.lastSeenText} 
                  onPress={() => navigation.navigate('MedicoPacientes')} 
                />
              ))
            ) : (
              <View style={styles.emptyCard}>
                <MaterialIcons name="folder-open" size={32} color={colors.muted} />
                <Text style={styles.emptyText}>No hay expedientes recientes.</Text>
              </View>
            )}
          </View>

          {/* Right Column: Stats */}
          <View style={[styles.colRight, !isDesktopLayout && { marginTop: 10 }]}>
            <Text style={styles.sectionTitle}>Resumen Actividad</Text>
            <View style={styles.statsContainer}>
              <StatPill
                title="Citas Completadas"
                value={String(dashboardData.stats.citasCompletadas)}
                icon="check-circle"
                trendText={`${dashboardData.stats.citasHoy} hoy`}
                trendUp
              />
              <StatPill
                title="Nuevos Pacientes"
                value={String(dashboardData.stats.nuevosPacientesMes)}
                icon="person-add"
                trendText="Este mes"
                trendUp
              />
              <StatPill
                title="Mensajes Pendientes"
                value={String(dashboardData.stats.mensajesPendientes)}
                icon="mail"
                trendText={loadingDashboard ? '...' : 'Sincronizado'}
                trendUp={dashboardData.stats.mensajesPendientes === 0}
              />
            </View>
          </View>
        </View>

      </ScrollView>
    </View>
  );
};

export default DashboardMedico;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  containerDesktop: { flexDirection: 'row' },
  containerMobile: { flexDirection: 'column' },
  
  mobileMenuBar: { paddingHorizontal: 14, paddingTop: 12, paddingBottom: 8, backgroundColor: colors.bg },
  mobileMenuButton: { alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10, borderWidth: 1, borderColor: '#d8e4f0', backgroundColor: colors.white },
  mobileMenuButtonText: { color: colors.dark, fontWeight: '700', fontSize: 13 },

  sidebar: { backgroundColor: colors.white, justifyContent: 'space-between' },
  sidebarDesktop: { width: 280, borderRightWidth: 1, borderRightColor: '#eef2f7', padding: 20 },
  sidebarMobile: { width: '100%', borderBottomWidth: 1, borderBottomColor: '#eef2f7', padding: 14 },

  logoBox: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  logo: { width: 44, height: 44, resizeMode: 'contain' },
  logoTitle: { fontSize: 20, fontWeight: '800', color: colors.dark, letterSpacing: 0.5 },
  logoSubtitle: { fontSize: 11, fontWeight: '700', color: colors.muted },

  userBox: { marginTop: 18, alignItems: 'center', paddingVertical: 12 },
  userAvatar: { width: 76, height: 76, borderRadius: 76, marginBottom: 10, borderWidth: 4, borderColor: '#f5f7fb' },
  userName: { fontWeight: '800', color: colors.dark, fontSize: 14, textAlign: 'center' },
  userPlan: { color: colors.muted, fontSize: 11, fontWeight: '700', marginTop: 2, textAlign: 'center' },

  menu: { marginTop: 10, gap: 6 },
  menuDesktop: { flex: 1 },
  menuMobile: { flexDirection: 'row', flexWrap: 'wrap' },
  menuItemRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, paddingHorizontal: 12, borderRadius: 12, minWidth: 150 },
  menuItemActive: { backgroundColor: 'rgba(19,127,236,0.10)', borderRightWidth: 3, borderRightColor: colors.primary },
  menuText: { fontSize: 14, fontWeight: '700', color: colors.muted },
  menuTextActive: { color: colors.primary },

  logoutButton: { flexDirection: 'row', gap: 10, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.brand, paddingVertical: 12, borderRadius: 12 },
  logoutText: { color: '#fff', fontWeight: '800' },

  main: { flex: 1, paddingHorizontal: 26, paddingTop: 18 },
  mainMobile: { paddingHorizontal: 14, paddingTop: 12 },

  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 10, flexWrap: 'wrap' },
  notifBtn: { width: 46, height: 46, borderRadius: 14, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', shadowColor: colors.dark, shadowOpacity: 0.06, shadowRadius: 10, shadowOffset: { width: 0, height: 4 }, elevation: 2 },
  notifDot: { position: 'absolute', top: 12, right: 12, width: 10, height: 10, borderRadius: 10, backgroundColor: '#ef4444', borderWidth: 2, borderColor: '#fff' },

  title: { fontSize: 30, fontWeight: '900', color: colors.dark, marginTop: 8, letterSpacing: -0.3 },
  subtitle: { fontSize: 14, color: colors.muted, marginTop: 4, marginBottom: 16, fontWeight: '600', lineHeight: 20 },

  bigCard: { backgroundColor: '#fff', borderRadius: 24, padding: 18, flexDirection: Platform.OS === 'web' ? 'row' : 'column', gap: 16, marginBottom: 18, shadowColor: colors.dark, shadowOpacity: 0.06, shadowRadius: 12, shadowOffset: { width: 0, height: 6 }, elevation: 3 },
  bigCardLeft: { flex: 1 },
  bigCardRight: { width: Platform.OS === 'web' ? 160 : '100%', justifyContent: 'center', alignItems: 'center' },
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

  quickRow: { flexDirection: 'row', gap: 10, marginBottom: 18 },
  quickTile: { flex: 1, backgroundColor: '#fff', borderRadius: 16, paddingVertical: 14, paddingHorizontal: 10, alignItems: 'center', borderWidth: 1, borderColor: '#eef3fa', shadowColor: colors.dark, shadowOpacity: 0.05, shadowRadius: 8, shadowOffset: { width: 0, height: 3 }, elevation: 2 },
  quickTileIcon: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  quickTileLabel: { fontSize: 12, fontWeight: '700', color: colors.dark, textAlign: 'center' },

  twoCols: { flexDirection: Platform.OS === 'web' ? 'row' : 'column', gap: 16, marginTop: 16 },
  colLeft: { flex: 2 },
  colRight: { flex: 1.2 },
  colLeftFull: { flex: 1 },
  rowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },

  sectionTitle: { fontSize: 16, fontWeight: '900', color: colors.dark, marginBottom: 10, marginTop: 10 },
  link: { color: colors.primary, fontWeight: '900', fontSize: 12 },

  apptCard: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#fff', padding: 14, borderRadius: 18, marginTop: 10, shadowColor: colors.dark, shadowOpacity: 0.05, shadowRadius: 10, shadowOffset: { width: 0, height: 4 }, elevation: 2 },
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

  docRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#eef2f7' },
  docLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  docIconBox: { width: 40, height: 40, borderRadius: 12, backgroundColor: '#f4f8fc', alignItems: 'center', justifyContent: 'center' },
  docTitle: { color: colors.dark, fontWeight: '700', fontSize: 13 },
  docSub: { color: colors.muted, fontSize: 11, marginTop: 2 },

  emptyCard: { alignItems: 'center', padding: 24, backgroundColor: '#fff', borderRadius: 18, borderWidth: 1, borderColor: '#eef2f7', borderStyle: 'dashed', marginTop: 10 },
  emptyText: { color: colors.muted, fontWeight: '600', marginTop: 10 },

  statsContainer: { gap: 10, marginTop: 10 },
  statCard: { backgroundColor: '#fff', padding: 16, borderRadius: 18, shadowColor: colors.dark, shadowOpacity: 0.05, shadowRadius: 10, shadowOffset: { width: 0, height: 4 }, elevation: 2 },
  statTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  statTitle: { color: colors.muted, fontWeight: '700', fontSize: 12, textTransform: 'uppercase', letterSpacing: 0.5 },
  statBottomRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' },
  statValue: { fontSize: 24, fontWeight: '900', color: colors.dark },
  trendRow: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#f8fafc', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  trendText: { fontSize: 11, fontWeight: '800' },
});
