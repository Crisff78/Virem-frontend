const fs = require("fs");
let lines = fs.readFileSync("LandingScreen.tsx", "utf8").split("\n");

// We want to remove lines 124 to 263
const newLines = [];
let i = 0;
while (i < lines.length) {
  if (i === 123) { // 0-indexed, so line 124 is index 123
    newLines.push(`        {/* ESPECIALIDADES GRID */}
        <View onLayout={(e) => setLayoutY(prev => ({...prev, especialidades: e.nativeEvent.layout.y}))} style={[styles.servicesSection, { backgroundColor: "#F8FAFC", paddingVertical: 80, alignItems: "center", width: "100%" }]}>
          
          <View style={{ width: "100%", maxWidth: 1200, flexDirection: isDesktop ? "row" : "column", justifyContent: "space-between", alignItems: isDesktop ? "flex-end" : "flex-start", marginBottom: 40, paddingHorizontal: 20 }}>
            <Text style={{ fontSize: 24, fontWeight: "900", color: colors.dark, marginBottom: isDesktop ? 0 : 10 }}>Especialidades Medicas</Text>
            <Text style={{ fontSize: 15, fontWeight: "800", color: colors.dark }}>12 disponibles</Text>
          </View>

          <View style={{ flexDirection: "row", flexWrap: "wrap", justifyContent: "center", gap: 20, maxWidth: 1200, paddingHorizontal: 20 }}>
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
              <View key={i} style={{ width: isDesktop ? 270 : "100%", alignItems: "center", marginBottom: 10 }}>
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
        </View>`);
    i = 263; // skip to line 264 (index 263)
  } else {
    newLines.push(lines[i]);
    i++;
  }
}

fs.writeFileSync("LandingScreen.tsx", newLines.join("\n"));
console.log("Updated lines successfully.");

