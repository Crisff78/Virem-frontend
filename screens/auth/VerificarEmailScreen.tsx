import React, { createRef, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Keyboard,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { ScreenScaffold } from '../../components/ScreenScaffold';
import { ResponsiveContainer } from '../../components/ResponsiveContainer';
import { useResponsive } from '../../hooks/useResponsive';
import { RootStackParamList } from '../../navigation/types';
import { requestJson } from '../../utils/api';
import { spacing, radii } from '../../theme/spacing';

type VerificarEmailRouteProp = RouteProp<RootStackParamList, 'VerificarEmail'>;
type NavigationProps = NativeStackNavigationProp<RootStackParamList, 'VerificarEmail'>;

const colors = {
  primary: '#137fec',
  primaryLight: '#e0f2fe',
  background: '#F6FAFD',
  textPrimary: '#0A1931',
  textSecondary: '#4A7FA7',
  border: '#cbd5e1',
  card: '#FFFFFF',
  white: '#FFFFFF',
};

const OTP_LENGTH = 6;

const VerificarEmailScreen: React.FC = () => {
  const route = useRoute<VerificarEmailRouteProp>();
  const navigation = useNavigation<NavigationProps>();
  const [isLoading, setIsLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const { fs, width, isSmallMobile } = useResponsive();

  const recipient = route.params?.email || '';
  const roleId = route.params?.roleId || 1;

  const [otp, setOtp] = useState<string[]>(new Array(OTP_LENGTH).fill(''));
  const inputRefs = useRef<Array<React.RefObject<TextInput | null>>>([]);

  const horizontalGap = 8;
  const cardPad = isSmallMobile ? 20 : 32;
  const innerWidth = Math.min(480, width - 32) - cardPad * 2;
  const boxFromWidth = (innerWidth - horizontalGap * (OTP_LENGTH - 1)) / OTP_LENGTH;
  const otpBoxSize = Math.max(36, Math.min(56, Math.floor(boxFromWidth)));

  if (inputRefs.current.length === 0) {
    inputRefs.current = Array(OTP_LENGTH).fill(0).map(() => createRef<TextInput | null>());
  }

  const handleOtpChange = (text: string, index: number) => {
    const onlyDigits = String(text || '').replace(/\D/g, '');
    const newOtp = [...otp];

    if (!onlyDigits) {
      newOtp[index] = '';
      setOtp(newOtp);
      return;
    }

    if (onlyDigits.length > 1) {
      let cursor = index;
      for (const digit of onlyDigits) {
        if (cursor >= OTP_LENGTH) break;
        newOtp[cursor] = digit;
        cursor += 1;
      }
      setOtp(newOtp);

      if (cursor < OTP_LENGTH) inputRefs.current[cursor].current?.focus();
      else Keyboard.dismiss();
      return;
    }

    newOtp[index] = onlyDigits;
    setOtp(newOtp);
    if (index < OTP_LENGTH - 1) inputRefs.current[index + 1].current?.focus();
    else Keyboard.dismiss();
  };

  const handleKeyPress = (e: any, index: number) => {
    if (e.nativeEvent.key === 'Backspace' && otp[index] === '' && index > 0) {
      inputRefs.current[index - 1].current?.focus();
    }
  };

  const handleVerifyCode = async () => {
    const code = otp.join('');
    if (code.length !== OTP_LENGTH) {
      Alert.alert('Código incompleto', 'Por favor ingresa los 6 dígitos enviados a tu correo.');
      return;
    }

    setIsLoading(true);
    try {
      const data = await requestJson<any>('/api/auth/verify-email', {
        method: 'POST',
        body: { email: recipient, codigo: code },
      });

      if (data?.success) {
        const isMedico = roleId === 2;
        let finalMessage = 'Tu correo ha sido verificado correctamente.';
        if (isMedico) {
          finalMessage +=
            '\n\nTu cuenta profesional está ahora en proceso de revisión administrativa. Te notificaremos por correo cuando sea aprobada.';
        } else {
          finalMessage += '\n\nYa puedes iniciar sesión en tu cuenta.';
        }

        Alert.alert('¡Verificado!', finalMessage, [
          {
            text: 'Ir al Login',
            onPress: () => navigation.replace('Login', { prefillEmail: recipient }),
          },
        ]);
      } else {
        Alert.alert('Error', data?.message || 'Código incorrecto o expirado.');
      }
    } catch (error) {
      Alert.alert('Error', (error as any)?.message || 'No se pudo conectar con el servidor.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendCode = async () => {
    if (!recipient) {
      Alert.alert('Error', 'No se encontró el correo para reenviar el código.');
      return;
    }

    setResendLoading(true);
    try {
      const data = await requestJson<any>('/api/auth/resend-verification', {
        method: 'POST',
        body: { email: recipient },
      });
      if (data?.success) {
        const devSuffix = data?.devVerificationCode
          ? `\n\n(Dev Code: ${data.devVerificationCode})`
          : '';
        Alert.alert('Código Reenviado', `Hemos enviado un nuevo código a ${recipient}.${devSuffix}`);
      } else {
        Alert.alert('Error', data?.message || 'No se pudo reenviar el código.');
      }
    } catch (error) {
      Alert.alert('Error', (error as any)?.message || 'No se pudo conectar con el servidor.');
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <ScreenScaffold background={colors.background} center>
      <ResponsiveContainer maxWidth={480}>
        <View style={[styles.card, { padding: cardPad }]}>
          <View style={styles.headerIcon}>
            <MaterialCommunityIcons name="email-check-outline" size={48} color={colors.primary} />
          </View>

          <Text style={[styles.title, { fontSize: fs(24) }]}>Verifica tu Correo</Text>
          <Text style={[styles.subtitle, { fontSize: fs(15) }]}>
            Para asegurar tu cuenta, introduce el código de {OTP_LENGTH} dígitos que enviamos a:
          </Text>
          <Text style={[styles.emailText, { fontSize: fs(15) }]} numberOfLines={1}>
            {recipient}
          </Text>

          <View style={[styles.otpContainer, { gap: horizontalGap }]}>
            {otp.map((digit, index) => (
              <TextInput
                key={index}
                ref={inputRefs.current[index]}
                style={[
                  styles.otpInput,
                  {
                    width: otpBoxSize,
                    height: otpBoxSize + 12,
                    fontSize: fs(20),
                  },
                  digit ? styles.otpInputFilled : null,
                ]}
                value={digit}
                onChangeText={(text) => handleOtpChange(text, index)}
                onKeyPress={(e) => handleKeyPress(e, index)}
                keyboardType="numeric"
                inputMode="numeric"
                maxLength={1}
                autoFocus={index === 0}
                placeholder="-"
                placeholderTextColor={colors.border}
              />
            ))}
          </View>

          <TouchableOpacity
            style={[styles.verifyButton, isLoading && styles.verifyButtonDisabled]}
            onPress={handleVerifyCode}
            disabled={isLoading}
            accessibilityRole="button"
          >
            {isLoading ? (
              <ActivityIndicator color={colors.white} />
            ) : (
              <Text style={[styles.verifyButtonText, { fontSize: fs(16) }]}>Confirmar Código</Text>
            )}
          </TouchableOpacity>

          <View style={styles.resendContainer}>
            <Text style={[styles.resendLabel, { fontSize: fs(14) }]}>¿No recibiste el correo?</Text>
            <TouchableOpacity onPress={handleResendCode} disabled={resendLoading}>
              <Text style={[styles.resendLink, { fontSize: fs(14) }]}>
                {resendLoading ? 'Enviando...' : 'Reenviar código'}
              </Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.replace('Login', { prefillEmail: recipient })}
          >
            <Text style={[styles.backButtonText, { fontSize: fs(13) }]}>
              Volver al inicio de sesión
            </Text>
          </TouchableOpacity>
        </View>
      </ResponsiveContainer>
    </ScreenScaffold>
  );
};

export default VerificarEmailScreen;

const styles = StyleSheet.create({
  card: {
    width: '100%',
    backgroundColor: colors.card,
    borderRadius: radii.xl,
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
      },
      android: { elevation: 8 },
      web: { boxShadow: '0 8px 30px rgba(0,0,0,0.08)' as any },
    }),
  },
  headerIcon: {
    width: 80,
    height: 80,
    borderRadius: radii.pill,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xl,
  },
  title: {
    fontWeight: '800',
    color: colors.textPrimary,
    marginBottom: spacing.md,
    textAlign: 'center',
  },
  subtitle: {
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: spacing.sm,
  },
  emailText: {
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginBottom: spacing.xxl,
    textAlign: 'center',
    maxWidth: '100%',
  },
  otpContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    width: '100%',
    marginBottom: spacing.xxl,
    flexWrap: 'wrap',
  },
  otpInput: {
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radii.md,
    backgroundColor: colors.background,
    textAlign: 'center',
    fontWeight: 'bold',
    color: colors.textPrimary,
  },
  otpInputFilled: { borderColor: colors.primary, backgroundColor: colors.white },
  verifyButton: {
    width: '100%',
    minHeight: 56,
    paddingVertical: spacing.base,
    borderRadius: radii.lg,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  verifyButtonDisabled: { opacity: 0.7 },
  verifyButtonText: { color: colors.white, fontWeight: 'bold' },
  resendContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    justifyContent: 'center',
    marginBottom: spacing.xxl,
    gap: spacing.xs,
  },
  resendLabel: { color: colors.textSecondary },
  resendLink: { color: colors.primary, fontWeight: 'bold' },
  backButton: { padding: spacing.sm },
  backButtonText: { color: colors.textSecondary, fontWeight: '500' },
});
