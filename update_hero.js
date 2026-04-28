const fs = require("fs");
let code = fs.readFileSync("LandingScreen.tsx", "utf8");

const heroRegex = /\{\/\* HERO SECTION \*\/\}[\s\S]*?\{\/\* HOW IT WORKS \*\/\}/;

const newHero = `{/* HERO SECTION */}
        <View style={{ width: "100%", minHeight: isDesktop ? 600 : 400 }}>
          <ImageBackground 
            source={EquipoVirem} 
            style={{ width: "100%", height: "100%", justifyContent: "center" }}
            imageStyle={{ resizeMode: "cover" }}
          >
            {/* Overlay gradient/color for text readability */}
            <View style={{ position: "absolute", top: 0, left: 0, bottom: 0, width: isDesktop ? "50%" : "100%", backgroundColor: "rgba(255, 255, 255, 0.85)", zIndex: 1 }} />
            
            <View style={{ zIndex: 2, paddingHorizontal: isDesktop ? 80 : 24, paddingVertical: 40, width: isDesktop ? "55%" : "100%" }}>
              <Text style={{ fontSize: isDesktop ? 48 : 36, fontWeight: "900", color: colors.dark, marginBottom: 16, lineHeight: isDesktop ? 56 : 42 }}>
                ¡TU SALUD ES NUESTRA PRIORIDAD!
              </Text>
              <Text style={{ fontSize: isDesktop ? 18 : 16, color: colors.muted, lineHeight: 28, marginBottom: 30, fontWeight: "400" }}>
                Somos líderes en atención primaria en salud. Nos enfocamos en prestar un servicio de salud integral destinado a proteger tu salud y bienestar.
              </Text>
              <TouchableOpacity style={styles.heroActionBtn} onPress={navigateToRegister}>
                <Text style={styles.heroActionBtnText}>AGENDA UNA CITA</Text>
              </TouchableOpacity>
            </View>
          </ImageBackground>
        </View>

        {/* HOW IT WORKS */}`;

if (heroRegex.test(code)) {
  code = code.replace(heroRegex, newHero);
  fs.writeFileSync("LandingScreen.tsx", code);
  console.log("Updated Hero Section");
} else {
  console.log("Regex did not match.");
}

