import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  TextInput,
  Image,
  Alert,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { useResponsive } from './hooks/useResponsive';

import { useNavigation, useRoute } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import * as SecureStore from 'expo-secure-store';

import { RootStackParamList } from './navigation/types';
import { isValidEmail } from './utils/validation';
import { apiClient } from './utils/api';
import { useAuth } from './providers/AuthProvider';

import { MaterialCommunityIcons } from '@expo/vector-icons';

const ViremLogo = require('./assets/imagenes/descarga.png');
const MEDICO_CACHE_BY_EMAIL_KEY = 'medicoProfileByEmail';

type LoginScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Login'>;

const COLORS = {
  primary: '#1F4770',
  backgroundLight: '#F3F6F9',
  textPrimary: '#1A1A1A',
  textSecondary: '#666666',
  borderLight: '#E0E0E0',
  cardLight: '#FFFFFF',
  link: '#1F4770',
  iconColor: '#888888',
};

async function getCachedMedicoProfileByEmail(email: string) {
  const key = String(email || '').trim().toLowerCase();
  if (!key) return null;

  try {
    const rawMap =
      Platform.OS === 'web'
        ? localStorage.getItem(MEDICO_CACHE_BY_EMAIL_KEY)
        : await SecureStore.getItemAsync(MEDICO_CACHE_BY_EMAIL_KEY);

    if (!rawMap) return null;
    const map = JSON.parse(rawMap) as Record<
      string,
      {
        nombreCompleto?: string;
        especialidad?: string;
        fotoUrl?: string;
        cedula?: string;
        telefono?: string;
        genero?: string;
        fechanacimiento?: string;
      }
    >;
    return map[key] || null;
  } catch {
    return null;
  }
}

const LoginScreen: React.FC = () => {
  const navigation = useNavigation<LoginScreenNavigationProp>();
  const route = useRoute<RouteProp<RootStackParamList, 'Login'>>();
  const { signIn } = useAuth<any>();

  const [email, setEmail] = useState(route.params?.prefillEmail ?? '');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async () => {
    const emailTrim = email.toLowerCase().trim();

    if (!emailTrim || !password) {
      Alert.alert('Error', 'Completa correo y contraseña.');
      return;
    }

    if (!isValidEmail(emailTrim)) {
      Alert.alert('Error', 'El correo no tiene un formato válido.');
      return;
    }

    setIsLoading(true);

    try {
      const data = await apiClient.post<any>('/api/auth/login', {
        body: { email: emailTrim, password },
      });

      const token = data?.token ?? data?.data?.token ?? '';
      const userProfile = data?.user ?? data?.data?.user ?? null;
      const cachedMedico = await getCachedMedicoProfileByEmail(emailTrim);
      const responseRoleId = Number(userProfile?.rolid ?? userProfile?.rolId ?? userProfile?.roleId);
      const shouldMergeMedicoCache = responseRoleId === 2;
      const mergedProfile =
        shouldMergeMedicoCache && cachedMedico && userProfile
          ? {
            ...userProfile,
            nombreCompleto: userProfile?.nombreCompleto || cachedMedico?.nombreCompleto,
            especialidad: userProfile?.especialidad || cachedMedico?.especialidad,
            fotoUrl: userProfile?.fotoUrl || cachedMedico?.fotoUrl,
            cedula: userProfile?.cedula || cachedMedico?.cedula,
            telefono: userProfile?.telefono || cachedMedico?.telefono,
            genero: userProfile?.genero || cachedMedico?.genero,
            fechanacimiento: userProfile?.fechanacimiento || cachedMedico?.fechanacimiento,
          }
          : userProfile;

      await signIn(token, mergedProfile);
      const rolid = Number(mergedProfile?.rolid);
      const targetRoute: keyof RootStackParamList =
        rolid === 3 ? 'AdminPanel' : rolid === 2 ? 'DashboardMedico' : 'DashboardPaciente';

      navigation.reset({ index: 0, routes: [{ name: targetRoute }] });

    } catch (err: any) {
      Alert.alert(
        'Error',
        err?.message ?? 'No se pudo iniciar sesión. Intenta de nuevo.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = () => navigation.navigate('RecuperarContrasena');
  const handleGoToRegister = () => navigation.navigate('SeleccionPerfil');

  const { isDesktop, isTablet, isMobile, select } = useResponsive();

  return (
    <View style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.backgroundLight} />

      <View style={styles.container}>
        <View style={[styles.card, { padding: select({ mobile: 20, tablet: 30, desktop: 40 }) }]}>
          <View style={styles.logoSectionHorizontal}>
            <Image source={ViremLogo} style={styles.logoSmallOriginal} />
            <Text style={styles.appNameHorizontal}>VIREM</Text>
          </View>

          <Text style={styles.title}>Accede a tu cuenta</Text>
          <Text style={styles.subtitle}>
            Bienvenido de nuevo. Por favor, introduce tus credenciales.
          </Text>

          <View style={styles.form}>
            <Text style={styles.inputLabel}>Correo Electrónico</Text>
            <View style={styles.inputContainer}>
              <MaterialCommunityIcons
                name="email-outline"
                size={22}
                color={COLORS.iconColor}
                style={styles.inputIcon}
              />
              <TextInput
                style={styles.input}
                placeholder="tu@email.com"
                keyboardType="email-address"
                autoCapitalize="none"
                value={email}
                onChangeText={setEmail}
              />
            </View>

            <Text style={styles.inputLabel}>Contraseña</Text>
            <View style={styles.inputContainer}>
              <MaterialCommunityIcons
                name="lock-outline"
                size={22}
                color={COLORS.iconColor}
                style={styles.inputIcon}
              />
              <TextInput
                style={styles.input}
                placeholder="Introduce tu contraseña"
                secureTextEntry={!showPassword}
                value={password}
                onChangeText={setPassword}
              />
              <TouchableOpacity onPress={() => setShowPassword(v => !v)} style={styles.passwordToggle}>
                <MaterialCommunityIcons
                  name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                  size={22}
                  color={COLORS.iconColor}
                />
              </TouchableOpacity>
            </View>

            <TouchableOpacity onPress={handleForgotPassword} style={styles.forgotPasswordLink}>
              <Text style={styles.linkText}>¿Olvidaste tu contraseña?</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, { opacity: isLoading ? 0.7 : 1 }]}
              activeOpacity={0.8}
              onPress={handleLogin}
              disabled={isLoading}
            >
              {isLoading ? <ActivityIndicator color="white" /> : <Text style={styles.buttonText}>Iniciar Sesión</Text>}
            </TouchableOpacity>
          </View>

          <TouchableOpacity onPress={handleGoToRegister} style={styles.registerLink}>
            <Text style={styles.registerText}>
              ¿No tienes cuenta? <Text style={styles.linkTextBold}>Regístrate</Text>
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

export default LoginScreen;

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: COLORS.backgroundLight },
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 20 },
  card: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: COLORS.cardLight,
    borderRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 8,
    alignItems: 'center',
  },
  logoSectionHorizontal: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  logoSmallOriginal: { width: 30, height: 30, resizeMode: 'contain', marginRight: 8 },
  appNameHorizontal: {
    fontSize: 22,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  title: { fontSize: 24, fontWeight: 'bold', color: COLORS.textPrimary, textAlign: 'center', marginBottom: 8 },
  subtitle: { fontSize: 14, color: COLORS.textSecondary, textAlign: 'center', marginBottom: 30, paddingHorizontal: 10 },
  form: { width: '100%', gap: 20 },
  inputLabel: { fontSize: 14, fontWeight: '600', color: COLORS.textPrimary, marginBottom: 5 },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 48,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    borderRadius: 8,
    backgroundColor: COLORS.cardLight,
  },
  inputIcon: { paddingLeft: 12, paddingRight: 8 },
  input: { flex: 1, fontSize: 16, color: COLORS.textPrimary },
  forgotPasswordLink: { alignSelf: 'flex-end', paddingVertical: 5, marginTop: -5 },
  linkText: { color: COLORS.link, fontSize: 14, fontWeight: '600' },
  button: { width: '100%', height: 48, backgroundColor: COLORS.primary, borderRadius: 8, justifyContent: 'center', alignItems: 'center', marginTop: 15 },
  buttonText: { color: COLORS.cardLight, fontSize: 18, fontWeight: 'bold' },
  registerLink: { marginTop: 20 },
  registerText: { fontSize: 14, color: COLORS.textSecondary },
  linkTextBold: { color: COLORS.link, fontSize: 14, fontWeight: 'bold' },
  passwordToggle: { paddingRight: 12, justifyContent: 'center' as const },
});

