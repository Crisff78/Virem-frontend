import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  TextInput,
  Image,
  Alert,
  ActivityIndicator,
} from 'react-native';

import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from './App';

import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

const ViremLogo = require('./assets/imagenes/descarga.png');

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

// ===============================
// 🔌 URL DEL BACKEND (IMPORTANTE)
// - Si pruebas en PC (Expo Web): http://localhost:3000
// - Si pruebas en Android Emulator: http://10.0.2.2:3000
// - Si pruebas en celular físico (misma wifi): http://TU_IP_PC:3000 (ej 10.0.0.135)
// ===============================
const BACKEND_URL = 'http://localhost:3000';

// ===============================
// API: Login (backend)
// Endpoint: POST /api/auth/login
// ===============================
async function apiLogin(email: string, password: string) {
  const res = await fetch(`${BACKEND_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: email.toLowerCase().trim(),
      password,
    }),
  });

  const data = await res.json().catch(() => null);

  if (!res.ok || !data?.success) {
    throw new Error(data?.message || `Error en login (HTTP ${res.status})`);
  }

  // data.token debe venir del backend
  return data as { success: true; token: string; user: { id: number; email: string; pacienteId: number } };
}

const LoginScreen: React.FC = () => {
  const navigation = useNavigation<LoginScreenNavigationProp>();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Error', 'Completa correo y contraseña.');
      return;
    }

    setIsLoading(true);
    try {
      const result = await apiLogin(email, password);

      // ✅ Aquí ya tienes el token.
      // Si luego quieres guardarlo (AsyncStorage) para mantener sesión, lo hacemos.
      console.log('TOKEN:', result.token);
      console.log('USER:', result.user);

      Alert.alert('✅ Bienvenido', 'Inicio de sesión correcto.');

      // ✅ Cambia esto a tu pantalla real después de login (ej. "Home")
      // Si todavía no tienes Home, lo dejamos en Login por ahora o navega a donde sea.
      // navigation.replace('Home');

    } catch (err: any) {
      Alert.alert('Error', err?.message || 'No se pudo iniciar sesión.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = () => {
    navigation.navigate('RecuperarContrasena');
  };

  const handleGoToRegister = () => {
    navigation.navigate('SeleccionPerfil');
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.backgroundLight} />

      <View style={styles.container}>
        <View style={styles.card}>
          <View style={styles.logoSectionHorizontal}>
            <Image source={ViremLogo} style={styles.logoSmallOriginal} accessibilityLabel="Logo VIREM" />
            <Text style={styles.appNameHorizontal}>VIREM</Text>
          </View>

          <Text style={styles.title}>Accede a tu cuenta</Text>
          <Text style={styles.subtitle}>Bienvenido de nuevo. Por favor, introduce tus credenciales.</Text>

          <View style={styles.form}>
            <Text style={styles.inputLabel}>Correo Electrónico</Text>
            <View style={styles.inputContainer}>
              <MaterialCommunityIcons name="email-outline" size={22} color={COLORS.iconColor} style={styles.inputIcon} />
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
              <MaterialCommunityIcons name="lock-outline" size={22} color={COLORS.iconColor} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Introduce tu contraseña"
                secureTextEntry
                value={password}
                onChangeText={setPassword}
              />
            </View>

            <TouchableOpacity onPress={handleForgotPassword} style={styles.forgotPasswordLink}>
              <Text style={styles.linkText}>¿Olvidaste tu contraseña?</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.button} activeOpacity={0.8} onPress={handleLogin} disabled={isLoading}>
              {isLoading ? <ActivityIndicator color="white" /> : <Text style={styles.buttonText}>Iniciar Sesión</Text>}
            </TouchableOpacity>
          </View>

          <TouchableOpacity onPress={handleGoToRegister} style={styles.registerLink}>
            <Text style={styles.registerText}>
              ¿No tienes cuenta? <Text style={styles.linkTextBold}>Regístrate</Text>
            </Text>
          </TouchableOpacity>

          {/* Ayudita visual para no perderte con la URL */}
          <Text style={{ marginTop: 14, fontSize: 12, color: COLORS.textSecondary, textAlign: 'center' }}>
            Backend: {BACKEND_URL}
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: COLORS.backgroundLight },
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 20 },
  card: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: COLORS.cardLight,
    borderRadius: 16,
    padding: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 8,
    alignItems: 'center',
  },

  logoSectionHorizontal: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: 20 },
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

  form: { width: '100%', gap: 14 },
  inputLabel: { fontSize: 14, fontWeight: '600', color: COLORS.textPrimary, marginBottom: 5 },

  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 48,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    borderRadius: 8,
    backgroundColor: COLORS.cardLight,
    paddingHorizontal: 0,
    marginBottom: 10,
  },

  inputIcon: { paddingLeft: 12, paddingRight: 8 },
  input: { flex: 1, paddingHorizontal: 0, fontSize: 16, color: COLORS.textPrimary },

  forgotPasswordLink: { alignSelf: 'flex-end', paddingVertical: 5, marginTop: -5 },
  linkText: { color: COLORS.link, fontSize: 14, fontWeight: '600' },

  button: {
    width: '100%',
    height: 48,
    backgroundColor: COLORS.primary,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
  },

  buttonText: { color: COLORS.cardLight, fontSize: 18, fontWeight: 'bold' },

  registerLink: { marginTop: 20 },
  registerText: { fontSize: 14, color: COLORS.textSecondary },
  linkTextBold: { color: COLORS.link, fontSize: 14, fontWeight: 'bold' },
});

export default LoginScreen;
