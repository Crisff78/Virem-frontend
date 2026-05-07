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
<<<<<<< HEAD
  const { fs, isMobile } = useResponsive();
=======
  const { select, width, rs, fs } = useResponsive();
>>>>>>> feature-cris

  const styles = React.useMemo(() => StyleSheet.create({
    mainContainer: {
      flex: 1,
      backgroundColor: colors.pageBg,
    },
    scrollContent: {
      flexGrow: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 40,
      paddingHorizontal: 20,
    },
    contentWrapper: {
      width: '100%',
      maxWidth: 800,
      alignItems: 'center',
    },
    headerSection: {
      alignItems: 'center',
      marginBottom: 48,
    },
    title: {
      color: colors.blueDeep,
      fontWeight: '900',
      textAlign: 'center',
      marginBottom: 16,
      letterSpacing: -1,
    },
    subtitle: {
      color: colors.blueMedium,
      textAlign: 'center',
      maxWidth: 600,
      lineHeight: 26,
      fontWeight: '600',
    },
    cardsGrid: {
      width: '100%',
      flexDirection: Platform.select({ web: 'row', default: 'column' }) as any,
      flexWrap: 'wrap',
      justifyContent: 'center',
      gap: 24,
    },
    card: {
      backgroundColor: colors.white,
      borderRadius: 32,
      padding: rs(32),
      alignItems: 'center',
      borderWidth: 1,
      borderColor: 'rgba(179, 207, 229, 0.4)',
      justifyContent: 'space-between',
      minHeight: rs(380),
      ...Platform.select({
        ios: { shadowColor: colors.blueDeep, shadowOffset: { width: 0, height: 12 }, shadowOpacity: 0.08, shadowRadius: 16 },
        android: { elevation: 8 },
        web: { 
          boxShadow: '0 12px 40px rgba(10, 25, 49, 0.06)',
          transition: 'all 0.3s ease'
        }
      }),
    },
    cardContent: {
      alignItems: 'center',
      width: '100%',
    },
    iconWrapper: {
      height: rs(80),
      width: rs(80),
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: 24,
      backgroundColor: 'rgba(26, 61, 99, 0.05)',
      marginBottom: 24,
    },
    cardTitle: {
      color: colors.blueDeep,
      fontWeight: '800',
      marginBottom: 12,
      letterSpacing: -0.5,
    },
    cardDesc: {
      color: colors.blueMedium,
      textAlign: 'center',
      lineHeight: 22,
      marginBottom: 20,
      fontWeight: '500',
      minHeight: 66,
    },
    registerButton: {
      width: '100%',
      height: rs(54),
      borderRadius: 16,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: colors.blueDark,
      ...Platform.select({
        web: { transition: 'transform 0.2s ease' }
      })
    },
    buttonText: {
      color: colors.white,
      fontWeight: '800',
      letterSpacing: 0.5,
    },
    footerWrapper: {
      marginTop: rs(56),
      paddingBottom: 20,
    },
    footerText: {
      color: colors.blueMedium,
      fontWeight: '600',
    },
    footerLink: {
      color: colors.blueDark,
      fontWeight: '800',
      textDecorationLine: 'underline',
    },
  }), [rs, fs]);
  
  const handleRegister = (profile: 'Medico' | 'Paciente') => {
    navigation.navigate(profile === 'Paciente' ? 'RegistroPaciente' : 'RegistroMedico');
  };

  const handleLogin = () => {
    navigation.navigate('Login');
  };

<<<<<<< HEAD
  return (
    <ScreenScaffold background={colors.pageBg} center>
      <ResponsiveContainer maxWidth={768}>
        <View style={styles.contentWrapper}>
          <Text style={[styles.title, { fontSize: fs(28) }]}>
            Elige cómo quieres registrarte
=======
  const content = (
    <View style={styles.contentWrapper}>
      <View style={styles.headerSection}>
        <Text style={[styles.title, { fontSize: fs(32) }]}>Elige cómo quieres registrarte</Text>
        <Text style={[styles.subtitle, { fontSize: fs(16) }]}>
          Selecciona tu perfil para acceder a las herramientas y funciones diseñadas específicamente para ti.
        </Text>
      </View>

      <View style={styles.cardsGrid}>
        <TouchableOpacity 
          style={[styles.card, { width: select({ mobile: '100%', tablet: 320, desktop: 340 }) }]}
          activeOpacity={0.8}
          onPress={() => handleRegister('Medico')}
        >
          <View style={styles.cardContent}>
            <View style={styles.iconWrapper}>
              <MaterialCommunityIcons name="stethoscope" size={rs(42)} color={colors.blueDark} />
            </View>
            <Text style={[styles.cardTitle, { fontSize: fs(24) }]}>Médico</Text>
            <Text style={[styles.cardDesc, { fontSize: fs(14.5) }]}>
              Accede a tu panel de consultas, pacientes y gestión médica.
            </Text>
          </View>
          <View style={styles.registerButton}>
            <Text style={[styles.buttonText, { fontSize: fs(16) }]}>Registrarme</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.card, { width: select({ mobile: '100%', tablet: 320, desktop: 340 }) }]}
          activeOpacity={0.8}
          onPress={() => handleRegister('Paciente')}
        >
          <View style={styles.cardContent}>
            <View style={styles.iconWrapper}>
              <MaterialCommunityIcons name="account" size={rs(42)} color={colors.blueDark} />
            </View>
            <Text style={[styles.cardTitle, { fontSize: fs(24) }]}>Paciente</Text>
            <Text style={[styles.cardDesc, { fontSize: fs(14.5) }]}>
              Gestiona tus citas, recetas y comunícate con tus doctores.
            </Text>
          </View>
          <View style={styles.registerButton}>
            <Text style={[styles.buttonText, { fontSize: fs(16) }]}>Registrarme</Text>
          </View>
        </TouchableOpacity>
      </View>

      <View style={styles.footerWrapper}>
        <Text style={[styles.footerText, { fontSize: fs(15) }]}>
          ¿Ya tienes una cuenta?{' '}
          <Text style={styles.footerLink} onPress={handleLogin}>
            Inicia sesión aquí
>>>>>>> feature-cris
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
<<<<<<< HEAD
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

=======

  return (
    <ScrollView 
      style={styles.mainContainer} 
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      {content}
    </ScrollView>
  );
};

>>>>>>> feature-cris
export default SeleccionPerfil;
