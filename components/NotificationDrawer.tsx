import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Dimensions,
  Image,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useLanguage } from '../localization/LanguageContext';
import { apiUrl } from '../config/backend';
import { useSocketEvent } from '../hooks/useSocketEvent';
import { getAuthToken } from '../utils/session';
import { colors } from '../theme/colors';
import { spacing, radii } from '../theme/spacing';
import { usePacienteModule } from '../navigation/PacienteModuleContext';

const DRAWER_WIDTH_RATIO = 0.88;
const DRAWER_MAX_WIDTH = 400;

type NotificationItem = {
  id: string;
  title: string;
  message: string;
  time: string;
  unread: boolean;
  icon: string;
  color: string;
  section: 'HOY' | 'AYER' | 'ESTA SEMANA';
  type: 'citas' | 'mensajes' | 'documentos';
  action?: string;
  createdAt?: string | null;
};

const sectionOrder: Array<'HOY' | 'AYER' | 'ESTA SEMANA'> = [
  'HOY',
  'AYER',
  'ESTA SEMANA',
];

const toRelativeTime = (value: string | null | undefined) => {
  const date = value ? new Date(value) : null;
  if (!date || Number.isNaN(date.getTime())) return 'Ahora';
  const diffMs = Date.now() - date.getTime();
  if (diffMs < 60000) return 'hace segundos';
  const diffMin = Math.round(diffMs / 60000);
  if (diffMin < 60) return `hace ${diffMin} min`;
  const diffHour = Math.round(diffMin / 60);
  if (diffHour < 24) return `hace ${diffHour} h`;
  const diffDay = Math.round(diffHour / 24);
  if (diffDay < 7) return `hace ${diffDay} dia(s)`;
  return new Intl.DateTimeFormat('es-DO', {
    day: '2-digit',
    month: 'short',
  }).format(date);
};

const resolveSection = (value: string | null | undefined): NotificationItem['section'] => {
  const date = value ? new Date(value) : null;
  if (!date || Number.isNaN(date.getTime())) return 'HOY';
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const target = new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
  const diffDays = Math.floor((today - target) / (24 * 60 * 60 * 1000));
  if (diffDays <= 0) return 'HOY';
  if (diffDays === 1) return 'AYER';
  return 'ESTA SEMANA';
};

const mapNotification = (item: any): NotificationItem => {
  const tipo = String(item?.tipo || '').toLowerCase();
  let type: NotificationItem['type'] = 'citas';
  let icon = 'notifications';
  let color = colors.primary;
  let action = 'Ver detalles';

  if (tipo.includes('mensaje')) {
    type = 'mensajes';
    icon = 'mail';
    action = 'Responder';
  } else if (tipo.includes('documento') || tipo.includes('receta')) {
    type = 'documentos';
    icon = 'description';
    action = 'Ver documento';
  } else if (tipo.includes('video')) {
    icon = 'videocam';
    action = 'Entrar a sala';
  }

  return {
    id: String(item?.id || Math.random()),
    title: String(item?.titulo || 'Notificación'),
    message: String(item?.contenido || ''),
    time: toRelativeTime(item?.createdAt),
    unread: !Boolean(item?.leida),
    icon,
    color,
    section: resolveSection(item?.createdAt),
    type,
    action,
    createdAt: item?.createdAt,
  };
};

export const NotificationDrawer: React.FC = () => {
  const { isNotificationsOpen, setNotificationsOpen, portalNavigate } = usePacienteModule();
  const { t } = useLanguage();
  const { width } = useWindowDimensions();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(false);
  
  const drawerWidth = Math.min(DRAWER_MAX_WIDTH, width * DRAWER_WIDTH_RATIO);
  const slideAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(slideAnim, {
      toValue: isNotificationsOpen ? 1 : 0,
      duration: 300,
      useNativeDriver: true,
    }).start();

    if (isNotificationsOpen) {
      loadNotifications();
    }
  }, [isNotificationsOpen, slideAnim]);

  const loadNotifications = async () => {
    setLoading(true);
    try {
      const token = await getAuthToken();
      if (!token) return;
      const response = await fetch(apiUrl('/api/agenda/me/notificaciones?limit=80'), {
        headers: { Authorization: `Bearer ${token}` },
      });
      const payload = await response.json();
      if (payload?.success && Array.isArray(payload?.notificaciones)) {
        setNotifications(payload.notificaciones.map(mapNotification));
      }
    } catch {
      // silent fail
    } finally {
      setLoading(false);
    }
  };

  const markAllRead = async () => {
    try {
      const token = await getAuthToken();
      if (!token) return;
      await fetch(apiUrl('/api/agenda/me/notificaciones/leer-todas'), {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}` },
      });
      setNotifications(prev => prev.map(n => ({ ...n, unread: false })));
    } catch { }
  };

  const handleAction = (item: NotificationItem) => {
    setNotificationsOpen(false);
    if (item.type === 'mensajes') portalNavigate('PacienteChat');
    else if (item.type === 'citas') portalNavigate('PacienteCitas');
    else portalNavigate('PacienteRecetasDocumentos');
  };

  const translateX = slideAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [drawerWidth, 0],
  });

  const backdropOpacity = slideAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 0.4],
  });

  if (!isNotificationsOpen && (slideAnim as any)._value === 0) return null;

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents={isNotificationsOpen ? 'auto' : 'none'}>
      <Animated.View style={[styles.backdrop, { opacity: backdropOpacity }]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={() => setNotificationsOpen(false)} />
      </Animated.View>

      <Animated.View style={[styles.drawer, { width: drawerWidth, transform: [{ translateX }] }]}>
        <View style={styles.header}>
          <View style={styles.headerTitleRow}>
            <MaterialIcons name="notifications-none" size={24} color={colors.primary} />
            <Text style={styles.title}>Notificaciones</Text>
          </View>
          <TouchableOpacity onPress={() => setNotificationsOpen(false)} style={styles.closeBtn}>
            <MaterialIcons name="close" size={24} color={colors.dark} />
          </TouchableOpacity>
        </View>

        <View style={styles.actions}>
          <TouchableOpacity onPress={markAllRead} style={styles.markReadBtn}>
            <MaterialIcons name="done-all" size={16} color={colors.primary} />
            <Text style={styles.markReadText}>Marcar todas como leídas</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.list} contentContainerStyle={styles.listContent}>
          {loading && notifications.length === 0 ? (
            <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 40 }} />
          ) : notifications.length === 0 ? (
            <View style={styles.empty}>
              <MaterialIcons name="notifications-off" size={48} color={colors.borderSoft} />
              <Text style={styles.emptyText}>No tienes notificaciones</Text>
            </View>
          ) : (
            sectionOrder.map(section => {
              const items = notifications.filter(n => n.section === section);
              if (items.length === 0) return null;
              return (
                <View key={section} style={styles.section}>
                  <Text style={styles.sectionLabel}>{section}</Text>
                  {items.map(item => (
                    <TouchableOpacity
                      key={item.id}
                      style={[styles.card, !item.unread && styles.cardRead]}
                      onPress={() => handleAction(item)}
                    >
                      <View style={[styles.iconBox, { backgroundColor: `${item.color}15` }]}>
                        <MaterialIcons name={item.icon as any} size={20} color={item.color} />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.cardTitle, !item.unread && styles.cardTitleRead]}>{item.title}</Text>
                        <Text style={styles.cardMsg} numberOfLines={2}>{item.message}</Text>
                        <Text style={styles.cardTime}>{item.time}</Text>
                      </View>
                      {item.unread && <View style={styles.unreadDot} />}
                    </TouchableOpacity>
                  ))}
                </View>
              );
            })
          )}
        </ScrollView>

      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: '#000' },
  drawer: {
    position: 'absolute',
    right: 0, top: 0, bottom: 0,
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 15,
    elevation: 20,
    zIndex: 100,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f4f8',
  },
  headerTitleRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  title: { fontSize: 20, fontWeight: '900', color: colors.dark },
  closeBtn: { padding: 4 },
  actions: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    backgroundColor: '#f9fcff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f4f8',
  },
  markReadBtn: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  markReadText: { fontSize: 12, fontWeight: '800', color: colors.primary },
  list: { flex: 1 },
  listContent: { paddingBottom: 20 },
  section: { marginTop: spacing.md },
  sectionLabel: { 
    fontSize: 11, 
    fontWeight: '800', 
    color: colors.muted, 
    marginHorizontal: spacing.lg, 
    marginBottom: spacing.xs 
  },
  card: {
    flexDirection: 'row',
    padding: spacing.md,
    paddingHorizontal: spacing.lg,
    gap: spacing.md,
    alignItems: 'center',
  },
  cardRead: { opacity: 0.7 },
  iconBox: { width: 40, height: 40, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  cardTitle: { fontSize: 14, fontWeight: '800', color: colors.dark },
  cardTitleRead: { fontWeight: '600' },
  cardMsg: { fontSize: 12, color: colors.muted, marginTop: 2 },
  cardTime: { fontSize: 10, color: colors.borderSoft, marginTop: 4, fontWeight: '600' },
  unreadDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.primary },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', marginTop: 100, gap: 10 },
  emptyText: { color: colors.muted, fontWeight: '700' },
});
