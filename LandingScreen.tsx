import React, { useRef, useState } from 'react';
import { View, Text, StyleSheet, Platform, ScrollView, TouchableOpacity, Image, ImageBackground, Alert } from 'react-native';
import { useResponsive } from './hooks/useResponsive';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from './navigation/types';

type Nav = NativeStackNavigationProp<RootStackParamList, 'Landing'>;

const ViremLogo = require('./assets/imagenes/descarga.png');
const EquipoVirem = require('./assets/imagenes/equipo_virem.png');

const colors = {
  primary: '#2B6CB0', // Professional, muted blue
  secondary: '#1A365D', // Deep navy blue
  dark: '#0F172A',
  muted: '#475569',
  bg: '#F8FAFC',
  white: '#FFFFFF',
};

const LandingScreen: React.FC = () => {
  const navigation = useNavigation<Nav>();
  const scrollViewRef = useRef<ScrollView>(null);
  const [layoutY, setLayoutY] = useState({ plataforma: 0, especialidades: 0, nosotros: 0, blog: 0, contacto: 0 });

  const scrollTo = (y: number) => {
    scrollViewRef.current?.scrollTo({ y, animated: true });
  };
  const { isDesktop, isTablet, isMobile, select, width } = useResponsive();

  const navigateToLogin = () => navigation.navigate('Login');
  const navigateToRegister = () => navigation.navigate('SeleccionPerfil');

  return (
    <View style={styles.container}>
      {/* TOP NAVBAR - UNTOUCHED AS REQUESTED */}
      <View style={[styles.navbar, isDesktop && styles.navbarDesktop]}>
        <View style={styles.navLeft}>
          <Image source={ViremLogo} style={styles.logoImage} resizeMode="contain" />
          <Text style={styles.logoText}>VIREM</Text>
        </View>
        
        {isDesktop && (
          <View style={styles.navLinksCenter}>
            <TouchableOpacity onPress={() => scrollTo(layoutY.especialidades)}>
              <Text style={styles.navLinkCenterText}>Especialidades</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => scrollTo(layoutY.plataforma)}>
              <Text style={styles.navLinkCenterText}>Plataforma</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => scrollTo(layoutY.blog)}>
              <Text style={styles.navLinkCenterText}>Blog</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => scrollTo(layoutY.nosotros)}>
              <Text style={styles.navLinkCenterText}>Nosotros</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => scrollTo(layoutY.contacto)}>
              <Text style={styles.navLinkCenterText}>Contacto</Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={styles.navRight}>
          <TouchableOpacity style={[styles.navBtn, { backgroundColor: colors.primary, marginRight: 10 }]} onPress={navigateToRegister}>
            <Text style={styles.navBtnText}>REGISTRARSE</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.navBtn, { backgroundColor: colors.primary }]} onPress={navigateToLogin}>
            <Text style={styles.navBtnText}>INICIAR SESIÓN</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView ref={scrollViewRef} contentContainerStyle={styles.scrollContent}>
        
        {/* HERO SECTION */}
        <View style={{ width: "100%", minHeight: select({ mobile: 400, tablet: 500, desktop: 600 }) }}>
          <ImageBackground 
            source={EquipoVirem} 
            style={{ width: "100%", height: "100%", justifyContent: "center" }}
            resizeMode="cover"
          >
            <View style={{ 
              zIndex: 2, 
              paddingHorizontal: select({ mobile: 24, tablet: 40, desktop: 80 }), 
              paddingVertical: 40, 
              width: select({ mobile: "100%", tablet: "70%", desktop: "55%" }) 
            }}>
              <Text style={{ 
                fontSize: select({ mobile: 32, tablet: 40, desktop: 48 }), 
                fontWeight: "900", 
                color: colors.secondary, 
                marginBottom: 16, 
                lineHeight: select({ mobile: 38, tablet: 48, desktop: 56 }) 
              }}>
                ¡TU SALUD ES NUESTRA PRIORIDAD!
              </Text>
              <Text style={{ 
                fontSize: select({ mobile: 16, tablet: 17, desktop: 18 }), 
                color: colors.secondary, 
                lineHeight: 28, 
                marginBottom: 30, 
                fontWeight: "500" 
              }}>
                Somos líderes en atención primaria en salud. Nos enfocamos en prestar un servicio de salud integral destinado a proteger tu salud y bienestar.
              </Text>
              <TouchableOpacity style={styles.heroActionBtn} onPress={navigateToRegister}>
                <Text style={styles.heroActionBtnText}>AGENDA UNA CITA</Text>
              </TouchableOpacity>
            </View>
          </ImageBackground>
        </View>

        {/* HOW IT WORKS */}
        <View onLayout={(e) => setLayoutY(prev => ({...prev, plataforma: e.nativeEvent.layout.y}))} style={[styles.howItWorksSection, isDesktop && styles.howItWorksDesktop]}>
          {isDesktop && (
            <View style={styles.howItWorksImgContainer}>
              <View style={styles.greenCircle}>
                <Image 
                  source={{ uri: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?q=80&w=400&auto=format&fit=crop' }}
                  style={styles.doctorCircleImage}
                />
              </View>
            </View>
          )}
          <View style={[styles.howItWorksTextContainer, isDesktop && styles.howItWorksTextDesktop]}>
            <Text style={styles.sectionHeadingLeft}>¿CÓMO FUNCIONA VIREM?</Text>
            <Text style={styles.sectionBodyLeft}>
              En VIREM, te acompañamos en un proceso integral de prevención y control de tu salud, ofreciéndote seguimiento personalizado y brindándote las mejores recomendaciones y cuidados médicos.
            </Text>
            <Text style={styles.sectionBodyLeft}>
              Reconocemos que tu bienestar es primordial, por eso nuestro enfoque se centra en prevenir y detectar posibles complicaciones a tiempo de forma virtual, evitando así que se conviertan en problemas más serios.
            </Text>
            <TouchableOpacity style={styles.heroActionBtn} onPress={navigateToRegister}>
              <Text style={styles.heroActionBtnText}>AGENDAR UNA CITA</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* NUEVA SECCIÓN: SERVICIOS (3 Tarjetas) */}
        <View style={{ paddingVertical: 80, alignItems: 'center', backgroundColor: '#fff', width: '100%' }}>
          <Text style={{ fontSize: 32, fontWeight: '300', color: colors.secondary, marginBottom: 16 }}>SERVICIOS</Text>
          <Text style={{ fontSize: 16, color: colors.muted, textAlign: 'center', maxWidth: 800, marginBottom: 50, paddingHorizontal: 20 }}>
            Desde consultas virtuales con especialistas hasta la descarga inmediata de tus recetas médicas, en VIREM contamos con todas las herramientas necesarias para brindarte una atención integral y precisa.
          </Text>
          
          <View style={{ 
            flexDirection: select({ mobile: 'column', tablet: 'row', desktop: 'row' }), 
            gap: 30, 
            maxWidth: 1200, 
            paddingHorizontal: 20,
            flexWrap: 'wrap',
            justifyContent: 'center'
          }}>
            
            <View style={{ width: select({ mobile: '100%', tablet: '45%', desktop: 350 }), backgroundColor: '#fff', borderRadius: 20, overflow: 'hidden', shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 15, elevation: 5 }}>
              <View style={{ backgroundColor: colors.primary, paddingVertical: 16, alignItems: 'center' }}>
                <Text style={{ color: '#fff', fontSize: 18, fontWeight: '600' }}>Consultas Virtuales</Text>
              </View>
              <Image source={{ uri: 'https://images.unsplash.com/photo-1516549655169-df83a0774514?q=80&w=600&auto=format&fit=crop' }} style={{ width: '100%', height: 250, resizeMode: 'cover' }} />
            </View>

            <View style={{ width: select({ mobile: '100%', tablet: '45%', desktop: 350 }), backgroundColor: '#fff', borderRadius: 20, overflow: 'hidden', shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 15, elevation: 5 }}>
              <View style={{ backgroundColor: colors.primary, paddingVertical: 16, alignItems: 'center' }}>
                <Text style={{ color: '#fff', fontSize: 18, fontWeight: '600' }}>Recetas Digitales</Text>
              </View>
              <Image source={{ uri: 'https://images.unsplash.com/photo-1585435557343-3b092031a831?q=80&w=600&auto=format&fit=crop' }} style={{ width: '100%', height: 250, resizeMode: 'cover' }} />
            </View>

            <View style={{ width: select({ mobile: '100%', tablet: '45%', desktop: 350 }), backgroundColor: '#fff', borderRadius: 20, overflow: 'hidden', shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 15, elevation: 5 }}>
              <View style={{ backgroundColor: colors.primary, paddingVertical: 16, alignItems: 'center' }}>
                <Text style={{ color: '#fff', fontSize: 18, fontWeight: '600' }}>Historial Clínico</Text>
              </View>
              <Image source={{ uri: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?q=80&w=600&auto=format&fit=crop' }} style={{ width: '100%', height: 250, resizeMode: 'cover' }} />
            </View>

          </View>
        </View>

        {/* ESPECIALIDADES GRID */}
        <View onLayout={(e) => setLayoutY(prev => ({...prev, especialidades: e.nativeEvent.layout.y}))} style={[styles.servicesSection, { backgroundColor: "#F8FAFC", paddingVertical: 80, alignItems: "center", width: "100%" }]}>
          
          <View style={{ width: "100%", maxWidth: 1200, flexDirection: isDesktop ? "row" : "column", justifyContent: "space-between", alignItems: isDesktop ? "flex-end" : "flex-start", marginBottom: 40, paddingHorizontal: 20 }}>
            <Text style={{ fontSize: 24, fontWeight: "900", color: colors.dark, marginBottom: isDesktop ? 0 : 10 }}>Especialidades Médicas</Text>
            <Text style={{ fontSize: 15, fontWeight: "800", color: colors.dark }}>12 disponibles</Text>
          </View>

          <View style={{
            flexDirection: "row",
            flexWrap: "wrap",
            justifyContent: "center",
            gap: select({ mobile: 16, tablet: 20, desktop: 24 }),
            maxWidth: 1200,
            paddingHorizontal: select({ mobile: 16, tablet: 24, desktop: 40 })
          }}>
            {[
              { icon: "medical-services", title: "Medicina General", sub: "Atención primaria inicial", count: "6 médico(s) disponible(s)" },
              { icon: "psychology", title: "Psicología", sub: "Salud mental y emocional", count: "3 médico(s) disponible(s)" },
              { icon: "favorite-border", title: "Cardiología", sub: "Corazón y sistema circulatorio", count: "Disponibilidad variable" },
              { icon: "face", title: "Dermatología", sub: "Cuidado de la piel y cabello", count: "Disponibilidad variable" },
              { icon: "medication", title: "Endocrinología", sub: "Hormonas y metabolismo", count: "Disponibilidad variable" },
              { icon: "pregnant-woman", title: "Ginecología", sub: "Salud femenina y reproductiva", count: "Disponibilidad variable" },
              { icon: "monitor-heart", title: "Medicina Interna", sub: "Consulta médica especializada", count: "Disponibilidad variable" },
              { icon: "restaurant", title: "Nutrición", sub: "Dieta y bienestar alimenticio", count: "Disponibilidad variable" },
              { icon: "sentiment-satisfied", title: "Odontología", sub: "Salud oral y dental", count: "Disponibilidad variable" },
              { icon: "child-care", title: "Pediatría", sub: "Atención integral para niños", count: "Disponibilidad variable" },
              { icon: "accessible-forward", title: "Reumatología", sub: "Consulta médica especializada", count: "Disponibilidad variable" },
              { icon: "transgender", title: "Sexología", sub: "Consulta médica especializada", count: "Disponibilidad variable" },
            ].map((esp, i) => (
              <View key={i} style={{
                width: select({
                  mobile: "100%",
                  tablet: "45%",
                  desktop: 270
                }),
                alignItems: "center",
                marginBottom: 10
              }}>
                <View style={{ width: "100%", backgroundColor: "#fff", borderRadius: 20, borderWidth: 1, borderColor: "#E2E8F0", padding: 24, alignItems: "center", marginBottom: 12, shadowColor: "#000", shadowOpacity: 0.02, shadowRadius: 10, elevation: 1 }}>
                  <View style={{ width: 56, height: 56, borderRadius: 16, backgroundColor: "#F0F7FA", justifyContent: "center", alignItems: "center", marginBottom: 16 }}>
                    <MaterialIcons name={esp.icon} size={28} color={colors.secondary} />
                  </View>
                  <Text style={{ fontSize: 16, fontWeight: "900", color: colors.dark, marginBottom: 6, textAlign: "center" }}>{esp.title}</Text>
                  <Text style={{ fontSize: 13, color: colors.muted, textAlign: "center" }}>{esp.sub}</Text>
                </View>
                <Text style={{ fontSize: 13, fontWeight: "800", color: colors.primary }}>{esp.count}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* NUEVA SECCIÓN: ACCESO EN LÍNEA */}
        <View style={{ 
          flexDirection: select({ mobile: 'column', tablet: 'column', desktop: 'row' }), 
          alignItems: 'center', 
          justifyContent: 'center', 
          paddingVertical: 80, 
          backgroundColor: '#fff', 
          paddingHorizontal: 20 
        }}>
          
          <View style={{ 
            flex: select({ mobile: 1, tablet: 1, desktop: 0.4 }), 
            alignItems: 'center', 
            marginBottom: select({ mobile: 40, tablet: 60, desktop: 0 }) 
          }}>
            {/* Phone/App Graphic representation */}
            <View style={{ 
              width: 220, 
              height: 380, 
              backgroundColor: colors.primary, 
              borderRadius: 30, 
              justifyContent: 'center', 
              alignItems: 'center', 
              shadowColor: colors.primary, 
              shadowOpacity: 0.4, 
              shadowRadius: 30, 
              elevation: 10, 
              borderWidth: 10, 
              borderColor: '#EBF5FB' 
            }}>
              <MaterialIcons name="fact-check" size={80} color="#fff" style={{ marginBottom: 20 }} />
              <View style={{ width: 140, height: 12, backgroundColor: 'rgba(255,255,255,0.3)', borderRadius: 6, marginBottom: 15 }} />
              <View style={{ width: 160, height: 12, backgroundColor: 'rgba(255,255,255,0.3)', borderRadius: 6, marginBottom: 15 }} />
              <View style={{ width: 120, height: 12, backgroundColor: 'rgba(255,255,255,0.3)', borderRadius: 6, marginBottom: 40 }} />
              <View style={{ width: 60, height: 60, borderRadius: 30, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center' }}>
                <MaterialIcons name="check" size={30} color="#fff" />
              </View>
            </View>
          </View>
          
          <View style={{ 
            flex: select({ mobile: 1, tablet: 1, desktop: 0.5 }), 
            paddingLeft: select({ mobile: 0, tablet: 0, desktop: 60 }),
            alignItems: select({ mobile: 'center', tablet: 'center', desktop: 'flex-start' })
          }}>
            <Text style={{ 
              fontSize: select({ mobile: 28, tablet: 32, desktop: 32 }), 
              fontWeight: '300', 
              color: colors.secondary, 
              marginBottom: 20,
              textAlign: select({ mobile: 'center', tablet: 'center', desktop: 'left' })
            }}>
              GESTIONA TU SALUD EN LÍNEA
            </Text>
            <Text style={{ 
              fontSize: 16, 
              color: colors.muted, 
              lineHeight: 28, 
              marginBottom: 30,
              textAlign: select({ mobile: 'center', tablet: 'center', desktop: 'left' })
            }}>
              Accede y descarga tus recetas médicas de forma rápida y segura desde cualquier lugar con nuestra plataforma en línea. También podrás visualizar tu historial completo y el seguimiento de tus especialistas.
            </Text>
            <TouchableOpacity style={{ backgroundColor: colors.primary, paddingHorizontal: 32, paddingVertical: 16, borderRadius: 8 }} onPress={navigateToLogin}>
              <Text style={{ color: '#fff', fontSize: 16, fontWeight: '700' }}>INGRESAR A LA PLATAFORMA</Text>
            </TouchableOpacity>
          </View>
          
        </View>

        {/* NOSOTROS */}
        <View onLayout={(e) => setLayoutY(prev => ({...prev, nosotros: e.nativeEvent.layout.y}))} style={[styles.howItWorksSection, { backgroundColor: '#F8FAFC' }, isDesktop && styles.howItWorksDesktop]}>
          <View style={[styles.howItWorksTextContainer, isDesktop && { paddingRight: 60 }, (isTablet || isMobile) && { alignItems: 'center' }]}>
            <Text style={[styles.sectionHeadingLeft, (isTablet || isMobile) && { textAlign: 'center' }]}>SOBRE NOSOTROS</Text>
            <Text style={[styles.sectionBodyLeft, (isTablet || isMobile) && { textAlign: 'center' }]}>
              VIREM nace con la misión de democratizar y facilitar el acceso a la salud. Somos un equipo interdisciplinario que une la medicina y la tecnología para romper las barreras geográficas.
            </Text>
            <Text style={[styles.sectionBodyLeft, (isTablet || isMobile) && { textAlign: 'center' }]}>
              Creemos firmemente en el cuidado continuo del paciente, promoviendo espacios donde puedas encontrar desde médicos generales hasta terapeutas que guíen tu bienestar emocional.
            </Text>
          </View>
          {isDesktop && (
            <View style={styles.howItWorksImgContainer}>
              <View style={[styles.greenCircle, { backgroundColor: colors.primary }]}>
                <Image source={{ uri: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?q=80&w=400&auto=format&fit=crop' }} style={styles.doctorCircleImage} />
              </View>
            </View>
          )}
        </View>

        {/* BLOG */}
        <View onLayout={(e) => setLayoutY(prev => ({...prev, blog: e.nativeEvent.layout.y}))} style={styles.servicesSection}>
          <Text style={styles.sectionHeadingCenter}>NUESTRO BLOG</Text>
          <Text style={styles.sectionBodyCenter}>Información, consejos y noticias sobre bienestar físico y mental.</Text>
          
          <View style={[styles.cardsGrid, isDesktop && styles.cardsGridDesktop, isTablet && { flexDirection: 'row', justifyContent: 'center' }]}>
            <View style={[styles.serviceCard, isTablet && { flex: 1, maxWidth: '48%' }]}>
              <Image source={{ uri: 'https://images.unsplash.com/photo-1527689368864-3a821dbccc34?q=80&w=400&auto=format&fit=crop' }} style={styles.cardImage} />
              <View style={{ padding: 20 }}>
                <Text style={{ color: colors.muted, fontSize: 12, marginBottom: 5 }}>SALUD MENTAL</Text>
                <Text style={{ color: colors.dark, fontSize: 18, fontWeight: 'bold', marginBottom: 10 }}>Grupos de Apoyo y Psicología</Text>
                <Text style={{ color: colors.muted, fontSize: 14 }}>Descubre cómo nuestras reuniones virtuales con especialistas están ayudando a cientos de pacientes a manejar el estrés diario.</Text>
              </View>
            </View>
            <View style={[styles.serviceCard, isTablet && { flex: 1, maxWidth: '48%' }]}>
              <Image source={{ uri: 'https://images.unsplash.com/photo-1434493789847-2f02dc6ca35d?q=80&w=400&auto=format&fit=crop' }} style={styles.cardImage} />
              <View style={{ padding: 20 }}>
                <Text style={{ color: colors.muted, fontSize: 12, marginBottom: 5 }}>PREVENCIÓN</Text>
                <Text style={{ color: colors.dark, fontSize: 18, fontWeight: 'bold', marginBottom: 10 }}>La importancia del chequeo anual</Text>
                <Text style={{ color: colors.muted, fontSize: 14 }}>Por qué no debes esperar a sentirte mal para agendar una cita con tu médico de confianza. Hábitos saludables en casa.</Text>
              </View>
            </View>
          </View>
        </View>

        {/* FOOTER */}
        <View onLayout={(e) => setLayoutY(prev => ({...prev, contacto: e.nativeEvent.layout.y}))} style={[styles.footerContainer, isDesktop && { borderTopLeftRadius: 150 }]}>
          <View style={[styles.footer, isDesktop && styles.footerDesktop]}>
            <View style={[styles.footerBrandSection, (isTablet || isMobile) && { alignItems: 'center', maxWidth: '100%' }]}>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
                <View style={styles.footerLogoContainer}>
                  <Image source={ViremLogo} style={styles.footerLogoImage} resizeMode="contain" />
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
        </View>

      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  scrollContent: { flexGrow: 1 },
  
  // NAVBAR
  navbar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, backgroundColor: colors.white, zIndex: 10, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 10, elevation: 5 },
  navbarDesktop: { paddingHorizontal: 40, paddingVertical: 16 },
  navLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  logoImage: { width: 32, height: 32 },
  logoText: { fontSize: 26, fontWeight: '900', color: colors.dark, letterSpacing: 0 },
  
  navLinksCenter: { flexDirection: 'row', gap: 24 },
  navLinkCenterText: { color: colors.primary, fontWeight: '600', fontSize: 15 },

  navRight: { flexDirection: 'row', alignItems: 'center' },
  navBtn: { paddingHorizontal: 20, paddingVertical: 10, borderRadius: 20 },
  navBtnText: { color: colors.white, fontWeight: '700', fontSize: 13 },

  // HERO
  heroSection: { padding: 24, paddingVertical: 40, backgroundColor: '#EBF5FB' },
  heroDesktop: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 80, paddingVertical: 60, minHeight: 600 },
  heroTextContainer: { flex: 1, zIndex: 2 },
  heroTextDesktop: { paddingRight: 40, flex: 1 },
  heroTitle: { fontSize: 48, fontWeight: '900', color: colors.dark, marginBottom: 16, lineHeight: 56 },
  heroSubtitle: { fontSize: 18, color: colors.muted, lineHeight: 28, marginBottom: 30, fontWeight: '400' },
  heroActionBtn: { backgroundColor: colors.primary, paddingHorizontal: 36, paddingVertical: 16, borderRadius: 8, alignSelf: 'flex-start', shadowColor: colors.primary, shadowOpacity: 0.3, shadowRadius: 10, elevation: 5 },
  heroActionBtnText: { color: colors.white, fontSize: 16, fontWeight: '800', letterSpacing: 0.5 },
  
  heroImageContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingLeft: 20 },
  heroImage: { width: 550, height: 380, borderRadius: 24, borderWidth: 8, borderColor: '#FFFFFF', shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 30, elevation: 10 },

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
  serviceCard: { flex: 1, backgroundColor: '#fff', borderRadius: 16, overflow: 'hidden', shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 10, elevation: 4 },
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
// Trigger hot reload
