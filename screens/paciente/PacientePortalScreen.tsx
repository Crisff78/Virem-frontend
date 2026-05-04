import React, { useState } from 'react';
import { Platform, StyleSheet, View, useWindowDimensions } from 'react-native';

import { PacienteModuleProvider, usePacienteModule, PORTAL_MODULES, type PortalModule } from '../../navigation/PacienteModuleContext';
import PacienteSidebar from '../../components/PacienteSidebar';
import { NotificationDrawer } from '../../components/NotificationDrawer';

// Import every sidebar module screen
import DashboardPacienteScreen from '../../DashboardPacienteScreen';
import NuevaConsultaPacienteScreen from '../../NuevaConsultaPacienteScreen';
import PacienteCitasScreen from '../../PacienteCitasScreen';
import SalaEsperaVirtualPacienteScreen from '../../SalaEsperaVirtualPacienteScreen';
import PacienteChatScreen from '../../PacienteChatScreen';
import PacienteRecetasDocumentosScreen from '../../PacienteRecetasDocumentosScreen';
import PacientePerfilScreen from '../../PacientePerfilScreen';
import PacienteConfiguracionScreen from '../../PacienteConfiguracionScreen';

const MODULE_COMPONENTS: Record<PortalModule, React.ComponentType<any>> = {
  DashboardPaciente: DashboardPacienteScreen,
  NuevaConsultaPaciente: NuevaConsultaPacienteScreen,
  PacienteCitas: PacienteCitasScreen,
  SalaEsperaVirtualPaciente: SalaEsperaVirtualPacienteScreen,
  PacienteChat: PacienteChatScreen,
  PacienteRecetasDocumentos: PacienteRecetasDocumentosScreen,
  PacientePerfil: PacientePerfilScreen,
  PacienteConfiguracion: PacienteConfiguracionScreen,
};

/**
 * Portal container that keeps all patient sidebar modules mounted simultaneously.
 * Only the active module is visible (display: flex); the rest are hidden (display: none).
 * This prevents full re-renders / data reloads when switching between sidebar modules.
 */
const PacientePortalInner: React.FC = () => {
  const { width: viewportWidth } = useWindowDimensions();
  const isDesktopLayout = Platform.OS === 'web' && viewportWidth >= 1024;
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <View style={[styles.container, isDesktopLayout ? styles.containerDesktop : styles.containerMobile]}>
      <PacienteSidebar
        isMobileMenuOpen={isMobileMenuOpen}
        onToggleMobileMenu={() => setIsMobileMenuOpen((prev) => !prev)}
        onCloseMobileMenu={() => setIsMobileMenuOpen(false)}
      />

      <View style={styles.modulesContainer}>
        {PORTAL_MODULES.map((moduleName) => (
          <ModuleSlot key={moduleName} moduleName={moduleName} />
        ))}
      </View>

      <NotificationDrawer />
    </View>
  );
};

/**
 * Renders a single module inside a show/hide wrapper driven by context.
 * The component stays mounted even when hidden.
 */
const ModuleSlot: React.FC<{ moduleName: PortalModule }> = React.memo(({ moduleName }) => {
  const Component = MODULE_COMPONENTS[moduleName];

  return (
    <ModuleVisibility moduleName={moduleName}>
      <Component />
    </ModuleVisibility>
  );
});
ModuleSlot.displayName = 'ModuleSlot';

/**
 * Subscribes to context and toggles display for its child.
 * Separated so that visibility changes don't re-render the heavy screen component.
 */
const ModuleVisibility: React.FC<{ moduleName: PortalModule; children: React.ReactNode }> = ({
  moduleName,
  children,
}) => {
  const { activeModule } = usePacienteModule();
  const isActive = activeModule === moduleName;

  return (
    <View style={isActive ? styles.moduleVisible : styles.moduleHidden}>
      {children}
    </View>
  );
};

const PacientePortalScreen: React.FC = () => (
  <PacienteModuleProvider>
    <PacientePortalInner />
  </PacienteModuleProvider>
);

export default PacientePortalScreen;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F6FAFD' },
  containerDesktop: { flexDirection: 'row' },
  containerMobile: { flexDirection: 'column' },

  modulesContainer: { flex: 1 },

  moduleVisible: {
    flex: 1,
    display: 'flex',
  },
  moduleHidden: {
    flex: 0,
    display: 'none',
  },
});
