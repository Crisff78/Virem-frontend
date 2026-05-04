import React, { createRef, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Keyboard,
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

type VerificarIdentidadRouteProp = RouteProp<RootStackParamList, 'VerificarIdentidad'>;
type NavigationProps = NativeStackNavigationProp<RootStackParamList, 'VerificarIdentidad'>;

const colors = {
  primary: '#4A7FA7',
  backgroundLight: '#F6FAFD',
  textPrimaryLight: '#0A1931',
  textSecondaryLight: '#1A3D63',
  borderLight: '#B3CFE5',
  cardLight: '#FFFFFF',
};

const OTP_LENGTH = 6;

const VerificarIdentidadScreen: React.FC = () => {
  const route = useRoute<VerificarIdentidadRouteProp>();
  const navigation = useNavigation<NavigationProps>();
  const { fs, width, isSmallMobile } = useResponsive();
  const [isLoading, setIsLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);

  const recipient = route.params?.email || 'tu correo electrónico';
  const [otp, setOtp] = useState<string[]>(new Array(OTP_LENGTH).fill(''));
  const inputRefs = useRef<Array<React.RefObject<TextInput | null>>>([]);

  if (inputRefs.current.length === 0) {
    inputRefs.current = Array(OTP_LENGTH)
      .fill(0)
      .map(() => createRef<TextInput | null>());
  }

  // OTP boxes flexibles según ancho disponible.
  const horizontalGap = 8;
  const cardPad = 32;
  const innerWidth = Math.min(420, width - 32) - cardPad * 2;
  const boxFromWidth = (innerWidth - horizontalGap * (OTP_LENGTH - 1)) / OTP_LENGTH;
  const otpBoxSize = Math.max(36, Math.min(56, Math.floor(boxFromWidth)));

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

      if (cursor < OTP_LENGTH) {
        inputRefs.current[cursor].current?.focus();
      } else {
        Keyboard.dismiss();
      }
      return;
    }

    newOtp[index] = onlyDigits;
    setOtp(newOtp);
    if (index < OTP_LENGTH - 1) {
      inputRefs.current[index + 1].current?.focus();
    } else {
      Keyboard.dismiss();
    }
  };

  const handleKeyPress = (e: any, index: number) => {
    if (e.nativeEvent.key === 'Backspace' && otp[index] === '' && index > 0) {
      inputRefs.current[index - 1].current?.focus();
    }
  };

  const handleVerifyCode = async () => {
    const code = otp.join('');
    if (code.length !== OTP_LENGTH) {
      Alert.alert('Incompleto', 'Ingresa el código completo.');
      return;
    }

    setIsLoading(true);
    try {
      const data = await requestJson<any>('/api/auth/recovery/verify-code', {
        method: 'POST',
        body: { email: recipient, codigo: code },
      });

      if (data?.success) {
        navigation.navigate('EstablecerNuevaContrasena', { email: recipient });
      } else {
        Alert.alert('Error', data?.message || 'Código incorrecto o expirado.');
      }
    } catch (error) {
      Alert.alert('Error', (error as any)?.message || 'Sin conexión al servidor.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendCode = async () => {
    if (!recipient || recipient === 'tu correo electrónico') {
      Alert.alert('Error', 'No se encontró el correo para reenviar el código.');
      return;
    }

    setResendLoading(true);
    try {
      const data = await requestJson<any>('/api/auth/recovery/send-code', {
        method: 'POST',
        body: { email: recipient },
      });
      if (data?.success) {
        const suffix = data?.devCode ? `\n\nCódigo de desarrollo: ${String(data.devCode)}` : '';
        Alert.alert('Código reenviado', `Revisa tu correo para el nuevo código.${suffix}`);
      } else {
        Alert.alert('Error', data?.message || 'No se pudo reenviar el código.');
      }
    } catch (error) {
      Alert.alert('Error', (error as any)?.message || 'Sin conexión al servidor.');
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <ScreenScaffold background={colors.backgroundLight} center>
      <ResponsiveContainer maxWidth={420}>
        <View style={[styles.cardContainer, { padding: isSmallMobile ? spacing.lg : spacing.xxl }]}>
          <View style={styles.iconWrapper}>
            <MaterialCommunityIcons name="shield-lock" size={40} color={colors.primary} />
          </View>
          <Text style={[styles.title, { fontSize: fs(22) }]}>Verifica tu Identidad</Text>
          <Text style={[styles.subtitle, { fontSize: fs(14) }]} numberOfLines={3}>
            Introduce el código enviado a {recipient}.
          </Text>
          <View style={[styles.otpContainer, { gap: horizontalGap }]}>
            {otp.map((digit, index) => (
              <TextInput
                key={index}
                ref={inputRefs.current[index]}
                style={[
                  styles.otpInput,
                  { width: otpBoxSize, height: otpBoxSize + 12, fontSize: fs(18) },
                ]}
                value={digit}
                onChangeText={(text) => handleOtpChange(text, index)}
                onKeyPress={(e) => handleKeyPress(e, index)}
                keyboardType="numeric"
                inputMode="numeric"
                maxLength={1}
                autoFocus={index === 0}
                returnKeyType={index === OTP_LENGTH - 1 ? 'done' : 'next'}
              />
            ))}
          </View>
          <TouchableOpacity
            style={[styles.verifyButton, isLoading && styles.disabled]}
            onPress={handleVerifyCode}
            disabled={isLoading}
            accessibilityRole="button"
          >
            {isLoading ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text style={[styles.buttonText, { fontSize: fs(15) }]}>Verificar código</Text>
            )}
          </TouchableOpacity>
          <View style={styles.resendTextWrapper}>
            <Text style={[styles.resendText, { fontSize: fs(13) }]}>¿No recibiste el código? </Text>
            <TouchableOpacity onPress={handleResendCode} disabled={resendLoading}>
              <Text style={[styles.resendLink, { fontSize: fs(13) }]}>
                {resendLoading ? 'Enviando...' : 'Reenviar'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ResponsiveContainer>
    </ScreenScaffold>
  );
};

export default VerificarIdentidadScreen;

const styles = StyleSheet.create({
  cardContainer: {
    width: '100%',
    backgroundColor: colors.cardLight,
    borderRadius: radii.md,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    alignItems: 'center',
  },
  iconWrapper: {
    width: 64,
    height: 64,
    borderRadius: radii.pill,
    backgroundColor: 'rgba(74, 127, 167, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xl,
  },
  title: {
    color: colors.textPrimaryLight,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  subtitle: {
    color: colors.textSecondaryLight,
    textAlign: 'center',
    marginBottom: spacing.xl,
  },
  otpContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    width: '100%',
    flexWrap: 'wrap',
  },
  otpInput: {
    borderWidth: 1,
    borderColor: colors.borderLight,
    borderRadius: radii.sm,
    backgroundColor: colors.backgroundLight,
    textAlign: 'center',
    fontWeight: 'bold',
    color: colors.textPrimaryLight,
  },
  verifyButton: {
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
  buttonText: { color: colors.cardLight, fontWeight: 'bold' },
  resendTextWrapper: { flexDirection: 'row', marginTop: spacing.base, flexWrap: 'wrap' },
  resendText: { color: colors.textSecondaryLight },
  resendLink: { color: colors.primary, fontWeight: 'bold', textDecorationLine: 'underline' },
});
