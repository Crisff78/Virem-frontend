import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, StyleSheet, Platform, ScrollView, TouchableOpacity, ActivityIndicator, Alert, TextInput } from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { useMedicoModule } from './navigation/MedicoModuleContext';
import { usePortalAwareMedicoNavigation } from './navigation/usePortalAwareMedicoNavigation';
import { useWindowDimensions } from 'react-native';
import { useMedicoPortalSession } from './hooks/useMedicoPortalSession';
import MedicoHeader from './components/MedicoHeader';
import { apiClient } from './utils/api';

const colors = {
  primary: '#137fec',
  bg: '#F6FAFD',
  dark: '#0A1931',
  muted: '#4A7FA7',
  green: '#22c55e',
  red: '#ef4444',
  white: '#FFFFFF',
  border: '#eef2f7',
  light: '#B3CFE5',
};

type Receta = {
  recetaid: string;
  paciente_nombre: string;
  diagnostico: string;
  created_at: string;
};

const MedicoRecetasScreen: React.FC = () => {
  const { isInsidePortal, isSidebarOpen, toggleSidebar, activeModuleParams } = useMedicoModule();
  const { doctorName, doctorSpec } = useMedicoPortalSession({ syncOnMount: false, addDoctorPrefix: true });
  const navigation = usePortalAwareMedicoNavigation();
  const { width: viewportWidth } = useWindowDimensions();
  const isDesktopLayout = Platform.OS === 'web' && viewportWidth >= 1024;

  const [loading, setLoading] = useState(true);
  const [recetas, setRecetas] = useState<Receta[]>([]);

  // Simple form state
  const [showForm, setShowForm] = useState(false);
  const [pacienteSearch, setPacienteSearch] = useState('');
  const [pacienteId, setPacienteId] = useState('');
  const [pacienteNombre, setPacienteNombre] = useState('');
  const [citaId, setCitaId] = useState('00000000-0000-0000-0000-000000000000');
  const [diagnostico, setDiagnostico] = useState('');
  
  // Advanced state
  const [peso, setPeso] = useState('');
  const [presion, setPresion] = useState('');
  const [temperatura, setTemperatura] = useState('');
  const [medicamentosList, setMedicamentosList] = useState<{ nombre: string; dosis: string; frecuencia: string; duracion: string }[]>([]);
  const [currentMed, setCurrentMed] = useState({ nombre: '', dosis: '', frecuencia: '', duracion: '' });
  const [instrucciones, setInstrucciones] = useState('');
  const [laboratorios, setLaboratorios] = useState('');
  const [firma, setFirma] = useState('');

  // Handle prefill from navigation
  useEffect(() => {
    if (activeModuleParams?.prefill) {
      const { pacienteId: pId, pacienteNombre: pName, citaId: cId } = activeModuleParams.prefill;
      setPacienteId(pId);
      setPacienteNombre(pName);
      setPacienteSearch(pName);
      setCitaId(cId);
      setShowForm(true);
    }
  }, [activeModuleParams]);

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

  const addMedicamento = () => {
    if (!currentMed.nombre || !currentMed.dosis) {
      Alert.alert('Error', 'Indique al menos el nombre y dosis del medicamento');
      return;
    }
    setMedicamentosList([...medicamentosList, currentMed]);
    setCurrentMed({ nombre: '', dosis: '', frecuencia: '', duracion: '' });
  };

  const removeMedicamento = (index: number) => {
    setMedicamentosList(medicamentosList.filter((_, i) => i !== index));
  };

  const handleEmitir = async () => {
    if ((!pacienteId && !pacienteSearch) || !diagnostico || medicamentosList.length === 0) {
      Alert.alert('Error', 'Faltan datos obligatorios (Paciente, Diagnóstico o Medicamentos)');
      return;
    }

    setLoading(true); 
    try {
      const payload = await apiClient.post<any>('/api/medico/me/recetas', {
        authenticated: true,
        body: {
          pacienteid: pacienteId ? parseInt(pacienteId, 10) : undefined,
          paciente_search: !pacienteId ? pacienteSearch : undefined,
          citaid: citaId,
          diagnostico,
          signos_vitales: { peso, presion, temperatura },
          medicamentos: medicamentosList,
          instrucciones,
          ordenes_laboratorio: laboratorios,
          doctor_info: {
            nombre: doctorName,
            especialidad: doctorSpec,
            firma: firma || 'Firma Digital'
          },
          disponible_paciente: true
        },
      });

      if (payload?.success) {
        Alert.alert('Éxito', 'Receta emitida y enviada al paciente correctamente');
        setShowForm(false);
        setPacienteId('');
        setPacienteSearch('');
        setPacienteNombre('');
        setDiagnostico('');
        setMedicamentosList([]);
        setInstrucciones('');
        setLaboratorios('');
        setPeso('');
        setPresion('');
        setTemperatura('');
        setFirma('');
        fetchRecetas();
      } else {
        Alert.alert('Error', payload?.message || 'No se pudo emitir la receta.');
      }
    } catch (error) {
      Alert.alert('Error', 'Error de conexión al emitir receta.');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = (receta: Receta) => {
    // Simulamos descarga o visualización
    Alert.alert('Receta', `Visualizando receta para ${receta.paciente_nombre}\n\nDiagnóstico: ${receta.diagnostico}\n\nEn un entorno real, esto abriría un PDF.`);
  };

  return (
    <View style={styles.container}>
      <View style={{ paddingHorizontal: 20, paddingTop: 18 }}>
        <MedicoHeader title="Recetas y Órdenes" />
      </View>
      <ScrollView contentContainerStyle={[styles.scrollContent, { paddingHorizontal: 20 }]}>
        
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
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <Text style={[styles.sectionTitle, { marginBottom: 0 }]}>Emitir Nueva Receta</Text>
            </View>
            
            <View style={styles.formSection}>
              <Text style={styles.formSectionTitle}>Información del Paciente</Text>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Paciente (Nombre o Cédula)</Text>
                <TextInput 
                  style={[styles.input, pacienteNombre ? { backgroundColor: '#f1f5f9', color: '#64748b' } : null]} 
                  value={pacienteNombre || pacienteSearch} 
                  editable={!pacienteNombre}
                  onChangeText={setPacienteSearch} 
                  placeholder="Escriba el nombre o cédula del paciente..." 
                />
              </View>
              
              <View style={{ flexDirection: 'row', gap: 12, marginTop: 4 }}>
                <View style={[styles.inputGroup, { flex: 1 }]}>
                  <Text style={styles.label}>Peso (lb/kg)</Text>
                  <TextInput style={styles.input} value={peso} onChangeText={setPeso} placeholder="Ej. 165 lb" />
                </View>
                <View style={[styles.inputGroup, { flex: 1 }]}>
                  <Text style={styles.label}>Presión Art.</Text>
                  <TextInput style={styles.input} value={presion} onChangeText={setPresion} placeholder="Ej. 120/80" />
                </View>
                <View style={[styles.inputGroup, { flex: 1 }]}>
                  <Text style={styles.label}>Temp. (°C)</Text>
                  <TextInput style={styles.input} value={temperatura} onChangeText={setTemperatura} placeholder="Ej. 37" />
                </View>
              </View>
            </View>

            <View style={styles.formSection}>
              <Text style={styles.formSectionTitle}>Evaluación Médica</Text>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Diagnóstico y Hallazgos</Text>
                <TextInput 
                  style={[styles.input, { height: 80, textAlignVertical: 'top' }]} 
                  value={diagnostico} 
                  onChangeText={setDiagnostico} 
                  placeholder="Describa el diagnóstico principal y hallazgos relevantes..." 
                  multiline
                />
              </View>
            </View>

            <View style={styles.formSection}>
              <Text style={styles.formSectionTitle}>Tratamiento Farmacológico</Text>
              
              {medicamentosList.length > 0 && (
                <View style={styles.medsList}>
                  {medicamentosList.map((m, idx) => (
                    <View key={idx} style={styles.medItem}>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.medName}>{m.nombre} - <Text style={{ fontWeight: '500' }}>{m.dosis}</Text></Text>
                        <Text style={styles.medFreq}>{m.frecuencia} · {m.duracion}</Text>
                      </View>
                      <TouchableOpacity onPress={() => removeMedicamento(idx)}>
                        <MaterialIcons name="delete-outline" size={22} color={colors.red} />
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              )}

              <View style={styles.medForm}>
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Medicamento</Text>
                  <TextInput style={styles.input} value={currentMed.nombre} onChangeText={(t) => setCurrentMed({...currentMed, nombre: t})} placeholder="Ej. Amoxicilina 500mg" />
                </View>
                <View style={{ flexDirection: 'row', gap: 10 }}>
                  <View style={[styles.inputGroup, { flex: 1 }]}>
                    <Text style={styles.label}>Dosis</Text>
                    <TextInput style={styles.input} value={currentMed.dosis} onChangeText={(t) => setCurrentMed({...currentMed, dosis: t})} placeholder="Ej. 1 caps." />
                  </View>
                  <View style={[styles.inputGroup, { flex: 1 }]}>
                    <Text style={styles.label}>Frecuencia</Text>
                    <TextInput style={styles.input} value={currentMed.frecuencia} onChangeText={(t) => setCurrentMed({...currentMed, frecuencia: t})} placeholder="Ej. C/8h" />
                  </View>
                  <View style={[styles.inputGroup, { flex: 1 }]}>
                    <Text style={styles.label}>Duración</Text>
                    <TextInput style={styles.input} value={currentMed.duracion} onChangeText={(t) => setCurrentMed({...currentMed, duracion: t})} placeholder="Ej. 7 días" />
                  </View>
                </View>
                <TouchableOpacity style={styles.addMedBtn} onPress={addMedicamento}>
                  <MaterialIcons name="add" size={18} color={colors.primary} />
                  <Text style={styles.addMedBtnText}>Añadir a la lista</Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.formSection}>
              <Text style={styles.formSectionTitle}>Información del Médico y Firma</Text>
              <View style={{ flexDirection: 'row', gap: 12, marginBottom: 14 }}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.label}>Médico Responsable</Text>
                  <View style={[styles.input, { backgroundColor: '#f1f5f9' }]}>
                    <Text style={{ color: '#64748b', fontWeight: '700' }}>{doctorName}</Text>
                  </View>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.label}>Especialidad</Text>
                  <View style={[styles.input, { backgroundColor: '#f1f5f9' }]}>
                    <Text style={{ color: '#64748b', fontWeight: '700' }}>{doctorSpec}</Text>
                  </View>
                </View>
              </View>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Firma del Médico</Text>
                <TextInput 
                  style={[styles.input, { height: 60, fontStyle: firma ? 'normal' : 'italic' }]} 
                  value={firma} 
                  onChangeText={setFirma} 
                  placeholder="Escriba su firma aquí..." 
                />
              </View>
            </View>

            <TouchableOpacity style={styles.submitBtn} onPress={handleEmitir}>
              <MaterialIcons name="send" size={20} color="#fff" />
              <Text style={styles.submitBtnText}>Emitir y Enviar al Paciente</Text>
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
                <TouchableOpacity 
                  key={r.recetaid} 
                  style={styles.transactionRow}
                  onPress={() => handleDownload(r)}
                >
                  <View style={styles.tLeft}>
                    <View style={styles.tIcon}>
                      <MaterialIcons name="picture-as-pdf" size={20} color={colors.red} />
                    </View>
                    <View>
                      <Text style={styles.tTitle}>{r.paciente_nombre}</Text>
                      <Text style={styles.tDate}>{new Date(r.created_at).toLocaleDateString()}</Text>
                    </View>
                  </View>
                  <View style={{ alignItems: 'flex-end' }}>
                    <Text style={styles.tAmount} numberOfLines={1}>{r.diagnostico}</Text>
                    <MaterialIcons name="download" size={16} color={colors.primary} style={{ marginTop: 4 }} />
                  </View>
                </TouchableOpacity>
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

  formContainer: { backgroundColor: '#fff', padding: 24, borderRadius: 20, marginBottom: 24, borderWidth: 1, borderColor: colors.border, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10, elevation: 2 },
  formSection: { marginBottom: 24, paddingBottom: 20, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  formSectionTitle: { fontSize: 15, fontWeight: '800', color: colors.primary, marginBottom: 16, letterSpacing: 0.5, textTransform: 'uppercase' },
  inputGroup: { marginBottom: 14 },
  label: { fontSize: 13, fontWeight: '700', color: colors.dark, marginBottom: 6 },
  input: { backgroundColor: '#f8fafc', borderWidth: 1, borderColor: colors.border, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, color: colors.dark, fontWeight: '600', fontSize: 14 },
  
  medsList: { marginBottom: 16, gap: 10 },
  medItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f0f9ff', padding: 12, borderRadius: 12, borderWidth: 1, borderColor: '#bae6fd' },
  medName: { fontSize: 14, fontWeight: '800', color: colors.dark },
  medFreq: { fontSize: 12, color: colors.muted, fontWeight: '600', marginTop: 2 },
  
  medForm: { backgroundColor: '#f8fafc', padding: 16, borderRadius: 14, borderStyle: 'dashed', borderWidth: 1, borderColor: colors.light },
  addMedBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 12, padding: 8 },
  addMedBtnText: { color: colors.primary, fontWeight: '800', fontSize: 13 },

  submitBtn: { backgroundColor: colors.green, padding: 18, borderRadius: 14, alignItems: 'center', marginTop: 10, flexDirection: 'row', justifyContent: 'center', gap: 10 },
  submitBtnText: { color: '#fff', fontWeight: '900', fontSize: 16 },

  historySection: { marginTop: 10 },
  sectionTitle: { fontSize: 22, fontWeight: '900', color: colors.dark, marginBottom: 16 },
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
