import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { sanitizeRemoteImageUrl, resolveRemoteImageSource } from '../../utils/imageSources';
// v1.0.1 - Build trigger
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
import { usePortalAwareMedicoNavigation } from '../../navigation/usePortalAwareMedicoNavigation';
import { useMedicoModule } from '../../navigation/MedicoModuleContext';
import { useAuth } from '../../providers/AuthProvider';
import { apiClient } from '../../utils/api';
import { getApiErrorMessage } from '../../utils/apiErrors';
import { useMedicoSessionProfile, type MedicoSessionUser } from '../../hooks/useMedicoSessionProfile';
import VideoCallFrame from '../../components/VideoCallFrame';
import { useVideoCall } from '../../hooks/useVideoCall';
import { useResponsive } from '../../hooks/useResponsive';
import Skeleton from '../../components/Skeleton';
import ViremImage from '../../components/ViremImage';
import FadeInView from '../../components/FadeInView';
import { colors } from '../../theme/colors';

import { MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';

const ViremLogo = require('../../assets/imagenes/descarga.png');
type MaterialIconName = any;

const DefaultAvatar = require('../../assets/imagenes/avatar-default.jpg');
const PatientAvatar: ImageSourcePropType = DefaultAvatar;

// -------------------------------------------------------------
// COLORES Y CONSTANTES (Renovados)
// -------------------------------------------------------------


const MIN_REFRESH_INTERVAL_MS = 15000;

// -------------------------------------------------------------
// UTILS
// -------------------------------------------------------------
const normalizeString = (value: unknown) =>
  String(value || '')
    .replace(/\s+/g, ' ')
    .trim();



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
  avatar: any;
  onVideoCall?: () => void;
  onDetails?: () => void;
  videoCallDisabled?: boolean;
  videoCallLabel?: string;
};



// -------------------------------------------------------------
// PANTALLA PRINCIPAL
// -------------------------------------------------------------
const DashboardMedico: React.FC = () => {
  const navigation = usePortalAwareMedicoNavigation();
  const { isInsidePortal } = useMedicoModule();
  const { signOut } = useAuth();
  const { syncProfile } = useMedicoSessionProfile();
  const { fs, rs, wp, hp, select, isDesktop, isTablet, isMobile, typography } = useResponsive();
  const isDesktopLayout = isDesktop;
  
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [doctorName, setDoctorName] = useState('Doctor');
  const [doctorSpec, setDoctorSpec] = useState('Especialidad no definida');
  const [doctorAvatar, setDoctorAvatar] = useState<ImageSourcePropType>(DefaultAvatar);
  
  const [dashboardData, setDashboardData] = useState<DashboardPayload>(EMPTY_DASHBOARD);
  const [upcomingCitas, setUpcomingCitas] = useState<MedicoUpcomingCita[]>([]);
  const [loadingDashboard, setLoadingDashboard] = useState(false);
  const [profileReady, setProfileReady] = useState(false);
  const [openingCitaId, setOpeningCitaId] = useState('');
  const { isInCall, roomInfo, startCall, endCall, error: callError, setError: setCallError } = useVideoCall();
  
  const lastRefreshRef = useRef(0);

  // --- Sub-componentes internos para acceder a styles ---


  // -------------------------------------------------------------
  // ESTILOS DINÁMICOS (Premium Responsive)
  // -------------------------------------------------------------
  const styles = useMemo(() => StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.bg },
    containerDesktop: { flexDirection: 'row' },
    containerTablet: { flexDirection: 'row' },
    containerMobile: { flexDirection: 'column' },
    mainCallContainer: {
      flex: 1,
      backgroundColor: '#000',
      overflow: 'hidden',
    },
    overlay: {
      position: 'absolute',
      top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.4)',
      zIndex: 90,
    },
    
    mobileMenuBar: { 
      paddingHorizontal: rs(14), 
      paddingTop: rs(12), 
      paddingBottom: rs(8), 
      backgroundColor: colors.bg 
    },
    mobileMenuButton: { 
      alignSelf: 'flex-start', 
      flexDirection: 'row', 
      alignItems: 'center', 
      gap: rs(8), 
      paddingHorizontal: rs(12), 
      paddingVertical: rs(8), 
      borderRadius: rs(10), 
      borderWidth: 1, 
      borderColor: '#d8e4f0', 
      backgroundColor: colors.white 
    },
    mobileMenuButtonText: { color: colors.dark, fontWeight: '700', fontSize: fs(13) },

    sidebar: { backgroundColor: colors.white, justifyContent: 'space-between', zIndex: 100 },
    sidebarDesktop: { 
      width: 250, 
      borderRightWidth: 1, 
      borderRightColor: '#eef2f7', 
      padding: rs(16) 
    },
    sidebarTablet: { 
      width: rs(220), 
      borderRightWidth: 1, 
      borderRightColor: '#eef2f7', 
      padding: rs(16) 
    },
    sidebarMobile: { 
      position: 'absolute',
      left: 0, top: 0, bottom: 0,
      width: '80%', 
      maxWidth: 300,
      padding: rs(18),
      shadowColor: '#000',
      shadowOpacity: 0.25,
      shadowRadius: 20,
      elevation: 20,
    },

    logoBox: { flexDirection: 'row', alignItems: 'center', gap: rs(10) },
    logo: { width: rs(44), height: rs(44), resizeMode: 'contain' },
    logoTitle: { fontSize: fs(20), fontWeight: '800', color: colors.dark, letterSpacing: 0.5 },
    logoSubtitle: { fontSize: fs(11), fontWeight: '700', color: colors.muted },

    userBox: { marginTop: rs(10), alignItems: 'center', paddingVertical: rs(10) },
    userAvatar: { 
      width: rs(60), 
      height: rs(60), 
      borderRadius: rs(60), 
      marginBottom: rs(8), 
      borderWidth: 3, 
      borderColor: '#f5f7fb' 
    },
    userName: { fontWeight: '800', color: colors.dark, fontSize: fs(13), textAlign: 'center' },
    userPlan: { color: colors.muted, fontSize: fs(10), fontWeight: '700', marginTop: rs(1), textAlign: 'center' },

    menu: { marginTop: rs(10), gap: rs(6) },
    menuDesktop: { flex: 1 },
    menuMobile: { flexDirection: 'row', flexWrap: 'wrap' },
    menuItemRow: { 
      flexDirection: 'row', 
      alignItems: 'center', 
      gap: rs(12), 
      paddingVertical: rs(12), 
      paddingHorizontal: rs(12), 
      borderRadius: rs(12), 
      minWidth: rs(140) 
    },
    menuItemActive: { 
      backgroundColor: 'rgba(19,127,236,0.10)', 
      borderRightWidth: 3, 
      borderRightColor: colors.primary 
    },
    menuText: { fontSize: fs(14), fontWeight: '700', color: colors.muted },
    menuTextActive: { color: colors.primary },

    logoutButton: { 
      flexDirection: 'row', 
      gap: rs(10), 
      alignItems: 'center', 
      justifyContent: 'center', 
      backgroundColor: colors.brand, 
      paddingVertical: rs(12), 
      borderRadius: rs(12) 
    },
    logoutText: { color: '#fff', fontWeight: '800', fontSize: fs(14) },

    main: { flex: 1, paddingHorizontal: rs(24), paddingTop: rs(18) },
    mainMobile: { paddingHorizontal: rs(14), paddingTop: rs(12) },

    header: { 
      flexDirection: 'row', 
      alignItems: 'center', 
      justifyContent: 'space-between', 
      gap: rs(12), 
      marginBottom: rs(10), 
      flexWrap: 'wrap' 
    },
    notifBtn: { 
      width: rs(44), 
      height: rs(44), 
      borderRadius: rs(14), 
      backgroundColor: '#fff', 
      alignItems: 'center', 
      justifyContent: 'center', 
      shadowColor: colors.dark, 
      shadowOpacity: 0.06, 
      shadowRadius: 10, 
      shadowOffset: { width: 0, height: 4 }, 
      elevation: 2 
    },
    notifDot: { 
      position: 'absolute', 
      top: rs(10), 
      right: rs(10), 
      width: rs(10), 
      height: rs(10), 
      borderRadius: rs(10), 
      backgroundColor: '#ef4444', 
      borderWidth: 2, 
      borderColor: '#fff' 
    },

    title: { 
      fontSize: fs(24), 
      fontWeight: '900', 
      color: colors.dark, 
      marginTop: rs(4), 
      letterSpacing: -0.3 
    },
    subtitle: { 
      fontSize: fs(14), 
      color: colors.muted, 
      marginTop: rs(4), 
      marginBottom: rs(16), 
      fontWeight: '600', 
      lineHeight: fs(20) 
    },

    bigCard: { 
      backgroundColor: '#fff', 
      borderRadius: rs(24), 
      padding: rs(20), 
      flexDirection: isDesktop ? 'row' : 'column', 
      gap: rs(16), 
      marginBottom: rs(18), 
      shadowColor: '#1F4770', 
      shadowOpacity: 0.08, 
      shadowRadius: 15, 
      shadowOffset: { width: 0, height: 8 }, 
      ...Platform.select({
        web: { boxShadow: '0 8px 24px rgba(43,108,176,0.15)' as any },
        default: {}
      }),
      elevation: 5 
    },
    bigCardLeft: { flex: 1 },
    bigCardRight: { 
      width: isDesktop ? rs(160) : '100%', 
      justifyContent: 'center', 
      alignItems: 'center' 
    },
    bigCardImage: { width: rs(130), height: rs(130), borderRadius: rs(20) },
    liveRow: { flexDirection: 'row', alignItems: 'center', gap: rs(8), marginBottom: rs(10) },
    liveDot: { width: rs(10), height: rs(10), borderRadius: rs(10), backgroundColor: '#22c55e' },
    liveText: { 
      color: colors.primary, 
      fontSize: fs(11), 
      fontWeight: '900', 
      letterSpacing: 1, 
      textTransform: 'uppercase' 
    },
    bigCardTitle: { fontSize: fs(18), fontWeight: '900', color: colors.dark, marginBottom: rs(6) },
    bigCardSub: { fontSize: fs(14), color: colors.muted, fontWeight: '700', marginBottom: rs(14) },
    bigCardActions: { flexDirection: 'row', flexWrap: 'wrap', gap: rs(10) },
    primaryBtn: { 
      flexDirection: 'row', 
      alignItems: 'center', 
      gap: rs(8), 
      backgroundColor: colors.primary, 
      paddingVertical: rs(12), 
      paddingHorizontal: rs(16), 
      borderRadius: rs(16), 
      shadowColor: colors.primary, 
      shadowOpacity: 0.3, 
      shadowRadius: 8, 
      shadowOffset: { width: 0, height: 4 }, 
      elevation: 3 
    },
    primaryBtnText: { color: '#fff', fontWeight: '900', fontSize: fs(14) },
    secondaryBtn: { 
      backgroundColor: '#f1f5f9', 
      paddingVertical: rs(12), 
      paddingHorizontal: rs(16), 
      borderRadius: rs(16) 
    },
    secondaryBtnText: { color: colors.muted, fontWeight: '900', fontSize: fs(14) },

    quickRow: { flexDirection: 'row', gap: rs(10), marginBottom: rs(18) },
    quickTile: { 
      flex: 1, 
      backgroundColor: '#fff', 
      borderRadius: rs(16), 
      paddingVertical: rs(14), 
      paddingHorizontal: rs(10), 
      alignItems: 'center', 
      borderWidth: 1, 
      borderColor: '#eef3fa', 
      shadowColor: colors.dark, 
      shadowOpacity: 0.05, 
      shadowRadius: 8, 
      shadowOffset: { width: 0, height: 3 }, 
      elevation: 2 
    },
    quickTileIcon: { 
      width: rs(44), 
      height: rs(44), 
      borderRadius: rs(12), 
      alignItems: 'center', 
      justifyContent: 'center', 
      marginBottom: rs(8) 
    },
    quickTileLabel: { fontSize: fs(12), fontWeight: '700', color: colors.dark, textAlign: 'center' },

    twoCols: { 
      flexDirection: isDesktop ? 'row' : 'column', 
      gap: rs(16), 
      marginTop: rs(16) 
    },
    colLeft: { flex: 2 },
    colRight: { flex: 1.2 },
    colLeftFull: { flex: 1 },
    rowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },

    sectionTitle: { 
      fontSize: fs(16), 
      fontWeight: '900', 
      color: colors.dark, 
      marginBottom: rs(10), 
      marginTop: rs(10) 
    },
    link: { color: colors.primary, fontWeight: '900', fontSize: fs(12) },

    apptCard: { 
      flexDirection: 'row', 
      alignItems: 'center', 
      gap: rs(12), 
      backgroundColor: '#fff', 
      padding: rs(14), 
      borderRadius: rs(18), 
      marginTop: rs(10), 
      shadowColor: colors.dark, 
      shadowOpacity: 0.05, 
      shadowRadius: 10, 
      shadowOffset: { width: 0, height: 4 }, 
      elevation: 2 
    },
    apptAvatar: { width: rs(52), height: rs(52), borderRadius: rs(16) },
    apptDoctor: { fontWeight: '900', color: colors.dark, fontSize: fs(14) },
    apptDetail: { color: colors.muted, fontWeight: '700', marginTop: rs(2), fontSize: fs(12) },
    apptBtns: { flexDirection: 'row', gap: rs(8) },
    smallBtnGray: { 
      backgroundColor: '#f1f5f9', 
      paddingVertical: rs(8), 
      paddingHorizontal: rs(12), 
      borderRadius: rs(12) 
    },
    smallBtnGrayDisabled: { backgroundColor: '#e2e8f0' },
    smallBtnGrayText: { color: colors.muted, fontWeight: '900', fontSize: fs(12) },
    smallBtnGrayTextDisabled: { color: '#94a3b8' },
    smallBtnBlue: { 
      backgroundColor: 'rgba(19,127,236,0.12)', 
      paddingVertical: rs(8), 
      paddingHorizontal: rs(12), 
      borderRadius: rs(12) 
    },
    smallBtnBlueText: { color: colors.primary, fontWeight: '900', fontSize: fs(12) },

    docRow: { 
      flexDirection: 'row', 
      alignItems: 'center', 
      justifyContent: 'space-between', 
      paddingVertical: rs(12), 
      borderBottomWidth: 1, 
      borderBottomColor: '#eef2f7' 
    },
    docLeft: { flexDirection: 'row', alignItems: 'center', gap: rs(12), flex: 1 },
    docIconBox: { 
      width: rs(40), 
      height: rs(40), 
      borderRadius: rs(12), 
      backgroundColor: '#f4f8fc', 
      alignItems: 'center', 
      justifyContent: 'center' 
    },
    docTitle: { color: colors.dark, fontWeight: '700', fontSize: fs(13) },
    docAvatar: { width: rs(32), height: rs(32), borderRadius: rs(8) },
    docSub: { color: colors.muted, fontSize: fs(11), marginTop: rs(2) },

    emptyCard: { 
      alignItems: 'center', 
      padding: rs(24), 
      backgroundColor: '#fff', 
      borderRadius: rs(18), 
      borderWidth: 1, 
      borderColor: '#eef2f7', 
      borderStyle: 'dashed', 
      marginTop: rs(10) 
    },
    emptyText: { color: colors.muted, fontWeight: '600', marginTop: rs(10), fontSize: fs(14) },

    statsContainer: { gap: rs(10), marginTop: rs(10) },
    statCard: { 
      backgroundColor: '#fff', 
      padding: rs(16), 
      borderRadius: rs(18), 
      shadowColor: colors.dark, 
      shadowOpacity: 0.05, 
      shadowRadius: 10, 
      shadowOffset: { width: 0, height: 4 }, 
      elevation: 2 
    },
    statTopRow: { 
      flexDirection: 'row', 
      justifyContent: 'space-between', 
      alignItems: 'center', 
      marginBottom: rs(12) 
    },
    statTitle: { 
      color: colors.muted, 
      fontWeight: '700', 
      fontSize: fs(12), 
      textTransform: 'uppercase', 
      letterSpacing: 0.5 
    },
    statBottomRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' },
    statValue: { fontSize: fs(24), fontWeight: '900', color: colors.dark },
    trendRow: { 
      flexDirection: 'row', 
      alignItems: 'center', 
      gap: rs(4), 
      backgroundColor: '#f8fafc', 
      paddingHorizontal: rs(8), 
      paddingVertical: rs(4), 
      borderRadius: rs(8) 
    },
    trendText: { fontSize: fs(11), fontWeight: '800' },
  }), [fs, rs, isDesktop, colors]);

  // --- Sub-componentes internos que usan styles ---
  const AppointmentCard: React.FC<any> = ({
    patient,
    detail,
    avatar,
    onVideoCall,
    onDetails,
    videoCallDisabled,
    videoCallLabel = 'Videollamada',
  }: any) => (
    <View style={styles.apptCard}>
      <ViremImage source={avatar} style={styles.apptAvatar} />
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

  const PatientRow: React.FC<{ name: string; id: string; lastSeen: string; avatar: any; onPress?: () => void }> = ({
    name,
    id,
    lastSeen,
    avatar,
    onPress,
  }: any) => (
    <View style={styles.docRow}>
      <View style={styles.docLeft}>
        <View style={styles.docIconBox}>
          <ViremImage source={avatar} style={styles.docAvatar} />
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

  const StatPill: React.FC<{ title: string; value: string; icon: MaterialIconName; trendText: string; trendUp?: boolean }> = ({ title, value, icon, trendText, trendUp = true }: any) => (
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

  const toggleMobileMenu = () => setIsMobileMenuOpen((prev: boolean) => !prev);
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
      const backendFoto = sanitizeRemoteImageUrl(profile?.fotoUrl);

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
      const fotoBase = sanitizeRemoteImageUrl(
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
    await startCall(targetCita.citaid, true);
    setOpeningCitaId('');
  };

  const nextCita = upcomingCitas[0] || null;
  const bannerPatientName = nextCita ? nextCita.paciente.nombreCompleto : '';
  const bannerPatientAvatar = resolveRemoteImageSource(nextCita?.paciente?.fotoUrl, DefaultAvatar);
  
  return (
    <View style={[styles.container, isInsidePortal ? null : (isDesktopLayout ? styles.containerDesktop : (isTablet ? styles.containerTablet : styles.containerMobile))]}>
      {!isInsidePortal && !isDesktopLayout ? (
        <View style={styles.mobileMenuBar}>
          <TouchableOpacity style={styles.mobileMenuButton} onPress={toggleMobileMenu}>
            <MaterialIcons name="menu" size={22} color={colors.dark} />
            <Text style={styles.mobileMenuButtonText}>Menú</Text>
          </TouchableOpacity>
        </View>
      ) : null}

      {isMobileMenuOpen && (
        <TouchableOpacity 
          activeOpacity={1} 
          style={styles.overlay} 
          onPress={closeMobileMenu} 
        />
      )}

      {/* ===================== SIDEBAR ===================== */}
      {!isInsidePortal && (isDesktopLayout || isTablet || isMobileMenuOpen) && (
      <View style={[styles.sidebar, isDesktopLayout ? styles.sidebarDesktop : (isTablet ? styles.sidebarTablet : styles.sidebarMobile)]}>
        <View>
          {/* Logo */}
          <View style={styles.logoBox}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 }}>
              <Image source={ViremLogo} style={styles.logo} />
              <View>
                <Text style={styles.logoTitle}>VIREM</Text>
                <Text style={styles.logoSubtitle}>Portal Médico</Text>
              </View>
            </View>
            
            {!isDesktopLayout && (
              <TouchableOpacity onPress={closeMobileMenu} style={{ padding: 4 }}>
                <MaterialIcons name="close" size={24} color={colors.dark} />
              </TouchableOpacity>
            )}
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

            <TouchableOpacity style={styles.menuItemRow} onPress={() => handleSidebarNavigation('MedicoConfiguracion')}>
              <MaterialIcons name="settings" size={20} color={colors.muted} />
              <Text style={styles.menuText}>Configuración</Text>
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
      {isInCall && roomInfo ? (
        <View style={styles.mainCallContainer}>
          <VideoCallFrame
            roomName={roomInfo.roomName}
            displayName={doctorName}
            onHangup={endCall}
            token={roomInfo.token}
            liveKitUrl={roomInfo.liveKitUrl}
          />
        </View>
      ) : (
        <ScrollView style={[styles.main, !isDesktopLayout ? styles.mainMobile : null]} contentContainerStyle={{ paddingBottom: 40 }}>
          <FadeInView>
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
                  {(() => {
                    const citaStart = nextCita ? new Date(nextCita.fechaHoraInicio).getTime() : 0;
                    const now = Date.now();
                    const isTooEarly = nextCita && now < citaStart - 5 * 60 * 1000;
                    const canJoin = nextCita && !isTooEarly;

                    return (
                      <TouchableOpacity 
                        style={[styles.primaryBtn, (!canJoin || openingCitaId) && { opacity: 0.6 }]} 
                        onPress={() => handleVideoCall()}
                        disabled={!canJoin || !!openingCitaId}
                      >
                        <MaterialIcons name={isTooEarly ? "lock-clock" : "videocam"} size={20} color="#fff" />
                        <Text style={styles.primaryBtnText}>
                          {openingCitaId ? 'Iniciando...' : isTooEarly ? 'Aún no es la hora' : 'Entrar a consulta'}
                        </Text>
                      </TouchableOpacity>
                    );
                  })()}
                  <TouchableOpacity style={styles.secondaryBtn} onPress={() => handleSidebarNavigation('MedicoCitas')}>
                    <Text style={styles.secondaryBtnText}>Ver agenda completa</Text>
                  </TouchableOpacity>
                </View>
              </View>

              {isDesktopLayout && (
                <View style={styles.bigCardRight}>
                  <ViremImage source={bannerPatientAvatar} style={styles.bigCardImage} />
                </View>
              )}
            </View>

            {/* Quick Stats */}
            <View style={styles.quickRow}>
              {loadingDashboard ? (
                <>
                  <Skeleton width={rs(160)} height={rs(100)} borderRadius={rs(20)} />
                  <Skeleton width={rs(160)} height={rs(100)} borderRadius={rs(20)} />
                </>
              ) : (
                <>
                  <StatPill 
                    title="Citas hoy" 
                    value={String(dashboardData.stats.citasHoy)} 
                    icon="today" 
                    trendText="+2" 
                  />
                  <StatPill 
                    title="Completadas" 
                    value={String(dashboardData.stats.citasCompletadas)} 
                    icon="check-circle" 
                    trendText="80%" 
                  />
                </>
              )}
            </View>

            <View style={styles.twoCols}>
              {/* Columna Izquierda: Agenda */}
              <View style={styles.colLeft}>
                <View style={styles.rowBetween}>
                  <Text style={styles.sectionTitle}>Próximas consultas virtuales</Text>
                  <TouchableOpacity onPress={() => handleSidebarNavigation('MedicoCitas')}>
                    <Text style={styles.link}>Ver todas</Text>
                  </TouchableOpacity>
                </View>

                {loadingDashboard ? (
                  <View style={{ gap: 10 }}>
                    <Skeleton width="100%" height={rs(80)} borderRadius={rs(18)} />
                    <Skeleton width="100%" height={rs(80)} borderRadius={rs(18)} />
                  </View>
                ) : (
                  upcomingCitas.length > 0 ? (
                    upcomingCitas.map((cita: any) => (
                      <AppointmentCard
                        key={cita.citaid}
                        patient={cita.paciente.nombreCompleto}
                        detail={formatDateTime(cita.fechaHoraInicio)}
                        avatar={resolveRemoteImageSource(cita.paciente.fotoUrl, DefaultAvatar)}
                        onVideoCall={() => handleVideoCall(cita.citaid)}
                        onDetails={() => {}}
                        videoCallDisabled={!!openingCitaId || (new Date(cita.fechaHoraInicio).getTime() > Date.now() + 5 * 60 * 1000)}
                      />
                    ))
                  ) : (
                    <View style={styles.emptyCard}>
                      <MaterialCommunityIcons name="calendar-blank" size={40} color={colors.muted} />
                      <Text style={styles.emptyText}>No hay citas virtuales hoy</Text>
                    </View>
                  )
                )}
              </View>

              {/* Columna Derecha: Expedientes */}
              <View style={styles.colRight}>
                <Text style={styles.sectionTitle}>Expedientes recientes</Text>
                <View style={{ backgroundColor: '#fff', borderRadius: rs(20), padding: rs(10) }}>
                  {loadingDashboard ? (
                    <View style={{ gap: 12, padding: 10 }}>
                      <Skeleton width="100%" height={rs(40)} />
                      <Skeleton width="100%" height={rs(40)} />
                      <Skeleton width="100%" height={rs(40)} />
                    </View>
                  ) : (
                    dashboardData.expedientesRecientes.length > 0 ? (
                      dashboardData.expedientesRecientes.map((exp: any) => (
                        <FileCard
                          key={exp.id}
                          name={exp.name}
                          id={exp.code}
                          lastSeen={exp.lastSeenText}
                        />
                      ))
                    ) : (
                      <Text style={{ padding: rs(20), color: colors.muted, textAlign: 'center' }}>
                        Sin actividad reciente
                      </Text>
                    )
                  )}
                </View>
              </View>
            </View>
          </FadeInView>
        </ScrollView>
      )}
    </View>
  );
};

export default DashboardMedico;
