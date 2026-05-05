import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Platform,
  Dimensions,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useResponsive } from './hooks/useResponsive';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from './navigation/types';

// IT-Specific Colors (Tech/Cyber Theme)
const colors = {
  bg: '#0A0E17',
  surface: '#161B22',
  primary: '#58A6FF',
  secondary: '#238636',
  warning: '#D29922',
  danger: '#F85149',
  text: '#C9D1D9',
  muted: '#8B949E',
  border: '#30363D',
  terminalBg: '#010409',
};

type ITTab = 'overview' | 'infrastructure' | 'users' | 'logs' | 'config';

const ITAdminDashboardScreen: React.FC = () => {
  const { rs, fs, isDesktop } = useResponsive();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  
  const [activeTab, setActiveTab] = useState<ITTab>('overview');
  const [isSidebarOpen, setIsSidebarOpen] = useState(isDesktop);
  const [systemHealth, setSystemHealth] = useState(98);
  const [apiLatency, setApiLatency] = useState(42);
  const [logs, setLogs] = useState<string[]>([
    '[SYSTEM] Booting IT Administration Module...',
    '[AUTH] Root access granted to IT-DEPT-USER',
    '[INFRA] Database connectivity: STABLE (0.4ms)',
    '[API] Load balancer distribution: OPTIMAL',
  ]);

  // Mock real-time updates
  useEffect(() => {
    const interval = setInterval(() => {
      setApiLatency(prev => Math.max(30, Math.min(prev + (Math.random() * 10 - 5), 150)));
      setSystemHealth(prev => Math.max(90, Math.min(prev + (Math.random() * 2 - 1), 100)));
      
      const newLog = `[${new Date().toLocaleTimeString()}] ${getRandomLog()}`;
      setLogs(prev => [newLog, ...prev].slice(0, 50));
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const getRandomLog = () => {
    const events = [
      'GET /api/v1/patient/profile 200 OK',
      'POST /api/v1/consultation/sync 201 Created',
      'WebSocket: User connected to CHAT-ROOM-742',
      'Cache: Refreshed token for MEDIC-ID-88',
      'DB: Optimized index on table "Citas"',
      'Worker: Processed notification queue (14 items)',
    ];
    return events[Math.floor(Math.random() * events.length)];
  };

  const renderSidebar = () => (
    <View style={[styles.sidebar, !isSidebarOpen && styles.sidebarClosed]}>
      <View style={styles.sidebarHeader}>
        <MaterialIcons name="security" size={28} color={colors.primary} />
        {isSidebarOpen && <Text style={styles.sidebarTitle}>IT OPS CENTER</Text>}
      </View>

      <View style={styles.sidebarContent}>
        <SidebarItem 
          icon="dashboard" 
          label="Overview" 
          active={activeTab === 'overview'} 
          onPress={() => setActiveTab('overview')} 
          isOpen={isSidebarOpen}
        />
        <SidebarItem 
          icon="dns" 
          label="Infrastructure" 
          active={activeTab === 'infrastructure'} 
          onPress={() => setActiveTab('infrastructure')} 
          isOpen={isSidebarOpen}
        />
        <SidebarItem 
          icon="people" 
          label="User Mgmt" 
          active={activeTab === 'users'} 
          onPress={() => setActiveTab('users')} 
          isOpen={isSidebarOpen}
        />
        <SidebarItem 
          icon="terminal" 
          label="System Logs" 
          active={activeTab === 'logs'} 
          onPress={() => setActiveTab('logs')} 
          isOpen={isSidebarOpen}
        />
        <SidebarItem 
          icon="settings" 
          label="Configuration" 
          active={activeTab === 'config'} 
          onPress={() => setActiveTab('config')} 
          isOpen={isSidebarOpen}
        />
      </View>

      <View style={styles.sidebarFooter}>
        <TouchableOpacity style={styles.logoutBtn} onPress={() => navigation.goBack()}>
          <MaterialIcons name="exit-to-app" size={20} color={colors.danger} />
          {isSidebarOpen && <Text style={styles.logoutText}>Exit Portal</Text>}
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderContent = () => {
    switch(activeTab) {
      case 'overview': return renderOverview();
      case 'logs': return renderLogs();
      default: return (
        <View style={styles.center}>
          <Text style={styles.placeholderText}>{activeTab.toUpperCase()} Module Loading...</Text>
          <ActivityIndicator color={colors.primary} style={{ marginTop: 20 }} />
        </View>
      );
    }
  };

  const renderOverview = () => (
    <ScrollView contentContainerStyle={styles.scrollContent}>
      <View style={styles.statsGrid}>
        <StatCard 
          label="System Health" 
          value={`${systemHealth.toFixed(1)}%`} 
          icon="favorite" 
          color={systemHealth > 95 ? colors.secondary : colors.warning} 
        />
        <StatCard 
          label="Avg Latency" 
          value={`${apiLatency.toFixed(0)}ms`} 
          icon="speed" 
          color={apiLatency < 100 ? colors.primary : colors.danger} 
        />
        <StatCard 
          label="Active Sessions" 
          value="1,284" 
          icon="wifi" 
          color={colors.primary} 
        />
        <StatCard 
          label="DB Load" 
          value="12%" 
          icon="storage" 
          color={colors.secondary} 
        />
      </View>

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Infrastructure Status</Text>
      </View>

      <View style={styles.infraList}>
        <InfraItem name="API Gateway" status="Healthy" uptime="99.98%" />
        <InfraItem name="Database Cluster" status="Healthy" uptime="100%" />
        <InfraItem name="Media Server (Video)" status="Degraded" uptime="98.5%" warning />
        <InfraItem name="Notification Worker" status="Healthy" uptime="99.9%" />
      </View>

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Recent Activity (Live)</Text>
      </View>

      <View style={styles.terminal}>
        {logs.slice(0, 8).map((log, idx) => (
          <Text key={idx} style={styles.terminalText}>{log}</Text>
        ))}
      </View>
    </ScrollView>
  );

  const renderLogs = () => (
    <View style={[styles.terminalContainer, { flex: 1 }]}>
      <View style={styles.terminalHeader}>
        <Text style={styles.terminalTitle}>system_stdout_stream.log</Text>
        <View style={styles.dotRow}>
          <View style={[styles.dot, { backgroundColor: '#FF5F56' }]} />
          <View style={[styles.dot, { backgroundColor: '#FFBD2E' }]} />
          <View style={[styles.dot, { backgroundColor: '#27C93F' }]} />
        </View>
      </View>
      <ScrollView style={styles.terminalScroll} inverted>
        {logs.map((log, idx) => (
          <Text key={idx} style={styles.terminalLine}>{log}</Text>
        ))}
      </ScrollView>
    </View>
  );

  return (
    <View style={styles.container}>
      {renderSidebar()}
      
      <View style={styles.mainContent}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => setIsSidebarOpen(!isSidebarOpen)} style={styles.iconBtn}>
            <MaterialIcons name="menu" size={24} color={colors.text} />
          </TouchableOpacity>
          
          <View style={styles.headerRight}>
            <View style={styles.statusIndicator}>
              <View style={styles.pulse} />
              <Text style={styles.statusText}>Network: Stable</Text>
            </View>
            <View style={styles.adminAvatar}>
              <Text style={styles.avatarText}>IT</Text>
            </View>
          </View>
        </View>

        {renderContent()}
      </View>
    </View>
  );
};

// --- Subcomponents ---

const SidebarItem = ({ icon, label, active, onPress, isOpen }: any) => (
  <TouchableOpacity 
    style={[styles.sidebarItem, active && styles.sidebarItemActive]} 
    onPress={onPress}
  >
    <MaterialIcons name={icon} size={22} color={active ? colors.primary : colors.muted} />
    {isOpen && <Text style={[styles.sidebarItemText, active && styles.sidebarItemTextActive]}>{label}</Text>}
  </TouchableOpacity>
);

const StatCard = ({ label, value, icon, color }: any) => (
  <View style={styles.statCard}>
    <View style={[styles.statIconBox, { backgroundColor: `${color}15` }]}>
      <MaterialIcons name={icon} size={20} color={color} />
    </View>
    <View>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={[styles.statValue, { color: colors.text }]}>{value}</Text>
    </View>
  </View>
);

const InfraItem = ({ name, status, uptime, warning }: any) => (
  <View style={styles.infraItem}>
    <View style={styles.infraLeft}>
      <MaterialIcons 
        name={warning ? 'warning' : 'check-circle'} 
        size={18} 
        color={warning ? colors.warning : colors.secondary} 
      />
      <Text style={styles.infraName}>{name}</Text>
    </View>
    <View style={styles.infraRight}>
      <Text style={styles.infraUptime}>{uptime} Uptime</Text>
      <View style={[styles.statusBadge, { backgroundColor: warning ? `${colors.warning}20` : `${colors.secondary}20` }]}>
        <Text style={[styles.statusBadgeText, { color: warning ? colors.warning : colors.secondary }]}>{status}</Text>
      </View>
    </View>
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg, flexDirection: 'row' },
  sidebar: {
    width: 260,
    backgroundColor: colors.surface,
    borderRightWidth: 1,
    borderRightColor: colors.border,
    paddingVertical: 20,
  },
  sidebarClosed: { width: 70 },
  sidebarHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 40,
    gap: 12,
  },
  sidebarTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: 1,
  },
  sidebarContent: { flex: 1, paddingHorizontal: 12 },
  sidebarItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginBottom: 4,
    gap: 12,
  },
  sidebarItemActive: { backgroundColor: `${colors.primary}10` },
  sidebarItemText: { color: colors.muted, fontWeight: '700', fontSize: 14 },
  sidebarItemTextActive: { color: colors.primary },
  sidebarFooter: { paddingHorizontal: 20, paddingTop: 20, borderTopWidth: 1, borderTopColor: colors.border },
  logoutBtn: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  logoutText: { color: colors.danger, fontWeight: '700' },

  mainContent: { flex: 1 },
  header: {
    height: 70,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    backgroundColor: colors.bg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 20 },
  iconBtn: { padding: 4 },
  statusIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#1C2128',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  pulse: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.secondary,
  },
  statusText: { color: colors.muted, fontSize: 12, fontWeight: '700' },
  adminAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { color: '#fff', fontWeight: '900', fontSize: 14 },

  scrollContent: { padding: 24 },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    marginBottom: 32,
  },
  statCard: {
    flex: 1,
    minWidth: 200,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  statIconBox: {
    width: 40,
    height: 40,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statLabel: { color: colors.muted, fontSize: 12, fontWeight: '700', marginBottom: 4 },
  statValue: { fontSize: 24, fontWeight: '900' },

  sectionHeader: { marginBottom: 16, marginTop: 16 },
  sectionTitle: { color: '#fff', fontSize: 16, fontWeight: '800' },
  
  infraList: { gap: 12, marginBottom: 32 },
  infraItem: {
    backgroundColor: colors.surface,
    padding: 16,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: colors.border,
  },
  infraLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  infraName: { color: colors.text, fontWeight: '700', fontSize: 14 },
  infraRight: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  infraUptime: { color: colors.muted, fontSize: 12 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6 },
  statusBadgeText: { fontSize: 11, fontWeight: '900' },

  terminal: {
    backgroundColor: colors.terminalBg,
    padding: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  terminalText: {
    color: '#3FB950',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontSize: 12,
    lineHeight: 20,
  },

  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  placeholderText: { color: colors.muted, fontSize: 16, fontWeight: '700' },

  terminalContainer: {
    margin: 24,
    backgroundColor: colors.terminalBg,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
  },
  terminalHeader: {
    height: 40,
    backgroundColor: colors.surface,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
  },
  terminalTitle: { color: colors.muted, fontSize: 12, fontWeight: '700' },
  dotRow: { flexDirection: 'row', gap: 6 },
  dot: { width: 10, height: 10, borderRadius: 5 },
  terminalScroll: { padding: 20 },
  terminalLine: {
    color: '#D1D5DA',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontSize: 13,
    marginBottom: 6,
  },
});

export default ITAdminDashboardScreen;
