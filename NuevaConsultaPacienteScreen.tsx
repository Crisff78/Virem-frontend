import React, { useEffect, useMemo, useState } from 'react';
import {
  Image,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native';
import type { ImageSourcePropType } from 'react-native';
import { usePortalAwareNavigation } from './navigation/usePortalAwareNavigation';
import { usePacienteModule } from './navigation/PacienteModuleContext';
import { MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth } from './providers/AuthProvider';
import { apiClient } from './utils/api';

import { useLanguage } from './localization/LanguageContext';
import { usePatientSessionProfile, type PatientSessionUser } from './hooks/usePatientSessionProfile';
import { ensurePatientSessionUser, getPatientDisplayName } from './utils/patientSession';
import { useResponsive } from './hooks/useResponsive';
import PacienteSidebar from './components/PacienteSidebar';

const DefaultAvatar = require('./assets/imagenes/avatar-default.jpg');

type User = PatientSessionUser;

type SpecialtyItem = {
  icon: React.ComponentProps<typeof MaterialCommunityIcons>['name'];
  label: string;
  description: string;
  totalMedicos: number;
};

type SpecialtyCardProps = {
  icon: React.ComponentProps<typeof MaterialCommunityIcons>['name'];
  label: string;
  description: string;
  onPress: () => void;
};

const normalizeText = (value: unknown) =>
  String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();

const FALLBACK_SPECIALTIES: SpecialtyItem[] = [
  { icon: 'heart-outline', label: 'Cardiologia', description: 'Corazon y sistema circulatorio', totalMedicos: 0 },
  { icon: 'baby-face-outline', label: 'Pediatria', description: 'Atencion integral para niños', totalMedicos: 0 },
  { icon: 'brain', label: 'Neurologia', description: 'Cerebro y sistema nervioso', totalMedicos: 0 },
  { icon: 'face-man-outline', label: 'Dermatologia', description: 'Cuidado de la piel y cabello', totalMedicos: 0 },
  { icon: 'stethoscope', label: 'Medicina General', description: 'Atencion primaria inicial', totalMedicos: 0 },
  { icon: 'eye-outline', label: 'Oftalmologia', description: 'Salud visual y ocular', totalMedicos: 0 },
  { icon: 'food-apple-outline', label: 'Nutricion', description: 'Dieta y bienestar alimenticio', totalMedicos: 0 },
  { icon: 'pill', label: 'Endocrinologia', description: 'Hormonas y metabolismo', totalMedicos: 0 },
];

const getSpecialtyIcon = (specialtyName: string): React.ComponentProps<typeof MaterialCommunityIcons>['name'] => {
  const key = normalizeText(specialtyName);
  if (key.includes('cardio')) return 'heart-outline';
  if (key.includes('pedia')) return 'baby-face-outline';
  if (key.includes('neuro')) return 'brain';
  if (key.includes('derma')) return 'face-man-outline';
  if (key.includes('general')) return 'stethoscope';
  if (key.includes('oftal')) return 'eye-outline';
  if (key.includes('nutri')) return 'food-apple-outline';
  if (key.includes('endo')) return 'pill';
  if (key.includes('psico')) return 'head-cog-outline';
  if (key.includes('gine')) return 'human-female';
  if (key.includes('odonto')) return 'tooth-outline';
  return 'stethoscope';
};

const getSpecialtyDescription = (specialtyName: string, totalMedicos: number) => {
  const key = normalizeText(specialtyName);
  if (key.includes('cardio')) return 'Corazon y sistema circulatorio';
  if (key.includes('pedia')) return 'Atencion integral para niños';
  if (key.includes('neuro')) return 'Cerebro y sistema nervioso';
  if (key.includes('derma')) return 'Cuidado de la piel y cabello';
  if (key.includes('general')) return 'Atencion primaria inicial';
  if (key.includes('oftal')) return 'Salud visual y ocular';
  if (key.includes('nutri')) return 'Dieta y bienestar alimenticio';
  if (key.includes('endo')) return 'Hormonas y metabolismo';
  if (key.includes('psico')) return 'Salud mental y emocional';
  if (key.includes('gine')) return 'Salud femenina y reproductiva';
  if (key.includes('odonto')) return 'Salud oral y dental';
  if (totalMedicos > 0) return `${totalMedicos} medico(s) disponible(s)`;
  return 'Consulta medica especializada';
};

const SpecialtyCard: React.FC<SpecialtyCardProps> = ({ icon, label, description, onPress }) => {
  const [hovered, setHovered] = useState(false);

  return (
    <Pressable
      onPress={onPress}
      onHoverIn={() => setHovered(true)}
      onHoverOut={() => setHovered(false)}
      style={({ pressed }) => [
        styles.specialtyCard,
        hovered && styles.specialtyCardHover,
        pressed && styles.specialtyCardPressed,
      ]}
    >
      <View style={[styles.specialtyIconBox, hovered && styles.specialtyIconBoxHover]}>
        <MaterialCommunityIcons
          name={icon}
          size={28}
          color={hovered ? colors.white : colors.blue}
        />
      </View>
      <Text style={[styles.specialtyTitle, hovered && styles.specialtyTitleHover]}>{label}</Text>
      <Text style={styles.specialtyDescription}>{description}</Text>
    </Pressable>
  );
};

const NuevaConsultaPacienteScreen: React.FC = () => {
  const { tx } = useLanguage();
  const navigation = usePortalAwareNavigation();
  const { isInsidePortal, isSidebarOpen, toggleSidebar, setNotificationsOpen } = usePacienteModule();
  const { isDesktop: isDesktopLayout, isTablet: isTabletLayout } = useResponsive();
  const { signOut } = useAuth();
  const { sessionUser, syncProfile } = usePatientSessionProfile();
  const { width: viewportWidth } = useWindowDimensions();
  
  const [user, setUser] = useState<User | null>(() => (ensurePatientSessionUser(sessionUser) as User | null) || null);
  const [loadingUser, setLoadingUser] = useState(true);
  const [searchText, setSearchText] = useState('');
  const [specialtyList, setSpecialtyList] = useState<SpecialtyItem[]>(FALLBACK_SPECIALTIES);
  const [loadingSpecialties, setLoadingSpecialties] = useState(false);
  const [showAllSpecialties, setShowAllSpecialties] = useState(false);

  useEffect(() => {
    if (sessionUser) {
      setUser((ensurePatientSessionUser(sessionUser) as User | null) || null);
      setLoadingUser(false);
    }
  }, [sessionUser]);

  useEffect(() => {
    const loadUser = async () => {
      try {
        const nextSessionUser = (await syncProfile()) as User | null;
        setUser((ensurePatientSessionUser(nextSessionUser) as User | null) || null);
      } catch {
        setUser(null);
      } finally {
        setLoadingUser(false);
      }
    };
    loadUser();
  }, [syncProfile]);

  useEffect(() => {
    const loadSpecialties = async () => {
      setLoadingSpecialties(true);
      try {
        const byCatalogPayload = await apiClient.get<any>('/api/medicos/especialidades', {
          authenticated: true,
        });
        if (byCatalogPayload?.success && Array.isArray(byCatalogPayload?.especialidades)) {
          const items: SpecialtyItem[] = byCatalogPayload.especialidades
            .map((item: any) => {
              const name = String(item?.nombre || '').trim();
              const total = Number(item?.totalMedicos || 0);
              if (!name) return null;
              return {
                icon: getSpecialtyIcon(name),
                label: name,
                description: getSpecialtyDescription(name, total),
                totalMedicos: Number.isFinite(total) ? total : 0,
              } as SpecialtyItem;
            })
            .filter((item: any): item is SpecialtyItem => Boolean(item))
            .sort((a: any, b: any) => b.totalMedicos - a.totalMedicos || a.label.localeCompare(b.label, 'es'));

          if (items.length) {
            setSpecialtyList(items);
            return;
          }
        }
        setSpecialtyList(FALLBACK_SPECIALTIES);
      } catch {
        setSpecialtyList(FALLBACK_SPECIALTIES);
      } finally {
        setLoadingSpecialties(false);
      }
    };
    loadSpecialties();
  }, []);

  const filteredSpecialties = useMemo(() => {
    const query = normalizeText(searchText);
    if (!query) return specialtyList;
    return specialtyList.filter((item) => {
      return (
        normalizeText(item.label).includes(query) ||
        normalizeText(item.description).includes(query)
      );
    });
  }, [searchText, specialtyList]);

  const displayedSpecialties = useMemo(() => {
    if (searchText.trim().length > 0) return filteredSpecialties;
    return showAllSpecialties ? filteredSpecialties : filteredSpecialties.slice(0, 4);
  }, [filteredSpecialties, searchText, showAllSpecialties]);

  const onSelectSpecialty = (label: string) => {
    navigation.navigate('EspecialistasPorEspecialidad', { specialty: label });
  };

  const specialtyColumnStyle = isDesktopLayout
    ? styles.specialtyColumnDesktop
    : isTabletLayout
      ? styles.specialtyColumnTablet
      : styles.specialtyColumnMobile;

  return (
    <View style={[styles.container, !isInsidePortal && isDesktopLayout && { flexDirection: 'row' }]}>
      {!isInsidePortal && (
        <PacienteSidebar
          isMobileMenuOpen={isSidebarOpen}
          onToggleMobileMenu={toggleSidebar}
          onCloseMobileMenu={toggleSidebar}
        />
      )}
      <View style={{ flex: 1 }}>
        <View style={[styles.header, !isDesktopLayout && styles.headerMobile]}>
          <TouchableOpacity 
            style={styles.hamburgerBtn} 
            onPress={toggleSidebar}
          >
            <MaterialIcons name="menu" size={26} color={colors.dark} />
          </TouchableOpacity>

          <View style={styles.searchBox}>
            <MaterialIcons name="search" size={20} color={colors.muted} />
            <TextInput
              placeholder="Busca un médico..."
              placeholderTextColor="#8aa7bf"
              style={styles.searchInput}
              value={searchText}
              onChangeText={setSearchText}
            />
          </View>

          <TouchableOpacity
            style={styles.notifBtn}
            onPress={() => setNotificationsOpen(true)}
          >
            <MaterialIcons name="notifications" size={22} color={colors.dark} />
            <View style={styles.notifDot} />
          </TouchableOpacity>
        </View>

        <ScrollView
          style={[styles.main, !isDesktopLayout && styles.mainMobile]}
          contentContainerStyle={{ paddingBottom: 30 }}
        >
          <View style={styles.centerHeader}>
            <Text style={styles.pageTitle}>
              {tx({
                es: 'Solicitar Nueva Consulta',
                en: 'Request New Consultation',
                pt: 'Solicitar Nova Consulta',
              })}
            </Text>
            <Text style={styles.pageSubtitle}>
              ¿En qué podemos ayudarte hoy? Selecciona una especialidad para comenzar.
            </Text>
          </View>

          <View style={styles.quickSearchRow}>
            <Text style={styles.quickSearchLabel}>Populares:</Text>
            {specialtyList.slice(0, 3).map((item) => (
              <TouchableOpacity key={item.label} onPress={() => setSearchText(item.label)}>
                <Text style={styles.quickSearchItem}>{item.label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Especialidades Médicas</Text>
            <Text style={styles.sectionLink}>
              {loadingSpecialties ? 'Actualizando...' : `${specialtyList.length} disponibles`}
            </Text>
          </View>

          <View style={styles.specialtiesGrid}>
            {displayedSpecialties.map((item) => (
              <View key={item.label} style={specialtyColumnStyle}>
                <SpecialtyCard
                  icon={item.icon}
                  label={item.label}
                  description={item.description}
                  onPress={() => onSelectSpecialty(item.label)}
                />
                <Text style={styles.specialtyCountText}>
                  {item.totalMedicos > 0
                    ? `${item.totalMedicos} médicos`
                    : 'Disponible'}
                </Text>
              </View>
            ))}
            
            {!displayedSpecialties.length ? (
              <View style={styles.emptySpecialtyWrap}>
                <Text style={styles.emptySpecialtyText}>
                  No se encontraron resultados para "{searchText.trim()}".
                </Text>
              </View>
            ) : null}
          </View>

          {!searchText.trim() && specialtyList.length > 4 && (
            <TouchableOpacity 
              style={styles.showMoreBtn} 
              onPress={() => setShowAllSpecialties(!showAllSpecialties)}
            >
              <Text style={styles.showMoreText}>
                {showAllSpecialties ? 'Ver menos' : `Ver todas (${specialtyList.length})`}
              </Text>
              <MaterialIcons 
                name={showAllSpecialties ? "keyboard-arrow-up" : "keyboard-arrow-down"} 
                size={20} 
                color={colors.primary} 
              />
            </TouchableOpacity>
          )}

          <View style={styles.expressCard}>
            <View style={styles.expressLeft}>
              <View style={styles.expressIconWrap}>
                <MaterialIcons name="emergency" size={24} color="#fff" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.expressTitle}>¿Atención inmediata?</Text>
                <Text style={styles.expressSubtitle}>
                  Médicos de guardia 24/7 para videoconsultas de urgencia.
                </Text>
              </View>
            </View>

            <TouchableOpacity
              style={styles.expressBtn}
              onPress={() =>
                navigation.navigate('EspecialistasPorEspecialidad', { specialty: 'Medicina General' })
              }
            >
              <MaterialIcons name="bolt" size={18} color="#fff" />
              <Text style={styles.expressBtnText}>Consulta Express</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>
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
  header: {
    height: 70,
    backgroundColor: colors.white,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#eef2f7',
    gap: 15,
  },
  headerMobile: {
    height: 60,
    paddingHorizontal: 15,
  },
  hamburgerBtn: {
    padding: 5,
  },
  searchBox: {
    flex: 1,
    height: 42,
    backgroundColor: '#f1f5f9',
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: colors.dark,
    fontWeight: '500',
  },
  notifBtn: {
    position: 'relative',
    padding: 5,
  },
  notifDot: {
    position: 'absolute',
    top: 5,
    right: 5,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#ef4444',
    borderWidth: 1.5,
    borderColor: colors.white,
  },
  main: {
    flex: 1,
    paddingHorizontal: 25,
  },
  mainMobile: {
    paddingHorizontal: 15,
  },
  centerHeader: {
    alignItems: 'center',
    marginTop: 30,
    marginBottom: 25,
  },
  pageTitle: {
    fontSize: 26,
    fontWeight: '900',
    color: colors.dark,
    textAlign: 'center',
  },
  pageSubtitle: {
    fontSize: 14,
    color: colors.muted,
    textAlign: 'center',
    marginTop: 8,
    maxWidth: 500,
    lineHeight: 20,
    fontWeight: '500',
  },
  quickSearchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 25,
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  quickSearchLabel: {
    fontSize: 13,
    color: colors.muted,
    fontWeight: '700',
  },
  quickSearchItem: {
    fontSize: 13,
    color: colors.primary,
    fontWeight: '800',
    backgroundColor: 'rgba(19,127,236,0.08)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: colors.dark,
  },
  sectionLink: {
    fontSize: 13,
    color: colors.muted,
    fontWeight: '700',
  },
  specialtiesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -8,
  },
  specialtyColumnDesktop: {
    width: '25%',
    padding: 8,
  },
  specialtyColumnTablet: {
    width: '33.33%',
    padding: 8,
  },
  specialtyColumnMobile: {
    width: '50%',
    padding: 8,
  },
  specialtyCard: {
    backgroundColor: colors.white,
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: '#eef2f7',
    alignItems: 'center',
    minHeight: 160,
    justifyContent: 'center',
  },
  specialtyCardHover: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  specialtyCardPressed: {
    transform: [{ scale: 0.98 }],
  },
  specialtyIconBox: {
    width: 54,
    height: 54,
    borderRadius: 16,
    backgroundColor: 'rgba(19,127,236,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  specialtyIconBoxHover: {
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  specialtyTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.dark,
    textAlign: 'center',
    marginBottom: 4,
  },
  specialtyTitleHover: {
    color: colors.white,
  },
  specialtyDescription: {
    fontSize: 11,
    color: colors.muted,
    textAlign: 'center',
    lineHeight: 14,
    fontWeight: '500',
  },
  specialtyCountText: {
    fontSize: 11,
    color: colors.muted,
    textAlign: 'center',
    marginTop: 6,
    fontWeight: '700',
  },
  showMoreBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 15,
    gap: 5,
    paddingVertical: 10,
  },
  showMoreText: {
    color: colors.primary,
    fontWeight: '800',
    fontSize: 14,
  },
  expressCard: {
    marginTop: 30,
    backgroundColor: colors.blue,
    borderRadius: 20,
    padding: 20,
    flexDirection: Platform.OS === 'web' ? 'row' : 'column',
    alignItems: 'center',
    gap: 15,
  },
  expressLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 15,
  },
  expressIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  expressTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.white,
  },
  expressSubtitle: {
    fontSize: 12,
    color: colors.light,
    marginTop: 2,
    lineHeight: 16,
  },
  expressBtn: {
    backgroundColor: colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  expressBtnText: {
    color: colors.white,
    fontWeight: '800',
    fontSize: 13,
  },
  emptySpecialtyWrap: {
    width: '100%',
    padding: 40,
    alignItems: 'center',
  },
  emptySpecialtyText: {
    color: colors.muted,
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
});

export default NuevaConsultaPacienteScreen;
