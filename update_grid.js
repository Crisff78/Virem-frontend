const fs = require("fs");
let code = fs.readFileSync("LandingScreen.tsx", "utf8");

// Remove the old ESPECIALIDADES block completely
const startTag = "{/* ESPECIALIDADES */}";
const endTag = "{/* NOSOTROS */}";
const startIndex = code.indexOf(startTag);
const endIndex = code.indexOf(endTag);

if (startIndex !== -1 && endIndex !== -1) {
  const oldBlock = code.substring(startIndex, endIndex);
  
  const newEspecialidadesGrid = `
        {/* ESPECIALIDADES */}
        <View onLayout={(e) => setLayoutY(prev => ({...prev, especialidades: e.nativeEvent.layout.y}))} style={[styles.servicesSection, { backgroundColor: "#fff", paddingVertical: 80 }]}>
          
          <View style={{ width: "100%", maxWidth: 1200, flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 30, paddingHorizontal: 20 }}>
            <Text style={{ fontSize: 24, fontWeight: "900", color: colors.dark }}>Especialidades Medicas</Text>
            <Text style={{ fontSize: 16, fontWeight: "800", color: colors.dark }}>12 disponibles</Text>
          </View>

          <View style={{ flexDirection: "row", flexWrap: "wrap", justifyContent: "center", gap: 30, maxWidth: 1200, paddingHorizontal: 20 }}>
            {[
              { icon: "medical-services", title: "Medicina General", sub: "Atencion primaria inicial", count: "6 medico(s) disponible(s)" },
              { icon: "psychology", title: "Psicología", sub: "Salud mental y emocional", count: "3 medico(s) disponible(s)" },
              { icon: "favorite-border", title: "Cardiología", sub: "Corazon y sistema circulatorio", count: "Disponibilidad variable" },
              { icon: "face", title: "Dermatología", sub: "Cuidado de la piel y cabello", count: "Disponibilidad variable" },
              { icon: "medication", title: "Endocrinología", sub: "Hormonas y metabolismo", count: "Disponibilidad variable" },
              { icon: "pregnant-woman", title: "Ginecología", sub: "Salud femenina y reproductiva", count: "Disponibilidad variable" },
              { icon: "monitor-heart", title: "Medicina Interna", sub: "Consulta medica especializada", count: "Disponibilidad variable" },
              { icon: "restaurant", title: "Nutrición", sub: "Dieta y bienestar alimenticio", count: "Disponibilidad variable" },
              { icon: "sentiment-satisfied", title: "Odontología", sub: "Salud oral y dental", count: "Disponibilidad variable" },
              { icon: "child-care", title: "Pediatría", sub: "Atencion integral para niños", count: "Disponibilidad variable" },
              { icon: "accessible-forward", title: "Reumatología", sub: "Consulta medica especializada", count: "Disponibilidad variable" },
              { icon: "transgender", title: "Sexología", sub: "Consulta medica especializada", count: "Disponibilidad variable" },
            ].map((esp, i) => (
              <View key={i} style={{ width: 260, alignItems: "center" }}>
                <View style={{ width: "100%", backgroundColor: "#fff", borderRadius: 20, borderWidth: 1, borderColor: "#e2e8f0", padding: 30, alignItems: "center", marginBottom: 12, shadowColor: "#000", shadowOpacity: 0.04, shadowRadius: 15, elevation: 2 }}>
                  <View style={{ width: 56, height: 56, borderRadius: 16, backgroundColor: "#EBF5FB", justifyContent: "center", alignItems: "center", marginBottom: 16 }}>
                    <MaterialIcons name={esp.icon} size={28} color={colors.primary} />
                  </View>
                  <Text style={{ fontSize: 16, fontWeight: "900", color: colors.dark, marginBottom: 6, textAlign: "center" }}>{esp.title}</Text>
                  <Text style={{ fontSize: 13, color: colors.muted, textAlign: "center" }}>{esp.sub}</Text>
                </View>
                <Text style={{ fontSize: 13, fontWeight: "800", color: colors.primary }}>{esp.count}</Text>
              </View>
            ))}
          </View>
        </View>

        `;
        
  code = code.replace(oldBlock, newEspecialidadesGrid);
  fs.writeFileSync("LandingScreen.tsx", code);
  console.log("Updated LandingScreen.tsx Especialidades grid");
} else {
  console.log("Could not find blocks");
}

