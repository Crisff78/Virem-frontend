import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React, { useState } from 'react';
import { Dimensions, Image, StyleSheet, Text, TextInput, TouchableOpacity, View, Alert, ActivityIndicator } from 'react-native';
import { apiUrl } from './config/backend';
import { RootStackParamList } from './navigation/types';

type NavigationProps = NativeStackNavigationProp<RootStackParamList, 'EstablecerNuevaContrasena'>;
type RouteProps = RouteProp<RootStackParamList, 'EstablecerNuevaContrasena'>;

const ViremLogo = require('./assets/imagenes/Virem.png'); 
const { width } = Dimensions.get('window');

const colors = {
    primary: '#4A7FA7',
    backgroundLight: '#F6FAFD',
    textPrimary: '#0A1931',
    textSecondary: '#1A3D63',
    borderColor: '#B3CFE5',
    cardLight: '#FFFFFF',
    placeholder: '#9ca3af',
};

const EstablecerNuevaContrasenaScreen: React.FC = () => {
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isPasswordVisible, setIsPasswordVisible] = useState(false);
    const [isConfirmPasswordVisible, setIsConfirmPasswordVisible] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const navigation = useNavigation<NavigationProps>();
    const route = useRoute<RouteProps>();
    const email = route.params?.email; // Traemos el email desde la pantalla anterior

    const checkRule = (rule: string) => {
        if (!newPassword) return false;
        switch (rule) {
            case 'min8': return newPassword.length >= 8;
            case 'uppercase': return /[A-Z]/.test(newPassword);
            case 'number': return /[0-9]/.test(newPassword);
            case 'special': return /[!@#$%^&*(),.?":{}|<>]/.test(newPassword);
            default: return false;
        }
    };

    const handlePasswordReset = async () => {
        if (!email) {
            Alert.alert("Error", "No se encontró el correo para actualizar la contraseña.");
            return;
        }

        if (newPassword !== confirmPassword) {
            Alert.alert("Error", "Las contraseñas no coinciden.");
            return;
        }
        if (newPassword.length < 8 || !checkRule('uppercase') || !checkRule('number') || !checkRule('special')) {
             Alert.alert("Seguridad", "La contraseña no cumple con los requisitos.");
            return;
        }

        setIsLoading(true);

        try {
            // PETICIÓN PARA ACTUALIZAR LA CLAVE EN POSTGRES
            const response = await fetch(apiUrl('/actualizar-password'), {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    email: email?.toLowerCase().trim(), 
                    newPassword: newPassword 
                }),
            });

            const data = await response.json();

            if (response.ok && data.success) {
                Alert.alert("¡Éxito!", "Contraseña actualizada. Ya puedes iniciar sesión.");
                navigation.navigate('Login'); 
            } else {
                Alert.alert("Error", data.message || "No se pudo actualizar.");
            }
        } catch (error) {
            Alert.alert("Error", "No hay conexión con el servidor.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleBackToLogin = () => navigation.navigate('Login');

    return (
        <View style={styles.mainContainer}>
            <View style={styles.cardContainer}>
                <View style={styles.logoWrapper}>
                    <Image source={ViremLogo} style={styles.logoImage} /> 
                    <Text style={styles.logoText}>VIREM</Text> 
                </View>

                <View style={styles.header}>
                    <Text style={styles.title}>Establecer Nueva Contraseña</Text>
                    <Text style={styles.subtitle}>Crea una contraseña segura para tu cuenta</Text>
                </View>

                <View style={styles.formSection}>
                    <View style={styles.labelContainer}>
                        <Text style={styles.labelText}>Nueva Contraseña</Text>
                        <View style={styles.inputGroup}>
                            <TextInput
                                style={styles.input}
                                placeholder="Introduce tu nueva contraseña"
                                secureTextEntry={!isPasswordVisible}
                                value={newPassword}
                                onChangeText={setNewPassword}
                                editable={!isLoading}
                            />
                            <TouchableOpacity style={styles.visibilityIconWrapper} onPress={() => setIsPasswordVisible(!isPasswordVisible)}>
                                <MaterialIcons name={isPasswordVisible ? "visibility" : "visibility-off"} size={20} color={colors.textSecondary} />
                            </TouchableOpacity>
                        </View>
                    </View>

                    <View style={styles.labelContainer}>
                        <Text style={styles.labelText}>Confirmar Nueva Contraseña</Text>
                        <View style={styles.inputGroup}>
                            <TextInput
                                style={styles.input}
                                placeholder="Repite tu contraseña"
                                secureTextEntry={!isConfirmPasswordVisible}
                                value={confirmPassword}
                                onChangeText={setConfirmPassword}
                                editable={!isLoading}
                            />
                            <TouchableOpacity style={styles.visibilityIconWrapper} onPress={() => setIsConfirmPasswordVisible(!isConfirmPasswordVisible)}>
                                <MaterialIcons name={isConfirmPasswordVisible ? "visibility" : "visibility-off"} size={20} color={colors.textSecondary} />
                            </TouchableOpacity>
                        </View>
                    </View>

                    <View style={styles.rulesGrid}>
                        <View style={styles.ruleItem}>
                            <MaterialIcons name={checkRule('min8') ? "check-circle" : "radio-button-unchecked"} size={14} color={checkRule('min8') ? colors.primary : "#999"} />
                            <Text style={styles.ruleText}>Mínimo 8 caracteres</Text>
                        </View>
                        <View style={styles.ruleItem}>
                            <MaterialIcons name={checkRule('uppercase') ? "check-circle" : "radio-button-unchecked"} size={14} color={checkRule('uppercase') ? colors.primary : "#999"} />
                            <Text style={styles.ruleText}>Una mayúscula</Text>
                        </View>
                        <View style={styles.ruleItem}>
                            <MaterialIcons name={checkRule('number') ? "check-circle" : "radio-button-unchecked"} size={14} color={checkRule('number') ? colors.primary : "#999"} />
                            <Text style={styles.ruleText}>Un número</Text>
                        </View>
                        <View style={styles.ruleItem}>
                            <MaterialIcons name={checkRule('special') ? "check-circle" : "radio-button-unchecked"} size={14} color={checkRule('special') ? colors.primary : "#999"} />
                            <Text style={styles.ruleText}>Carácter especial</Text>
                        </View>
                    </View>

                    <TouchableOpacity style={styles.updateButton} onPress={handlePasswordReset} disabled={isLoading}>
                        {isLoading ? <ActivityIndicator color="white" /> : <Text style={styles.buttonText}>Actualizar Contraseña</Text>}
                    </TouchableOpacity>
                </View>

                <TouchableOpacity style={styles.footerLinkWrapper} onPress={handleBackToLogin}>
                    <MaterialIcons name="arrow-back" size={16} style={styles.footerIcon} />
                    <Text style={styles.footerLinkText}>Volver a inicio de sesión</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    mainContainer: { flex: 1, backgroundColor: colors.backgroundLight, alignItems: 'center', justifyContent: 'center', padding: 16 },
    logoWrapper: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 24 },
    logoImage: { width: 32, height: 32, tintColor: colors.primary, resizeMode: 'contain' },
    logoText: { fontSize: 24, fontWeight: 'bold', color: colors.textPrimary },
    cardContainer: { width: width < 400 ? '95%' : 380, backgroundColor: colors.cardLight, borderRadius: 12, elevation: 3, padding: 25, alignItems: 'center' },
    header: { width: '100%', alignItems: 'center', marginBottom: 25 },
    title: { color: colors.textPrimary, fontSize: 18, fontWeight: 'bold', textAlign: 'center' },
    subtitle: { color: colors.textSecondary, fontSize: 14, textAlign: 'center', marginTop: 5 },
    formSection: { width: '100%' },
    labelContainer: { marginBottom: 15 },
    labelText: { color: colors.textPrimary, fontSize: 14, fontWeight: '500', marginBottom: 5 },
    inputGroup: { flexDirection: 'row', borderWidth: 1, borderColor: colors.borderColor, borderRadius: 8, height: 48 },
    input: { flex: 1, paddingHorizontal: 12, color: colors.textPrimary },
    visibilityIconWrapper: { width: 45, justifyContent: 'center', alignItems: 'center', borderLeftWidth: 1, borderLeftColor: colors.borderColor },
    rulesGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginBottom: 20 },
    ruleItem: { flexDirection: 'row', alignItems: 'center', width: '48%', marginBottom: 5 },
    ruleText: { color: colors.textSecondary, fontSize: 11, marginLeft: 5 },
    updateButton: { width: '100%', height: 48, borderRadius: 8, backgroundColor: colors.primary, justifyContent: 'center', alignItems: 'center' },
    buttonText: { color: 'white', fontSize: 15, fontWeight: 'bold' },
    footerLinkWrapper: { flexDirection: 'row', alignItems: 'center', marginTop: 20 },
    footerLinkText: { color: colors.textSecondary, fontSize: 13, fontWeight: 'bold', marginLeft: 5, textDecorationLine: 'underline' },
    footerIcon: { color: colors.textSecondary }
});

export default EstablecerNuevaContrasenaScreen;
