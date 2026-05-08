import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useFocusEffect, useRoute, RouteProp } from '@react-navigation/native';
import { usePortalAwareMedicoNavigation } from './navigation/usePortalAwareMedicoNavigation';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import type { RootStackParamList } from './navigation/types';
import { apiClient } from './utils/api';
import { getApiErrorMessage } from './utils/apiErrors';
import { formatCedula, formatPhone } from './utils/formatters';

type MedicoPacienteDetalleRouteProp = RouteProp<RootStackParamList, 'MedicoPacienteDetalle'>;

interface PatientData {
  pacienteid?: string;
  nombres?: string;
  apellidos?: string;
  fechanacimiento?: string;
  genero?: string;
  cedula?: string;
  telefono?: string;
  fecharegistro?: string;
  alergias?: string;
  medicamentos?: string;
  antecedentes?: string;
  tipo_sangre?: string;
  direccion?: string;
}

const MedicoPacienteDetalleScreen: React.FC = () => {
  const navigation = usePortalAwareMedicoNavigation();
  const route = useRoute<MedicoPacienteDetalleRouteProp>();
  const { patientId, patientName } = route.params;

  const [loading, setLoading] = useState(true);
  const [patient, setPatient] = useState<PatientData | null>(null);

  const loadData = useCallback(async () => {
    if (!patientId || patientId.startsWith('patient:')) {
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const patientPayload = await apiClient.get<any>(`/api/pacientes/${patientId}`, {
        authenticated: true,
        query: { _t: Date.now() },
      });

      if (patientPayload?.success && patientPayload.paciente) {
        setPatient(patientPayload.paciente);
      }
    } catch (err) {
      console.log('[MedicoPacienteDetalle] Error fetching patient:', err);
    } finally {
      setLoading(false);
    }
  }, [patientId]);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  const calculateAge = (birthDate?: string) => {
    if (!birthDate) return 'N/A';
    try {
      const today = new Date();
      const birth = new Date(birthDate);
      if (isNaN(birth.getTime())) return 'N/A';
      
      let age = today.getFullYear() - birth.getFullYear();
      const m = today.getMonth() - birth.getMonth();
      if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
        age--;
      }
      return `${age} años`;
    } catch {
      return 'N/A';
    }
  };

  const displayName = (patient 
    ? `${patient.nombres || ''} ${patient.apellidos || ''}`.trim() 
    : '') || patientName;

  if (loading && !patient) {
    return (
      <View style={styles.loaderWrap}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loaderText}>Cargando detalles del paciente...</Text>
      </View>
    );
  }

  const MedicalInfoField = ({ label, value, icon }: { label: string; value?: string; icon: string }) => (
    <View style={styles.medicalInfoItem}>
      <View style={styles.medicalInfoHeader}>
        <MaterialIcons name={icon as any} size={18} color={colors.primary} />
        <Text style={styles.medicalInfoLabel}>{label}</Text>
      </View>
      <View style={styles.medicalInfoValueBox}>
        <Text style={[styles.medicalInfoValue, !value && { color: colors.muted, fontStyle: 'italic' }]}>
          {value || 'Sin información registrada'}
        </Text>
      </View>
    </View>
  );

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <ScrollView style={styles.main} contentContainerStyle={{ paddingBottom: 40 }}>
        <View style={styles.headerRow}>
          <TouchableOpacity 
            style={styles.backBtn} 
            onPress={() => navigation.goBack()}
          >
            <MaterialIcons name="arrow-back" size={24} color={colors.dark} />
          </TouchableOpacity>
          <Text style={styles.pageTitle}>Detalles del Paciente</Text>
        </View>

        {/* Información Personal */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <MaterialIcons name="person" size={22} color={colors.primary} />
            <Text style={styles.cardTitle}>Información Personal</Text>
          </View>
          
          <View style={styles.infoGrid}>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Nombre Completo</Text>
              <Text style={styles.infoValue}>{displayName || 'N/A'}</Text>
            </View>
            
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Edad</Text>
              <Text style={styles.infoValue}>{calculateAge(patient?.fechanacimiento)}</Text>
            </View>

            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Género</Text>
              <Text style={styles.infoValue}>{patient?.genero || 'No especificado'}</Text>
            </View>

            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Cédula</Text>
              <Text style={styles.infoValue}>{formatCedula(patient?.cedula)}</Text>
            </View>

            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Teléfono</Text>
              <Text style={styles.infoValue}>{formatPhone(patient?.telefono)}</Text>
            </View>

            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Tipo de Sangre</Text>
              <Text style={styles.infoValue}>{patient?.tipo_sangre || 'N/A'}</Text>
            </View>
          </View>

          {patient?.direccion && (
            <View style={[styles.infoItem, { marginTop: 16 }]}>
              <Text style={styles.infoLabel}>Dirección</Text>
              <Text style={styles.infoValue}>{patient.direccion}</Text>
            </View>
          )}
        </View>

        {/* Información Médica Relevante */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <MaterialIcons name="medical-services" size={22} color={colors.primary} />
            <Text style={styles.cardTitle}>Información Médica Relevante</Text>
          </View>

          <MedicalInfoField 
            label="Alergias" 
            value={patient?.alergias} 
            icon="warning" 
          />
          <MedicalInfoField 
            label="Medicamentos actuales" 
            value={patient?.medicamentos} 
            icon="pill" 
          />
          <MedicalInfoField 
            label="Antecedentes médicos" 
            value={patient?.antecedentes} 
            icon="history" 
          />
        </View>

        {!patient && !loading && (
          <View style={styles.warningBox}>
            <MaterialIcons name="info" size={20} color="#856404" />
            <Text style={styles.warningText}>
              No se encontraron registros adicionales para este paciente en el sistema central.
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
};

const colors = {
  primary: '#137fec',
  bg: '#F6FAFD',
  dark: '#0A1931',
  muted: '#4A7FA7',
  light: '#B3CFE5',
  white: '#FFFFFF',
};

const styles = StyleSheet.create({
  loaderWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.bg,
  },
  loaderText: { color: colors.muted, fontSize: 14, fontWeight: '700', marginTop: 12 },
  main: { flex: 1, paddingHorizontal: 20 },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Platform.OS === 'web' ? 32 : 14,
    marginBottom: 20,
    gap: 16,
  },
  backBtn: {
    backgroundColor: '#fff',
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  pageTitle: { color: colors.dark, fontSize: 24, fontWeight: '900' },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 15,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    paddingBottom: 12,
  },
  cardTitle: { color: colors.dark, fontSize: 18, fontWeight: '800' },
  infoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 20,
  },
  infoItem: {
    minWidth: '45%',
    flex: 1,
  },
  infoLabel: { color: colors.muted, fontSize: 12, fontWeight: '700', marginBottom: 4 },
  infoValue: { color: colors.dark, fontSize: 15, fontWeight: '700' },
  medicalInfoItem: {
    marginBottom: 16,
  },
  medicalInfoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  medicalInfoLabel: {
    color: colors.dark,
    fontSize: 14,
    fontWeight: '800',
  },
  medicalInfoValueBox: {
    backgroundColor: '#f8fafc',
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  medicalInfoValue: {
    color: colors.dark,
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '500',
  },
  warningBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff3cd',
    borderWidth: 1,
    borderColor: '#ffeeba',
    borderRadius: 12,
    padding: 12,
    gap: 10,
  },
  warningText: {
    color: '#856404',
    fontSize: 13,
    fontWeight: '600',
    flex: 1,
  },
});

export default MedicoPacienteDetalleScreen;
