import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
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
import { LinearGradient } from 'expo-linear-gradient';
import FadeInView from './components/FadeInView';
import ViremImage from './components/ViremImage';

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
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
      
      <LinearGradient
        colors={['#1F4770', '#0A1931']}
        style={StyleSheet.absoluteFill}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />

      <View style={styles.container}>
        <FadeInView style={styles.content}>
          <View style={[styles.card, { padding: select({ mobile: 24, tablet: 32, desktop: 40 }) }]}>
            <View style={styles.logoSectionHorizontal}>
              <ViremImage source={ViremLogo} style={styles.logoSmallOriginal} />
              <Text style={styles.appNameHorizontal}>VIREM</Text>
            </View>

            <Text style={styles.title}>¡Hola de nuevo!</Text>
            <Text style={styles.subtitle}>
              Introduce tus credenciales para acceder a tu portal de salud.
            </Text>

            <View style={styles.form}>
              <View>
                <Text style={styles.inputLabel}>Correo Electrónico</Text>
                <View style={styles.inputContainer}>
                  <MaterialCommunityIcons
                    name="email-outline"
                    size={20}
                    color={COLORS.iconColor}
                    style={styles.inputIcon}
                  />
                  <TextInput
                    style={styles.input}
                    placeholder="ejemplo@virem.com"
                    placeholderTextColor="#A0AEC0"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    value={email}
                    onChangeText={setEmail}
                  />
                </View>
              </View>

              <View>
                <Text style={styles.inputLabel}>Contraseña</Text>
                <View style={styles.inputContainer}>
                  <MaterialCommunityIcons
                    name="lock-outline"
                    size={20}
                    color={COLORS.iconColor}
                    style={styles.inputIcon}
                  />
                  <TextInput
                    style={styles.input}
                    placeholder="••••••••"
                    placeholderTextColor="#A0AEC0"
                    secureTextEntry={!showPassword}
                    value={password}
                    onChangeText={setPassword}
                  />
                  <TouchableOpacity onPress={() => setShowPassword(v => !v)} style={styles.passwordToggle}>
                    <MaterialCommunityIcons
                      name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                      size={20}
                      color={COLORS.iconColor}
                    />
                  </TouchableOpacity>
                </View>
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
                {isLoading ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <Text style={styles.buttonText}>Iniciar Sesión</Text>
                )}
              </TouchableOpacity>
            </View>

            <View style={styles.footer}>
              <Text style={styles.registerText}>
                ¿Nuevo en VIREM?{' '}
                <Text style={styles.linkTextBold} onPress={handleGoToRegister}>
                  Crea una cuenta
                </Text>
              </Text>
            </View>
          </View>
        </FadeInView>
      </View>
    </View>
  );
};

export default LoginScreen;

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  container: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  content: { width: '100%', alignItems: 'center', paddingHorizontal: 20 },
  card: {
    width: '100%',
    maxWidth: 450,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 32,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.2,
    shadowRadius: 30,
    elevation: 10,
    alignItems: 'center',
  },
  logoSectionHorizontal: { flexDirection: 'row', alignItems: 'center', marginBottom: 24 },
  logoSmallOriginal: { width: 40, height: 40, marginRight: 12 },
  appNameHorizontal: {
    fontSize: 26,
    fontWeight: '900',
    color: '#1F4770',
    letterSpacing: 2,
  },
  title: { fontSize: 28, fontWeight: '900', color: '#1A202C', textAlign: 'center', marginBottom: 8 },
  subtitle: { fontSize: 15, color: '#718096', textAlign: 'center', marginBottom: 32, lineHeight: 22 },
  form: { width: '100%', gap: 18 },
  inputLabel: { fontSize: 13, fontWeight: '700', color: '#4A5568', marginBottom: 8, marginLeft: 4, textTransform: 'uppercase', letterSpacing: 0.5 },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 56,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: 16,
    backgroundColor: '#F7FAFC',
    paddingHorizontal: 12,
  },
  inputIcon: { marginRight: 10 },
  input: { flex: 1, fontSize: 16, color: '#2D3748', fontWeight: '500' },
  forgotPasswordLink: { alignSelf: 'flex-end', paddingVertical: 5 },
  linkText: { color: '#3182CE', fontSize: 14, fontWeight: '700' },
  button: { 
    width: '100%', 
    height: 56, 
    backgroundColor: '#1F4770', 
    borderRadius: 16, 
    justifyContent: 'center', 
    alignItems: 'center', 
    marginTop: 10,
    shadowColor: '#1F4770',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 15,
  },
  buttonText: { color: '#FFFFFF', fontSize: 18, fontWeight: '900' },
  footer: { marginTop: 32, borderTopWidth: 1, borderTopColor: '#EDF2F7', width: '100%', paddingTop: 24, alignItems: 'center' },
  registerText: { fontSize: 15, color: '#718096', fontWeight: '500' },
  linkTextBold: { color: '#3182CE', fontWeight: '800' },
  passwordToggle: { paddingLeft: 10, justifyContent: 'center' as const },
});
