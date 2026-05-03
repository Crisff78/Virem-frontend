import React, { useMemo } from 'react';
import {
  Image,
  ImageSourcePropType,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';

import { colors } from '../theme/colors';

const ViremLogo = require('../assets/imagenes/descarga.png');

const DESKTOP_BREAKPOINT = 1024;

export type PortalSidebarMenuItem<TModule extends string = string> = {
  module: TModule;
  icon: string;
  label: string;
};

type Props<TModule extends string> = {
  portalSubtitle: string;
  primaryName: string;
  secondaryLine: string;
  hint?: string;
  avatarSource: ImageSourcePropType;
  menuItems: PortalSidebarMenuItem<TModule>[];
  activeModule: TModule;
  onModulePress: (module: TModule) => void;
  onLogout: () => void;
  logoutLabel?: string;
  isMobileMenuOpen: boolean;
  onToggleMobileMenu: () => void;
};

function PortalSidebarBase<TModule extends string>({
  portalSubtitle,
  primaryName,
  secondaryLine,
  hint,
  avatarSource,
  menuItems,
  activeModule,
  onModulePress,
  onLogout,
  logoutLabel = 'Cerrar sesión',
  isMobileMenuOpen,
  onToggleMobileMenu,
}: Props<TModule>) {
  const { width } = useWindowDimensions();
  const isDesktopLayout = Platform.OS === 'web' && width >= DESKTOP_BREAKPOINT;

  const renderedMenu = useMemo(
    () =>
      menuItems.map((item) => {
        const isActive = activeModule === item.module;
        return (
          <Pressable
            key={item.module}
            onPress={() => onModulePress(item.module)}
            accessibilityRole="button"
            accessibilityState={{ selected: isActive }}
            accessibilityLabel={item.label}
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
            <Text
              numberOfLines={1}
              style={[styles.menuText, isActive && styles.menuTextActive]}
            >
              {item.label}
            </Text>
          </Pressable>
        );
      }),
    [activeModule, menuItems, onModulePress]
  );

  return (
    <>
      {!isDesktopLayout ? (
        <View style={styles.mobileMenuBar}>
          <TouchableOpacity
            style={styles.mobileMenuButton}
            onPress={onToggleMobileMenu}
            accessibilityRole="button"
            accessibilityLabel={isMobileMenuOpen ? 'Cerrar menú' : 'Abrir menú'}
          >
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

      {(isDesktopLayout || isMobileMenuOpen) && (
        <View
          style={[
            styles.sidebar,
            isDesktopLayout ? styles.sidebarDesktop : styles.sidebarMobile,
          ]}
        >
          <View>
            <View style={styles.logoBox}>
              <Image source={ViremLogo} style={styles.logo} />
              <View style={styles.logoTextBox}>
                <Text style={styles.logoTitle}>VIREM</Text>
                <Text style={styles.logoSubtitle}>{portalSubtitle}</Text>
              </View>
            </View>

            <View style={styles.userBox}>
              <Image source={avatarSource} style={styles.userAvatar} />
              <Text style={styles.userName} numberOfLines={1}>
                {primaryName}
              </Text>
              <Text style={styles.userPlan} numberOfLines={1}>
                {secondaryLine}
              </Text>
              {hint ? <Text style={styles.hintText}>{hint}</Text> : null}
            </View>

            {renderedMenu}
          </View>

          <TouchableOpacity
            style={styles.logoutButton}
            onPress={onLogout}
            accessibilityRole="button"
            accessibilityLabel={logoutLabel}
          >
            <MaterialIcons name="logout" size={18} color={colors.white} />
            <Text style={styles.logoutText}>{logoutLabel}</Text>
          </TouchableOpacity>
        </View>
      )}
    </>
  );
}

export const PortalSidebar = React.memo(PortalSidebarBase) as typeof PortalSidebarBase;

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
    borderColor: colors.borderSoft,
    backgroundColor: colors.white,
  },
  mobileMenuButtonText: { color: colors.dark, fontWeight: '700', fontSize: 13 },

  sidebar: { backgroundColor: colors.white, justifyContent: 'space-between' },
  sidebarDesktop: {
    width: 280,
    borderRightWidth: 1,
    borderRightColor: colors.border,
    padding: 20,
  },
  sidebarMobile: {
    width: '100%',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    padding: 14,
  },

  logoBox: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  logoTextBox: { flexShrink: 1 },
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
  hintText: {
    marginTop: 6,
    color: colors.muted,
    fontSize: 11,
    fontWeight: '700',
    textAlign: 'center',
  },

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
    backgroundColor: colors.primarySoft,
    borderRightWidth: 3,
    borderRightColor: colors.primary,
  },
  menuItemHover: { backgroundColor: colors.hover },
  menuItemPressed: { opacity: 0.7, transform: [{ scale: 0.985 }] },
  menuText: { fontSize: 14, color: colors.muted, fontWeight: '700', flexShrink: 1 },
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
  logoutText: { color: colors.white, fontWeight: '800' },
});
