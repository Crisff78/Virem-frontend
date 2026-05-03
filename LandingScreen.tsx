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
  }, [trigger]);

  return (
    <Animated.View style={{ 
      position: 'absolute', 
      top: 40, 
      left: -20, 
      backgroundColor: 'rgba(255, 255, 255, 0.7)', 
      padding: 16, 
      borderRadius: 20, 
      ...shadow('#000', 0.15, 20, { width: 0, height: 10 }, 20),
      zIndex: 3, 
      flexDirection: 'row', 
      alignItems: 'center', 
      gap: 16, 
      minWidth: 220,
      transform: [{ scale }],
      ...(Platform.select({
        web: { backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)' }
      }) as any)
    }}>
      <View style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: '#EBF5FB', justifyContent: 'center', alignItems: 'center' }}>
        <MaterialIcons name="person-pin" size={26} color={colors.primary} />
      </View>
      <View style={{ flexShrink: 1 }}>
        <Text style={{ fontWeight: '800', color: colors.dark, fontSize: 13 }}>
          Tu médico, donde estés
        </Text>
        {showChecks && (
          <Animated.View style={{ opacity: checkAnim, flexDirection: 'row', alignItems: 'center', marginTop: 2 }}>
            <Text style={{ fontSize: 10, color: colors.muted, marginRight: 4 }}>Visto</Text>
            <MaterialIcons name="done-all" size={16} color="#34B7F1" />
          </Animated.View>
        )}
      </View>
    </Animated.View>
  );
};

const HoverCard = ({ children, style }: any) => {
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
      {...(Platform.select({
        web: { onMouseEnter: handleMouseEnter, onMouseLeave: handleMouseLeave }
      }) as any)}
    >
      {children}
    </Animated.View>
  );
};

const HoverButton = ({ children, onPress, style }: any) => {
  const scale = useRef(new Animated.Value(1)).current;

  const handleMouseEnter = () => {
    Animated.spring(scale, { toValue: 1.05, friction: 3, tension: 40, useNativeDriver: false }).start();
  };

  const handleMouseLeave = () => {
    Animated.spring(scale, { toValue: 1, friction: 3, tension: 40, useNativeDriver: false }).start();
  };

  return (
    <Animated.View 
      style={[{ transform: [{ scale }] }]}
    >
      <Pressable 
        onPress={onPress} 
        style={({ pressed }) => [style, { opacity: pressed ? 0.7 : 1 }]}
        {...(Platform.select({
          web: { onMouseEnter: handleMouseEnter, onMouseLeave: handleMouseLeave }
        }) as any)}
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

  if (Platform.OS === 'web') {
    const overlayOpacity = anim.interpolate({
      inputRange: [0, 1],
      outputRange: [0.3, 0.8],
    });

    return (
      <Animated.View style={[style, { backgroundColor: bgColor, overflow: 'hidden' }]}>
        <Animated.View style={{
          position: 'absolute', top: -80, right: -80,
          width: 350, height: 350, borderRadius: 175,
          backgroundColor: 'rgba(43, 108, 176, 0.08)',
          opacity: overlayOpacity,
          transform: [{ scale: anim.interpolate({ inputRange: [0, 1], outputRange: [1, 1.2] }) }],
        }} />
        <Animated.View style={{
          position: 'absolute', bottom: -60, left: -60,
          width: 280, height: 280, borderRadius: 140,
          backgroundColor: 'rgba(26, 54, 93, 0.06)',
          opacity: overlayOpacity,
          transform: [{ scale: anim.interpolate({ inputRange: [0, 1], outputRange: [1.2, 1] }) }],
        }} />
        {children}
      </Animated.View>
    );
  }

  return (
    <Animated.View style={[style, { backgroundColor: bgColor }]}>
      {children}
    </Animated.View>
  );
};

const FloatingPhone = ({ children }: any) => {
  if (Platform.OS === 'web') {
    useEffect(() => {
      if (typeof document !== 'undefined' && !document.getElementById('floatingPhoneCSS')) {
        const style = document.createElement('style');
        style.id = 'floatingPhoneCSS';
        style.textContent = `
          @keyframes floatPhone {
            0%, 100% { transform: translateY(0px); }
            50% { transform: translateY(-14px); }
          }
          .floating-phone {
            animation: floatPhone 3s ease-in-out infinite;
            will-change: transform;
          }
        `;
        document.head.appendChild(style);
      }
    }, []);

    const divRef = useRef<any>(null);
    useEffect(() => {
      if (divRef.current) {
        const node = divRef.current;
        if (node && node.classList) {
          node.classList.add('floating-phone');
        }
      }
    });

    return (
      <View ref={divRef}>
        {children}
      </View>
    );
  }

  const floatAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, { toValue: 1, duration: 1500, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(floatAnim, { toValue: 0, duration: 1500, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [floatAnim]);

  return (
    <Animated.View style={{ transform: [{ translateY: floatAnim.interpolate({ inputRange: [0, 1], outputRange: [0, -14] }) }] }}>
      {children}
    </Animated.View>
  );
};

const HoverServiceCard = ({ title, description, image, style }: any) => {
  return (
    <HoverCard style={style}>
      <View style={{ backgroundColor: colors.primary, paddingVertical: 16, alignItems: 'center', zIndex: 2 }}>
        <Text style={{ color: '#fff', fontSize: 18, fontWeight: '600' }}>{title}</Text>
      </View>
      <View style={{ position: 'relative', overflow: 'hidden' }}>
        <ViremImage source={image} style={{ width: '100%', height: 250 }} />
      </View>
      <View style={{ padding: 24 }}>
        <Text style={{ color: colors.muted, fontSize: 14, lineHeight: 22, textAlign: 'center' }}>
          {description}
        </Text>
      </View>
    </HoverCard>
  );
};

const HoverSpecialtyCard = ({ icon, title, context, image, detailedInfo, whenToGo, importance, style }: any) => {
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
      {...(Platform.select({
        web: { onMouseEnter: handleMouseEnter, onMouseLeave: handleMouseLeave }
      }) as any)}
    >
      <View style={{ width: '100%', height: '100%', flexDirection: 'row', alignItems: 'center', padding: 20 }}>
        {image && (
          <View style={{ width: 100, height: 100, borderRadius: 15, overflow: 'hidden', marginRight: 20 }}>
            <ViremImage source={image} style={{ width: '100%', height: '100%' }} />
          </View>
        )}
        <View style={{ flex: 1, alignItems: 'flex-start' }}>
          <View style={{ width: 48, height: 48, borderRadius: 12, backgroundColor: "#F0F7FA", justifyContent: "center", alignItems: "center", marginBottom: 12 }}>
            <MaterialIcons name={icon} size={24} color={colors.secondary} />
          </View>
          <Text style={{ fontSize: 20, fontWeight: "900", color: colors.dark, textAlign: "left" }}>{title}</Text>
        </View>
      </View>
      
      <Animated.View style={{
        position: 'absolute',
        top: 0, left: 0, right: 0, bottom: 0,
        backgroundColor: 'rgba(26, 54, 93, 0.95)',
        borderRadius: 20,
        padding: 20,
        justifyContent: 'center',
        alignItems: 'center',
        opacity: overlayOpacity,
        transform: [{ translateY: overlayTranslateY }],
        ...(Platform.select({ web: { backdropFilter: 'blur(4px)' } }) || {})
      }}>
        <Text style={{ color: '#fff', fontSize: 14, textAlign: 'center', lineHeight: 20, fontWeight: '500' }}>
          {context}
        </Text>
        <TouchableOpacity 
          style={{ marginTop: 12, borderBottomWidth: 1, borderBottomColor: '#fff' }}
          onPress={() => (navigation as any).navigate('EspecialidadDetalle', { 
            title, 
            description: context, 
            icon, 
            image,
            detailedInfo,
            whenToGo,
            importance
          })}
        >
          <Text style={{ color: '#fff', fontSize: 12, fontWeight: '700' }}>SABER MÁS</Text>
        </TouchableOpacity>
      </Animated.View>
    </Animated.View>
  );
};

const HoverBlogCard = ({ category, title, description, image, onPress, style }: any) => {
  return (
    <HoverCard style={style}>
      <Pressable onPress={onPress}>
        <View style={{ position: 'relative' }}>
          <ViremImage source={{ uri: image }} style={{ width: '100%', height: 220 }} />
          <View style={{ position: 'absolute', top: 16, left: 16, backgroundColor: colors.primary, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 6 }}>
            <Text style={{ color: '#fff', fontSize: 10, fontWeight: '800' }}>{category}</Text>
          </View>
        </View>
        <View style={{ padding: 24, backgroundColor: '#fff' }}>
          <Text style={{ fontSize: 20, fontWeight: '900', color: colors.dark, marginBottom: 12 }}>{title}</Text>
          <Text style={{ fontSize: 14, color: colors.muted, lineHeight: 22, marginBottom: 16 }}>{description}</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Text style={{ color: colors.primary, fontWeight: '700', fontSize: 14, marginRight: 6 }}>LEER ARTÍCULO</Text>
            <MaterialIcons name="arrow-forward" size={16} color={colors.primary} />
          </View>
        </View>
      </Pressable>
    </HoverCard>
  );
};

const LandingScreen: React.FC = () => {
  const navigation = useNavigation<Nav>();
  const { isDesktop, isTablet, isMobile, select } = useResponsive();
  const scrollY = useRef(new Animated.Value(0)).current;
  const [navScrolled, setNavScrolled] = useState(false);
  
  const [layoutY, setLayoutY] = useState({ especialidades: 0, comoFunciona: 0, contacto: 0 });
  const [activeSection, setActiveSection] = useState('inicio');

  const navRef = useRef<View>(null);

  useEffect(() => {
    const listener = scrollY.addListener(({ value }) => {
      setNavScrolled(value > 50);
      
      if (value < layoutY.comoFunciona - 100) setActiveSection('inicio');
      else if (value < layoutY.especialidades - 100) setActiveSection('comoFunciona');
      else if (value < layoutY.contacto - 100) setActiveSection('especialidades');
      else setActiveSection('contacto');
    });
    return () => scrollY.removeListener(listener);
  }, [layoutY]);

  const scrollToSection = (y: number) => {
    // Scroll logic here if needed
  };

  const navigateToRegister = () => navigation.navigate('SeleccionPerfil');
  const navigateToLogin = () => navigation.navigate('Login');

  return (
    <View style={styles.container}>
      {/* TOP NAVBAR - STICKY WITH BLUR */}
      <View ref={navRef} style={[styles.navbar, isDesktop && styles.navbarDesktop, navScrolled && { paddingVertical: 10, ...shadow('#000', 0.1, 10, { width: 0, height: 2 }, 5) }]}>
        <View style={styles.navLeft}>
          <ViremImage source={ViremLogo} style={styles.logoImage} />
          <Text style={styles.logoText}>VIREM</Text>
        </View>

        {isDesktop && (
          <View style={styles.navLinksCenter}>
            <TouchableOpacity onPress={() => scrollToSection(0)}>
              <Text style={[styles.navLinkCenterText, activeSection === 'inicio' && { color: colors.secondary, fontWeight: '800' }]}>Inicio</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => scrollToSection(layoutY.comoFunciona)}>
              <Text style={[styles.navLinkCenterText, activeSection === 'comoFunciona' && { color: colors.secondary, fontWeight: '800' }]}>Cómo funciona</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => scrollToSection(layoutY.especialidades)}>
              <Text style={[styles.navLinkCenterText, activeSection === 'especialidades' && { color: colors.secondary, fontWeight: '800' }]}>Especialidades</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => scrollToSection(layoutY.contacto)}>
              <Text style={[styles.navLinkCenterText, activeSection === 'contacto' && { color: colors.secondary, fontWeight: '800' }]}>Contacto</Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={styles.navRight}>
          {isDesktop ? (
            <>
              <TouchableOpacity style={[styles.navBtn, { marginRight: 10 }]} onPress={navigateToLogin}>
                <Text style={[styles.navBtnText, { color: colors.primary }]}>INGRESAR</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.navBtn, { backgroundColor: colors.primary }]} onPress={navigateToRegister}>
                <Text style={styles.navBtnText}>EMPEZAR AHORA</Text>
              </TouchableOpacity>
            </>
          ) : (
            <TouchableOpacity onPress={navigateToLogin}>
              <MaterialIcons name="account-circle" size={32} color={colors.primary} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: false }
        )}
        scrollEventThrottle={16}
      >
        {/* HERO SECTION */}
        <AnimatedGradientBg style={[styles.heroSection, isDesktop && styles.heroDesktop, !isDesktop && { paddingTop: 60, paddingBottom: 40 }]}>
          <View style={{ 
            flexDirection: isDesktop ? 'row' : 'column', 
            alignItems: 'center', 
            justifyContent: 'space-between',
            width: '100%',
            maxWidth: 1400,
            alignSelf: 'center',
            paddingHorizontal: isDesktop ? 40 : 20
          }}>
            
            {/* Text on the Left */}
            <View style={[styles.heroTextContainer, isDesktop && styles.heroTextDesktop]}>
              <FadeInView delay={100}>
                <ShrinkingLine delay={300} />
                <Text style={[styles.heroTitle, { fontSize: select({ mobile: 36, tablet: 48, desktop: 56 }), lineHeight: select({ mobile: 44, tablet: 56, desktop: 64 }) }]}>
                  ¡TU SALUD ES NUESTRA <Text style={{ color: colors.primary }}>PRIORIDAD</Text>!
                </Text>
              </FadeInView>
              <FadeInView delay={300}>
                <Text style={[styles.heroSubtitle, { fontSize: select({ mobile: 16, tablet: 18, desktop: 18 }) }]}>
                  Somos líderes en atención primaria en salud. Nos enfocamos en prestar un servicio de salud integral destinado a proteger tu salud y bienestar, desde la comodidad de tu hogar.
                </Text>
              </FadeInView>
              <FadeInView delay={500} style={{ flexDirection: 'row', gap: 16, flexWrap: 'wrap' }}>
                <HoverButton style={styles.heroActionBtn} onPress={navigateToRegister}>
                  <Text style={styles.heroActionBtnText}>AGENDAR UNA CITA</Text>
                </HoverButton>
              </FadeInView>
            </View>
  
            {/* Image on the Right */}
            <FadeInView delay={400} style={[styles.heroImageContainer, !isDesktop && { marginTop: 40 }]}>
              <FloatingPhone>
                <Animated.View style={[styles.heroImage, { 
                    width: select({ mobile: '100%', tablet: '90%', desktop: 750 }), 
                    height: select({ mobile: 400, tablet: 550, desktop: 650 }),
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: 0,
                    transform: [{
                      translateY: scrollY.interpolate({
                        inputRange: [0, 500],
                        outputRange: [0, 80],
                        extrapolate: 'clamp'
                      })
                    }]
                  } as any]}>
                  <MessageBadge trigger={true} />
                  <ViremImage 
                    source={HeartImg} 
                    style={{ width: '100%', height: '100%' }} 
                  />
                </Animated.View>
              </FloatingPhone>
            </FadeInView>
          </View>
        </AnimatedGradientBg>

        {/* REST OF SECTIONS (HOW IT WORKS, SERVICES, BLOG, FOOTER) - RESTORED FROM YASLYN'S DESIGN */}
        
        {/* SECCIÓN: CÓMO FUNCIONA */}
        <View onLayout={(e) => setLayoutY(prev => ({...prev, comoFunciona: e.nativeEvent.layout.y}))} style={[styles.howItWorksSection, isDesktop && styles.howItWorksDesktop]}>
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
          </View>
        </View>

        {/* SECCIÓN: SERVICIOS */}
        <View style={styles.servicesSection}>
          <Text style={styles.sectionHeadingCenter}>Nuestros Servicios Digitales</Text>
          <Text style={styles.sectionBodyCenter}>
            Ofrecemos una gama completa de herramientas diseñadas para facilitar tu camino hacia una mejor salud.
          </Text>
          
          <View style={styles.cardsGrid}>
            <HoverServiceCard 
              title="Consultas Virtuales" 
              description="Atención médica especializada por videollamada segura, estés donde estés."
              image={require('./assets/imagenes/Videoconsulta.png')}
              style={[styles.serviceCard, shadow('#000', 0.1, 15, { width: 0, height: 5 }, 5)]} 
            />
            <HoverServiceCard 
              title="Recetas Digitales" 
              description="Recibe tus prescripciones médicas oficiales directamente en tu perfil al instante."
              image={require('./assets/imagenes/RecetasM.png')}
              style={[styles.serviceCard, shadow('#000', 0.1, 15, { width: 0, height: 5 }, 5)]} 
            />
            <HoverServiceCard 
              title="Historial Clínico" 
              description="Accede a tus reportes, estudios y antecedentes médicos de forma segura y organizada."
              image={require('./assets/imagenes/HistorialC.png')}
              style={[styles.serviceCard, shadow('#000', 0.1, 15, { width: 0, height: 5 }, 5)]} 
            />
          </View>
        </View>

        {/* SECCIÓN: ESPECIALIDADES */}
        <View onLayout={(e) => setLayoutY(prev => ({...prev, especialidades: e.nativeEvent.layout.y}))} style={styles.servicesSection}>
          <Text style={styles.sectionHeadingCenter}>Especialidades Médicas</Text>
          <View style={[styles.cardsGrid, isDesktop && styles.cardsGridDesktop, { flexWrap: 'wrap', justifyContent: 'center' }]}>
            {[
              { icon: "medical-services", title: "Medicina General", context: "Atención primaria integral.", img: require('./assets/imagenes/MedicinaGeneral.png') },
              { icon: "psychology", title: "Psicología", context: "Bienestar emocional y mental.", img: require('./assets/imagenes/Psicologia.png') },
              { icon: "favorite-border", title: "Cardiología", context: "Cuidado experto de tu corazón.", img: require('./assets/imagenes/Cardiologia.png') },
              { icon: "face", title: "Dermatología", context: "Salud para tu piel y cabello.", img: require('./assets/imagenes/Dermatologia.png') },
              { icon: "medication", title: "Endocrinología", context: "Control hormonal y metabólico.", img: require('./assets/imagenes/Endocrinologia.png') },
              { icon: "pregnant-woman", title: "Ginecología", context: "Salud femenina integral.", img: require('./assets/imagenes/Ginecologia.png') },
            ].map((esp, i) => (
              <HoverSpecialtyCard 
                key={i}
                icon={esp.icon}
                title={esp.title}
                context={esp.context}
                image={esp.img}
                style={{ width: select({ mobile: "100%", tablet: "45%", desktop: 350 }), height: 180, backgroundColor: "#fff", borderRadius: 20, marginBottom: 20, ...shadow('#000', 0.05, 10, { width: 0, height: 4 }, 2) }} 
              />
            ))}
          </View>
          <HoverButton 
            onPress={() => navigation.navigate('Especialidades')}
            style={{ marginTop: 40, backgroundColor: colors.primary, paddingHorizontal: 40, paddingVertical: 20, borderRadius: 18, ...shadow(colors.primary, 0.3, 15, { width: 0, height: 5 }, 8) }}
          >
            <Text style={{ color: '#fff', fontSize: 16, fontWeight: '900' }}>VER TODAS LAS ESPECIALIDADES</Text>
          </HoverButton>
        </View>

        {/* SECCIÓN: BLOG */}
        <View style={[styles.servicesSection, { backgroundColor: '#F8FAFC' }]}>
          <Text style={styles.sectionHeadingCenter}>Últimas del Blog</Text>
          <View style={[styles.cardsGrid, isDesktop && styles.cardsGridDesktop]}>
            <HoverBlogCard 
              category="BIENESTAR"
              title="Guía de Telemedicina para pacientes"
              description="Descubre cómo prepararte para tu primera consulta virtual y sacar el máximo provecho a la tecnología."
              image="https://images.unsplash.com/photo-1527689368864-3a821dbccc34?q=80&w=800&auto=format&fit=crop"
              onPress={() => {}}
              style={{ flex: 1, ...shadow('#000', 0.1, 20, { width: 0, height: 10 }, 10) }}
            />
            <HoverBlogCard 
              category="PREVENCIÓN"
              title="La importancia del chequeo anual"
              description="Por qué no debes esperar a sentirte mal para agendar una cita con tu médico de confianza."
              image="https://images.unsplash.com/photo-1434493789847-2f02dc6ca35d?q=80&w=800&auto=format&fit=crop"
              onPress={() => {}}
              style={{ flex: 1, ...shadow('#000', 0.1, 20, { width: 0, height: 10 }, 10) }}
            />
          </View>
        </View>

        {/* FOOTER */}
        <View onLayout={(e) => setLayoutY(prev => ({...prev, contacto: e.nativeEvent.layout.y}))} style={[styles.footerContainer, isDesktop && { borderTopLeftRadius: 150 }]}>
          <View style={[styles.footer, isDesktop && styles.footerDesktop]}>
            <View style={[styles.footerBrandSection, (isTablet || isMobile) && { alignItems: 'center', maxWidth: '100%' }]}>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
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
            </View>

            <View style={styles.footerLinksColumn}>
              <Text style={styles.footerColumnTitle}>CONSULTA Y SERVICIOS</Text>
              <Text style={styles.footerLinkItem}>Especialidades</Text>
              <Text style={styles.footerLinkItem}>Telemedicina</Text>
            </View>
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
  navbar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, backgroundColor: colors.white, zIndex: 10 },
  navbarDesktop: { paddingHorizontal: 40, paddingVertical: 16 },
  navLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  logoImage: { width: 45, height: 45 },
  logoText: { fontSize: 28, fontWeight: '900', color: colors.dark, letterSpacing: -0.5 },
  
  navLinksCenter: { flexDirection: 'row', gap: 24 },
  navLinkCenterText: { color: colors.primary, fontWeight: '600', fontSize: 15 },

  navRight: { flexDirection: 'row', alignItems: 'center' },
  navBtn: { paddingHorizontal: 20, paddingVertical: 10, borderRadius: 20 },
  navBtnText: { color: colors.white, fontWeight: '700', fontSize: 13 },

  // HERO
  heroSection: { backgroundColor: '#EBF5FB' },
  heroDesktop: { flexDirection: 'row', alignItems: 'center', paddingLeft: 80, paddingRight: 0, paddingVertical: 0, width: '100%', minHeight: 550, overflow: 'hidden', position: 'relative' },
  heroTextContainer: { flex: 1, zIndex: 2, maxWidth: '55%' },
  heroTextDesktop: { paddingRight: 40, flex: 1 },
  heroTitle: { fontSize: 48, fontWeight: '900', color: colors.dark, marginBottom: 16, lineHeight: 56 },
  heroSubtitle: { fontSize: 18, color: colors.muted, lineHeight: 28, marginBottom: 30, fontWeight: '400' },
  heroActionBtn: { backgroundColor: colors.primary, paddingHorizontal: 36, paddingVertical: 16, borderRadius: 8, alignSelf: 'flex-start' },
  heroActionBtnText: { color: colors.white, fontSize: 16, fontWeight: '800', letterSpacing: 0.5 },
  
  heroImageContainer: { position: 'absolute', right: 0, top: 0, bottom: 0, width: '50%', alignItems: 'flex-end', justifyContent: 'center' },
  heroImage: { width: 650, height: 550, backgroundColor: 'transparent' },

  // HOW IT WORKS
  howItWorksSection: { padding: 24, paddingVertical: 60, backgroundColor: '#fff' },
  howItWorksDesktop: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 80 },
  howItWorksImgContainer: { flex: 0.8, alignItems: 'center', justifyContent: 'center' },
  greenCircle: { width: 380, height: 380, borderRadius: 190, backgroundColor: colors.secondary, justifyContent: 'center', alignItems: 'center', overflow: 'hidden' },
  doctorCircleImage: { width: '90%', height: '90%', borderRadius: 200 },
  
  howItWorksTextContainer: { flex: 1 },
  howItWorksTextDesktop: { paddingLeft: 60 },
  sectionHeadingLeft: { fontSize: 28, fontWeight: '300', color: '#1A5276', marginBottom: 20 },
  sectionBodyLeft: { fontSize: 15, color: colors.muted, lineHeight: 26, marginBottom: 16 },

  // SERVICES
  servicesSection: { padding: 24, paddingVertical: 60, alignItems: 'center', backgroundColor: '#FDFEFE' },
  sectionHeadingCenter: { fontSize: 28, fontWeight: '300', color: '#1A5276', marginBottom: 16, textAlign: 'center' },
  sectionBodyCenter: { fontSize: 15, color: colors.muted, lineHeight: 26, textAlign: 'center', maxWidth: 800, marginBottom: 40 },

  cardsGrid: { flexDirection: 'column', gap: 24, width: '100%', maxWidth: 1100 },
  cardsGridDesktop: { flexDirection: 'row', justifyContent: 'center' },
  serviceCard: { flex: 1, backgroundColor: '#fff', borderRadius: 16, overflow: 'hidden' },
  cardHeader: { backgroundColor: colors.primary, paddingVertical: 14, alignItems: 'center' },
  cardHeaderText: { color: '#fff', fontSize: 16, fontWeight: '500' },
  cardImage: { width: '100%', height: 200 },

  // FOOTER
  footerContainer: { backgroundColor: colors.primary, marginTop: 40 },
  footer: { padding: 60, flexDirection: 'column', gap: 30 },
  footerDesktop: { flexDirection: 'row', justifyContent: 'space-around', alignItems: 'flex-start' },
  
  footerBrandSection: { alignItems: 'flex-start', maxWidth: 300 },
  footerLogoContainer: { backgroundColor: '#fff', padding: 6, borderRadius: 8, marginRight: 12 },
  footerLogoImage: { width: 28, height: 28 },
  socialRow: { flexDirection: 'row', gap: 12 },
  socialCircle: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#fff', justifyContent: 'center', alignItems: 'center' },

  footerLinksColumn: { gap: 10 },
  footerColumnTitle: { color: '#fff', fontSize: 16, fontWeight: '700', marginBottom: 15 },
  footerLinkItem: { color: '#fff', fontSize: 14, fontWeight: '400', marginBottom: 6 },
});

export default LandingScreen;
