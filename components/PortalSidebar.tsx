import React, { useEffect, useMemo, useRef } from 'react';
import {
  Animated,
  Image,
  ImageSourcePropType,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

import { colors } from '../theme/colors';
import { spacing, radii } from '../theme/spacing';

const ViremLogo = require('../assets/imagenes/descarga.png');

const DESKTOP_BREAKPOINT = 1024;
const DRAWER_WIDTH_RATIO = 0.84;
const DRAWER_MAX_WIDTH = 320;

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

  const drawerWidth = Math.min(DRAWER_MAX_WIDTH, width * DRAWER_WIDTH_RATIO);

  // Animaciones del drawer móvil.
  const drawerAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(drawerAnim, {
      toValue: isMobileMenuOpen ? 1 : 0,
      duration: 220,
      useNativeDriver: true,
    }).start();
  }, [drawerAnim, isMobileMenuOpen]);

  const drawerTranslateX = drawerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-drawerWidth, 0],
  });
  const backdropOpacity = drawerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 0.5],
  });

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

  const innerSidebar = (
    <>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.sidebarScroll}
      >
        <View style={styles.logoBox}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm, flex: 1 }}>
            <Image source={ViremLogo} style={styles.logo} />
            <View style={styles.logoTextBox}>
              <Text style={styles.logoTitle} numberOfLines={1}>
                VIREM
              </Text>
              <Text style={styles.logoSubtitle} numberOfLines={1}>
                {portalSubtitle}
              </Text>
            </View>
          </View>
          
          {!isDesktopLayout && (
            <TouchableOpacity 
              onPress={onToggleMobileMenu}
              style={styles.closeSidebarBtn}
            >
              <MaterialIcons name="close" size={24} color={colors.dark} />
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.userBox}>
          <Image source={avatarSource} style={styles.userAvatar} />
          <Text style={styles.userName} numberOfLines={1}>
            {primaryName}
          </Text>
          <Text style={styles.userPlan} numberOfLines={1}>
            {secondaryLine}
          </Text>
          {hint ? (
            <Text style={styles.hintText} numberOfLines={2}>
              {hint}
            </Text>
          ) : null}
        </View>

        {renderedMenu}
      </ScrollView>

      <TouchableOpacity
        style={styles.logoutButton}
        onPress={onLogout}
        accessibilityRole="button"
        accessibilityLabel={logoutLabel}
      >
        <MaterialIcons name="logout" size={18} color={colors.white} />
        <Text style={styles.logoutText}>{logoutLabel}</Text>
      </TouchableOpacity>
    </>
  );

  if (isDesktopLayout) {
    return <View style={[styles.sidebar, styles.sidebarDesktop]}>{innerSidebar}</View>;
  }

  return (
    <>
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

      {isMobileMenuOpen ? (
        <>
          <Animated.View
            pointerEvents={isMobileMenuOpen ? 'auto' : 'none'}
            style={[styles.backdrop, { opacity: backdropOpacity }]}
          >
            <Pressable
              style={StyleSheet.absoluteFill}
              onPress={onToggleMobileMenu}
              accessibilityRole="button"
              accessibilityLabel="Cerrar menú"
            />
          </Animated.View>

          <Animated.View
            style={[
              styles.sidebar,
              styles.sidebarMobile,
              {
                width: drawerWidth,
                transform: [{ translateX: drawerTranslateX }],
              },
            ]}
          >
            {innerSidebar}
          </Animated.View>
        </>
      ) : null}
    </>
  );
}

export const PortalSidebar = React.memo(PortalSidebarBase) as typeof PortalSidebarBase;

const styles = StyleSheet.create({
  mobileMenuBar: {
    paddingHorizontal: spacing.base,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
    backgroundColor: colors.bg,
  },
  mobileMenuButton: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radii.sm,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    backgroundColor: colors.white,
  },
  mobileMenuButtonText: { color: colors.dark, fontWeight: '700', fontSize: 13 },

  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#000',
    zIndex: 90,
  },

  sidebar: { backgroundColor: colors.white, justifyContent: 'space-between' },
  sidebarDesktop: {
    width: 280,
    borderRightWidth: 1,
    borderRightColor: colors.border,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.lg,
  },
  sidebarMobile: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    paddingHorizontal: spacing.base,
    paddingTop: spacing.lg,
    paddingBottom: spacing.lg,
    zIndex: 100,
    shadowColor: '#000',
    shadowOffset: { width: 2, height: 0 },
    shadowOpacity: 0.18,
    shadowRadius: 12,
    elevation: 16,
  },

  sidebarScroll: { paddingBottom: spacing.lg },

  logoBox: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  closeSidebarBtn: { padding: spacing.xs },
  logoTextBox: { flexShrink: 1 },
  logo: { width: 44, height: 44, resizeMode: 'contain' },
  logoTitle: { fontSize: 20, fontWeight: '800', color: colors.dark, letterSpacing: 0.5 },
  logoSubtitle: { fontSize: 11, fontWeight: '700', color: colors.muted },

  userBox: { marginTop: spacing.lg, alignItems: 'center', paddingVertical: spacing.md },
  userAvatar: {
    width: 76,
    height: 76,
    borderRadius: 76,
    marginBottom: spacing.sm,
    borderWidth: 4,
    borderColor: '#f5f7fb',
  },
  userName: { fontWeight: '800', color: colors.dark, fontSize: 14, textAlign: 'center' },
  userPlan: { color: colors.muted, fontSize: 11, fontWeight: '700', marginTop: spacing.xxs },
  hintText: {
    marginTop: spacing.xs,
    color: colors.muted,
    fontSize: 11,
    fontWeight: '700',
    textAlign: 'center',
  },

  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginTop: spacing.xs,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    borderRadius: radii.md,
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
    gap: spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.blue,
    paddingVertical: spacing.md,
    borderRadius: radii.md,
    marginTop: spacing.md,
  },
  logoutText: { color: colors.white, fontWeight: '800' },
});
