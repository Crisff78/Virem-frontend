// @ts-ignore
import React from 'react';
import { View, Text, StyleSheet, Platform, ScrollView, TouchableOpacity } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useMedicoModule } from '../../navigation/MedicoModuleContext';
import { usePortalAwareMedicoNavigation } from '../../navigation/usePortalAwareMedicoNavigation';
import { useWindowDimensions } from 'react-native';

const colors = {
  primary: '#137fec',
  bg: '#F6FAFD',
  dark: '#0A1931',
  muted: '#4A7FA7',
  green: '#22c55e',
  red: '#ef4444',
  white: '#FFFFFF',
  orange: '#f97316',
};

const DUMMY_TRANSACTIONS = [
  { id: '1', type: 'Ingreso', amount: '+ $1,500.00 DOP', date: 'Hoy, 10:30 AM', patient: 'Juan Pérez' },
  { id: '2', type: 'Ingreso', amount: '+ $2,000.00 DOP', date: 'Ayer, 04:15 PM', patient: 'María Gómez' },
  { id: '3', type: 'Retiro', amount: '- $5,000.00 DOP', date: 'Lun, 12 Oct', patient: 'Transferencia a Banco' },
];

const MedicoFinanzasScreen = (): React.ReactElement => {
  const { isInsidePortal } = useMedicoModule();
  const navigation = usePortalAwareMedicoNavigation();
  const { width: viewportWidth } = useWindowDimensions();
  const isDesktopLayout = Platform.OS === 'web' && viewportWidth >= 1024;

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        
        <View style={styles.header}>
          <Text style={styles.title}>Finanzas y Pagos</Text>
          <Text style={styles.subtitle}>Gestiona tus ingresos y solicita retiros (Módulo en Construcción)</Text>
        </View>

        {/* Resumen Cards */}
        <View style={[styles.cardsRow, !isDesktopLayout && { flexDirection: 'column' }]}>
          <View style={styles.statCard}>
            <View style={styles.statIconBox}>
              <MaterialIcons name="account-balance-wallet" size={24} color={colors.primary} />
            </View>
            <Text style={styles.statTitle}>Balance Disponible</Text>
            <Text style={styles.statValue}>$12,450.00</Text>
            <TouchableOpacity style={styles.withdrawBtn} onPress={() => alert('Función de retiro próximamente')}>
              <Text style={styles.withdrawBtnText}>Solicitar Retiro</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.statCard}>
            <View style={[styles.statIconBox, { backgroundColor: '#dcfce7' }]}>
              <MaterialIcons name="trending-up" size={24} color={colors.green} />
            </View>
            <Text style={styles.statTitle}>Ingresos este mes</Text>
            <Text style={styles.statValue}>$34,200.00</Text>
            <Text style={styles.statHint}>+15% vs mes anterior</Text>
          </View>

          <View style={styles.statCard}>
            <View style={[styles.statIconBox, { backgroundColor: '#ffedd5' }]}>
              <MaterialIcons name="pending-actions" size={24} color={colors.orange} />
            </View>
            <Text style={styles.statTitle}>Pagos en tránsito</Text>
            <Text style={styles.statValue}>$3,500.00</Text>
            <Text style={styles.statHint}>Se liberarán en 48h</Text>
          </View>
        </View>

        {/* Historial */}
        <View style={styles.historySection}>
          <Text style={styles.sectionTitle}>Historial de Transacciones</Text>
          
          <View style={styles.listContainer}>
            {DUMMY_TRANSACTIONS.map((t) => (
              <View key={t.id} style={styles.transactionRow}>
                <View style={styles.tLeft}>
                  <View style={[styles.tIcon, { backgroundColor: t.type === 'Ingreso' ? '#dcfce7' : '#fee2e2' }]}>
                    <MaterialIcons 
                      name={t.type === 'Ingreso' ? 'arrow-downward' : 'arrow-upward'} 
                      size={20} 
                      color={t.type === 'Ingreso' ? colors.green : colors.red} 
                    />
                  </View>
                  <View>
                    <Text style={styles.tTitle}>{t.type === 'Ingreso' ? `Consulta - ${t.patient}` : t.patient}</Text>
                    <Text style={styles.tDate}>{t.date}</Text>
                  </View>
                </View>
                <Text style={[styles.tAmount, { color: t.type === 'Ingreso' ? colors.green : colors.dark }]}>
                  {t.amount}
                </Text>
              </View>
            ))}
          </View>
        </View>

      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  scrollContent: { padding: 24, paddingBottom: 60 },
  header: { marginBottom: 20 },
  title: { fontSize: 28, fontWeight: '900', color: colors.dark },
  subtitle: { fontSize: 14, color: colors.muted, marginTop: 4, fontWeight: '600' },
  
  cardsRow: { flexDirection: 'row', gap: 16, marginBottom: 24 },
  statCard: { 
    flex: 1, 
    backgroundColor: '#fff', 
    padding: 20, 
    borderRadius: 16,
    shadowColor: colors.dark,
    shadowOpacity: 0.05,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  statIconBox: { width: 48, height: 48, borderRadius: 12, backgroundColor: '#e0f2fe', alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  statTitle: { color: colors.muted, fontSize: 13, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },
  statValue: { color: colors.dark, fontSize: 28, fontWeight: '900', marginTop: 4 },
  statHint: { color: colors.muted, fontSize: 12, fontWeight: '600', marginTop: 8 },
  withdrawBtn: { marginTop: 12, backgroundColor: colors.primary, paddingVertical: 10, borderRadius: 8, alignItems: 'center' },
  withdrawBtnText: { color: '#fff', fontWeight: '800', fontSize: 13 },

  historySection: { marginTop: 10 },
  sectionTitle: { fontSize: 18, fontWeight: '900', color: colors.dark, marginBottom: 12 },
  listContainer: { backgroundColor: '#fff', borderRadius: 16, overflow: 'hidden', borderWidth: 1, borderColor: '#eef2f7' },
  transactionRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, borderBottomWidth: 1, borderBottomColor: '#eef2f7' },
  tLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  tIcon: { width: 40, height: 40, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  tTitle: { color: colors.dark, fontWeight: '800', fontSize: 14 },
  tDate: { color: colors.muted, fontWeight: '600', fontSize: 12, marginTop: 2 },
  tAmount: { fontWeight: '900', fontSize: 15 },
});

export default MedicoFinanzasScreen;
