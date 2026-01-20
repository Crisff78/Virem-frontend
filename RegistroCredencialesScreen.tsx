import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React, { useState } from 'react';
import {
  Alert,
  Dimensions,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  ActivityIndicator,
  Image,
  Platform,
} from 'react-native';
import { RootStackParamList } from './App';

type NavigationProps = NativeStackNavigationProp<RootStackParamList, 'RegistroCredenciales'>;
type RegistroRouteProp = RouteProp<RootStackParamList, 'RegistroCredenciales'>;

const { width } = Dimensions.get('window');

// ✅ Logo (tu imagen)
const ViremLogo = require('./assets/imagenes/descarga.png');

const colors = {
  primary: '#137fec',
  backgroundLight: '#F6FAFD',
  navyDark: '#0A1931',
  navyMedium: '#1A3D63',
  blueGray: '#4A7FA7',
  white: '#FFFFFF',
  slate50: '#f8fafc',
};

// ===============================
// 🔌 BACKEND_URL (MUY IMPORTANTE)
// ===============================
// 👉 Si pruebas en PC (Expo Web): usa http://localhost:3000
// 👉 Si pruebas en Android Emulator: usa http://10.0.2.2:3000
// 👉 Si pruebas en celular físico (misma wifi): usa http://TU_IP_PC:3000 (ej: http://10.0.0.135:3000)
//
// NOTA: como tú dices que estás en PC, lo normal es localhost.
// ===============================
const BACKEND_URL =
  Platform.OS === 'web'
    ? 'http://localhost:3000'
    : 'http://10.0.0.135:3000'; // cámbialo según el dispositivo (si es celular)

const RegistroCredencialesScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProps>();
  const route = useRoute<RegistroRouteProp>();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [secureText, setSecureText] = useState(true);
  const [isLoading, setIsLoading] = useState(false);

  // ===============================
  // ✅ Validación simple de email
  // (para evitar emails raros)
  // ===============================
  const isEmailValido = (e: string) => {
    const v = e.toLowerCase().trim();
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
  };

  const handleFinish = async () => {
    // ---------------------------
    // VALIDACIONES FRONTEND
    // ---------------------------
    if (!email || !password || !confirmPassword) {
      Alert.alert('Error', 'Complete todos los campos.');
      return;
    }

    if (!isEmailValido(email)) {
      Alert.alert('Error', 'El correo no tiene un formato válido.');
      return;
    }

    if (password.length < 6) {
      Alert.alert('Error', 'La contraseña debe tener al menos 6 caracteres.');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Error', 'Las contraseñas no coinciden.');
      return;
    }

    setIsLoading(true);

    try {
      // ===============================
      // ✅ API para REGISTRO DE USUARIO
      // Endpoint (Backend): POST /api/auth/register
      //
      // Enviamos:
      // - datos personales (vienen del RegistroPaciente)
      // - email + password (este paso)
      // ===============================
      const bodyCompleto = {
        ...route.params.datosPersonales,
        email: email.toLowerCase().trim(),
        password: password,
      };

      const response = await fetch(`${BACKEND_URL}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bodyCompleto),
      });

      const res = await response.json().catch(() => null);

      if (!response.ok || !res?.success) {
        Alert.alert('Error', res?.message || `Fallo en el servidor (HTTP ${response.status}).`);
        return;
      }

      // ✅ Registro exitoso
      Alert.alert('¡Éxito!', 'Cuenta creada correctamente. Ahora inicia sesión.');
      navigation.replace('Login');
    } catch (error) {
      Alert.alert(
        'Error de Red',
        `No se pudo conectar al servidor.\n\nBackend actual: ${BACKEND_URL}\n\n` +
          `Si estás en PC usa: http://localhost:3000\n` +
          `Si estás en móvil usa: http://TU_IP:3000`
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.mainWrapper}>
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <View style={styles.logoGroup}>
            <Image source={ViremLogo} style={styles.logoImage} />
            <Text style={styles.logoText}>VIREM</Text>
          </View>
        </View>
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
        <View style={styles.contentWrapper}>
          <View style={styles.progressSection}>
            <Text style={styles.progressTitle}>Credenciales de Acceso</Text>
            <View style={styles.progressBarBackground}>
              <View style={styles.progressBarFill} />
            </View>
          </View>

          <View style={styles.formCard}>
            <Text style={styles.cardTitle}>Finalizar Registro</Text>
            <Text style={styles.cardSubtitle}>
              Hola {route.params.datosPersonales.nombres}, crea tu cuenta para acceder.
            </Text>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Correo Electrónico</Text>
              <View style={styles.inputContainer}>
                <MaterialIcons name="email" size={20} color={colors.blueGray} style={{ marginRight: 10 }} />
                <TextInput
                  style={styles.textInput}
                  placeholder="nombre@correo.com"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Contraseña</Text>
              <View style={styles.inputContainer}>
                <MaterialIcons name="lock" size={20} color={colors.blueGray} style={{ marginRight: 10 }} />
                <TextInput
                  style={styles.textInput}
                  placeholder="••••••••"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={secureText}
                />
                <TouchableOpacity onPress={() => setSecureText(!secureText)}>
                  <MaterialIcons name={secureText ? 'visibility' : 'visibility-off'} size={20} color={colors.blueGray} />
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Confirmar Contraseña</Text>
              <View style={styles.inputContainer}>
                <MaterialIcons name="lock" size={20} color={colors.blueGray} style={{ marginRight: 10 }} />
                <TextInput
                  style={styles.textInput}
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry={secureText}
                />
              </View>
            </View>

            <TouchableOpacity style={styles.btnPrimary} onPress={handleFinish} disabled={isLoading}>
              {isLoading ? <ActivityIndicator color="white" /> : <Text style={styles.btnPrimaryText}>Crear Cuenta</Text>}
            </TouchableOpacity>

            <TouchableOpacity style={styles.btnBack} onPress={() => navigation.goBack()}>
              <Text style={styles.btnBackText}>Volver</Text>
            </TouchableOpacity>

            {/* Mini info para no perderte */}
            <Text style={{ marginTop: 14, fontSize: 12, color: colors.blueGray, textAlign: 'center' }}>
              Backend: {BACKEND_URL}
            </Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  mainWrapper: { flex: 1, backgroundColor: colors.backgroundLight },
  header: {
    height: 70,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  headerContent: { flexDirection: 'row', alignItems: 'center' },

  logoGroup: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  logoImage: { width: 42, height: 42, resizeMode: 'contain', borderRadius: 10 },
  logoText: { fontSize: 22, fontWeight: 'bold', color: colors.navyDark },

  contentWrapper: { padding: 20, maxWidth: 500, alignSelf: 'center', width: '100%' },
  progressSection: { marginBottom: 25 },
  progressTitle: { fontSize: 18, fontWeight: 'bold', color: colors.navyDark, marginBottom: 10 },
  progressBarBackground: { height: 8, backgroundColor: '#e2e8f0', borderRadius: 4, overflow: 'hidden' },
  progressBarFill: { height: '100%', width: '100%', backgroundColor: colors.primary },

  formCard: { backgroundColor: 'white', borderRadius: 20, padding: 25, elevation: 5 },
  cardTitle: { fontSize: 24, fontWeight: 'bold', color: colors.navyDark, textAlign: 'center', marginBottom: 10 },
  cardSubtitle: { fontSize: 15, color: colors.blueGray, textAlign: 'center', marginBottom: 25 },

  inputGroup: { marginBottom: 20 },
  label: { fontSize: 14, fontWeight: '600', color: colors.navyDark, marginBottom: 8 },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 50,
    backgroundColor: colors.slate50,
  },
  textInput: { flex: 1, fontSize: 16, color: colors.navyDark },

  btnPrimary: {
    backgroundColor: colors.primary,
    height: 55,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
  },
  btnPrimaryText: { color: 'white', fontSize: 16, fontWeight: 'bold' },

  btnBack: { marginTop: 20, alignItems: 'center' },
  btnBackText: { color: colors.blueGray, fontWeight: '600' },
});

export default RegistroCredencialesScreen;
