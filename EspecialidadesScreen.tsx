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

const HoverSpecialtyCard = ({ icon, title, context, sub, count, image, detailedInfo, whenToGo, importance, style }: any) => {
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
        ...((Platform.select({ web: { backdropFilter: 'blur(8px)' } }) as object) || {})
      }}>
        <MaterialIcons name="info-outline" size={24} color="#fff" style={{ marginBottom: 12 }} />
        <Text style={{ color: '#fff', fontSize: 14, textAlign: 'center', lineHeight: 22, fontWeight: '500' }}>
          {context}
        </Text>
        <TouchableOpacity 
          style={{ marginTop: 16, backgroundColor: colors.primary, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8 }}
          onPress={() => navigation.navigate('EspecialidadDetalle', { title, description: context, icon, image, detailedInfo, whenToGo, importance } as any)}
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
    { 
      icon: "monitor-heart", 
      title: "Medicina Interna", 
      sub: "Consulta médica especializada", 
      count: "Disponibilidad variable", 
      context: "Atención experta en enfermedades complejas del adulto.", 
      detailedInfo: "La medicina interna en VIREM ofrece una visión global y científica del paciente adulto. Nuestros internistas se especializan en coordinar el cuidado de pacientes con múltiples patologías crónicas, brindando diagnósticos precisos para síntomas complejos y gestionando tratamientos que requieren un enfoque integrador y detallado de la salud sistémica.",
      whenToGo: ["Manejo de múltiples enfermedades crónicas", "Fiebre de origen desconocido", "Seguimiento integral post-hospitalización", "Diagnóstico de síntomas multiorgánicos", "Chequeo médico ejecutivo profundo"],
      importance: "El médico internista es el 'arquitecto' de la salud del adulto, integrando todos los sistemas del cuerpo para un tratamiento coherente y seguro.",
      img: require('./assets/imagenes/MedicinaInterna.png') 
    },
    { 
      icon: "restaurant", 
      title: "Nutrición", 
      sub: "Dieta y bienestar alimenticio", 
      count: "Disponibilidad variable", 
      context: "Planes de alimentación personalizados para mejorar tu salud.", 
      detailedInfo: "Nuestra especialidad en nutrición va más allá de la pérdida de peso; se enfoca en la nutrición clínica funcional. Diseñamos planes alimenticios basados en tu bioquímica personal y objetivos de salud, ya sea para optimizar el rendimiento deportivo, controlar enfermedades metabólicas o mejorar la relación con la comida mediante educación nutricional constante.",
      whenToGo: ["Optimización de composición corporal", "Manejo nutricional de diabetes o hipertensión", "Alergias o intolerancias alimentarias", "Mejora del rendimiento físico y deportivo", "Educación sobre hábitos alimenticios saludables"],
      importance: "La nutrición es la medicina preventiva más poderosa; lo que comes define la capacidad de tu cuerpo para sanar, rendir y mantenerse vital.",
      img: require('./assets/imagenes/Nutricion.png') 
    },
    { 
      icon: "sentiment-satisfied", 
      title: "Odontología", 
      sub: "Salud oral y dental", 
      count: "Disponibilidad variable", 
      context: "Cuidado integral de tu sonrisa y salud bucal.", 
      detailedInfo: "La odontología en VIREM se centra en la salud bucodental como puerta de entrada al bienestar general. Brindamos asesoría en prevención de caries, enfermedades de las encías y estética dental básica. Nuestros profesionales evalúan la integridad de tu salud oral para detectar precozmente problemas que puedan afectar tu nutrición, habla y confianza personal.",
      whenToGo: ["Dolor o sensibilidad dental persistente", "Sangrado de encías durante el cepillado", "Necesidad de limpieza profiláctica profunda", "Evaluación de estética o alineación dental", "Mal aliento crónico o sequedad bucal"],
      importance: "Una boca sana es fundamental no solo para una sonrisa estética, sino para prevenir infecciones sistémicas y asegurar una correcta digestión.",
      img: require('./assets/imagenes/Odontologia.png') 
    },
    { 
      icon: "child-care", 
      title: "Pediatría", 
      sub: "Atención integral para niños", 
      count: "Disponibilidad variable", 
      context: "Seguimiento del crecimiento y desarrollo infantil.", 
      detailedInfo: "Nuestros pediatras acompañan el desarrollo físico, emocional y social de los más pequeños, desde el nacimiento hasta la adolescencia. El enfoque está en el monitoreo preventivo del crecimiento, la gestión de esquemas de vacunación y la atención oportuna de enfermedades agudas, asegurando que cada etapa del desarrollo infantil se cumpla de forma saludable.",
      whenToGo: ["Control periódico de crecimiento y desarrollo", "Seguimiento del esquema de vacunación", "Fiebre persistente o falta de apetito en niños", "Dudas sobre nutrición o sueño infantil", "Cambios inusuales en el comportamiento escolar"],
      importance: "Asegurar una salud sólida en la infancia es la mejor inversión para garantizar un adulto sano, resiliente y con pleno potencial de desarrollo.",
      img: require('./assets/imagenes/Pediatria.png') 
    },
    { 
      icon: "accessible-forward", 
      title: "Reumatología", 
      sub: "Consulta médica especializada", 
      count: "Disponibilidad variable", 
      context: "Tratamiento de enfermedades articulares y musculares.", 
      detailedInfo: "La reumatología aborda de forma experta las enfermedades autoinmunes y los trastornos del aparato locomotor. Nos especializamos en el diagnóstico precoz de la artritis, el lupus y la osteoporosis, enfocándonos en estrategias de tratamiento que reduzcan la inflamación y el dolor crónico para devolverte la movilidad y autonomía en tus actividades diarias.",
      whenToGo: ["Dolor articular persistente sin lesión previa", "Rigidez en las articulaciones al despertar", "Inflamación o calor en manos, pies o rodillas", "Diagnóstico de enfermedades autoinmunes", "Debilidad muscular o dolor óseo crónico"],
      importance: "El diagnóstico temprano en reumatología es clave para prevenir el daño articular permanente y mantener una vida activa e independiente.",
      img: require('./assets/imagenes/Reumologia.png') 
    },
    { 
      icon: "transgender", 
      title: "Sexología", 
      sub: "Consulta médica especializada", 
      count: "Disponibilidad variable", 
      context: "Espacio profesional para la salud sexual y de pareja.", 
      detailedInfo: "La sexología clínica ofrece un abordaje científico y empático de la salud sexual. En este espacio, abordamos disfunciones, dudas sobre la identidad y retos en la vida de pareja. El objetivo es proporcionar herramientas basadas en la medicina y la psicología para que vivas tu sexualidad de forma plena, segura y libre de prejuicios o malestares físicos.",
      whenToGo: ["Dificultades en el deseo o respuesta sexual", "Dudas sobre salud o identidad sexual", "Retos en la comunicación y vida íntima de pareja", "Malestar físico durante las relaciones sexuales", "Búsqueda de educación sexual integral y científica"],
      importance: "La salud sexual es un componente integral del bienestar humano; vivirla plenamente contribuye al equilibrio emocional y a la salud física.",
      img: require('./assets/imagenes/Sexologia .png') 
    },
  ];

  const especialidadesDestacadas = [
    { 
      icon: "medical-services", 
      title: "Medicina General", 
      sub: "Atención primaria inicial", 
      count: "6 médico(s) disponible(s)", 
      context: "La medicina general es la especialidad encargada de brindar atención médica primaria, enfocándose en la prevención, diagnóstico inicial y tratamiento de enfermedades comunes en pacientes de todas las edades.", 
      detailedInfo: "La medicina general ofrece atención integral para evaluar síntomas comunes, realizar chequeos médicos y orientar al paciente sobre su estado de salud. El médico general puede diagnosticar enfermedades frecuentes, controlar condiciones básicas y referir al paciente a otras especialidades si es necesario. Esta especialidad es fundamental para mantener un seguimiento preventivo y detectar problemas de salud a tiempo.",
      whenToGo: ["Malestar general persistente", "Fiebre frecuente", "Dolores corporales", "Síntomas nuevos o desconocidos", "Chequeos médicos preventivos"],
      importance: "La medicina general es esencial porque representa el primer nivel de atención médica. Permite detectar enfermedades de forma temprana, prevenir complicaciones y brindar orientación profesional para mantener una buena salud física y bienestar general.",
      img: require('./assets/imagenes/MedicinaGeneral.png') 
    },
    { 
      icon: "psychology", 
      title: "Psicología", 
      sub: "Salud mental y emocional", 
      count: "3 médico(s) disponible(s)", 
      context: "Acompañamiento profesional para tu bienestar emocional.", 
      detailedInfo: "La psicología clínica en VIREM ofrece un espacio seguro para el abordaje de trastornos emocionales, del estado de ánimo y del comportamiento. Nuestros profesionales utilizan herramientas terapéuticas basadas en evidencia para ayudarte a procesar situaciones de duelo, mejorar tu inteligencia emocional y fortalecer tu resiliencia ante los desafíos cotidianos de la vida personal y laboral.",
      whenToGo: ["Ansiedad o estrés persistente", "Dificultad para manejar emociones", "Problemas en relaciones interpersonales", "Duelos o pérdidas difíciles", "Deseo de autoconocimiento y crecimiento"],
      importance: "Cuidar la mente es tan vital como el cuerpo; un bienestar emocional sólido mejora la calidad de vida, la productividad y la salud física general.",
      img: require('./assets/imagenes/Psicologia.png') 
    },
    { 
      icon: "favorite-border", 
      title: "Cardiología", 
      sub: "Corazón y sistema circulatorio", 
      count: "Disponibilidad variable", 
      context: "Especialistas en el cuidado y prevención cardíaca.", 
      detailedInfo: "Nuestra área de cardiología se centra en la prevención, diagnóstico y tratamiento de patologías del corazón y del sistema circulatorio. Brindamos seguimiento especializado para la hipertensión arterial, arritmias y prevención de infartos, utilizando la telemedicina para monitorear factores de riesgo y ajustar tratamientos de forma oportuna y precisa.",
      whenToGo: ["Dolor o presión en el pecho", "Palpitaciones o ritmo cardíaco irregular", "Fatiga extrema al realizar esfuerzo", "Antecedentes familiares de cardiopatías", "Control de presión arterial elevada"],
      importance: "Las enfermedades cardiovasculares son la principal causa de riesgo global; su detección temprana es la herramienta más poderosa para salvar vidas.",
      img: require('./assets/imagenes/Cardiologia.png') 
    },
    { 
      icon: "face", 
      title: "Dermatología", 
      sub: "Cuidado de la piel y cabello", 
      count: "Disponibilidad variable", 
      context: "Diagnóstico y tratamiento para la salud de la piel.", 
      detailedInfo: "La dermatología en nuestra plataforma abarca desde el tratamiento del acné y dermatitis hasta el monitoreo de lesiones cutáneas sospechosas. Los especialistas evalúan la salud de la piel, el cabello y las uñas bajo un enfoque clínico integral, proporcionando regímenes de cuidado personalizados para mantener la barrera cutánea sana y detectar afecciones de forma precoz.",
      whenToGo: ["Cambios en forma o color de lunares", "Erupciones cutáneas persistentes", "Pérdida inusual de cabello", "Acné que no responde a cuidados básicos", "Piel extremadamente seca o irritada"],
      importance: "La piel es el órgano más extenso y nuestra primera línea de defensa; su salud refleja directamente el bienestar interno de nuestro organismo.",
      img: require('./assets/imagenes/Dermatologia.png') 
    },
    { 
      icon: "medication", 
      title: "Endocrinología", 
      sub: "Hormonas y metabolismo", 
      count: "Disponibilidad variable", 
      context: "Control de hormonas, diabetes y tiroides.", 
      detailedInfo: "Nuestros endocrinólogos se especializan en el complejo sistema hormonal que regula el metabolismo, el crecimiento y la reproducción. Ofrecemos un manejo experto de la diabetes, trastornos de la tiroides, desajustes hormonales y problemas metabólicos, enfocándonos en restaurar el equilibrio químico del cuerpo para optimizar tu energía y salud general.",
      whenToGo: ["Niveles de azúcar elevados (Diabetes)", "Problemas de tiroides conocidos", "Cambios bruscos de peso sin causa clara", "Fatiga crónica o falta de energía", "Desajustes hormonales o metabólicos"],
      importance: "El equilibrio hormonal es el regulador silencioso de casi todas las funciones vitales; su control adecuado previene enfermedades crónicas graves.",
      img: require('./assets/imagenes/Endocrinologia.png') 
    },
    { 
      icon: "pregnant-woman", 
      title: "Ginecología", 
      sub: "Salud femenina y reproductiva", 
      count: "Disponibilidad variable", 
      context: "Salud integral para la mujer en todas sus etapas.", 
      detailedInfo: "La ginecología ofrece una atención sensible y profesional para la salud reproductiva femenina en todas las etapas de la vida. Desde la adolescencia hasta la menopausia, nuestros especialistas brindan orientación en anticoncepción, manejo de trastornos menstruales y prevención de patologías mediante chequeos periódicos, asegurando un acompañamiento integral y preventivo.",
      whenToGo: ["Chequeo ginecológico preventivo anual", "Irregularidades en el ciclo menstrual", "Deseo de asesoría anticonceptiva", "Síntomas relacionados con la menopausia", "Molestias pélvicas o infecciones"],
      importance: "La prevención y el control ginecológico periódico son fundamentales para la detección temprana de enfermedades y el empoderamiento de la salud femenina.",
      img: require('./assets/imagenes/Ginecologia.png') 
    },
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
            Explora nuestra gama completa de servicios médicos. Pasa el cursor sobre cada tarjeta para conocer más detalles.
          </Text>

          <Text style={styles.sectionTitle}>Otras Especialidades</Text>
          <View style={styles.grid}>
            {otrasEspecialidades.map((esp, i) => (
              <TouchableOpacity 
                key={i} 
                style={{ width: select({ mobile: "100%", tablet: "48%", desktop: "30%" }) }}
                onPress={() => navigation.navigate('EspecialidadDetalle', { 
                  title: esp.title, 
                  description: esp.context, 
                  icon: esp.icon, 
                  image: esp.img,
                  detailedInfo: esp.detailedInfo,
                  whenToGo: esp.whenToGo,
                  importance: esp.importance
                } as any)}
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
                onPress={() => navigation.navigate('EspecialidadDetalle', { 
                  title: esp.title, 
                  description: esp.context, 
                  icon: esp.icon, 
                  image: esp.img,
                  detailedInfo: esp.detailedInfo,
                  whenToGo: esp.whenToGo,
                  importance: esp.importance
                } as any)}
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
