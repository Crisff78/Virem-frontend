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

const ViremLogo = require('./assets/imagenes/Virem.png');
const EquipoVirem = require('./assets/imagenes/equipo_virem.png');
const HeartImg = require('./assets/imagenes/Heart.png');
const HeartHQImg = require('./assets/imagenes/Heart_HQ.png');
const HTImg = require('./assets/imagenes/HT.png');
const VcImg = require('./assets/imagenes/vc.png');

const colors = {
  primary: '#2B6CB0', // Professional, muted blue
  secondary: '#1A365D', // Deep navy blue
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

const ShrinkingLine = ({ delay = 0, trigger = true }) => {
  const widthAnim = useRef(new Animated.Value(250)).current; 
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (trigger) {
      Animated.sequence([
        Animated.delay(delay),
        Animated.parallel([
          Animated.timing(widthAnim, { 
            toValue: 60, 
            duration: 1200, 
            easing: Easing.out(Easing.exp), 
            useNativeDriver: false 
          }),
          Animated.timing(opacity, { 
            toValue: 1, 
            duration: 800, 
            useNativeDriver: false 
          }),
        ])
      ]).start();
    }
  }, [delay, trigger]);

  return (
    <Animated.View style={{ 
      width: widthAnim, 
      height: 4, 
      backgroundColor: colors.primary, 
      marginBottom: 16, 
      borderRadius: 2,
      opacity 
    }} />
  );
};

const MessageBadge = ({ trigger }: { trigger: boolean }) => {
  const scale = useRef(new Animated.Value(0)).current;
  const [showChecks, setShowChecks] = useState(false);
  const checkAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (trigger) {
      Animated.spring(scale, { toValue: 1, friction: 6, tension: 40, useNativeDriver: true }).start();
      
      const timer = setTimeout(() => {
        setShowChecks(true);
        Animated.timing(checkAnim, { toValue: 1, duration: 400, useNativeDriver: true }).start();
      }, 2000);
      
      return () => clearTimeout(timer);
    }
  }, [trigger, scale, checkAnim]);

  return (
    <Animated.View style={{
      position: 'absolute',
      right: -10,
      top: -10,
      backgroundColor: '#EBF8FF',
      padding: 8,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: '#BEE3F8',
      transform: [{ scale }],
      zIndex: 10,
      flexDirection: 'row',
      alignItems: 'center',
      ...shadow('#000', 0.1, 10, { width: 0, height: 4 }, 5)
    }}>
      <MaterialIcons name="security" size={14} color={colors.primary} />
      <Text style={{ fontSize: 10, fontWeight: '700', color: colors.secondary, marginLeft: 4 }}>Seguro</Text>
      {showChecks && (
        <Animated.View style={{ marginLeft: 4, opacity: checkAnim }}>
          <MaterialIcons name="done-all" size={14} color="#3182CE" />
        </Animated.View>
      )}
    </Animated.View>
  );
};

const FloatingPhone = ({ children }: any) => {
  useEffect(() => {
    if (Platform.OS === 'web') {
      if (typeof document !== 'undefined' && !document.getElementById('floatingPhoneCSS')) {
        const style = document.createElement('style');
        style.id = 'floatingPhoneCSS';
        style.innerHTML = `
          @keyframes floating {
            0% { transform: translateY(0px) rotate(0deg); }
            50% { transform: translateY(-15px) rotate(1deg); }
            100% { transform: translateY(0px) rotate(0deg); }
          }
          .floating-phone {
            animation: floating 4s ease-in-out infinite;
          }
        `;
        document.head.appendChild(style);
      }
    }
  }, []);

  return (
    <View style={Platform.OS === 'web' ? ({ className: 'floating-phone' } as any) : {}}>
      {children}
    </View>
  );
};

const HoverCard = ({ children, style, onPress }: any) => {
  const scale = useRef(new Animated.Value(1)).current;

  const onIn = () => Animated.spring(scale, { toValue: 1.03, useNativeDriver: true }).start();
  const onOut = () => Animated.spring(scale, { toValue: 1, useNativeDriver: true }).start();

  return (
    <Pressable
      onPress={onPress}
      onHoverIn={onIn}
      onHoverOut={onOut}
      style={{ flex: 1 }}
    >
      <Animated.View style={[style, { transform: [{ scale }] }]}>
        {children}
      </Animated.View>
    </Pressable>
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

const LandingScreen: React.FC = () => {
  const navigation = useNavigation<Nav>();
  const { isDesktop, isTablet, isMobile } = useResponsive();
  const scrollY = useRef(new Animated.Value(0)).current;
  const [activeSection, setActiveSection] = useState('inicio');
  const scrollRef = useRef<ScrollView>(null);
  const [layoutY, setLayoutY] = useState({ plataforma: 0, especialidades: 0, nosotros: 0, blog: 0, contacto: 0 });

  const scrollTo = (y: number) => {
    scrollRef.current?.scrollTo({ y, animated: true });
  };

  const AnimatedGradientBg = ({ children, style }: any) => {
    const colorAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
      Animated.loop(
        Animated.timing(colorAnim, {
          toValue: 1,
          duration: 10000,
          easing: Easing.linear,
          useNativeDriver: false
        })
      ).start();
    }, [colorAnim]);

    const backgroundColor = colorAnim.interpolate({
      inputRange: [0, 0.5, 1],
      outputRange: ['#F8FAFC', '#EBF4FF', '#F8FAFC']
    });

    return (
      <Animated.View style={[style, { backgroundColor }]}>
        {children}
      </Animated.View>
    );
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
              <Text style={[styles.navLinkCenterText, activeSection === 'plataforma' && { color: colors.secondary, fontWeight: '800' }]}>Plataforma</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => scrollTo(layoutY.especialidades)}>
              <Text style={[styles.navLinkCenterText, activeSection === 'especialidades' && { color: colors.secondary, fontWeight: '800' }]}>Especialidades</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => scrollTo(layoutY.nosotros)}>
              <Text style={[styles.navLinkCenterText, activeSection === 'nosotros' && { color: colors.secondary, fontWeight: '800' }]}>Nosotros</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => scrollTo(layoutY.blog)}>
              <Text style={[styles.navLinkCenterText, activeSection === 'blog' && { color: colors.secondary, fontWeight: '800' }]}>Blog</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => scrollTo(layoutY.contacto)}>
              <Text style={[styles.navLinkCenterText, activeSection === 'contacto' && { color: colors.secondary, fontWeight: '800' }]}>Contacto</Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={styles.navRight}>
          <TouchableOpacity 
            onPress={() => navigation.navigate('Login')}
            style={[styles.navBtn, { backgroundColor: colors.primary, marginRight: 12, ...shadow(colors.primary, 0.2, 10, { width: 0, height: 4 }, 4) }]}
          >
            <Text style={styles.navBtnText}>REGISTRARSE</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            onPress={() => navigation.navigate('Login')}
            style={[styles.navBtn, { backgroundColor: colors.secondary, ...shadow(colors.secondary, 0.2, 10, { width: 0, height: 4 }, 4) }]}
          >
            <Text style={styles.navBtnText}>INICIAR SESIÓN</Text>
          </TouchableOpacity>
        </View>
      </Animated.View>

      <ScrollView 
        ref={scrollRef}
        scrollEventThrottle={16}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: false }
        )}
        contentContainerStyle={styles.scrollContent}
      >
        {/* HERO SECTION */}
        <AnimatedGradientBg style={[styles.heroSection, isDesktop && styles.heroDesktop]}>
          {/* Decorative Blobs */}
          <View style={{ position: 'absolute', top: -100, left: -100, width: 400, height: 400, borderRadius: 200, backgroundColor: 'rgba(43, 108, 176, 0.05)', zIndex: 0 }} />
          <View style={{ position: 'absolute', bottom: 50, left: '20%', width: 250, height: 250, borderRadius: 125, backgroundColor: 'rgba(43, 108, 176, 0.03)', zIndex: 0 }} />
          <View style={{ position: 'absolute', top: '20%', right: '10%', width: 300, height: 300, borderRadius: 150, backgroundColor: 'rgba(235, 248, 255, 0.5)', zIndex: 0 }} />
          
          <View style={styles.heroTextContainer}>
            <FadeInView style={isDesktop && styles.heroTextDesktop}>
              <Text style={styles.heroTitle}>
                ¡TU SALUD ES NUESTRA <Text style={{ color: colors.primary }}>PRIORIDAD</Text>!
              </Text>
              <Text style={styles.heroSubtitle}>
                Somos líderes en atención primaria en salud. Nos enfocamos en prestar un servicio de salud integral destinado a proteger tu salud y bienestar, desde la comodidad de tu hogar.
              </Text>
              
              <View style={{ flexDirection: isMobile ? 'column' : 'row', gap: 16 }}>
                <TouchableOpacity 
                  onPress={() => navigation.navigate('SeleccionPerfil')}
                  style={[styles.heroActionBtn, shadow(colors.primary, 0.3, 15, { width: 0, height: 8 }, 8)]}
                >
                  <Text style={styles.heroActionBtnText}>AGENDAR UNA CITA</Text>
                </TouchableOpacity>
              </View>
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

        {/* SECCIÓN: CÓMO FUNCIONA */}
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
            <Text style={styles.sectionBodyLeft}>
              Solo necesitas registrarte, elegir tu especialidad y agendar tu cita. Recibirás atención de calidad sin complicaciones, directamente en tu dispositivo.
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

        {/* SECCIÓN: SERVICIOS */}
        <View style={styles.servicesSection}>
          <Text style={styles.sectionHeadingCenter}>Nuestros Servicios Digitales</Text>
          <Text style={styles.sectionBodyCenter}>
            Ofrecemos una gama completa de herramientas diseñadas para facilitar tu camino hacia una mejor salud.
          </Text>
          
          <View style={[styles.cardsGrid, isDesktop && styles.cardsGridDesktop]}>
            <HoverCard 
              onPress={() => {}}
              style={[styles.serviceCard, { ...shadow('#000', 0.08, 20, { width: 0, height: 10 }, 10) }]}
            >
              <ViremImage source={VcImg} style={styles.cardImage} />
              <View style={styles.cardContent}>
                <Text style={styles.cardTitle}>Consultas Virtuales</Text>
                <Text style={styles.cardDescription}>Atención médica especializada por videollamada segura, estés donde estés.</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 10 }}>
                  <Text style={{ color: colors.primary, fontWeight: '700', fontSize: 14, marginRight: 6 }}>LEER MÁS</Text>
                  <MaterialIcons name="arrow-forward" size={16} color={colors.primary} />
                </View>
              </View>
            </HoverCard>

            <HoverCard 
              onPress={() => {}}
              style={[styles.serviceCard, { ...shadow('#000', 0.08, 20, { width: 0, height: 10 }, 10) }]}
            >
              <ViremImage source={HTImg} style={styles.cardImage} />
              <View style={styles.cardContent}>
                <Text style={styles.cardTitle}>Recetas Digitales</Text>
                <Text style={styles.cardDescription}>Recibe tus prescripciones médicas oficiales directamente en tu perfil al instante.</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 10 }}>
                  <Text style={{ color: colors.primary, fontWeight: '700', fontSize: 14, marginRight: 6 }}>LEER MÁS</Text>
                  <MaterialIcons name="arrow-forward" size={16} color={colors.primary} />
                </View>
              </View>
            </HoverCard>

            <HoverCard 
              onPress={() => {}}
              style={[styles.serviceCard, { ...shadow('#000', 0.08, 20, { width: 0, height: 10 }, 10) }]}
            >
              <ViremImage source={require('./assets/imagenes/HistorialC.png')} style={styles.cardImage} />
              <View style={styles.cardContent}>
                <Text style={styles.cardTitle}>Historial Clínico</Text>
                <Text style={styles.cardDescription}>Accede a tus reportes, estudios y antecedentes médicos de forma segura y organizada.</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 10 }}>
                  <Text style={{ color: colors.primary, fontWeight: '700', fontSize: 14, marginRight: 6 }}>LEER MÁS</Text>
                  <MaterialIcons name="arrow-forward" size={16} color={colors.primary} />
                </View>
              </View>
            </HoverCard>
          </View>
        </View>

        {/* SECCIÓN: ESPECIALIDADES */}
        <View onLayout={(e) => setLayoutY(prev => ({...prev, especialidades: e.nativeEvent.layout.y}))} style={[styles.servicesSection, { backgroundColor: '#FFFFFF', paddingVertical: 80, alignItems: 'center', width: '100%', borderTopWidth: 1, borderTopColor: '#E2E8F0' }]}>
          <Text style={styles.sectionHeadingCenter}>Especialidades Médicas</Text>
          <Text style={[styles.sectionBodyCenter, { marginBottom: 50 }]}>Contamos con profesionales altamente capacitados en las áreas más demandadas.</Text>
          
          <View style={[styles.cardsGrid, isDesktop && styles.cardsGridDesktop, { flexWrap: 'wrap', justifyContent: 'center' }]}>
            {[
              { icon: "medical-services", title: "Medicina General", context: "Atención primaria integral.", img: require('./assets/imagenes/MedicinaGeneral.png') },
              { icon: "psychology", title: "Psicología", context: "Bienestar emocional y mental.", img: require('./assets/imagenes/Psicologia.png') },
              { icon: "favorite-border", title: "Cardiología", context: "Cuidado experto de tu corazón.", img: require('./assets/imagenes/Cardiologia.png') },
              { icon: "face", title: "Dermatología", context: "Salud para tu piel y cabello.", img: require('./assets/imagenes/Dermatologia.png') },
              { icon: "medication", title: "Endocrinología", context: "Control hormonal y metabólico.", img: require('./assets/imagenes/Endocrinologia.png') },
              { icon: "pregnant-woman", title: "Ginecología", context: "Salud femenina integral.", img: require('./assets/imagenes/Ginecologia.png') },
            ].map((esp, i) => (
              <HoverCard key={i} style={{ width: isDesktop ? 320 : '100%', backgroundColor: '#fff', borderRadius: 20, marginBottom: 24, overflow: 'hidden', ...shadow('#000', 0.05, 15, { width: 0, height: 5 }, 5) }}>
                <Image source={esp.img} style={{ width: '100%', height: 180 }} resizeMode="cover" />
                <View style={{ padding: 20 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
                    <MaterialIcons name={esp.icon as any} size={20} color={colors.primary} />
                    <Text style={{ fontSize: 18, fontWeight: '800', color: colors.dark, marginLeft: 10 }}>{esp.title}</Text>
                  </View>
                  <Text style={{ fontSize: 14, color: colors.muted }}>{esp.context}</Text>
                </View>
              </HoverCard>
            ))}
          </View>

          <TouchableOpacity 
            onPress={() => navigation.navigate('Especialidades')}
            style={{ marginTop: 40, backgroundColor: colors.primary, paddingHorizontal: 40, paddingVertical: 20, borderRadius: 18, ...shadow(colors.primary, 0.3, 15, { width: 0, height: 5 }, 8) }}
          >
            <Text style={{ color: '#fff', fontSize: 16, fontWeight: '900' }}>VER TODAS LAS ESPECIALIDADES</Text>
          </TouchableOpacity>
        </View>

        {/* SECCIÓN: NOSOTROS */}
        <View onLayout={(e) => setLayoutY(prev => ({...prev, nosotros: e.nativeEvent.layout.y}))} style={[styles.howItWorksSection, { backgroundColor: '#FFFFFF', paddingVertical: 100, borderTopWidth: 1, borderTopColor: '#E2E8F0' }, isDesktop && styles.howItWorksDesktop]}>
          <View style={[styles.howItWorksTextContainer, { flex: 1.2 }]}>
            <Text style={[styles.sectionHeadingLeft, { fontSize: 36, fontWeight: '900' }]}>Nuestra Misión</Text>
            <Text style={[styles.sectionBodyLeft, { fontSize: 18, lineHeight: 32 }]}>
              VIREM nace con la misión de democratizar y facilitar el acceso a la salud. Somos un equipo interdisciplinario que une la medicina y la tecnología para romper las barreras geográficas.
            </Text>
            <Text style={[styles.sectionBodyLeft, { fontSize: 18, lineHeight: 32 }]}>
              Creemos firmemente en el cuidado continuo del paciente, promoviendo espacios donde puedas encontrar desde médicos generales hasta terapeutas que guíen tu bienestar emocional.
            </Text>
          </View>
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
            <ViremImage source={ViremLogo} style={{ width: 250, height: 250, opacity: 0.8 }} resizeMode="contain" />
          </View>
        </View>

        {/* SECCIÓN: BLOG */}
        <View onLayout={(e) => setLayoutY(prev => ({...prev, blog: e.nativeEvent.layout.y}))} style={[styles.servicesSection, { backgroundColor: '#F0F9FF', paddingVertical: 100, borderTopWidth: 1, borderTopColor: '#E2E8F0' }]}>
          <Text style={styles.sectionHeadingCenter}>Últimas del Blog</Text>
          <Text style={styles.sectionBodyCenter}>Información, consejos y noticias sobre bienestar físico y mental.</Text>
          
          <View style={[styles.cardsGrid, isDesktop && styles.cardsGridDesktop]}>
            <HoverCard style={{ flex: 1, backgroundColor: '#fff', borderRadius: 24, overflow: 'hidden', ...shadow('#000', 0.05, 20, { width: 0, height: 10 }, 10) }}>
              <Image source={{ uri: "https://images.unsplash.com/photo-1527689368864-3a821dbccc34?q=80&w=800&auto=format&fit=crop" }} style={{ width: '100%', height: 250 }} />
              <View style={{ padding: 30 }}>
                <Text style={{ color: colors.primary, fontSize: 12, fontWeight: '900', marginBottom: 10 }}>BIENESTAR</Text>
                <Text style={{ color: colors.dark, fontSize: 22, fontWeight: '900', marginBottom: 15 }}>Guía de Telemedicina para pacientes</Text>
                <Text style={{ color: colors.muted, fontSize: 15, lineHeight: 24 }}>Descubre cómo prepararte para tu primera consulta virtual y sacar el máximo provecho a la tecnología.</Text>
              </View>
            </HoverCard>

            <HoverCard style={{ flex: 1, backgroundColor: '#fff', borderRadius: 24, overflow: 'hidden', ...shadow('#000', 0.05, 20, { width: 0, height: 10 }, 10) }}>
              <Image source={{ uri: "https://images.unsplash.com/photo-1434493789847-2f02dc6ca35d?q=80&w=800&auto=format&fit=crop" }} style={{ width: '100%', height: 250 }} />
              <View style={{ padding: 30 }}>
                <Text style={{ color: colors.primary, fontSize: 12, fontWeight: '900', marginBottom: 10 }}>PREVENCIÓN</Text>
                <Text style={{ color: colors.dark, fontSize: 22, fontWeight: '900', marginBottom: 15 }}>La importancia del chequeo anual</Text>
                <Text style={{ color: colors.muted, fontSize: 15, lineHeight: 24 }}>Por qué no debes esperar a sentirte mal para agendar una cita con tu médico de confianza. Hábitos saludables en casa.</Text>
              </View>
            </HoverCard>
          </View>
        </View>

        {/* FOOTER */}
        <View onLayout={(e) => setLayoutY(prev => ({...prev, contacto: e.nativeEvent.layout.y}))} style={[styles.footerContainer, isDesktop && { borderTopLeftRadius: 150 }]}>
          <View style={[styles.footer, isDesktop && styles.footerDesktop]}>
            <View style={[styles.footerBrandSection, (isTablet || isMobile) && { alignItems: 'center', maxWidth: '100%' }]}>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 20 }}>
                <View style={styles.footerLogoContainer}>
                  <ViremImage source={ViremLogo} style={styles.footerLogoImage} />
                </View>
                <Text style={[styles.logoText, { color: '#fff', fontSize: 32 }]}>VIREM</Text>
              </View>
              <View style={styles.socialRow}>
                <View style={styles.socialCircle}><MaterialIcons name="facebook" size={20} color={colors.secondary} /></View>
                <View style={styles.socialCircle}><MaterialIcons name="camera-alt" size={20} color={colors.secondary} /></View>
                <View style={styles.socialCircle}><MaterialIcons name="flutter-dash" size={20} color={colors.secondary} /></View>
              </View>
            </View>

            <View style={styles.footerLinksColumn}>
              <Text style={styles.footerColumnTitle}>SOBRE VIREM</Text>
              <Text style={styles.footerLinkItem}>Trabaja con nosotros</Text>
              <Text style={styles.footerLinkItem}>Especialistas</Text>
              <Text style={styles.footerLinkItem}>Contacto</Text>
              <Text style={styles.footerLinkItem}>Política de Privacidad</Text>
            </View>

            <View style={styles.footerLinksColumn}>
              <Text style={styles.footerColumnTitle}>CONSULTA Y SERVICIOS</Text>
              <Text style={styles.footerLinkItem}>Especialidades</Text>
              <Text style={styles.footerLinkItem}>Telemedicina</Text>
              <Text style={styles.footerLinkItem}>Recetas Digitales</Text>
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
  
  // NAVBAR
  navbar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, backgroundColor: colors.white, zIndex: 100 },
  navbarDesktop: { paddingHorizontal: 60, paddingVertical: 20 },
  navLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  logoImage: { width: 45, height: 45 },
  logoText: { fontSize: 28, fontWeight: '900', color: colors.dark, letterSpacing: -0.5 },
  
  navLinksCenter: { flexDirection: 'row', gap: 32 },
  navLinkCenterText: { color: colors.muted, fontWeight: '600', fontSize: 16 },

  navRight: { flexDirection: 'row', alignItems: 'center' },
  navBtn: { paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12 },
  navBtnText: { color: colors.white, fontWeight: '800', fontSize: 14, letterSpacing: 1 },

  // HERO
  heroSection: { minHeight: 600 },
  heroDesktop: { flexDirection: 'row', alignItems: 'center', paddingLeft: 80, paddingRight: 0, paddingVertical: 0, width: '100%', minHeight: 750, overflow: 'hidden', position: 'relative' },
  heroTextContainer: { flex: 1, zIndex: 2, padding: 24 },
  heroTextDesktop: { paddingRight: 60, flex: 1 },
  heroTitle: { fontSize: 48, fontWeight: '900', color: colors.dark, marginBottom: 24, lineHeight: 56 },
  heroSubtitle: { fontSize: 18, color: colors.muted, lineHeight: 30, marginBottom: 40, fontWeight: '400' },
  heroActionBtn: { backgroundColor: colors.primary, paddingHorizontal: 40, paddingVertical: 20, borderRadius: 12, alignSelf: 'flex-start' },
  heroActionBtnText: { color: colors.white, fontSize: 16, fontWeight: '900', letterSpacing: 1 },
  
  heroImageContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  
  // HOW IT WORKS
  howItWorksSection: { padding: 24, paddingVertical: 100, backgroundColor: '#fff' },
  howItWorksDesktop: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 80 },
  howItWorksImgContainer: { flex: 0.8, alignItems: 'center', justifyContent: 'center' },
  greenCircle: { width: 400, height: 400, borderRadius: 200, backgroundColor: colors.secondary, justifyContent: 'center', alignItems: 'center', overflow: 'hidden' },
  doctorCircleImage: { width: '92%', height: '92%', borderRadius: 200 },
  
  howItWorksTextContainer: { flex: 1 },
  howItWorksTextDesktop: { paddingLeft: 80 },
  sectionHeadingLeft: { fontSize: 32, fontWeight: '900', color: colors.dark, marginBottom: 24 },
  sectionBodyLeft: { fontSize: 16, color: colors.muted, lineHeight: 28, marginBottom: 16 },

  // SERVICES
  servicesSection: { padding: 24, paddingVertical: 100, alignItems: 'center', backgroundColor: '#FDFEFE' },
  sectionHeadingCenter: { fontSize: 36, fontWeight: '900', color: colors.dark, marginBottom: 16, textAlign: 'center' },
  sectionBodyCenter: { fontSize: 18, color: colors.muted, lineHeight: 28, textAlign: 'center', maxWidth: 800, marginBottom: 60 },

  cardsGrid: { flexDirection: 'column', gap: 30, width: '100%', maxWidth: 1200 },
  cardsGridDesktop: { flexDirection: 'row', justifyContent: 'center' },
  serviceCard: { flex: 1, backgroundColor: '#fff', borderRadius: 24, overflow: 'hidden' },
  cardImage: { width: '100%', height: 220 },
  cardContent: { padding: 30 },
  cardTitle: { fontSize: 22, fontWeight: '800', color: colors.dark, marginBottom: 12 },
  cardDescription: { fontSize: 15, color: colors.muted, lineHeight: 24 },

  // FOOTER
  footerContainer: { backgroundColor: colors.secondary },
  footer: { padding: 80, flexDirection: 'column', gap: 40 },
  footerDesktop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  
  footerBrandSection: { alignItems: 'flex-start', maxWidth: 350 },
  footerLogoContainer: { backgroundColor: '#fff', padding: 8, borderRadius: 12, marginRight: 15 },
  footerLogoImage: { width: 32, height: 32 },
  socialRow: { flexDirection: 'row', gap: 15 },
  socialCircle: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.1)', justifyContent: 'center', alignItems: 'center' },

  footerLinksColumn: { gap: 12 },
  footerColumnTitle: { color: '#fff', fontSize: 18, fontWeight: '800', marginBottom: 20 },
  footerLinkItem: { color: 'rgba(255,255,255,0.7)', fontSize: 15, fontWeight: '400', marginBottom: 8 },
});

export default LandingScreen;
