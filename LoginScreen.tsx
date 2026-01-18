import React from 'react';
import { 
    View, 
    Text, 
    StyleSheet, 
    TouchableOpacity, 
    SafeAreaView, 
    StatusBar,
    TextInput,
    Image,
} from 'react-native';

// --- IMPORTACIONES REALES DE NAVEGACIÓN ---
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from './App'; // ✅ Importamos el tipo central desde App.tsx


// --- IMPORTACIÓN DE ÍCONOS ---
// Asegúrate de que esta librería esté instalada y enlazada.
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';


// --- CONFIGURACIÓN DE RUTAS ---
// Usamos la ruta local Virem.png, que es el logo de referencia.
const ViremLogo = require('./assets/imagenes/descarga.png'); 

// 🎯 Tipo de navegación para esta pantalla
type LoginScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Login'>;

// --- CONSTANTES DE ESTILO Y COLOR ---
const COLORS = {
    primary: '#1F4770', // Azul marino oscuro para botones, enlaces y el logo
    backgroundLight: '#F3F6F9', // Fondo muy claro
    textPrimary: '#1A1A1A', // Negro oscuro para títulos y nombre de la app
    textSecondary: '#666666', // Gris oscuro para subtítulos y placeholders
    borderLight: '#E0E0E0', // Borde sutil
    cardLight: '#FFFFFF', // Fondo de la tarjeta (blanco puro)
    link: '#1F4770', // Mismo que primary
    iconColor: '#888888', // Color para los iconos de input
};

// --- COMPONENTE PRINCIPAL ---
const LoginScreen: React.FC = () => {
    // 🎯 Uso real del hook de navegación con el tipo correcto
    const navigation = useNavigation<LoginScreenNavigationProp>(); 

    const handleLogin = () => {
        console.log("Iniciando sesión...");
        // Lógica de autenticación y navegación al Home
    };

    const handleForgotPassword = () => {
        // ✅ NAVEGA A LA PANTALLA DE RECUPERACIÓN DE CONTRASEÑA
        navigation.navigate('RecuperarContrasena'); 
    };
    
    const handleGoToRegister = () => {
        // ✅ NAVEGA A LA PANTALLA DE SELECCIÓN DE PERFIL
        // Flujo: Login -> Regístrate -> SeleccionPerfil
        navigation.navigate('SeleccionPerfil'); 
    };

    return (
        <SafeAreaView style={styles.safeArea}>
            <StatusBar barStyle="dark-content" backgroundColor={COLORS.backgroundLight} />

            <View style={styles.container}>
                <View style={styles.card}>
                    {/* Sección de Logo y Nombre (Horizontal con Imagen Local) */}
                    <View style={styles.logoSectionHorizontal}>
                        
                        {/* Usamos el componente Image con la ruta local */}
                        <Image 
                            source={ViremLogo} 
                            style={styles.logoSmallOriginal} 
                            accessibilityLabel="Logo de la aplicación VIREM"
                        />

                        <Text style={styles.appNameHorizontal}>VIREM</Text>
                    </View>

                    <Text style={styles.title}>Accede a tu cuenta</Text>
                    <Text style={styles.subtitle}>
                        Bienvenido de nuevo. Por favor, introduce tus credenciales.
                    </Text>

                    {/* Formulario de Login */}
                    <View style={styles.form}>
                        {/* INPUT: Correo Electrónico */}
                        <Text style={styles.inputLabel}>Correo Electrónico</Text>
                        <View style={styles.inputContainer}>
                            <MaterialCommunityIcons 
                                name="email-outline" 
                                size={22} 
                                color={COLORS.iconColor} 
                                style={styles.inputIcon}
                            /> 
                            <TextInput 
                                style={styles.input} 
                                placeholder="tu@email.com" 
                                keyboardType="email-address" 
                                autoCapitalize="none"
                                accessibilityLabel="Campo de correo electrónico"
                            />
                        </View>
                        
                        {/* INPUT: Contraseña */}
                        <Text style={styles.inputLabel}>Contraseña</Text>
                        <View style={styles.inputContainer}>
                            <MaterialCommunityIcons 
                                name="lock-outline" 
                                size={22} 
                                color={COLORS.iconColor} 
                                style={styles.inputIcon}
                            /> 
                            <TextInput 
                                style={styles.input} 
                                placeholder="Introduce tu contraseña" 
                                secureTextEntry 
                                accessibilityLabel="Campo de contraseña"
                            />
                        </View>

                        {/* ENLACE: Olvidaste tu contraseña? */}
                        <TouchableOpacity 
                            onPress={handleForgotPassword} 
                            style={styles.forgotPasswordLink}
                            accessibilityLabel="Olvidaste tu contraseña"
                        >
                            <Text style={styles.linkText}>¿Olvidaste tu contraseña?</Text>
                        </TouchableOpacity>
                        
                        {/* BOTÓN: Iniciar Sesión */}
                        <TouchableOpacity 
                            style={styles.button} 
                            activeOpacity={0.8}
                            onPress={handleLogin}
                            accessibilityLabel="Botón de Iniciar Sesión"
                        >
                            <Text style={styles.buttonText}>Iniciar Sesión</Text>
                        </TouchableOpacity>
                    </View>
                    
                    {/* ENLACE CLAVE: Registrarse */}
                    <TouchableOpacity 
                        onPress={handleGoToRegister} 
                        style={styles.registerLink}
                        accessibilityLabel="Enlace para ir a la pantalla de registro"
                    >
                        <Text style={styles.registerText}>
                            ¿No tienes cuenta? <Text style={styles.linkTextBold}>Regístrate</Text>
                        </Text>
                    </TouchableOpacity>
                </View>
            </View>
        </SafeAreaView>
    );
};

// --- ESTILOS DE REACT NATIVE ---
const styles = StyleSheet.create({
    safeArea: { 
        flex: 1, 
        backgroundColor: COLORS.backgroundLight 
    },
    container: { 
        flex: 1, 
        alignItems: 'center', 
        justifyContent: 'center', 
        paddingHorizontal: 20,
    },
    card: { 
        width: '100%', 
        maxWidth: 400, 
        backgroundColor: COLORS.cardLight, 
        borderRadius: 16, 
        padding: 30, 
        shadowColor: '#000', 
        shadowOffset: { width: 0, height: 4 }, 
        shadowOpacity: 0.1, 
        shadowRadius: 10, 
        elevation: 8, 
        alignItems: 'center'
    },
    
    logoSectionHorizontal: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        alignSelf: 'center',
        marginBottom: 20, 
    },
    logoSmallOriginal: { 
        width: 30, 
        height: 30, 
        resizeMode: 'contain', 
        marginRight: 8,
    },
    appNameHorizontal: {
        fontSize: 22,
        fontWeight: 'bold', 
        color: COLORS.textPrimary, 
        letterSpacing: 0.5,
        textTransform: 'uppercase',
    },
    title: { 
        fontSize: 24, 
        fontWeight: 'bold', 
        color: COLORS.textPrimary, 
        textAlign: 'center',
        marginBottom: 8,
    },
    subtitle: { 
        fontSize: 14, 
        color: COLORS.textSecondary, 
        textAlign: 'center', 
        marginBottom: 30,
        paddingHorizontal: 10,
    },
    form: { 
        width: '100%', 
        gap: 20, 
    },
    inputLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: COLORS.textPrimary,
        marginBottom: 5,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        height: 48, 
        borderWidth: 1, 
        borderColor: COLORS.borderLight, 
        borderRadius: 8, 
        backgroundColor: COLORS.cardLight, 
        paddingHorizontal: 0,
    },
    inputIcon: {
        paddingLeft: 12,
        paddingRight: 8,
    },
    input: { 
        flex: 1,
        paddingHorizontal: 0, 
        fontSize: 16, 
        color: COLORS.textPrimary, 
    },
    forgotPasswordLink: { 
        alignSelf: 'flex-end', 
        paddingVertical: 5,
        marginTop: -5, 
    },
    linkText: { 
        color: COLORS.link, 
        fontSize: 14, 
        fontWeight: '600',
        textDecorationLine: 'none', 
    },
    button: { 
        width: '100%', 
        height: 48, 
        backgroundColor: COLORS.primary, 
        borderRadius: 8, 
        justifyContent: 'center', 
        alignItems: 'center', 
        marginTop: 15,
    },
    buttonText: { 
        color: COLORS.cardLight, 
        fontSize: 18, 
        fontWeight: 'bold' 
    },
    registerLink: { 
        marginTop: 20 
    },
    registerText: { 
        fontSize: 14, 
        color: COLORS.textSecondary
    },
    linkTextBold: { 
        color: COLORS.link, 
        fontSize: 14, 
        fontWeight: 'bold' 
    },
});

export default LoginScreen;