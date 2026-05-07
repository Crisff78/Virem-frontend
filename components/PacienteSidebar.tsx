import React, { useCallback, useMemo } from 'react';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { ImageSourcePropType } from 'react-native';

import { useLanguage } from '../localization/LanguageContext';
import type { RootStackParamList } from '../navigation/types';
import { usePacienteModule, type PortalModule } from '../navigation/PacienteModuleContext';
import { usePatientPortalSession } from '../hooks/usePatientPortalSession';
import { resolveRemoteImageSource } from '../utils/imageSources';
import { PortalSidebar, type PortalSidebarMenuItem } from './PortalSidebar';

const DefaultAvatar = require('../assets/imagenes/avatar-default.jpg');

const MENU_ITEMS_BASE: { module: PortalModule; icon: string; labelKey: string }[] = [
  { module: 'DashboardPaciente', icon: 'grid-view', labelKey: 'menu.home' },
  { module: 'NuevaConsultaPaciente', icon: 'person-search', labelKey: 'menu.searchDoctor' },
  { module: 'PacienteCitas', icon: 'calendar-today', labelKey: 'menu.appointments' },
  { module: 'SalaEsperaVirtualPaciente', icon: 'videocam', labelKey: 'menu.videocall' },
  { module: 'PacienteChat', icon: 'chat-bubble', labelKey: 'menu.chat' },
  { module: 'PacienteRecetasDocumentos', icon: 'description', labelKey: 'menu.recipesDocs' },
  { module: 'PacientePerfil', icon: 'account-circle', labelKey: 'menu.profile' },
  { module: 'PacienteConfiguracion', icon: 'settings', labelKey: 'menu.settings' },
];

type PacienteSidebarProps = {
  isMobileMenuOpen: boolean;
  onToggleMobileMenu: () => void;
  onCloseMobileMenu: () => void;
};

const PacienteSidebar: React.FC<PacienteSidebarProps> = ({
  isMobileMenuOpen,
  onToggleMobileMenu,
  onCloseMobileMenu,
}) => {
  const { t } = useLanguage();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { activeModule, setActiveModule } = usePacienteModule();
  const { fullName, planLabel, fotoUrl, hasProfilePhoto, signOut } = usePatientPortalSession({
    syncOnMount: true,
  });

  const avatarSource: ImageSourcePropType = useMemo(
    () => resolveRemoteImageSource(fotoUrl, DefaultAvatar),
    [fotoUrl]
  );

  const menuItems = useMemo<PortalSidebarMenuItem<PortalModule>[]>(
    () =>
      MENU_ITEMS_BASE.map((item) => ({
        module: item.module,
        icon: item.icon,
        label: t(item.labelKey as any),
      })),
    [t]
  );

  const handleModulePress = useCallback(
    (module: PortalModule) => {
      onCloseMobileMenu();
      setActiveModule(module);
    },
    [onCloseMobileMenu, setActiveModule]
  );

  const handleLogout = useCallback(async () => {
    onCloseMobileMenu();
    await signOut();
    navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
  }, [navigation, onCloseMobileMenu, signOut]);

  return (
    <PortalSidebar
      portalSubtitle="Portal Paciente"
      primaryName={fullName}
      secondaryLine={planLabel}
      hint={!hasProfilePhoto ? 'No tienes foto. Ve a Perfil para agregarla.' : undefined}
      avatarSource={avatarSource}
      menuItems={menuItems}
      activeModule={activeModule}
      onModulePress={handleModulePress}
      onLogout={handleLogout}
      logoutLabel={t('menu.logout')}
      isMobileMenuOpen={isMobileMenuOpen}
      onToggleMobileMenu={onToggleMobileMenu}
    />
  );
};

export default PacienteSidebar;
