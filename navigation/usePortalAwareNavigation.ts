import { useCallback, useMemo } from 'react';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from './types';
import { isPortalModule, usePacienteModule, type PortalModule } from './PacienteModuleContext';

/**
 * Drop-in replacement for `useNavigation()` that intercepts navigation
 * to portal modules when inside the PacientePortal container.
 *
 * Usage: replace `const navigation = useNavigation<...>()` with
 *        `const navigation = usePortalAwareNavigation()`
 *
 * When *inside* the portal, calling `navigation.navigate('PacienteCitas')`
 * switches the active module without unmounting screens.
 *
 * When *outside* the portal (or targeting a non-module route),
 * it falls through to the real stack navigator.
 */
export function usePortalAwareNavigation() {
  const realNavigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { isInsidePortal, setActiveModule } = usePacienteModule();

  const navigate = useCallback(
    (route: string | { name: string; params?: any }, params?: any) => {
      const routeName = typeof route === 'string' ? route : route.name;
      const routeParams = typeof route === 'string' ? params : route.params;

      if (isInsidePortal && isPortalModule(routeName)) {
        setActiveModule(routeName as PortalModule);
      } else {
        (realNavigation.navigate as any)(routeName, routeParams);
      }
    },
    [isInsidePortal, realNavigation, setActiveModule]
  );

  // Return a proxy-like object that behaves like the real navigation
  // but intercepts navigate() calls for portal modules
  return useMemo(
    () => ({
      ...realNavigation,
      navigate,
    }),
    [navigate, realNavigation]
  );
}
