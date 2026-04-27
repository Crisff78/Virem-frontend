const fs = require("fs");
let code = fs.readFileSync("LandingScreen.tsx", "utf8");

// Update Layout State
code = code.replace(
  "const [layoutY, setLayoutY] = useState({ plataforma: 0, especialidades: 0, contacto: 0 });",
  "const [layoutY, setLayoutY] = useState({ plataforma: 0, especialidades: 0, nosotros: 0, blog: 0, contacto: 0 });"
);

// Update Nav Links
const newNavLinks = `          <View style={styles.navLinksCenter}>
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
          </View>`;

code = code.replace(/<View style=\{styles\.navLinksCenter\}>[\s\S]*?<\/View>/, newNavLinks);

// Add the new sections right before Footer
const newSections = `
        {/* ESPECIALIDADES */}
        <View onLayout={(e) => setLayoutY(prev => ({...prev, especialidades: e.nativeEvent.layout.y}))} style={[styles.servicesSection, { backgroundColor: '#EBF5FB' }]}>
          <Text style={styles.sectionHeadingCenter}>NUESTRAS ESPECIALIDADES</Text>
          <Text style={styles.sectionBodyCenter}>Contamos con profesionales altamente capacitados en las áreas más demandadas.</Text>
          <View style={[styles.cardsGrid, isDesktop && styles.cardsGridDesktop, { flexWrap: 'wrap' }]}>
            <View style={[styles.serviceCard, { minWidth: 250, padding: 20, alignItems: 'center' }]}>
              <MaterialIcons name="psychology" size={48} color={colors.primary} />
              <Text style={[styles.cardHeaderText, { color: colors.dark, marginTop: 10 }]}>Psicología</Text>
            </View>
            <View style={[styles.serviceCard, { minWidth: 250, padding: 20, alignItems: 'center' }]}>
              <MaterialIcons name="favorite" size={48} color={colors.primary} />
              <Text style={[styles.cardHeaderText, { color: colors.dark, marginTop: 10 }]}>Cardiología</Text>
            </View>
            <View style={[styles.serviceCard, { minWidth: 250, padding: 20, alignItems: 'center' }]}>
              <MaterialIcons name="child-care" size={48} color={colors.primary} />
              <Text style={[styles.cardHeaderText, { color: colors.dark, marginTop: 10 }]}>Pediatría</Text>
            </View>
            <View style={[styles.serviceCard, { minWidth: 250, padding: 20, alignItems: 'center' }]}>
              <MaterialIcons name="medical-services" size={48} color={colors.primary} />
              <Text style={[styles.cardHeaderText, { color: colors.dark, marginTop: 10 }]}>Medicina General</Text>
            </View>
          </View>
        </View>

        {/* NOSOTROS */}
        <View onLayout={(e) => setLayoutY(prev => ({...prev, nosotros: e.nativeEvent.layout.y}))} style={[styles.howItWorksSection, isDesktop && styles.howItWorksDesktop]}>
          <View style={[styles.howItWorksTextContainer, isDesktop && { paddingRight: 60 }]}>
            <Text style={styles.sectionHeadingLeft}>SOBRE NOSOTROS</Text>
            <Text style={styles.sectionBodyLeft}>
              VIREM nace con la misión de democratizar y facilitar el acceso a la salud. Somos un equipo interdisciplinario que une la medicina y la tecnología para romper las barreras geográficas.
            </Text>
            <Text style={styles.sectionBodyLeft}>
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
          
          <View style={[styles.cardsGrid, isDesktop && styles.cardsGridDesktop]}>
            <View style={styles.serviceCard}>
              <Image source={{ uri: 'https://images.unsplash.com/photo-1527689368864-3a821dbccc34?q=80&w=400&auto=format&fit=crop' }} style={styles.cardImage} />
              <View style={{ padding: 20 }}>
                <Text style={{ color: colors.muted, fontSize: 12, marginBottom: 5 }}>SALUD MENTAL</Text>
                <Text style={{ color: colors.dark, fontSize: 18, fontWeight: 'bold', marginBottom: 10 }}>Grupos de Apoyo y Psicología</Text>
                <Text style={{ color: colors.muted, fontSize: 14 }}>Descubre cómo nuestras reuniones virtuales con especialistas están ayudando a cientos de pacientes a manejar el estrés diario.</Text>
              </View>
            </View>
            <View style={styles.serviceCard}>
              <Image source={{ uri: 'https://images.unsplash.com/photo-1434493789847-2f02dc6ca35d?q=80&w=400&auto=format&fit=crop' }} style={styles.cardImage} />
              <View style={{ padding: 20 }}>
                <Text style={{ color: colors.muted, fontSize: 12, marginBottom: 5 }}>PREVENCIÓN</Text>
                <Text style={{ color: colors.dark, fontSize: 18, fontWeight: 'bold', marginBottom: 10 }}>La importancia del chequeo anual</Text>
                <Text style={{ color: colors.muted, fontSize: 14 }}>Por qué no debes esperar a sentirte mal para agendar una cita con tu médico de confianza. Hábitos saludables en casa.</Text>
              </View>
            </View>
          </View>
        </View>
`;

code = code.replace("{/* FOOTER */}", newSections + "\n        {/* FOOTER */}");

fs.writeFileSync("LandingScreen.tsx", code);
console.log("Updated LandingScreen.tsx with new sections");

