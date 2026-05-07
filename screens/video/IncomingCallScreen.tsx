import React, { useEffect, useRef } from 'react';
import { Animated, Easing, Platform, StyleSheet, Text, TouchableOpacity, Vibration, View } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';

import { useCallSignaler } from '../../hooks/useCallSignaling';
import type { RootStackParamList } from '../../navigation/types';

type Route = RouteProp<RootStackParamList, 'IncomingCall'>;

const IncomingCallScreen: React.FC = () => {
  const route = useRoute<Route>();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { citaId, callerName, callerRole } = route.params || ({} as any);
  const signaler = useCallSignaler();

  const pulse = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1.15, duration: 800, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 1, duration: 800, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ])
    ).start();
    if (Platform.OS !== 'web') Vibration.vibrate([0, 600, 400, 600], true);
    return () => {
      Vibration.cancel();
    };
  }, [pulse]);

  const handleAccept = async () => {
    if (!citaId) return;
    await signaler.accept(String(citaId));
    Vibration.cancel();
    navigation.replace('VideoCall', { citaId: String(citaId), initiate: false });
  };

  const handleReject = async () => {
    if (citaId) await signaler.reject(String(citaId), 'rejected_by_user');
    Vibration.cancel();
    if (navigation.canGoBack()) navigation.goBack();
    else navigation.replace('DashboardPaciente');
  };

  return (
    <View style={styles.root}>
      <View style={styles.headerWrap}>
        <Text style={styles.headerLabel}>Videollamada entrante</Text>
        <Text style={styles.headerSub}>{callerRole === 'medico' ? 'Tu medico' : 'Tu paciente'}</Text>
      </View>

      <Animated.View style={[styles.avatarWrap, { transform: [{ scale: pulse }] }]}>
        <View style={styles.avatar}>
          <MaterialIcons name="person" size={70} color="#fff" />
        </View>
      </Animated.View>

      <Text style={styles.callerName}>{callerName || 'Llamada entrante'}</Text>
      <Text style={styles.subtitle}>Cita {String(citaId || '').slice(0, 8)}</Text>

      <View style={styles.actions}>
        <TouchableOpacity onPress={handleReject} style={[styles.actionBtn, styles.reject]}>
          <MaterialIcons name="call-end" size={32} color="#fff" />
          <Text style={styles.actionLabel}>Rechazar</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={handleAccept} style={[styles.actionBtn, styles.accept]}>
          <MaterialIcons name="videocam" size={32} color="#fff" />
          <Text style={styles.actionLabel}>Aceptar</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#0a1931',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 80,
    paddingHorizontal: 32,
  },
  headerWrap: { alignItems: 'center', gap: 4 },
  headerLabel: { color: '#94a8be', fontWeight: '700', fontSize: 13, letterSpacing: 1 },
  headerSub: { color: '#fff', fontWeight: '900', fontSize: 18 },
  avatarWrap: { alignItems: 'center', justifyContent: 'center' },
  avatar: {
    width: 160,
    height: 160,
    borderRadius: 160,
    backgroundColor: 'rgba(19,127,236,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 4,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  callerName: { color: '#fff', fontSize: 22, fontWeight: '900', textAlign: 'center' },
  subtitle: { color: '#94a8be', fontSize: 13, fontWeight: '600' },
  actions: {
    flexDirection: 'row',
    gap: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionBtn: {
    width: 80,
    height: 80,
    borderRadius: 80,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  accept: {
    backgroundColor: '#22c55e',
    shadowColor: '#22c55e',
    shadowOpacity: 0.5,
    shadowRadius: 16,
    elevation: 8,
  },
  reject: {
    backgroundColor: '#dc3545',
    shadowColor: '#dc3545',
    shadowOpacity: 0.5,
    shadowRadius: 16,
    elevation: 8,
  },
  actionLabel: { color: '#fff', fontSize: 11, fontWeight: '800' },
});

export default IncomingCallScreen;
