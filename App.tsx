import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React from 'react';

import EstablecerNuevaContrasenaScreen from './EstablecerNuevaContrasenaScreen';
import LoginScreen from './LoginScreen';
import RecuperarContrasenaScreen from './RecuperarContrasenaScreen';
import RegistroCredencialesScreen from './RegistroCredencialesScreen';
import RegistroPacienteScreen from './RegistroPacienteScreen';
import RegistroMedicoScreen from './RegistroMedicoScreen';
import SeleccionPerfil from './SeleccionPerfil';
import VerificarIdentidadScreen from './VerificarIdentidadScreen';

export type RootStackParamList = {
  SeleccionPerfil: undefined;
  Login: undefined;
  RecuperarContrasena: undefined;
  VerificarIdentidad: { email: string };
  EstablecerNuevaContrasena: undefined;

  RegistroPaciente: undefined;
  RegistroMedico: undefined;

  RegistroCredenciales: {
    datosPersonales:
      | {
          // ✅ PACIENTE
          nombres: string;
          apellidos: string;
          fechanacimiento: string;
          genero: string;
          cedula: string;
          telefono: string;
        }
      | {
          // ✅ MÉDICO
          nombres: string;
          apellidos: string;
          especialidad: string;
          cedula: string;
          telefono: string;
        };
  };
};

const Stack = createNativeStackNavigator<RootStackParamList>();

const App: React.FC = () => {
  return (
    <NavigationContainer>
      <Stack.Navigator
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
        <Stack.Screen name="RecuperarContrasena" component={RecuperarContrasenaScreen} />
        <Stack.Screen name="VerificarIdentidad" component={VerificarIdentidadScreen} />
        <Stack.Screen name="EstablecerNuevaContrasena" component={EstablecerNuevaContrasenaScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default App;
