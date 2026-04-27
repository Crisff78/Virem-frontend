import React, { useRef, useState } from 'react';
import { View, Text, StyleSheet, Platform, ScrollView, TouchableOpacity, useWindowDimensions, Image, ImageBackground, Alert } from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from './navigation/types';

type Nav = NativeStackNavigationProp<RootStackParamList, 'Landing'>;

const ViremLogo = require('./assets/imagenes/descarga.png');

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
  const { width } = useWindowDimensions();
  const isDesktop = Platform.OS === 'web' && width >= 1024;

  const navigateToLogin = () => navigation.navigate('Login');
  const navigateToRegister = () => navigation.navigate('SeleccionPerfil');

  return (
    <View style={styles.container}>
      {/* TOP NAVBAR */}
      <View style={[styles.navbar, isDesktop && styles.navbarDesktop]}>
        <View style={styles.navLeft}>
          <Image source={ViremLogo} style={styles.logoImage} />
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
        <View style={[styles.heroSection, isDesktop && styles.heroDesktop]}>
          <View style={[styles.heroTextContainer, isDesktop && styles.heroTextDesktop]}>
            <Text style={styles.heroTitle}>¡TU SALUD ES NUESTRA PRIORIDAD!</Text>
            <Text style={styles.heroSubtitle}>
              Somos líderes en atención médica digital. Nos enfocamos en prestar un servicio de salud integral destinado a proteger tu salud y bienestar desde la comodidad de tu hogar.
            </Text>
            <TouchableOpacity style={styles.heroActionBtn} onPress={navigateToRegister}>
              <Text style={styles.heroActionBtnText}>AGENDA UNA CITA</Text>
            </TouchableOpacity>
          </View>
          {isDesktop && (
            <View style={styles.heroImageContainer}>
              <Image 
                source={{ uri: 'https://images.unsplash.com/photo-1579684385127-1ef15d508118?q=80&w=800&auto=format&fit=crop' }} 
                style={styles.heroImage} 
                resizeMode="cover"
              />
            </View>
          )}
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

        {/* SERVICES CARDS */}
        <View onLayout={(e) => setLayoutY(prev => ({...prev, especialidades: e.nativeEvent.layout.y}))} style={styles.servicesSection}>
          <Text style={styles.sectionHeadingCenter}>SERVICIOS</Text>
          <Text style={styles.sectionBodyCenter}>
            Desde consultas con especialistas altamente capacitados hasta la emisión de recetas electrónicas, en VIREM contamos con todas las herramientas necesarias para brindarte una atención integral y precisa.
          </Text>

          <View style={[styles.cardsGrid, isDesktop && styles.cardsGridDesktop]}>
            
            <View style={styles.serviceCard}>
              <View style={styles.cardHeader}>
                <Text style={styles.cardHeaderText}>Consulta Virtual</Text>
              </View>
              <Image source={{ uri: 'https://images.unsplash.com/photo-1638202993928-7267aad84c31?q=80&w=400&auto=format&fit=crop' }} style={styles.cardImage} />
            </View>

            <View style={styles.serviceCard}>
              <View style={styles.cardHeader}>
                <Text style={styles.cardHeaderText}>Recetas Médicas</Text>
              </View>
              <Image source={{ uri: 'https://images.unsplash.com/photo-1587854692152-cbe660dbde88?q=80&w=400&auto=format&fit=crop' }} style={styles.cardImage} />
            </View>

            <View style={styles.serviceCard}>
              <View style={styles.cardHeader}>
                <Text style={styles.cardHeaderText}>Historial Clínico</Text>
              </View>
              <Image source={{ uri: 'https://images.unsplash.com/photo-1530497610245-94d3c16cda28?q=80&w=400&auto=format&fit=crop' }} style={styles.cardImage} />
            </View>

          </View>
        </View>

        
        
        {/* ESPECIALIDADES HERO & GRID */}
        <View onLayout={(e) => setLayoutY(prev => ({...prev, especialidades: e.nativeEvent.layout.y}))} style={{ width: "100%", backgroundColor: "#f8fafc" }}>
          
          <ImageBackground 
            source={{ uri: "https://images.unsplash.com/photo-1584982751601-97dcc096659c?q=80&w=1200&auto=format&fit=crop" }} 
            style={{ width: "100%", paddingVertical: 80, alignItems: "center", justifyContent: "center" }}
            imageStyle={{ opacity: 0.2 }}
          >
            <View style={{ backgroundColor: colors.primary, position: "absolute", width: "100%", height: "100%", opacity: 0.8 }} />
            <Text style={{ fontSize: 36, fontWeight: "900", color: "#fff", marginBottom: 20, zIndex: 2 }}>ESPECIALIDADES</Text>
            <Text style={{ fontSize: 16, color: "#fff", textAlign: "center", maxWidth: 800, lineHeight: 26, paddingHorizontal: 20, zIndex: 2, fontWeight: "500" }}>
              En VIREM, nos enorgullece contar con un equipo diverso de especialistas altamente capacitados. Nuestro objetivo principal es brindarte una atenci�n m�dica de calidad que garantice tu bienestar integral.
            </Text>
          </ImageBackground>

          <View style={{ padding: 40, alignItems: "center" }}>
            <View style={{ flexDirection: "row", flexWrap: "wrap", justifyContent: "center", gap: 30, maxWidth: 1200, marginTop: -60 }}>
              
              {/* CARD 1 */}
              <View style={styles.espCard}>
                <View style={styles.espIconWrap}>
                  <MaterialIcons name="favorite" size={32} color="#fff" />
                </View>
                <Text style={styles.espCardTitle}>CARDIOLOG�A</Text>
                <Text style={styles.espCardDesc}>
                  La cardiolog�a es una rama de la medicina que se especializa en el diagn�stico, tratamiento y prevenci�n de enfermedades del coraz�n y los vasos sangu�neos.
                </Text>
                <TouchableOpacity style={styles.espBtn} onPress={navigateToRegister}>
                  <Text style={styles.espBtnText}>VER M�S</Text>
                </TouchableOpacity>
              </View>

              {/* CARD 2 */}
              <View style={styles.espCard}>
                <View style={styles.espIconWrap}>
                  <MaterialIcons name="healing" size={32} color="#fff" />
                </View>
                <Text style={styles.espCardTitle}>CIRUG�A GENERAL</Text>
                <Text style={styles.espCardDesc}>
                  La especialidad en cirug�a general se enfoca en el diagn�stico y tratamiento quir�rgico de diversas enfermedades, principalmente del sistema digestivo y abdomen.
                </Text>
                <TouchableOpacity style={styles.espBtn} onPress={navigateToRegister}>
                  <Text style={styles.espBtnText}>VER M�S</Text>
                </TouchableOpacity>
              </View>

              {/* CARD 3 */}
              <View style={styles.espCard}>
                <View style={styles.espIconWrap}>
                  <MaterialIcons name="face-retouching-natural" size={32} color="#fff" />
                </View>
                <Text style={styles.espCardTitle}>DERMATOLOG�A</Text>
                <Text style={styles.espCardDesc}>
                  La dermatolog�a es una especialidad m�dica dedicada al estudio, diagn�stico y tratamiento de enfermedades y condiciones de la piel, cabello y u�as.
                </Text>
                <TouchableOpacity style={styles.espBtn} onPress={navigateToRegister}>
                  <Text style={styles.espBtnText}>VER M�S</Text>
                </TouchableOpacity>
              </View>

              {/* CARD 4 */}
              <View style={styles.espCard}>
                <View style={styles.espIconWrap}>
                  <MaterialIcons name="bloodtype" size={32} color="#fff" />
                </View>
                <Text style={styles.espCardTitle}>DIABETOLOG�A</Text>
                <Text style={styles.espCardDesc}>
                  Especialidad m�dica dedicada al cuidado y tratamiento integral de la diabetes. Nuestro equipo de especialistas te ayudar� a mantener el control adecuado.
                </Text>
                <TouchableOpacity style={styles.espBtn} onPress={navigateToRegister}>
                  <Text style={styles.espBtnText}>VER M�S</Text>
                </TouchableOpacity>
              </View>

              {/* CARD 5 */}
              <View style={styles.espCard}>
                <View style={styles.espIconWrap}>
                  <MaterialIcons name="local-hospital" size={32} color="#fff" />
                </View>
                <Text style={styles.espCardTitle}>GASTROENTEROLOG�A</Text>
                <Text style={styles.espCardDesc}>
                  Se centra en el estudio, diagn�stico y tratamiento de trastornos y enfermedades del sistema digestivo, h�gado, p�ncreas y v�as biliares.
                </Text>
                <TouchableOpacity style={styles.espBtn} onPress={navigateToRegister}>
                  <Text style={styles.espBtnText}>VER M�S</Text>
                </TouchableOpacity>
              </View>

              {/* CARD 6 */}
              <View style={styles.espCard}>
                <View style={styles.espIconWrap}>
                  <MaterialIcons name="elderly" size={32} color="#fff" />
                </View>
                <Text style={styles.espCardTitle}>GERIATR�A</Text>
                <Text style={styles.espCardDesc}>
                  Especialidad de la medicina que se enfoca en el estudio, diagn�stico, tratamiento y cuidado de las personas mayores de edad, asegurando su calidad de vida.
                </Text>
                <TouchableOpacity style={styles.espBtn} onPress={navigateToRegister}>
                  <Text style={styles.espBtnText}>VER M�S</Text>
                </TouchableOpacity>
              </View>

            </View>
          </View>
        </View>

        {/* NOSOTROS */}

        <View onLayout={(e) => setLayoutY(prev => ({...prev, nosotros: e.nativeEvent.layout.y}))} style={[styles.howItWorksSection, isDesktop && styles.howItWorksDesktop]}>
          <View style={[styles.howItWorksTextContainer, isDesktop && { paddingRight: 60 }]}>
            <Text style={styles.sectionHeadingLeft}>SOBRE NOSOTROS</Text>
            <Text style={styles.sectionBodyLeft}>
              VIREM nace con la misi�n de democratizar y facilitar el acceso a la salud. Somos un equipo interdisciplinario que une la medicina y la tecnolog�a para romper las barreras geogr�ficas.
            </Text>
            <Text style={styles.sectionBodyLeft}>
              Creemos firmemente en el cuidado continuo del paciente, promoviendo espacios donde puedas encontrar desde m�dicos generales hasta terapeutas que gu�en tu bienestar emocional.
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
          <Text style={styles.sectionBodyCenter}>Informaci�n, consejos y noticias sobre bienestar f�sico y mental.</Text>
          
          <View style={[styles.cardsGrid, isDesktop && styles.cardsGridDesktop]}>
            <View style={styles.serviceCard}>
              <Image source={{ uri: 'https://images.unsplash.com/photo-1527689368864-3a821dbccc34?q=80&w=400&auto=format&fit=crop' }} style={styles.cardImage} />
              <View style={{ padding: 20 }}>
                <Text style={{ color: colors.muted, fontSize: 12, marginBottom: 5 }}>SALUD MENTAL</Text>
                <Text style={{ color: colors.dark, fontSize: 18, fontWeight: 'bold', marginBottom: 10 }}>Grupos de Apoyo y Psicolog�a</Text>
                <Text style={{ color: colors.muted, fontSize: 14 }}>Descubre c�mo nuestras reuniones virtuales con especialistas est�n ayudando a cientos de pacientes a manejar el estr�s diario.</Text>
              </View>
            </View>
            <View style={styles.serviceCard}>
              <Image source={{ uri: 'https://images.unsplash.com/photo-1434493789847-2f02dc6ca35d?q=80&w=400&auto=format&fit=crop' }} style={styles.cardImage} />
              <View style={{ padding: 20 }}>
                <Text style={{ color: colors.muted, fontSize: 12, marginBottom: 5 }}>PREVENCI�N</Text>
                <Text style={{ color: colors.dark, fontSize: 18, fontWeight: 'bold', marginBottom: 10 }}>La importancia del chequeo anual</Text>
                <Text style={{ color: colors.muted, fontSize: 14 }}>Por qu� no debes esperar a sentirte mal para agendar una cita con tu m�dico de confianza. H�bitos saludables en casa.</Text>
              </View>
            </View>
          </View>
        </View>

        {/* FOOTER */}
        <View onLayout={(e) => setLayoutY(prev => ({...prev, contacto: e.nativeEvent.layout.y}))} style={styles.footerContainer}>
          <View style={[styles.footer, isDesktop && styles.footerDesktop]}>
            <View style={styles.footerBrandSection}>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
                <View style={styles.footerLogoContainer}>
                  <Image source={ViremLogo} style={styles.footerLogoImage} />
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
              <Text style={styles.footerLinkItem}>Política de privacidad</Text>
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
  logoImage: { width: 32, height: 32, resizeMode: 'contain' },
  logoText: { fontSize: 26, fontWeight: '900', color: colors.dark, letterSpacing: 0 },
  
  navLinksCenter: { flexDirection: 'row', gap: 24 },
  navLinkCenterText: { color: colors.primary, fontWeight: '600', fontSize: 15 },

  navRight: { flexDirection: 'row', alignItems: 'center' },
  navBtn: { paddingHorizontal: 20, paddingVertical: 10, borderRadius: 20 },
  navBtnText: { color: colors.white, fontWeight: '700', fontSize: 13 },

  // HERO
  heroSection: { padding: 24, paddingVertical: 40, backgroundColor: '#EBF5FB' },
  heroDesktop: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 80, paddingVertical: 60, minHeight: 500 },
  heroTextContainer: { flex: 1, zIndex: 2 },
  heroTextDesktop: { paddingRight: 40, flex: 0.8 },
  heroTitle: { fontSize: 42, fontWeight: '800', color: colors.dark, marginBottom: 16, lineHeight: 48 },
  heroSubtitle: { fontSize: 16, color: colors.muted, lineHeight: 26, marginBottom: 30, fontWeight: '400' },
  heroActionBtn: { backgroundColor: colors.primary, paddingHorizontal: 30, paddingVertical: 14, borderRadius: 6, alignSelf: 'flex-start' },
  heroActionBtnText: { color: colors.white, fontSize: 15, fontWeight: '700' },
  
  heroImageContainer: { flex: 1, position: 'absolute', right: 0, top: 0, bottom: 0, width: '55%' },
  heroImage: { width: '100%', height: '100%', opacity: 0.9 },

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


  espCard: { backgroundColor: "#fff", borderRadius: 16, padding: 24, paddingTop: 40, width: 320, alignItems: "center", shadowColor: "#000", shadowOpacity: 0.1, shadowRadius: 10, elevation: 4, position: "relative", marginTop: 40, marginBottom: 20 },
  espIconWrap: { width: 60, height: 60, borderRadius: 30, backgroundColor: colors.primary, alignItems: "center", justifyContent: "center", position: "absolute", top: -30, borderWidth: 4, borderColor: "#fff" },
  espCardTitle: { fontSize: 16, fontWeight: "700", color: colors.primary, marginBottom: 12 },
  espCardDesc: { fontSize: 14, color: colors.muted, textAlign: "center", lineHeight: 22, flex: 1, minHeight: 90 },
  espBtn: { backgroundColor: colors.primary, paddingHorizontal: 24, paddingVertical: 10, borderRadius: 8, marginTop: 16 },
  espBtnText: { color: "#fff", fontWeight: "700", fontSize: 14 },

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
  footerContainer: { backgroundColor: colors.secondary, marginTop: 40 },
  footer: { padding: 40, flexDirection: 'column', gap: 30 },
  footerDesktop: { flexDirection: 'row', justifyContent: 'space-around', alignItems: 'flex-start' },
  
  footerBrandSection: { alignItems: 'flex-start', maxWidth: 300 },
  footerLogoContainer: { backgroundColor: '#fff', padding: 6, borderRadius: 8, marginRight: 12 },
  footerLogoImage: { width: 28, height: 28, resizeMode: 'contain' },
  socialRow: { flexDirection: 'row', gap: 12 },
  socialCircle: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#fff', justifyContent: 'center', alignItems: 'center' },

  footerLinksColumn: { gap: 10 },
  footerColumnTitle: { color: '#fff', fontSize: 16, fontWeight: '700', marginBottom: 10 },
  footerLinkItem: { color: '#fff', fontSize: 14, fontWeight: '400', marginBottom: 6 },
});

export default LandingScreen;
