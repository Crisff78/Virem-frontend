import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, StyleSheet, Platform, ScrollView, TouchableOpacity, ActivityIndicator, Alert, TextInput } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useMedicoModule } from '../../navigation/MedicoModuleContext';
import { usePortalAwareMedicoNavigation } from '../../navigation/usePortalAwareMedicoNavigation';
import { useWindowDimensions } from 'react-native';
import { apiClient } from '../../utils/api';

const colors = {
  primary: '#137fec',
  bg: '#F6FAFD',
  dark: '#0A1931',
  muted: '#4A7FA7',
  green: '#22c55e',
  red: '#ef4444',
  white: '#FFFFFF',
  border: '#eef2f7',
};

type Receta = {
  recetaid: string;
  paciente_nombre: string;
  diagnostico: string;
  created_at: string;
};

const MedicoRecetasScreen: React.FC = () => {
  const { isInsidePortal } = useMedicoModule();
  const navigation = usePortalAwareMedicoNavigation();
  const { width: viewportWidth } = useWindowDimensions();
  const isDesktopLayout = Platform.OS === 'web' && viewportWidth >= 1024;

  const [loading, setLoading] = useState(true);
  const [recetas, setRecetas] = useState<Receta[]>([]);

  // Simple form state
  const [showForm, setShowForm] = useState(false);
  const [pacienteId, setPacienteId] = useState('');
  const [citaId, setCitaId] = useState('00000000-0000-0000-0000-000000000000'); // Default UUID for simple direct emit
  const [diagnostico, setDiagnostico] = useState('');
  const [medicamento, setMedicamento] = useState('');
  const [instrucciones, setInstrucciones] = useState('');

  const fetchRecetas = useCallback(async () => {
    setLoading(true);
    try {
      const payload = await apiClient.get<any>('/api/medico/me/recetas', {
        authenticated: true,
      });

      if (payload?.success && Array.isArray(payload.recetas)) {
        setRecetas(payload.recetas);
      } else {
        setRecetas([]);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRecetas();
  }, [fetchRecetas]);

  const handleEmitir = async () => {
    if (!pacienteId || !diagnostico || !medicamento) {
      Alert.alert('Error', 'Faltan datos obligatorios');
      return;
    }

    try {
      const payload = await apiClient.post<any>('/api/medico/me/recetas', {
        authenticated: true,
        body: {
          pacienteid: parseInt(pacienteId, 10),
          citaid: citaId,
          diagnostico,
          medicamentos: [{ nombre: medicamento }],
          instrucciones,
        },
      });

      if (payload?.success) {
        Alert.alert('Éxito', 'Receta emitida correctamente');
        setShowForm(false);
        setPacienteId('');
        setDiagnostico('');
        setMedicamento('');
        setInstrucciones('');
        fetchRecetas();
      } else {
        Alert.alert('Error', 'No se pudo emitir la receta.');
      }
    } catch (error) {
      Alert.alert('Error', 'Error de conexión al emitir receta.');
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>Recetas Médicas</Text>
            <Text style={styles.subtitle}>Emite recetas y órdenes para tus pacientes</Text>
          </View>
          <TouchableOpacity style={styles.addBtn} onPress={() => setShowForm(!showForm)}>
            <MaterialIcons name={showForm ? 'close' : 'add'} size={20} color="#fff" />
            <Text style={styles.addBtnText}>{showForm ? 'Cancelar' : 'Nueva Receta'}</Text>
          </TouchableOpacity>
        </View>

        {showForm && (
          <View style={styles.formContainer}>
            <Text style={styles.sectionTitle}>Emitir Nueva Receta</Text>
            
            <View style={styles.inputGroup}>
              <Text style={styles.label}>ID del Paciente</Text>
              <TextInput style={styles.input} value={pacienteId} onChangeText={setPacienteId} placeholder="Ej. 123" keyboardType="numeric" />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Diagnóstico</Text>
              <TextInput style={styles.input} value={diagnostico} onChangeText={setDiagnostico} placeholder="Ej. Amigdalitis aguda" />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Medicamento</Text>
              <TextInput style={styles.input} value={medicamento} onChangeText={setMedicamento} placeholder="Ej. Amoxicilina 500mg" />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Instrucciones de uso</Text>
              <TextInput style={[styles.input, { height: 80 }]} value={instrucciones} onChangeText={setInstrucciones} placeholder="Tomar 1 cápsula cada 8 horas por 7 días." multiline />
            </View>

            <TouchableOpacity style={styles.submitBtn} onPress={handleEmitir}>
              <Text style={styles.submitBtnText}>Generar Receta</Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={styles.historySection}>
          <Text style={styles.sectionTitle}>Historial de Recetas Emitidas</Text>
          
          <View style={styles.listContainer}>
            {loading ? (
              <ActivityIndicator size="large" color={colors.primary} style={{ padding: 40 }} />
            ) : recetas.length === 0 ? (
              <View style={styles.emptyBox}>
                <MaterialIcons name="description" size={40} color={colors.muted} />
                <Text style={styles.emptyText}>No has emitido recetas</Text>
              </View>
            ) : (
              recetas.map((r) => (
                <View key={r.recetaid} style={styles.transactionRow}>
                  <View style={styles.tLeft}>
                    <View style={styles.tIcon}>
                      <MaterialIcons name="picture-as-pdf" size={20} color={colors.red} />
                    </View>
                    <View>
                      <Text style={styles.tTitle}>{r.paciente_nombre}</Text>
                      <Text style={styles.tDate}>{new Date(r.created_at).toLocaleDateString()}</Text>
                    </View>
                  </View>
                  <Text style={styles.tAmount}>{r.diagnostico}</Text>
                </View>
              ))
            )}
          </View>
        </View>

      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  scrollContent: { padding: 24, paddingBottom: 60 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 14 },
  title: { fontSize: 28, fontWeight: '900', color: colors.dark },
  subtitle: { fontSize: 14, color: colors.muted, marginTop: 4, fontWeight: '600' },
  
  addBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: colors.primary, paddingHorizontal: 16, paddingVertical: 12, borderRadius: 12 },
  addBtnText: { color: '#fff', fontWeight: '800', fontSize: 14 },

  formContainer: { backgroundColor: '#fff', padding: 20, borderRadius: 16, marginBottom: 24, borderWidth: 1, borderColor: colors.border },
  inputGroup: { marginBottom: 14 },
  label: { fontSize: 13, fontWeight: '700', color: colors.dark, marginBottom: 6 },
  input: { backgroundColor: '#f8fafc', borderWidth: 1, borderColor: colors.border, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 10, color: colors.dark, fontWeight: '600' },
  submitBtn: { backgroundColor: colors.green, padding: 14, borderRadius: 10, alignItems: 'center', marginTop: 10 },
  submitBtnText: { color: '#fff', fontWeight: '800', fontSize: 14 },

  historySection: { marginTop: 10 },
  sectionTitle: { fontSize: 18, fontWeight: '900', color: colors.dark, marginBottom: 12 },
  listContainer: { backgroundColor: '#fff', borderRadius: 16, overflow: 'hidden', borderWidth: 1, borderColor: colors.border },
  
  emptyBox: { padding: 40, alignItems: 'center', justifyContent: 'center' },
  emptyText: { color: colors.dark, fontSize: 16, fontWeight: '800', marginTop: 12 },

  transactionRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, borderBottomWidth: 1, borderBottomColor: colors.border },
  tLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  tIcon: { width: 40, height: 40, borderRadius: 10, backgroundColor: '#fee2e2', alignItems: 'center', justifyContent: 'center' },
  tTitle: { color: colors.dark, fontWeight: '800', fontSize: 14 },
  tDate: { color: colors.muted, fontWeight: '600', fontSize: 12, marginTop: 2 },
  tAmount: { fontWeight: '700', fontSize: 13, color: colors.muted, maxWidth: 150 },
});

export default MedicoRecetasScreen;
