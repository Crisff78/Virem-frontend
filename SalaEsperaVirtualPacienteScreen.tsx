import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
} from 'react-native';
import type { ImageSourcePropType } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from './navigation/types';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

const ViremLogo = require('./assets/imagenes/descarga.png');
const DefaultAvatar = require('./assets/imagenes/avatar-default.jpg');

const DoctorAvatar: ImageSourcePropType = { uri: 'https://i.pravatar.cc/220?img=13' };
const CameraPreview: ImageSourcePropType = { uri: 'https://i.pravatar.cc/420?img=50' };

const SalaEsperaVirtualPacienteScreen: React.FC = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [cameraOn, setCameraOn] = useState(true);
  const [micOn, setMicOn] = useState(true);
  const dot1 = useRef(new Animated.Value(0.25)).current;
  const dot2 = useRef(new Animated.Value(0.25)).current;
  const dot3 = useRef(new Animated.Value(0.25)).current;
  const signalPulse = useRef(new Animated.Value(0.35)).current;

  useEffect(() => {
    const makePulse = (value: Animated.Value, delay: number) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(value, {
            toValue: 1,
            duration: 260,
            useNativeDriver: true,
          }),
          Animated.timing(value, {
            toValue: 0.25,
            duration: 260,
            useNativeDriver: true,
          }),
          Animated.delay(380),
        ])
      );

    const animation = Animated.parallel([
      makePulse(dot1, 0),
      makePulse(dot2, 140),
      makePulse(dot3, 280),
      makePulse(signalPulse, 0),
    ]);

    animation.start();
    return () => animation.stop();
  }, [dot1, dot2, dot3, signalPulse]);

  return (
    <View style={styles.container}>
      <View style={styles.sidebar}>
        <View>
          <View style={styles.logoBox}>
            <Image source={ViremLogo} style={styles.logo} />
            <View>
              <Text style={styles.logoTitle}>VIREM</Text>
              <Text style={styles.logoSubtitle}>Portal Paciente</Text>
            </View>
          </View>

          <View style={styles.menu}>
            <TouchableOpacity style={styles.menuItem} onPress={() => navigation.navigate('DashboardPaciente')}>
              <MaterialIcons name="grid-view" size={20} color={colors.muted} />
              <Text style={styles.menuText}>Inicio</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.menuItem}>
              <MaterialIcons name="person-search" size={20} color={colors.muted} />
              <Text style={styles.menuText}>Buscar Médico</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.menuItem}>
              <MaterialIcons name="calendar-today" size={20} color={colors.muted} />
              <Text style={styles.menuText}>Mis Citas</Text>
            </TouchableOpacity>

            <TouchableOpacity style={[styles.menuItem, styles.menuItemActive]}>
              <MaterialIcons name="videocam" size={20} color={colors.primary} />
              <Text style={[styles.menuText, styles.menuTextActive]}>Videollamada activa</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => navigation.navigate('PacienteRecetasDocumentos')}
            >
              <MaterialIcons name="description" size={20} color={colors.muted} />
              <Text style={styles.menuText}>Recetas / Documentos</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.menuItem} onPress={() => navigation.navigate('PacientePerfil')}>
              <MaterialIcons name="account-circle" size={20} color={colors.muted} />
              <Text style={styles.menuText}>Perfil</Text>
            </TouchableOpacity>
          </View>
        </View>

        <TouchableOpacity style={styles.exitBtn} onPress={() => navigation.navigate('DashboardPaciente')}>
          <MaterialIcons name="logout" size={18} color="#fff" />
          <Text style={styles.exitBtnText}>Salir</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.main}>
        <View style={styles.topBar}>
          <View style={styles.liveTag}>
            <Animated.View style={{ opacity: signalPulse }}>
              <MaterialIcons name="sensors" size={17} color={colors.primary} />
            </Animated.View>
            <Text style={styles.liveTagText}>SALA DE ESPERA VIRTUAL</Text>
          </View>

          <View style={styles.connectedBadge}>
            <View style={styles.connectedDot} />
            <Text style={styles.connectedText}>CONECTADO</Text>
          </View>
        </View>

        <View style={styles.contentWrap}>
          <View style={styles.centerCol}>
            <View style={styles.doctorAvatarWrap}>
              <Image source={DoctorAvatar} style={styles.doctorAvatar} />
              <View style={styles.verifiedBadge}>
                <MaterialIcons name="verified" size={14} color="#fff" />
              </View>
            </View>

            <Text style={styles.waitTitle}>El Dr. Alejandro García se unirá pronto a la sesión</Text>
            <View style={styles.waitDotsRow}>
              <Animated.Text style={[styles.waitDot, { opacity: dot1 }]}>•</Animated.Text>
              <Animated.Text style={[styles.waitDot, { opacity: dot2 }]}>•</Animated.Text>
              <Animated.Text style={[styles.waitDot, { opacity: dot3 }]}>•</Animated.Text>
            </View>
            <Text style={styles.waitSub}>En espera...</Text>

            <Text style={styles.waitHint}>
              Por favor, no cierres esta ventana. Se te notificará con un sonido cuando el doctor esté listo.
            </Text>
          </View>

          <View style={styles.rightCol}>
            <View style={styles.summaryCard}>
              <Text style={styles.summaryTitle}>RESUMEN DE LA CITA</Text>

              <View style={styles.summaryRow}>
                <MaterialIcons name="medical-services" size={16} color={colors.primary} />
                <View>
                  <Text style={styles.summaryLabel}>Doctor</Text>
                  <Text style={styles.summaryValue}>Dr. Alejandro García</Text>
                </View>
              </View>

              <View style={styles.summaryRow}>
                <MaterialCommunityIcons name="heart-pulse" size={16} color={colors.primary} />
                <View>
                  <Text style={styles.summaryLabel}>Especialidad</Text>
                  <Text style={styles.summaryValue}>Cardiología Clínica</Text>
                </View>
              </View>

              <View style={[styles.summaryRow, styles.summaryRowLast]}>
                <MaterialIcons name="schedule" size={16} color={colors.primary} />
                <View>
                  <Text style={styles.summaryLabel}>Hora programada</Text>
                  <Text style={styles.summaryValue}>Hoy, 16:30 PM</Text>
                </View>
              </View>
            </View>

            <View style={styles.cameraCard}>
              <Image source={CameraPreview} style={styles.cameraImage} />
              <View style={styles.cameraTag}>
                <Text style={styles.cameraTagText}>TU CÁMARA</Text>
              </View>

              <View style={styles.cameraControls}>
                <TouchableOpacity style={styles.cameraControl} onPress={() => setMicOn((v) => !v)}>
                  <MaterialIcons name={micOn ? 'mic' : 'mic-off'} size={18} color="#fff" />
                </TouchableOpacity>
                <TouchableOpacity style={styles.cameraControl} onPress={() => setCameraOn((v) => !v)}>
                  <MaterialIcons name={cameraOn ? 'videocam' : 'videocam-off'} size={18} color="#fff" />
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.bottomActions}>
              <TouchableOpacity style={styles.settingsBtn}>
                <MaterialIcons name="settings" size={15} color={colors.primary} />
                <Text style={styles.settingsBtnText}>Ajustes</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.leaveBtn} onPress={() => navigation.navigate('DashboardPaciente')}>
                <MaterialIcons name="call-end" size={15} color="#ef4444" />
                <Text style={styles.leaveBtnText}>Salir</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Sesión Privada y Encriptada</Text>
          <Text style={styles.footerText}>Soporte: 0-800-VIREM</Text>
        </View>
      </View>
    </View>
  );
};

const colors = {
  bg: '#F6FAFD',
  dark: '#0A1931',
  primary: '#137fec',
  blue: '#1A3D63',
  muted: '#4A7FA7',
  light: '#B3CFE5',
  white: '#FFFFFF',
};

const styles = StyleSheet.create({
  container: { flex: 1, flexDirection: 'row', backgroundColor: colors.bg },
  sidebar: {
    width: 280,
    backgroundColor: colors.white,
    borderRightWidth: 1,
    borderRightColor: '#eef2f7',
    padding: 20,
    justifyContent: 'space-between',
  },
  logoBox: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  logo: { width: 44, height: 44, resizeMode: 'contain' },
  logoTitle: { fontSize: 20, fontWeight: '800', color: colors.dark, letterSpacing: 0.5 },
  logoSubtitle: { fontSize: 11, fontWeight: '700', color: colors.muted },
  menu: { marginTop: 18, gap: 6 },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderRadius: 12,
  },
  menuItemActive: {
    backgroundColor: 'rgba(19,127,236,0.10)',
    borderRightWidth: 3,
    borderRightColor: colors.primary,
  },
  menuText: { fontSize: 14, fontWeight: '700', color: colors.muted },
  menuTextActive: { color: colors.primary },
  exitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: 12,
    backgroundColor: colors.blue,
    paddingVertical: 12,
  },
  exitBtnText: { color: '#fff', fontWeight: '800' },
  main: { flex: 1 },
  topBar: {
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e7eff7',
    paddingHorizontal: 22,
    paddingVertical: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  liveTag: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  liveTagText: { fontSize: 14, fontWeight: '900', color: colors.muted, letterSpacing: 0.8 },
  connectedBadge: {
    backgroundColor: '#dcfce7',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  connectedDot: { width: 8, height: 8, borderRadius: 8, backgroundColor: '#22c55e' },
  connectedText: { color: '#16a34a', fontWeight: '800', fontSize: 11 },
  contentWrap: {
    flex: 1,
    flexDirection: 'row',
    gap: 18,
    paddingHorizontal: 22,
    paddingTop: 16,
    paddingBottom: 10,
  },
  centerCol: {
    flex: 1.4,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  doctorAvatarWrap: {
    width: 92,
    height: 92,
    borderRadius: 92,
    borderWidth: 4,
    borderColor: '#d8e8f7',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    position: 'relative',
  },
  doctorAvatar: { width: 78, height: 78, borderRadius: 78 },
  verifiedBadge: {
    position: 'absolute',
    right: -2,
    bottom: -2,
    width: 26,
    height: 26,
    borderRadius: 26,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: colors.bg,
  },
  waitTitle: {
    color: colors.blue,
    fontSize: 22,
    lineHeight: 30,
    fontWeight: '900',
    textAlign: 'center',
    maxWidth: 420,
  },
  waitDotsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    marginTop: 6,
    marginBottom: 2,
  },
  waitDot: {
    color: colors.primary,
    fontSize: 18,
    fontWeight: '900',
    lineHeight: 20,
  },
  waitSub: { color: colors.muted, fontSize: 16, fontStyle: 'italic', fontWeight: '600' },
  waitHint: {
    marginTop: 16,
    color: colors.muted,
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
    maxWidth: 380,
  },
  rightCol: { width: 360, justifyContent: 'space-between' },
  summaryCard: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#cfe0ee',
    borderRadius: 16,
    padding: 16,
  },
  summaryTitle: { fontSize: 13, fontWeight: '900', letterSpacing: 1, color: colors.muted, marginBottom: 12 },
  summaryRow: { flexDirection: 'row', gap: 10, marginBottom: 12, alignItems: 'flex-start' },
  summaryRowLast: { marginBottom: 0, paddingTop: 10, borderTopWidth: 1, borderTopColor: '#e9f1f8' },
  summaryLabel: { color: colors.muted, fontSize: 12, fontWeight: '600' },
  summaryValue: { color: colors.dark, fontSize: 16, fontWeight: '900', marginTop: 2 },
  cameraCard: {
    marginTop: 16,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#d5e4f1',
    borderRadius: 14,
    overflow: 'hidden',
    position: 'relative',
  },
  cameraImage: { width: '100%', height: 175 },
  cameraTag: {
    position: 'absolute',
    top: 8,
    left: 8,
    borderRadius: 999,
    backgroundColor: 'rgba(0,0,0,0.48)',
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  cameraTagText: { color: '#fff', fontSize: 9, fontWeight: '800', letterSpacing: 0.5 },
  cameraControls: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 8,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  cameraControl: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  bottomActions: { flexDirection: 'row', gap: 10, marginTop: 12 },
  settingsBtn: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#cfe0ee',
    borderRadius: 10,
    paddingVertical: 9,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    gap: 6,
    backgroundColor: '#fff',
  },
  settingsBtnText: { color: colors.primary, fontWeight: '700', fontSize: 12 },
  leaveBtn: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#fecaca',
    borderRadius: 10,
    paddingVertical: 9,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    gap: 6,
    backgroundColor: '#fff',
  },
  leaveBtnText: { color: '#ef4444', fontWeight: '700', fontSize: 12 },
  footer: {
    height: 40,
    borderTopWidth: 1,
    borderTopColor: '#e7eff7',
    backgroundColor: '#f2f8ff',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 18,
  },
  footerText: { color: colors.muted, fontSize: 11, fontWeight: '700' },
});

export default SalaEsperaVirtualPacienteScreen;
