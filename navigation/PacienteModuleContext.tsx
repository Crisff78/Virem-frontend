import React, { createContext, useContext, useCallback, useMemo, useState } from 'react';
import { useNavigation } from '@react-navigation/native';
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
  /** True when the notification drawer is visible */
  isNotificationsOpen: boolean;
  /** Show or hide the notification drawer */
  setNotificationsOpen: (open: boolean) => void;
};

const fallbackCtx: PacienteModuleContextValue = {
  isInsidePortal: false,
  activeModule: 'DashboardPaciente',
  setActiveModule: () => undefined,
  portalNavigate: () => undefined,
  isNotificationsOpen: false,
  setNotificationsOpen: () => undefined,
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
  const [isNotificationsOpen, setNotificationsOpen] = useState(false);
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

  const value = useMemo<PacienteModuleContextValue>(
    () => ({
      isInsidePortal: true,
      activeModule,
      setActiveModule,
      portalNavigate,
      isNotificationsOpen,
      setNotificationsOpen,
    }),
    [activeModule, portalNavigate, setActiveModule, isNotificationsOpen]
  );

  return (
    <PacienteModuleContext.Provider value={value}>
      {children}
    </PacienteModuleContext.Provider>
  );
};
