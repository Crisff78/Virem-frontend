import React, { useCallback, useMemo, useState } from 'react';
import {
  Alert,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Switch,
  Image,
  Platform,
  Modal,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import type { ImageSourcePropType } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import { usePortalAwareNavigation } from '../../navigation/usePortalAwareNavigation';
import { useMedicoModule } from '../../navigation/MedicoModuleContext';
import { MaterialIcons } from '@expo/vector-icons';
import { useLanguage } from '../../localization/LanguageContext';
import { useMedicoPortalSession } from '../../hooks/useMedicoPortalSession';
import { resolveRemoteImageSource } from '../../utils/imageSources';
import { useResponsive, BREAKPOINTS } from '../../hooks/useResponsive';
import { colors } from '../../theme/colors';
import { spacing, radii } from '../../theme/spacing';

const ViremLogo = require('../../assets/imagenes/descarga.png');
const DefaultAvatar = require('../../assets/imagenes/avatar-default.jpg');

const SETTINGS_KEY = 'medicoSettings';

const MedicoConfiguracionScreen: React.FC = () => {
  const navigation = usePortalAwareNavigation();
  const { isInsidePortal } = useMedicoModule();
  const { language: appLanguage, setLanguage, t, tx } = useLanguage();
  const { user, refreshUser, signOut, fotoUrl } =
    useMedicoPortalSession({ syncOnMount: false });
  const { fs, rs, isDesktop, isMobile, width, select } = useResponsive();

  const [pushEnabled, setPushEnabled] = useState(true);
  const [emailEnabled, setEmailEnabled] = useState(true);
  const [smsEnabled, setSmsEnabled] = useState(false);
  const [timeFormat, setTimeFormat] = useState('24 horas');
  const [timeZone, setTimeZone] = useState('(GMT-04:00) Santo Domingo');
  const [selectorOpen, setSelectorOpen] = useState(false);
  const [selectorField, setSelectorField] = useState<'language' | 'timeFormat' | 'timeZone' | null>(
    null
  );

  const loadSettings = useCallback(async () => {
    try {
      const savedSettingsRaw = await AsyncStorage.getItem(SETTINGS_KEY);
      if (savedSettingsRaw) {
        const saved = JSON.parse(savedSettingsRaw);
        if (saved.timeFormat) setTimeFormat(saved.timeFormat);
        if (saved.timeZone) setTimeZone(saved.timeZone);
      } else if (Platform.OS === 'web') {
        const detectedZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
        if (detectedZone === 'America/Santo_Domingo') setTimeZone('(GMT-04:00) Santo Domingo');
      }
    } catch { /* noop */ }
  }, []);

  useFocusEffect(
    useCallback(() => {
      refreshUser().catch(() => undefined);
      loadSettings();
    }, [loadSettings, refreshUser])
  );

  const avatarSource: ImageSourcePropType = useMemo(() => {
    return resolveRemoteImageSource(fotoUrl, DefaultAvatar);
  }, [fotoUrl]);

  const handleLogout = async () => {
    await signOut();
    navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
  };

  const languageLabel = useMemo(() => {
    if (appLanguage === 'en') return 'English (US)';
    if (appLanguage === 'pt') return 'Português (BR)';
    return 'Español (ES)';
  }, [appLanguage]);

  const optionsMap = {
    language: [
      { label: 'Español (ES)', value: 'es' as const },
      { label: 'English (US)', value: 'en' as const },
      { label: 'Português (BR)', value: 'pt' as const },
    ],
    timeFormat: ['24 horas', '12 horas'],
    timeZone: ['(GMT-04:00) Santo Domingo', '(GMT-05:00) Bogota', '(GMT-06:00) Ciudad de Mexico'],
  };

  const openSelector = (field: 'language' | 'timeFormat' | 'timeZone') => {
    setSelectorField(field);
    setSelectorOpen(true);
  };

  const applyValue = async (value: string) => {
    if (!selectorField) return;

    if (selectorField === 'language') {
      if (value === 'es' || value === 'en' || value === 'pt') {
        await setLanguage(value);
      }
    } else {
      if (selectorField === 'timeFormat') setTimeFormat(value);
      if (selectorField === 'timeZone') setTimeZone(value);
      
      const payload = {
        timeFormat: selectorField === 'timeFormat' ? value : timeFormat,
        timeZone: selectorField === 'timeZone' ? value : timeZone,
      };
      await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(payload));
    }
    setSelectorOpen(false);
  };

  const prettyValue = (val: any) => String(val || '').trim() || '---';

  const sideItems = [
    { icon: 'dashboard', label: 'Dashboard', route: 'DashboardMedico' },
    { icon: 'calendar-today', label: 'Agenda', route: 'MedicoCitas' },
    { icon: 'group', label: 'Pacientes', route: 'MedicoPacientes' },
    { icon: 'notification-important', label: 'Solicitudes' },
    { icon: 'chat-bubble', label: 'Mensajes', route: 'MedicoChat' },
    { icon: 'person', label: 'Perfil', route: 'MedicoPerfil' },
    { icon: 'settings', label: 'Configuración', route: 'MedicoConfiguracion', active: true },
  ];

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
              <Text style={styles.userName}>{prettyValue(user?.nombreCompleto || user?.medico?.nombreCompleto)}</Text>
              <Text style={styles.userPlan}>{prettyValue(user?.especialidad || user?.medico?.especialidad)}</Text>
            </View>

            <View style={styles.menu}>
              {sideItems.map((item) => (
                <TouchableOpacity
                  key={item.label}
                  style={[styles.menuItemRow, item.active ? styles.menuItemActive : null]}
                  onPress={() => item.route && navigation.navigate(item.route)}
                >
                  <MaterialIcons name={item.icon as any} size={20} color={item.active ? colors.primary : colors.muted} />
                  <Text style={[styles.menuText, item.active && styles.menuTextActive]}>{item.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <MaterialIcons name="logout" size={20} color="#fff" />
            <Text style={styles.logoutText}>Cerrar Sesión</Text>
          </TouchableOpacity>
        </View>
      )}

      <ScrollView style={styles.main}>
        <Text style={styles.title}>Configuración</Text>
        <Text style={styles.subtitle}>Gestiona las preferencias de tu portal médico</Text>

        <View style={styles.grid}>
          {/* Cuenta */}
          <View style={styles.cardHalf}>
            <View style={styles.cardHeader}>
              <View style={styles.iconBox}>
                <MaterialIcons name="manage-accounts" size={22} color={colors.primary} />
              </View>
              <View style={styles.cardHeaderText}>
                <Text style={styles.cardTitle}>Preferencias de Cuenta</Text>
                <Text style={styles.cardHint}>Idioma y formato de tiempo</Text>
              </View>
            </View>

            <View style={styles.itemRow}>
              <View style={styles.itemInfo}>
                <Text style={styles.itemTitle}>Idioma</Text>
                <Text style={styles.itemSub}>{languageLabel}</Text>
              </View>
              <TouchableOpacity onPress={() => openSelector('language')} style={styles.itemActionContainer}>
                <Text style={styles.itemAction}>Cambiar</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.itemRow}>
              <View style={styles.itemInfo}>
                <Text style={styles.itemTitle}>Formato de Hora</Text>
                <Text style={styles.itemSub}>{timeFormat}</Text>
              </View>
              <TouchableOpacity onPress={() => openSelector('timeFormat')} style={styles.itemActionContainer}>
                <Text style={styles.itemAction}>Editar</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.itemRowLast}>
              <View style={styles.itemInfo}>
                <Text style={styles.itemTitle}>Zona Horaria</Text>
                <Text style={styles.itemSub}>{timeZone}</Text>
              </View>
              <TouchableOpacity onPress={() => openSelector('timeZone')} style={styles.itemActionContainer}>
                <Text style={styles.itemAction}>Actualizar</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Notificaciones */}
          <View style={styles.cardHalf}>
            <View style={styles.cardHeader}>
              <View style={styles.iconBox}>
                <MaterialIcons name="notifications-active" size={22} color={colors.primary} />
              </View>
              <View style={styles.cardHeaderText}>
                <Text style={styles.cardTitle}>Notificaciones</Text>
                <Text style={styles.cardHint}>Configura cómo recibes alertas</Text>
              </View>
            </View>

            <View style={styles.toggleRow}>
              <View style={styles.itemInfo}>
                <Text style={styles.itemTitle}>Correo Electrónico</Text>
                <Text style={styles.itemSub}>Avisos de nuevas citas y mensajes</Text>
              </View>
              <Switch value={emailEnabled} onValueChange={setEmailEnabled} trackColor={{ false: '#d6e0eb', true: colors.primary }} />
            </View>

            <View style={styles.toggleRow}>
              <View style={styles.itemInfo}>
                <Text style={styles.itemTitle}>Mensajes SMS</Text>
                <Text style={styles.itemSub}>Alertas críticas al celular</Text>
              </View>
              <Switch value={smsEnabled} onValueChange={setSmsEnabled} trackColor={{ false: '#d6e0eb', true: colors.primary }} />
            </View>

            <View style={styles.toggleRowLast}>
              <View style={styles.itemInfo}>
                <Text style={styles.itemTitle}>Push Notifications</Text>
                <Text style={styles.itemSub}>Notificaciones en tiempo real</Text>
              </View>
              <Switch value={pushEnabled} onValueChange={setPushEnabled} trackColor={{ false: '#d6e0eb', true: colors.primary }} />
            </View>
          </View>

          {/* Seguridad */}
          <View style={styles.cardHalf}>
            <View style={styles.cardHeader}>
              <View style={styles.iconBox}>
                <MaterialIcons name="lock" size={22} color={colors.primary} />
              </View>
              <View style={styles.cardHeaderText}>
                <Text style={styles.cardTitle}>Seguridad</Text>
                <Text style={styles.cardHint}>Protege tu acceso médico</Text>
              </View>
            </View>

            <TouchableOpacity style={styles.securityButton} onPress={() => Alert.alert('Seguridad', 'Módulo de cambio de contraseña en desarrollo.')}>
              <View style={styles.securityLeft}>
                <MaterialIcons name="vpn-key" size={18} color={colors.muted} />
                <Text style={styles.securityText}>Cambiar Contraseña</Text>
              </View>
              <MaterialIcons name="chevron-right" size={20} color="#9bb1c7" />
            </TouchableOpacity>

            <TouchableOpacity style={styles.securityButton} onPress={() => Alert.alert('Seguridad', 'El historial de sesiones se integrará próximamente.')}>
              <View style={styles.securityLeft}>
                <MaterialIcons name="history" size={18} color={colors.muted} />
                <Text style={styles.securityText}>Historial de Sesiones</Text>
              </View>
              <MaterialIcons name="chevron-right" size={20} color="#9bb1c7" />
            </TouchableOpacity>
          </View>

          {/* Soporte */}
          <View style={styles.cardHalf}>
            <View style={styles.cardHeader}>
              <View style={styles.iconBox}>
                <MaterialIcons name="help-outline" size={22} color={colors.primary} />
              </View>
              <View style={styles.cardHeaderText}>
                <Text style={styles.cardTitle}>Ayuda y Soporte</Text>
                <Text style={styles.cardHint}>Centro de atención médica</Text>
              </View>
            </View>

            <TouchableOpacity 
              style={styles.securityButton} 
              onPress={() => Alert.alert('Soporte', 'Escríbenos a medicos@virem.app')}
            >
              <View style={styles.securityLeft}>
                <MaterialIcons name="mail-outline" size={18} color={colors.muted} />
                <Text style={styles.securityText}>Contactar Soporte</Text>
              </View>
              <MaterialIcons name="chevron-right" size={20} color="#9bb1c7" />
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.securityButton} 
              onPress={() => Alert.alert('Centro de Ayuda', 'El centro de ayuda para médicos estará disponible pronto.')}
            >
              <View style={styles.securityLeft}>
                <MaterialIcons name="help-center" size={18} color={colors.muted} />
                <Text style={styles.securityText}>Centro de Ayuda</Text>
              </View>
              <MaterialIcons name="chevron-right" size={20} color="#9bb1c7" />
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      <Modal visible={selectorOpen} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Seleccionar Opción</Text>
            {selectorField === 'language' ? (
              optionsMap.language.map((opt) => (
                <TouchableOpacity key={opt.value} style={styles.optionButton} onPress={() => applyValue(opt.value)}>
                  <Text style={styles.optionText}>{opt.label}</Text>
                </TouchableOpacity>
              ))
            ) : (
              (selectorField ? optionsMap[selectorField] : []).map((opt: string) => (
                <TouchableOpacity key={opt} style={styles.optionButton} onPress={() => applyValue(opt)}>
                  <Text style={styles.optionText}>{opt}</Text>
                </TouchableOpacity>
              ))
            )}
            <TouchableOpacity style={styles.cancelButton} onPress={() => setSelectorOpen(false)}>
              <Text style={styles.cancelText}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};



const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    flexDirection: Platform.OS === 'web' && BREAKPOINTS.desktop <= 1024 ? 'row' : 'column', 
    backgroundColor: colors.bg 
  },
  sidebar: {
    width: Platform.OS === 'web' ? 280 : '100%',
    backgroundColor: colors.white,
    borderRightWidth: Platform.OS === 'web' ? 1 : 0,
    borderRightColor: colors.border,
    padding: 20,
    justifyContent: 'space-between',
  },
  logoBox: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  logo: { width: 44, height: 44, resizeMode: 'contain' },
  logoTitle: { fontSize: 20, fontWeight: '800', color: colors.dark },
  logoSubtitle: { fontSize: 11, fontWeight: '700', color: colors.muted },
  userBox: { marginTop: 18, alignItems: 'center', paddingVertical: 12 },
  userAvatar: { width: 76, height: 76, borderRadius: 76, marginBottom: 10, borderWidth: 4, borderColor: colors.bg },
  userName: { fontWeight: '800', color: colors.dark, fontSize: 14 },
  userPlan: { color: colors.muted, fontSize: 11, fontWeight: '700', marginTop: 2 },
  menu: { marginTop: 10, gap: 6 },
  menuItemRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, paddingHorizontal: 12, borderRadius: 12 },
  menuItemActive: { backgroundColor: colors.primarySoft, borderRightWidth: 3, borderRightColor: colors.primary },
  menuText: { fontSize: 14, fontWeight: '700', color: colors.muted },
  menuTextActive: { color: colors.primary },
  logoutButton: { flexDirection: 'row', gap: 10, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.blue, paddingVertical: 12, borderRadius: 12 },
  logoutText: { color: '#fff', fontWeight: '800' },
  main: { flex: 1, paddingHorizontal: 20, paddingTop: 18 },
  title: { fontSize: 32, fontWeight: '900', color: colors.dark },
  subtitle: { fontSize: 16, color: colors.muted, marginTop: 6, marginBottom: 18, fontWeight: '600' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 14 },
  cardHalf: { 
    flexGrow: 1, 
    minWidth: Platform.OS === 'web' ? 300 : '100%', 
    backgroundColor: colors.surface, 
    borderRadius: 18, 
    borderWidth: 1, 
    borderColor: colors.border, 
    padding: 16, 
    marginBottom: 14 
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 14 },
  cardHeaderText: { flex: 1 },
  iconBox: { width: 42, height: 42, borderRadius: 12, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center' },
  cardTitle: { color: colors.dark, fontSize: 16, fontWeight: '900' },
  cardHint: { color: colors.muted, fontSize: 11, fontWeight: '600' },
  itemRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: colors.border },
  itemRowLast: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 12 },
  itemInfo: { flex: 1, paddingRight: 10 },
  itemTitle: { color: colors.dark, fontSize: 14, fontWeight: '800' },
  itemSub: { color: colors.muted, fontSize: 12, fontWeight: '600', marginTop: 2 },
  itemActionContainer: { paddingLeft: 10 },
  itemAction: { color: colors.primary, fontSize: 14, fontWeight: '800' },
  toggleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: colors.border },
  toggleRowLast: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 12 },
  securityButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: colors.bg, borderWidth: 1, borderColor: colors.border, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 11, marginBottom: 10 },
  securityLeft: { flexDirection: 'row', alignItems: 'center', gap: 9 },
  securityText: { color: colors.blue, fontSize: 14, fontWeight: '800' },
  supportBox: { backgroundColor: colors.bg, borderWidth: 1, borderColor: colors.border, borderRadius: 12, padding: 12 },
  supportTitle: { color: colors.dark, fontSize: 14, fontWeight: '900', marginBottom: 4 },
  supportText: { color: colors.muted, fontSize: 12, lineHeight: 17, fontWeight: '600' },
  supportButtons: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 12 },
  contactBtn: {
    flex: 1,
    minWidth: 120,
    backgroundColor: colors.primary,
    borderRadius: 10,
    alignItems: 'center',
    paddingVertical: 10,
  },
  contactBtnText: { color: '#fff', fontSize: 13, fontWeight: '900' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  modalCard: { backgroundColor: colors.surface, borderRadius: 20, padding: 24, width: '90%', maxWidth: 400 },
  modalTitle: { fontSize: 20, fontWeight: '900', color: colors.dark, marginBottom: 18, textAlign: 'center' },
  optionButton: { paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: colors.border },
  optionText: { fontSize: 16, fontWeight: '700', color: colors.blue, textAlign: 'center' },
  cancelButton: { marginTop: 18, paddingVertical: 14 },
  cancelText: { color: colors.muted, fontSize: 16, fontWeight: '800', textAlign: 'center' },
});

export default MedicoConfiguracionScreen;
