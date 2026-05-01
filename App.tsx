import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import * as Linking from "expo-linking";
import React from "react";
import { Platform, StyleSheet, Text, TextInput } from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";

import EstablecerNuevaContrasenaScreen from "./EstablecerNuevaContrasenaScreen";
import LandingScreen from "./LandingScreen";
import LoginScreen from "./LoginScreen";
import RecuperarContrasenaScreen from "./RecuperarContrasenaScreen";
import RegistroCredencialesScreen from "./RegistroCredencialesScreen";
import RegistroCredencialesMedicoScreen from "./RegistroCredencialesMedicoScreen";
import RegistroMedicoScreen from "./RegistroMedicoScreen";
import RegistroPacienteScreen from "./RegistroPacienteScreen";
import SeleccionPerfil from "./SeleccionPerfil";
import VerificarEmailScreen from "./VerificarEmailScreen";
import VerificarIdentidadScreen from "./VerificarIdentidadScreen";
import BlogDetailScreen from "./BlogDetailScreen";

import DashboardPacienteScreen from "./DashboardPacienteScreen";
import PacientePortalScreen from "./PacientePortalScreen";
import DashboardMedico from "./DashboardMedico";
import MedicoPortalScreen from "./MedicoPortalScreen";
import MedicoCitasScreen from "./MedicoCitasScreen";
import MedicoPacientesScreen from "./MedicoPacientesScreen";
import MedicoChatScreen from "./MedicoChatScreen";
import AdminPanelScreen from "./AdminPanelScreen";
import NuevaConsultaPacienteScreen from "./NuevaConsultaPacienteScreen";
import SalaEsperaVirtualPacienteScreen from "./SalaEsperaVirtualPacienteScreen";
import EspecialistasPorEspecialidadScreen from "./EspecialistasPorEspecialidadScreen";
import PerfilEspecialistaAgendarScreen from "./PerfilEspecialistaAgendarScreen";
import PacienteRecetasDocumentosScreen from "./PacienteRecetasDocumentosScreen";
import PacientePerfilScreen from "./PacientePerfilScreen";
import MedicoPerfilScreen from "./MedicoPerfilScreen";
import MedicoConfiguracionScreen from "./MedicoConfiguracionScreen";
import PacienteNotificacionesScreen from "./PacienteNotificacionesScreen";
import PacienteConfiguracionScreen from "./PacienteConfiguracionScreen";
import PacienteCambiarContrasenaScreen from "./PacienteCambiarContrasenaScreen";
import PacienteHistorialSesionesScreen from "./PacienteHistorialSesionesScreen";
import PacienteChatScreen from "./PacienteChatScreen";
import PacienteCitasScreen from "./PacienteCitasScreen";
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

// Keeps layouts stable on phones with large OS text scaling enabled.
(Text as any).defaultProps = (Text as any).defaultProps || {};
(Text as any).defaultProps.allowFontScaling = false;
(TextInput as any).defaultProps = (TextInput as any).defaultProps || {};
(TextInput as any).defaultProps.allowFontScaling = false;

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
      AdminPanel: "admin-panel",
      BlogDetail: "blog-detail",
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

const AdminOnlyPanelScreen = withRoleGuard(AdminPanelScreen, [ADMIN_ROLE_ID]);

const App: React.FC = () => {
  return (
    <SafeAreaProvider>
      <LanguageProvider>
        <ThemeProvider><AuthProvider>
          <SocketProvider>
            <SafeAreaView style={styles.rootSafeArea} edges={["top", "left", "right"]}>
              <NavigationContainer linking={linking}>
                <Stack.Navigator
                  id="RootStack"
                  initialRouteName="Landing"
                  screenOptions={{
                    headerShown: false,
                    gestureEnabled: false,
                    animation: "none",
                  }}
                >
                  <Stack.Screen name="Landing" component={LandingScreen} />
                  <Stack.Screen name="SeleccionPerfil" component={SeleccionPerfil} />
                  <Stack.Screen name="Login" component={LoginScreen} />

                  <Stack.Screen name="RegistroPaciente" component={RegistroPacienteScreen} />
                  <Stack.Screen name="RegistroMedico" component={RegistroMedicoScreen} />

                  <Stack.Screen name="RegistroCredenciales" component={RegistroCredencialesScreen} />
                  <Stack.Screen
                    name="RegistroCredencialesMedico"
                    component={RegistroCredencialesMedicoScreen}
                  />

                  <Stack.Screen name="RecuperarContrasena" component={RecuperarContrasenaScreen} />
                  <Stack.Screen name="VerificarIdentidad" component={VerificarIdentidadScreen} />
                  <Stack.Screen name="VerificarEmail" component={VerificarEmailScreen} />
                  <Stack.Screen
                    name="EstablecerNuevaContrasena"
                    component={EstablecerNuevaContrasenaScreen}
                  />

                  <Stack.Screen name="DashboardPaciente" component={PatientPortalScreen} />
                  <Stack.Screen name="PacienteCitas" component={PatientCitasScreen} />
                  <Stack.Screen name="PacienteChat" component={PatientChatScreen} />
                  <Stack.Screen
                    name="PacienteNotificaciones"
                    component={PatientNotificacionesScreen}
                  />
                  <Stack.Screen
                    name="PacienteRecetasDocumentos"
                    component={PatientRecetasDocumentosScreen}
                  />
                  <Stack.Screen name="PacientePerfil" component={PatientPerfilScreen} />
                  <Stack.Screen
                    name="PacienteConfiguracion"
                    component={PatientConfiguracionScreen}
                  />
                  <Stack.Screen
                    name="PacienteCambiarContrasena"
                    component={PatientCambiarContrasenaScreen}
                  />
                  <Stack.Screen
                    name="PacienteHistorialSesiones"
                    component={PatientHistorialSesionesScreen}
                  />
                  <Stack.Screen
                    name="NuevaConsultaPaciente"
                    component={PatientNuevaConsultaScreen}
                  />
                  <Stack.Screen
                    name="SalaEsperaVirtualPaciente"
                    component={PatientSalaEsperaScreen}
                  />
                  <Stack.Screen
                    name="EspecialistasPorEspecialidad"
                    component={PatientEspecialistasScreen}
                  />
                  <Stack.Screen
                    name="PerfilEspecialistaAgendar"
                    component={PatientPerfilEspecialistaScreen}
                  />

                  <Stack.Screen name="DashboardMedico" component={DoctorPortalScreen} />
                  <Stack.Screen name="MedicoCitas" component={DoctorCitasScreen} />
                  <Stack.Screen name="MedicoPacientes" component={DoctorPacientesScreen} />
                  <Stack.Screen name="MedicoChat" component={DoctorChatScreen} />
                  <Stack.Screen name="MedicoPerfil" component={DoctorPerfilScreen} />
                  <Stack.Screen name="MedicoConfiguracion" component={DoctorConfiguracionScreen} />
                  <Stack.Screen name="AdminPanel" component={AdminOnlyPanelScreen} />
                  <Stack.Screen name="BlogDetail" component={BlogDetailScreen} />
                </Stack.Navigator>
              </NavigationContainer>
            </SafeAreaView>
          </SocketProvider>
        </AuthProvider></ThemeProvider>
      </LanguageProvider>
    </SafeAreaProvider>
  );
};

export default App;

const styles = StyleSheet.create({
  rootSafeArea: {
    flex: 1,
  },
});
