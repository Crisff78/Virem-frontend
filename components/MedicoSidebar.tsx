import React, { useCallback, useMemo } from 'react';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { ImageSourcePropType } from 'react-native';

import type { RootStackParamList } from '../navigation/types';
import { useMedicoModule, type MedicoPortalModule } from '../navigation/MedicoModuleContext';
import { useMedicoPortalSession } from '../hooks/useMedicoPortalSession';
import { resolveRemoteImageSource } from '../utils/imageSources';
import { PortalSidebar, type PortalSidebarMenuItem } from './PortalSidebar';

const DefaultAvatar = require('../assets/imagenes/avatar-default.jpg');

const MENU_ITEMS: PortalSidebarMenuItem<MedicoPortalModule>[] = [
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
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { activeModule, setActiveModule } = useMedicoModule();
  const { doctorName, doctorSpec, fotoUrl, signOut } = useMedicoPortalSession({
    syncOnMount: true,
    addDoctorPrefix: true,
  });

  const avatarSource: ImageSourcePropType = useMemo(
    () => resolveRemoteImageSource(fotoUrl, DefaultAvatar),
    [fotoUrl]
  );

  const handleModulePress = useCallback(
    (module: MedicoPortalModule) => {
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
      portalSubtitle="Portal Médico"
      primaryName={doctorName}
      secondaryLine={doctorSpec}
      avatarSource={avatarSource}
      menuItems={MENU_ITEMS}
      activeModule={activeModule}
      onModulePress={handleModulePress}
      onLogout={handleLogout}
      isMobileMenuOpen={isMobileMenuOpen}
      onToggleMobileMenu={onToggleMobileMenu}
    />
  );
};

export default MedicoSidebar;
