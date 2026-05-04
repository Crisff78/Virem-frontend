import React, { useCallback, useMemo, useRef, useState } from 'react';
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
import { MaterialIcons } from '@expo/vector-icons';
import type { RootStackParamList } from '../../navigation/types';
import { useAuth } from '../../providers/AuthProvider';
import { ApiError, apiClient } from '../../utils/api';
import { getApiErrorMessage } from '../../utils/apiErrors';

type Nav = NativeStackNavigationProp<RootStackParamList, 'AdminPanel'>;
type TabKey = 'resumen' | 'usuarios' | 'citas' | 'pagos' | 'moderacion' | 'auditoria';
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

const tabs: Array<{ key: TabKey; label: string; icon: string }> = [
  { key: 'resumen', label: 'Resumen', icon: 'dashboard' },
  { key: 'usuarios', label: 'Usuarios', icon: 'groups' },
  { key: 'citas', label: 'Citas', icon: 'event-note' },
  { key: 'pagos', label: 'Pagos', icon: 'receipt-long' },
  { key: 'moderacion', label: 'Moderacion', icon: 'verified-user' },
  { key: 'auditoria', label: 'Auditoria', icon: 'manage-search' },
];

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

  const [panel, setPanel] = useState<PanelStats | null>(null);
  const [pendingDoctors, setPendingDoctors] = useState<PendingMedico[]>([]);
  const [pendingReviews, setPendingReviews] = useState<PendingReview[]>([]);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [citas, setCitas] = useState<AdminCita[]>([]);
  const [pagos, setPagos] = useState<AdminPago[]>([]);
  const [budget, setBudget] = useState<AdminBudget | null>(null);
  const [audit, setAudit] = useState<AuditItem[]>([]);

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
      const [panelRes, doctorsRes, reviewsRes, usersRes, citasRes, pagosRes, budgetRes, auditRes] =
        await Promise.all([
          apiClient.get<any>('/api/admin/panel', { authenticated: true }),
          apiClient.get<any>('/api/admin/medicos/pendientes', {
            authenticated: true,
            query: { limit: 60 },
          }),
          apiClient.get<any>('/api/admin/valoraciones/pendientes', {
            authenticated: true,
            query: { limit: 80 },
          }),
          apiClient.get<any>('/api/admin/usuarios', {
            authenticated: true,
            query: { limit: 160 },
          }),
          apiClient.get<any>('/api/admin/citas', {
            authenticated: true,
            query: { scope: 'all', limit: 140 },
          }),
          apiClient.get<any>('/api/admin/pagos', {
            authenticated: true,
            query: { limit: 120 },
          }),
          apiClient.get<any>('/api/admin/presupuesto', {
            authenticated: true,
          }),
          apiClient.get<any>('/api/admin/usuarios/modificaciones', {
            authenticated: true,
            query: { limit: 80 },
          }),
        ]);

      if (!panelRes?.success) {
        await handleAuthExpired(panelRes?.message || 'No se pudo abrir panel admin.');
        return;
      }

      setPanel(panelRes?.panel || null);
      setPendingDoctors(Array.isArray(doctorsRes?.pendientes) ? doctorsRes.pendientes : []);
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

  useFocusEffect(
    useCallback(() => {
      if (!isReady) return;
      refresh();
    }, [isReady, refresh])
  );

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
        label: 'Medicos pendientes',
        value: String(toInt(usuarios?.medicos_pendientes)),
        icon: 'pending-actions',
        tone: toInt(usuarios?.medicos_pendientes) ? 'warning' : ('success' as Tone),
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

  const pendingTasks = pendingDoctors.length + pendingReviews.length;

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

  const renderDoctorCard = (doctor: PendingMedico, compact = false) => (
    <View key={`doctor-${doctor.usuarioid}`} style={styles.itemCard}>
      <View style={styles.rowTop}>
        <View style={styles.itemMain}>
          <Text style={styles.itemTitle} numberOfLines={1}>
            {normalizeText(doctor?.medico?.nombreCompleto) || 'Medico'}
          </Text>
          <Text style={styles.itemSub} numberOfLines={1}>
            {doctor?.medico?.especialidad || 'Especialidad no definida'}
          </Text>
        </View>
        <Badge label={`${doctor?.documentos?.length || 0} docs`} tone="info" />
      </View>

      {!compact ? (
        <View style={styles.metaGrid}>
          <Text style={styles.metaText} numberOfLines={1}>
            {doctor.email}
          </Text>
          <Text style={styles.metaText} numberOfLines={1}>
            Cedula: {doctor?.medico?.cedula || 'N/D'}
          </Text>
          <Text style={styles.metaText} numberOfLines={1}>
            Tel: {doctor?.medico?.telefono || 'N/D'}
          </Text>
        </View>
      ) : null}

      <View style={styles.actionsRow}>
        <TouchableOpacity
          style={[styles.actionButton, styles.approveButton]}
          disabled={workingId === `aprobar-${doctor.usuarioid}`}
          onPress={() => moderateDoctor(doctor.usuarioid, 'aprobar')}
        >
          <MaterialIcons name="check" size={16} color={colors.successDark} />
          <Text style={[styles.actionText, styles.approveText]}>Aprobar</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionButton, styles.rejectButton]}
          disabled={workingId === `rechazar-${doctor.usuarioid}`}
          onPress={() => moderateDoctor(doctor.usuarioid, 'rechazar')}
        >
          <MaterialIcons name="close" size={16} color={colors.dangerDark} />
          <Text style={[styles.actionText, styles.rejectText]}>Rechazar</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

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
                  <Text style={styles.metricLabel}>Medicos por aprobar</Text>
                  <Text style={styles.metricValue}>{pendingDoctors.length}</Text>
                </View>
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
        <View style={styles.searchRow}>
          <View style={styles.searchBox}>
            <MaterialIcons name="search" size={18} color={colors.muted} />
            <TextInput
              value={userSearch}
              onChangeText={setUserSearch}
              placeholder="Buscar por nombre, email, cedula"
              placeholderTextColor={colors.muted}
              style={styles.searchInput}
            />
          </View>
        </View>
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

      <View style={styles.panelSection}>
        {filteredUsers.length ? (
          filteredUsers.map((user) => {
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
          })
        ) : (
          <EmptyState icon="person-search" text="No hay usuarios con esos filtros." />
        )}
      </View>
    </View>
  );

  const renderCitas = () => (
    <View style={styles.tabContent}>
      <View style={styles.panelSection}>
        {renderSectionHeader('Citas', 'event-note', filteredCitas.length)}
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

      <View style={styles.panelSection}>
        {filteredCitas.length ? (
          filteredCitas.map(renderCitaRow)
        ) : (
          <EmptyState icon="event-busy" text="No hay citas en esta vista." />
        )}
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
      <View style={[styles.gridTwo, isWide && styles.gridTwoWide]}>
        <View style={styles.panelSection}>
          {renderSectionHeader('Medicos pendientes', 'badge', pendingDoctors.length)}
          {pendingDoctors.length ? (
            pendingDoctors.map((doctor) => renderDoctorCard(doctor))
          ) : (
            <EmptyState icon="verified" text="No hay medicos pendientes." />
          )}
        </View>

        <View style={styles.panelSection}>
          {renderSectionHeader('Valoraciones pendientes', 'rate-review', pendingReviews.length)}
          {pendingReviews.length ? (
            pendingReviews.map((review) => renderReviewCard(review))
          ) : (
            <EmptyState icon="reviews" text="No hay valoraciones pendientes." />
          )}
        </View>
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
    if (activeTab === 'usuarios') return renderUsuarios();
    if (activeTab === 'citas') return renderCitas();
    if (activeTab === 'pagos') return renderPagos();
    if (activeTab === 'moderacion') return renderModeracion();
    if (activeTab === 'auditoria') return renderAuditoria();
    return renderResumen();
  };

  if (loading) {
    return (
      <View style={styles.loaderWrap}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loaderText}>Cargando panel administrativo...</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={[styles.content, isWide && styles.contentWide]}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={colors.primary} />
      }
    >
      <View style={styles.header}>
        <View style={styles.headerTitleWrap}>
          <Text style={styles.title}>Panel Administrativo</Text>
          <Text style={styles.subtitle} numberOfLines={1}>
            {panel?.admin?.email || 'Administrador'}
            {lastUpdatedAt ? ` · ${formatDateTime(lastUpdatedAt)}` : ''}
          </Text>
        </View>
        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.headerIconButton} onPress={refresh} disabled={refreshing}>
            <MaterialIcons name="refresh" size={20} color={colors.text} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <MaterialIcons name="logout" size={18} color="#fff" />
            <Text style={styles.logoutText}>Salir</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabsRow}>
        {tabs.map((tab) => {
          const active = activeTab === tab.key;
          return (
            <TouchableOpacity
              key={tab.key}
              style={[styles.tabButton, active && styles.tabButtonActive]}
              onPress={() => setActiveTab(tab.key)}
            >
              <MaterialIcons name={tab.icon as any} size={18} color={active ? '#fff' : colors.muted} />
              <Text style={[styles.tabText, active && styles.tabTextActive]}>{tab.label}</Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {renderActiveTab()}
    </ScrollView>
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
  screen: {
    flex: 1,
    backgroundColor: colors.bg,
  },
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
  chipRow: {
    gap: 8,
    paddingRight: 4,
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
    paddingVertical: 10,
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
});

export default AdminPanelScreen;
