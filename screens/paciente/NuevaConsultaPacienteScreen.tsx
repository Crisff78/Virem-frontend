import React, { useEffect, useMemo, useState } from 'react';
import { sanitizeRemoteImageUrl, resolveRemoteImageSource } from '../../utils/imageSources';
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
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { usePortalAwareNavigation } from '../../navigation/usePortalAwareNavigation';
import { usePacienteModule } from '../../navigation/PacienteModuleContext';
import { MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import type { RootStackParamList } from '../../navigation/types';
import { useAuth } from '../../providers/AuthProvider';
import { apiClient } from '../../utils/api';

import { useLanguage } from '../../localization/LanguageContext';
import { usePatientSessionProfile, type PatientSessionUser } from '../../hooks/usePatientSessionProfile';
import { ensurePatientSessionUser, getPatientDisplayName } from '../../utils/patientSession';

const ViremLogo = require('../../assets/imagenes/descarga.png');
const DefaultAvatar = require('../../assets/imagenes/avatar-default.jpg');

type User = PatientSessionUser;

type SpecialtyItem = {
  icon: string;
  label: string;
  description: string;
  totalMedicos: number;
};

type SpecialtyCardProps = {
  icon: string;
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

const getSpecialtyIcon = (specialtyName: string) => {
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

const SpecialtyCard: React.FC<SpecialtyCardProps> = ({ icon, label, description, onPress }) => (
  <SpecialtyCardInner icon={icon} label={label} description={description} onPress={onPress} />
);

const SpecialtyCardInner: React.FC<SpecialtyCardProps> = ({
  icon,
  label,
  description,
  onPress,
}) => {
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
          name={icon as any}
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

  const { t, tx } = useLanguage();
  const navigation = usePortalAwareNavigation();
  const { isInsidePortal, setNotificationsOpen } = usePacienteModule();
  const { signOut } = useAuth();
  const { sessionUser, syncProfile } = usePatientSessionProfile();
  const { width: viewportWidth } = useWindowDimensions();
  const [user, setUser] = useState<User | null>(() => (ensurePatientSessionUser(sessionUser) as User | null) || null);
  const [loadingUser, setLoadingUser] = useState(true);
  const [searchText, setSearchText] = useState('');
  const [specialtyList, setSpecialtyList] = useState<SpecialtyItem[]>(FALLBACK_SPECIALTIES);
  const [loadingSpecialties, setLoadingSpecialties] = useState(false);
  const isDesktopLayout = Platform.OS === 'web' && viewportWidth >= 1024;
  const isTabletLayout = viewportWidth >= 720;
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
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
        if (
          byCatalogPayload?.success &&
          Array.isArray(byCatalogPayload?.especialidades)
        ) {
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
            .filter((item: SpecialtyItem | null): item is SpecialtyItem => Boolean(item))
            .sort((a: SpecialtyItem, b: SpecialtyItem) => b.totalMedicos - a.totalMedicos || a.label.localeCompare(b.label, 'es'));

          if (items.length) {
            setSpecialtyList(items);
            return;
          }
        }

        const byMedicosPayload = await apiClient.get<any>('/api/medicos', {
          authenticated: true,
        });
        if (byMedicosPayload?.success && Array.isArray(byMedicosPayload?.medicos)) {
          const counts = new Map<string, number>();
          for (const medico of byMedicosPayload.medicos) {
            const name = String(medico?.especialidad || 'Medicina General').trim() || 'Medicina General';
            counts.set(name, (counts.get(name) || 0) + 1);
          }

          const items = Array.from(counts.entries())
            .map(([name, total]) => ({
              icon: getSpecialtyIcon(name),
              label: name,
              description: getSpecialtyDescription(name, total),
              totalMedicos: total,
            }))
            .sort((a, b) => b.totalMedicos - a.totalMedicos || a.label.localeCompare(b.label, 'es'));

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

  const fullName = useMemo(() => getPatientDisplayName(user, 'Paciente'), [user]);

  const planLabel = useMemo(() => {
    const plan = (user?.plan || '').trim();
    return plan ? `Paciente ${plan}` : 'Paciente';
  }, [user]);

  const userAvatarSource: ImageSourcePropType = useMemo(() => {
    return resolveRemoteImageSource(user?.fotoUrl, DefaultAvatar);
  }, [user]);

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

  const handleLogout = async () => {
    await signOut();
    navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
  };

  const onSelectSpecialty = (label: string) => {
    navigation.navigate('EspecialistasPorEspecialidad', { specialty: label });
  };

  const specialtyColumnStyle = isDesktopLayout
    ? styles.specialtyColumnDesktop
    : isTabletLayout
      ? styles.specialtyColumnTablet
      : styles.specialtyColumnMobile;

  const closeMobileMenu = () => setIsMobileMenuOpen(false);

  return (
    <View style={[styles.container, isInsidePortal ? null : (isDesktopLayout && styles.containerDesktop)]}>
      {!isInsidePortal && !isDesktopLayout && (
        <View style={styles.mobileMenuBar}>
          <TouchableOpacity 
            style={styles.mobileMenuButton} 
            onPress={() => setIsMobileMenuOpen(true)}
          >
            <MaterialIcons name="menu" size={22} color={colors.dark} />
            <Text style={styles.mobileMenuButtonText}>Menú</Text>
          </TouchableOpacity>
        </View>
      )}

      {isMobileMenuOpen && (
        <TouchableOpacity 
          activeOpacity={1} 
          style={styles.overlay} 
          onPress={closeMobileMenu} 
        />
      )}

      {!isInsidePortal && (isDesktopLayout || isMobileMenuOpen) && (
      <View style={[styles.sidebar, isDesktopLayout ? styles.sidebarDesktop : styles.sidebarMobile]}>
        <View>
          <View style={styles.logoBox}>
            <Image source={ViremLogo} style={styles.logo} />
            <View style={{ flex: 1 }}>
              <Text style={styles.logoTitle}>VIREM</Text>
              <Text style={styles.logoSubtitle}>Portal Paciente</Text>
            </View>
            {!isDesktopLayout && (
              <TouchableOpacity onPress={closeMobileMenu} style={styles.closeMenuBtn}>
                <MaterialIcons name="close" size={24} color={colors.dark} />
              </TouchableOpacity>
            )}
          </View>

          <View style={styles.userBox}>
            <Image source={userAvatarSource} style={styles.userAvatar} />
            <Text style={styles.userName}>{fullName}</Text>
            <Text style={styles.userPlan}>{planLabel}</Text>
          </View>

          <View style={[styles.menu, isDesktopLayout ? styles.menuDesktop : styles.menuMobile]}>
            <TouchableOpacity
              style={styles.menuItemRow}
              onPress={() => navigation.navigate('DashboardPaciente')}
            >
              <MaterialIcons name="grid-view" size={20} color={colors.muted} />
              <Text style={styles.menuText}>{t('menu.home')}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.menuItemRow, styles.menuItemActive]}
              onPress={() => navigation.navigate('NuevaConsultaPaciente')}
            >
              <MaterialIcons name="person-search" size={20} color={colors.primary} />
              <Text style={[styles.menuText, styles.menuTextActive]}>{t('menu.searchDoctor')}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.menuItemRow}
              onPress={() => navigation.navigate('PacienteCitas')}
            >
              <MaterialIcons name="calendar-today" size={20} color={colors.muted} />
              <Text style={styles.menuText}>{t('menu.appointments')}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.menuItemRow}
              onPress={() => navigation.navigate('PacienteChat')}
            >
              <MaterialIcons name="chat-bubble" size={20} color={colors.muted} />
              <Text style={styles.menuText}>{t('menu.chat')}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.menuItemRow}
              onPress={() => navigation.navigate('PacientePerfil')}
            >
              <MaterialIcons name="account-circle" size={20} color={colors.muted} />
              <Text style={styles.menuText}>{t('menu.profile')}</Text>
            </TouchableOpacity>
          </View>
        </View>

        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <MaterialIcons name="logout" size={20} color="#fff" />
          <Text style={styles.logoutText}>{t('menu.logout')}</Text>
        </TouchableOpacity>
      </View>
      )}

      <ScrollView
        style={[styles.main, !isDesktopLayout && styles.mainMobile]}
        contentContainerStyle={{ paddingBottom: 30 }}
      >
        <View style={styles.header}>
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
            onPress={() => setNotificationsOpen(true)}
          >
            <MaterialIcons name="notifications" size={22} color={colors.dark} />
            <View style={styles.notifDot} />
          </TouchableOpacity>
        </View>


        <View style={styles.centerHeader}>
          <Text style={styles.pageTitle}>
            {tx({
              es: 'Solicitar Nueva Consulta',
              en: 'Request New Consultation',
              pt: 'Solicitar Nova Consulta',
            })}
          </Text>
          <Text style={styles.pageSubtitle}>
            En que podemos ayudarte hoy? Selecciona una especialidad real para comenzar.
          </Text>
        </View>

        <View style={styles.searchWrap}>
          <MaterialIcons name="search" size={19} color={colors.muted} />
          <TextInput
            value={searchText}
            onChangeText={setSearchText}
            style={styles.searchField}
            placeholder="Busca sintomas (ej. dolor de cabeza), especialidades o doctores"
            placeholderTextColor="#8ca7bd"
          />
        </View>

        <View style={styles.quickSearchRow}>
          <Text style={styles.quickSearchLabel}>Especialidades con mas medicos:</Text>
          {specialtyList.slice(0, 3).map((item) => (
            <Text key={item.label} style={styles.quickSearchItem}>
              {item.label}
            </Text>
          ))}
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Especialidades Médicas</Text>
          <TouchableOpacity onPress={() => setSearchText('')}>
            <Text style={styles.sectionLink}>
              {loadingSpecialties ? 'Actualizando...' : `${specialtyList.length} disponibles`}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.specialtiesGrid}>
          {(showAllSpecialties ? filteredSpecialties : filteredSpecialties.slice(0, 4)).map((item) => (
            <View key={item.label} style={specialtyColumnStyle}>
              <SpecialtyCard
                icon={item.icon}
                label={item.label}
                description={item.description}
                onPress={() => onSelectSpecialty(item.label)}
              />
              <Text style={styles.specialtyCountText}>
                {item.totalMedicos > 0
                  ? `${item.totalMedicos} medico(s) disponible(s)`
                  : 'Disponibilidad variable'}
              </Text>
            </View>
          ))}
          {!filteredSpecialties.length ? (
            <View style={styles.emptySpecialtyWrap}>
              <Text style={styles.emptySpecialtyText}>
                No se encontraron especialidades para "{searchText.trim()}".
              </Text>
            </View>
          ) : null}
        </View>

        {filteredSpecialties.length > 4 && (
          <TouchableOpacity 
            style={styles.showMoreBtn} 
            onPress={() => setShowAllSpecialties(!showAllSpecialties)}
          >
            <Text style={styles.showMoreText}>
              {showAllSpecialties ? 'Ver menos' : `Ver las otras ${filteredSpecialties.length - 4} especialidades`}
            </Text>
            <MaterialIcons 
              name={showAllSpecialties ? 'keyboard-arrow-up' : 'keyboard-arrow-down'} 
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
              <Text style={styles.expressTitle}>¿Necesitas atención inmediata?</Text>
              <Text style={styles.expressSubtitle}>
                Médicos de guardia disponibles 24/7 para videoconsultas de urgencia.
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
    flexDirection: Platform.OS === 'web' ? 'row' : 'column',
    backgroundColor: colors.bg,
  },
  containerMobile: {
    flexDirection: 'column',
  },
  containerDesktop: {
    flexDirection: 'row',
  },

  sidebar: { backgroundColor: colors.white, justifyContent: 'space-between', zIndex: 100 },
  sidebarDesktop: {
    width: 280,
    borderRightWidth: 1,
    borderRightColor: '#eef2f7',
    padding: 20,
  },
  sidebarMobile: {
    position: 'absolute',
    left: 0, top: 0, bottom: 0,
    width: '80%',
    maxWidth: 300,
    padding: 18,
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 20,
  },
  overlay: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.4)',
    zIndex: 90,
  },
  mobileMenuBar: { 
    paddingHorizontal: 14, 
    paddingTop: 12, 
    paddingBottom: 8, 
    backgroundColor: colors.bg 
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
    backgroundColor: colors.white 
  },
  mobileMenuButtonText: { color: colors.dark, fontWeight: '700', fontSize: 13 },
  logoBox: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  logo: { width: 44, height: 44, resizeMode: 'contain' },
  logoTitle: { fontSize: 20, fontWeight: '800', color: colors.dark, letterSpacing: 0.5 },
  logoSubtitle: { fontSize: 11, fontWeight: '700', color: colors.muted },
  closeMenuBtn: { padding: 4 },

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
  syncText: { marginTop: 6, color: colors.muted, fontSize: 11, fontWeight: '600', textAlign: 'center' },
  hintText: { marginTop: 6, color: colors.muted, fontSize: 11, fontWeight: '700' },

  menu: {
    marginTop: 10,
    gap: 6,
  },
  menuDesktop: { flex: 1 },
  menuMobile: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  menuItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 12,
    minWidth: Platform.OS === 'web' ? 0 : 150,
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
    backgroundColor: colors.blue,
    paddingVertical: 12,
    borderRadius: 12,
  },
  logoutText: { color: '#fff', fontWeight: '800' },

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

  centerHeader: { alignItems: 'center', marginBottom: 20, marginTop: 8 },
  pageTitle: {
    color: colors.dark,
    fontSize: 28,
    fontWeight: '900',
    textAlign: 'center',
    lineHeight: 34,
  },
  pageSubtitle: {
    marginTop: 9,
    color: colors.muted,
    textAlign: 'center',
    fontSize: 14,
    maxWidth: 620,
  },
  searchWrap: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#bfd4e6',
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 7,
    maxWidth: 840,
    width: '100%',
    alignSelf: 'center',
  },
  searchField: {
    flex: 1,
    color: colors.dark,
    fontWeight: '600',
    paddingVertical: 6,
  },
  quickSearchRow: {
    marginTop: 8,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
    flexWrap: 'wrap',
  },
  quickSearchLabel: { color: '#7292ad', fontSize: 12 },
  quickSearchItem: { color: colors.blue, fontWeight: '700', fontSize: 12 },

  sectionHeader: {
    marginTop: 28,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionTitle: { color: colors.dark, fontSize: 16, fontWeight: '900' },
  sectionLink: { color: colors.blue, fontWeight: '800', fontSize: 13 },

  specialtiesGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  specialtyColumnDesktop: {
    width: '24%',
    minWidth: 190,
  },
  specialtyColumnTablet: {
    width: '48%',
    minWidth: 0,
  },
  specialtyColumnMobile: {
    width: '100%',
    minWidth: 0,
  },
  specialtyCard: {
    width: '100%',
    backgroundColor: '#fff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e4edf6',
    paddingVertical: 18,
    paddingHorizontal: 14,
    alignItems: 'center',
  },
  specialtyCardHover: {
    borderColor: 'rgba(19,127,236,0.45)',
    shadowColor: colors.dark,
    shadowOpacity: 0.08,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  specialtyCardPressed: { transform: [{ scale: 0.995 }] },
  specialtyIconBox: {
    width: 62,
    height: 62,
    borderRadius: 14,
    backgroundColor: '#eef5fb',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  specialtyIconBoxHover: { backgroundColor: colors.blue },
  specialtyTitle: {
    color: colors.dark,
    fontWeight: '800',
    fontSize: 14,
    textAlign: 'center',
  },
  specialtyTitleHover: { color: colors.blue },
  specialtyDescription: {
    marginTop: 4,
    color: colors.muted,
    fontSize: 12,
    textAlign: 'center',
  },
  specialtyCountText: {
    marginTop: 6,
    textAlign: 'center',
    color: colors.muted,
    fontSize: 11,
    fontWeight: '700',
  },
  emptySpecialtyWrap: {
    width: '100%',
    borderWidth: 1,
    borderColor: '#dbe7f2',
    borderStyle: 'dashed',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 12,
    alignItems: 'center',
    backgroundColor: '#f9fcff',
  },
  emptySpecialtyText: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: '700',
    textAlign: 'center',
  },

  expressCard: {
    marginTop: 18,
    backgroundColor: '#0F172A',
    borderRadius: 24,
    paddingVertical: 20,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    flexWrap: 'wrap',
  },
  expressLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
    minWidth: 260,
  },
  expressIconWrap: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  expressTitle: {
    color: '#fff',
    fontWeight: '900',
    fontSize: 18,
  },
  expressSubtitle: {
    marginTop: 2,
    color: '#bfd3ea',
    fontSize: 12,
  },
  expressBtn: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  expressBtnText: {
    color: '#fff',
    fontWeight: '900',
    fontSize: 14,
  },
  showMoreBtn: {
    marginTop: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 12,
    backgroundColor: colors.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  showMoreText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.primary,
  },
});

export default NuevaConsultaPacienteScreen;




