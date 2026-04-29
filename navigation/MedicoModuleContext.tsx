import React, { createContext, useContext, useCallback, useMemo, useState } from 'react';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from './types';

/**
 * List of sidebar modules that stay mounted inside the medico portal.
 * Any route not listed here navigates via the normal stack.
 */
export const MEDICO_PORTAL_MODULES = [
  'DashboardMedico',
  'MedicoCitas',
  'MedicoPacientes',
  'MedicoChat',
  'MedicoPerfil',
  'MedicoHorarios',
  'MedicoRecetas',
  'MedicoFinanzas',
  'MedicoConfiguracion',
] as const;

export type MedicoPortalModule = (typeof MEDICO_PORTAL_MODULES)[number];

type MedicoModuleContextValue = {
  /** True when rendered inside the medico portal container */
  isInsidePortal: boolean;
  /** Currently visible sidebar module */
  activeModule: MedicoPortalModule;
  /** Switch to a different sidebar module (no unmount/remount) */
  setActiveModule: (module: MedicoPortalModule) => void;
  /**
   * Navigate: if the target is a sidebar module, switch without unmounting.
   * Otherwise, push onto the stack as usual.
   */
  portalNavigate: (route: string, params?: Record<string, unknown>) => void;
};

const fallbackCtx: MedicoModuleContextValue = {
  isInsidePortal: false,
  activeModule: 'DashboardMedico',
  setActiveModule: () => undefined,
  portalNavigate: () => undefined,
};

export const MedicoModuleContext = createContext<MedicoModuleContextValue>(fallbackCtx);

export function useMedicoModule() {
  return useContext(MedicoModuleContext);
}

/**
 * Returns true when `route` is one of the medico sidebar portal modules.
 */
export function isMedicoPortalModule(route: string): route is MedicoPortalModule {
  return (MEDICO_PORTAL_MODULES as readonly string[]).includes(route);
}

type ProviderProps = {
  initialModule?: MedicoPortalModule;
  children: React.ReactNode;
};

export const MedicoModuleProvider: React.FC<ProviderProps> = ({
  initialModule = 'DashboardMedico',
  children,
}) => {
  const [activeModule, setActiveModuleRaw] = useState<MedicoPortalModule>(initialModule);
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  const setActiveModule = useCallback((mod: MedicoPortalModule) => {
    setActiveModuleRaw(mod);
  }, []);

  const portalNavigate = useCallback(
    (route: string, params?: Record<string, unknown>) => {
      if (isMedicoPortalModule(route)) {
        setActiveModuleRaw(route);
      } else {
        (navigation.navigate as any)(route, params);
      }
    },
    [navigation]
  );

  const value = useMemo<MedicoModuleContextValue>(
    () => ({
      isInsidePortal: true,
      activeModule,
      setActiveModule,
      portalNavigate,
    }),
    [activeModule, portalNavigate, setActiveModule]
  );

  return (
    <MedicoModuleContext.Provider value={value}>
      {children}
    </MedicoModuleContext.Provider>
  );
};
