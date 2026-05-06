import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import type { RootStackParamList } from './navigation/types';
import { useAuth } from './providers/AuthProvider';
import { ApiError, apiClient } from './utils/api';
import { getApiErrorMessage } from './utils/apiErrors';
import AdminSidebar from './components/AdminSidebar';
import { useSocket } from './providers/SocketProvider';
import { useSocketEvent } from './hooks/useSocketEvent';
import { FlatList } from 'react-native';

type Nav = NativeStackNavigationProp<RootStackParamList, 'AdminPanel'>;
type AdminMode = 'operational' | 'technical';
type TabKey = 'resumen' | 'usuarios' | 'citas' | 'pagos' | 'moderacion' | 'auditoria' | 'it-overview' | 'it-infra' | 'it-logs';
type Tone = 'neutral' | 'info' | 'success' | 'warning' | 'danger';

type PendingMedico = {
  usuarioid: number;
  email: string;
  estadoCuenta: string;
  fechaRegistro: string | null;
  medico: {
    nombreCompleto: string;
    especialidad: string;
    cedula: string;
    telefono: string;
  };
  documentos: Array<{
    tipo: string;
    archivoUrl: string;
    estadoRevision: string;
  }>;
};

type PendingReview = {
  valoracionId: number;
  citaId: string;
  pacienteNombre: string;
  medicoNombre: string;
  puntaje: number;
  comentario: string;
  createdAt?: string | null;
};

type AdminUser = {
  usuarioid: number;
  email: string;
  rolid: number;
  rol: string;
  activo: boolean;
  accountStatus: string;
  estadoCuenta?: string;
  emailVerificado: boolean;
  aprobadoPorAdmin: boolean;
  fechaCreacion: string | null;
  perfilId: string;
  perfilTipo: string;
  perfilNombre: string;
  telefono: string;
  cedula: string;
  especialidad: string;
  totalCitas: number;
  citasHoy: number;
  ultimaCita: string | null;
};

type AdminCita = {
  citaId: string;
  pacienteNombre: string;
  medicoNombre: string;
  especialidad: string;
  fechaHoraInicio: string | null;
  fechaHoraFin: string | null;
  duracionMin: number;
  precio: number | null;
  modalidad: string;
  estadoCodigo: string;
  estado: string;
  conversacionId: string | null;
  conversacionEstado: string | null;
  videoSalaId: string | null;
  videoSalaEstado: string;
  videoRoomName: string | null;
};

type AdminPago = {
  pagoid: string;
  citaId: string;
  pacienteNombre: string;
  medicoNombre: string;
  especialidad: string;
  monto: number;
  moneda: string;
  metodoPago: string;
  estado: string;
  referencia: string;
  createdAt: string | null;
  factura: {
    facturaid: string;
    numero: string;
  } | null;
};

type AuditItem = {
  id: number;
  usuarioid: number;
  usuarioEmail: string;
  actorUsuarioid: number | null;
  actorEmail: string;
  scope: string;
  cambios: Record<string, unknown>;
  motivo: string;
  createdAt: string | null;
};

type PanelStats = {
  admin?: {
    usuarioid?: number;
    email?: string;
  };
  usuarios?: Record<string, unknown>;
  citas?: Record<string, unknown>;
  pagos?: Record<string, unknown>;
  valoraciones?: Record<string, unknown>;
  operacion?: Record<string, unknown>;
  clinica?: Record<string, unknown>;
};

type AdminBudgetRow = {
  id: string;
  concepto: string;
  valor: number;
  notas: string;
};

type AdminBudget = {
  moneda?: string;
  periodo?: {
    mes?: string;
    inicio?: string;
    fin?: string;
  };
  ingresosMes?: {
    suscripciones?: number;
    comisionesPresenciales?: number;
    comisionesVirtuales?: number;
    comisiones?: number;
    total?: number;
  };
  ingresosMesAnterior?: number;
  variacionPorcentaje?: number;
  tabla?: {
    titulo?: string;
    columnas?: {
      concepto?: string;
      valor?: string;
      notas?: string;
    };
    filas?: AdminBudgetRow[];
    total?: number;
    fuente?: string;
  };
  estadisticas?: {
    citasTotales?: number;
    citasPagadas?: number;
    medicoActivos?: number;
    medicosConMembresia?: number;
    consultasPresencialesPagadas?: number;
    consultasVirtualesPagadas?: number;
    montoMedicosMes?: number;
  };
};



const roleFilters = [
  { key: 'all', label: 'Todos' },
  { key: '1', label: 'Pacientes' },
  { key: '2', label: 'Medicos' },
  { key: '3', label: 'Admins' },
];

const statusFilters = [
  { key: 'all', label: 'Todos' },
  { key: 'activa', label: 'Activos' },
  { key: 'pendiente_aprobacion', label: 'Pendientes' },
  { key: 'bloqueada', label: 'Bloqueados' },
  { key: 'inactivo', label: 'Inactivos' },
];

const citaScopes = [
  { key: 'all', label: 'Todas' },
  { key: 'today', label: 'Hoy' },
  { key: 'upcoming', label: 'Proximas' },
  { key: 'virtual', label: 'Virtuales' },
  { key: 'history', label: 'Historial' },
];

const normalizeText = (value: unknown) =>
  String(value || '')
    .replace(/\s+/g, ' ')
    .trim();

const normalizeSearch = (value: unknown) => normalizeText(value).toLowerCase();

const isAdminAccessError = (error: unknown) =>
  error instanceof ApiError && (error.status === 401 || error.status === 403);

const toInt = (value: unknown) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? Math.trunc(parsed) : 0;
};

const toMoney = (value: unknown) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? Math.round(parsed * 100) / 100 : 0;
};

const formatMoney = (value: unknown, currency = 'DOP') => {
  try {
    return new Intl.NumberFormat('es-DO', {
      style: 'currency',
      currency: currency || 'DOP',
      maximumFractionDigits: 0,
    }).format(toMoney(value));
  } catch {
    return `${toMoney(value).toFixed(0)} ${currency || 'DOP'}`;
  }
};

const formatBudgetMoney = (value: unknown, currency = 'DOP') => {
  try {
    return new Intl.NumberFormat('es-DO', {
      style: 'currency',
      currency: currency || 'DOP',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(toMoney(value));
  } catch {
    return `${toMoney(value).toFixed(2)} ${currency || 'DOP'}`;
  }
};

const formatDateTime = (value?: string | null) => {
  if (!value) return 'Sin fecha';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Sin fecha';

  try {
    return new Intl.DateTimeFormat('es-DO', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  } catch {
    return date.toLocaleString();
  }
};

const isToday = (value?: string | null) => {
  if (!value) return false;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return false;
  const now = new Date();
  return (
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate()
  );
};

const isUpcomingCita = (cita: AdminCita) => {
  const start = cita.fechaHoraInicio ? new Date(cita.fechaHoraInicio).getTime() : 0;
  if (!start || Number.isNaN(start) || start < Date.now()) return false;
  return !['completada', 'cancelada_por_paciente', 'cancelada_por_medico', 'no_asistio'].includes(
    normalizeSearch(cita.estadoCodigo)
  );
};

const accountStatusLabel = (status: string) => {
  const normalized = normalizeSearch(status);
  if (normalized === 'activa') return 'Activa';
  if (normalized === 'pendiente_aprobacion') return 'Pendiente';
  if (normalized === 'pendiente_verificacion') return 'Por verificar';
  if (normalized === 'rechazada') return 'Rechazada';
  if (normalized === 'bloqueada') return 'Bloqueada';
  return normalizeText(status) || 'Sin estado';
};

const titleCase = (value: string) =>
  normalizeText(value)
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase());

const accountTone = (status: string, active = true): Tone => {
  if (!active) return 'danger';
  const normalized = normalizeSearch(status);
  if (normalized === 'activa') return 'success';
  if (normalized.includes('pendiente')) return 'warning';
  if (normalized === 'bloqueada' || normalized === 'rechazada') return 'danger';
  return 'neutral';
};

const citaTone = (status: string): Tone => {
  const normalized = normalizeSearch(status);
  if (normalized === 'confirmada' || normalized === 'completada') return 'success';
  if (normalized === 'pendiente' || normalized === 'reprogramada') return 'warning';
  if (normalized.includes('cancelada') || normalized === 'no_asistio') return 'danger';
  return 'neutral';
};

const paymentTone = (status: string): Tone => {
  const normalized = normalizeSearch(status);
  if (normalized.includes('aprobado') || normalized.includes('pagado')) return 'success';
  if (normalized.includes('pendiente')) return 'warning';
  if (normalized.includes('rechaz') || normalized.includes('fall')) return 'danger';
  return 'neutral';
};

const Badge = ({ label, tone = 'neutral' }: { label: string; tone?: Tone }) => (
  <View style={[styles.badge, badgeStyles[tone]]}>
    <Text style={[styles.badgeText, badgeTextStyles[tone]]} numberOfLines={1}>
      {label}
    </Text>
  </View>
);

const EmptyState = ({ icon, text }: { icon: string; text: string }) => (
  <View style={styles.emptyState}>
    <MaterialIcons name={icon as any} size={20} color={colors.muted} />
    <Text style={styles.emptyText}>{text}</Text>
  </View>
);

const AdminPanelScreen: React.FC = () => {
  const navigation = useNavigation<Nav>();
  const { isAuthenticated, isReady, signOut } = useAuth();
  const { width } = useWindowDimensions();
  const isWide = Platform.OS === 'web' && width >= 1020;
  const showBudgetColumns = width >= 860;

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const hasLoadedRef = useRef(false);
  const [workingId, setWorkingId] = useState('');
  const [activeTab, setActiveTab] = useState<TabKey>('resumen');
  const [userSearch, setUserSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [citaScope, setCitaScope] = useState('all');
  const [lastUpdatedAt, setLastUpdatedAt] = useState<string | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(Platform.OS === 'web' && width >= 1024);
  const [adminMode, setAdminMode] = useState<AdminMode>('operational');

  // IT States
  const [systemHealth, setSystemHealth] = useState(98);
  const [apiLatency, setApiLatency] = useState(42);
  const [activeSessions, setActiveSessions] = useState(0);
  const [dbLoad, setDbLoad] = useState(0);
  const [infra, setInfra] = useState<any[]>([]);
  const [logs, setLogs] = useState<any[]>([]);
  const [itError, setItError] = useState<string | null>(null);
  const logScrollRef = useRef<ScrollView>(null);
  const { joinAdminMonitoring, leaveAdminMonitoring } = useSocket();

  const [panel, setPanel] = useState<PanelStats | null>(null);
  const [pendingReviews, setPendingReviews] = useState<PendingReview[]>([]);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [citas, setCitas] = useState<AdminCita[]>([]);
  const [pagos, setPagos] = useState<AdminPago[]>([]);
  const [budget, setBudget] = useState<AdminBudget | null>(null);
  const [audit, setAudit] = useState<AuditItem[]>([]);
  const [userPage, setUserPage] = useState(1);
  const USERS_PER_PAGE = 6;

  const handleAuthExpired = useCallback(
    async (message = 'Inicia sesion nuevamente para continuar.') => {
      Alert.alert('Acceso denegado', message);
      await signOut();
      navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
    },
    [navigation, signOut]
  );

  const refresh = useCallback(async () => {
    if (!isReady) return;

    if (!isAuthenticated) {
      navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
      return;
    }

    if (hasLoadedRef.current) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    try {
      // Helper to fetch safely without crashing the whole sequence
      const safeGet = async (url: string, params?: any) => {
        try {
          const res = await apiClient.get<any>(url, { authenticated: true, query: params });
          return res?.success ? res : null;
        } catch (e) {
          console.warn(`SafeGet failed for ${url}:`, e);
          return null;
        }
      };

      const [panelRes, reviewsRes, usersRes, citasRes, pagosRes, budgetRes, auditRes] =
        await Promise.all([
          safeGet('/api/admin/panel'),
          safeGet('/api/admin/valoraciones/pendientes', { limit: 80 }),
          safeGet('/api/admin/usuarios', { limit: 160 }),
          safeGet('/api/admin/citas', { scope: 'all', limit: 140 }),
          safeGet('/api/admin/pagos', { limit: 120 }),
          safeGet('/api/admin/presupuesto'),
          safeGet('/api/admin/usuarios/modificaciones', { limit: 80 }),
        ]);

      if (panelRes) {
        setPanel(panelRes.panel || null);
      } else {
        // If panelRes fails, we still try to show what we have, but panel might be null
        console.error('Critical: Panel data could not be loaded');
      }

      setPendingReviews(Array.isArray(reviewsRes?.valoraciones) ? reviewsRes.valoraciones : []);
      setUsers(Array.isArray(usersRes?.usuarios) ? usersRes.usuarios : []);
      setCitas(Array.isArray(citasRes?.citas) ? citasRes.citas : []);
      setPagos(Array.isArray(pagosRes?.pagos) ? pagosRes.pagos : []);
      setBudget(budgetRes?.success ? (budgetRes?.presupuesto as AdminBudget) || null : null);
      setAudit(Array.isArray(auditRes?.modificaciones) ? auditRes.modificaciones : []);
      
      setLastUpdatedAt(new Date().toISOString());
      hasLoadedRef.current = true;
    } catch (error) {
      if (isAdminAccessError(error)) {
        await handleAuthExpired(
          getApiErrorMessage(error, 'Tu sesion expiro o no tienes permisos de administrador.')
        );
        return;
      }
      Alert.alert('Error', getApiErrorMessage(error, 'No se pudo cargar el panel administrativo.'));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [handleAuthExpired, isAuthenticated, isReady, navigation]);

  const fetchITStats = useCallback(async () => {
    try {
      const res = await apiClient.get<any>('/api/admin/it-stats', { authenticated: true });
      if (res.success && res.stats) {
        setApiLatency(res.stats.latency);
        setSystemHealth(res.stats.health);
        setActiveSessions(res.stats.activeSessions);
        setDbLoad(res.stats.dbLoad);
        setInfra(res.stats.infra || []);
        setItError(null);
        // Map logs
        if (res.stats.logs) {
          setLogs(res.stats.logs);
        }
      }
    } catch (err) {
      console.error('Error fetching IT stats:', err);
      setItError('Backend connection lost or error occurred.');
      setSystemHealth(0);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      if (!isReady) return;
      refresh();
    }, [isReady, refresh])
  );

  // Join admin monitoring room
  useEffect(() => {
    if (adminMode !== 'technical' || !isAuthenticated) return;
    
    let active = true;
    joinAdminMonitoring().then(res => {
      if (active && !res.ok) {
        console.warn('Could not join admin monitoring room:', res.code);
      }
    });

    return () => {
      active = false;
      leaveAdminMonitoring();
    };
  }, [adminMode, isAuthenticated, joinAdminMonitoring, leaveAdminMonitoring]);

  // Real-time log listener
  useSocketEvent('system_log', (log: any) => {
    setLogs(prev => {
      const newLogs = [...prev, log];
      if (newLogs.length > 100) return newLogs.slice(newLogs.length - 100);
      return newLogs;
    });
    
    // Auto-scroll logic if needed (handled in the component)
  }, adminMode === 'technical');

  // Real IT updates
  useEffect(() => {
    if (adminMode !== 'technical') return;
    
    // First fetch
    fetchITStats();

    // Interval every 10s
    const interval = setInterval(() => {
      fetchITStats();
    }, 10000);
    
    return () => clearInterval(interval);
  }, [adminMode, fetchITStats]);

  const handleLogout = useCallback(async () => {
    try {
      await signOut();
      navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
    } catch {
      Alert.alert('Error', 'No se pudo cerrar la sesion. Intenta nuevamente.');
    }
  }, [navigation, signOut]);

  const moderateDoctor = useCallback(
    async (usuarioid: number, action: 'aprobar' | 'rechazar') => {
      setWorkingId(`${action}-${usuarioid}`);
      try {
        const endpoint =
          action === 'aprobar'
            ? `/api/admin/medicos/${usuarioid}/aprobar`
            : `/api/admin/medicos/${usuarioid}/rechazar`;

        const payload = await apiClient.patch<any>(endpoint, {
          authenticated: true,
          body: {
            comentario:
              action === 'aprobar'
                ? 'Documentos verificados por administrador.'
                : 'Solicitud rechazada por validacion administrativa.',
          },
        });

        if (!payload?.success) {
          Alert.alert('No se pudo procesar', payload?.message || 'Intenta nuevamente.');
          return;
        }

        await refresh();
      } catch (error) {
        if (isAdminAccessError(error)) {
          await handleAuthExpired(
            getApiErrorMessage(error, 'Tu sesion expiro o no tienes permisos de administrador.')
          );
          return;
        }
        Alert.alert('Error', getApiErrorMessage(error, 'No se pudo procesar la solicitud.'));
      } finally {
        setWorkingId('');
      }
    },
    [handleAuthExpired, refresh]
  );

  const moderateReview = useCallback(
    async (valoracionId: number, action: 'aprobar' | 'rechazar') => {
      setWorkingId(`${action}-review-${valoracionId}`);
      try {
        const payload = await apiClient.patch<any>(
          `/api/admin/valoraciones/${valoracionId}/moderar`,
          {
            authenticated: true,
            body: { accion: action },
          }
        );

        if (!payload?.success) {
          Alert.alert('No se pudo moderar', payload?.message || 'Intenta nuevamente.');
          return;
        }

        await refresh();
      } catch (error) {
        if (isAdminAccessError(error)) {
          await handleAuthExpired(
            getApiErrorMessage(error, 'Tu sesion expiro o no tienes permisos de administrador.')
          );
          return;
        }
        Alert.alert('Error', getApiErrorMessage(error, 'No se pudo moderar la valoracion.'));
      } finally {
        setWorkingId('');
      }
    },
    [handleAuthExpired, refresh]
  );

  const toggleUserStatus = useCallback(
    async (user: AdminUser) => {
      const selfAdminId = Number(panel?.admin?.usuarioid || 0);
      if (selfAdminId && selfAdminId === user.usuarioid) {
        Alert.alert('Cuenta protegida', 'No puedes bloquear la cuenta admin con la que iniciaste sesion.');
        return;
      }

      const shouldBlock = user.activo && normalizeSearch(user.accountStatus) !== 'bloqueada';
      const nextStatus = shouldBlock ? 'bloqueada' : 'activa';
      const nextActive = !shouldBlock;
      setWorkingId(`user-${user.usuarioid}`);

      try {
        const payload = await apiClient.patch<any>(`/api/admin/usuarios/${user.usuarioid}/estado`, {
          authenticated: true,
          body: {
            activo: nextActive,
            accountStatus: nextStatus,
            motivo: shouldBlock
              ? 'Bloqueo aplicado desde panel administrativo.'
              : 'Cuenta reactivada desde panel administrativo.',
          },
        });

        if (!payload?.success) {
          Alert.alert('No se pudo actualizar', payload?.message || 'Intenta nuevamente.');
          return;
        }

        await refresh();
      } catch (error) {
        if (isAdminAccessError(error)) {
          await handleAuthExpired(
            getApiErrorMessage(error, 'Tu sesion expiro o no tienes permisos de administrador.')
          );
          return;
        }
        Alert.alert('Error', getApiErrorMessage(error, 'No se pudo cambiar el estado del usuario.'));
      } finally {
        setWorkingId('');
      }
    },
    [handleAuthExpired, panel?.admin?.usuarioid, refresh]
  );

  const stats = useMemo(() => {
    const usuarios = panel?.usuarios || {};
    const citasStats = panel?.citas || {};
    const pagosStats = panel?.pagos || {};
    const valoraciones = panel?.valoraciones || {};
    const operacion = panel?.operacion || {};

    return [
      {
        label: 'Usuarios activos',
        value: String(toInt(usuarios?.activos)),
        icon: 'groups',
        tone: 'info' as Tone,
      },
      {
        label: 'Citas hoy',
        value: String(toInt(citasStats?.citas_hoy)),
        icon: 'today',
        tone: 'info' as Tone,
      },
      {
        label: 'Salas abiertas',
        value: String(toInt(operacion?.salas_abiertas)),
        icon: 'videocam',
        tone: toInt(operacion?.salas_abiertas) ? 'success' : ('neutral' as Tone),
      },
      {
        label: 'Pagos registrados',
        value: formatMoney(pagosStats?.monto_total),
        icon: 'payments',
        tone: 'success' as Tone,
      },
      {
        label: 'Ganancias VIREM',
        value: formatMoney(toMoney(pagosStats?.monto_total) * 0.1),
        icon: 'savings',
        tone: 'success' as Tone,
      },
      {
        label: 'Reviews pendientes',
        value: String(toInt(valoraciones?.valoraciones_pendientes)),
        icon: 'rate-review',
        tone: toInt(valoraciones?.valoraciones_pendientes) ? 'warning' : ('success' as Tone),
      },
    ];
  }, [panel]);

  const filteredUsers = useMemo(() => {
    const query = normalizeSearch(userSearch);
    return users.filter((user) => {
      if (roleFilter !== 'all' && String(user.rolid) !== roleFilter) return false;
      if (statusFilter === 'inactivo' && user.activo) return false;
      if (
        statusFilter !== 'all' &&
        statusFilter !== 'inactivo' &&
        normalizeSearch(user.accountStatus) !== statusFilter
      ) {
        return false;
      }
      if (!query) return true;
      const haystack = normalizeSearch(
        `${user.perfilNombre} ${user.email} ${user.rol} ${user.especialidad} ${user.telefono} ${user.cedula}`
      );
      return haystack.includes(query);
    });
  }, [roleFilter, statusFilter, userSearch, users]);

  // Reset page on filter change
  useEffect(() => {
    setUserPage(1);
  }, [roleFilter, statusFilter, userSearch]);

  const paginatedUsers = useMemo(() => {
    const start = (userPage - 1) * USERS_PER_PAGE;
    return filteredUsers.slice(start, start + USERS_PER_PAGE);
  }, [filteredUsers, userPage]);

  const userTotalPages = Math.ceil(filteredUsers.length / USERS_PER_PAGE) || 1;

  const filteredCitas = useMemo(() => {
    const list = citas.filter((cita) => {
      if (citaScope === 'today') return isToday(cita.fechaHoraInicio);
      if (citaScope === 'upcoming') return isUpcomingCita(cita);
      if (citaScope === 'virtual') return normalizeSearch(cita.modalidad) === 'virtual';
      if (citaScope === 'history') return !isUpcomingCita(cita);
      return true;
    });

    return [...list].sort((a, b) => {
      const aTime = a.fechaHoraInicio ? new Date(a.fechaHoraInicio).getTime() : 0;
      const bTime = b.fechaHoraInicio ? new Date(b.fechaHoraInicio).getTime() : 0;
      if (citaScope === 'upcoming' || citaScope === 'today') return aTime - bTime;
      return bTime - aTime;
    });
  }, [citaScope, citas]);

  const upcomingPreview = useMemo(
    () =>
      citas
        .filter(isUpcomingCita)
        .sort((a, b) => {
          const aTime = a.fechaHoraInicio ? new Date(a.fechaHoraInicio).getTime() : 0;
          const bTime = b.fechaHoraInicio ? new Date(b.fechaHoraInicio).getTime() : 0;
          return aTime - bTime;
        })
        .slice(0, 5),
    [citas]
  );

  const paymentTotal = useMemo(
    () => pagos.reduce((sum, pago) => sum + toMoney(pago.monto), 0),
    [pagos]
  );

  const budgetRows = budget?.tabla?.filas || [];
  const budgetCurrency = normalizeText(budget?.moneda) || 'DOP';
  const budgetVariation = toMoney(budget?.variacionPorcentaje);
  const budgetVariationTone: Tone =
    budgetVariation > 0 ? 'success' : budgetVariation < 0 ? 'danger' : 'neutral';

  const pendingTasks = pendingReviews.length;

  const renderKpis = () => (
    <View style={styles.kpiGrid}>
      {stats.map((item) => (
        <View
          key={item.label}
          style={[styles.kpiCard, isWide ? styles.kpiCardWide : styles.kpiCardCompact]}
        >
          <View style={[styles.kpiIcon, iconToneStyles[item.tone]]}>
            <MaterialIcons name={item.icon as any} size={20} color={iconColorStyles[item.tone]} />
          </View>
          <Text style={styles.kpiValue} numberOfLines={1}>
            {item.value}
          </Text>
          <Text style={styles.kpiLabel} numberOfLines={2}>
            {item.label}
          </Text>
        </View>
      ))}
    </View>
  );

  const renderSectionHeader = (title: string, icon: string, count?: number) => (
    <View style={styles.sectionHeader}>
      <View style={styles.sectionTitleWrap}>
        <MaterialIcons name={icon as any} size={18} color={colors.text} />
        <Text style={styles.sectionTitle}>{title}</Text>
      </View>
      {typeof count === 'number' ? <Badge label={String(count)} tone={count ? 'warning' : 'success'} /> : null}
    </View>
  );

  const renderBudgetRow = (row: AdminBudgetRow) => {
    if (!showBudgetColumns) {
      return (
        <View key={row.id} style={styles.budgetCardRow}>
          <View style={styles.rowTop}>
            <View style={styles.itemMain}>
              <Text style={styles.itemTitle}>{row.concepto}</Text>
            </View>
            <Text style={styles.budgetAmount}>{formatBudgetMoney(row.valor, budgetCurrency)}</Text>
          </View>
          <Text style={styles.commentText}>{row.notas}</Text>
        </View>
      );
    }

    return (
      <View key={row.id} style={styles.budgetTableRow}>
        <View style={styles.budgetConceptCell}>
          <Text style={styles.itemTitle}>{row.concepto}</Text>
        </View>
        <View style={styles.budgetValueCell}>
          <Text style={styles.budgetAmount}>{formatBudgetMoney(row.valor, budgetCurrency)}</Text>
        </View>
        <View style={styles.budgetNotesCell}>
          <Text style={styles.commentText}>{row.notas}</Text>
        </View>
      </View>
    );
  };


  const renderReviewCard = (review: PendingReview, compact = false) => (
    <View key={`review-${review.valoracionId}`} style={styles.itemCard}>
      <View style={styles.rowTop}>
        <View style={styles.itemMain}>
          <Text style={styles.itemTitle} numberOfLines={1}>
            {review.medicoNombre || 'Medico'}
          </Text>
          <Text style={styles.itemSub} numberOfLines={1}>
            Paciente: {review.pacienteNombre || 'Paciente'}
          </Text>
        </View>
        <Badge label={`${review.puntaje}/5`} tone="warning" />
      </View>

      {!compact ? (
        <Text style={styles.commentText} numberOfLines={3}>
          {review.comentario || 'Sin comentario'}
        </Text>
      ) : null}

      <View style={styles.actionsRow}>
        <TouchableOpacity
          style={[styles.actionButton, styles.approveButton]}
          disabled={workingId === `aprobar-review-${review.valoracionId}`}
          onPress={() => moderateReview(review.valoracionId, 'aprobar')}
        >
          <MaterialIcons name="publish" size={16} color={colors.successDark} />
          <Text style={[styles.actionText, styles.approveText]}>Publicar</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionButton, styles.rejectButton]}
          disabled={workingId === `rechazar-review-${review.valoracionId}`}
          onPress={() => moderateReview(review.valoracionId, 'rechazar')}
        >
          <MaterialIcons name="block" size={16} color={colors.dangerDark} />
          <Text style={[styles.actionText, styles.rejectText]}>Descartar</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderCitaRow = (cita: AdminCita) => (
    <View key={`cita-${cita.citaId}`} style={styles.tableRow}>
      <View style={styles.dateCell}>
        <Text style={styles.dateMain}>{formatDateTime(cita.fechaHoraInicio)}</Text>
        <Text style={styles.dateSub}>{cita.duracionMin || 30} min</Text>
      </View>
      <View style={styles.flexCell}>
        <Text style={styles.itemTitle} numberOfLines={1}>
          {cita.pacienteNombre}
        </Text>
        <Text style={styles.itemSub} numberOfLines={1}>
          {cita.medicoNombre} · {cita.especialidad}
        </Text>
      </View>
      <View style={styles.badgeStack}>
        <Badge label={titleCase(cita.estadoCodigo || cita.estado)} tone={citaTone(cita.estadoCodigo)} />
        <Badge label={titleCase(cita.modalidad)} tone={normalizeSearch(cita.modalidad) === 'virtual' ? 'info' : 'neutral'} />
      </View>
      <View style={styles.signalStack}>
        <MaterialIcons
          name={cita.conversacionId ? 'chat-bubble' : 'chat-bubble-outline'}
          size={17}
          color={cita.conversacionId ? colors.primary : colors.muted}
        />
        <MaterialIcons
          name={normalizeSearch(cita.videoSalaEstado) === 'abierta' ? 'videocam' : 'videocam-off'}
          size={18}
          color={normalizeSearch(cita.videoSalaEstado) === 'abierta' ? colors.success : colors.muted}
        />
      </View>
    </View>
  );

  const renderPagoRow = (pago: AdminPago) => (
    <View key={`pago-${pago.pagoid}`} style={styles.tableRow}>
      <View style={styles.dateCell}>
        <Text style={styles.dateMain}>{formatDateTime(pago.createdAt)}</Text>
        <Text style={styles.dateSub}>{pago.factura?.numero || 'Sin factura'}</Text>
      </View>
      <View style={styles.flexCell}>
        <Text style={styles.itemTitle} numberOfLines={1}>
          {pago.pacienteNombre}
        </Text>
        <Text style={styles.itemSub} numberOfLines={1}>
          {pago.medicoNombre} · {pago.metodoPago || 'tarjeta'}
        </Text>
      </View>
      <Text style={styles.moneyText}>{formatMoney(pago.monto, pago.moneda)}</Text>
      <Badge label={titleCase(pago.estado)} tone={paymentTone(pago.estado)} />
    </View>
  );

  const renderResumen = () => {
    const operacion = panel?.operacion || {};
    const citasStats = panel?.citas || {};
    const clinica = panel?.clinica || {};

    return (
      <View style={styles.tabContent}>
        {renderKpis()}

        <View style={[styles.gridTwo, isWide && styles.gridTwoWide]}>
          <View style={styles.panelSection}>
            {renderSectionHeader('Operacion hoy', 'monitor-heart')}
            <View style={styles.metricList}>
              <View style={styles.metricLine}>
                <Text style={styles.metricLabel}>Proximas 24h</Text>
                <Text style={styles.metricValue}>{toInt(citasStats?.proximas_24h)}</Text>
              </View>
              <View style={styles.metricLine}>
                <Text style={styles.metricLabel}>Virtuales hoy</Text>
                <Text style={styles.metricValue}>{toInt(citasStats?.virtuales_hoy)}</Text>
              </View>
              <View style={styles.metricLine}>
                <Text style={styles.metricLabel}>Mensajes no leidos</Text>
                <Text style={styles.metricValue}>{toInt(operacion?.mensajes_no_leidos)}</Text>
              </View>
              <View style={styles.metricLine}>
                <Text style={styles.metricLabel}>Historias hoy</Text>
                <Text style={styles.metricValue}>{toInt(clinica?.historias_hoy)}</Text>
              </View>
            </View>
          </View>

          <View style={styles.panelSection}>
            {renderSectionHeader('Tareas pendientes', 'task-alt', pendingTasks)}
            {pendingTasks ? (
              <View style={styles.taskList}>
                <View style={styles.metricLine}>
                  <Text style={styles.metricLabel}>Valoraciones por revisar</Text>
                  <Text style={styles.metricValue}>{pendingReviews.length}</Text>
                </View>
              </View>
            ) : (
              <EmptyState icon="verified" text="Sin tareas pendientes." />
            )}
          </View>
        </View>

        <View style={[styles.gridTwo, isWide && styles.gridTwoWide]}>
          <View style={styles.panelSection}>
            {renderSectionHeader('Proximas citas', 'event-available', upcomingPreview.length)}
            {upcomingPreview.length ? (
              upcomingPreview.map(renderCitaRow)
            ) : (
              <EmptyState icon="event-busy" text="No hay citas proximas." />
            )}
          </View>

          <View style={styles.panelSection}>
            {renderSectionHeader('Pagos recientes', 'receipt-long', pagos.length)}
            {pagos.slice(0, 5).length ? (
              <>
                <View style={styles.totalBand}>
                  <Text style={styles.totalLabel}>Total listado</Text>
                  <Text style={styles.totalValue}>{formatMoney(paymentTotal)}</Text>
                </View>
                {pagos.slice(0, 5).map(renderPagoRow)}
              </>
            ) : (
              <EmptyState icon="receipt" text="No hay pagos registrados." />
            )}
          </View>
        </View>
      </View>
    );
  };

  const renderUsuarios = () => (
    <View style={styles.tabContent}>
      <View style={styles.panelSection}>
        {renderSectionHeader('Usuarios', 'groups', filteredUsers.length)}
        
        <View style={styles.filterSection}>
          <View style={styles.searchRow}>
            <View style={styles.searchBox}>
              <MaterialIcons name="search" size={18} color={colors.muted} />
              <TextInput
                value={userSearch}
                onChangeText={setUserSearch}
                placeholder="Buscar por nombre, email, cedula..."
                placeholderTextColor={colors.muted}
                style={styles.searchInput}
              />
            </View>
          </View>

          <View style={styles.filterGroup}>
             <Text style={styles.filterGroupLabel}>Rol:</Text>
             <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
                {roleFilters.map((item) => (
                  <TouchableOpacity
                    key={item.key}
                    style={[styles.filterChip, roleFilter === item.key && styles.filterChipActive]}
                    onPress={() => setRoleFilter(item.key)}
                  >
                    <Text style={[styles.filterText, roleFilter === item.key && styles.filterTextActive]}>
                      {item.label}
                    </Text>
                  </TouchableOpacity>
                ))}
             </ScrollView>
          </View>

          <View style={styles.filterGroup}>
             <Text style={styles.filterGroupLabel}>Estado:</Text>
             <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
                {statusFilters.map((item) => (
                  <TouchableOpacity
                    key={item.key}
                    style={[styles.filterChip, statusFilter === item.key && styles.filterChipActive]}
                    onPress={() => setStatusFilter(item.key)}
                  >
                    <Text style={[styles.filterText, statusFilter === item.key && styles.filterTextActive]}>
                      {item.label}
                    </Text>
                  </TouchableOpacity>
                ))}
             </ScrollView>
          </View>
        </View>

        <View style={styles.userListContainer}>
          {paginatedUsers.length ? (
            <>
              {paginatedUsers.map((user) => {
                const blocked = normalizeSearch(user.accountStatus) === 'bloqueada' || !user.activo;
                const isSelf = Number(panel?.admin?.usuarioid || 0) === user.usuarioid;
                return (
                  <View key={`user-${user.usuarioid}`} style={styles.userRow}>
                    <View style={styles.avatarCircle}>
                      <Text style={styles.avatarText}>{normalizeText(user.perfilNombre || user.email).slice(0, 1).toUpperCase()}</Text>
                    </View>
                    <View style={styles.flexCell}>
                      <Text style={styles.itemTitle} numberOfLines={1}>
                        {user.perfilNombre || user.email}
                      </Text>
                      <Text style={styles.itemSub} numberOfLines={1}>
                        {user.email}
                      </Text>
                      <View style={styles.inlineBadges}>
                        <Badge label={user.rol || 'Sin rol'} tone={user.rolid === 3 ? 'info' : 'neutral'} />
                        <Badge
                          label={blocked ? 'Inactiva' : accountStatusLabel(user.accountStatus)}
                          tone={accountTone(user.accountStatus, user.activo)}
                        />
                        {user.especialidad ? <Badge label={user.especialidad} tone="info" /> : null}
                      </View>
                    </View>
                    <View style={styles.userStats}>
                      <Text style={styles.smallStat}>{user.totalCitas || 0}</Text>
                      <Text style={styles.smallStatLabel}>citas</Text>
                    </View>
                    <TouchableOpacity
                      style={[styles.iconAction, blocked ? styles.activateAction : styles.blockAction]}
                      disabled={isSelf || workingId === `user-${user.usuarioid}`}
                      onPress={() => toggleUserStatus(user)}
                    >
                      <MaterialIcons
                        name={blocked ? 'lock-open' : 'block'}
                        size={18}
                        color={isSelf ? colors.muted : blocked ? colors.successDark : colors.dangerDark}
                      />
                    </TouchableOpacity>
                  </View>
                );
              })}

              {userTotalPages > 1 && (
                <View style={styles.paginationRow}>
                  <TouchableOpacity
                    style={[styles.paginationBtn, userPage === 1 && styles.paginationBtnDisabled]}
                    disabled={userPage === 1}
                    onPress={() => setUserPage(p => Math.max(1, p - 1))}
                  >
                    <MaterialIcons name="chevron-left" size={24} color={userPage === 1 ? colors.muted : colors.primary} />
                    <Text style={[styles.paginationBtnText, userPage === 1 && { color: colors.muted }]}>Anterior</Text>
                  </TouchableOpacity>
                  
                  <View style={styles.pageIndicator}>
                    <Text style={styles.pageText}>Página {userPage} de {userTotalPages}</Text>
                  </View>

                  <TouchableOpacity
                    style={[styles.paginationBtn, userPage === userTotalPages && styles.paginationBtnDisabled]}
                    disabled={userPage === userTotalPages}
                    onPress={() => setUserPage(p => Math.min(userTotalPages, p + 1))}
                  >
                    <Text style={[styles.paginationBtnText, userPage === userTotalPages && { color: colors.muted }]}>Siguiente</Text>
                    <MaterialIcons name="chevron-right" size={24} color={userPage === userTotalPages ? colors.muted : colors.primary} />
                  </TouchableOpacity>
                </View>
              )}
            </>
          ) : (
            <EmptyState icon="person-search" text="No hay usuarios con esos filtros." />
          )}
        </View>
      </View>
    </View>
  );

  const renderCitas = () => (
    <View style={styles.tabContent}>
      <View style={styles.panelSection}>
        {renderSectionHeader('Citas', 'event-note', filteredCitas.length)}
        
        <View style={styles.filterSection}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
            {citaScopes.map((item) => (
              <TouchableOpacity
                key={item.key}
                style={[styles.filterChip, citaScope === item.key && styles.filterChipActive]}
                onPress={() => setCitaScope(item.key)}
              >
                <Text style={[styles.filterText, citaScope === item.key && styles.filterTextActive]}>
                  {item.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        <View style={styles.userListContainer}>
          {filteredCitas.length ? (
            filteredCitas.map(renderCitaRow)
          ) : (
            <EmptyState icon="event-busy" text="No hay citas en esta vista." />
          )}
        </View>
      </View>
    </View>
  );

  const renderPagos = () => (
    <View style={styles.tabContent}>
      <View style={styles.panelSection}>
        {renderSectionHeader(budget?.tabla?.titulo || 'Ingresos estimados del mes', 'payments')}
        {budget ? (
          <>
            <View style={styles.rowTop}>
              <View style={styles.itemMain}>
                <Text style={styles.itemSub}>
                  {budget?.periodo?.mes || 'Periodo actual'}
                </Text>
                <Text style={styles.metaText}>
                  {toInt(budget?.estadisticas?.medicosConMembresia)} membresias activas ·{' '}
                  {toInt(budget?.estadisticas?.consultasPresencialesPagadas)} presenciales ·{' '}
                  {toInt(budget?.estadisticas?.consultasVirtualesPagadas)} virtuales
                </Text>
              </View>
              <Badge
                label={`${budgetVariation > 0 ? '+' : ''}${budgetVariation.toFixed(1)}% vs mes anterior`}
                tone={budgetVariationTone}
              />
            </View>

            <View style={styles.totalBand}>
              <Text style={styles.totalLabel}>Total estimado de ingresos</Text>
              <Text style={styles.totalValue}>
                {formatBudgetMoney(budget?.tabla?.total ?? budget?.ingresosMes?.total ?? 0, budgetCurrency)}
              </Text>
            </View>

            {showBudgetColumns ? (
              <View style={styles.budgetHeaderRow}>
                <View style={styles.budgetConceptCell}>
                  <Text style={styles.budgetHeaderText}>
                    {budget?.tabla?.columnas?.concepto || 'Concepto'}
                  </Text>
                </View>
                <View style={styles.budgetValueCell}>
                  <Text style={styles.budgetHeaderText}>
                    {budget?.tabla?.columnas?.valor || 'Valor'}
                  </Text>
                </View>
                <View style={styles.budgetNotesCell}>
                  <Text style={styles.budgetHeaderText}>
                    {budget?.tabla?.columnas?.notas || 'Notas'}
                  </Text>
                </View>
              </View>
            ) : null}

            <View>{budgetRows.map(renderBudgetRow)}</View>
            {budget?.tabla?.fuente ? <Text style={styles.budgetFootnote}>{budget.tabla.fuente}</Text> : null}
          </>
        ) : (
          <EmptyState icon="analytics" text="No se pudo calcular el desglose de ingresos." />
        )}
      </View>
      <View style={styles.panelSection}>
        {renderSectionHeader('Pagos registrados', 'payments', pagos.length)}
        <View style={styles.totalBand}>
          <Text style={styles.totalLabel}>Total registrado</Text>
          <Text style={styles.totalValue}>{formatMoney(paymentTotal)}</Text>
        </View>
        {pagos.length ? pagos.map(renderPagoRow) : <EmptyState icon="receipt" text="No hay pagos registrados." />}
      </View>
    </View>
  );

  const renderModeracion = () => (
    <View style={styles.tabContent}>
      <View style={styles.panelSection}>
        {renderSectionHeader('Valoraciones pendientes', 'rate-review', pendingReviews.length)}
        {pendingReviews.length ? (
          pendingReviews.map((review) => renderReviewCard(review))
        ) : (
          <EmptyState icon="reviews" text="No hay valoraciones pendientes." />
        )}
      </View>
    </View>
  );

  const renderAuditoria = () => (
    <View style={styles.tabContent}>
      <View style={styles.panelSection}>
        {renderSectionHeader('Auditoria', 'manage-search', audit.length)}
        {audit.length ? (
          audit.map((item) => (
            <View key={`audit-${item.id}`} style={styles.auditRow}>
              <View style={styles.auditIcon}>
                <MaterialIcons name="history" size={18} color={colors.primary} />
              </View>
              <View style={styles.flexCell}>
                <Text style={styles.itemTitle} numberOfLines={1}>
                  {titleCase(item.scope)}
                </Text>
                <Text style={styles.itemSub} numberOfLines={1}>
                  {item.usuarioEmail || `Usuario ${item.usuarioid}`} · {formatDateTime(item.createdAt)}
                </Text>
                {item.motivo ? (
                  <Text style={styles.commentText} numberOfLines={2}>
                    {item.motivo}
                  </Text>
                ) : null}
              </View>
              <Badge label={item.actorEmail || 'Sistema'} tone="neutral" />
            </View>
          ))
        ) : (
          <EmptyState icon="history" text="No hay movimientos recientes." />
        )}
      </View>
    </View>
  );

  const renderActiveTab = () => {
    if (adminMode === 'technical') {
      if (activeTab === 'it-overview') return renderITOverview();
      if (activeTab === 'it-infra') return renderITInfra();
      if (activeTab === 'it-logs') return renderITLogs();
      return (
        <View style={styles.itPlaceholder}>
          <Text style={styles.itPlaceholderText}>{activeTab.replace('it-', '').toUpperCase()} Module coming soon...</Text>
        </View>
      );
    }

    if (activeTab === 'usuarios') return renderUsuarios();
    if (activeTab === 'citas') return renderCitas();
    if (activeTab === 'pagos') return renderPagos();
    if (activeTab === 'moderacion') return renderModeracion();
    if (activeTab === 'auditoria') return renderAuditoria();
    return renderResumen();
  };

  const renderITOverview = () => (
    <View style={styles.itTabContent}>
      {itError && (
        <View style={styles.itErrorBanner}>
          <MaterialIcons name="error-outline" size={20} color="#F85149" />
          <Text style={styles.itErrorText}>{itError}</Text>
        </View>
      )}

      <View style={styles.itStatsGrid}>
        <ITStatCard label="System Health" value={`${systemHealth.toFixed(1)}%`} icon="favorite" color={systemHealth > 95 ? '#238636' : systemHealth === 0 ? '#F85149' : '#D29922'} />
        <ITStatCard label="Avg Latency" value={`${apiLatency.toFixed(0)}ms`} icon="speed" color={apiLatency < 100 ? '#58A6FF' : '#F85149'} />
        <ITStatCard label="Active Sessions" value={String(activeSessions)} icon="wifi" color="#58A6FF" />
        <ITStatCard label="DB Load" value={`${dbLoad.toFixed(1)}%`} icon="storage" color="#238636" />
      </View>
      
      <View style={styles.itSection}>
        <View style={styles.itSectionHeaderRow}>
          <Text style={styles.itSectionTitle}>Quick View: Infrastructure</Text>
          <TouchableOpacity onPress={() => setActiveTab('it-infra')}>
             <Text style={styles.itLinkText}>Ver detalles</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.itInfraList}>
          {infra.slice(0, 3).map((item, idx) => (
            <ITInfraItem key={idx} name={item.name} status={item.status} uptime={item.uptime} warning={item.status !== 'Healthy' && item.status !== 'Active' && item.status !== 'Ready' && item.status !== 'Running' && item.status !== 'Operational'} />
          ))}
        </View>
      </View>

      <View style={styles.itSection}>
        <View style={styles.itSectionHeaderRow}>
          <Text style={styles.itSectionTitle}>System Runtime Logs (Real-time)</Text>
          <View style={styles.itTerminalStatus}>
            <Text style={styles.itTerminalStatusText}>STDOUT / STDERR</Text>
          </View>
        </View>
        <View style={styles.itTerminalShort}>
          {logs.length > 0 ? logs.slice(-10).map((log, idx) => (
            <Text key={log.id || idx} style={[
              styles.itTerminalText,
              log.text.includes('[ERROR]') && styles.itTerminalTextError,
              log.text.includes('[SERVER]') && styles.itTerminalTextServer,
              log.text.includes('[SUCCESS]') && styles.itTerminalTextSuccess
            ]}>
              {log.text}
            </Text>
          )) : (
            <Text style={styles.itTerminalTextMuted}>Waiting for system events...</Text>
          )}
        </View>
        <TouchableOpacity style={styles.itLogsExpandBtn} onPress={() => setActiveTab('it-logs')}>
          <MaterialIcons name="terminal" size={16} color="#58A6FF" />
          <Text style={styles.itLogsExpandText}>Abrir Consola Completa</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderITInfra = () => {
    // Group components
    const database = infra.filter(i => i.name.toLowerCase().includes('database') || i.name.toLowerCase().includes('supabase'));
    const platform = infra.filter(i => i.name.toLowerCase().includes('render') || i.name.toLowerCase().includes('vercel') || i.name.toLowerCase().includes('local'));
    const apis = infra.filter(i => !database.includes(i) && !platform.includes(i));

    const renderInfraGroup = (title: string, items: any[]) => (
      <View style={{ marginBottom: 32 }}>
        <Text style={[styles.itSectionTitle, { fontSize: 18, marginBottom: 8 }]}>{title}</Text>
        <View style={styles.itInfraGrid}>
          {items.map((item, idx) => (
            <View key={idx} style={styles.infraCard}>
              <View style={styles.infraCardHeader}>
                <View style={styles.infraIconWrap}>
                   <MaterialIcons 
                     name={item.name.toLowerCase().includes('database') || item.name.toLowerCase().includes('supabase') ? 'storage' : 
                           item.name.toLowerCase().includes('make') ? 'auto-fix-high' :
                           item.name.toLowerCase().includes('phone') || item.name.toLowerCase().includes('veriphone') ? 'phonelink-setup' :
                           item.name.toLowerCase().includes('exequatur') ? 'verified' :
                           item.name.toLowerCase().includes('cedula') || item.name.toLowerCase().includes('cédula') ? 'badge' :
                           item.name.toLowerCase().includes('media') || item.name.toLowerCase().includes('livekit') ? 'videocam' : 'cloud'} 
                     size={24} 
                     color="#58A6FF" 
                   />
                </View>
                <View style={[styles.statusIndicator, { backgroundColor: (item.status === 'Healthy' || item.status === 'Active' || item.status === 'Ready' || item.status === 'Running' || item.status === 'Operational') ? '#238636' : '#D29922' }]} />
              </View>
              <Text style={styles.infraCardName}>{item.name}</Text>
              <Text style={styles.infraCardStatus}>{item.status}</Text>
              <View style={styles.infraCardFooter}>
                 <Text style={styles.infraCardUptime}>{item.uptime}</Text>
                 {item.latency && <Text style={styles.infraCardLatency}>{item.latency}</Text>}
              </View>
              {item.details && <Text style={styles.infraCardDetails} numberOfLines={2}>{item.details}</Text>}
            </View>
          ))}
        </View>
      </View>
    );

    return (
      <View style={styles.itTabContent}>
        <View style={styles.itSection}>
          <Text style={styles.itSectionTitleLarge}>System Infrastructure</Text>
          <Text style={styles.itSectionSubtitle}>Real-time status of all backend and cloud-managed components.</Text>
          
          {renderInfraGroup("Core Infrastructure", [...database, ...platform])}
          {renderInfraGroup("Integrated Services & APIs", apis)}
        </View>
      </View>
    );
  };

  const renderITLogs = () => (
    <View style={styles.itLogsContainer}>
      <View style={styles.itLogsHeader}>
        <View style={styles.itLogsHeaderLeft}>
          <MaterialIcons name="terminal" size={20} color="#58A6FF" />
          <Text style={styles.itLogsTitle}>system_stdout_stream.log</Text>
        </View>
        <TouchableOpacity onPress={() => setLogs([])}>
          <Text style={styles.itLinkText}>Clear console</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.itTerminalLargeBox}>
        <FlatList
          data={[...logs].reverse()}
          keyExtractor={(item, index) => item.id || String(index)}
          renderItem={({ item }) => (
            <View style={styles.logLine}>
               <Text style={[
                styles.itTerminalTextLarge,
                item.text.includes('[ERROR]') && styles.itTerminalTextError,
                item.text.includes('[SERVER]') && styles.itTerminalTextServer,
                item.text.includes('[SUCCESS]') && styles.itTerminalTextSuccess
              ]}>
                {item.text}
              </Text>
            </View>
          )}
          contentContainerStyle={styles.itLogsFlatList}
          removeClippedSubviews={true}
          initialNumToRender={20}
          maxToRenderPerBatch={10}
        />
      </View>
    </View>
  );

  const ITStatCard = ({ label, value, icon, color }: any) => (
    <View style={styles.itStatCard}>
      <View style={[styles.itStatIconBox, { backgroundColor: `${color}15` }]}>
        <MaterialIcons name={icon} size={20} color={color} />
      </View>
      <View>
        <Text style={styles.itStatLabel}>{label}</Text>
        <Text style={styles.itStatValue}>{value}</Text>
      </View>
    </View>
  );

  const ITInfraItem = ({ name, status, uptime, warning }: any) => (
    <View style={styles.itInfraItem}>
      <View style={styles.itInfraLeft}>
        <MaterialIcons name={warning ? 'warning' : 'check-circle'} size={18} color={warning ? '#D29922' : '#238636'} />
        <Text style={styles.itInfraName}>{name}</Text>
      </View>
      <View style={styles.itInfraRight}>
        <Text style={styles.itInfraUptime}>{uptime} Uptime</Text>
        <View style={[styles.itStatusBadge, { backgroundColor: warning ? '#D2992220' : '#23863620' }]}>
          <Text style={[styles.itStatusBadgeText, { color: warning ? '#D29922' : '#238636' }]}>{status}</Text>
        </View>
      </View>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loaderWrap}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loaderText}>Cargando panel administrativo...</Text>
      </View>
    );
  }

  const isTech = adminMode === 'technical';

  return (
    <View style={[styles.appContainer, isTech && styles.appContainerTech]}>
      <AdminSidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isMobileMenuOpen={isMobileMenuOpen}
        onCloseMobileMenu={() => setIsMobileMenuOpen(false)}
        adminEmail={panel?.admin?.email}
        onLogout={handleLogout}
        adminMode={adminMode}
        setAdminMode={setAdminMode}
      />
      <View style={{ flex: 1 }}>
        <ScrollView
          style={[styles.screen, isTech && styles.screenTech]}
          contentContainerStyle={[styles.content, isWide && styles.contentWide]}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={isTech ? '#58A6FF' : colors.primary} />
          }
        >
          <View style={styles.header}>
            <View style={styles.headerTitleWrap}>
              <View style={styles.headerTitleRow}>
                {!isMobileMenuOpen && (
                  <TouchableOpacity 
                    onPress={() => setIsMobileMenuOpen(true)} 
                    style={[styles.menuToggleBtn, isTech && styles.menuToggleBtnTech]}
                  >
                    <MaterialIcons name="menu" size={26} color={isTech ? '#C9D1D9' : colors.text} />
                  </TouchableOpacity>
                )}
                <View>
                  <Text style={[styles.title, isTech && styles.textWhite]}>
                    {isTech ? 'IT Ops Center' : 'Panel Administrativo'}
                  </Text>
                  <View style={styles.itLiveDotRow}>
                    <View style={[styles.itLiveDot, { backgroundColor: itError ? '#F85149' : '#3FB950' }]} />
                    <Text style={[styles.itLiveText, isTech && styles.textMuted]}>
                      {itError ? 'Backend Offline' : 'Backend Online'}
                    </Text>
                  </View>
                </View>
              </View>
            </View>
            <View style={styles.headerActions}>
              {loading && <ActivityIndicator size="small" color={isTech ? '#58A6FF' : colors.primary} />}
              <TouchableOpacity style={[styles.headerIconButton, isTech && styles.headerIconButtonTech]} onPress={refresh} disabled={refreshing || loading}>
                <MaterialIcons name="refresh" size={20} color={isTech ? '#C9D1D9' : colors.text} />
              </TouchableOpacity>
            </View>
          </View>

          {renderActiveTab()}
        </ScrollView>
      </View>
    </View>
  );
};

const colors = {
  primary: '#137fec',
  primarySoft: '#e8f3ff',
  bg: '#f7f9fb',
  surface: '#ffffff',
  border: '#dbe5ee',
  text: '#152033',
  muted: '#64748b',
  success: '#12805c',
  successDark: '#166534',
  successSoft: '#dcfce7',
  warning: '#b7791f',
  warningSoft: '#fff7d6',
  danger: '#dc2626',
  dangerDark: '#991b1b',
  dangerSoft: '#fee2e2',
  neutralSoft: '#f1f5f9',
};

const badgeStyles: Record<Tone, object> = {
  neutral: { backgroundColor: colors.neutralSoft, borderColor: '#d6dee8' },
  info: { backgroundColor: colors.primarySoft, borderColor: '#b7d8fb' },
  success: { backgroundColor: colors.successSoft, borderColor: '#86efac' },
  warning: { backgroundColor: colors.warningSoft, borderColor: '#fde68a' },
  danger: { backgroundColor: colors.dangerSoft, borderColor: '#fecaca' },
};

const badgeTextStyles: Record<Tone, object> = {
  neutral: { color: colors.muted },
  info: { color: colors.primary },
  success: { color: colors.successDark },
  warning: { color: colors.warning },
  danger: { color: colors.dangerDark },
};

const iconToneStyles: Record<Tone, object> = {
  neutral: { backgroundColor: colors.neutralSoft },
  info: { backgroundColor: colors.primarySoft },
  success: { backgroundColor: colors.successSoft },
  warning: { backgroundColor: colors.warningSoft },
  danger: { backgroundColor: colors.dangerSoft },
};

const iconColorStyles: Record<Tone, string> = {
  neutral: colors.muted,
  info: colors.primary,
  success: colors.success,
  warning: colors.warning,
  danger: colors.danger,
};

const styles = StyleSheet.create({
  appContainer: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: colors.bg,
  },
  appContainerTech: { backgroundColor: '#0A0E17' },
  screen: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  screenTech: { backgroundColor: '#0A0E17' },
  content: {
    padding: 14,
    gap: 12,
  },
  contentWide: {
    paddingHorizontal: 28,
    paddingVertical: 20,
  },
  loaderWrap: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.bg,
  },
  loaderText: {
    color: colors.muted,
    fontWeight: '700',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
  },
  headerTitleWrap: {
    flex: 1,
    minWidth: 0,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  menuToggleBtn: {
    padding: 6,
    borderRadius: 8,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: colors.border,
  },
  title: {
    fontSize: 24,
    fontWeight: '900',
    color: colors.text,
  },
  subtitle: {
    color: colors.muted,
    fontWeight: '700',
    marginTop: 2,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerIconButton: {
    width: 38,
    height: 38,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.text,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 9,
  },
  logoutText: {
    color: '#fff',
    fontWeight: '800',
  },
  tabsRow: {
    gap: 8,
    paddingVertical: 2,
  },
  tabButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 9,
    backgroundColor: colors.surface,
  },
  tabButtonActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  tabText: {
    color: colors.muted,
    fontWeight: '900',
    fontSize: 13,
  },
  tabTextActive: {
    color: '#fff',
  },
  tabContent: {
    gap: 12,
  },
  kpiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  kpiCard: {
    backgroundColor: colors.surface,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 12,
    minHeight: 112,
    gap: 7,
  },
  kpiCardWide: {
    flexGrow: 1,
    flexBasis: '15%',
    minWidth: 155,
  },
  kpiCardCompact: {
    width: '48%',
    minWidth: 150,
  },
  kpiIcon: {
    width: 34,
    height: 34,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  kpiValue: {
    color: colors.text,
    fontSize: 21,
    fontWeight: '900',
  },
  kpiLabel: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: '800',
    lineHeight: 16,
  },
  gridTwo: {
    gap: 12,
  },
  gridTwoWide: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  panelSection: {
    flex: 1,
    minWidth: 0,
    backgroundColor: colors.surface,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 12,
    gap: 10,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  sectionTitleWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    flex: 1,
    minWidth: 0,
  },
  sectionTitle: {
    color: colors.text,
    fontWeight: '900',
    fontSize: 16,
  },
  metricList: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  taskList: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  metricLine: {
    minHeight: 42,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: '#edf2f7',
    gap: 10,
  },
  metricLabel: {
    color: colors.muted,
    fontWeight: '800',
  },
  metricValue: {
    color: colors.text,
    fontWeight: '900',
    fontSize: 18,
  },
  itemCard: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    padding: 10,
    backgroundColor: '#fbfdff',
    gap: 8,
  },
  rowTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 8,
  },
  itemMain: {
    flex: 1,
    minWidth: 0,
  },
  itemTitle: {
    color: colors.text,
    fontWeight: '900',
    fontSize: 14,
  },
  itemSub: {
    color: colors.muted,
    fontWeight: '700',
    fontSize: 12,
    marginTop: 2,
  },
  metaGrid: {
    gap: 2,
  },
  metaText: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: '700',
  },
  commentText: {
    color: colors.text,
    fontSize: 12,
    lineHeight: 17,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  actionButton: {
    minHeight: 34,
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
  },
  approveButton: {
    backgroundColor: colors.successSoft,
    borderColor: '#86efac',
  },
  rejectButton: {
    backgroundColor: colors.dangerSoft,
    borderColor: '#fecaca',
  },
  actionText: {
    fontSize: 12,
    fontWeight: '900',
  },
  approveText: {
    color: colors.successDark,
  },
  rejectText: {
    color: colors.dangerDark,
  },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: '#edf2f7',
  },
  dateCell: {
    width: 92,
  },
  dateMain: {
    color: colors.text,
    fontWeight: '900',
    fontSize: 12,
  },
  dateSub: {
    color: colors.muted,
    fontWeight: '700',
    fontSize: 11,
    marginTop: 2,
  },
  flexCell: {
    flex: 1,
    minWidth: 0,
  },
  badgeStack: {
    gap: 4,
    alignItems: 'flex-end',
    maxWidth: 128,
  },
  signalStack: {
    width: 26,
    alignItems: 'center',
    gap: 6,
  },
  badge: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 4,
    maxWidth: 150,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '900',
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  searchBox: {
    flex: 1,
    minHeight: 42,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: '#fbfdff',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 10,
  },
  searchInput: {
    flex: 1,
    minWidth: 0,
    color: colors.text,
    fontWeight: '700',
    outlineStyle: 'none' as any,
  },
  filterSection: {
    gap: 12,
    backgroundColor: '#f1f5f9',
    padding: 14,
    borderRadius: 12,
    marginTop: 4,
  },
  userListContainer: {
    marginTop: 4,
    minHeight: 200,
  },
  filterGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  filterGroupLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.muted,
    width: 60,
  },
  chipRow: {
    gap: 8,
    paddingRight: 10,
  },
  filterChip: {
    minHeight: 34,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    paddingHorizontal: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  filterText: {
    color: colors.muted,
    fontWeight: '900',
    fontSize: 12,
  },
  filterTextActive: {
    color: '#fff',
  },
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: '#edf2f7',
  },
  avatarCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primarySoft,
  },
  avatarText: {
    color: colors.primary,
    fontWeight: '900',
  },
  inlineBadges: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 5,
    marginTop: 6,
  },
  userStats: {
    width: 48,
    alignItems: 'center',
  },
  smallStat: {
    color: colors.text,
    fontWeight: '900',
    fontSize: 16,
  },
  smallStatLabel: {
    color: colors.muted,
    fontWeight: '800',
    fontSize: 10,
  },
  iconAction: {
    width: 36,
    height: 36,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  blockAction: {
    backgroundColor: colors.dangerSoft,
    borderColor: '#fecaca',
  },
  activateAction: {
    backgroundColor: colors.successSoft,
    borderColor: '#86efac',
  },
  moneyText: {
    color: colors.text,
    fontWeight: '900',
    minWidth: 86,
    textAlign: 'right',
  },
  totalBand: {
    minHeight: 50,
    borderRadius: 8,
    backgroundColor: '#f8fbff',
    borderWidth: 1,
    borderColor: colors.border,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    gap: 12,
  },
  totalLabel: {
    color: colors.muted,
    fontWeight: '900',
  },
  totalValue: {
    color: colors.text,
    fontWeight: '900',
    fontSize: 18,
  },
  budgetHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#edf2f7',
    backgroundColor: '#f8fbff',
  },
  budgetHeaderText: {
    color: colors.muted,
    fontWeight: '900',
    fontSize: 11,
    textTransform: 'uppercase',
  },
  budgetTableRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#edf2f7',
  },
  budgetCardRow: {
    gap: 6,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#edf2f7',
  },
  budgetConceptCell: {
    flex: 1.05,
    minWidth: 0,
  },
  budgetValueCell: {
    width: 130,
    alignItems: 'flex-end',
  },
  budgetNotesCell: {
    flex: 1.6,
    minWidth: 0,
  },
  budgetAmount: {
    color: colors.text,
    fontWeight: '900',
    fontSize: 14,
    textAlign: 'right',
  },
  budgetFootnote: {
    color: colors.muted,
    fontSize: 11,
    fontWeight: '700',
  },
  auditRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    borderTopWidth: 1,
    borderTopColor: '#edf2f7',
    paddingVertical: 12,
  },
  paginationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 20,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  paginationBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  paginationBtnDisabled: {
    opacity: 0.5,
    backgroundColor: '#f8fafc',
  },
  paginationBtnText: {
    color: colors.primary,
    fontWeight: '800',
    fontSize: 13,
  },
  pageIndicator: {
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  pageText: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: '900',
  },
  auditIcon: {
    width: 34,
    height: 34,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primarySoft,
  },
  emptyState: {
    minHeight: 76,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderTopWidth: 1,
    borderTopColor: '#edf2f7',
  },
  emptyText: {
    color: colors.muted,
    fontWeight: '800',
    textAlign: 'center',
  },

  // IT Specific Styles
  itTabContent: { gap: 24 },
  itStatsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  itStatCard: {
    flex: 1,
    minWidth: 200,
    backgroundColor: '#161B22',
    borderWidth: 1,
    borderColor: '#30363D',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  itStatIconBox: {
    width: 40,
    height: 40,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  itStatLabel: { color: '#8B949E', fontSize: 12, fontWeight: '700', marginBottom: 4 },
  itStatValue: { fontSize: 24, fontWeight: '900', color: '#C9D1D9' },
  itSection: { marginTop: 12 },
  itSectionTitle: { color: '#fff', fontSize: 16, fontWeight: '800', marginBottom: 16 },
  itSectionTitleLarge: { color: '#fff', fontSize: 24, fontWeight: '800', marginBottom: 8 },
  itSectionSubtitle: { color: '#8B949E', fontSize: 14, fontWeight: '500', marginBottom: 24 },
  itInfraList: { gap: 12 },
  itInfraItem: {
    backgroundColor: '#161B22',
    padding: 16,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#30363D',
  },
  itInfraLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  itInfraName: { color: '#C9D1D9', fontWeight: '700', fontSize: 14 },
  itInfraRight: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  itInfraUptime: { color: '#8B949E', fontSize: 12 },
  itStatusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6 },
  itStatusBadgeText: { fontSize: 11, fontWeight: '900' },
  
  itInfraGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 20,
    marginTop: 10,
  },
  infraCard: {
    width: 320,
    backgroundColor: '#161B22',
    borderWidth: 1,
    borderColor: '#30363D',
    borderRadius: 16,
    padding: 20,
    gap: 12,
  },
  infraCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  infraIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#0D1117',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#30363D',
  },
  statusIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#161B22',
  },
  infraCardName: { color: '#C9D1D9', fontSize: 18, fontWeight: '800' },
  infraCardStatus: { color: '#8B949E', fontSize: 14, fontWeight: '600' },
  infraCardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#30363D',
  },
  infraCardUptime: { color: '#238636', fontSize: 12, fontWeight: '700' },
  infraCardLatency: { color: '#58A6FF', fontSize: 12, fontWeight: '700' },
  infraCardDetails: { color: '#8B949E', fontSize: 11, fontStyle: 'italic', marginTop: 4 },

  itTerminalShort: {
    backgroundColor: '#010409',
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#30363D',
    minHeight: 180,
  },
  itTerminalText: {
    color: '#D1D5DA',
    fontFamily: Platform.OS === 'web' ? 'monospace' : 'Courier',
    fontSize: 11,
    lineHeight: 16,
    marginBottom: 2,
  },
  itTerminalTextError: { color: '#F85149' },
  itTerminalTextServer: { color: '#58A6FF', fontWeight: 'bold' },
  itTerminalTextSuccess: { color: '#3FB950' },
  itTerminalTextMuted: { color: '#484F58', fontStyle: 'italic' },
  itTerminalStatus: {
    backgroundColor: '#21262D',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  itTerminalStatusText: { color: '#8B949E', fontSize: 10, fontWeight: '700' },
  
  itLinkText: { color: '#58A6FF', fontSize: 13, fontWeight: '700' },
  itLogsExpandBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 12,
    paddingVertical: 8,
    backgroundColor: '#0D1117',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#30363D',
  },
  itLogsExpandText: { color: '#58A6FF', fontSize: 13, fontWeight: '800' },

  itLogsContainer: {
    flex: 1,
    backgroundColor: '#010409',
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#30363D',
    minHeight: 600,
  },
  itLogsHeader: {
    height: 48,
    backgroundColor: '#161B22',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#30363D',
  },
  itLogsHeaderLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  itLogsTitle: { color: '#C9D1D9', fontSize: 13, fontWeight: '700' },
  itTerminalLargeBox: { flex: 1, padding: 12 },
  itLogsFlatList: { paddingBottom: 20 },
  logLine: { 
    paddingVertical: 4, 
    borderBottomWidth: 0.5, 
    borderBottomColor: '#161B22' 
  },
  itTerminalTextLarge: {
    color: '#D1D5DA',
    fontFamily: Platform.OS === 'web' ? 'monospace' : 'Courier',
    fontSize: 12,
    lineHeight: 18,
  },

  itPlaceholder: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40 },
  itPlaceholderText: { color: '#8B949E', fontSize: 16, fontWeight: '700' },
  itPlaceholderCompact: { padding: 20, alignItems: 'center', gap: 8 },
  itPlaceholderTextSmall: { color: '#8B949E', fontSize: 12, fontWeight: '600' },
  itErrorBanner: {
    backgroundColor: 'rgba(248, 81, 73, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(248, 81, 73, 0.4)',
    borderRadius: 8,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 16,
  },
  itErrorText: { color: '#F85149', fontSize: 13, fontWeight: '700' },
  itSectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  itLiveDotRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  itLiveDot: { width: 8, height: 8, borderRadius: 4, shadowColor: '#3FB950', shadowOpacity: 0.5, shadowRadius: 4 },
  itLiveText: { color: '#8B949E', fontSize: 12, fontWeight: '700' },
  textWhite: { color: '#fff' },
  textMuted: { color: '#8B949E' },
  menuToggleBtnTech: { backgroundColor: '#161B22', borderColor: '#30363D' },
  headerIconButtonTech: { backgroundColor: '#161B22', borderColor: '#30363D' },
});

export default AdminPanelScreen;
