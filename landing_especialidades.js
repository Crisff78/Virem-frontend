const fs = require("fs");
let code = fs.readFileSync("LandingScreen.tsx", "utf8");

const oldEspecialidades = /{*[/\*]* ESPECIALIDADES [/\*]*}\n[\s\S]*?{*[/\*]* NOSOTROS [/\*]*}/;

const newEspecialidades = `
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
              En VIREM, nos enorgullece contar con un equipo diverso de especialistas altamente capacitados. Nuestro objetivo principal es brindarte una atención médica de calidad que garantice tu bienestar integral.
            </Text>
          </ImageBackground>

          <View style={{ padding: 40, alignItems: "center" }}>
            <View style={{ flexDirection: "row", flexWrap: "wrap", justifyContent: "center", gap: 30, maxWidth: 1200, marginTop: -60 }}>
              
              {/* CARD 1 */}
              <View style={styles.espCard}>
                <View style={styles.espIconWrap}>
                  <MaterialIcons name="favorite" size={32} color="#fff" />
                </View>
                <Text style={styles.espCardTitle}>CARDIOLOGÍA</Text>
                <Text style={styles.espCardDesc}>
                  La cardiología es una rama de la medicina que se especializa en el diagnóstico, tratamiento y prevención de enfermedades del corazón y los vasos sanguíneos.
                </Text>
                <TouchableOpacity style={styles.espBtn} onPress={navigateToRegister}>
                  <Text style={styles.espBtnText}>VER MÁS</Text>
                </TouchableOpacity>
              </View>

              {/* CARD 2 */}
              <View style={styles.espCard}>
                <View style={styles.espIconWrap}>
                  <MaterialIcons name="healing" size={32} color="#fff" />
                </View>
                <Text style={styles.espCardTitle}>CIRUGÍA GENERAL</Text>
                <Text style={styles.espCardDesc}>
                  La especialidad en cirugía general se enfoca en el diagnóstico y tratamiento quirúrgico de diversas enfermedades, principalmente del sistema digestivo y abdomen.
                </Text>
                <TouchableOpacity style={styles.espBtn} onPress={navigateToRegister}>
                  <Text style={styles.espBtnText}>VER MÁS</Text>
                </TouchableOpacity>
              </View>

              {/* CARD 3 */}
              <View style={styles.espCard}>
                <View style={styles.espIconWrap}>
                  <MaterialIcons name="face-retouching-natural" size={32} color="#fff" />
                </View>
                <Text style={styles.espCardTitle}>DERMATOLOGÍA</Text>
                <Text style={styles.espCardDesc}>
                  La dermatología es una especialidad médica dedicada al estudio, diagnóstico y tratamiento de enfermedades y condiciones de la piel, cabello y uñas.
                </Text>
                <TouchableOpacity style={styles.espBtn} onPress={navigateToRegister}>
                  <Text style={styles.espBtnText}>VER MÁS</Text>
                </TouchableOpacity>
              </View>

              {/* CARD 4 */}
              <View style={styles.espCard}>
                <View style={styles.espIconWrap}>
                  <MaterialIcons name="bloodtype" size={32} color="#fff" />
                </View>
                <Text style={styles.espCardTitle}>DIABETOLOGÍA</Text>
                <Text style={styles.espCardDesc}>
                  Especialidad médica dedicada al cuidado y tratamiento integral de la diabetes. Nuestro equipo de especialistas te ayudará a mantener el control adecuado.
                </Text>
                <TouchableOpacity style={styles.espBtn} onPress={navigateToRegister}>
                  <Text style={styles.espBtnText}>VER MÁS</Text>
                </TouchableOpacity>
              </View>

              {/* CARD 5 */}
              <View style={styles.espCard}>
                <View style={styles.espIconWrap}>
                  <MaterialIcons name="local-hospital" size={32} color="#fff" />
                </View>
                <Text style={styles.espCardTitle}>GASTROENTEROLOGÍA</Text>
                <Text style={styles.espCardDesc}>
                  Se centra en el estudio, diagnóstico y tratamiento de trastornos y enfermedades del sistema digestivo, hígado, páncreas y vías biliares.
                </Text>
                <TouchableOpacity style={styles.espBtn} onPress={navigateToRegister}>
                  <Text style={styles.espBtnText}>VER MÁS</Text>
                </TouchableOpacity>
              </View>

              {/* CARD 6 */}
              <View style={styles.espCard}>
                <View style={styles.espIconWrap}>
                  <MaterialIcons name="elderly" size={32} color="#fff" />
                </View>
                <Text style={styles.espCardTitle}>GERIATRÍA</Text>
                <Text style={styles.espCardDesc}>
                  Especialidad de la medicina que se enfoca en el estudio, diagnóstico, tratamiento y cuidado de las personas mayores de edad, asegurando su calidad de vida.
                </Text>
                <TouchableOpacity style={styles.espBtn} onPress={navigateToRegister}>
                  <Text style={styles.espBtnText}>VER MÁS</Text>
                </TouchableOpacity>
              </View>

            </View>
          </View>
        </View>

        {/* NOSOTROS */}
`;

code = code.replace(oldEspecialidades, newEspecialidades);

const newStyles = `
  espCard: { backgroundColor: "#fff", borderRadius: 16, padding: 24, paddingTop: 40, width: 320, alignItems: "center", shadowColor: "#000", shadowOpacity: 0.1, shadowRadius: 10, elevation: 4, position: "relative", marginTop: 40, marginBottom: 20 },
  espIconWrap: { width: 60, height: 60, borderRadius: 30, backgroundColor: colors.primary, alignItems: "center", justifyContent: "center", position: "absolute", top: -30, borderWidth: 4, borderColor: "#fff" },
  espCardTitle: { fontSize: 16, fontWeight: "700", color: colors.primary, marginBottom: 12 },
  espCardDesc: { fontSize: 14, color: colors.muted, textAlign: "center", lineHeight: 22, flex: 1, minHeight: 90 },
  espBtn: { backgroundColor: colors.primary, paddingHorizontal: 24, paddingVertical: 10, borderRadius: 8, marginTop: 16 },
  espBtnText: { color: "#fff", fontWeight: "700", fontSize: 14 },
`;

code = code.replace("  // SERVICES", newStyles + "\n  // SERVICES");

fs.writeFileSync("LandingScreen.tsx", code);
console.log("Updated LandingScreen.tsx with new Especialidades grid");

