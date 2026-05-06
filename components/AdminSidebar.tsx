import React from 'react';
import {
  Image,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';

const ViremLogo = require('../assets/imagenes/descarga.png');

const colors = {
  primary: '#137fec',
  bg: '#F6FAFD',
  dark: '#0A1931',
  blue: '#1A3D63',
  muted: '#4A7FA7',
  white: '#FFFFFF',
};

type TabKey = 'resumen' | 'usuarios' | 'citas' | 'pagos' | 'moderacion' | 'auditoria';

type MenuItem = {
  key: TabKey;
  icon: string;
  label: string;
};

const MENU_ITEMS: MenuItem[] = [
  { key: 'resumen', label: 'Resumen', icon: 'dashboard' },
  { key: 'usuarios', label: 'Usuarios', icon: 'groups' },
  { key: 'citas', label: 'Citas', icon: 'event-note' },
  { key: 'pagos', label: 'Pagos', icon: 'receipt-long' },
  { key: 'moderacion', label: 'Moderación', icon: 'verified-user' },
  { key: 'auditoria', label: 'Auditoría', icon: 'manage-search' },
];

type AdminSidebarProps = {
  activeTab: TabKey;
  setActiveTab: (tab: TabKey) => void;
  isMobileMenuOpen: boolean;
  onCloseMobileMenu: () => void;
  adminEmail?: string;
  onLogout: () => void;
};

const AdminSidebar: React.FC<AdminSidebarProps> = ({
  activeTab,
  setActiveTab,
  isMobileMenuOpen,
  onCloseMobileMenu,
  adminEmail,
  onLogout,
}) => {
  const { width: viewportWidth } = useWindowDimensions();
  const isDesktopLayout = Platform.OS === 'web' && viewportWidth >= 1024;

  const handleTabPress = (key: TabKey) => {
    setActiveTab(key);
    if (!isDesktopLayout) {
      onCloseMobileMenu();
    }
  };

  const sidebarContent = (
    <View style={styles.sidebarInner}>
      <View style={styles.sidebarHeader}>
        <View style={styles.logoBox}>
          <Image source={ViremLogo} style={styles.logo} />
          <View>
            <Text style={styles.logoTitle}>VIREM</Text>
            <Text style={styles.logoSubtitle}>Admin Portal</Text>
          </View>
        </View>
        {!isDesktopLayout && (
          <TouchableOpacity onPress={onCloseMobileMenu} style={styles.closeBtn}>
            <MaterialIcons name="close" size={24} color={colors.dark} />
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.userBox}>
        <View style={styles.avatarPlaceholder}>
          <MaterialIcons name="admin-panel-settings" size={40} color={colors.primary} />
        </View>
        <Text style={styles.userName} numberOfLines={1}>Administrador</Text>
        <Text style={styles.userEmail} numberOfLines={1}>{adminEmail || 'admin@virem.local'}</Text>
      </View>

      <ScrollView style={{ flex: 1, marginTop: 10 }}>
        {MENU_ITEMS.map((item) => {
          const isActive = activeTab === item.key;
          return (
            <Pressable
              key={item.key}
              onPress={() => handleTabPress(item.key)}
              style={({ pressed, hovered }: any) => [
                styles.menuItem,
                isActive && styles.menuItemActive,
                hovered && !isActive && styles.menuItemHover,
                pressed && styles.menuItemPressed,
              ]}
            >
              <MaterialIcons
                name={item.icon}
                size={22}
                color={isActive ? colors.primary : colors.muted}
              />
              <Text style={[styles.menuText, isActive && styles.menuTextActive]}>
                {item.label}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      <TouchableOpacity style={styles.logoutButton} onPress={onLogout}>
        <MaterialIcons name="logout" size={18} color="#fff" />
        <Text style={styles.logoutText}>Cerrar sesión</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <>
      {!isDesktopLayout && isMobileMenuOpen && (
        <TouchableOpacity
          style={styles.drawerOverlay}
          activeOpacity={1}
          onPress={onCloseMobileMenu}
        >
          <View style={styles.drawerContent} onStartShouldSetResponder={() => true}>
            {sidebarContent}
          </View>
        </TouchableOpacity>
      )}

      {isDesktopLayout && isMobileMenuOpen && (
        <View style={styles.sidebarDesktop}>
          {sidebarContent}
        </View>
      )}
    </>
  );
};

export default AdminSidebar;

const styles = StyleSheet.create({
  drawerOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.4)',
    zIndex: 2000,
  },
  drawerContent: {
    width: 280,
    height: '100%',
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 10,
  },
  sidebarDesktop: {
    width: 280,
    height: '100%',
    backgroundColor: '#fff',
    borderRightWidth: 1,
    borderRightColor: '#eef2f7',
  },
  sidebarInner: { flex: 1, padding: 20 },
  sidebarHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  closeBtn: {
    padding: 8,
    borderRadius: 10,
    backgroundColor: '#f8fafc',
  },
  logoBox: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  logo: { width: 44, height: 44, resizeMode: 'contain' },
  logoTitle: { fontSize: 22, fontWeight: '800', color: colors.dark, letterSpacing: 0.5 },
  logoSubtitle: { fontSize: 11, fontWeight: '700', color: colors.muted },
  userBox: { marginTop: 12, alignItems: 'center', paddingVertical: 12 },
  avatarPlaceholder: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#f0f7ff',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#e1effe',
  },
  userName: { fontWeight: '800', color: colors.dark, fontSize: 15, textAlign: 'center' },
  userEmail: { color: colors.muted, fontSize: 11, fontWeight: '600', marginTop: 2 },
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
    backgroundColor: 'rgba(19,127,236,0.08)',
  },
  menuItemHover: { backgroundColor: '#f8fafc' },
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
    marginTop: 20,
  },
  logoutText: { color: '#fff', fontWeight: '800' },
});
