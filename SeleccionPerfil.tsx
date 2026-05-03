import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { ScreenScaffold } from './components/ScreenScaffold';
import { ResponsiveContainer } from './components/ResponsiveContainer';
import { useResponsive } from './hooks/useResponsive';
import { RootStackParamList } from './navigation/types';
import { spacing, radii } from './theme/spacing';

type NavigationProps = NativeStackNavigationProp<RootStackParamList, 'SeleccionPerfil'>;

const colors = {
  blueDeep: '#0A1931',
  blueDark: '#1A3D63',
  blueMedium: '#4A7FA7',
  blueLight: '#B3CFE5',
  pageBg: '#F6FAFD',
  white: '#FFFFFF',
};

const SeleccionPerfil: React.FC = () => {
  const navigation = useNavigation<NavigationProps>();
  const { fs, isMobile } = useResponsive();

  const handleRegister = (profile: 'Medico' | 'Paciente') => {
    navigation.navigate(profile === 'Paciente' ? 'RegistroPaciente' : 'RegistroMedico');
  };

  const handleLogin = () => {
    navigation.navigate('Login');
  };

  return (
    <ScreenScaffold background={colors.pageBg} center>
      <ResponsiveContainer maxWidth={768}>
        <View style={styles.contentWrapper}>
          <Text style={[styles.title, { fontSize: fs(28) }]}>
            Elige cómo quieres registrarte
          </Text>
          <Text style={[styles.subtitle, { fontSize: fs(15) }]}>
            Selecciona tu perfil para acceder a las herramientas y funciones diseñadas
            específicamente para ti.
          </Text>

          <View
            style={[
              styles.cardsGrid,
              isMobile ? styles.cardsGridMobile : styles.cardsGridDesktop,
            ]}
          >
            <View style={[styles.card, isMobile && styles.cardMobile]}>
              <View style={styles.iconWrapper}>
                <MaterialCommunityIcons name="stethoscope" size={48} color={colors.blueDark} />
              </View>
              <Text style={[styles.cardTitle, { fontSize: fs(18) }]}>Médico</Text>
              <TouchableOpacity
                style={[styles.registerButton, styles.buttonMedico]}
                onPress={() => handleRegister('Medico')}
                accessibilityRole="button"
                accessibilityLabel="Registrarme como médico"
              >
                <Text style={[styles.buttonText, { fontSize: fs(15) }]}>Registrarme</Text>
              </TouchableOpacity>
            </View>

            <View style={[styles.card, isMobile && styles.cardMobile]}>
              <View style={styles.iconWrapper}>
                <MaterialCommunityIcons name="account" size={48} color={colors.blueDark} />
              </View>
              <Text style={[styles.cardTitle, { fontSize: fs(18) }]}>Paciente</Text>
              <TouchableOpacity
                style={[styles.registerButton, styles.buttonPaciente]}
                onPress={() => handleRegister('Paciente')}
                accessibilityRole="button"
                accessibilityLabel="Registrarme como paciente"
              >
                <Text style={[styles.buttonText, { fontSize: fs(15) }]}>Registrarme</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.footerWrapper}>
            <Text style={[styles.footerText, { fontSize: fs(13) }]}>
              ¿Ya tienes una cuenta?{' '}
              <Text style={styles.footerLink} onPress={handleLogin}>
                Inicia sesión aquí.
              </Text>
            </Text>
          </View>
        </View>
      </ResponsiveContainer>
    </ScreenScaffold>
  );
};

const styles = StyleSheet.create({
  contentWrapper: {
    width: '100%',
    alignItems: 'center',
    paddingVertical: spacing.lg,
  },
  title: {
    color: colors.blueDeep,
    fontWeight: 'bold',
    paddingTop: spacing.lg,
    paddingBottom: spacing.base,
    textAlign: 'center',
  },
  subtitle: {
    color: colors.blueMedium,
    maxWidth: 430,
    textAlign: 'center',
    marginBottom: spacing.xxl,
    lineHeight: 22,
  },
  cardsGrid: {
    width: '100%',
    justifyContent: 'center',
    gap: spacing.xl,
  },
  cardsGridDesktop: { flexDirection: 'row' },
  cardsGridMobile: { flexDirection: 'column' },
  card: {
    flex: 1,
    backgroundColor: colors.white,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.blueLight,
    padding: spacing.xxl,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 5,
  },
  cardMobile: { flex: 0, width: '100%' },
  iconWrapper: {
    height: 80,
    width: 80,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radii.pill,
    backgroundColor: 'rgba(179, 207, 229, 0.3)',
    marginBottom: spacing.xl,
  },
  cardTitle: {
    color: colors.blueDeep,
    fontWeight: 'bold',
    marginTop: spacing.base,
  },
  registerButton: {
    marginTop: spacing.xl,
    minWidth: 180,
    minHeight: 48,
    borderRadius: radii.sm,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  buttonMedico: { backgroundColor: colors.blueDark },
  buttonPaciente: { backgroundColor: colors.blueMedium },
  buttonText: { color: colors.white, fontWeight: 'bold' },
  footerWrapper: { marginTop: spacing.xxxl },
  footerText: { color: colors.blueMedium, textAlign: 'center' },
  footerLink: { color: colors.blueDark, fontWeight: 'bold', textDecorationLine: 'underline' },
});

export default SeleccionPerfil;
