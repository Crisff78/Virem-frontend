import React, { useMemo, useState } from 'react';
import {
  Image,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from 'react-native';
import type { ImageSourcePropType } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';

import type { RootStackParamList } from '../navigation/types';
import { useMedicoModule, type MedicoPortalModule } from '../navigation/MedicoModuleContext';
import { useMedicoPortalSession } from '../hooks/useMedicoPortalSession';
import { resolveRemoteImageSource } from '../utils/imageSources';

const ViremLogo = require('../assets/imagenes/descarga.png');
const DefaultAvatar = require('../assets/imagenes/avatar-default.jpg');

type MenuItem = {
  module: MedicoPortalModule;
  icon: string;
  label: string;
};

const MENU_ITEMS: MenuItem[] = [
  { module: 'DashboardMedico', icon: 'dashboard', label: 'Dashboard' },
  { module: 'MedicoCitas', icon: 'calendar-today', label: 'Agenda' },
  { module: 'MedicoHorarios', icon: 'schedule', label: 'Horarios' },
  { module: 'MedicoPacientes', icon: 'group', label: 'Pacientes' },
  { module: 'MedicoRecetas', icon: 'description', label: 'Recetas y Órdenes' },
  { module: 'MedicoChat', icon: 'chat-bubble', label: 'Mensajes' },
  { module: 'MedicoFinanzas', icon: 'account-balance-wallet', label: 'Finanzas' },
  { module: 'MedicoPerfil', icon: 'person', label: 'Perfil' },
  { module: 'MedicoConfiguracion', icon: 'settings', label: 'Configuración' },
];

const colors = {
  primary: '#137fec',
  bg: '#F6FAFD',
  dark: '#0A1931',
  blue: '#1A3D63',
  muted: '#4A7FA7',
  white: '#FFFFFF',
};

type MedicoSidebarProps = {
  isMobileMenuOpen: boolean;
  onToggleMobileMenu: () => void;
  onCloseMobileMenu: () => void;
};

const MedicoSidebar: React.FC<MedicoSidebarProps> = ({
  isMobileMenuOpen,
  onToggleMobileMenu,
  onCloseMobileMenu,
}) => {
  const { width: viewportWidth } = useWindowDimensions();
  const isDesktopLayout = Platform.OS === 'web' && viewportWidth >= 1024;
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { activeModule, setActiveModule } = useMedicoModule();
  const { doctorName, doctorSpec, fotoUrl, signOut } = useMedicoPortalSession({
    syncOnMount: true,
    addDoctorPrefix: true,
  });

  const userAvatarSource: ImageSourcePropType = useMemo(
    () => resolveRemoteImageSource(fotoUrl, DefaultAvatar),
    [fotoUrl]
  );

  const handleModulePress = (module: MedicoPortalModule) => {
    onCloseMobileMenu();
    setActiveModule(module);
  };

  const handleLogout = async () => {
    onCloseMobileMenu();
    await signOut();
    navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
  };

  return (
    <>
      {/* Mobile hamburger bar */}
      {!isDesktopLayout ? (
        <View style={styles.mobileMenuBar}>
          <TouchableOpacity style={styles.mobileMenuButton} onPress={onToggleMobileMenu}>
            <MaterialIcons
              name={isMobileMenuOpen ? 'close' : 'menu'}
              size={22}
              color={colors.dark}
            />
            <Text style={styles.mobileMenuButtonText}>
              {isMobileMenuOpen ? 'Cerrar menú' : 'Abrir menú'}
            </Text>
          </TouchableOpacity>
        </View>
      ) : null}

      {/* Sidebar panel */}
      {(isDesktopLayout || isMobileMenuOpen) && (
        <View
          style={[styles.sidebar, isDesktopLayout ? styles.sidebarDesktop : styles.sidebarMobile]}
        >
          <View>
            {/* Logo */}
            <View style={styles.logoBox}>
              <Image source={ViremLogo} style={styles.logo} />
              <View>
                <Text style={styles.logoTitle}>VIREM</Text>
                <Text style={styles.logoSubtitle}>Portal Médico</Text>
              </View>
            </View>

            {/* User mini */}
            <View style={styles.userBox}>
              <Image source={userAvatarSource} style={styles.userAvatar} />
              <Text style={styles.userName} numberOfLines={1}>{doctorName}</Text>
              <Text style={styles.userSpec} numberOfLines={1}>{doctorSpec}</Text>
            </View>

            {/* Menu */}
            {MENU_ITEMS.map((item) => {
              const isActive = activeModule === item.module;
              return (
                <Pressable
                  key={item.module}
                  onPress={() => handleModulePress(item.module)}
                  style={({ pressed, hovered }: any) => [
                    styles.menuItem,
                    isActive && styles.menuItemActive,
                    hovered && !isActive && styles.menuItemHover,
                    pressed && styles.menuItemPressed,
                  ]}
                >
                  <MaterialIcons
                    name={item.icon}
                    size={20}
                    color={isActive ? colors.primary : colors.muted}
                  />
                  <Text style={[styles.menuText, isActive && styles.menuTextActive]}>
                    {item.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          {/* Logout */}
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <MaterialIcons name="logout" size={18} color="#fff" />
            <Text style={styles.logoutText}>Cerrar sesión</Text>
          </TouchableOpacity>
        </View>
      )}
    </>
  );
};

export default MedicoSidebar;

const styles = StyleSheet.create({
  mobileMenuBar: {
    paddingHorizontal: 14,
    paddingTop: 12,
    paddingBottom: 8,
    backgroundColor: colors.bg,
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
    backgroundColor: colors.white,
  },
  mobileMenuButtonText: { color: colors.dark, fontWeight: '700', fontSize: 13 },

  sidebar: {
    backgroundColor: colors.white,
    justifyContent: 'space-between',
  },
  sidebarDesktop: {
    width: 280,
    borderRightWidth: 1,
    borderRightColor: '#eef2f7',
    padding: 20,
  },
  sidebarMobile: {
    width: '100%',
    borderBottomWidth: 1,
    borderBottomColor: '#eef2f7',
    padding: 14,
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
  userSpec: { color: colors.muted, fontSize: 11, fontWeight: '700', marginTop: 2 },

  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 6,
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 12,
  },
  menuItemActive: {
    backgroundColor: 'rgba(19,127,236,0.10)',
    borderRightWidth: 3,
    borderRightColor: colors.primary,
  },
  menuItemHover: { backgroundColor: '#f4f8fc' },
  menuItemPressed: { opacity: 0.7, transform: [{ scale: 0.985 }] },
  menuText: { fontSize: 14, color: colors.muted, fontWeight: '700' },
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
});
