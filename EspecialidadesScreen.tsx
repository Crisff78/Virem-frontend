import React, { useRef } from 'react';
import { View, Text, StyleSheet, Platform, ScrollView, TouchableOpacity, Animated } from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from './navigation/types';
import { useResponsive } from './hooks/useResponsive';

type Nav = NativeStackNavigationProp<RootStackParamList, 'Especialidades'>;

const colors = {
  primary: '#2B6CB0',
  secondary: '#1A365D',
  dark: '#0F172A',
  muted: '#475569',
  bg: '#F8FAFC',
  white: '#FFFFFF',
};

const HoverSpecialtyCard = ({ icon, title, context, sub, count, image, style }: any) => {
  const navigation = useNavigation<Nav>();
  const scale = useRef(new Animated.Value(1)).current;
  const overlayOpacity = useRef(new Animated.Value(0)).current;
  const overlayTranslateY = useRef(new Animated.Value(20)).current;

  const handleMouseEnter = () => {
    Animated.parallel([
      Animated.timing(scale, { toValue: 1.05, duration: 300, useNativeDriver: false }),
      Animated.timing(overlayOpacity, { toValue: 1, duration: 300, useNativeDriver: false }),
      Animated.timing(overlayTranslateY, { toValue: 0, duration: 300, useNativeDriver: false }),
    ]).start();
  };

  const handleMouseLeave = () => {
    Animated.parallel([
      Animated.timing(scale, { toValue: 1, duration: 300, useNativeDriver: false }),
      Animated.timing(overlayOpacity, { toValue: 0, duration: 300, useNativeDriver: false }),
      Animated.timing(overlayTranslateY, { toValue: 20, duration: 300, useNativeDriver: false }),
    ]).start();
  };

  return (
    <Animated.View
      style={[style, { transform: [{ scale }] }]}
      {...Platform.select({
        web: { onMouseEnter: handleMouseEnter, onMouseLeave: handleMouseLeave },
      } as any)}
    >
      <View style={styles.iconContainer}>
        <MaterialIcons name={icon} size={32} color={colors.secondary} />
      </View>
      <Text style={styles.cardTitle}>{title}</Text>
      <Text style={styles.cardSub}>{sub}</Text>
      <Text style={styles.cardCount}>{count}</Text>
      
      {/* Context Overlay */}
      <Animated.View style={{
        position: 'absolute',
        top: 0, left: 0, right: 0, bottom: 0,
        backgroundColor: 'rgba(26, 54, 93, 0.98)',
        borderRadius: 24,
        padding: 24,
        justifyContent: 'center',
        alignItems: 'center',
        opacity: overlayOpacity,
        transform: [{ translateY: overlayTranslateY }],
        ...Platform.select({ web: { backdropFilter: 'blur(8px)' } } as any)
      }}>
        <MaterialIcons name="info-outline" size={24} color="#fff" style={{ marginBottom: 12 }} />
        <Text style={{ color: '#fff', fontSize: 14, textAlign: 'center', lineHeight: 22, fontWeight: '500' }}>
          {context}
        </Text>
        <TouchableOpacity 
          style={{ marginTop: 16, backgroundColor: colors.primary, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8 }}
          onPress={() => navigation.navigate('EspecialidadDetalle', { title, description: context, icon, image })}
        >
          <Text style={{ color: '#fff', fontSize: 12, fontWeight: '800' }}>SABER MÁS</Text>
        </TouchableOpacity>
      </Animated.View>
    </Animated.View>
  );
};

const EspecialidadesScreen = () => {
  const navigation = useNavigation<Nav>();
  const { isDesktop, select } = useResponsive();

  const otrasEspecialidades = [
    { icon: "monitor-heart", title: "Medicina Interna", sub: "Consulta médica especializada", count: "Disponibilidad variable", context: "Atención experta en enfermedades complejas del adulto y coordinación de cuidados multiespecialidad.", img: require('./assets/imagenes/MedicinaInterna.png') },
    { icon: "restaurant", title: "Nutrición", sub: "Dieta y bienestar alimenticio", count: "Disponibilidad variable", context: "Planes de alimentación personalizados para mejorar tu salud, rendimiento y calidad de vida.", img: require('./assets/imagenes/Nutricion.png') },
    { icon: "sentiment-satisfied", title: "Odontología", sub: "Salud oral y dental", count: "Disponibilidad variable", context: "Cuidado integral de tu sonrisa, desde prevención hasta tratamientos restaurativos avanzados.", img: require('./assets/imagenes/Odontologia.png') },
    { icon: "child-care", title: "Pediatría", sub: "Atención integral para niños", count: "Disponibilidad variable", context: "Seguimiento del crecimiento y desarrollo para los más pequeños de la casa con amor y profesionalismo.", img: require('./assets/imagenes/Pediatria.png') },
    { icon: "accessible-forward", title: "Reumatología", sub: "Consulta médica especializada", count: "Disponibilidad variable", context: "Tratamiento de enfermedades articulares, óseas y musculares para recuperar tu movilidad.", img: require('./assets/imagenes/Reumologia.png') },
    { icon: "transgender", title: "Sexología", sub: "Consulta médica especializada", count: "Disponibilidad variable", context: "Espacio seguro y profesional para abordar la salud sexual y el bienestar de pareja.", img: require('./assets/imagenes/Sexologia .png') },
  ];

  const especialidadesDestacadas = [
    { icon: "medical-services", title: "Medicina General", sub: "Atención primaria inicial", count: "6 médico(s) disponible(s)", context: "Atención primaria inicial para diagnósticos generales y prevención de enfermedades.", img: require('./assets/imagenes/MedicinaGeneral.png') },
    { icon: "psychology", title: "Psicología", sub: "Salud mental y emocional", count: "3 médico(s) disponible(s)", context: "Acompañamiento profesional para tu salud mental, manejo de estrés y bienestar emocional.", img: require('./assets/imagenes/Psicologia.png') },
    { icon: "favorite-border", title: "Cardiología", sub: "Corazón y sistema circulatorio", count: "Disponibilidad variable", context: "Especialistas en el cuidado del corazón y prevención de enfermedades cardiovasculares.", img: require('./assets/imagenes/Cardiologia.png') },
    { icon: "face", title: "Dermatología", sub: "Cuidado de la piel y cabello", count: "Disponibilidad variable", context: "Diagnóstico y tratamiento para afecciones de la piel, cabello y uñas.", img: require('./assets/imagenes/Dermatologia.png') },
    { icon: "medication", title: "Endocrinología", sub: "Hormonas y metabolismo", count: "Disponibilidad variable", context: "Control de hormonas, diabetes, tiroides y trastornos metabólicos.", img: require('./assets/imagenes/Endocrinologia.png') },
    { icon: "pregnant-woman", title: "Ginecología", sub: "Salud femenina y reproductiva", count: "Disponibilidad variable", context: "Salud integral para la mujer en todas sus etapas y cuidado reproductivo.", img: require('./assets/imagenes/Ginecologia.png') },
  ];

  return (
    <View style={styles.container}>
      {/* HEADER FIXED */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <MaterialIcons name="arrow-back" size={24} color={colors.primary} />
          <Text style={styles.backText}>Volver al Inicio</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Catálogo Médico</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.content}>
          <Text style={styles.mainTitle}>Nuestras Especialidades</Text>
          <Text style={styles.introText}>
            Explora nuestra gama completa de servicios médicos. Pasa el cursor sobre cada tarjeta para conocer más detalles y haz clic para ver información extendida.
          </Text>

          <Text style={styles.sectionTitle}>Otras Especialidades</Text>
          <View style={styles.grid}>
            {otrasEspecialidades.map((esp, i) => (
              <TouchableOpacity 
                key={i} 
                style={{ width: select({ mobile: "100%", tablet: "48%", desktop: "30%" }) }}
                onPress={() => navigation.navigate('EspecialidadDetalle', { title: esp.title, description: esp.context, icon: esp.icon, image: esp.img })}
              >
                <HoverSpecialtyCard 
                  {...esp}
                  image={esp.img}
                  style={styles.card} 
                />
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.divider} />

          <Text style={styles.sectionTitle}>Especialidades Destacadas</Text>
          <View style={styles.grid}>
            {especialidadesDestacadas.map((esp, i) => (
              <TouchableOpacity 
                key={i} 
                style={{ width: select({ mobile: "100%", tablet: "48%", desktop: "30%" }) }}
                onPress={() => navigation.navigate('EspecialidadDetalle', { title: esp.title, description: esp.context, icon: esp.icon, image: esp.img })}
              >
                <HoverSpecialtyCard 
                  {...esp}
                  image={esp.img}
                  style={styles.card} 
                />
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  header: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    padding: 20, 
    backgroundColor: '#fff', 
    borderBottomWidth: 1, 
    borderBottomColor: '#E2E8F0',
    paddingTop: Platform.OS === 'ios' ? 50 : 20
  },
  backBtn: { flexDirection: 'row', alignItems: 'center', marginRight: 20 },
  backText: { color: colors.primary, fontWeight: '600', marginLeft: 8, fontSize: 16 },
  headerTitle: { fontSize: 20, fontWeight: '800', color: colors.dark },
  scrollContent: { paddingBottom: 60 },
  content: { padding: 24, maxWidth: 1200, alignSelf: 'center', width: '100%' },
  mainTitle: { fontSize: 36, fontWeight: '900', color: colors.dark, textAlign: 'center', marginBottom: 12 },
  introText: { fontSize: 17, color: colors.muted, lineHeight: 26, marginBottom: 50, textAlign: 'center', maxWidth: 800, alignSelf: 'center' },
  sectionTitle: { fontSize: 24, fontWeight: '800', color: colors.secondary, marginBottom: 24, paddingLeft: 10 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 24, justifyContent: 'center' },
  card: { 
    backgroundColor: '#fff', 
    borderRadius: 24, 
    padding: 30, 
    alignItems: 'center', 
    borderWidth: 1, 
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOpacity: 0.02,
    shadowRadius: 15,
    elevation: 2,
    height: 220,
    overflow: 'hidden'
  },
  iconContainer: { 
    width: 64, 
    height: 64, 
    borderRadius: 20, 
    backgroundColor: '#F0F7FA', 
    justifyContent: 'center', 
    alignItems: 'center', 
    marginBottom: 16 
  },
  cardTitle: { fontSize: 18, fontWeight: '900', color: colors.dark, marginBottom: 6, textAlign: 'center' },
  cardSub: { fontSize: 14, color: colors.muted, textAlign: 'center', marginBottom: 8 },
  cardCount: { fontSize: 12, fontWeight: '700', color: colors.primary, textAlign: 'center' },
  divider: { height: 1, backgroundColor: '#E2E8F0', marginVertical: 60, width: '100%' }
});

export default EspecialidadesScreen;
