import React, { useState } from 'react';
import { Platform, StyleSheet, View, useWindowDimensions } from 'react-native';

import { MedicoModuleProvider, useMedicoModule, MEDICO_PORTAL_MODULES, type MedicoPortalModule } from './navigation/MedicoModuleContext';
import MedicoSidebar from './components/MedicoSidebar';

// Import every sidebar module screen
import DashboardMedico from './DashboardMedico';
import MedicoCitasScreen from './MedicoCitasScreen';
import MedicoPacientesScreen from './MedicoPacientesScreen';
import MedicoChatScreen from './MedicoChatScreen';
import MedicoPerfilScreen from './MedicoPerfilScreen';

const MODULE_COMPONENTS: Record<MedicoPortalModule, React.ComponentType<any>> = {
  DashboardMedico: DashboardMedico,
  MedicoCitas: MedicoCitasScreen,
  MedicoPacientes: MedicoPacientesScreen,
  MedicoChat: MedicoChatScreen,
  MedicoPerfil: MedicoPerfilScreen,
};

/**
 * Portal container that keeps all medico sidebar modules mounted simultaneously.
 * Only the active module is visible (display: flex); the rest are hidden (display: none).
 * This prevents full re-renders / data reloads when switching between sidebar modules.
 */
const MedicoPortalInner: React.FC = () => {
  const { width: viewportWidth } = useWindowDimensions();
  const isDesktopLayout = Platform.OS === 'web' && viewportWidth >= 1024;
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <View style={[styles.container, isDesktopLayout ? styles.containerDesktop : styles.containerMobile]}>
      <MedicoSidebar
        isMobileMenuOpen={isMobileMenuOpen}
        onToggleMobileMenu={() => setIsMobileMenuOpen((prev) => !prev)}
        onCloseMobileMenu={() => setIsMobileMenuOpen(false)}
      />

      <View style={styles.modulesContainer}>
        {MEDICO_PORTAL_MODULES.map((moduleName) => (
          <ModuleSlot key={moduleName} moduleName={moduleName} />
        ))}
      </View>
    </View>
  );
};

/**
 * Renders a single module inside a show/hide wrapper driven by context.
 * The component stays mounted even when hidden.
 */
const ModuleSlot: React.FC<{ moduleName: MedicoPortalModule }> = React.memo(({ moduleName }) => {
  const Component = MODULE_COMPONENTS[moduleName];

  return (
    <ModuleVisibility moduleName={moduleName}>
      <Component />
    </ModuleVisibility>
  );
});
ModuleSlot.displayName = 'MedicoModuleSlot';

/**
 * Subscribes to context and toggles display for its child.
 * Separated so that visibility changes don't re-render the heavy screen component.
 */
const ModuleVisibility: React.FC<{ moduleName: MedicoPortalModule; children: React.ReactNode }> = ({
  moduleName,
  children,
}) => {
  const { activeModule } = useMedicoModule();
  const isActive = activeModule === moduleName;

  return (
    <View style={isActive ? styles.moduleVisible : styles.moduleHidden}>
      {children}
    </View>
  );
};

const MedicoPortalScreen: React.FC = () => (
  <MedicoModuleProvider>
    <MedicoPortalInner />
  </MedicoModuleProvider>
);

export default MedicoPortalScreen;

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
