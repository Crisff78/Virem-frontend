import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform, ScrollView } from 'react-native';
import { useResponsive } from './hooks/useResponsive';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { RootStackParamList } from './navigation/types';

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
  const { select, width, rs, fs } = useResponsive();
  
  const handleRegister = (profile: 'Medico' | 'Paciente') => {
    navigation.navigate(profile === 'Paciente' ? 'RegistroPaciente' : 'RegistroMedico');
  };

  const handleLogin = () => {
    navigation.navigate('Login');
  };

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
          activeOpacity={0.9}
          onPress={() => handleRegister('Medico')}
        >
          <View style={styles.iconWrapper}>
            <MaterialCommunityIcons name="stethoscope" size={rs(48)} color={colors.blueDark} />
          </View>
          <Text style={[styles.cardTitle, { fontSize: fs(22) }]}>Médico</Text>
          <Text style={[styles.cardDesc, { fontSize: fs(14) }]}>Accede a tu panel de consultas, pacientes y gestión médica.</Text>
          <View style={[styles.registerButton, styles.buttonMedico]}>
            <Text style={[styles.buttonText, { fontSize: fs(16) }]}>Registrarme</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.card, { width: select({ mobile: '100%', tablet: 320, desktop: 340 }) }]}
          activeOpacity={0.9}
          onPress={() => handleRegister('Paciente')}
        >
          <View style={styles.iconWrapper}>
            <MaterialCommunityIcons name="account" size={rs(48)} color={colors.blueDark} />
          </View>
          <Text style={[styles.cardTitle, { fontSize: fs(22) }]}>Paciente</Text>
          <Text style={[styles.cardDesc, { fontSize: fs(14) }]}>Gestiona tus citas, recetas y comunícate con tus doctores.</Text>
          <View style={[styles.registerButton, styles.buttonPaciente]}>
            <Text style={[styles.buttonText, { fontSize: fs(16) }]}>Registrarme</Text>
          </View>
        </TouchableOpacity>
      </View>

      <View style={styles.footerWrapper}>
        <Text style={[styles.footerText, { fontSize: fs(15) }]}>
          ¿Ya tienes una cuenta?{' '}
          <Text style={styles.footerLink} onPress={handleLogin}>
            Inicia sesión aquí
          </Text>
        </Text>
      </View>
    </View>
  );

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

const styles = StyleSheet.create({
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
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 16,
  },
  subtitle: {
    color: colors.blueMedium,
    textAlign: 'center',
    maxWidth: 500,
    lineHeight: 24,
    fontWeight: '500',
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
    borderRadius: 24,
    padding: 32,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(179, 207, 229, 0.5)',
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.1, shadowRadius: 12 },
      android: { elevation: 8 },
      web: { boxShadow: '0 8px 30px rgba(0,0,0,0.06)' }
    }),
  },
  iconWrapper: {
    height: 90,
    width: 90,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 30,
    backgroundColor: 'rgba(26, 61, 99, 0.08)',
    marginBottom: 24,
  },
  cardTitle: {
    color: colors.blueDeep,
    fontWeight: '700',
    marginBottom: 12,
  },
  cardDesc: {
    color: colors.blueMedium,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 28,
    minHeight: 40,
  },
  registerButton: {
    width: '100%',
    height: 52,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonMedico: {
    backgroundColor: colors.blueDark,
  },
  buttonPaciente: {
    backgroundColor: colors.blueDark,
  },
  buttonText: {
    color: colors.white,
    fontWeight: '800',
  },
  footerWrapper: {
    marginTop: 56,
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
});

export default SeleccionPerfil;
