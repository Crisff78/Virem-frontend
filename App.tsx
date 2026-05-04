import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import * as Linking from "expo-linking";
import React from "react";
import { Platform, Text, TextInput } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { MAX_FONT_SIZE_MULTIPLIER } from "./theme/typography";

// Clamp global del fontScale del sistema. Evita que tipografías
// gigantes del usuario rompan los layouts en cualquier pantalla.
const TextAny = Text as any;
const TextInputAny = TextInput as any;
TextAny.defaultProps = TextAny.defaultProps || {};
TextAny.defaultProps.maxFontSizeMultiplier = MAX_FONT_SIZE_MULTIPLIER;
TextInputAny.defaultProps = TextInputAny.defaultProps || {};
TextInputAny.defaultProps.maxFontSizeMultiplier = MAX_FONT_SIZE_MULTIPLIER;

// Auth
import EstablecerNuevaContrasenaScreen from "./screens/auth/EstablecerNuevaContrasenaScreen";
import LandingScreen from "./screens/auth/LandingScreen";
import LoginScreen from "./screens/auth/LoginScreen";
import RecuperarContrasenaScreen from "./screens/auth/RecuperarContrasenaScreen";
import RegistroCredencialesScreen from "./screens/auth/RegistroCredencialesScreen";
import RegistroCredencialesMedicoScreen from "./screens/auth/RegistroCredencialesMedicoScreen";
import RegistroMedicoScreen from "./screens/auth/RegistroMedicoScreen";
import RegistroPacienteScreen from "./screens/auth/RegistroPacienteScreen";
import SeleccionPerfil from "./screens/auth/SeleccionPerfil";
import VerificarEmailScreen from "./screens/auth/VerificarEmailScreen";
import VerificarIdentidadScreen from "./screens/auth/VerificarIdentidadScreen";

// Paciente
import DashboardPacienteScreen from "./screens/paciente/DashboardPacienteScreen";
import PacientePortalScreen from "./screens/paciente/PacientePortalScreen";
import PacienteCitasScreen from "./screens/paciente/PacienteCitasScreen";
import PacienteChatScreen from "./screens/paciente/PacienteChatScreen";
import PacienteRecetasDocumentosScreen from "./screens/paciente/PacienteRecetasDocumentosScreen";
import PacientePerfilScreen from "./screens/paciente/PacientePerfilScreen";
import PacienteNotificacionesScreen from "./screens/paciente/PacienteNotificacionesScreen";
import PacienteConfiguracionScreen from "./screens/paciente/PacienteConfiguracionScreen";
import PacienteCambiarContrasenaScreen from "./screens/paciente/PacienteCambiarContrasenaScreen";
import PacienteHistorialSesionesScreen from "./screens/paciente/PacienteHistorialSesionesScreen";
import NuevaConsultaPacienteScreen from "./screens/paciente/NuevaConsultaPacienteScreen";
import SalaEsperaVirtualPacienteScreen from "./screens/paciente/SalaEsperaVirtualPacienteScreen";

// Médico
import DashboardMedico from "./screens/medico/DashboardMedico";
import MedicoPortalScreen from "./screens/medico/MedicoPortalScreen";
import MedicoCitasScreen from "./screens/medico/MedicoCitasScreen";
import MedicoPacientesScreen from "./screens/medico/MedicoPacientesScreen";
import MedicoChatScreen from "./screens/medico/MedicoChatScreen";
import MedicoPerfilScreen from "./screens/medico/MedicoPerfilScreen";
import MedicoConfiguracionScreen from "./screens/medico/MedicoConfiguracionScreen";
import MedicoHorariosScreen from "./screens/medico/MedicoHorariosScreen";
import MedicoFinanzasScreen from "./screens/medico/MedicoFinanzasScreen";
import MedicoRecetasScreen from "./screens/medico/MedicoRecetasScreen";

// Público
import BlogDetailScreen from "./screens/public/BlogDetailScreen";
import EspecialidadesScreen from "./screens/public/EspecialidadesScreen";
import EspecialidadDetalleScreen from "./screens/public/EspecialidadDetalleScreen";
import EspecialistasPorEspecialidadScreen from "./screens/public/EspecialistasPorEspecialidadScreen";
import PerfilEspecialistaAgendarScreen from "./screens/public/PerfilEspecialistaAgendarScreen";

// Admin
import AdminPanelScreen from "./screens/admin/AdminPanelScreen";

import { LanguageProvider } from "./localization/LanguageContext";
import { RootStackParamList } from "./navigation/types";
import {
  ADMIN_ROLE_ID,
  MEDICO_ROLE_ID,
  PACIENTE_ROLE_ID,
  withRoleGuard,
} from "./navigation/RoleGuard";
import { AuthProvider } from "./providers/AuthProvider";
import { ThemeProvider } from "./providers/ThemeContext";
import { SocketProvider } from "./providers/SocketProvider";

const Stack = createNativeStackNavigator<RootStackParamList>();
const linkingPrefixes = [Linking.createURL("/")];
if (Platform.OS === "web" && typeof window !== "undefined") {
  linkingPrefixes.push(window.location.origin);
}


const linking = {
  prefixes: linkingPrefixes,
  config: {
    screens: {
      Landing: "",
      SeleccionPerfil: "seleccion",
      Login: "login",
      RecuperarContrasena: "recuperar-contrasena",
      VerificarIdentidad: "verificar-identidad/:email",
      EstablecerNuevaContrasena: "nueva-contrasena/:email",
      RegistroPaciente: "registro-paciente",
      RegistroMedico: "registro-medico",
      RegistroCredenciales: "registro-credenciales",
      RegistroCredencialesMedico: "registro-credenciales-medico",
      DashboardPaciente: "dashboard-paciente",
      PacienteCitas: "paciente-citas",
      PacienteChat: "paciente-chat",
      PacienteRecetasDocumentos: "paciente-recetas-documentos",
      PacientePerfil: "paciente-perfil",
      NuevaConsultaPaciente: "nueva-consulta",
      SalaEsperaVirtualPaciente: "sala-espera",
      EspecialistasPorEspecialidad: "especialistas/:specialty",
      PerfilEspecialistaAgendar: "perfil-especialista/:specialty/:doctorId",
      DashboardMedico: "dashboard-medico",
      MedicoCitas: "medico-citas",
      MedicoPacientes: "medico-pacientes",
      MedicoChat: "medico-chat",
      MedicoPerfil: "medico-perfil",
      MedicoConfiguracion: "medico-configuracion",
      MedicoHorarios: "medico-horarios",
      MedicoFinanzas: "medico-finanzas",
      MedicoRecetas: "medico-recetas",
      AdminPanel: "admin-panel",
      BlogDetail: "blog-detail",
      Especialidades: "especialidades-virem",
      EspecialidadDetalle: "especialidad-detalle/:title",
    },
  },
};

const PatientPortalScreen = withRoleGuard(PacientePortalScreen, [PACIENTE_ROLE_ID]);
const PatientCitasScreen = withRoleGuard(PacienteCitasScreen, [PACIENTE_ROLE_ID]);
const PatientChatScreen = withRoleGuard(PacienteChatScreen, [PACIENTE_ROLE_ID]);
const PatientNotificacionesScreen = withRoleGuard(PacienteNotificacionesScreen, [PACIENTE_ROLE_ID]);
const PatientRecetasDocumentosScreen = withRoleGuard(PacienteRecetasDocumentosScreen, [PACIENTE_ROLE_ID]);
const PatientPerfilScreen = withRoleGuard(PacientePerfilScreen, [PACIENTE_ROLE_ID]);
const PatientConfiguracionScreen = withRoleGuard(PacienteConfiguracionScreen, [PACIENTE_ROLE_ID]);
const PatientCambiarContrasenaScreen = withRoleGuard(PacienteCambiarContrasenaScreen, [PACIENTE_ROLE_ID]);
const PatientHistorialSesionesScreen = withRoleGuard(PacienteHistorialSesionesScreen, [PACIENTE_ROLE_ID]);
const PatientNuevaConsultaScreen = withRoleGuard(NuevaConsultaPacienteScreen, [PACIENTE_ROLE_ID]);
const PatientSalaEsperaScreen = withRoleGuard(SalaEsperaVirtualPacienteScreen, [PACIENTE_ROLE_ID]);
const PatientEspecialistasScreen = withRoleGuard(EspecialistasPorEspecialidadScreen, [PACIENTE_ROLE_ID]);
const PatientPerfilEspecialistaScreen = withRoleGuard(PerfilEspecialistaAgendarScreen, [PACIENTE_ROLE_ID]);

const DoctorPortalScreen = withRoleGuard(MedicoPortalScreen, [MEDICO_ROLE_ID]);
const DoctorCitasScreen = withRoleGuard(MedicoCitasScreen, [MEDICO_ROLE_ID]);
const DoctorPacientesScreen = withRoleGuard(MedicoPacientesScreen, [MEDICO_ROLE_ID]);
const DoctorChatScreen = withRoleGuard(MedicoChatScreen, [MEDICO_ROLE_ID]);
const DoctorPerfilScreen = withRoleGuard(MedicoPerfilScreen, [MEDICO_ROLE_ID]);
const DoctorConfiguracionScreen = withRoleGuard(MedicoConfiguracionScreen, [MEDICO_ROLE_ID]);
const DoctorHorariosScreen = withRoleGuard(MedicoHorariosScreen, [MEDICO_ROLE_ID]);
const DoctorFinanzasScreen = withRoleGuard(MedicoFinanzasScreen, [MEDICO_ROLE_ID]);
const DoctorRecetasScreen = withRoleGuard(MedicoRecetasScreen, [MEDICO_ROLE_ID]);

const AdminOnlyPanelScreen = withRoleGuard(AdminPanelScreen, [ADMIN_ROLE_ID]);

const App: React.FC = () => {
  return (
    <SafeAreaProvider>
      <LanguageProvider>
        <ThemeProvider>
          <AuthProvider>
            <SocketProvider>
              <NavigationContainer linking={linking}>
                <Stack.Navigator
                  id="RootStack"
                  initialRouteName="Landing"
                  screenOptions={{ headerShown: false, gestureEnabled: false, animation: "none" }}
                >
                  {/* Auth */}
                  <Stack.Screen name="Landing" component={LandingScreen} />
                  <Stack.Screen name="SeleccionPerfil" component={SeleccionPerfil} />
                  <Stack.Screen name="Login" component={LoginScreen} />
                  <Stack.Screen name="RegistroPaciente" component={RegistroPacienteScreen} />
                  <Stack.Screen name="RegistroMedico" component={RegistroMedicoScreen} />
                  <Stack.Screen name="RegistroCredenciales" component={RegistroCredencialesScreen} />
                  <Stack.Screen name="RegistroCredencialesMedico" component={RegistroCredencialesMedicoScreen} />
                  <Stack.Screen name="RecuperarContrasena" component={RecuperarContrasenaScreen} />
                  <Stack.Screen name="VerificarIdentidad" component={VerificarIdentidadScreen} />
                  <Stack.Screen name="VerificarEmail" component={VerificarEmailScreen} />
                  <Stack.Screen name="EstablecerNuevaContrasena" component={EstablecerNuevaContrasenaScreen} />

                  {/* Paciente */}
                  <Stack.Screen name="DashboardPaciente" component={PatientPortalScreen} />
                  <Stack.Screen name="PacienteCitas" component={PatientCitasScreen} />
                  <Stack.Screen name="PacienteChat" component={PatientChatScreen} />
                  <Stack.Screen name="PacienteNotificaciones" component={PatientNotificacionesScreen} />
                  <Stack.Screen name="PacienteRecetasDocumentos" component={PatientRecetasDocumentosScreen} />
                  <Stack.Screen name="PacientePerfil" component={PatientPerfilScreen} />
                  <Stack.Screen name="PacienteConfiguracion" component={PatientConfiguracionScreen} />
                  <Stack.Screen name="PacienteCambiarContrasena" component={PatientCambiarContrasenaScreen} />
                  <Stack.Screen name="PacienteHistorialSesiones" component={PatientHistorialSesionesScreen} />
                  <Stack.Screen name="NuevaConsultaPaciente" component={PatientNuevaConsultaScreen} />
                  <Stack.Screen name="SalaEsperaVirtualPaciente" component={PatientSalaEsperaScreen} />
                  <Stack.Screen name="EspecialistasPorEspecialidad" component={PatientEspecialistasScreen} />
                  <Stack.Screen name="PerfilEspecialistaAgendar" component={PatientPerfilEspecialistaScreen} />

                  {/* Médico */}
                  <Stack.Screen name="DashboardMedico" component={DoctorPortalScreen} />
                  <Stack.Screen name="MedicoCitas" component={DoctorCitasScreen} />
                  <Stack.Screen name="MedicoPacientes" component={DoctorPacientesScreen} />
                  <Stack.Screen name="MedicoChat" component={DoctorChatScreen} />
                  <Stack.Screen name="MedicoPerfil" component={DoctorPerfilScreen} />
                  <Stack.Screen name="MedicoConfiguracion" component={DoctorConfiguracionScreen} />
                  <Stack.Screen name="MedicoHorarios" component={DoctorHorariosScreen} />
                  <Stack.Screen name="MedicoFinanzas" component={DoctorFinanzasScreen} />
                  <Stack.Screen name="MedicoRecetas" component={DoctorRecetasScreen} />

                  {/* Admin */}
                  <Stack.Screen name="AdminPanel" component={AdminOnlyPanelScreen} />

                  {/* Público */}
                  <Stack.Screen name="BlogDetail" component={BlogDetailScreen} />
                  <Stack.Screen name="Especialidades" component={EspecialidadesScreen} />
                  <Stack.Screen name="EspecialidadDetalle" component={EspecialidadDetalleScreen} />
                </Stack.Navigator>
              </NavigationContainer>
            </SocketProvider>
          </AuthProvider>
        </ThemeProvider>
      </LanguageProvider>
    </SafeAreaProvider>
  );
};

export default App;
