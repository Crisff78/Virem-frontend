const fs = require("fs");
let code = fs.readFileSync("PacienteConfiguracionScreen.tsx", "utf8");

// We need to inject useTheme
const themeImport = `import { useTheme } from "./providers/ThemeContext";\n`;

code = code.replace("import MaterialIcons from", themeImport + "import MaterialIcons from");

const logicReplace = `
  const { t, tx } = useLanguage();
  const { theme, toggleTheme, colors: themeColors } = useTheme();
`;

code = code.replace("const { t, tx } = useLanguage();", logicReplace);

const uiReplace = `
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Apariencia</Text>
          <View style={styles.card}>
            <View style={styles.optionRow}>
              <View style={styles.optionLeft}>
                <MaterialIcons name="dark-mode" size={24} color={colors.primary} />
                <View style={styles.optionText}>
                  <Text style={styles.optionTitle}>Modo Oscuro</Text>
                  <Text style={styles.optionSub}>Actualmente: {theme}</Text>
                </View>
              </View>
              <TouchableOpacity onPress={toggleTheme} style={{ padding: 10, backgroundColor: colors.bg, borderRadius: 8 }}>
                <Text style={{color: colors.primary, fontWeight: "bold"}}>Cambiar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
`;

code = code.replace("<View style={styles.section}>\n          <Text style={styles.sectionTitle}>", uiReplace);

fs.writeFileSync("PacienteConfiguracionScreen.tsx", code);
console.log("Updated PacienteConfiguracionScreen.tsx");

