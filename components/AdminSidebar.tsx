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

type AdminMode = 'operational' | 'technical';
type TabKey = 'resumen' | 'usuarios' | 'citas' | 'pagos' | 'moderacion' | 'auditoria' | 'it-overview' | 'it-infra' | 'it-logs';

type MenuItem = {
  key: TabKey;
  icon: string;
  label: string;
  mode: AdminMode;
};

const MENU_ITEMS: MenuItem[] = [
  // Operational Mode
  { key: 'resumen', label: 'Resumen', icon: 'dashboard', mode: 'operational' },
  { key: 'usuarios', label: 'Usuarios', icon: 'groups', mode: 'operational' },
  { key: 'citas', label: 'Citas', icon: 'event-note', mode: 'operational' },
  { key: 'pagos', label: 'Pagos', icon: 'receipt-long', mode: 'operational' },
  { key: 'moderacion', label: 'Moderación', icon: 'verified-user', mode: 'operational' },
  { key: 'auditoria', label: 'Auditoría', icon: 'manage-search', mode: 'operational' },
  
  // Technical Mode
  { key: 'it-overview', label: 'Tech Overview', icon: 'monitor-heart', mode: 'technical' },
  { key: 'it-infra', label: 'Infrastructure', icon: 'dns', mode: 'technical' },
  { key: 'it-logs', label: 'System Logs', icon: 'terminal', mode: 'technical' },
];

type AdminSidebarProps = {
  activeTab: TabKey;
  setActiveTab: (tab: TabKey) => void;
  isMobileMenuOpen: boolean;
  onCloseMobileMenu: () => void;
  adminEmail?: string;
  onLogout: () => void;
  adminMode: AdminMode;
  setAdminMode: (mode: AdminMode) => void;
};

const AdminSidebar: React.FC<AdminSidebarProps> = ({
  activeTab,
  setActiveTab,
  isMobileMenuOpen,
  onCloseMobileMenu,
  adminEmail,
  onLogout,
  adminMode,
  setAdminMode,
}) => {
  const { width: viewportWidth } = useWindowDimensions();
  const isDesktopLayout = Platform.OS === 'web' && viewportWidth >= 1024;
  const isTech = adminMode === 'technical';

  const handleTabPress = (key: TabKey) => {
    setActiveTab(key);
    if (!isDesktopLayout) {
      onCloseMobileMenu();
    }
  };

  const handleModeSwitch = (mode: AdminMode) => {
    setAdminMode(mode);
    // Set default tab for mode
    if (mode === 'operational') setActiveTab('resumen');
    else setActiveTab('it-overview');
  };

  const sidebarContent = (
    <View style={[styles.sidebarInner, isTech && styles.sidebarInnerTech]}>
      <View style={styles.sidebarHeader}>
        <View style={styles.logoBox}>
          <Image source={ViremLogo} style={styles.logo} />
          <View>
            <Text style={[styles.logoTitle, isTech && styles.textWhite]}>VIREM</Text>
            <Text style={[styles.logoSubtitle, isTech && styles.textMuted]}>Admin Portal</Text>
          </View>
        </View>
        <TouchableOpacity onPress={onCloseMobileMenu} style={[styles.closeBtn, isTech && styles.closeBtnTech]}>
          <MaterialIcons name="close" size={24} color={isTech ? '#fff' : colors.dark} />
        </TouchableOpacity>
      </View>

      {/* Mode Switcher */}
      <View style={[styles.modeSwitcher, isTech && styles.modeSwitcherTech]}>
        <TouchableOpacity 
          style={[styles.modeBtn, adminMode === 'operational' && styles.modeBtnActive]} 
          onPress={() => handleModeSwitch('operational')}
        >
          <MaterialIcons name="business" size={18} color={adminMode === 'operational' ? '#fff' : isTech ? colors.muted : colors.muted} />
          {isDesktopLayout && <Text style={[styles.modeBtnText, adminMode === 'operational' && styles.textWhite]}>Ops</Text>}
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.modeBtn, adminMode === 'technical' && styles.modeBtnActiveTech]} 
          onPress={() => handleModeSwitch('technical')}
        >
          <MaterialIcons name="memory" size={18} color={adminMode === 'technical' ? '#fff' : colors.muted} />
          {isDesktopLayout && <Text style={[styles.modeBtnText, adminMode === 'technical' && styles.textWhite]}>IT</Text>}
        </TouchableOpacity>
      </View>

      <View style={[styles.userBox, isTech && styles.userBoxTech]}>
        <View style={[styles.avatarPlaceholder, isTech && styles.avatarPlaceholderTech]}>
          <MaterialIcons name={isTech ? "security" : "admin-panel-settings"} size={40} color={isTech ? '#58A6FF' : colors.primary} />
        </View>
        <Text style={[styles.userName, isTech && styles.textWhite]} numberOfLines={1}>Administrador</Text>
        <Text style={[styles.userEmail, isTech && styles.textMuted]} numberOfLines={1}>{adminEmail || 'admin@virem.local'}</Text>
      </View>

      <ScrollView style={{ flex: 1, marginTop: 10 }}>
        {MENU_ITEMS.filter(item => item.mode === adminMode).map((item) => {
          const isActive = activeTab === item.key;
          return (
            <Pressable
              key={item.key}
              onPress={() => handleTabPress(item.key)}
              style={({ pressed, hovered }: any) => [
                styles.menuItem,
                isActive && (isTech ? styles.menuItemActiveTech : styles.menuItemActive),
                hovered && !isActive && (isTech ? styles.menuItemHoverTech : styles.menuItemHover),
                pressed && styles.menuItemPressed,
              ]}
            >
              <MaterialIcons
                name={item.icon}
                size={22}
                color={isActive ? (isTech ? '#58A6FF' : colors.primary) : (isTech ? '#8B949E' : colors.muted)}
              />
              <Text style={[styles.menuText, isTech && styles.textMuted, isActive && (isTech ? styles.textTechPrimary : styles.menuTextActive)]}>
                {item.label}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      <TouchableOpacity style={[styles.logoutButton, isTech && styles.logoutButtonTech]} onPress={onLogout}>
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
          <View style={[styles.drawerContent, isTech && { backgroundColor: '#0D1117' }]} onStartShouldSetResponder={() => true}>
            {sidebarContent}
          </View>
        </TouchableOpacity>
      )}

      {isDesktopLayout && isMobileMenuOpen && (
        <View style={[styles.sidebarDesktop, isTech && { backgroundColor: '#0D1117', borderRightColor: '#30363D' }]}>
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
  sidebarInnerTech: { backgroundColor: '#0D1117', borderRightColor: '#30363D' },
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
  closeBtnTech: { backgroundColor: '#0D1117' },
  logoBox: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  logo: { width: 44, height: 44, resizeMode: 'contain' },
  logoTitle: { fontSize: 22, fontWeight: '800', color: colors.dark, letterSpacing: 0.5 },
  logoSubtitle: { fontSize: 11, fontWeight: '700', color: colors.muted },
  textWhite: { color: '#fff' },
  textMuted: { color: '#8B949E' },
  textTechPrimary: { color: '#58A6FF' },

  modeSwitcher: {
    flexDirection: 'row',
    backgroundColor: '#f1f5f9',
    padding: 4,
    borderRadius: 12,
    marginTop: 20,
    marginBottom: 10,
  },
  modeSwitcherTech: { backgroundColor: '#0D1117' },
  modeBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    gap: 6,
    borderRadius: 8,
  },
  modeBtnActive: { backgroundColor: colors.primary, shadowColor: colors.primary, shadowOpacity: 0.2, shadowRadius: 4 },
  modeBtnActiveTech: { backgroundColor: '#238636' },
  modeBtnText: { fontSize: 13, fontWeight: '700', color: colors.muted },

  userBox: { marginTop: 12, alignItems: 'center', paddingVertical: 12 },
  userBoxTech: { borderBottomWidth: 1, borderBottomColor: '#30363D' },
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
  avatarPlaceholderTech: { backgroundColor: '#0D1117', borderColor: '#30363D' },
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
  menuItemActiveTech: { backgroundColor: 'rgba(88,166,255,0.1)' },
  menuItemHover: { backgroundColor: '#f8fafc' },
  menuItemHoverTech: { backgroundColor: '#0D1117' },
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
  logoutButtonTech: { backgroundColor: '#F85149' },
  logoutText: { color: '#fff', fontWeight: '800' },
});
