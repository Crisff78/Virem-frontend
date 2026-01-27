import React, { useState } from "react";
import {
  Alert,
  Dimensions,
  Image,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Pressable,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "./App";

// ✅ Tipado navegación
type NavigationProps = NativeStackNavigationProp<RootStackParamList, "RegistroMedico">;

const { width } = Dimensions.get("window");

// ✅ Logo (tu imagen)
const ViremLogo = require("./assets/imagenes/descarga.png");

const colors = {
  primary: "#137fec",
  backgroundLight: "#F6FAFD",
  navyDark: "#0A1931",
  navyMedium: "#1A3D63",
  blueGray: "#4A7FA7",
  white: "#FFFFFF",
  slate50: "#f8fafc",
  soft: "#B3CFE5",
};

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

export default function RegistroMedicoScreen() {
  const navigation = useNavigation<NavigationProps>();

  const [fotoUri, setFotoUri] = useState<string | null>(null);
  const [nombres, setNombres] = useState("");
  const [apellidos, setApellidos] = useState("");
  const [especialidad, setEspecialidad] = useState<string>("");
  const [cedula, setCedula] = useState("");
  const [telefono, setTelefono] = useState("");

  // ✅ controla el dropdown
  const [openEspecialidades, setOpenEspecialidades] = useState(false);

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

  const handleContinue = () => {
    if (!nombres.trim() || !apellidos.trim() || !especialidad || !cedula.trim() || !telefono.trim()) {
      Alert.alert("Error", "Complete todos los campos.");
      return;
    }

    navigation.navigate("RegistroCredenciales", {
      datosPersonales: {
        nombres: nombres.trim(),
        apellidos: apellidos.trim(),
        especialidad,
        cedula: cedula.trim(),
        telefono: telefono.trim(),
      },
    });
  };

  const toggleDropdown = () => setOpenEspecialidades((v) => !v);

  const selectEspecialidad = (esp: string) => {
    setEspecialidad(esp);
    setOpenEspecialidades(false);
  };

  return (
    <View style={styles.mainWrapper}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <View style={styles.logoGroup}>
            <Image source={ViremLogo} style={styles.logoImage} />
            <Text style={styles.logoText}>VIREM</Text>
          </View>

          <TouchableOpacity style={styles.helpBtn}>
            <MaterialIcons name="help-outline" size={18} color={colors.navyMedium} />
            <Text style={styles.helpText}>Ayuda</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 40 }} keyboardShouldPersistTaps="handled">
        <View style={styles.contentWrapper}>
          <Text style={styles.title}>Registro de Médico</Text>
          <Text style={styles.subtitle}>Datos Profesionales</Text>

          <View style={styles.card}>
            {/* Foto */}
            <View style={{ alignItems: "center", marginBottom: 22 }}>
              <TouchableOpacity style={styles.photoCircle} onPress={pickImage} activeOpacity={0.85}>
                {fotoUri ? (
                  <Image source={{ uri: fotoUri }} style={styles.photoPreview} />
                ) : (
                  <>
                    <MaterialIcons name="photo-camera" size={34} color={colors.blueGray} />
                    <Text style={styles.photoText}>Subir Foto</Text>
                  </>
                )}

                <View style={styles.photoAdd}>
                  <MaterialIcons name="add" size={18} color="white" />
                </View>
              </TouchableOpacity>

              <Text style={styles.photoHint}>Foto de perfil recomendada</Text>
            </View>

            {/* Inputs */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Nombres</Text>
              <TextInput
                style={styles.textInput}
                placeholder="Ej. Juan Manuel"
                placeholderTextColor="#94a3b8"
                value={nombres}
                onChangeText={setNombres}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Apellidos</Text>
              <TextInput
                style={styles.textInput}
                placeholder="Ej. Pérez García"
                placeholderTextColor="#94a3b8"
                value={apellidos}
                onChangeText={setApellidos}
              />
            </View>

            {/* Especialidad */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Especialidad</Text>

              {/* ✅ SOLO abre al tocar aquí */}
              <TouchableOpacity style={styles.selectBox} onPress={toggleDropdown} activeOpacity={0.85}>
                <MaterialIcons name="local-hospital" size={18} color={colors.blueGray} />
                <Text style={[styles.selectText, !especialidad && { color: "#94a3b8" }]}>
                  {especialidad ? especialidad : "Selecciona tu especialidad"}
                </Text>
                <MaterialIcons
                  name={openEspecialidades ? "expand-less" : "expand-more"}
                  size={22}
                  color={colors.blueGray}
                />
              </TouchableOpacity>

              {/* ✅ Dropdown (solo si está abierto) */}
              {openEspecialidades && (
                <View style={styles.dropdownWrap}>
                  {/* overlay para cerrar si tocas fuera */}
                  <Pressable style={styles.backdrop} onPress={() => setOpenEspecialidades(false)} />

                  <View style={styles.dropdown}>
                    <ScrollView style={{ maxHeight: 280 }} nestedScrollEnabled keyboardShouldPersistTaps="handled">
                      {ESPECIALIDADES.map((esp) => (
                        <TouchableOpacity
                          key={esp}
                          style={[
                            styles.dropdownItem,
                            especialidad === esp && { backgroundColor: colors.primary + "15" },
                          ]}
                          onPress={() => selectEspecialidad(esp)}
                          activeOpacity={0.85}
                        >
                          <Text style={styles.dropdownItemText}>{esp}</Text>
                          {especialidad === esp ? (
                            <MaterialIcons name="check" size={18} color={colors.primary} />
                          ) : null}
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  </View>
                </View>
              )}
            </View>

            {/* Cedula / Tel */}
            <View style={styles.row}>
              <View style={{ flex: 1 }}>
                <Text style={styles.label}>Cédula</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="12345678"
                  placeholderTextColor="#94a3b8"
                  value={cedula}
                  onChangeText={setCedula}
                  keyboardType="numeric"
                />
              </View>

              <View style={{ flex: 1 }}>
                <Text style={styles.label}>Teléfono</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="+1 809 000 0000"
                  placeholderTextColor="#94a3b8"
                  value={telefono}
                  onChangeText={setTelefono}
                  keyboardType="phone-pad"
                />
              </View>
            </View>

            <TouchableOpacity style={styles.btnPrimary} onPress={handleContinue} activeOpacity={0.9}>
              <Text style={styles.btnPrimaryText}>Continuar Registro</Text>
              <MaterialIcons name="arrow-forward" size={20} color="white" />
            </TouchableOpacity>
          </View>

          <Text style={styles.legal}>
            Al registrarte aceptas nuestros <Text style={styles.link}>términos de servicio</Text> y{" "}
            <Text style={styles.link}>políticas de privacidad</Text>.
          </Text>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <Text style={styles.footerText}>© 2024 VIREM Health Systems. Todos los derechos reservados.</Text>
      </View>
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
  headerContent: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },

  logoGroup: { flexDirection: "row", alignItems: "center", gap: 10 },
  logoImage: { width: 42, height: 42, resizeMode: "contain", borderRadius: 10 },
  logoText: { fontSize: 22, fontWeight: "bold", color: colors.navyDark },

  helpBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: colors.soft + "33",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
  },
  helpText: { fontWeight: "700", color: colors.navyMedium, fontSize: 13 },

  contentWrapper: { padding: 20, maxWidth: 520, alignSelf: "center", width: "100%" },

  title: { fontSize: 26, fontWeight: "900", color: colors.navyDark, textAlign: "center", marginTop: 10 },
  subtitle: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.blueGray,
    textAlign: "center",
    marginTop: 6,
    marginBottom: 18,
  },

  card: {
    backgroundColor: "white",
    borderRadius: 20,
    padding: 22,
    elevation: 5,
    borderWidth: 1,
    borderColor: colors.soft + "44",
  },

  photoCircle: {
    width: 128,
    height: 128,
    borderRadius: 999,
    backgroundColor: colors.backgroundLight,
    borderWidth: 2,
    borderStyle: "dashed",
    borderColor: colors.soft,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
    overflow: "hidden",
  },
  photoPreview: { width: "100%", height: "100%" },
  photoText: { fontSize: 11, fontWeight: "800", color: colors.blueGray, marginTop: 6, letterSpacing: 0.7 },
  photoAdd: {
    position: "absolute",
    right: 6,
    bottom: 6,
    width: 30,
    height: 30,
    borderRadius: 999,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "white",
  },
  photoHint: { fontSize: 12, color: colors.blueGray, marginTop: 10, fontWeight: "600" },

  inputGroup: { marginBottom: 16 },
  label: { fontSize: 13, fontWeight: "700", color: colors.navyDark, marginBottom: 8 },
  textInput: {
    borderWidth: 1,
    borderColor: "#cbd5e1",
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 50,
    backgroundColor: colors.slate50,
    fontSize: 16,
    color: colors.navyDark,
  },

  row: { flexDirection: width > 380 ? "row" : "column", gap: 12, marginTop: 6 },

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
  selectText: { flex: 1, color: colors.blueGray, fontWeight: "600" },

  // ✅ dropdown
  dropdownWrap: {
    position: "relative",
    zIndex: 999, // importante para que no se esconda
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "transparent",
  },
  dropdown: {
    position: "absolute",
    top: 8,
    left: 0,
    right: 0,
    backgroundColor: "white",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    overflow: "hidden",
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
  },
  dropdownItem: {
    paddingVertical: 12,
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
  },
  dropdownItemText: { color: colors.navyDark, fontWeight: "600" },

  btnPrimary: {
    backgroundColor: colors.primary,
    height: 55,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 10,
    flexDirection: "row",
    gap: 10,
  },
  btnPrimaryText: { color: "white", fontSize: 16, fontWeight: "bold" },

  legal: { marginTop: 18, fontSize: 12, color: colors.blueGray, textAlign: "center", lineHeight: 18 },
  link: { color: colors.primary, fontWeight: "800" },

  footer: { paddingVertical: 14, alignItems: "center" },
  footerText: { fontSize: 11, color: colors.blueGray, opacity: 0.55, fontWeight: "600" },
});
