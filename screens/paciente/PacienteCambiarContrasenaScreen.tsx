import React, { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { MaterialIcons } from '@expo/vector-icons';

import type { RootStackParamList } from '../../navigation/types';
import { useLanguage } from '../../localization/LanguageContext';
import { usePatientPortalSession } from '../../hooks/usePatientPortalSession';
import { apiClient } from '../../utils/api';
import { getApiErrorMessage, isAuthError } from '../../utils/apiErrors';
import { ScreenScaffold } from '../../components/ScreenScaffold';
import { colors } from '../../theme/colors';
import { spacing, radii } from '../../theme/spacing';

const PacienteCambiarContrasenaScreen: React.FC = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { tx } = useLanguage();
  const { signOut } = usePatientPortalSession({ syncOnMount: false });

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [saving, setSaving] = useState(false);

  const passwordChecks = useMemo(() => {
    const hasMin = newPassword.length >= 8;
    const hasNumber = /\d/.test(newPassword);
    const hasSymbol = /[^A-Za-z0-9]/.test(newPassword);
    const hasMixed = /[a-z]/.test(newPassword) && /[A-Z]/.test(newPassword);
    const score = [hasMin, hasNumber, hasSymbol, hasMixed].filter(Boolean).length;
    return { hasMin, hasNumber, hasSymbol, hasMixed, score, pct: (score / 4) * 100 };
  }, [newPassword]);

  const strengthText = useMemo(() => {
    if (passwordChecks.score <= 1) return tx({ es: 'Baja', en: 'Weak', pt: 'Fraca' });
    if (passwordChecks.score <= 3) return tx({ es: 'Moderada', en: 'Medium', pt: 'Moderada' });
    return tx({ es: 'Fuerte', en: 'Strong', pt: 'Forte' });
  }, [passwordChecks.score, tx]);

  const indicatorColor =
    passwordChecks.score >= 3 ? colors.success : passwordChecks.score >= 2 ? colors.primary : colors.warning;

  const handleUpdatePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      Alert.alert(
        tx({ es: 'Campos incompletos', en: 'Incomplete fields', pt: 'Campos incompletos' }),
        tx({ es: 'Completa todos los campos para continuar.', en: 'Fill all fields to continue.', pt: 'Preencha todos os campos para continuar.' })
      );
      return;
    }

    if (newPassword !== confirmPassword) {
      Alert.alert(
        tx({ es: 'No coincide', en: 'Does not match', pt: 'Nao coincide' }),
        tx({ es: 'La confirmacion de contrasena no coincide.', en: 'Password confirmation does not match.', pt: 'A confirmacao da senha nao coincide.' })
      );
      return;
    }

    if (passwordChecks.score < 2) {
      Alert.alert(
        tx({ es: 'Contrasena debil', en: 'Weak password', pt: 'Senha fraca' }),
        tx({ es: 'Mejora la seguridad antes de continuar.', en: 'Improve password strength before continuing.', pt: 'Melhore a seguranca da senha antes de continuar.' })
      );
      return;
    }

    setSaving(true);
    try {
      await apiClient.put('/api/users/me/password', {
        authenticated: true,
        body: { currentPassword, newPassword },
      });

      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      Alert.alert(
        tx({ es: 'Contrasena actualizada', en: 'Password updated', pt: 'Senha atualizada' }),
        tx({ es: 'Tu contrasena fue actualizada correctamente.', en: 'Your password was updated successfully.', pt: 'Sua senha foi atualizada com exito.' }),
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    } catch (error) {
      if (isAuthError(error)) {
        Alert.alert(
          tx({ es: 'Sesion expirada', en: 'Session expired', pt: 'Sessao expirada' }),
          tx({ es: 'Inicia sesion nuevamente para cambiar tu contrasena.', en: 'Sign in again to change your password.', pt: 'Faca login novamente para alterar sua senha.' })
        );
        await signOut();
        navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
        return;
      }

      Alert.alert(
        tx({ es: 'Error', en: 'Error', pt: 'Erro' }),
        getApiErrorMessage(error, tx({ es: 'No se pudo actualizar la contrasena.', en: 'Could not update password.', pt: 'Nao foi possivel actualizar a senha.' }))
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <ScreenScaffold scroll={false} background={colors.bg}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => navigation.goBack()}
          accessibilityRole="button"
          accessibilityLabel={tx({ es: 'Volver', en: 'Go back', pt: 'Voltar' })}
        >
          <MaterialIcons name="arrow-back" size={22} color={colors.dark} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {tx({ es: 'Cambiar Contraseña', en: 'Change Password', pt: 'Alterar Senha' })}
        </Text>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.contentWrap}>
          <Text style={styles.pageSubtitle}>
            {tx({
              es: 'Actualice sus credenciales para mantener la seguridad de su cuenta médica.',
              en: 'Update your credentials to keep your medical account secure.',
              pt: 'Atualize suas credenciais para manter sua conta médica segura.',
            })}
          </Text>

          <View style={styles.formCard}>
            <Text style={styles.label}>
              {tx({ es: 'Contraseña Actual', en: 'Current Password', pt: 'Senha Atual' })}
            </Text>
            <View style={styles.inputRow}>
              <TextInput
                style={styles.input}
                secureTextEntry={!showCurrent}
                value={currentPassword}
                onChangeText={setCurrentPassword}
                placeholder={tx({ es: 'Ingrese su contraseña actual', en: 'Enter your current password', pt: 'Digite sua senha atual' })}
                placeholderTextColor={colors.muted}
              />
              <TouchableOpacity onPress={() => setShowCurrent((v) => !v)}>
                <MaterialIcons name={showCurrent ? 'visibility-off' : 'visibility'} size={20} color={colors.muted} />
              </TouchableOpacity>
            </View>

            <View style={styles.hr} />

            <Text style={styles.label}>
              {tx({ es: 'Nueva Contraseña', en: 'New Password', pt: 'Nova Senha' })}
            </Text>
            <View style={styles.inputRow}>
              <TextInput
                style={styles.input}
                secureTextEntry={!showNew}
                value={newPassword}
                onChangeText={setNewPassword}
                placeholder={tx({ es: 'Mínimo 8 caracteres', en: 'Minimum 8 characters', pt: 'Minimo 8 caracteres' })}
                placeholderTextColor={colors.muted}
              />
              <TouchableOpacity onPress={() => setShowNew((v) => !v)}>
                <MaterialIcons name={showNew ? 'visibility-off' : 'visibility'} size={20} color={colors.muted} />
              </TouchableOpacity>
            </View>

            <Text style={styles.label}>
              {tx({ es: 'Confirmar Nueva Contraseña', en: 'Confirm New Password', pt: 'Confirmar Nova Senha' })}
            </Text>
            <View style={styles.inputRow}>
              <TextInput
                style={styles.input}
                secureTextEntry={!showConfirm}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                placeholder={tx({ es: 'Repita su nueva contraseña', en: 'Repeat your new password', pt: 'Repita sua nova senha' })}
                placeholderTextColor={colors.muted}
              />
              <TouchableOpacity onPress={() => setShowConfirm((v) => !v)}>
                <MaterialIcons name={showConfirm ? 'visibility-off' : 'visibility'} size={20} color={colors.muted} />
              </TouchableOpacity>
            </View>

            <View style={styles.securityBox}>
              <View style={styles.securityHead}>
                <Text style={styles.securityTitle}>
                  {tx({ es: 'FORTALEZA DE SEGURIDAD', en: 'SECURITY STRENGTH', pt: 'FORCA DA SENHA' })}
                </Text>
                <Text style={styles.securityValue}>{strengthText}</Text>
              </View>
              <View style={styles.barBg}>
                <View
                  style={[styles.barFill, { width: `${Math.max(passwordChecks.pct, 5)}%` as any, backgroundColor: indicatorColor }]}
                />
              </View>
              <View style={styles.rulesGrid}>
                {[
                  { check: passwordChecks.hasMin, label: tx({ es: 'Al menos 8 caracteres', en: 'At least 8 characters', pt: 'Pelo menos 8 caracteres' }) },
                  { check: passwordChecks.hasNumber, label: tx({ es: 'Incluye números', en: 'Includes numbers', pt: 'Inclui números' }) },
                  { check: passwordChecks.hasSymbol, label: tx({ es: 'Incluye símbolos (@#$%...)', en: 'Includes symbols (@#$%...)', pt: 'Inclui símbolos (@#$%...)' }) },
                  { check: passwordChecks.hasMixed, label: tx({ es: 'Mayúsculas y minúsculas', en: 'Upper and lower case', pt: 'Maiúsculas e minúsculas' }) },
                ].map(({ check, label }) => (
                  <View key={label} style={styles.ruleItem}>
                    <MaterialIcons
                      name={check ? 'check-circle' : 'cancel'}
                      size={14}
                      color={check ? colors.success : colors.muted}
                    />
                    <Text style={styles.ruleText}>{label}</Text>
                  </View>
                ))}
              </View>
            </View>

            <TouchableOpacity
              style={[styles.primaryButton, saving && styles.primaryButtonDisabled]}
              onPress={handleUpdatePassword}
              disabled={saving}
              accessibilityRole="button"
            >
              {saving ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.primaryButtonText}>
                  {tx({ es: 'Actualizar Contraseña', en: 'Update Password', pt: 'Actualizar Senha' })}
                </Text>
              )}
            </TouchableOpacity>
          </View>

          <View style={styles.tipBox}>
            <MaterialIcons name="info-outline" size={18} color={colors.primary} />
            <Text style={styles.tipText}>
              <Text style={styles.tipBold}>
                {tx({ es: 'Consejo de seguridad:', en: 'Security tip:', pt: 'Dica de segurança:' })}
              </Text>{' '}
              {tx({
                es: 'Nunca comparta su contraseña con terceros. Recomendamos cambiarla cada 90 días.',
                en: 'Never share your password with third parties. We recommend changing it every 90 days.',
                pt: 'Nunca compartilhe sua senha com terceiros. Recomendamos trocá-la a cada 90 dias.',
              })}
            </Text>
          </View>
        </View>
      </ScrollView>
    </ScreenScaffold>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.md,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: radii.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.dark,
  },

  scroll: { flex: 1 },
  scrollContent: { paddingBottom: spacing.xxxl },

  contentWrap: {
    maxWidth: 720,
    width: '100%',
    alignSelf: 'center',
    padding: spacing.base,
  },
  pageSubtitle: {
    color: colors.muted,
    fontSize: 15,
    fontWeight: '600',
    marginBottom: spacing.base,
    lineHeight: 22,
  },

  formCard: {
    backgroundColor: colors.white,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
  },
  label: {
    color: colors.dark,
    fontSize: 14,
    fontWeight: '800',
    marginBottom: spacing.xs,
    marginTop: spacing.sm,
  },
  inputRow: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.md,
    backgroundColor: colors.white,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    gap: spacing.sm,
  },
  input: { flex: 1, color: colors.dark, height: 44, fontWeight: '600' },
  hr: { height: 1, backgroundColor: colors.borderSoft, marginVertical: spacing.md },

  securityBox: {
    marginTop: spacing.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.md,
    padding: spacing.md,
  },
  securityHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  securityTitle: { color: colors.dark, fontSize: 11, fontWeight: '900', letterSpacing: 0.6 },
  securityValue: { color: colors.muted, fontSize: 12, fontWeight: '700', fontStyle: 'italic' },
  barBg: {
    marginTop: spacing.sm,
    height: 7,
    borderRadius: radii.pill,
    backgroundColor: colors.borderSoft,
    overflow: 'hidden',
  },
  barFill: { height: '100%', borderRadius: radii.pill },
  rulesGrid: {
    marginTop: spacing.sm,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  ruleItem: { width: '48%', flexDirection: 'row', alignItems: 'center', gap: 5 },
  ruleText: { color: colors.muted, fontSize: 12, fontWeight: '600', flexShrink: 1 },

  primaryButton: {
    marginTop: spacing.base,
    height: 46,
    borderRadius: radii.md,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonDisabled: { opacity: 0.75 },
  primaryButtonText: { color: '#fff', fontSize: 16, fontWeight: '900' },

  tipBox: {
    marginTop: spacing.md,
    backgroundColor: colors.primarySoft,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.md,
    padding: spacing.md,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  tipText: { flex: 1, color: colors.blue, fontSize: 13, fontWeight: '600', lineHeight: 19 },
  tipBold: { fontWeight: '900' },
});

export default PacienteCambiarContrasenaScreen;
