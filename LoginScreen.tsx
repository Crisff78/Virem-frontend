import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import * as SecureStore from 'expo-secure-store';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { ScreenScaffold } from './components/ScreenScaffold';
import { ResponsiveContainer } from './components/ResponsiveContainer';
import FadeInView from './components/FadeInView';
import { useResponsive } from './hooks/useResponsive';
import { RootStackParamList } from './navigation/types';
import { isValidEmail } from './utils/validation';
import { apiClient } from './utils/api';
import { useAuth } from './providers/AuthProvider';
import { spacing, radii } from './theme/spacing';
import { colors } from './theme/colors';

const ViremLogo = require('./assets/imagenes/descarga.png');
const MEDICO_CACHE_BY_EMAIL_KEY = 'medicoProfileByEmail';

type LoginScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Login'>;



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
  const { fs, isSmallMobile, isTablet } = useResponsive();

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
      Alert.alert('Error', err?.message ?? 'No se pudo iniciar sesión. Intenta de nuevo.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = () => navigation.navigate('RecuperarContrasena');
  const handleGoToRegister = () => navigation.navigate('SeleccionPerfil');

  const cardPadding = isSmallMobile ? spacing.lg : spacing.xxl;

  return (
    <ScreenScaffold
      background={colors.bg}
      center
      contentStyle={{ paddingVertical: spacing.lg }}
    >
      <ResponsiveContainer maxWidth={isTablet ? 480 : 420}>
        <FadeInView style={styles.content}>
          <View style={[styles.card, { padding: cardPadding }]}>
            <View style={styles.logoSectionHorizontal}>
              <Image source={ViremLogo} style={styles.logoSmallOriginal} />
              <Text style={[styles.appNameHorizontal, { fontSize: fs(22) }]} numberOfLines={1}>
                VIREM
              </Text>
            </View>

            <Text style={[styles.title, { fontSize: fs(22) }]}>Accede a tu cuenta</Text>
            <Text style={[styles.subtitle, { fontSize: fs(14) }]}>
              Bienvenido de nuevo. Por favor, introduce tus credenciales.
            </Text>

            <View style={styles.form}>
              <View>
                <Text style={[styles.inputLabel, { fontSize: fs(14) }]}>Correo Electrónico</Text>
                <View style={styles.inputContainer}>
                  <MaterialCommunityIcons
                    name="email-outline"
                    size={22}
                    color={colors.muted}
                    style={styles.inputIcon}
                  />
                  <TextInput
                    style={[styles.input, { fontSize: fs(16) }]}
                    placeholder="tu@email.com"
                    placeholderTextColor="#A0AEC0"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoComplete="email"
                    textContentType="emailAddress"
                    value={email}
                    onChangeText={setEmail}
                    returnKeyType="next"
                  />
                </View>
              </View>

              <View>
                <Text style={[styles.inputLabel, { fontSize: fs(14) }]}>Contraseña</Text>
                <View style={styles.inputContainer}>
                  <MaterialCommunityIcons
                    name="lock-outline"
                    size={22}
                    color={colors.muted}
                    style={styles.inputIcon}
                  />
                  <TextInput
                    style={[styles.input, { fontSize: fs(16) }]}
                    placeholder="Introduce tu contraseña"
                    placeholderTextColor="#A0AEC0"
                    secureTextEntry={!showPassword}
                    autoComplete="password"
                    textContentType="password"
                    value={password}
                    onChangeText={setPassword}
                    returnKeyType="go"
                    onSubmitEditing={handleLogin}
                  />
                  <TouchableOpacity
                    onPress={() => setShowPassword((v) => !v)}
                    style={styles.passwordToggle}
                    accessibilityRole="button"
                    accessibilityLabel={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                  >
                    <MaterialCommunityIcons
                      name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                      size={20}
                      color={colors.muted}
                    />
                  </TouchableOpacity>
                </View>
              </View>

              <TouchableOpacity onPress={handleForgotPassword} style={styles.forgotPasswordLink}>
                <Text style={[styles.linkText, { fontSize: fs(13) }]}>
                  ¿Olvidaste tu contraseña?
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.button, isLoading && styles.buttonDisabled]}
                activeOpacity={0.85}
                onPress={handleLogin}
                disabled={isLoading}
                accessibilityRole="button"
                accessibilityState={{ disabled: isLoading, busy: isLoading }}
              >
                {isLoading ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <Text style={[styles.buttonText, { fontSize: fs(16) }]}>Iniciar Sesión</Text>
                )}
              </TouchableOpacity>
            </View>

            <TouchableOpacity onPress={handleGoToRegister} style={styles.registerLink}>
              <Text style={[styles.registerText, { fontSize: fs(13) }]}>
                ¿No tienes cuenta?{' '}
                <Text style={[styles.linkTextBold, { fontSize: fs(13) }]}>Regístrate</Text>
              </Text>
            </TouchableOpacity>
          </View>
        </FadeInView>
      </ResponsiveContainer>
    </ScreenScaffold>
  );
};

export default LoginScreen;

const styles = StyleSheet.create({
  content: { width: '100%', alignItems: 'center' },
  card: {
    width: '100%',
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 8,
    alignItems: 'center',
  },
  logoSectionHorizontal: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginBottom: spacing.lg,
    flexWrap: 'wrap',
  },
  logoSmallOriginal: {
    width: 30,
    height: 30,
    resizeMode: 'contain',
    marginRight: spacing.sm,
  },
  appNameHorizontal: {
    fontWeight: 'bold',
    color: colors.dark,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  title: {
    fontWeight: 'bold',
    color: colors.dark,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  subtitle: {
    color: colors.muted,
    textAlign: 'center',
    marginBottom: spacing.xxl,
    paddingHorizontal: spacing.sm,
    lineHeight: 20,
  },
  form: { width: '100%', gap: spacing.lg },
  inputLabel: {
    fontWeight: '600',
    color: colors.dark,
    marginBottom: spacing.xs,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 48,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.sm,
    backgroundColor: colors.surface,
  },
  inputIcon: {
    paddingLeft: spacing.md,
    paddingRight: spacing.sm,
  },
  input: {
    flex: 1,
    paddingVertical: Platform.OS === 'web' ? spacing.md : spacing.sm,
    color: colors.dark,
  },
  forgotPasswordLink: {
    alignSelf: 'flex-end',
    paddingVertical: spacing.xs,
    marginTop: -spacing.xs,
  },
  linkText: { color: colors.primary, fontWeight: '600' },
  button: {
    width: '100%',
    minHeight: 48,
    backgroundColor: colors.primary,
    borderRadius: radii.sm,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: spacing.md,
    paddingVertical: spacing.md,
  },
  buttonDisabled: { opacity: 0.7 },
  buttonText: { color: colors.surface, fontWeight: 'bold' },
  registerLink: { marginTop: spacing.lg },
  registerText: { color: colors.muted, textAlign: 'center' },
  linkTextBold: { color: colors.primary, fontWeight: 'bold' },
  passwordToggle: { paddingHorizontal: spacing.md, justifyContent: 'center', minHeight: 48 },
});
