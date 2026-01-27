import React, { useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Image,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "./App";

// ✅ Tipado navegación
type NavigationProps = NativeStackNavigationProp<RootStackParamList, "RegistroMedico">;

interface CountryCodeType {
  code: string;
  name: string;
  mask: string;
}

const { width } = Dimensions.get("window");

// ✅ Logo (si lo usas)
const ViremLogo = require("./assets/imagenes/descarga.png");

// ✅ Prefijos + máscara (igual que en paciente)
const countryCodes: CountryCodeType[] = [
  { code: "+1", name: "República Dominicana", mask: "XXX XXX XXXX" },
  { code: "+593", name: "Ecuador", mask: "XX XXX XXXX" },
  { code: "+1", name: "USA/CAN", mask: "XXX XXX XXXX" },
  { code: "+506", name: "Costa Rica", mask: "XXXX XXXX" },
  { code: "+34", name: "España", mask: "XXX XX XX XX" },
];

// ✅ Especialidades
const ESPECIALIDADES = [
  "Medicina General",
  "Psicología",
  "Psiquiatría",
  "Ginecología",
  "Pediatría",
  "Cardiología",
  "Dermatología",
  "Odontología",
  "Nutrición",
  "Neurología",
  "Neumología",
  "Infectología",
  "Endocrinología",
  "Reumatología",
  "Medicina Familiar",
];

// ===============================
// 🔌 BACKEND_URL
// ===============================
const BACKEND_URL = "http://localhost:3000";

// =========================================
// VALIDACIÓN: Cédula Dominicana (igual que paciente)
// =========================================
const validarCedulaDominicana = (cedula: string) => {
  const c = cedula.replace(/\D/g, "");
  if (c.length !== 11) return false;

  let suma = 0;
  const multiplicadores = [1, 2, 1, 2, 1, 2, 1, 2, 1, 2];
  for (let i = 0; i < 10; i++) {
    let n = parseInt(c[i]) * multiplicadores[i];
    if (n >= 10) n = Math.floor(n / 10) + (n % 10);
    suma += n;
  }
  const digitoVerificador = (10 - (suma % 10)) % 10;
  return digitoVerificador === parseInt(c[10]);
};

// =========================================
// FORMATO: Cédula RD XXX-XXXXXXX-X (igual)
// =========================================
const formatCedulaRD = (text: string) => {
  const digits = text.replace(/\D/g, "").slice(0, 11);
  const p1 = digits.slice(0, 3);
  const p2 = digits.slice(3, 10);
  const p3 = digits.slice(10, 11);

  if (digits.length <= 3) return p1;
  if (digits.length <= 10) return `${p1}-${p2}`;
  return `${p1}-${p2}-${p3}`;
};

// =========================================
// MÁSCARA TELÉFONO (igual que paciente)
// =========================================
const applyPhoneMask = (text: string, mask: string) => {
  const digits = text.replace(/\D/g, "");
  let formatted = "";
  let digitIndex = 0;

  for (let i = 0; i < mask.length && digitIndex < digits.length; i++) {
    if (mask[i] === "X") {
      formatted += digits[digitIndex];
      digitIndex++;
    } else {
      formatted += mask[i];
    }
  }

  return formatted;
};

// =========================================
// API VALIDAR TELÉFONO (igual que paciente)
// =========================================
type ValidacionTelefonoBackendResult =
  | { ok: true; meta?: any }
  | { ok: false; reason: string };

const validarTelefonoBackend = async (
  countryCode: string,
  phoneFormatted: string
): Promise<ValidacionTelefonoBackendResult> => {
  try {
    const digits = phoneFormatted.replace(/\D/g, "");

    const res = await fetch(`${BACKEND_URL}/validar-telefono`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ countryCode, phone: digits }),
    });

    const data = await res.json().catch(() => null);

    if (!res.ok || !data?.success) {
      return { ok: false, reason: data?.message || `No se pudo validar (HTTP ${res.status}).` };
    }

    if (!data.valid) {
      return { ok: false, reason: "El número no es válido según Veriphone." };
    }

    return { ok: true, meta: data };
  } catch {
    return { ok: false, reason: "Error de red: no se pudo conectar con el backend." };
  }
};

const colors = {
  primary: "#137fec",
  disabled: "#cbd5e1",
  backgroundLight: "#F6FAFD",
  navyDark: "#0A1931",
  navyMedium: "#1A3D63",
  blueGray: "#4A7FA7",
  white: "#FFFFFF",
  slate50: "#f8fafc",
  soft: "#B3CFE5",
  error: "#FF0000",
};

export default function RegistroMedicoScreen() {

  const navigation = useNavigation<NavigationProps>();

  const [fotoUri, setFotoUri] = useState<string | null>(null);

  const [nombres, setNombres] = useState("");
  const [apellidos, setApellidos] = useState("");

  const [especialidad, setEspecialidad] = useState("");
  const [espQuery, setEspQuery] = useState("");
  const [showEspModal, setShowEspModal] = useState(false);

  // ✅ Cedula + validación
  const [cedula, setCedula] = useState("");
  const [cedulaError, setCedulaError] = useState(false);

  // ✅ Teléfono con prefijo + validación
  const [selectedCountryCode, setSelectedCountryCode] = useState<CountryCodeType>(countryCodes[0]);
  const [telefono, setTelefono] = useState("");
  const [telefonoError, setTelefonoError] = useState<string>("");

  const [showPrefixModal, setShowPrefixModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showErrors, setShowErrors] = useState(false);

  const especialidadesFiltradas = useMemo(() => {
    const q = espQuery.trim().toLowerCase();
    if (!q) return ESPECIALIDADES;
    return ESPECIALIDADES.filter((e) => e.toLowerCase().includes(q));
  }, [espQuery]);

  const pickImage = async () => {
    try {
      if (Platform.OS !== "web") {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== "granted") {
          Alert.alert("Permiso requerido", "Necesitamos permiso para acceder a tus fotos.");
          return;
        }
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.85,
      });

      if (!result.canceled) {
        setFotoUri(result.assets[0].uri);
      }
    } catch {
      Alert.alert("Error", "No se pudo abrir el selector de imágenes.");
    }
  };

  const isFormComplete =
    nombres.trim() !== "" &&
    apellidos.trim() !== "" &&
    especialidad.trim() !== "" &&
    cedula.trim() !== "" &&
    telefono.trim() !== "";

  const handleContinue = async () => {
    setShowErrors(true);
    setCedulaError(false);
    setTelefonoError("");

    if (!isFormComplete) {
      Alert.alert("Acción Requerida", "Debe completar todos los campos.");
      return;
    }

    // ✅ Validar cédula dominicana SOLO si el país es RD
    if (selectedCountryCode.name === "República Dominicana") {
      setIsLoading(true);
      await new Promise((r) => setTimeout(r, 250));
      const ok = validarCedulaDominicana(cedula);
      setIsLoading(false);

      if (!ok) {
        setCedulaError(true);
        Alert.alert("Cédula Inválida", "El número de cédula no es válido.");
        return;
      }
    }

    // ✅ Validar teléfono con backend
    setIsLoading(true);
    const tel = await validarTelefonoBackend(selectedCountryCode.code, telefono);
    setIsLoading(false);

    if (!tel.ok) {
      setTelefonoError(tel.reason);
      Alert.alert("Teléfono inválido", tel.reason);
      return;
    }

    // ✅ Ok → pasar a credenciales
    navigation.navigate("RegistroCredenciales", {
      datosPersonales: {
        nombres: nombres.trim(),
        apellidos: apellidos.trim(),
        especialidad: especialidad.trim(),
        cedula: cedula, // con guiones
        telefono: `${selectedCountryCode.code} ${telefono}`,
      },
    });
  };

  return (
    <View style={styles.mainWrapper}>
      {/* Header simple */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <View style={styles.logoGroup}>
            <Image source={ViremLogo} style={styles.logoImage} />
            <Text style={styles.logoText}>VIREM</Text>
          </View>
        </View>
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 40 }} keyboardShouldPersistTaps="handled">
        <View style={styles.contentWrapper}>
          <Text style={styles.title}>Registro de Médico</Text>
          <Text style={styles.subtitle}>Datos Profesionales</Text>

          <View style={styles.card}>
            {/* Foto */}
            <TouchableOpacity style={styles.photoBtn} onPress={pickImage} activeOpacity={0.85}>
              <MaterialIcons name="photo-camera" size={18} color={colors.blueGray} />
              <Text style={styles.photoBtnText}>{fotoUri ? "Cambiar Foto" : "Subir Foto"}</Text>
            </TouchableOpacity>

            {/* Nombres */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Nombres</Text>
              <TextInput
                style={[styles.input, showErrors && !nombres && styles.inputError]}
                placeholder="Ej. Juan Manuel"
                placeholderTextColor="#94a3b8"
                value={nombres}
                onChangeText={setNombres}
              />
            </View>

            {/* Apellidos */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Apellidos</Text>
              <TextInput
                style={[styles.input, showErrors && !apellidos && styles.inputError]}
                placeholder="Ej. Pérez García"
                placeholderTextColor="#94a3b8"
                value={apellidos}
                onChangeText={setApellidos}
              />
            </View>

            {/* Especialidad (Modal + buscador) */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Especialidad</Text>

              <TouchableOpacity
                style={[styles.selectBox, showErrors && !especialidad && styles.inputError]}
                onPress={() => setShowEspModal(true)}
                activeOpacity={0.85}
              >
                <MaterialIcons name="local-hospital" size={18} color={colors.blueGray} />
                <Text style={[styles.selectText, !especialidad && { color: "#94a3b8" }]}>
                  {especialidad || "Selecciona tu especialidad"}
                </Text>
                <MaterialIcons name="expand-more" size={22} color={colors.blueGray} />
              </TouchableOpacity>
            </View>

            {/* Cédula + validación (igual que paciente) */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Cédula</Text>
              <TextInput
                style={[styles.input, ((showErrors && !cedula) || cedulaError) && styles.inputError]}
                placeholder="XXX-XXXXXXX-X"
                placeholderTextColor="#94a3b8"
                keyboardType="numeric"
                value={cedula}
                onChangeText={(t) => {
                  setCedula(formatCedulaRD(t));
                  setCedulaError(false);
                }}
                maxLength={13}
              />
              {cedulaError ? <Text style={styles.errorText}>Cédula no válida</Text> : null}
            </View>

            {/* Teléfono con prefijo + modal scroll (igual que paciente) */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Teléfono</Text>

              <View style={[styles.phoneInputGroup, (showErrors && !telefono) && styles.inputError]}>
                <TouchableOpacity style={styles.prefixButton} onPress={() => setShowPrefixModal(true)} activeOpacity={0.85}>
                  <Text style={styles.prefixText}>{selectedCountryCode.code}</Text>
                </TouchableOpacity>

                <TextInput
                  style={styles.numberInput}
                  placeholder={selectedCountryCode.mask}
                  placeholderTextColor="#94a3b8"
                  keyboardType="phone-pad"
                  value={telefono}
                  maxLength={selectedCountryCode.mask.length}
                  onChangeText={(text) => {
                    setTelefono(applyPhoneMask(text, selectedCountryCode.mask));
                    setTelefonoError("");
                  }}
                />
              </View>

              {!!telefonoError ? <Text style={styles.errorText}>{telefonoError}</Text> : null}
            </View>

            <TouchableOpacity
              style={[styles.btnPrimary, { backgroundColor: isFormComplete ? colors.primary : colors.disabled }]}
              onPress={handleContinue}
              disabled={isLoading}
              activeOpacity={0.85}
            >
              {isLoading ? (
                <ActivityIndicator color="white" />
              ) : (
                <>
                  <Text style={styles.btnPrimaryText}>Continuar Registro</Text>
                  <MaterialIcons name="arrow-forward" size={20} color="white" />
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      {/* MODAL ESPECIALIDADES */}
      <Modal visible={showEspModal} transparent animationType="fade">
        <TouchableOpacity
          style={styles.modalOverlay}
          onPress={() => {
            setShowEspModal(false);
            setEspQuery("");
          }}
          activeOpacity={1}
        >
          <View style={styles.modalContent}>
            <View style={styles.searchBox}>
              <MaterialIcons name="search" size={18} color={colors.blueGray} />
              <TextInput
                style={styles.searchInput}
                placeholder="Buscar especialidad..."
                placeholderTextColor="#94a3b8"
                value={espQuery}
                onChangeText={setEspQuery}
                autoFocus
              />
              {espQuery.length > 0 ? (
                <TouchableOpacity onPress={() => setEspQuery("")} hitSlop={10}>
                  <MaterialIcons name="close" size={18} color={colors.blueGray} />
                </TouchableOpacity>
              ) : null}
            </View>

            <ScrollView style={{ maxHeight: 260 }} keyboardShouldPersistTaps="handled">
              {especialidadesFiltradas.map((esp) => (
                <TouchableOpacity
                  key={esp}
                  style={styles.modalOptionRow}
                  onPress={() => {
                    setEspecialidad(esp);
                    setShowEspModal(false);
                    setEspQuery("");
                  }}
                >
                  <Text style={styles.modalOptionText2}>{esp}</Text>
                  {especialidad === esp ? <MaterialIcons name="check" size={18} color={colors.primary} /> : null}
                </TouchableOpacity>
              ))}

              {especialidadesFiltradas.length === 0 ? (
                <View style={{ padding: 14 }}>
                  <Text style={{ color: colors.blueGray, fontWeight: "600" }}>No hay resultados.</Text>
                </View>
              ) : null}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* MODAL PREFIJOS (scroll igual que paciente) */}
      <Modal visible={showPrefixModal} transparent animationType="fade">
        <TouchableOpacity style={styles.modalOverlay} onPress={() => setShowPrefixModal(false)} activeOpacity={1}>
          <View style={styles.modalContent}>
            <ScrollView keyboardShouldPersistTaps="handled">
              {countryCodes.map((c, i) => (
                <TouchableOpacity
                  key={i}
                  style={styles.modalOption}
                  onPress={() => {
                    setSelectedCountryCode(c);
                    setTelefono("");
                    setTelefonoError("");
                    setShowPrefixModal(false);
                  }}
                >
                  <Text style={styles.modalOptionText}>{c.code} ({c.name})</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  mainWrapper: { flex: 1, backgroundColor: colors.backgroundLight },

  header: {
    height: 70,
    backgroundColor: "white",
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
    justifyContent: "center",
    paddingHorizontal: 20,
  },
  headerContent: { flexDirection: "row", alignItems: "center" },
  logoGroup: { flexDirection: "row", alignItems: "center", gap: 10 },
  logoImage: { width: 42, height: 42, resizeMode: "contain", borderRadius: 10 },
  logoText: { fontSize: 22, fontWeight: "bold", color: colors.navyDark },

  contentWrapper: { padding: 20, maxWidth: 520, alignSelf: "center", width: "100%" },

  title: { fontSize: 26, fontWeight: "900", color: colors.navyDark, textAlign: "center", marginTop: 10 },
  subtitle: { fontSize: 16, fontWeight: "600", color: colors.blueGray, textAlign: "center", marginTop: 6, marginBottom: 18 },

  card: {
    backgroundColor: "white",
    borderRadius: 20,
    padding: 22,
    elevation: 5,
    borderWidth: 1,
    borderColor: colors.soft + "44",
  },

  photoBtn: {
    alignSelf: "center",
    flexDirection: "row",
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 12,
    backgroundColor: colors.slate50,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    marginBottom: 16,
  },
  photoBtnText: { fontWeight: "800", color: colors.blueGray },

  inputGroup: { marginBottom: 16 },
  label: { fontSize: 13, fontWeight: "700", color: colors.navyDark, marginBottom: 8 },

  input: {
    height: 50,
    borderWidth: 1,
    borderColor: "#cbd5e1",
    borderRadius: 10,
    paddingHorizontal: 12,
    backgroundColor: colors.slate50,
    color: colors.navyDark,
    fontWeight: "600",
  },

  inputError: { borderColor: colors.error, borderWidth: 1.5 },
  errorText: { color: colors.error, fontSize: 12, marginTop: 6, fontWeight: "600" },

  selectBox: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#cbd5e1",
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 50,
    backgroundColor: colors.slate50,
    gap: 10,
  },
  selectText: { flex: 1, color: colors.navyDark, fontWeight: "700" },

  // ✅ Teléfono con prefijo (igual que paciente)
  phoneInputGroup: {
    flexDirection: "row",
    height: 50,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#cbd5e1",
    backgroundColor: colors.slate50,
    overflow: "hidden",
  },
  prefixButton: {
    width: width > 768 ? 90 : 70,
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
    borderRightWidth: 1,
    borderRightColor: "#cbd5e1",
  },
  prefixText: { color: colors.navyDark, fontSize: 14, fontWeight: "bold" },
  numberInput: { flex: 1, paddingHorizontal: 12, fontSize: 16, color: colors.navyDark, fontWeight: "600" },

  btnPrimary: {
    height: 55,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    flexDirection: "row",
    gap: 10,
    marginTop: 6,
  },
  btnPrimaryText: { color: "white", fontSize: 16, fontWeight: "bold" },

  // ✅ Modales
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "center", alignItems: "center", padding: 16 },
  modalContent: { backgroundColor: "white", borderRadius: 12, padding: 16, width: "100%", maxWidth: 420, elevation: 6 },

  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 12,
    height: 46,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 10,
    marginBottom: 12,
  },
  searchInput: { flex: 1, color: colors.navyDark, fontWeight: "600" },

  modalOption: {
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderRadius: 10,
    marginBottom: 8,
    backgroundColor: colors.slate50,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  modalOptionText: { fontSize: 15, color: colors.navyDark, textAlign: "center", fontWeight: "700" },

  modalOptionRow: {
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  modalOptionText2: { fontSize: 15, color: colors.navyDark, fontWeight: "700" },
});
