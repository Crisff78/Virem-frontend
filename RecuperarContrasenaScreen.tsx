import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React, { useState } from 'react';
import { ActivityIndicator, Alert, Dimensions, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

// Define tus parámetros de navegación (debe coincidir con App.tsx)
type RootStackParamList = {
    SeleccionPerfil: undefined; 
    Login: undefined;
    RecuperarContrasena: undefined;
    VerificarIdentidad: { email: string }; // <-- Necesario para pasar el email
    EstablecerNuevaContrasena: undefined;
};

type NavigationProps = NativeStackNavigationProp<RootStackParamList, 'RecuperarContrasena'>;

const { width } = Dimensions.get('window');

// ===================================================
// ESTILOS BASE (Traducción de Tailwind CSS)
// ===================================================
const colors = {
    primary: '#4A7FA7', // Color principal de botón y anillo de enfoque
    backgroundLight: '#F6FAFD', // Fondo de la página
    backgroundDark: '#0A1931',
    textPrimaryLight: '#0A1931', // Color de texto principal
    textSecondaryLight: '#1A3D63', // Color del enlace "Volver"
    textSecondaryDark: '#B3CFE5', 
    borderLight: '#B3CFE5',
    cardLight: '#FFFFFF',
    placeholder: '#617589',
};

const styles = StyleSheet.create({
    mainContainer: {
        flex: 1,
        backgroundColor: colors.backgroundLight,
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
    },
    cardContainer: {
        width: width < 400 ? '95%' : 380, // max-w-md
        backgroundColor: colors.cardLight,
        borderRadius: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 }, 
        shadowOpacity: 0.1,
        shadowRadius: 3,
        elevation: 3,
        padding: 32, // p-8
        alignItems: 'center',
    },
    iconWrapper: {
        width: 48, 
        height: 48,
        borderRadius: 24, 
        backgroundColor: 'rgba(74, 127, 167, 0.2)', // primary/20
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 24,
    },
    icon: {
        color: colors.primary, // text-primary
    },
    headerText: {
        alignItems: 'center',
        gap: 8,
        marginBottom: 24,
    },
    title: {
        color: colors.textPrimaryLight,
        fontSize: 24, 
        fontWeight: 'bold',
        textAlign: 'center',
        lineHeight: 30,
    },
    subtitle: {
        color: colors.textSecondaryLight,
        fontSize: 16,
        textAlign: 'center',
        marginTop: 8,
    },
    form: {
        width: '100%',
        gap: 20,
        marginTop: 24,
    },
    labelText: {
        color: colors.textPrimaryLight,
        fontSize: 14,
        fontWeight: '500',
        marginBottom: 8,
    },
    input: {
        width: '100%',
        height: 48,
        borderWidth: 1,
        borderColor: colors.borderLight,
        borderRadius: 8,
        backgroundColor: colors.cardLight,
        paddingHorizontal: 16,
        color: colors.textPrimaryLight,
        fontSize: 16,
    },
    sendCodeButton: {
        width: '100%',
        height: 48,
        borderRadius: 8,
        backgroundColor: colors.primary,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 16,
    },
    buttonText: {
        color: colors.cardLight, // white
        fontSize: 16,
        fontWeight: 'bold',
    },
    backToLoginLink: {
        marginTop: 24,
    },
    backToLoginText: {
        color: colors.textSecondaryLight,
        fontSize: 14,
        fontWeight: '500',
        textDecorationLine: 'underline',
    }
});

// ===================================================
// COMPONENTE PRINCIPAL
// ===================================================

const RecuperarContrasenaScreen: React.FC = () => {
    const [emailOrPhone, setEmailOrPhone] = useState('');
    const [isLoading, setIsLoading] = useState(false); 
    const navigation = useNavigation<NavigationProps>();

    const handleSendCode = async () => { 
        // 1. Validación básica de campo vacío
        if (!emailOrPhone || emailOrPhone.trim() === '') {
            Alert.alert("Atención", "Por favor, ingresa tu correo electrónico.");
            return;
        }

        setIsLoading(true);

        try {
            // 2. FETCH CORREGIDO: Con headers explícitos y manejo de errores de red
            const response = await fetch('http://10.0.0.135:3000/enviar-codigo', {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Accept': 'application/json' 
                },
                body: JSON.stringify({ email: emailOrPhone.toLowerCase().trim() }),
            });

            // Intentamos convertir la respuesta a JSON
            const data = await response.json();

            // 3. Verificación de éxito según la respuesta del backend
            if (response.ok && data.success) {
                // Navegamos pasando el correo como parámetro
                navigation.navigate('VerificarIdentidad', { email: emailOrPhone.toLowerCase().trim() }); 
            } else {
                // Error controlado del servidor (ej. 404 correo no encontrado)
                Alert.alert("Error", data.message || "El correo ingresado no está registrado.");
            }

        } catch (error) {
            // Error de conexión física (servidor apagado, IP mal escrita, WiFi distinto)
            Alert.alert(
                "Error de Conexión", 
                "No se pudo contactar al servidor. Revisa si el backend está encendido en la IP 10.0.0.135 y puerto 3000."
            );
        } finally {
            setIsLoading(false); 
        }
    };
    
    const handleBackToLogin = () => {
        navigation.navigate('Login'); 
    };

    return (
        <View style={styles.mainContainer}>
            <View style={styles.cardContainer}>
                
                <View style={styles.iconWrapper}>
                    <MaterialCommunityIcons name="shield-check" size={30} style={styles.icon} />
                </View>

                <View style={styles.headerText}>
                    <Text style={styles.title}>Recuperar Contraseña</Text>
                    <Text style={styles.subtitle}>
                        Ingresa tu correo electrónico asociado a tu cuenta para recibir un código de restablecimiento.
                    </Text>
                </View>

                <View style={styles.form}>
                    <Text style={styles.labelText}>Correo electrónico</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="ejemplo@correo.com"
                        placeholderTextColor={colors.placeholder}
                        keyboardType="email-address"
                        autoCapitalize="none"
                        value={emailOrPhone}
                        onChangeText={setEmailOrPhone}
                        editable={!isLoading}
                    />
                </View>

                <TouchableOpacity 
                    style={[styles.sendCodeButton, isLoading && { opacity: 0.7 }]} 
                    onPress={handleSendCode}
                    disabled={isLoading}
                >
                    {isLoading ? (
                        <ActivityIndicator color="white" />
                    ) : (
                        <Text style={styles.buttonText}>Enviar Código</Text>
                    )}
                </TouchableOpacity>

                <TouchableOpacity style={styles.backToLoginLink} onPress={handleBackToLogin}>
                    <Text style={styles.backToLoginText}>Volver al Inicio de Sesión</Text>
                </TouchableOpacity>

            </View>
        </View>
    );
};

export default RecuperarContrasenaScreen;