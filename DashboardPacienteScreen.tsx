import React, { useCallback, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
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

  const handleLogout = useCallback(async () => {
    await signOut();
    navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
  }, [navigation, signOut]);

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
});
