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

export default SeleccionPerfil;
