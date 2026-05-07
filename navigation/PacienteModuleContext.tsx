import React, { createContext, useContext, useCallback, useMemo, useState } from 'react';
import { useNavigation } from '@react-navigation/native';
import { Platform } from 'react-native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from './types';

/**
 * List of sidebar modules that stay mounted inside the portal.
 * Any route not listed here navigates via the normal stack.
 */
export const PORTAL_MODULES = [
  'DashboardPaciente',
  'NuevaConsultaPaciente',
  'PacienteCitas',
  'SalaEsperaVirtualPaciente',
  'PacienteChat',
  'PacienteRecetasDocumentos',
  'PacientePerfil',
  'PacienteConfiguracion',
  'PacienteNotificaciones',
] as const;

export type PortalModule = (typeof PORTAL_MODULES)[number];

type PacienteModuleContextValue = {
  /** True when rendered inside the portal container */
  isInsidePortal: boolean;
  /** Currently visible sidebar module */
  activeModule: PortalModule;
  /** Switch to a different sidebar module (no unmount/remount) */
  setActiveModule: (module: PortalModule) => void;
  /**
   * Navigate: if the target is a sidebar module, switch without unmounting.
   * Otherwise, push onto the stack as usual.
   */
  portalNavigate: (route: string, params?: Record<string, unknown>) => void;
<<<<<<< HEAD
  /** True when the notification drawer is visible */
  isNotificationsOpen: boolean;
  /** Show or hide the notification drawer */
  setNotificationsOpen: (open: boolean) => void;
=======
  /** Global sidebar toggle state (Desktop & Mobile) */
  isSidebarOpen: boolean;
  toggleSidebar: () => void;
>>>>>>> feature-cris
};

const fallbackCtx: PacienteModuleContextValue = {
  isInsidePortal: false,
  activeModule: 'DashboardPaciente',
<<<<<<< HEAD
  setActiveModule: () => undefined,
  portalNavigate: () => undefined,
  isNotificationsOpen: false,
  setNotificationsOpen: () => undefined,
=======
  setActiveModule: () => {
    console.warn('usePacienteModule: setActiveModule called outside of PacienteModuleProvider');
  },
  portalNavigate: () => {
    console.warn('usePacienteModule: portalNavigate called outside of PacienteModuleProvider');
  },
  isSidebarOpen: false,
  toggleSidebar: () => {
    console.warn('usePacienteModule: toggleSidebar called outside of PacienteModuleProvider');
  },
>>>>>>> feature-cris
};

export const PacienteModuleContext = createContext<PacienteModuleContextValue>(fallbackCtx);

export function usePacienteModule() {
  return useContext(PacienteModuleContext);
}

/**
 * Returns true when `route` is one of the sidebar portal modules.
 */
export function isPortalModule(route: string): route is PortalModule {
  return (PORTAL_MODULES as readonly string[]).includes(route);
}

type ProviderProps = {
  initialModule?: PortalModule;
  children: React.ReactNode;
};

export const PacienteModuleProvider: React.FC<ProviderProps> = ({
  initialModule = 'DashboardPaciente',
  children,
}) => {
  const [activeModule, setActiveModuleRaw] = useState<PortalModule>(initialModule);
<<<<<<< HEAD
  const [isNotificationsOpen, setNotificationsOpen] = useState(false);
=======
  
  // Initial state: closed on mobile devices or small screens, open on desktop web
  const [isSidebarOpen, setIsSidebarOpen] = useState(() => {
    if (Platform.OS !== 'web') return false;
    // On web, check width if possible
    if (typeof window !== 'undefined') {
      return window.innerWidth >= 1024;
    }
    return true;
  });

>>>>>>> feature-cris
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  const setActiveModule = useCallback((mod: PortalModule) => {
    setActiveModuleRaw(mod);
  }, []);

  const portalNavigate = useCallback(
    (route: string, params?: Record<string, unknown>) => {
      if (isPortalModule(route)) {
        setActiveModuleRaw(route);
      } else {
        (navigation.navigate as any)(route, params);
      }
    },
    [navigation]
  );
  
  const toggleSidebar = useCallback(() => {
    setIsSidebarOpen((prev) => !prev);
  }, []);

  const value = useMemo<PacienteModuleContextValue>(
    () => ({
      isInsidePortal: true,
      activeModule,
      setActiveModule,
      portalNavigate,
<<<<<<< HEAD
      isNotificationsOpen,
      setNotificationsOpen,
    }),
    [activeModule, portalNavigate, setActiveModule, isNotificationsOpen]
=======
      isSidebarOpen,
      toggleSidebar,
    }),
    [activeModule, portalNavigate, setActiveModule, isSidebarOpen, toggleSidebar]
>>>>>>> feature-cris
  );

  return (
    <PacienteModuleContext.Provider value={value}>
      {children}
    </PacienteModuleContext.Provider>
  );
};
