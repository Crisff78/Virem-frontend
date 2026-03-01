import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import React from "react";

import EstablecerNuevaContrasenaScreen from "./EstablecerNuevaContrasenaScreen";
import LoginScreen from "./LoginScreen";
import RecuperarContrasenaScreen from "./RecuperarContrasenaScreen";
import RegistroCredencialesScreen from "./RegistroCredencialesScreen";
import RegistroCredencialesMedicoScreen from "./RegistroCredencialesMedicoScreen";
import RegistroMedicoScreen from "./RegistroMedicoScreen";
import RegistroPacienteScreen from "./RegistroPacienteScreen";
import SeleccionPerfil from "./SeleccionPerfil";
import VerificarIdentidadScreen from "./VerificarIdentidadScreen";

import DashboardPacienteScreen from "./DashboardPacienteScreen";
import DashboardMedico from "./DashboardMedico";
import NuevaConsultaPacienteScreen from "./NuevaConsultaPacienteScreen";
import EspecialistasPorEspecialidadScreen from "./EspecialistasPorEspecialidadScreen";
import PerfilEspecialistaAgendarScreen from "./PerfilEspecialistaAgendarScreen";
import PacienteRecetasDocumentosScreen from "./PacienteRecetasDocumentosScreen";
import PacientePerfilScreen from "./PacientePerfilScreen";

import { RootStackParamList } from "./navigation/types";

const Stack = createNativeStackNavigator<RootStackParamList>();

const App: React.FC = () => {
  return (
    <NavigationContainer>
      <Stack.Navigator
        id="RootStack"
        initialRouteName="SeleccionPerfil"
        screenOptions={{
          headerShown: false,
          gestureEnabled: false,
        }}
      >
        <Stack.Screen name="SeleccionPerfil" component={SeleccionPerfil} />
        <Stack.Screen name="Login" component={LoginScreen} />

        <Stack.Screen name="RegistroPaciente" component={RegistroPacienteScreen} />
        <Stack.Screen name="RegistroMedico" component={RegistroMedicoScreen} />

        <Stack.Screen name="RegistroCredenciales" component={RegistroCredencialesScreen} />
        <Stack.Screen name="RegistroCredencialesMedico" component={RegistroCredencialesMedicoScreen} />

        <Stack.Screen name="RecuperarContrasena" component={RecuperarContrasenaScreen} />
        <Stack.Screen name="VerificarIdentidad" component={VerificarIdentidadScreen} />
        <Stack.Screen
          name="EstablecerNuevaContrasena"
          component={EstablecerNuevaContrasenaScreen}
        />

        {/* ✅ Dashboard Paciente */}
        <Stack.Screen name="DashboardPaciente" component={DashboardPacienteScreen} />
        <Stack.Screen
          name="PacienteRecetasDocumentos"
          component={PacienteRecetasDocumentosScreen}
        />
        <Stack.Screen
          name="PacientePerfil"
          component={PacientePerfilScreen}
        />
        <Stack.Screen
          name="NuevaConsultaPaciente"
          component={NuevaConsultaPacienteScreen}
        />
        <Stack.Screen
          name="EspecialistasPorEspecialidad"
          component={EspecialistasPorEspecialidadScreen}
        />
        <Stack.Screen
          name="PerfilEspecialistaAgendar"
          component={PerfilEspecialistaAgendarScreen}
        />
        <Stack.Screen name="DashboardMedico" component={DashboardMedico} />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default App;


