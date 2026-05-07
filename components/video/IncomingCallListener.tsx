/**
 * Listener global de llamadas entrantes.
 *
 * Montar UNA sola vez en App.tsx (dentro del NavigationContainer y de los providers
 * Auth + Socket). Cuando llega `call:incoming` por socket, navega a IncomingCallScreen.
 */
import { useEffect, useRef } from 'react';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useIncomingCallListener } from '../../hooks/useCallSignaling';
import type { RootStackParamList } from '../../navigation/types';

function IncomingCallListener(): null {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { incoming, dismiss } = useIncomingCallListener();
  const lastCitaRef = useRef<string | null>(null);

  useEffect(() => {
    if (!incoming) return;
    if (incoming.citaId === lastCitaRef.current) return;
    lastCitaRef.current = incoming.citaId;
    try {
      navigation.navigate('IncomingCall', {
        citaId: incoming.citaId,
        callerName: incoming.callerName,
        callerRole: incoming.callerRole,
      });
    } catch (err) {
      console.warn('[IncomingCallListener] navigate fallo:', err);
    }
  }, [incoming, navigation]);

  // Si la llamada se cancela / acepta / rechaza, liberamos el guard
  useEffect(() => {
    if (!incoming) lastCitaRef.current = null;
  }, [incoming]);

  // este componente no renderiza nada
  return null;
};

export default IncomingCallListener;
