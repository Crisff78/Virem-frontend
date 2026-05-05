import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native';
import type { ImageSourcePropType } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';

import { useLanguage } from './localization/LanguageContext';
import type { DoctorRouteSnapshot, RootStackParamList } from './navigation/types';
import { usePatientPortalSession } from './hooks/usePatientPortalSession';
import { apiClient } from './utils/api';
import { resolveRemoteImageSource, sanitizeRemoteImageUrl } from './utils/imageSources';

const ViremLogo = require('./assets/imagenes/descarga.png');
const DefaultAvatar = require('./assets/imagenes/avatar-default.jpg');

const Doctor1: ImageSourcePropType = DefaultAvatar;
const Doctor2: ImageSourcePropType = DefaultAvatar;
const Doctor3: ImageSourcePropType = DefaultAvatar;

type BackendMedico = {
  medicoid?: string;
  nombreCompleto?: string;
  especialidad?: string;
  genero?: string;
  cedula?: string;
  telefono?: string;
  fotoUrl?: string | null;
};

type Doctor = {
  id: string;
  name: string;
  focus: string;
  exp: string;
  rating: string;
  reviews: string;
  city: string;
  price: string;
  tags: string[];
  availability: AvailabilityFilter[];
  image: ImageSourcePropType;
  fotoUrl?: string | null;
  availableNow?: boolean;
  verified?: boolean;
};
type AvailabilityFilter = 'today' | 'week' | 'weekend';

const normalizeText = (value: unknown) =>
  String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();

const matchesSpecialty = (doctorSpecialty: unknown, selectedSpecialty: unknown) => {
  const doctorKey = normalizeText(doctorSpecialty);
  const selectedKey = normalizeText(selectedSpecialty);
  if (!doctorKey || !selectedKey) return false;
  return doctorKey === selectedKey || doctorKey.includes(selectedKey) || selectedKey.includes(doctorKey);
};

const EspecialistasPorEspecialidadScreen: React.FC = () => {
  const { t, tx } = useLanguage();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<RouteProp<RootStackParamList, 'EspecialistasPorEspecialidad'>>();
  const { user, loadingUser, signOut, fullName, planLabel, fotoUrl } = usePatientPortalSession();
  const { width: viewportWidth } = useWindowDimensions();
  const [availabilityFilter, setAvailabilityFilter] = useState<AvailabilityFilter>('week');
  const [ratingMin, setRatingMin] = useState<'4.5' | '4.0' | null>('4.5');
  const [backendDoctors, setBackendDoctors] = useState<Doctor[]>([]);
  const [loadingDoctors, setLoadingDoctors] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const isDesktopLayout = Platform.OS === 'web' && viewportWidth >= 1024;

  const rs = (size: number) => size; // Simple responsive size mock for now

  const specialty = route.params?.specialty || 'Cardiologia';
  const doctors = useMemo(
    () => backendDoctors.filter((doctor) => matchesSpecialty(doctor.focus, specialty)),
    [backendDoctors, specialty]
  );
  const availabilityLabel =
    availabilityFilter === 'today'
      ? 'hoy mismo'
      : availabilityFilter === 'week'
        ? 'esta semana'
        : 'fines de semana';
  const displayedDoctors = useMemo(
    () =>
      doctors.filter((doctor) => {
        if (!doctor.availability.includes(availabilityFilter)) return false;
        if (!ratingMin) return true;
        const ratingValue = Number.parseFloat(String(doctor.rating || '').replace(',', '.'));
        if (!Number.isFinite(ratingValue)) return true;
        return ratingValue >= Number.parseFloat(ratingMin);
      }),
    [availabilityFilter, doctors, ratingMin]
  );
  const pageSize = 5;
  const totalPages = Math.max(1, Math.ceil(displayedDoctors.length / pageSize));
  const pagedDoctors = useMemo(() => {
    const safePage = Math.min(Math.max(1, currentPage), totalPages);
    const start = (safePage - 1) * pageSize;
    return displayedDoctors.slice(start, start + pageSize);
  }, [currentPage, displayedDoctors, totalPages]);

  useEffect(() => {
    setCurrentPage(1);
  }, [availabilityFilter, ratingMin, specialty]);

  useEffect(() => {
    const loadDoctors = async () => {
      setLoadingDoctors(true);
      try {
        const payload = await apiClient.get<any>('/api/medicos', {
          authenticated: true,
        });
        if (!(payload?.success && Array.isArray(payload?.medicos))) {
          setBackendDoctors([]);
          return;
        }

        const mapped = payload.medicos.map((item: BackendMedico, index: number) => {
          const name = String(item?.nombreCompleto || '').trim() || `Medico ${index + 1}`;
          const especialidad = String(item?.especialidad || '').trim() || 'Medicina General';
          const fotoUrl = sanitizeRemoteImageUrl(item?.fotoUrl);
          return {
            id: String(item?.medicoid || `med-${index + 1}`),
            name,
            focus: especialidad,
            exp: item?.cedula ? `Cedula: ${String(item.cedula)}` : 'Colegiado',
            rating: '--',
            reviews: '--',
            city: 'RD',
            price: 'N/D',
            tags: [especialidad, item?.telefono ? `Tel: ${String(item.telefono)}` : 'Consulta virtual'],
            availability: ['today', 'week', 'weekend'],
            image: resolveRemoteImageSource(fotoUrl, DefaultAvatar),
            fotoUrl: fotoUrl || null,
            availableNow: true,
            verified: true,
          } as Doctor;
        });
        const seen = new Set<string>();
        const deduped = mapped.filter((doc: Doctor) => {
          if (seen.has(doc.id)) return false;
          seen.add(doc.id);
          return true;
        });
        setBackendDoctors(deduped);
      } catch {
        setBackendDoctors([]);
      } finally {
        setLoadingDoctors(false);
      }
    };

    loadDoctors();
  }, []);

  const handleLogout = async () => {
    await signOut();
    navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
  };

  return (
    <View style={styles.container}>
      <ScrollView
        style={[styles.main, !isDesktopLayout && styles.mainMobile]}
        contentContainerStyle={{ paddingBottom: 30 }}
      >
        <View style={styles.header}>
          <TouchableOpacity style={{ marginRight: 14 }} onPress={() => navigation.navigate('DashboardPaciente')}>
            <MaterialIcons name="menu" size={24} color={colors.dark} />
          </TouchableOpacity>
          <View style={styles.searchBox}>
            <MaterialIcons name="search" size={20} color={colors.muted} />
            <TextInput
              placeholder="Busca un medico para consulta online"
              placeholderTextColor="#8aa7bf"
              style={styles.searchInput}
            />
          </View>
          <TouchableOpacity
            style={styles.notifBtn}
            onPress={() => navigation.navigate('PacienteNotificaciones')}
          >
            <MaterialIcons name="notifications" size={22} color={colors.dark} />
            <View style={styles.notifDot} />
          </TouchableOpacity>
        </View>

        <View style={styles.breadcrumbRow}>
          <TouchableOpacity onPress={() => navigation.navigate('DashboardPaciente')}>
            <Text style={styles.breadcrumbLink}>Inicio</Text>
          </TouchableOpacity>
          <MaterialIcons name="chevron-right" size={16} color={colors.muted} />
          <TouchableOpacity onPress={() => navigation.navigate('NuevaConsultaPaciente')}>
            <Text style={styles.breadcrumbLink}>Especialidades</Text>
          </TouchableOpacity>
          <MaterialIcons name="chevron-right" size={16} color={colors.muted} />
          <Text style={styles.breadcrumbCurrent}>{specialty}</Text>
        </View>

        <Text style={styles.pageTitle}>Seleccionar especialista en {specialty}</Text>
        <Text style={styles.pageSubtitle}>
          {loadingDoctors
            ? 'Buscando especialistas disponibles...'
            : `Encontramos ${displayedDoctors.length} medicos disponibles para atenderte.`}
        </Text>

        <View style={[styles.layoutRow, !isDesktopLayout && styles.layoutRowMobile]}>
          <View style={[styles.filtersCol, !isDesktopLayout && styles.filtersColMobile]}>
            <View style={styles.filtersCard}>
              <View style={styles.filtersHeader}>
                <Text style={styles.filtersTitle}>Filtros</Text>
                <TouchableOpacity
                  onPress={() => {
                    setAvailabilityFilter('today');
                    setRatingMin('4.5');
                  }}
                >
                  <Text style={styles.clearText}>Limpiar</Text>
                </TouchableOpacity>
              </View>

              <Text style={styles.filterLabel}>Disponibilidad</Text>
              <TouchableOpacity style={styles.optionRow} onPress={() => setAvailabilityFilter('today')}>
                <View style={[styles.checkBox, availabilityFilter === 'today' && styles.checkBoxActive]} />
                <Text style={styles.optionText}>Hoy mismo</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.optionRow} onPress={() => setAvailabilityFilter('week')}>
                <View style={[styles.checkBox, availabilityFilter === 'week' && styles.checkBoxActive]} />
                <Text style={styles.optionText}>Esta semana</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.optionRow} onPress={() => setAvailabilityFilter('weekend')}>
                <View style={[styles.checkBox, availabilityFilter === 'weekend' && styles.checkBoxActive]} />
                <Text style={styles.optionText}>Fines de semana</Text>
              </TouchableOpacity>

              <Text style={[styles.filterLabel, { marginTop: 16 }]}>Valoracion</Text>
              <TouchableOpacity style={styles.optionRow} onPress={() => setRatingMin('4.5')}>
                <View style={[styles.radio, ratingMin === '4.5' && styles.radioActive]} />
                <Text style={styles.optionText}>4.5 +</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.optionRow} onPress={() => setRatingMin('4.0')}>
                <View style={[styles.radio, ratingMin === '4.0' && styles.radioActive]} />
                <Text style={styles.optionText}>4.0 +</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.resultsCol}>
            <View style={styles.resultsHeadCard}>
              <Text style={styles.resultsText}>
                Mostrando resultados para <Text style={styles.resultsStrong}>{specialty}</Text>
              </Text>
              <Text style={styles.orderText}>
                {loadingDoctors ? 'Sincronizando especialistas...' : 'Fuente: Base de datos real'}
              </Text>
            </View>

            {displayedDoctors.length === 0 ? (
              <View style={styles.emptyCard}>
                <MaterialIcons name="event-busy" size={36} color={colors.muted} />
                <Text style={styles.emptyTitle}>No hay especialistas disponibles</Text>
                <Text style={styles.emptySub}>
                  No encontramos disponibilidad para {availabilityLabel} en esta especialidad.
                </Text>
              </View>
            ) : (
              pagedDoctors.map((doc) => (
                <View key={doc.id} style={[styles.docCard, !isDesktopLayout && styles.docCardMobile]}>
                  <View style={[styles.docLeft, !isDesktopLayout && styles.docLeftMobile]}>
                    <View style={styles.docImageWrap}>
                      <Image source={doc.image} style={styles.docImage} />
                      {doc.availableNow ? <View style={styles.docOnlineDot} /> : null}
                    </View>

                    <View style={{ flex: 1 }}>
                      <View style={styles.docNameRow}>
                        <Text style={styles.docName}>{doc.name}</Text>
                        {doc.verified ? (
                          <MaterialIcons name="verified" size={16} color={colors.primary} />
                        ) : null}
                      </View>
                      <Text style={styles.docFocus}>{doc.focus}</Text>
                      <View style={styles.docMetaRow}>
                        <Text style={styles.docMeta}>{doc.exp}</Text>
                        <Text style={styles.docMeta}> {doc.rating} ({doc.reviews})</Text>
                        <Text style={styles.docMeta}> {doc.city}</Text>
                      </View>
                      <View style={styles.tagsRow}>
                        {doc.tags.map((tag) => (
                          <View key={tag} style={styles.tag}>
                            <Text style={styles.tagText}>{tag}</Text>
                          </View>
                        ))}
                      </View>
                    </View>
                  </View>

                  <View style={[styles.docRight, !isDesktopLayout && styles.docRightMobile]}>
                    <Text style={styles.priceLabel}>Consulta desde</Text>
                    <Text style={styles.priceValue}>${doc.price}</Text>
                    <TouchableOpacity
                      style={styles.bookBtn}
                      onPress={() => {
                        const doctorSnapshot: DoctorRouteSnapshot = {
                          name: doc.name,
                          focus: doc.focus,
                          exp: doc.exp,
                          rating: doc.rating,
                          reviews: doc.reviews,
                          city: doc.city,
                          price: doc.price,
                          tags: Array.isArray(doc.tags) ? doc.tags : [],
                          fotoUrl: doc.fotoUrl || null,
                        };
                        navigation.navigate('PerfilEspecialistaAgendar', {
                          specialty,
                          doctorId: doc.id,
                          doctorSnapshot,
                        });
                      }}
                    >
                      <Text style={styles.bookBtnText}>Ver Perfil y Agendar</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))
            )}

            <View style={styles.paginationRow}>
              <TouchableOpacity
                style={styles.pageBtn}
                onPress={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
              >
                <MaterialIcons name="chevron-left" size={16} color={colors.muted} />
              </TouchableOpacity>
              {Array.from({ length: totalPages }, (_, idx) => idx + 1).map((page) => (
                <TouchableOpacity
                  key={page}
                  style={[styles.pageBtn, currentPage === page ? styles.pageBtnActive : null]}
                  onPress={() => setCurrentPage(page)}
                >
                  <Text style={currentPage === page ? styles.pageBtnActiveText : styles.pageBtnText}>
                    {page}
                  </Text>
                </TouchableOpacity>
              ))}
              <TouchableOpacity
                style={styles.pageBtn}
                onPress={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                disabled={currentPage >= totalPages}
              >
                <MaterialIcons name="chevron-right" size={16} color={colors.muted} />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

const colors = {
  primary: '#137fec',
  bg: '#F6FAFD',
  dark: '#0A1931',
  blue: '#1A3D63',
  muted: '#4A7FA7',
  light: '#B3CFE5',
  white: '#FFFFFF',
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  main: {
    flex: 1,
    paddingHorizontal: Platform.OS === 'web' ? 26 : 14,
    paddingTop: Platform.OS === 'web' ? 18 : 12,
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
    marginBottom: 14,
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

  breadcrumbRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 2 },
  breadcrumbLink: { color: colors.muted, fontSize: 12, fontWeight: '700' },
  breadcrumbCurrent: { color: colors.primary, fontSize: 12, fontWeight: '800' },
  pageTitle: { color: colors.dark, fontSize: 28, fontWeight: '900', marginTop: 12 },
  pageSubtitle: {
    color: colors.muted,
    fontWeight: '600',
    fontSize: 14,
    marginTop: 2,
    marginBottom: 16,
  },

  layoutRow: { flexDirection: 'row', gap: 16, alignItems: 'flex-start' },
  layoutRowMobile: { flexDirection: 'column' },
  filtersCol: { width: 240 },
  filtersColMobile: { width: '100%' },
  resultsCol: { flex: 1 },

  filtersCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e4edf6',
    padding: 14,
  },
  filtersHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  filtersTitle: { color: colors.dark, fontSize: 16, fontWeight: '900' },
  clearText: { color: colors.primary, fontSize: 12, fontWeight: '800' },
  filterLabel: { color: colors.dark, fontSize: 13, fontWeight: '800', marginBottom: 8 },
  optionRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  optionText: { color: colors.muted, fontSize: 13, fontWeight: '700' },
  checkBox: {
    width: 15,
    height: 15,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#b8d0e4',
    backgroundColor: '#fff',
  },
  checkBoxActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  radio: {
    width: 15,
    height: 15,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: '#b8d0e4',
    backgroundColor: '#fff',
  },
  radioActive: { backgroundColor: colors.primary, borderColor: colors.primary },

  resultsHeadCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e4edf6',
    paddingVertical: 12,
    paddingHorizontal: 14,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  resultsText: { color: colors.muted, fontSize: 12, fontWeight: '700' },
  resultsStrong: { color: colors.dark, fontWeight: '900' },
  orderText: { color: colors.muted, fontSize: 12, fontWeight: '700' },

  docCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e4edf6',
    padding: 12,
    marginBottom: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  docCardMobile: {
    flexDirection: 'column',
  },
  docLeft: { flexDirection: 'row', gap: 12, flex: 1 },
  docLeftMobile: {
    flexDirection: 'column',
  },
  docImageWrap: { width: 92, height: 92 },
  docImage: { width: '100%', height: '100%', borderRadius: 12 },
  docOnlineDot: {
    position: 'absolute',
    right: -2,
    bottom: -2,
    width: 14,
    height: 14,
    borderRadius: 14,
    backgroundColor: '#22c55e',
    borderWidth: 2,
    borderColor: '#fff',
  },
  docNameRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 2 },
  docName: { color: colors.dark, fontSize: 18, fontWeight: '900' },
  docFocus: { color: colors.blue, fontWeight: '700', marginBottom: 6 },
  docMetaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 8 },
  docMeta: { color: colors.muted, fontSize: 11, fontWeight: '700' },
  tagsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  tag: { backgroundColor: '#edf4fb', borderRadius: 999, paddingHorizontal: 8, paddingVertical: 4 },
  tagText: { color: colors.blue, fontSize: 10, fontWeight: '700' },

  docRight: { width: 160, alignItems: 'flex-end', justifyContent: 'space-between' },
  docRightMobile: {
    width: '100%',
    alignItems: 'flex-start',
    gap: 10,
  },
  priceLabel: {
    color: colors.muted,
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  priceValue: { color: colors.blue, fontSize: 28, fontWeight: '900', marginTop: 2 },
  bookBtn: {
    backgroundColor: colors.blue,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 9,
    marginTop: 8,
  },
  bookBtnText: { color: '#fff', fontWeight: '800', fontSize: 12 },

  paginationRow: { flexDirection: 'row', justifyContent: 'center', gap: 8, marginTop: 10 },
  pageBtn: {
    width: 34,
    height: 34,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#d9e6f2',
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pageBtnActive: { backgroundColor: colors.blue, borderColor: colors.blue },
  pageBtnText: { color: colors.dark, fontWeight: '700', fontSize: 12 },
  pageBtnActiveText: { color: '#fff', fontWeight: '900', fontSize: 12 },
  emptyCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e4edf6',
    paddingVertical: 30,
    paddingHorizontal: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  emptyTitle: {
    marginTop: 10,
    color: colors.dark,
    fontSize: 18,
    fontWeight: '900',
    textAlign: 'center',
  },
  emptySub: {
    marginTop: 6,
    color: colors.muted,
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
  },
});

export default EspecialistasPorEspecialidadScreen;
