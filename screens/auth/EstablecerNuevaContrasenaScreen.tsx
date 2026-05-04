import React, { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { ScreenScaffold } from '../../components/ScreenScaffold';
import { ResponsiveContainer } from '../../components/ResponsiveContainer';
import { useResponsive } from '../../hooks/useResponsive';
import { RootStackParamList } from '../../navigation/types';
import { requestJson } from '../../utils/api';
import { spacing, radii } from '../../theme/spacing';

type NavigationProps = NativeStackNavigationProp<RootStackParamList, 'EstablecerNuevaContrasena'>;
type RouteProps = RouteProp<RootStackParamList, 'EstablecerNuevaContrasena'>;

const ViremLogo = require('../../assets/imagenes/descarga.png');

const colors = {
  primary: '#4A7FA7',
  backgroundLight: '#F6FAFD',
  textPrimary: '#0A1931',
  textSecondary: '#1A3D63',
  borderColor: '#B3CFE5',
  cardLight: '#FFFFFF',
  placeholder: '#9ca3af',
};

const EstablecerNuevaContrasenaScreen: React.FC = () => {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [isConfirmPasswordVisible, setIsConfirmPasswordVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const navigation = useNavigation<NavigationProps>();
  const route = useRoute<RouteProps>();
  const email = route.params?.email;
  const { fs } = useResponsive();

  const checkRule = (rule: string) => {
    if (!newPassword) return false;
    switch (rule) {
      case 'min8':
        return newPassword.length >= 8;
      case 'uppercase':
        return /[A-Z]/.test(newPassword);
      case 'number':
        return /[0-9]/.test(newPassword);
      case 'special':
        return /[!@#$%^&*(),.?":{}|<>]/.test(newPassword);
      default:
        return false;
    }
  };

  const rules = useMemo(
    () => [
      { key: 'min8', label: 'Mínimo 8 caracteres' },
      { key: 'uppercase', label: 'Una mayúscula (A-Z)' },
      { key: 'number', label: 'Un número (0-9)' },
      { key: 'special', label: 'Un símbolo (!@#…)' },
    ],
    []
  );

  const handlePasswordReset = async () => {
    if (!email) {
      Alert.alert('Error', 'No se encontró el correo para actualizar la contraseña.');
      return;
    }
    if (newPassword !== confirmPassword) {
      Alert.alert('Error', 'Las contraseñas no coinciden.');
      return;
    }
    if (
      newPassword.length < 8 ||
      !checkRule('uppercase') ||
      !checkRule('number') ||
      !checkRule('special')
    ) {
      Alert.alert('Seguridad', 'La contraseña no cumple con los requisitos.');
      return;
    }

    setIsLoading(true);
    try {
      const data = await requestJson<any>('/api/auth/recovery/reset-password', {
        method: 'POST',
        body: { email: email?.toLowerCase().trim(), newPassword },
      });
      if (data?.success) {
        Alert.alert('Éxito', 'Contraseña actualizada. Ya puedes iniciar sesión.');
        navigation.navigate('Login');
      } else {
        Alert.alert('Error', data?.message || 'No se pudo actualizar.');
      }
    } catch (error: any) {
      Alert.alert('Error', error?.message || 'No hay conexión con el servidor.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleBackToLogin = () => navigation.navigate('Login');

  return (
    <ScreenScaffold background={colors.backgroundLight} center>
      <ResponsiveContainer maxWidth={460}>
        <View style={styles.cardContainer}>
          <View style={styles.logoWrapper}>
            <Image source={ViremLogo} style={styles.logoImage} />
            <Text style={[styles.logoText, { fontSize: fs(22) }]}>Virem</Text>
          </View>

          <View style={styles.header}>
            <Text style={[styles.title, { fontSize: fs(20) }]}>Establecer nueva contraseña</Text>
            <Text style={[styles.subtitle, { fontSize: fs(13) }]}>
              Crea una contraseña segura para tu cuenta.
            </Text>
            {!!email && (
              <Text style={[styles.subtitle, { fontSize: fs(13), marginTop: spacing.xs }]} numberOfLines={1}>
                {email}
              </Text>
            )}
          </View>

          <View style={styles.formSection}>
            <View style={styles.labelContainer}>
              <Text style={[styles.labelText, { fontSize: fs(14) }]}>Nueva contraseña</Text>
              <View style={styles.inputGroup}>
                <TextInput
                  style={[styles.input, { fontSize: fs(15) }]}
                  placeholder="Escribe tu nueva contraseña"
                  placeholderTextColor={colors.placeholder}
                  secureTextEntry={!isPasswordVisible}
                  value={newPassword}
                  onChangeText={setNewPassword}
                  autoCapitalize="none"
                  autoComplete="password-new"
                  textContentType="newPassword"
                />
                <TouchableOpacity
                  style={styles.visibilityIconWrapper}
                  onPress={() => setIsPasswordVisible((v) => !v)}
                  accessibilityRole="button"
                  accessibilityLabel={isPasswordVisible ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                >
                  <MaterialIcons
                    name={isPasswordVisible ? 'visibility' : 'visibility-off'}
                    size={22}
                    color={colors.textSecondary}
                  />
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.labelContainer}>
              <Text style={[styles.labelText, { fontSize: fs(14) }]}>Confirmar contraseña</Text>
              <View style={styles.inputGroup}>
                <TextInput
                  style={[styles.input, { fontSize: fs(15) }]}
                  placeholder="Confirma tu contraseña"
                  placeholderTextColor={colors.placeholder}
                  secureTextEntry={!isConfirmPasswordVisible}
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  autoCapitalize="none"
                  autoComplete="password-new"
                  textContentType="newPassword"
                />
                <TouchableOpacity
                  style={styles.visibilityIconWrapper}
                  onPress={() => setIsConfirmPasswordVisible((v) => !v)}
                  accessibilityRole="button"
                >
                  <MaterialIcons
                    name={isConfirmPasswordVisible ? 'visibility' : 'visibility-off'}
                    size={22}
                    color={colors.textSecondary}
                  />
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.rulesGrid}>
              {rules.map((r) => {
                const ok = checkRule(r.key);
                return (
                  <View key={r.key} style={styles.ruleItem}>
                    <MaterialIcons
                      name={ok ? 'check-circle' : 'radio-button-unchecked'}
                      size={16}
                      color={ok ? colors.primary : colors.borderColor}
                    />
                    <Text style={[styles.ruleText, { fontSize: fs(11) }]} numberOfLines={1}>
                      {r.label}
                    </Text>
                  </View>
                );
              })}
            </View>

            <TouchableOpacity
              style={[styles.updateButton, isLoading && styles.disabled]}
              onPress={handlePasswordReset}
              disabled={isLoading}
              activeOpacity={0.85}
              accessibilityRole="button"
            >
              {isLoading ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text style={[styles.buttonText, { fontSize: fs(15) }]}>Actualizar contraseña</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.footerLinkWrapper}
              onPress={handleBackToLogin}
              disabled={isLoading}
              activeOpacity={0.85}
            >
              <MaterialIcons name="arrow-back" size={18} color={colors.textSecondary} />
              <Text style={[styles.footerLinkText, { fontSize: fs(13) }]}>Volver al login</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ResponsiveContainer>
    </ScreenScaffold>
  );
};

export default EstablecerNuevaContrasenaScreen;

const styles = StyleSheet.create({
  logoWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.base,
  },
  logoImage: { width: 40, height: 40, resizeMode: 'contain' },
  logoText: { fontWeight: 'bold', color: colors.textPrimary },
  cardContainer: {
    width: '100%',
    backgroundColor: colors.cardLight,
    borderRadius: radii.md,
    elevation: 3,
    padding: spacing.xl,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
  },
  header: { width: '100%', alignItems: 'center', marginBottom: spacing.base },
  title: { color: colors.textPrimary, fontWeight: 'bold', textAlign: 'center' },
  subtitle: { color: colors.textSecondary, textAlign: 'center', marginTop: spacing.xs },
  formSection: { width: '100%' },
  labelContainer: { marginBottom: spacing.base },
  labelText: { color: colors.textPrimary, fontWeight: '500', marginBottom: spacing.xs },
  inputGroup: {
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: colors.borderColor,
    borderRadius: radii.sm,
    minHeight: 48,
    overflow: 'hidden',
  },
  input: { flex: 1, paddingHorizontal: spacing.md, color: colors.textPrimary },
  visibilityIconWrapper: {
    minWidth: 45,
    justifyContent: 'center',
    alignItems: 'center',
    borderLeftWidth: 1,
    borderLeftColor: colors.borderColor,
    paddingHorizontal: spacing.sm,
  },
  rulesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: spacing.lg,
    marginTop: spacing.xxs,
    gap: spacing.xs,
  },
  ruleItem: { flexDirection: 'row', alignItems: 'center', minWidth: '48%' },
  ruleText: { color: colors.textSecondary, marginLeft: spacing.xs, flexShrink: 1 },
  updateButton: {
    width: '100%',
    minHeight: 48,
    paddingVertical: spacing.md,
    borderRadius: radii.sm,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  disabled: { opacity: 0.7 },
  buttonText: { color: 'white', fontWeight: 'bold' },
  footerLinkWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.base,
    alignSelf: 'center',
  },
  footerLinkText: {
    color: colors.textSecondary,
    fontWeight: 'bold',
    marginLeft: spacing.xs,
    textDecorationLine: 'underline',
  },
});
