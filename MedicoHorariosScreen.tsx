import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, StyleSheet, Platform, ScrollView, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { useMedicoModule } from './navigation/MedicoModuleContext';
import { usePortalAwareMedicoNavigation } from './navigation/usePortalAwareMedicoNavigation';
import { useWindowDimensions } from 'react-native';
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
};

type Disponibilidad = {
  id: string;
  fechaInicio: string;
  fechaFin: string;
  modalidad: string;
  slotMinutos: number;
  bloqueado: boolean;
};

const formatTime = (isoString: string) => {
  const d = new Date(isoString);
  if (isNaN(d.getTime())) return '';
  return new Intl.DateTimeFormat('es-DO', { hour: '2-digit', minute: '2-digit' }).format(d);
};

const formatDate = (isoString: string) => {
  const d = new Date(isoString);
  if (isNaN(d.getTime())) return '';
  return new Intl.DateTimeFormat('es-DO', { weekday: 'long', day: '2-digit', month: 'short' }).format(d);
};

const MedicoHorariosScreen: React.FC = () => {
  const { isInsidePortal } = useMedicoModule();
  const navigation = usePortalAwareMedicoNavigation();
  const { width: viewportWidth } = useWindowDimensions();
  const isDesktopLayout = Platform.OS === 'web' && viewportWidth >= 1024;

  const [loading, setLoading] = useState(true);
  const [horarios, setHorarios] = useState<Disponibilidad[]>([]);

  const fetchHorarios = useCallback(async () => {
    setLoading(true);
    try {
      const now = new Date();
      const end = new Date();
      end.setDate(now.getDate() + 30); // Próximos 30 días

      const payload = await apiClient.get<any>('/api/agenda/medico/me/disponibilidades', {
        authenticated: true,
        query: { from: now.toISOString(), to: end.toISOString() },
      });

      if (payload?.success && Array.isArray(payload.disponibilidades)) {
        setHorarios(payload.disponibilidades);
      } else {
        setHorarios([]);
      }
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'No se pudieron cargar los horarios.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchHorarios();
  }, [fetchHorarios]);

  const handleBloquear = async (id: string, bloqueadoActual: boolean) => {
    try {
      const payload = await apiClient.patch<any>(`/api/agenda/medico/me/disponibilidades/${id}/bloquear`, {
        authenticated: true,
        body: { bloqueado: !bloqueadoActual },
      });
      if (payload?.success) {
        fetchHorarios();
      } else {
        Alert.alert('Error', 'No se pudo actualizar el estado.');
      }
    } catch (error) {
      Alert.alert('Error', 'Error de conexión.');
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>Disponibilidad</Text>
            <Text style={styles.subtitle}>Gestiona tus horarios para los próximos 30 días</Text>
          </View>
          <TouchableOpacity style={styles.addBtn} onPress={() => Alert.alert('Próximamente', 'Formulario para agregar nuevo horario no implementado aún.')}>
            <MaterialIcons name="add" size={20} color="#fff" />
            <Text style={styles.addBtnText}>Nuevo Horario</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.listContainer}>
          {loading ? (
            <ActivityIndicator size="large" color={colors.primary} style={{ padding: 40 }} />
          ) : horarios.length === 0 ? (
            <View style={styles.emptyBox}>
              <MaterialIcons name="event-busy" size={40} color={colors.muted} />
              <Text style={styles.emptyText}>No tienes horarios configurados</Text>
              <Text style={styles.emptySub}>Los pacientes no podrán agendar citas contigo hasta que agregues disponibilidad.</Text>
            </View>
          ) : (
            horarios.map((h) => (
              <View key={h.id} style={[styles.row, h.bloqueado && styles.rowBlocked]}>
                <View style={styles.rowLeft}>
                  <View style={[styles.iconBox, { backgroundColor: h.bloqueado ? '#fee2e2' : '#dcfce7' }]}>
                    <MaterialIcons name={h.bloqueado ? 'lock' : 'event-available'} size={24} color={h.bloqueado ? colors.red : colors.green} />
                  </View>
                  <View>
                    <Text style={[styles.dateText, h.bloqueado && { color: colors.muted }]}>
                      {formatDate(h.fechaInicio)}
                    </Text>
                    <Text style={styles.timeText}>
                      {formatTime(h.fechaInicio)} - {formatTime(h.fechaFin)}
                    </Text>
                    <View style={styles.badgesRow}>
                      <View style={styles.badge}>
                        <Text style={styles.badgeText}>{h.modalidad}</Text>
                      </View>
                      <View style={styles.badge}>
                        <Text style={styles.badgeText}>{h.slotMinutos} min</Text>
                      </View>
                    </View>
                  </View>
                </View>

                <TouchableOpacity 
                  style={[styles.toggleBtn, h.bloqueado ? styles.toggleBtnUnblock : styles.toggleBtnBlock]}
                  onPress={() => handleBloquear(h.id, h.bloqueado)}
                >
                  <Text style={[styles.toggleBtnText, h.bloqueado && { color: colors.primary }]}>
                    {h.bloqueado ? 'Desbloquear' : 'Bloquear'}
                  </Text>
                </TouchableOpacity>
              </View>
            ))
          )}
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

  listContainer: { backgroundColor: '#fff', borderRadius: 16, borderWidth: 1, borderColor: colors.border, overflow: 'hidden' },
  
  emptyBox: { padding: 40, alignItems: 'center', justifyContent: 'center' },
  emptyText: { color: colors.dark, fontSize: 16, fontWeight: '800', marginTop: 12 },
  emptySub: { color: colors.muted, fontSize: 13, textAlign: 'center', marginTop: 8, maxWidth: 300 },

  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: colors.border, flexWrap: 'wrap', gap: 14 },
  rowBlocked: { backgroundColor: '#f8fafc', opacity: 0.8 },
  rowLeft: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  
  iconBox: { width: 48, height: 48, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  dateText: { fontSize: 15, fontWeight: '800', color: colors.dark, textTransform: 'capitalize' },
  timeText: { fontSize: 13, fontWeight: '700', color: colors.muted, marginTop: 2 },
  
  badgesRow: { flexDirection: 'row', gap: 8, marginTop: 6 },
  badge: { backgroundColor: '#f1f5f9', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  badgeText: { fontSize: 10, fontWeight: '800', color: colors.muted, textTransform: 'uppercase' },

  toggleBtn: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8, borderWidth: 1 },
  toggleBtnBlock: { backgroundColor: '#fff', borderColor: colors.border },
  toggleBtnUnblock: { backgroundColor: 'rgba(19,127,236,0.1)', borderColor: 'rgba(19,127,236,0.2)' },
  toggleBtnText: { fontWeight: '700', fontSize: 13, color: colors.dark },
});

export default MedicoHorariosScreen;
