const fs = require("fs");
let lines = fs.readFileSync("LandingScreen.tsx", "utf8").split("\n");

// Block 1: Lines 84-97 (0-indexed 83-96)
// Remove the overlay and fix text
lines[84] = ""; // remove the overlay view
lines[88] = "                ¡TU SALUD ES NUESTRA PRIORIDAD!";
lines[91] = "                Somos líderes en atención primaria en salud. Nos enfocamos en prestar un servicio de salud integral destinado a proteger tu salud y bienestar.";

// Change text styles for readability
lines[87] = `              <Text style={{ fontSize: isDesktop ? 48 : 36, fontWeight: "900", color: colors.dark, marginBottom: 16, lineHeight: isDesktop ? 56 : 42, textShadowColor: "rgba(255,255,255,0.8)", textShadowOffset: { width: 1, height: 1 }, textShadowRadius: 10 }}>`;
lines[90] = `              <Text style={{ fontSize: isDesktop ? 18 : 16, color: colors.dark, lineHeight: 28, marginBottom: 30, fontWeight: "500", textShadowColor: "rgba(255,255,255,0.8)", textShadowOffset: { width: 1, height: 1 }, textShadowRadius: 10 }}>`;

// Block 2: Especialidades text
lines[130] = `            <Text style={{ fontSize: 24, fontWeight: "900", color: colors.dark, marginBottom: isDesktop ? 0 : 10 }}>Especialidades Médicas</Text>`;

lines[136] = `              { icon: "medical-services", title: "Medicina General", sub: "Atención primaria inicial", count: "6 médico(s) disponible(s)" },`;
lines[137] = `              { icon: "psychology", title: "Psicología", sub: "Salud mental y emocional", count: "3 médico(s) disponible(s)" },`;
lines[138] = `              { icon: "favorite-border", title: "Cardiología", sub: "Corazón y sistema circulatorio", count: "Disponibilidad variable" },`;
lines[139] = `              { icon: "face", title: "Dermatología", sub: "Cuidado de la piel y cabello", count: "Disponibilidad variable" },`;
lines[140] = `              { icon: "medication", title: "Endocrinología", sub: "Hormonas y metabolismo", count: "Disponibilidad variable" },`;
lines[141] = `              { icon: "pregnant-woman", title: "Ginecología", sub: "Salud femenina y reproductiva", count: "Disponibilidad variable" },`;
lines[142] = `              { icon: "monitor-heart", title: "Medicina Interna", sub: "Consulta médica especializada", count: "Disponibilidad variable" },`;
lines[143] = `              { icon: "restaurant", title: "Nutrición", sub: "Dieta y bienestar alimenticio", count: "Disponibilidad variable" },`;
lines[144] = `              { icon: "sentiment-satisfied", title: "Odontología", sub: "Salud oral y dental", count: "Disponibilidad variable" },`;
lines[145] = `              { icon: "child-care", title: "Pediatría", sub: "Atención integral para niños", count: "Disponibilidad variable" },`;
lines[146] = `              { icon: "accessible-forward", title: "Reumatología", sub: "Consulta médica especializada", count: "Disponibilidad variable" },`;
lines[147] = `              { icon: "transgender", title: "Sexología", sub: "Consulta médica especializada", count: "Disponibilidad variable" },`;

// Block 3: Nosotros
lines[169] = `              VIREM nace con la misión de democratizar y facilitar el acceso a la salud. Somos un equipo interdisciplinario que une la medicina y la tecnología para romper las barreras geográficas.`;
lines[172] = `              Creemos firmemente en el cuidado continuo del paciente, promoviendo espacios donde puedas encontrar desde médicos generales hasta terapeutas que guíen tu bienestar emocional.`;

// Block 4: Blog
lines[187] = `          <Text style={styles.sectionBodyCenter}>Información, consejos y noticias sobre bienestar físico y mental.</Text>`;
lines[194] = `                <Text style={{ color: colors.dark, fontSize: 18, fontWeight: "bold", marginBottom: 10 }}>Grupos de Apoyo y Psicología</Text>`;
lines[195] = `                <Text style={{ color: colors.muted, fontSize: 14 }}>Descubre cómo nuestras reuniones virtuales con especialistas están ayudando a cientos de pacientes a manejar el estrés diario.</Text>`;

lines[201] = `                <Text style={{ color: colors.muted, fontSize: 12, marginBottom: 5 }}>PREVENCIÓN</Text>`;
lines[202] = `                <Text style={{ color: colors.dark, fontSize: 18, fontWeight: "bold", marginBottom: 10 }}>La importancia del chequeo anual</Text>`;
lines[203] = `                <Text style={{ color: colors.muted, fontSize: 14 }}>Por qué no debes esperar a sentirte mal para agendar una cita con tu médico de confianza. Hábitos saludables en casa.</Text>`;

// Also fix Footer
lines[219] = `              <Text style={styles.footerColumnTitle}>SOBRE VIREM</Text>`;
lines[231] = `              <Text style={styles.footerLinkItem}>Política de Privacidad</Text>`;

fs.writeFileSync("LandingScreen.tsx", lines.join("\\n"), "utf8");
console.log("Encoding and overlay fixed");

