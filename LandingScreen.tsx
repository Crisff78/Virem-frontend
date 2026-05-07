import React, { useRef, useState, useEffect } from 'react';
import { View, Text, StyleSheet, Platform, ScrollView, TouchableOpacity, Image, Animated, Pressable, Easing } from 'react-native';
import { useResponsive } from './hooks/useResponsive';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from './navigation/types';
import ViremImage from './components/ViremImage';
import { shadow } from './utils/styles';

type Nav = NativeStackNavigationProp<RootStackParamList, 'Landing'>;

const ViremLogo = require('./assets/imagenes/descarga.png');
const EquipoVirem = require('./assets/imagenes/equipo_virem.png');
const HeartHQImg = require('./assets/imagenes/Heart_HQ.png');
const HTImg = require('./assets/imagenes/HT.png');
const VcImg = require('./assets/imagenes/vc.png');

const colors = {
  primary: '#2B6CB0',
  secondary: '#1A365D',
  dark: '#0F172A',
  muted: '#475569',
  bg: '#F8FAFC',
  white: '#FFFFFF',
};

const FadeInView = ({ children, delay = 0, style }: any) => {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.delay(delay),
      Animated.parallel([
        Animated.timing(opacity, { toValue: 1, duration: 700, useNativeDriver: true }),
        Animated.timing(translateY, { toValue: 0, duration: 700, useNativeDriver: true })
      ])
    ]).start();
  }, [delay, opacity, translateY]);

  return (
    <Animated.View style={[style, { opacity, transform: [{ translateY }] }]}>
      {children}
    </Animated.View>
  );
};

const FeatureItem = ({ icon, title, description, delay = 0 }: any) => {
  return (
    <FadeInView delay={delay} style={{ flexDirection: 'row', marginBottom: 24, alignItems: 'flex-start' }}>
      <View style={{ 
        width: 48, 
        height: 48, 
        borderRadius: 14, 
        backgroundColor: '#EBF8FF', 
        justifyContent: 'center', 
        alignItems: 'center',
        marginRight: 16,
        ...shadow(colors.primary, 0.1, 8, { width: 0, height: 3 }, 3)
      }}>
        <MaterialIcons name={icon} size={24} color={colors.primary} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: 16, fontWeight: '800', color: colors.dark, marginBottom: 4 }}>{title}</Text>
        <Text style={{ fontSize: 14, color: colors.muted, lineHeight: 20 }}>{description}</Text>
      </View>
    </FadeInView>
  );
};

const HoverCard = ({ children, style, onPress }: any) => {
  const scale = useRef(new Animated.Value(1)).current;
  const shadowOpacity = useRef(new Animated.Value(0.02)).current;

  const handleMouseEnter = () => {
    Animated.parallel([
      Animated.timing(scale, { toValue: 1.03, duration: 300, useNativeDriver: false }),
      Animated.timing(shadowOpacity, { toValue: 0.15, duration: 300, useNativeDriver: false })
    ]).start();
  };

  const handleMouseLeave = () => {
    Animated.parallel([
      Animated.timing(scale, { toValue: 1, duration: 300, useNativeDriver: false }),
      Animated.timing(shadowOpacity, { toValue: 0.02, duration: 300, useNativeDriver: false })
    ]).start();
  };

  return (
    <Animated.View
      style={[style, { transform: [{ scale }], shadowOpacity }]}
      {...Platform.select({
        web: { onMouseEnter: handleMouseEnter, onMouseLeave: handleMouseLeave }
      })}
    >
      <Pressable onPress={onPress} style={{ flex: 1 }}>
        {children}
      </Pressable>
    </Animated.View>
  );
};

const HoverButton = ({ children, onPress, style }: any) => {
  const scale = useRef(new Animated.Value(1)).current;

  const onIn = () => Animated.spring(scale, { toValue: 1.03, useNativeDriver: true }).start();
  const onOut = () => Animated.spring(scale, { toValue: 1, useNativeDriver: true }).start();

  return (
    <Animated.View style={[{ transform: [{ scale }] }]}>
      <Pressable
        onPress={onPress}
        onHoverIn={onIn}
        onHoverOut={onOut}
        style={({ pressed }) => [style, { opacity: pressed ? 0.7 : 1 }]}
      >
        {children}
      </Pressable>
    </Animated.View>
  );
};

const AnimatedGradientBg = ({ children, style }: any) => {
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(anim, { toValue: 1, duration: 4000, useNativeDriver: false }),
        Animated.timing(anim, { toValue: 0, duration: 4000, useNativeDriver: false }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [anim]);

  const bgColor = anim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: ['#EBF5FB', '#E1EFF9', '#D6E8F4'],
  });

  return (
    <Animated.View style={[style, { backgroundColor: bgColor, overflow: 'hidden' }]}>
      <Animated.View style={{
        position: 'absolute', top: -80, right: -80,
        width: 350, height: 350, borderRadius: 175,
        backgroundColor: 'rgba(43, 108, 176, 0.08)',
        transform: [{ scale: anim.interpolate({ inputRange: [0, 1], outputRange: [1, 1.2] }) }],
      }} />
      <Animated.View style={{
        position: 'absolute', bottom: -60, left: -60,
        width: 280, height: 280, borderRadius: 140,
        backgroundColor: 'rgba(26, 54, 93, 0.06)',
        transform: [{ scale: anim.interpolate({ inputRange: [0, 1], outputRange: [1.2, 1] }) }],
      }} />
      {children}
    </Animated.View>
  );
};

const HoverBlogCard = ({ category, title, description, image, onPress, style }: any) => {
  const scale = useRef(new Animated.Value(1)).current;
  const shadowOpacity = useRef(new Animated.Value(0.1)).current;
  const [hovered, setHovered] = useState(false);

  const handleMouseEnter = () => {
    setHovered(true);
    Animated.parallel([
      Animated.timing(scale, { toValue: 1.02, duration: 300, useNativeDriver: false }),
      Animated.timing(shadowOpacity, { toValue: 0.25, duration: 300, useNativeDriver: false }),
    ]).start();
  };

  const handleMouseLeave = () => {
    setHovered(false);
    Animated.parallel([
      Animated.timing(scale, { toValue: 1, duration: 300, useNativeDriver: false }),
      Animated.timing(shadowOpacity, { toValue: 0.1, duration: 300, useNativeDriver: false }),
    ]).start();
  };

  return (
    <Animated.View
      style={[style, { transform: [{ scale }], shadowOpacity, backgroundColor: '#fff', borderRadius: 24, overflow: 'hidden' }]}
      {...Platform.select({
        web: { onMouseEnter: handleMouseEnter, onMouseLeave: handleMouseLeave }
      } as any)}
    >
      <Pressable onPress={onPress} style={{ flex: 1 }}>
        <View style={{ height: 240, overflow: 'hidden' }}>
          <Image
            source={{ uri: image }}
            style={{ width: '100%', height: '100%' }}
            resizeMode="cover"
          />
          <View style={{
            position: 'absolute',
            top: 20,
            left: 20,
            backgroundColor: 'rgba(255, 255, 255, 0.9)',
            paddingHorizontal: 12,
            paddingVertical: 6,
            borderRadius: 12,
          }}>
            <Text style={{ color: colors.primary, fontSize: 11, fontWeight: '800', letterSpacing: 1 }}>{category}</Text>
          </View>
        </View>

        <View style={{ padding: 30 }}>
          <Text style={{ color: colors.dark, fontSize: 22, fontWeight: '800', marginBottom: 12, lineHeight: 28 }}>{title}</Text>
          <Text style={{ color: colors.muted, fontSize: 15, lineHeight: 24, marginBottom: 20 }}>{description}</Text>

          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Text style={{ color: colors.primary, fontWeight: '700', fontSize: 14 }}>Leer más</Text>
            <MaterialIcons name="arrow-forward" size={18} color={colors.primary} />
          </View>
        </View>
      </Pressable>
    </Animated.View>
  );
};

const LandingScreen: React.FC = () => {
  const navigation = useNavigation<Nav>();
  const { isDesktop, isMobile, select } = useResponsive();
  const scrollY = useRef(new Animated.Value(0)).current;
  const scrollRef = useRef<ScrollView>(null);
  const [layoutY, setLayoutY] = useState({ plataforma: 0, especialidades: 0, nosotros: 0, blog: 0, contacto: 0 });

  const scrollTo = (y: number) => {
    scrollRef.current?.scrollTo({ y, animated: true });
  };

  return (
    <View style={styles.container}>
      {/* NAVBAR */}
      <Animated.View style={[
        styles.navbar,
        isDesktop && styles.navbarDesktop,
        {
          backgroundColor: scrollY.interpolate({
            inputRange: [0, 50],
            outputRange: ['rgba(255,255,255,0)', 'rgba(255,255,255,0.95)'],
            extrapolate: 'clamp'
          }),
          borderBottomWidth: scrollY.interpolate({
            inputRange: [0, 50],
            outputRange: [0, 1],
            extrapolate: 'clamp'
          }),
          borderBottomColor: '#E2E8F0',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 100,
        }
      ]}>
        <View style={styles.navLeft}>
          <ViremImage source={ViremLogo} style={styles.logoImage} />
          <Text style={styles.logoText}>VIREM</Text>
        </View>

        {isDesktop && (
          <View style={styles.navLinksCenter}>
            <TouchableOpacity onPress={() => scrollTo(layoutY.plataforma)}>
              <Text style={styles.navLinkCenterText}>Plataforma</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => scrollTo(layoutY.especialidades)}>
              <Text style={styles.navLinkCenterText}>Especialidades</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => scrollTo(layoutY.nosotros)}>
              <Text style={styles.navLinkCenterText}>Nosotros</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => scrollTo(layoutY.blog)}>
              <Text style={styles.navLinkCenterText}>Blog</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => scrollTo(layoutY.contacto)}>
              <Text style={styles.navLinkCenterText}>Contacto</Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={styles.navRight}>
          <TouchableOpacity 
            onPress={() => navigation.navigate('Login')}
            style={[styles.navBtn, { backgroundColor: colors.primary, marginRight: 12, ...shadow(colors.primary, 0.2, 10, { width: 0, height: 4 }, 4) }]}
          >
            <Text style={styles.navBtnText}>ACCEDER</Text>
          </TouchableOpacity>
        </View>
      </Animated.View>

      <ScrollView 
        ref={scrollRef}
        onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], { useNativeDriver: false })}
        scrollEventThrottle={16}
        contentContainerStyle={styles.scrollContent}
      >
        {/* HERO SECTION */}
        <AnimatedGradientBg style={[styles.heroSection, isDesktop && styles.heroDesktop]}>
          <View style={styles.heroTextContainer}>
            <FadeInView style={isDesktop && styles.heroTextDesktop}>
              <Text style={styles.heroTitle}>
                ¡TU SALUD ES NUESTRA <Text style={{ color: colors.primary }}>PRIORIDAD</Text>!
              </Text>
              <Text style={styles.heroSubtitle}>
                Somos líderes en atención primaria en salud. Nos enfocamos en prestar un servicio de salud integral destinado a proteger tu salud y bienestar, desde la comodidad de tu hogar.
              </Text>
              
              <TouchableOpacity 
                onPress={() => navigation.navigate('SeleccionPerfil')}
                style={[styles.heroActionBtn, shadow(colors.primary, 0.3, 15, { width: 0, height: 8 }, 8)]}
              >
                <Text style={styles.heroActionBtnText}>AGENDAR UNA CITA</Text>
              </TouchableOpacity>
            </FadeInView>
          </View>

          <View style={styles.heroImageContainer}>
            <FadeInView delay={300} style={{ width: '100%', height: '100%', justifyContent: 'center', alignItems: 'center' }}>
              <Animated.View style={[{
                width: isDesktop ? 600 : 350,
                height: isDesktop ? 600 : 350,
              }, {
                transform: [{
                  translateY: scrollY.interpolate({
                    inputRange: [0, 500],
                    outputRange: [0, 40],
                    extrapolate: 'clamp'
                  })
                }]
              } as any]}>
                <ViremImage 
                  source={HeartHQImg} 
                  style={{ width: '100%', height: '100%' }} 
                  contentFit="contain"
                />
              </Animated.View>
            </FadeInView>
          </View>
        </AnimatedGradientBg>

        {/* CÓMO FUNCIONA */}
        <View onLayout={(e) => setLayoutY(prev => ({...prev, plataforma: e.nativeEvent.layout.y}))} style={[styles.howItWorksSection, isDesktop && styles.howItWorksDesktop]}>
          <View style={styles.howItWorksImgContainer}>
            <View style={[styles.greenCircle, shadow(colors.secondary, 0.2, 30, { width: 0, height: 10 }, 10)]}>
              <ViremImage source={EquipoVirem} style={styles.doctorCircleImage} />
            </View>
          </View>
          <View style={[styles.howItWorksTextContainer, isDesktop && styles.howItWorksTextDesktop]}>
            <Text style={styles.sectionHeadingLeft}>Cómo funciona VIREM</Text>
            <Text style={styles.sectionBodyLeft}>
              En VIREM, hemos simplificado el acceso a la salud. Nuestra plataforma te permite conectar con especialistas certificados de manera inmediata y segura.
            </Text>
            
            <View style={{ marginTop: 20 }}>
              <FeatureItem 
                icon="touch-app" 
                title="Agenda fácil" 
                description="Elige el médico y el horario que mejor te convenga en segundos."
                delay={200}
              />
              <FeatureItem 
                icon="videocam" 
                title="Consulta Segura" 
                description="Videollamadas cifradas de alta calidad para tu privacidad."
                delay={400}
              />
              <FeatureItem 
                icon="assignment" 
                title="Recetas Digitales" 
                description="Recibe tus indicaciones y recetas válidas al instante."
                delay={600}
              />
            </View>
          </View>
        </View>

        {/* SERVICES */}
        <View onLayout={(e) => setLayoutY(prev => ({...prev, especialidades: e.nativeEvent.layout.y}))} style={styles.servicesSection}>
          <Text style={styles.sectionHeadingCenter}>Nuestros Servicios</Text>
          <Text style={styles.sectionBodyCenter}>
            Ofrecemos una gama completa de herramientas diseñadas para facilitar tu camino hacia una mejor salud.
          </Text>
          
          <View style={[styles.cardsGrid, isDesktop && styles.cardsGridDesktop]}>
            <HoverCard style={styles.serviceCard} onPress={() => {}}>
              <ViremImage source={VcImg} style={styles.cardImage} />
              <View style={styles.cardContent}>
                <Text style={styles.cardTitle}>Consultas Virtuales</Text>
                <Text style={styles.cardDescription}>Atención médica especializada por videollamada segura.</Text>
              </View>
            </HoverCard>

            <HoverCard style={styles.serviceCard} onPress={() => {}}>
              <ViremImage source={HTImg} style={styles.cardImage} />
              <View style={styles.cardContent}>
                <Text style={styles.cardTitle}>Recetas Digitales</Text>
                <Text style={styles.cardDescription}>Recibe tus prescripciones médicas oficiales directamente en tu perfil.</Text>
              </View>
            </HoverCard>
          </View>
        </View>

        {/* FOOTER */}
        <View onLayout={(e) => setLayoutY(prev => ({ ...prev, contacto: e.nativeEvent.layout.y }))} style={styles.footerContainer}>
          <View style={[styles.footer, isDesktop && styles.footerDesktop]}>
            <View style={styles.footerBrandSection}>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 20 }}>
                <View style={styles.footerLogoContainer}>
                  <ViremImage source={ViremLogo} style={styles.footerLogoImage} />
                </View>
                <Text style={[styles.logoText, { color: '#fff' }]}>VIREM</Text>
              </View>
              <Text style={{ color: 'rgba(255,255,255,0.7)', lineHeight: 24 }}>Liderando la transformación digital de la salud en la región.</Text>
            </View>

            <View style={styles.footerLinksColumn}>
              <Text style={styles.footerColumnTitle}>CONTACTO</Text>
              <Text style={styles.footerLinkItem}>soporte@virem.com</Text>
              <Text style={styles.footerLinkItem}>+1 234 567 890</Text>
            </View>
          </View>
          <View style={{ borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.1)', padding: 30, alignItems: 'center' }}>
            <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12 }}>© 2026 VIREM. Todos los derechos reservados.</Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  scrollContent: { flexGrow: 1 },
  navbar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, zIndex: 100 },
  navbarDesktop: { paddingHorizontal: 60, paddingVertical: 20 },
  navLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  logoImage: { width: 45, height: 45 },
  logoText: { fontSize: 28, fontWeight: '900', color: colors.dark, letterSpacing: -0.5 },
  navLinksCenter: { flexDirection: 'row', gap: 32 },
  navLinkCenterText: { color: colors.muted, fontWeight: '600', fontSize: 16 },
  navRight: { flexDirection: 'row', alignItems: 'center' },
  navBtn: { paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12 },
  navBtnText: { color: colors.white, fontWeight: '800', fontSize: 14 },
  heroSection: { minHeight: 600, paddingVertical: 60 },
  heroDesktop: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 80, minHeight: 750 },
  heroTextContainer: { flex: 1, zIndex: 2, padding: 24 },
  heroTextDesktop: { paddingRight: 60 },
  heroTitle: { fontSize: 48, fontWeight: '900', color: colors.dark, marginBottom: 24, lineHeight: 56 },
  heroSubtitle: { fontSize: 18, color: colors.muted, lineHeight: 30, marginBottom: 40 },
  heroActionBtn: { backgroundColor: colors.primary, paddingHorizontal: 40, paddingVertical: 20, borderRadius: 12, alignSelf: 'flex-start' },
  heroActionBtnText: { color: colors.white, fontSize: 16, fontWeight: '900' },
  heroImageContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  howItWorksSection: { padding: 24, paddingVertical: 100, backgroundColor: '#fff' },
  howItWorksDesktop: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 80 },
  howItWorksImgContainer: { flex: 0.8, alignItems: 'center', justifyContent: 'center' },
  greenCircle: { width: 400, height: 400, borderRadius: 200, backgroundColor: colors.secondary, justifyContent: 'center', alignItems: 'center', overflow: 'hidden' },
  doctorCircleImage: { width: '92%', height: '92%', borderRadius: 200 },
  howItWorksTextContainer: { flex: 1 },
  howItWorksTextDesktop: { paddingLeft: 80 },
  sectionHeadingLeft: { fontSize: 32, fontWeight: '900', color: colors.dark, marginBottom: 24 },
  sectionBodyLeft: { fontSize: 16, color: colors.muted, lineHeight: 28, marginBottom: 16 },
  servicesSection: { padding: 24, paddingVertical: 100, alignItems: 'center' },
  sectionHeadingCenter: { fontSize: 36, fontWeight: '900', color: colors.dark, marginBottom: 16, textAlign: 'center' },
  sectionBodyCenter: { fontSize: 18, color: colors.muted, lineHeight: 28, textAlign: 'center', maxWidth: 800, marginBottom: 60 },
  cardsGrid: { flexDirection: 'column', gap: 30, width: '100%', maxWidth: 1200 },
  cardsGridDesktop: { flexDirection: 'row', justifyContent: 'center' },
  serviceCard: { flex: 1, backgroundColor: '#fff', borderRadius: 24, overflow: 'hidden' },
  cardImage: { width: '100%', height: 220 },
  cardContent: { padding: 30 },
  cardTitle: { fontSize: 22, fontWeight: '800', color: colors.dark, marginBottom: 12 },
  cardDescription: { fontSize: 15, color: colors.muted, lineHeight: 24 },
  footerContainer: { backgroundColor: colors.secondary },
  footer: { padding: 80, flexDirection: 'column', gap: 40 },
  footerDesktop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  footerBrandSection: { alignItems: 'flex-start', maxWidth: 350 },
  footerLogoContainer: { backgroundColor: '#fff', padding: 8, borderRadius: 12, marginRight: 15 },
  footerLogoImage: { width: 32, height: 32 },
  footerLinksColumn: { gap: 12 },
  footerColumnTitle: { color: '#fff', fontSize: 18, fontWeight: '800', marginBottom: 20 },
  footerLinkItem: { color: 'rgba(255,255,255,0.7)', fontSize: 15, marginBottom: 8 },
});

export default LandingScreen;
