import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { ScreenScaffold } from '../../components/ScreenScaffold';
import { ResponsiveContainer } from '../../components/ResponsiveContainer';
import { useResponsive } from '../../hooks/useResponsive';
import { RootStackParamList } from '../../navigation/types';
import { requestJson } from '../../utils/api';
import { isValidEmail } from '../../utils/validation';
import { spacing, radii } from '../../theme/spacing';

type NavigationProps = NativeStackNavigationProp<RootStackParamList, 'RecuperarContrasena'>;

const colors = {
  primary: '#4A7FA7',
  backgroundLight: '#F6FAFD',
  textPrimaryLight: '#0A1931',
  textSecondaryLight: '#1A3D63',
  borderLight: '#B3CFE5',
  cardLight: '#FFFFFF',
  placeholder: '#617589',
};

const RecuperarContrasenaScreen: React.FC = () => {
  const [emailOrPhone, setEmailOrPhone] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigation = useNavigation<NavigationProps>();
  const { fs } = useResponsive();

  const handleSendCode = async () => {
    const cleanedEmail = emailOrPhone.toLowerCase().trim();
    if (!cleanedEmail) {
      Alert.alert('Atención', 'Por favor, ingresa tu correo electrónico.');
      return;
    }
    if (!isValidEmail(cleanedEmail)) {
      Alert.alert('Atención', 'Ingresa un correo electrónico válido.');
      return;
    }

    setIsLoading(true);
    try {
      const data = await requestJson<any>('/api/auth/recovery/send-code', {
        method: 'POST',
        body: { email: cleanedEmail },
      });

      if (data?.success) {
        if (__DEV__ && data?.devCode) {
          Alert.alert(
            'Código de desarrollo',
            `Usa este código para continuar la recuperación: ${String(data.devCode)}`
          );
        }
        navigation.navigate('VerificarIdentidad', { email: cleanedEmail });
      } else {
        Alert.alert('Error', data?.message || 'No se pudo enviar el código de recuperación.');
      }
    } catch (error: any) {
      Alert.alert(
        'Error de Conexión',
        error?.message || 'No se pudo contactar al servidor. Intenta de nuevo.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleBackToLogin = () => {
    navigation.navigate('Login', { prefillEmail: emailOrPhone.toLowerCase().trim() });
  };

  return (
    <ScreenScaffold background={colors.backgroundLight} center>
      <ResponsiveContainer maxWidth={420}>
        <View style={styles.cardContainer}>
          <View style={styles.iconWrapper}>
            <MaterialCommunityIcons name="shield-check" size={30} color={colors.primary} />
          </View>

          <View style={styles.headerText}>
            <Text style={[styles.title, { fontSize: fs(20) }]}>Recuperar Contraseña</Text>
            <Text style={[styles.subtitle, { fontSize: fs(13) }]}>
              Ingresa tu correo electrónico asociado a tu cuenta para recibir un código de
              restablecimiento.
            </Text>
          </View>

          <Text style={[styles.labelText, { fontSize: fs(14) }]}>Correo electrónico</Text>
          <View style={styles.inputGroup}>
            <TextInput
              style={[styles.input, { fontSize: fs(15) }]}
              placeholder="ejemplo@correo.com"
              placeholderTextColor={colors.placeholder}
              value={emailOrPhone}
              onChangeText={setEmailOrPhone}
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
              textContentType="emailAddress"
              editable={!isLoading}
              returnKeyType="send"
              onSubmitEditing={handleSendCode}
            />
          </View>

          <TouchableOpacity
            style={[styles.sendCodeButton, isLoading && styles.disabled]}
            onPress={handleSendCode}
            disabled={isLoading}
            activeOpacity={0.85}
            accessibilityRole="button"
          >
            {isLoading ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text style={[styles.buttonText, { fontSize: fs(15) }]}>Enviar código</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity style={styles.backToLoginLink} onPress={handleBackToLogin}>
            <Text style={[styles.backToLoginText, { fontSize: fs(13) }]}>
              Volver al Inicio de Sesión
            </Text>
          </TouchableOpacity>
        </View>
      </ResponsiveContainer>
    </ScreenScaffold>
  );
};

export default RecuperarContrasenaScreen;

const styles = StyleSheet.create({
  cardContainer: {
    width: '100%',
    backgroundColor: colors.cardLight,
    borderRadius: radii.md,
    padding: spacing.xl,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
  },
  iconWrapper: {
    width: 54,
    height: 54,
    borderRadius: radii.pill,
    backgroundColor: '#EAF2FA',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginBottom: spacing.base,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  headerText: { alignItems: 'center', marginBottom: spacing.base },
  title: { color: colors.textPrimaryLight, fontWeight: 'bold', textAlign: 'center' },
  subtitle: {
    color: colors.textSecondaryLight,
    textAlign: 'center',
    marginTop: spacing.xs,
    lineHeight: 18,
  },
  labelText: {
    color: colors.textPrimaryLight,
    fontWeight: '500',
    marginBottom: spacing.xs,
  },
  inputGroup: {
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: colors.borderLight,
    borderRadius: radii.sm,
    minHeight: 48,
    overflow: 'hidden',
    backgroundColor: '#fff',
  },
  input: {
    flex: 1,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    color: colors.textPrimaryLight,
  },
  sendCodeButton: {
    width: '100%',
    minHeight: 48,
    paddingVertical: spacing.md,
    borderRadius: radii.sm,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: spacing.base,
  },
  disabled: { opacity: 0.7 },
  buttonText: { color: 'white', fontWeight: 'bold' },
  backToLoginLink: { marginTop: spacing.base, alignItems: 'center' },
  backToLoginText: {
    color: colors.textSecondaryLight,
    fontWeight: '500',
    textDecorationLine: 'underline',
  },
});
