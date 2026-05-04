import React, { useCallback, useEffect, useMemo, useState } from 'react';
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
import * as ImagePicker from 'expo-image-picker';
import { useFocusEffect } from '@react-navigation/native';
import { usePortalAwareMedicoNavigation } from '../../navigation/usePortalAwareMedicoNavigation';
import { useMedicoModule } from '../../navigation/MedicoModuleContext';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { MaterialIcons } from '@expo/vector-icons';
import type { RootStackParamList } from '../../navigation/types';
import { useMedicoPortalSession } from '../../hooks/useMedicoPortalSession';
import { apiClient } from '../../utils/api';
import { getApiErrorMessage, isAuthError } from '../../utils/apiErrors';
import { resolveRemoteImageSource, sanitizeRemoteImageUrl } from '../../utils/imageSources';

const ViremLogo = require('../../assets/imagenes/descarga.png');
const DefaultAvatar = require('../../assets/imagenes/avatar-default.jpg');

const colors = {
  primary: '#137fec',
  bg: '#F6FAFD',
  dark: '#0A1931',
  blue: '#1A3D63',
  muted: '#4A7FA7',
  light: '#B3CFE5',
  white: '#FFFFFF',
  success: '#16a34a',
};

type SessionUser = {
  email?: string;
  nombreCompleto?: string;
  especialidad?: string;
  fechanacimiento?: string;
  genero?: string;
  cedula?: string;
  telefono?: string;
  fotoUrl?: string;
  medicoid?: string;
  precio_chat?: number;
  precio_videollamada?: number;
  medico?: {
    nombreCompleto?: string;
    especialidad?: string;
    fechanacimiento?: string;
    genero?: string;
    cedula?: string;
    telefono?: string;
    fotoUrl?: string;
    medicoid?: string;
    precio_chat?: number;
    precio_videollamada?: number;
  };
};

type MedicoProfile = {
  email: string;
  nombreCompleto: string;
  especialidad: string;
  fechanacimiento: string;
  genero: string;
  cedula: string;
  telefono: string;
  fotoUrl: string;
  medicoid?: string;
  precio_chat?: number;
  precio_videollamada?: number;
};

type SideItem = {
  icon: string;
  label: string;
  route?: 'DashboardMedico' | 'MedicoCitas' | 'MedicoPacientes' | 'MedicoChat' | 'MedicoPerfil' | 'MedicoConfiguracion';
  active?: boolean;
  badge?: { text: string; color: string };
};

const EMPTY_PROFILE: MedicoProfile = {
  email: '',
  nombreCompleto: '',
  especialidad: '',
  fechanacimiento: '',
  genero: '',
  cedula: '',
  telefono: '',
  fotoUrl: '',
};

const normalizeValue = (value: unknown) =>
  String(value || '')
    .replace(/\s+/g, ' ')
    .trim();

const buildPersistentPhotoUri = (asset: ImagePicker.ImagePickerAsset | undefined): string => {
  if (!asset) return '';

  const base64 = normalizeValue((asset as any)?.base64);
  if (base64) {
    const mimeRaw = normalizeValue((asset as any)?.mimeType).toLowerCase();
    const mimeType = mimeRaw.startsWith('image/') ? mimeRaw : 'image/jpeg';
    return `data:${mimeType};base64,${base64}`;
  }

  return normalizeValue(asset.uri);
};

const toWebDataUrl = async (uri: string): Promise<string> => {
  if (Platform.OS !== 'web') return uri;
  const cleanUri = normalizeValue(uri);
  if (!cleanUri || cleanUri.startsWith('data:image/')) return cleanUri;

  try {
    const response = await fetch(cleanUri);
    const blob = await response.blob();
    const dataUrl = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string' && reader.result.startsWith('data:image/')) {
          resolve(reader.result);
          return;
        }
        resolve(cleanUri);
      };
      reader.onerror = () => reject(new Error('No se pudo leer la imagen.'));
      reader.readAsDataURL(blob);
    });
    return normalizeValue(dataUrl);
  } catch {
    return cleanUri;
  }
};

const prettyValue = (value: string) => (value ? value : 'No disponible');

const formatCedula = (value: string) => {
  const digits = normalizeValue(value).replace(/\D/g, '');
  if (digits.length !== 11) return normalizeValue(value);
  return `${digits.slice(0, 3)}-${digits.slice(3, 10)}-${digits.slice(10)}`;
};

const formatPhone = (value: string) => {
  const digits = normalizeValue(value).replace(/\D/g, '');
  if (!digits) return '';

  if (digits.length === 10) {
    return `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6)}`;
  }

  if (digits.length > 10) {
    const country = digits.slice(0, digits.length - 10);
    const local = digits.slice(-10);
    return `+${country} ${local.slice(0, 3)}-${local.slice(3, 6)}-${local.slice(6)}`;
  }

  return normalizeValue(value);
};
const buildProfile = (user: SessionUser | null): MedicoProfile => ({
  email: normalizeValue(user?.email),
  nombreCompleto: normalizeValue(user?.nombreCompleto || user?.medico?.nombreCompleto),
  especialidad: normalizeValue(user?.especialidad || user?.medico?.especialidad),
  fechanacimiento: normalizeValue(user?.fechanacimiento || user?.medico?.fechanacimiento),
  genero: normalizeValue(user?.genero || user?.medico?.genero),
  cedula: normalizeValue(user?.cedula || user?.medico?.cedula),
  telefono: normalizeValue(user?.telefono || user?.medico?.telefono),
  fotoUrl: sanitizeRemoteImageUrl(user?.fotoUrl || user?.medico?.fotoUrl),
  medicoid: user?.medicoid || user?.medico?.medicoid,
  precio_chat: user?.precio_chat || user?.medico?.precio_chat,
  precio_videollamada: user?.precio_videollamada || user?.medico?.precio_videollamada,
});

const VerifiedField: React.FC<{
  label: string;
  value: string;
  formatter?: (value: string) => string;
}> = ({ label, value, formatter }) => (
  <View style={styles.fieldWrap}>
    <Text style={styles.fieldLabel}>{label}</Text>
    <View style={styles.readonlyBox}>
      <Text style={styles.readonlyText}>{prettyValue(formatter ? formatter(value) : value)}</Text>
    </View>
  </View>
);

const MedicoPerfilScreen: React.FC = () => {
  const navigation = usePortalAwareMedicoNavigation();
  const { isInsidePortal } = useMedicoModule();
  const {
    user,
    loadingUser: loadingSessionUser,
    refreshUser,
    persistUser,
    signOut,
    fotoUrl,
  } = useMedicoPortalSession({ syncOnMount: false });
  
  const [medicoId, setMedicoId] = useState('');
  const [precioChat, setPrecioChat] = useState('0');
  const [precioVideo, setPrecioVideo] = useState('1000');
  const [savingPrices, setSavingPrices] = useState(false);
  const [localNombre, setLocalNombre] = useState('');
  const [localSpec, setLocalSpec] = useState('');
  const [localGenero, setLocalGenero] = useState('');
  const [localCedula, setLocalCedula] = useState('');
  const [localTelefono, setLocalTelefono] = useState('');
  const [localFechaNac, setLocalFechaNac] = useState('');

  const [loading, setLoading] = useState(false);
  const [savingPhoto, setSavingPhoto] = useState(false);
  const [profile, setProfile] = useState<MedicoProfile>(EMPTY_PROFILE);

  const avatarSource: ImageSourcePropType = useMemo(() => {
    return resolveRemoteImageSource(profile.fotoUrl || fotoUrl, DefaultAvatar);
  }, [fotoUrl, profile.fotoUrl]);

  useEffect(() => {
    const p = buildProfile((user as SessionUser | null) || null);
    setProfile(p);
    setMedicoId(String(p?.medicoid || ''));
    setPrecioChat('0');
    setPrecioVideo(String(p?.precio_videollamada || '1000'));
    setLocalNombre(p?.nombreCompleto || '');
    setLocalSpec(p?.especialidad || '');
    setLocalGenero(p?.genero || '');
    setLocalCedula(p?.cedula || '');
    setLocalTelefono(p?.telefono || '');
    setLocalFechaNac(p?.fechanacimiento || '');
  }, [user]);

  const handleSavePrices = async () => {
    const pVideo = Number(precioVideo);

    if (pVideo < 500 || pVideo > 5000) {
      Alert.alert('Precio inválido', 'El precio de la videollamada debe estar entre RD$500 y RD$5000.');
      return;
    }

    setSavingPrices(true);
    try {
      const payload = await apiClient.put<any>(`/api/medicos/${medicoId}`, {
        authenticated: true,
        body: {
          precio_chat: 0,
          precio_videollamada: pVideo,
          nombreCompleto: localNombre,
          especialidad: localSpec,
          genero: localGenero,
          cedula: localCedula,
          telefono: localTelefono,
          fechanacimiento: localFechaNac,
        },
      });

      if (payload?.success) {
        Alert.alert('Éxito', 'Precios actualizados correctamente.');
        await refreshUser();
      } else {
        Alert.alert('Error', payload?.message || 'No se pudo actualizar los precios.');
      }
    } catch (error) {
      Alert.alert('Error', getApiErrorMessage(error, 'Error al guardar los precios.'));
    } finally {
      setSavingPrices(false);
    }
  };

  const handleAuthExpired = useCallback(
    async (message = 'Inicia sesion nuevamente para continuar.') => {
      Alert.alert('Sesion expirada', message);
      await signOut();
      navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
    },
    [navigation, signOut]
  );

  const loadProfile = useCallback(async () => {
    setLoading(true);
    try {
      const nextUser = (await refreshUser()) as SessionUser | null;
      setProfile(buildProfile(nextUser));
    } catch (error) {
      if (isAuthError(error)) {
        await handleAuthExpired();
        return;
      }
      setProfile(buildProfile((user as SessionUser | null) || null));
    } finally {
      setLoading(false);
    }
  }, [handleAuthExpired, refreshUser, user]);

  useFocusEffect(
    useCallback(() => {
      loadProfile();
    }, [loadProfile])
  );

  const persistProfilePhoto = useCallback(
    async (uri: string) => {
      const cleanUri = normalizeValue(uri);
      const payload = await apiClient.put<any>('/api/users/me/profile', {
        authenticated: true,
        body: { fotoUrl: cleanUri },
      });
      if (!payload?.success) {
        throw new Error(payload?.message || 'No se pudo guardar la foto en el servidor.');
      }

      const finalUri = sanitizeRemoteImageUrl(payload?.profile?.fotoUrl || cleanUri);
      const nextUser: SessionUser = {
        ...(user || {}),
        email: normalizeValue(user?.email || profile.email),
        nombreCompleto: normalizeValue(user?.nombreCompleto || user?.medico?.nombreCompleto || profile.nombreCompleto),
        especialidad: normalizeValue(user?.especialidad || user?.medico?.especialidad || profile.especialidad),
        fechanacimiento: normalizeValue(user?.fechanacimiento || user?.medico?.fechanacimiento || profile.fechanacimiento),
        genero: normalizeValue(user?.genero || user?.medico?.genero || profile.genero),
        cedula: normalizeValue(user?.cedula || user?.medico?.cedula || profile.cedula),
        telefono: normalizeValue(user?.telefono || user?.medico?.telefono || profile.telefono),
        fotoUrl: finalUri,
      };

      await persistUser(nextUser);
      setProfile(buildProfile(nextUser));
      return { savedOnServer: true };
    },
    [persistUser, profile, user]
  );

  const handlePickPhoto = useCallback(async () => {
    try {
      if (Platform.OS !== 'web') {
        const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (permission.status !== 'granted') {
          Alert.alert('Permiso requerido', 'Debes permitir acceso a la galería para subir tu foto.');
          return;
        }
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.55,
        base64: true,
      });

      if (result.canceled || !result.assets?.length) return;
      const baseUri = buildPersistentPhotoUri(result.assets[0]);
      const uri = await toWebDataUrl(baseUri);
      if (!uri) return;

      setSavingPhoto(true);
      await persistProfilePhoto(uri);
      Alert.alert('Foto actualizada', 'La foto del perfil medico se guardo correctamente.');
    } catch (error: any) {
      if (isAuthError(error)) {
        await handleAuthExpired('Inicia sesion nuevamente para guardar tu foto.');
        return;
      }
      Alert.alert('Error', getApiErrorMessage(error, 'No se pudo actualizar la foto del perfil.'));
    } finally {
      setSavingPhoto(false);
    }
  }, [handleAuthExpired, persistProfilePhoto]);

  const handleLogout = useCallback(async () => {
    await signOut();
    navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
  }, [navigation, signOut]);

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

  const sideItems: SideItem[] = [
    { icon: 'dashboard', label: 'Dashboard', route: 'DashboardMedico' },
    { icon: 'calendar-today', label: 'Agenda', route: 'MedicoCitas' },
    { icon: 'group', label: 'Pacientes', route: 'MedicoPacientes' },
    { icon: 'notification-important', label: 'Solicitudes', badge: { text: '5', color: '#ef4444' } },
    { icon: 'chat-bubble', label: 'Mensajes', badge: { text: '3', color: colors.primary }, route: 'MedicoChat' },
    { icon: 'person', label: 'Perfil', route: 'MedicoPerfil', active: true },
    { icon: 'settings', label: 'Configuracion', route: 'MedicoConfiguracion' },
  ];

  const handleSideItemPress = (item: SideItem) => {
    if (!item.route) {
      Alert.alert('Solicitudes', 'Las solicitudes pendientes se integraran en un modulo dedicado.');
      return;
    }
    if (item.route === 'MedicoPerfil') return;
    navigation.navigate(item.route);
  };

  return (
    <View style={styles.container}>
      {!isInsidePortal && (
      <View style={styles.sidebar}>
        <View>
          <View style={styles.logoBox}>
            <Image source={ViremLogo} style={styles.logo} />
            <View>
              <Text style={styles.logoTitle}>VIREM</Text>
              <Text style={styles.logoSubtitle}>Portal Medico</Text>
            </View>
          </View>

          <View style={styles.userBox}>
            <Image source={avatarSource} style={styles.userAvatar} />
            <Text style={styles.userName}>{prettyValue(profile.nombreCompleto)}</Text>
            <Text style={styles.userPlan}>{prettyValue(profile.especialidad)}</Text>
          </View>

          <View style={styles.menu}>
            {sideItems.map((item) => (
              <TouchableOpacity
                key={item.label}
                style={[styles.menuItemRow, item.active ? styles.menuItemActive : null]}
                onPress={() => handleSideItemPress(item)}
                activeOpacity={0.85}
              >
                <MaterialIcons
                  name={item.icon as any}
                  size={20}
                  color={item.active ? colors.primary : colors.muted}
                />
                <Text style={[styles.menuText, item.active ? styles.menuTextActive : null]}>{item.label}</Text>
                {item.badge ? (
                  <View style={[styles.badge, { backgroundColor: item.badge.color }]}>
                    <Text style={styles.badgeText}>{item.badge.text}</Text>
                  </View>
                ) : null}
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <MaterialIcons name="logout" size={20} color="#fff" />
          <Text style={styles.logoutText}>Cerrar sesion</Text>
        </TouchableOpacity>
      </View>
      )}

      <ScrollView style={styles.main} contentContainerStyle={{ paddingBottom: 26 }}>
        <View style={styles.headerWrap}>
          <View style={styles.headerRow}>
            <View style={styles.headerLeft}>
              <Text style={styles.pageTitle}>Perfil del Medico</Text>
              <View style={styles.subtitleRow}>
                <Text style={styles.pageSubtitle}>
                  Aqui puedes ver tus datos verificados y actualizar tu foto de perfil.
                </Text>
                {loading || loadingSessionUser ? (
                  <ActivityIndicator size="small" color={colors.primary} />
                ) : null}
              </View>
            </View>
            <View style={styles.headerRight}>
              <Text style={styles.headerDate}>{dateText}</Text>
              <Text style={styles.headerTime}>{timeText}</Text>
            </View>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Foto de perfil</Text>
          <View style={styles.photoRow}>
            <Image source={avatarSource} style={styles.profilePhoto} />
            <TouchableOpacity style={styles.photoActionBtn} onPress={handlePickPhoto} disabled={savingPhoto}>
              {savingPhoto ? (
                <ActivityIndicator size="small" color={colors.primary} />
              ) : (
                <>
                  <MaterialIcons name="photo-camera" size={16} color={colors.primary} />
                  <Text style={styles.photoActionBtnText}>
                    {profile.fotoUrl ? 'Cambiar foto' : 'Agregar foto'}
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* PRECIOS DE CONSULTA */}
        <View style={styles.card}>
          <View style={styles.sectionHeader}>
            <MaterialIcons name="payments" size={20} color={colors.primary} />
            <Text style={styles.cardTitle}>Precios y Consultas</Text>
          </View>
          <Text style={styles.sectionSub}>Define el costo de tus servicios (RD$500 - RD$5000)</Text>
          
          <View style={styles.priceGrid}>
            <View style={styles.priceInputBox}>
              <Text style={styles.priceLabel}>Coordinación por Chat</Text>
              <View style={[styles.priceInputWrapper, { backgroundColor: '#f0f9ff', borderColor: '#bae6fd' }]}>
                <MaterialIcons name="info-outline" size={14} color={colors.primary} style={{ marginRight: 6 }} />
                <Text style={[styles.currency, { color: colors.primary, marginRight: 0 }]}>GRATIS</Text>
              </View>
            </View>

            <View style={styles.priceInputBox}>
              <Text style={styles.priceLabel}>Consulta por Videollamada</Text>
              <View style={styles.priceInputWrapper}>
                <Text style={styles.currency}>RD$</Text>
                <TextInput
                  style={styles.priceInput}
                  value={precioVideo}
                  onChangeText={setPrecioVideo}
                  keyboardType="numeric"
                  placeholder="1000"
                />
              </View>
            </View>
          </View>

          <TouchableOpacity 
            style={[styles.savePricesBtn, savingPrices && { opacity: 0.7 }]} 
            onPress={handleSavePrices}
            disabled={savingPrices}
          >
            {savingPrices ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.savePricesText}>Guardar Precios</Text>
            )}
          </TouchableOpacity>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Datos verificados del registro</Text>
          <View style={styles.grid2}>
            <VerifiedField label="Nombre completo" value={profile.nombreCompleto} />
            <VerifiedField label="Especialidad" value={profile.especialidad} />
            <VerifiedField label="Cedula" value={profile.cedula} formatter={formatCedula} />
            <VerifiedField label="Fecha de nacimiento" value={profile.fechanacimiento} />
            <VerifiedField label="Genero" value={profile.genero} />
            <VerifiedField label="Telefono" value={profile.telefono} formatter={formatPhone} />
            <VerifiedField label="Correo electronico" value={profile.email} />
          </View>
        </View>

        <View style={styles.successBanner}>
          <MaterialIcons name="verified-user" size={18} color={colors.success} />
          <Text style={styles.successText}>
            Tus datos profesionales se validan en el flujo de registro medico.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: Platform.OS === 'web' ? 'row' : 'column',
    backgroundColor: colors.bg,
  },
  loaderWrap: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.bg,
  },
  loaderText: {
    marginTop: 10,
    color: colors.muted,
    fontWeight: '700',
  },
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
  logoBox: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  logo: { width: 44, height: 44, resizeMode: 'contain' },
  logoTitle: { fontSize: 20, fontWeight: '800', color: colors.dark, letterSpacing: 0.5 },
  logoSubtitle: { fontSize: 11, fontWeight: '700', color: colors.muted },
  userBox: { marginTop: 18, alignItems: 'center', paddingVertical: 12 },
  userAvatar: {
    width: 76,
    height: 76,
    borderRadius: 76,
    marginBottom: 10,
    borderWidth: 4,
    borderColor: '#f5f7fb',
  },
  userName: { fontWeight: '800', color: colors.dark, fontSize: 14, textAlign: 'center' },
  userPlan: { color: colors.muted, fontSize: 11, fontWeight: '700', marginTop: 2 },
  menu: {
    marginTop: 10,
    gap: 6,
    flex: Platform.OS === 'web' ? 1 : 0,
    flexDirection: Platform.OS === 'web' ? 'column' : 'row',
    flexWrap: 'wrap',
  },
  menuItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
    minWidth: Platform.OS === 'web' ? 0 : 150,
  },
  menuItemActive: {
    backgroundColor: 'rgba(19,127,236,0.12)',
  },
  menuText: { fontSize: 14, fontWeight: '700', color: colors.muted },
  menuTextActive: { color: colors.primary },
  badge: {
    marginLeft: 'auto',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 999,
  },
  badgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '800',
  },
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
  },
  headerWrap: {
    paddingHorizontal: Platform.OS === 'web' ? 32 : 14,
    paddingTop: Platform.OS === 'web' ? 32 : 14,
    paddingBottom: 12,
  },
  headerRow: {
    flexDirection: Platform.OS === 'web' ? 'row' : 'column',
    justifyContent: 'space-between',
    alignItems: Platform.OS === 'web' ? 'flex-end' : 'flex-start',
    gap: 12,
  },
  headerLeft: { flex: 1 },
  headerRight: { alignItems: Platform.OS === 'web' ? 'flex-end' : 'flex-start' },
  headerDate: { color: colors.dark, fontSize: 14, fontWeight: '800' },
  headerTime: { color: colors.muted, fontSize: 12, marginTop: 2 },
  pageTitle: { color: colors.dark, fontSize: 28, fontWeight: '900' },
  subtitleRow: {
    marginTop: 4,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flexWrap: 'wrap',
  },
  pageSubtitle: { color: colors.muted, fontSize: 16, fontWeight: '500' },
  card: {
    marginHorizontal: Platform.OS === 'web' ? 32 : 14,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#dbe8f4',
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
  },
  cardTitle: { color: colors.dark, fontSize: 16, fontWeight: '900', marginBottom: 10 },
  photoRow: { flexDirection: 'row', alignItems: 'center', gap: 12, flexWrap: 'wrap' },
  profilePhoto: {
    width: 88,
    height: 88,
    borderRadius: 88,
    borderWidth: 3,
    borderColor: '#dceafb',
    backgroundColor: '#f5f8fc',
  },
  photoActionBtn: {
    marginTop: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: '#cfe1f3',
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 10,
    backgroundColor: '#f8fcff',
    minHeight: 38,
  },
  photoActionBtnText: { color: colors.primary, fontSize: 12, fontWeight: '800' },
  grid2: {
    flexDirection: Platform.OS === 'web' ? 'row' : 'column',
    flexWrap: 'wrap',
    gap: 10,
  },
  fieldWrap: { flex: 1, minWidth: Platform.OS === 'web' ? 250 : 0 },
  fieldLabel: { color: colors.dark, fontSize: 12, fontWeight: '800', marginBottom: 6 },
  readonlyBox: {
    minHeight: 42,
    borderWidth: 1,
    borderColor: '#d7e6f3',
    borderRadius: 10,
    backgroundColor: '#f9fcff',
    justifyContent: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  readonlyText: {
    color: colors.dark,
    fontSize: 12,
    fontWeight: '700',
  },
  successBanner: {
    marginHorizontal: Platform.OS === 'web' ? 32 : 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#eefcf2',
    borderWidth: 1,
    borderColor: '#c8efd4',
    borderRadius: 12,
    padding: 12,
  },
  successText: { color: '#166534', fontSize: 12, fontWeight: '700' },
  priceGrid: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 14,
    marginBottom: 16,
  },
  priceInputBox: {
    flex: 1,
  },
  priceLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.muted,
    marginBottom: 6,
  },
  priceInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    paddingHorizontal: 12,
    height: 48,
  },
  currency: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.dark,
    marginRight: 4,
  },
  priceInput: {
    flex: 1,
    fontSize: 15,
    fontWeight: '700',
    color: colors.primary,
  },
  savePricesBtn: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  savePricesText: {
    fontSize: 14,
    fontWeight: '800',
  },
  sectionHeader: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.dark,
    marginBottom: 4,
  },
  sectionSub: {
    fontSize: 12,
    color: colors.muted,
    fontWeight: '600',
    marginBottom: 8,
  },
});

export default MedicoPerfilScreen;

