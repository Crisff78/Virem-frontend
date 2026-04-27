const fs = require("fs");
let code = fs.readFileSync("PacienteRecetasDocumentosScreen.tsx", "utf8");

// We need to inject useState, useEffect for fetching recipes from the backend
const apiImport = `import { apiClient } from "./utils/api";\n`;

code = code.replace("import MaterialIcons from", apiImport + "import MaterialIcons from");

const stateLogic = `
  const [loading, setLoading] = useState(true);
  const [dbRecetas, setDbRecetas] = useState<DocumentItem[]>([]);

  useEffect(() => {
    const fetchRecetas = async () => {
      try {
        const payload = await apiClient.get<any>("/api/paciente/me/recetas", { authenticated: true });
        if (payload?.success && Array.isArray(payload.recetas)) {
          const mapped = payload.recetas.map(r => ({
            title: r.diagnostico || "Receta Médica",
            doctor: r.medico_nombre || "Médico",
            date: new Date(r.created_at).toLocaleDateString(),
            icon: "picture-as-pdf",
            tint: "#ef4444",
            bg: "#fef2f2",
            raw: JSON.stringify(r.medicamentos_json)
          }));
          setDbRecetas(mapped);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchRecetas();
  }, []);
`;

code = code.replace("const { user, loadingUser, signOut, fullName, planLabel, fotoUrl, hasProfilePhoto } = usePatientPortalSession();", "const { user, loadingUser, signOut, fullName, planLabel, fotoUrl, hasProfilePhoto } = usePatientPortalSession();\n" + stateLogic);

code = code.replace("items={recetas}", "items={dbRecetas.length > 0 ? dbRecetas : recetas}");

fs.writeFileSync("PacienteRecetasDocumentosScreen.tsx", code);
console.log("Updated PacienteRecetasDocumentosScreen.tsx");

