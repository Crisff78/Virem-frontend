const fs = require("fs");
let code = fs.readFileSync("LandingScreen.tsx", "utf8");

code = code.replace(
  "const navigateToRegister = () => navigation.navigate('SeleccionPerfil');",
  \`const navigateToPatient = () => navigation.navigate("RegistroPaciente");
  const navigateToDoctor = () => navigation.navigate("RegistroMedico");\`
);

const newButtons = \`
          <TouchableOpacity style={styles.navLink} onPress={navigateToLogin}>
            <Text style={styles.navLinkText}>Iniciar Sesión</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.navBtn, { backgroundColor: colors.green, marginRight: 8 }]} onPress={navigateToPatient}>
            <Text style={styles.navBtnText}>Empezar como paciente</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.navBtn} onPress={navigateToDoctor}>
            <Text style={styles.navBtnText}>Soy especialista</Text>
          </TouchableOpacity>
\`;

code = code.replace(
  /<View style=\{styles\.navRight\}>[\s\S]*?<\/View>/,
  \`<View style={styles.navRight}>\${newButtons}</View>\`
);

const newHeroAction = \`
            <View style={{ flexDirection: "row", gap: 12, flexWrap: "wrap" }}>
              <TouchableOpacity style={[styles.heroActionBtn, { backgroundColor: colors.green }]} onPress={navigateToPatient}>
                <Text style={styles.heroActionBtnText}>Empezar como paciente</Text>
                <MaterialIcons name="arrow-forward" size={20} color={colors.white} />
              </TouchableOpacity>
              <TouchableOpacity style={styles.heroActionBtn} onPress={navigateToDoctor}>
                <Text style={styles.heroActionBtnText}>Soy especialista</Text>
              </TouchableOpacity>
            </View>
\`;

code = code.replace(
  /<TouchableOpacity style=\{styles\.heroActionBtn\}[\s\S]*?<\/TouchableOpacity>/,
  newHeroAction
);

fs.writeFileSync("LandingScreen.tsx", code);
console.log("Updated LandingScreen.tsx");

