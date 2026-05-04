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
import { useAuth } from './providers/AuthProvider';
import { apiClient } from './utils/api';
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
  const { isInsidePortal } = useMedicoModule();
  const { signOut } = useAuth();
  const { sessionUser, syncProfile } = useMedicoSessionProfile();
  const { fs, rs, isDesktop, isTablet, isMobile } = useResponsive();
  
  const [user, setUser] = useState<MedicoSessionUser | null>(sessionUser);
  const [loadingUser, setLoadingUser] = useState(true);
  const [loadingPatients, setLoadingPatients] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [patients, setPatients] = useState<PatientRow[]>([]);

  useEffect(() => {
    if (sessionUser) {
      setUser(sessionUser);
      setLoadingUser(false);
    }
  }, [sessionUser]);

  const loadUser = useCallback(async () => {
    try {
      const nextUser = (await syncProfile()) as MedicoSessionUser | null;
      setUser(nextUser);
    } catch {
      setUser(null);
    } finally {
      setLoadingUser(false);
    }
  }, [syncProfile]);

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
  main: { flex: 1 },
  headerWrap: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
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
    paddingHorizontal: spacing.md,
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
    marginHorizontal: spacing.md,
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
    marginHorizontal: spacing.md,
    marginTop: spacing.sm,
    marginBottom: spacing.xs,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionTitle: { color: colors.dark, fontWeight: '900' },
  sectionCount: { color: colors.muted, fontSize: 12, fontWeight: '800' },
  
  sectionCard: {
    marginHorizontal: spacing.md,
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
