import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { sanitizeRemoteImageUrl, resolveRemoteImageSource } from './utils/imageSources';
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
import { useFocusEffect } from '@react-navigation/native';
import { usePortalAwareMedicoNavigation } from './navigation/usePortalAwareMedicoNavigation';
import { useMedicoModule } from './navigation/MedicoModuleContext';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
<<<<<<< HEAD
=======
import type { RootStackParamList } from './navigation/types';
import MedicoHeader from './components/MedicoHeader';
>>>>>>> feature-cris
import { useAuth } from './providers/AuthProvider';
import { apiClient } from './utils/api';
import { useMedicoPortalSession } from './hooks/useMedicoPortalSession';
import { useMedicoSessionProfile, type MedicoSessionUser } from './hooks/useMedicoSessionProfile';
import { useResponsive } from './hooks/useResponsive';
import { colors } from './theme/colors';
import { spacing, radii } from './theme/spacing';

const ViremLogo = require('./assets/imagenes/descarga.png');
const DefaultAvatar = require('./assets/imagenes/avatar-default.jpg');

type CitaItem = {
  citaid: string;
  fechaHoraInicio: string | null;
  estado: string;
  paciente?: {
    pacienteid?: string;
    nombreCompleto?: string;
  };
};

type PatientRow = {
  id: string;
  name: string;
  totalCitas: number;
  upcomingCitas: number;
  lastEstado: string;
  nextDateMs: number;
  nextDateLabel: string;
  lastDateMs: number;
  lastDateLabel: string;
};

const normalizeText = (value: unknown) =>
  String(value || '')
    .replace(/\s+/g, ' ')
    .trim();

const parseDateMs = (value: string | null | undefined) => {
  if (!value) return Number.POSITIVE_INFINITY;
  const ms = new Date(value).getTime();
  return Number.isFinite(ms) ? ms : Number.POSITIVE_INFINITY;
};

const formatDateTime = (value: string | null | undefined) => {
  if (!value) return 'Sin fecha';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Sin fecha';
  return new Intl.DateTimeFormat('es-DO', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
};

const MedicoPacientesScreen: React.FC = () => {
  const navigation = usePortalAwareMedicoNavigation();
  const { isInsidePortal, isSidebarOpen, toggleSidebar } = useMedicoModule();
  const { signOut } = useAuth();
<<<<<<< HEAD
  const { sessionUser, syncProfile } = useMedicoSessionProfile();
  const { fs, rs, isDesktop, isTablet, isMobile } = useResponsive();
  
  const [user, setUser] = useState<MedicoSessionUser | null>(sessionUser);
  const [loadingUser, setLoadingUser] = useState(true);
=======
  const { loadingUser, refreshUser, doctorName, doctorSpec, fotoUrl } =
    useMedicoPortalSession({ syncOnMount: true, addDoctorPrefix: true });

>>>>>>> feature-cris
  const [loadingPatients, setLoadingPatients] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [patients, setPatients] = useState<PatientRow[]>([]);



  const loadUser = useCallback(async () => {
    try {
      await refreshUser();
    } catch {
      // noop
    }
  }, [refreshUser]);

  const loadPatients = useCallback(async () => {
    setLoadingPatients(true);
    try {
      const payload = await apiClient.get<any>('/api/agenda/me/citas', {
        authenticated: true,
        query: { scope: 'all', limit: 400 },
      });
      if (!(payload?.success && Array.isArray(payload?.citas))) {
        setPatients([]);
        return;
      }

      const map = new Map<string, PatientRow>();
      const now = Date.now();
      for (const cita of payload.citas as CitaItem[]) {
        const patientId = normalizeText(cita?.paciente?.pacienteid);
        const patientName = normalizeText(cita?.paciente?.nombreCompleto || 'Paciente');
        const key = patientId || `patient:${patientName.toLowerCase()}`;
        const dateMs = parseDateMs(cita?.fechaHoraInicio);
        const estado = normalizeText(cita?.estado || 'Pendiente') || 'Pendiente';

        const current = map.get(key) || {
          id: key,
          name: patientName,
          totalCitas: 0,
          upcomingCitas: 0,
          lastEstado: estado,
          nextDateMs: Number.POSITIVE_INFINITY,
          nextDateLabel: 'Sin cita proxima',
          lastDateMs: Number.NEGATIVE_INFINITY,
          lastDateLabel: 'Sin historial',
        };

        current.totalCitas += 1;
        current.lastEstado = estado;

        if (dateMs >= now && dateMs < current.nextDateMs) {
          current.nextDateMs = dateMs;
          current.nextDateLabel = formatDateTime(cita?.fechaHoraInicio);
        }
        if (dateMs >= now) {
          current.upcomingCitas += 1;
        }
        if (dateMs < now && dateMs > current.lastDateMs) {
          current.lastDateMs = dateMs;
          current.lastDateLabel = formatDateTime(cita?.fechaHoraInicio);
        }

        map.set(key, current);
      }

      const rows = [...map.values()].sort((a, b) => {
        if (a.upcomingCitas !== b.upcomingCitas) return b.upcomingCitas - a.upcomingCitas;
        if (a.nextDateMs !== b.nextDateMs) return a.nextDateMs - b.nextDateMs;
        return a.name.localeCompare(b.name);
      });
      setPatients(rows);
    } catch {
      setPatients([]);
    } finally {
      setLoadingPatients(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadUser();
      loadPatients();
    }, [loadPatients, loadUser])
  );

<<<<<<< HEAD
=======
  const userAvatarSource: ImageSourcePropType = useMemo(() => {
    if (fotoUrl) return { uri: fotoUrl };
    return DefaultAvatar;
  }, [fotoUrl]);

>>>>>>> feature-cris
  const filteredPatients = useMemo(() => {
    const q = normalizeText(searchText).toLowerCase();
    if (!q) return patients;
    return patients.filter((item) => {
      const name = normalizeText(item.name).toLowerCase();
      const estado = normalizeText(item.lastEstado).toLowerCase();
      return name.includes(q) || estado.includes(q);
    });
  }, [patients, searchText]);

  const kpis = useMemo(() => {
    const total = patients.length;
    const withUpcoming = patients.filter((item) => item.upcomingCitas > 0).length;
    const withoutUpcoming = Math.max(0, total - withUpcoming);
    return { total, withUpcoming, withoutUpcoming };
  }, [patients]);

  const dateText = useMemo(
    () =>
      new Intl.DateTimeFormat('es-DO', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
      }).format(new Date()),
    []
  );

  const timeText = useMemo(
    () =>
      new Intl.DateTimeFormat('es-DO', {
        hour: '2-digit',
        minute: '2-digit',
      }).format(new Date()),
    []
  );

  if (loadingUser) {
    return (
      <View style={styles.loaderWrap}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loaderText}>Cargando pacientes...</Text>
      </View>
    );
  }

  return (
<<<<<<< HEAD
    <View style={styles.container}>
      <ScrollView style={styles.main} contentContainerStyle={{ paddingBottom: spacing.xl }}>
        <View style={styles.headerWrap}>
          <View style={[styles.headerRow, !isDesktop && styles.headerRowMobile]}>
            <View style={styles.headerLeft}>
              <Text style={[styles.pageTitle, { fontSize: fs(30) }]}>Pacientes</Text>
              <Text style={[styles.pageSubtitle, { fontSize: fs(15) }]}>
                Visualiza y da seguimiento a tus pacientes activos.
              </Text>
            </View>
            <View style={[styles.headerRight, !isDesktop && styles.headerRightMobile]}>
              <Text style={styles.headerDate}>{dateText}</Text>
              <Text style={styles.headerTime}>{timeText}</Text>
            </View>
          </View>
        </View>
=======
    <View style={{ flex: 1 }}>
        <ScrollView style={styles.main} contentContainerStyle={{ paddingBottom: 28 }}>
          <MedicoHeader title="Mis Pacientes" />
>>>>>>> feature-cris

        <View style={styles.kpiGrid}>
          <View style={styles.kpiCard}>
            <Text style={styles.kpiLabel}>Pacientes totales</Text>
            <Text style={[styles.kpiValue, { fontSize: fs(28) }]}>{kpis.total}</Text>
          </View>
          <View style={styles.kpiCard}>
            <Text style={styles.kpiLabel}>Con cita proxima</Text>
            <Text style={[styles.kpiValue, { fontSize: fs(28) }]}>{kpis.withUpcoming}</Text>
          </View>
          <View style={styles.kpiCard}>
            <Text style={styles.kpiLabel}>Sin cita proxima</Text>
            <Text style={[styles.kpiValue, { fontSize: fs(28) }]}>{kpis.withoutUpcoming}</Text>
          </View>
        </View>

        <View style={styles.searchWrap}>
          <MaterialIcons name="search" size={20} color={colors.muted} />
          <TextInput
            value={searchText}
            onChangeText={setSearchText}
            style={styles.searchInput}
            placeholder="Buscar por nombre o estado"
            placeholderTextColor="#8ca7bd"
          />
        </View>

        <View style={styles.sectionHead}>
          <Text style={[styles.sectionTitle, { fontSize: fs(18) }]}>Listado de pacientes</Text>
          <Text style={styles.sectionCount}>{filteredPatients.length}</Text>
        </View>

        <View style={styles.sectionCard}>
          {loadingPatients ? (
            <ActivityIndicator size="small" color={colors.primary} />
          ) : filteredPatients.length ? (
            filteredPatients.map((patient) => (
              <View key={patient.id} style={styles.patientCard}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.patientName, { fontSize: fs(16) }]}>{patient.name}</Text>
                  <Text style={styles.patientSub}>
                    Estado reciente: {patient.lastEstado || 'Pendiente'} · Total citas: {patient.totalCitas}
                  </Text>
                  <Text style={styles.patientSub}>
                    Proxima: {patient.nextDateLabel} · Ultima: {patient.lastDateLabel}
                  </Text>
                </View>
                <View style={styles.actionsRow}>
                  <TouchableOpacity
                    style={styles.secondaryAction}
                    onPress={() =>
                      navigation.navigate('MedicoChat', {
                        patientId: patient.id,
                        patientName: patient.name,
                      })
                    }
                  >
                    <Text style={styles.secondaryActionText}>Chat</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.secondaryAction}
                    onPress={() => navigation.navigate('MedicoCitas')}
                  >
                    <Text style={styles.secondaryActionText}>Agenda</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.secondaryAction}
                    onPress={() =>
                      Alert.alert(
                        patient.name,
                        `Citas totales: ${patient.totalCitas}\nCitas proximas: ${patient.upcomingCitas}\nEstado reciente: ${
                          patient.lastEstado || 'Pendiente'
                        }\nProxima cita: ${patient.nextDateLabel}\nUltima cita: ${patient.lastDateLabel}`
                      )
                    }
                  >
                    <Text style={styles.secondaryActionText}>Detalles</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))
          ) : (
            <Text style={styles.emptyText}>No se encontraron pacientes.</Text>
          )}
        </View>
        </ScrollView>
      </View>
  );
};

const styles = StyleSheet.create({
  loaderWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.bg,
    gap: 10,
  },
  loaderText: { color: colors.muted, fontSize: 13, fontWeight: '700' },
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
<<<<<<< HEAD
  main: { flex: 1 },
  headerWrap: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
=======
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
  logoWrap: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  logo: { width: 44, height: 44, resizeMode: 'contain' },
  logoTitle: { color: colors.dark, fontSize: 20, fontWeight: '800' },
  logoSub: { color: colors.muted, fontSize: 11, fontWeight: '700' },
  userCard: { alignItems: 'center', marginTop: 18, marginBottom: 10 },
  userAvatar: {
    width: 80,
    height: 80,
    borderRadius: 80,
    borderWidth: 4,
    borderColor: '#f0f4f9',
    marginBottom: 10,
  },
  userName: { color: colors.dark, fontSize: 16, fontWeight: '800', textAlign: 'center' },
  userSpec: { color: colors.muted, fontSize: 12, fontWeight: '700', textAlign: 'center', marginTop: 2 },
  menu: { marginTop: 12, gap: 6 },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
  },
  menuItemActive: { backgroundColor: 'rgba(19,127,236,0.12)' },
  menuText: { color: colors.muted, fontSize: 14, fontWeight: '700' },
  menuTextActive: { color: colors.primary, fontWeight: '800' },
  badge: {
    marginLeft: 'auto',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 999,
  },
  badgeText: { color: '#fff', fontSize: 10, fontWeight: '800' },
  logoutBtn: {
    marginTop: 16,
    backgroundColor: colors.blue,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  logoutText: { color: '#fff', fontWeight: '800' },
  main: { flex: 1, paddingHorizontal: 20 },
  headerWrap: {
    paddingTop: Platform.OS === 'web' ? 32 : 14,
    paddingBottom: 12,
>>>>>>> feature-cris
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  headerRowMobile: {
    flexDirection: 'column',
    alignItems: 'flex-start',
  },
  headerLeft: { flex: 1 },
  headerRight: { alignItems: 'flex-end' },
  headerRightMobile: { alignItems: 'flex-start', marginTop: spacing.xs },
  headerDate: { color: colors.dark, fontSize: 13, fontWeight: '800' },
  headerTime: { color: colors.muted, fontSize: 11, marginTop: 2, fontWeight: '600' },
  pageTitle: { color: colors.dark, fontWeight: '900' },
  pageSubtitle: { color: colors.muted, marginTop: 4, fontWeight: '600' },
  
  kpiGrid: {
<<<<<<< HEAD
    paddingHorizontal: spacing.md,
=======
>>>>>>> feature-cris
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  kpiCard: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#dce8f5',
    borderRadius: radii.lg,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
    flexGrow: 1,
    minWidth: 140,
    shadowColor: colors.dark,
    shadowOpacity: 0.04,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  kpiLabel: { color: colors.muted, fontSize: 11, fontWeight: '800' },
  kpiValue: { color: colors.dark, fontWeight: '900', marginTop: 2 },
  
  searchWrap: {
<<<<<<< HEAD
    marginHorizontal: spacing.md,
=======
>>>>>>> feature-cris
    backgroundColor: '#fff',
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: '#d6e4f3',
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    marginBottom: spacing.md,
  },
  searchInput: { flex: 1, color: colors.dark, fontSize: 14, fontWeight: '600', paddingVertical: 8 },
  
  sectionHead: {
<<<<<<< HEAD
    marginHorizontal: spacing.md,
    marginTop: spacing.sm,
    marginBottom: spacing.xs,
=======
    marginTop: 12,
    marginBottom: 8,
>>>>>>> feature-cris
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionTitle: { color: colors.dark, fontWeight: '900' },
  sectionCount: { color: colors.muted, fontSize: 12, fontWeight: '800' },
  
  sectionCard: {
<<<<<<< HEAD
    marginHorizontal: spacing.md,
=======
>>>>>>> feature-cris
    backgroundColor: '#fff',
    borderRadius: radii.xl,
    borderWidth: 1,
    borderColor: '#e4edf7',
    padding: spacing.sm,
    gap: spacing.sm,
    shadowColor: colors.dark,
    shadowOpacity: 0.05,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 3,
  },
  patientCard: {
    borderWidth: 1,
    borderColor: '#e8eff8',
    borderRadius: radii.lg,
    padding: spacing.sm,
    gap: spacing.xs,
  },
  patientName: { color: colors.dark, fontWeight: '900' },
  patientSub: { color: colors.muted, fontSize: 11, fontWeight: '700', marginTop: 2 },
  actionsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs, marginTop: spacing.xs },
  secondaryAction: {
    borderWidth: 1,
    borderColor: '#d6e2f0',
    backgroundColor: '#f6f9fd',
    borderRadius: radii.md,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  secondaryActionText: { color: colors.blue, fontSize: 11, fontWeight: '800' },
  emptyText: { color: colors.muted, fontSize: 13, fontWeight: '700', paddingVertical: spacing.md, textAlign: 'center' },
});

export default MedicoPacientesScreen;
