import React from 'react';
import { View, Text, StyleSheet, Platform, ScrollView, TouchableOpacity, Image, Animated } from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from './navigation/types';
import { useResponsive } from './hooks/useResponsive';

type Nav = NativeStackNavigationProp<RootStackParamList, 'EspecialidadDetalle'>;
type Route = RouteProp<RootStackParamList, 'EspecialidadDetalle'>;

const colors = {
  primary: '#2B6CB0',
  secondary: '#1A365D',
  dark: '#0F172A',
  muted: '#475569',
  bg: '#F8FAFC',
  white: '#FFFFFF',
};

const EspecialidadDetalleScreen = () => {
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const { isDesktop, select } = useResponsive();
  const { title, description, image, icon, extendedInfo } = route.params;

  return (
    <View style={styles.container}>
      {/* HEADER FIXED */}
      <View style={[styles.header, { height: select({ mobile: 70, tablet: 80, desktop: 80 }) }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <MaterialIcons name="arrow-back" size={24} color={colors.primary} />
          <Text style={styles.backText}>Volver</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{title}</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* HERO IMAGE SECTION */}
        <View style={[styles.heroContainer, { height: select({ mobile: 220, tablet: 280, desktop: 350 }) }]}>
          <Image 
            source={typeof image === 'string' ? { uri: image } : image} 
            style={[
              styles.heroImage, 
              title === 'Nutrición' && { transform: [{ translateY: -40 }] },
              title === 'Odontología' && { transform: [{ translateY: 40 }] }
            ]} 
            resizeMode="cover" 
          />
          <View style={styles.imageOverlay} />
          <View style={[styles.titleContainer, { bottom: select({ mobile: 40, tablet: 50, desktop: 60 }), left: select({ mobile: 24, tablet: 60, desktop: 80 }) }]}>
            <View style={[styles.iconBadge, { width: 50, height: 50, marginBottom: 12 }]}>
              <MaterialIcons name={icon} size={28} color="#fff" />
            </View>
            <Text style={[styles.heroTitle, { fontSize: select({ mobile: 28, tablet: 40, desktop: 48 }) }]}>
              {title}
            </Text>
          </View>
        </View>

        {/* CONTENT */}
        <View style={[styles.contentWrapper, { marginTop: -30 }]}>
          <View style={[styles.infoCard, { padding: select({ mobile: 24, tablet: 40, desktop: 50 }) }]}>
            <Text style={styles.sectionHeading}>Sobre esta especialidad</Text>
            <Text style={styles.mainDescription}>{description}</Text>
            
            <View style={styles.divider} />
            
            <Text style={styles.sectionHeading}>Información Detallada</Text>
            <Text style={styles.extendedText}>
              {extendedInfo || "En VIREM, nos comprometemos a ofrecer una atención de calidad superior. Esta especialidad cuenta con profesionales certificados que utilizan las últimas tecnologías de telemedicina para garantizar un diagnóstico preciso y un seguimiento constante de tu salud. Desde la comodidad de tu hogar, podrás acceder a consultas, recetas digitales y planes de tratamiento personalizados adaptados a tus necesidades específicas."}
            </Text>

            <View style={styles.featuresGrid}>
              <View style={styles.featureItem}>
                <MaterialIcons name="videocam" size={24} color={colors.primary} />
                <Text style={styles.featureText}>Consulta Virtual HD</Text>
              </View>
              <View style={styles.featureItem}>
                <MaterialIcons name="description" size={24} color={colors.primary} />
                <Text style={styles.featureText}>Recetas Inmediatas</Text>
              </View>
              <View style={styles.featureItem}>
                <MaterialIcons name="history" size={24} color={colors.primary} />
                <Text style={styles.featureText}>Seguimiento Continuo</Text>
              </View>
            </View>

            <TouchableOpacity 
              style={styles.actionBtn}
              onPress={() => navigation.navigate('EspecialistasPorEspecialidad', { specialty: title })}
            >
              <Text style={styles.actionBtnText}>AGENDAR CON UN ESPECIALISTA</Text>
              <MaterialIcons name="chevron-right" size={24} color="#fff" />
            </TouchableOpacity>
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
    paddingHorizontal: 24, 
    backgroundColor: '#fff', 
    borderBottomWidth: 1, 
    borderBottomColor: '#E2E8F0',
    paddingTop: Platform.OS === 'ios' ? 40 : 0,
    zIndex: 100,
    elevation: 10
  },
  backBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F1F5F9', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10, marginRight: 16 },
  backText: { color: colors.primary, fontWeight: '700', marginLeft: 4, fontSize: 14 },
  headerTitle: { fontSize: 18, fontWeight: '800', color: colors.dark },
  scrollContent: { paddingBottom: 60 },
  
  heroContainer: { width: '100%', position: 'relative', overflow: 'hidden' },
  heroImage: { width: '100%', height: '100%' },
  imageOverlay: { 
    position: 'absolute', 
    top: 0, left: 0, right: 0, bottom: 0, 
    backgroundColor: 'rgba(15, 23, 42, 0.5)' 
  },
  titleContainer: { 
    position: 'absolute', 
    bottom: 60, 
    right: 24, 
    alignItems: 'flex-start' 
  },
  iconBadge: { 
    width: 60, 
    height: 60, 
    borderRadius: 18, 
    backgroundColor: colors.primary, 
    justifyContent: 'center', 
    alignItems: 'center', 
    marginBottom: 20,
    shadowColor: '#000',
    shadowOpacity: 0.4,
    shadowRadius: 15,
    elevation: 10
  },
  heroTitle: { 
    fontWeight: '900', 
    color: '#fff', 
    textShadowColor: 'rgba(0,0,0,0.5)', 
    textShadowOffset: { width: 0, height: 4 }, 
    textShadowRadius: 15,
    letterSpacing: -1
  },
  
  contentWrapper: { paddingHorizontal: 20, maxWidth: 1100, alignSelf: 'center', width: '100%', zIndex: 10 },
  infoCard: { 
    backgroundColor: '#fff', 
    borderRadius: 24, 
    shadowColor: '#000', 
    shadowOpacity: 0.12, 
    shadowRadius: 40, 
    elevation: 15,
    borderWidth: 1,
    borderColor: 'rgba(226, 232, 240, 0.8)'
  },
  sectionHeading: { fontSize: 22, fontWeight: '800', color: colors.secondary, marginBottom: 16 },
  mainDescription: { fontSize: 18, color: colors.dark, lineHeight: 28, marginBottom: 24, fontWeight: '500' },
  divider: { height: 1, backgroundColor: '#E2E8F0', marginVertical: 30 },
  extendedText: { fontSize: 16, color: colors.muted, lineHeight: 26, marginBottom: 30 },
  
  featuresGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 20, marginBottom: 40 },
  featureItem: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#F0F9FF', padding: 12, borderRadius: 12, flex: 1, minWidth: 200 },
  featureText: { fontSize: 14, fontWeight: '700', color: colors.primary },
  
  actionBtn: { 
    backgroundColor: colors.primary, 
    padding: 20, 
    borderRadius: 16, 
    flexDirection: 'row', 
    justifyContent: 'center', 
    alignItems: 'center', 
    gap: 12,
    shadowColor: colors.primary,
    shadowOpacity: 0.3,
    shadowRadius: 15,
    elevation: 8
  },
  actionBtnText: { color: '#fff', fontSize: 18, fontWeight: '800' }
});

export default EspecialidadDetalleScreen;
