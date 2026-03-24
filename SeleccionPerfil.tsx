import React from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { SafeAreaView } from 'react-native-safe-area-context';

import { RootStackParamList } from './navigation/types';

type NavigationProps = NativeStackNavigationProp<RootStackParamList, 'SeleccionPerfil'>;

const colors = {
  primary: '#137fec',
  blueDeep: '#0A1931',
  blueDark: '#1A3D63',
  blueMedium: '#4A7FA7',
  blueLight: '#B3CFE5',
  pageBg: '#F6FAFD',
  white: '#FFFFFF',
};

const SeleccionPerfil: React.FC = () => {
  const navigation = useNavigation<NavigationProps>();
  const { width } = useWindowDimensions();
  const isWideLayout = width >= 860;
  const isCompactPhone = width < 390;

  const handleRegister = (profile: 'Medico' | 'Paciente') => {
    navigation.navigate(profile === 'Paciente' ? 'RegistroPaciente' : 'RegistroMedico');
  };

  const handleLogin = () => {
    navigation.navigate('Login');
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={[
          styles.mainContainer,
          isWideLayout ? styles.mainContainerWide : styles.mainContainerMobile,
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.contentWrapper}>
          <Text style={[styles.title, isCompactPhone && styles.titleCompact]}>
            Elige cómo quieres registrarte
          </Text>
          <Text style={styles.subtitle}>
            Selecciona tu perfil para acceder a las herramientas y funciones diseñadas
            específicamente para ti.
          </Text>

          <View style={[styles.cardsGrid, isWideLayout ? styles.cardsGridRow : styles.cardsGridColumn]}>
            <View style={[styles.card, isWideLayout ? styles.cardRow : styles.cardColumn]}>
              <View style={styles.iconWrapper}>
                <MaterialCommunityIcons name="stethoscope" size={44} color={colors.blueDark} />
              </View>
              <Text style={styles.cardTitle}>Médico</Text>
              <TouchableOpacity
                style={[styles.registerButton, styles.buttonMedico]}
                onPress={() => handleRegister('Medico')}
                activeOpacity={0.9}
              >
                <Text style={styles.buttonText}>Registrarme</Text>
              </TouchableOpacity>
            </View>

            <View style={[styles.card, isWideLayout ? styles.cardRow : styles.cardColumn]}>
              <View style={styles.iconWrapper}>
                <MaterialCommunityIcons name="account" size={44} color={colors.blueDark} />
              </View>
              <Text style={styles.cardTitle}>Paciente</Text>
              <TouchableOpacity
                style={[styles.registerButton, styles.buttonPaciente]}
                onPress={() => handleRegister('Paciente')}
                activeOpacity={0.9}
              >
                <Text style={styles.buttonText}>Registrarme</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.footerWrapper}>
            <Text style={styles.footerText}>
              ¿Ya tienes una cuenta?{' '}
              <Text style={styles.footerLink} onPress={handleLogin}>
                Inicia sesión aquí.
              </Text>
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.pageBg,
  },
  mainContainer: {
    flexGrow: 1,
    width: '100%',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  mainContainerMobile: {
    justifyContent: 'center',
    paddingTop: 28,
    paddingBottom: 24,
  },
  mainContainerWide: {
    justifyContent: 'center',
    paddingTop: 36,
    paddingBottom: 32,
  },
  contentWrapper: {
    width: '100%',
    maxWidth: 960,
    alignItems: 'center',
  },
  title: {
    color: colors.blueDeep,
    fontSize: 52,
    fontWeight: '800',
    textAlign: 'center',
    lineHeight: 58,
    marginBottom: 16,
  },
  titleCompact: {
    fontSize: 48,
    lineHeight: 52,
  },
  subtitle: {
    color: colors.blueMedium,
    fontSize: 16,
    maxWidth: 620,
    textAlign: 'center',
    marginBottom: 30,
    lineHeight: 24,
  },
  cardsGrid: {
    width: '100%',
    gap: 20,
  },
  cardsGridColumn: {
    flexDirection: 'column',
  },
  cardsGridRow: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  card: {
    backgroundColor: colors.white,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.blueLight,
    paddingVertical: 26,
    paddingHorizontal: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  cardColumn: {
    width: '100%',
  },
  cardRow: {
    width: '48%',
    maxWidth: 430,
  },
  iconWrapper: {
    height: 78,
    width: 78,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 39,
    backgroundColor: 'rgba(179, 207, 229, 0.3)',
    marginBottom: 14,
  },
  cardTitle: {
    color: colors.blueDeep,
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 16,
  },
  registerButton: {
    minWidth: 190,
    height: 48,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  buttonMedico: {
    backgroundColor: colors.blueDark,
  },
  buttonPaciente: {
    backgroundColor: colors.blueMedium,
  },
  buttonText: {
    color: colors.white,
    fontSize: 20,
    fontWeight: '700',
  },
  footerWrapper: {
    marginTop: 22,
    marginBottom: 8,
  },
  footerText: {
    color: colors.blueMedium,
    fontSize: 15,
    textAlign: 'center',
  },
  footerLink: {
    color: colors.blueDark,
    fontWeight: '700',
    textDecorationLine: 'underline',
  },
});

export default SeleccionPerfil;
