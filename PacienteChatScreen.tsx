import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Image,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native';
import type { ImageSourcePropType } from 'react-native';
import { useFocusEffect, useRoute } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { usePortalAwareNavigation } from './navigation/usePortalAwareNavigation';
import { usePacienteModule } from './navigation/PacienteModuleContext';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';

import { useLanguage } from './localization/LanguageContext';
import type { RootStackParamList } from './navigation/types';
import { useSocketEvent } from './hooks/useSocketEvent';
import { useSocketRoom } from './hooks/useSocketRoom';
import { useAuth } from './providers/AuthProvider';
import { apiClient } from './utils/api';
import { ensurePatientSessionUser, getPatientDisplayName } from './utils/patientSession';

const ViremLogo = require('./assets/imagenes/descarga.png');
const DefaultAvatar = require('./assets/imagenes/avatar-default.jpg');

const MIN_REFRESH_INTERVAL_MS = 12000;

type User = {
  id?: number | string;
  usuarioid?: number | string;
  email?: string;
  nombres?: string;
  apellidos?: string;
  nombre?: string;
  apellido?: string;
  firstName?: string;
  lastName?: string;
  plan?: string;
  fotoUrl?: string;
};

type Message = {
  id: string;
  from: 'me' | 'other';
  text: string;
  time: string;
  dateLabel?: string;
  status?: 'sent' | 'read';
};

type ChatContact = {
  id: string;
  doctorId: string;
  name: string;
  specialty: string;
  avatarUrl: string;
  citaId: string;
  unreadCount: number;
  nextDateMs: number;
  timeLabel: string;
};

const normalizeText = (value: unknown) =>
  String(value || '')
    .replace(/\s+/g, ' ')
    .trim();

const sanitizeFotoUrl = (value: unknown) => {
  const clean = normalizeText(value);
  if (!clean) return '';
  if (clean.toLowerCase().startsWith('blob:')) return '';
  return clean;
};

const resolveAvatarSource = (value: unknown): ImageSourcePropType => {
  const clean = sanitizeFotoUrl(value);
  if (clean) return { uri: clean };
  return DefaultAvatar;
};

const parseDateMs = (value: string | null | undefined) => {
  if (!value) return Number.POSITIVE_INFINITY;
  const ms = new Date(value).getTime();
  return Number.isFinite(ms) ? ms : Number.POSITIVE_INFINITY;
};

const formatTimeLabel = (dateMs: number) => {
  if (!Number.isFinite(dateMs) || dateMs === Number.POSITIVE_INFINITY) return 'Sin fecha';
  return new Intl.DateTimeFormat('es-DO', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(dateMs));
};

const colors = {
  primary: '#137fec',
  bg: '#F6FAFD',
  dark: '#0A1931',
  blue: '#1A3D63',
  muted: '#4A7FA7',
  white: '#FFFFFF',
};

const PacienteChatScreen: React.FC = () => {
  const navigation = usePortalAwareNavigation();
  const { isInsidePortal } = usePacienteModule();
  const { width: viewportWidth } = useWindowDimensions();
  const isDesktopLayout = Platform.OS === 'web' && viewportWidth >= 1024;
  const route = useRoute<RouteProp<RootStackParamList, 'PacienteChat'>>();
  const { t } = useLanguage();
  const { user: sessionUser, updateUser, signOut } = useAuth<User>();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const [loadingUser, setLoadingUser] = useState(true);
  const [loadingContacts, setLoadingContacts] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [contacts, setContacts] = useState<ChatContact[]>([]);
  const [searchText, setSearchText] = useState('');
  const [reply, setReply] = useState('');
  const [selectedChatId, setSelectedChatId] = useState('');
  const [messagesByChat, setMessagesByChat] = useState<Record<string, Message[]>>({});
  const [isTyping, setIsTyping] = useState(false);
  const refreshTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastRefreshRef = useRef(0);
  const scrollRef = useRef<ScrollView>(null);
  const userAtBottomRef = useRef(true);
  const typingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const loadUser = useCallback(async () => {
    setLoadingUser(true);
    try {
      let nextUser = ensurePatientSessionUser(sessionUser);
      const profilePayload = await apiClient.get<any>('/api/users/me/paciente-profile', {
        authenticated: true,
      });
      if (profilePayload?.success && profilePayload?.profile) {
        const profileUser = profilePayload.profile as User;
        nextUser = {
          ...(nextUser || {}),
          ...profileUser,
          nombres: normalizeText((profileUser as any)?.nombres),
          apellidos: normalizeText((profileUser as any)?.apellidos),
          nombre: normalizeText((profileUser as any)?.nombres || (profileUser as any)?.nombre),
          apellido: normalizeText((profileUser as any)?.apellidos || (profileUser as any)?.apellido),
          fotoUrl: sanitizeFotoUrl((profileUser as any)?.fotoUrl),
        };
        if (nextUser) {
          await updateUser(nextUser);
        }
      }

      setUser(nextUser);
    } catch {
      setUser(ensurePatientSessionUser(sessionUser));
    } finally {
      setLoadingUser(false);
    }
  }, [sessionUser, updateUser]);

  const loadContacts = useCallback(async () => {
    setLoadingContacts(true);
    try {
      const payload = await apiClient.get<any>('/api/agenda/me/conversaciones', {
        authenticated: true,
        query: { limit: 120 },
      });
      if (!(payload?.success && Array.isArray(payload?.conversaciones))) {
        setContacts([]);
        return;
      }

      const routeDoctorId = normalizeText(route.params?.doctorId);
      const routeAvatarUrl = sanitizeFotoUrl(route.params?.doctorAvatarUrl);
      const contactList = (payload.conversaciones as any[])
        .map((conversation) => {
          const conversationId = normalizeText(conversation?.conversacionId);
          const citaId = normalizeText(conversation?.citaId);
          if (!conversationId || !citaId) return null;
          const nextDateMs = parseDateMs(conversation?.cita?.fechaHoraInicio || null);
          const doctorId = normalizeText(conversation?.medico?.medicoid);
          const fallbackAvatar = routeDoctorId && doctorId === routeDoctorId ? routeAvatarUrl : '';
          return {
            id: conversationId,
            doctorId,
            name: normalizeText(conversation?.medico?.nombreCompleto || 'Especialista') || 'Especialista',
            specialty:
              normalizeText(conversation?.medico?.especialidad || 'Medicina General') || 'Medicina General',
            avatarUrl: fallbackAvatar,
            citaId,
            unreadCount: Number(conversation?.unreadCount || 0),
            nextDateMs,
            timeLabel: formatTimeLabel(nextDateMs),
          } as ChatContact;
        })
        .filter((row: ChatContact | null): row is ChatContact => Boolean(row))
        .sort((a, b) => {
          if (a.unreadCount !== b.unreadCount) return b.unreadCount - a.unreadCount;
          return a.nextDateMs - b.nextDateMs;
        });

      setContacts(contactList);
    } catch {
      setContacts([]);
    } finally {
      setLoadingContacts(false);
    }
  }, [route.params?.doctorAvatarUrl, route.params?.doctorId]);

  const scheduleContactsReload = useCallback(() => {
    if (refreshTimerRef.current) return;
    refreshTimerRef.current = setTimeout(() => {
      refreshTimerRef.current = null;
      loadContacts();
    }, 500);
  }, [loadContacts]);

  useFocusEffect(
    useCallback(() => {
      const now = Date.now();
      if (now - lastRefreshRef.current < MIN_REFRESH_INTERVAL_MS) {
        return;
      }
      lastRefreshRef.current = now;
      loadUser();
      loadContacts();
    }, [loadContacts, loadUser])
  );

  const loadMessages = useCallback(async (conversationId: string) => {
    const cleanConversationId = normalizeText(conversationId);
    if (!cleanConversationId) return;

    setLoadingMessages(true);
    try {
      const payload = await apiClient.get<any>(
        `/api/agenda/me/conversaciones/${cleanConversationId}/mensajes`,
        {
          authenticated: true,
          query: { limit: 120 },
        }
      );
      if (!(payload?.success && Array.isArray(payload?.mensajes))) {
        return;
      }

      const normalized = (payload.mensajes as any[]).map((message: any) => {
        const sender = normalizeText(message?.emisorTipo).toLowerCase();
        const from = sender === 'paciente' ? 'me' : 'other';
        const time = formatTimeLabel(parseDateMs(message?.createdAt));
        return {
          id: normalizeText(message?.mensajeId || `${Date.now()}-${Math.random()}`),
          from,
          text: normalizeText(message?.contenido),
          time,
        } as Message;
      });

      setMessagesByChat((prev) => ({
        ...prev,
        [cleanConversationId]: normalized,
      }));

      await apiClient.patch(`/api/agenda/me/conversaciones/${cleanConversationId}/leido`, {
        authenticated: true,
      }).catch(() => null);
    } catch {
      // noop
    } finally {
      setLoadingMessages(false);
    }
  }, []);

  useEffect(() => {
    const routeDoctorId = normalizeText(route.params?.doctorId);
    const routeDoctorName = normalizeText(route.params?.doctorName).toLowerCase();

    if (!contacts.length) {
      setSelectedChatId('');
      return;
    }

    if (routeDoctorId) {
      const byDoctorId = contacts.find((c) => c.doctorId === routeDoctorId);
      if (byDoctorId) {
        setSelectedChatId(byDoctorId.id);
        return;
      }
      const byId = contacts.find((c) => c.id === routeDoctorId);
      if (byId) {
        setSelectedChatId(byId.id);
        return;
      }
    }

    if (routeDoctorName) {
      const byName = contacts.find((c) => c.name.toLowerCase() === routeDoctorName);
      if (byName) {
        setSelectedChatId(byName.id);
        return;
      }
    }

    const exists = contacts.some((c) => c.id === selectedChatId);
    if (!exists) {
      setSelectedChatId(contacts[0].id);
    }
  }, [contacts, route.params?.doctorId, route.params?.doctorName, selectedChatId]);

  useEffect(() => {
    if (!selectedChatId) return;
    loadMessages(selectedChatId);
  }, [loadMessages, selectedChatId]);

  const appendMessage = useCallback((conversationId: string, nextMessage: Message) => {
    const cleanConversationId = normalizeText(conversationId);
    if (!cleanConversationId || !nextMessage.id) return;

    setMessagesByChat((prev) => {
      const current = prev[cleanConversationId] || [];
      if (current.some((message) => message.id === nextMessage.id)) {
        return prev;
      }

      return {
        ...prev,
        [cleanConversationId]: [...current, nextMessage],
      };
    });
  }, []);

  useSocketRoom('conversation', selectedChatId, Boolean(selectedChatId));

  useSocketEvent('mensaje_nuevo', (payload: any) => {
    const conversationId = normalizeText(payload?.conversacionId);
    if (!conversationId) return;
    const rawMessage =
      payload?.mensaje ||
      (payload?.system && payload?.contenido
        ? {
            mensajeId: `system-${conversationId}-${normalizeText(payload.contenido)}`,
            emisorTipo: 'sistema',
            contenido: payload.contenido,
            createdAt: new Date().toISOString(),
          }
        : null);
    if (conversationId === selectedChatId && rawMessage) {
      const sender = normalizeText(rawMessage?.emisorTipo).toLowerCase();
      const from = sender === 'paciente' ? 'me' : 'other';
      const createdMs = parseDateMs(rawMessage?.createdAt);
      const nextMessage: Message = {
        id: normalizeText(rawMessage?.mensajeId || `${Date.now()}-${Math.random()}`),
        from,
        text: normalizeText(rawMessage?.contenido),
        time: formatTimeLabel(createdMs),
      };
      appendMessage(conversationId, nextMessage);
      apiClient.patch(`/api/agenda/me/conversaciones/${conversationId}/leido`, {
        authenticated: true,
      }).catch(() => null);
    }
    scheduleContactsReload();
  });

  useSocketEvent('cita_actualizada', () => scheduleContactsReload());
  useSocketEvent('cita_reprogramada', () => scheduleContactsReload());

  useSocketEvent('typing', (payload: any) => {
    const conversationId = normalizeText(payload?.conversacionId);
    if (conversationId === selectedChatId && normalizeText(payload?.emisorTipo).toLowerCase() !== 'paciente') {
      setIsTyping(true);
      if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
      typingTimerRef.current = setTimeout(() => setIsTyping(false), 3000);
    }
  });

  useEffect(() => {
    return () => {
      if (refreshTimerRef.current) {
        clearTimeout(refreshTimerRef.current);
        refreshTimerRef.current = null;
      }
      if (typingTimerRef.current) {
        clearTimeout(typingTimerRef.current);
        typingTimerRef.current = null;
      }
    };
  }, []);



  const handleScroll = useCallback((e: any) => {
    const { layoutMeasurement, contentOffset, contentSize } = e.nativeEvent;
    const distFromBottom = contentSize.height - layoutMeasurement.height - contentOffset.y;
    userAtBottomRef.current = distFromBottom < 80;
  }, []);

  useEffect(() => {
    setIsTyping(false);
  }, [selectedChatId]);

  const fullName = useMemo(() => getPatientDisplayName(user, 'Paciente'), [user]);

  const planLabel = useMemo(() => {
    const plan = (user?.plan || '').trim();
    return plan ? `Paciente ${plan}` : 'Paciente';
  }, [user?.plan]);

  const userAvatarSource: ImageSourcePropType = useMemo(() => resolveAvatarSource(user?.fotoUrl), [user?.fotoUrl]);
  const hasProfilePhoto = useMemo(() => Boolean(sanitizeFotoUrl(user?.fotoUrl)), [user?.fotoUrl]);

  const filteredContacts = useMemo(() => {
    const query = normalizeText(searchText).toLowerCase();
    if (!query) return contacts;
    return contacts.filter((contact) => {
      return (
        contact.name.toLowerCase().includes(query) ||
        contact.specialty.toLowerCase().includes(query)
      );
    });
  }, [contacts, searchText]);

  const selectedChat = useMemo(
    () => filteredContacts.find((chat) => chat.id === selectedChatId) ?? contacts.find((chat) => chat.id === selectedChatId) ?? filteredContacts[0] ?? contacts[0] ?? null,
    [contacts, filteredContacts, selectedChatId]
  );

  const messages = useMemo(() => {
    if (!selectedChat) return [] as Message[];
    const stored = messagesByChat[selectedChat.id] || [];
    if (stored.length) return stored;

    const intro: Message = {
      id: `intro-${selectedChat.id}`,
      from: 'other',
      text: `¡Hola! Soy ${selectedChat.name}. Comienza una conversación aquí después de agendar tu consulta. Estoy para ayudarte 😊`,
      time: 'Ahora',
      dateLabel: 'Nuevo chat',
    };
    return [intro];
  }, [messagesByChat, selectedChat]);

  useEffect(() => {
    if (userAtBottomRef.current && scrollRef.current) {
      setTimeout(() => scrollRef.current?.scrollToEnd?.({ animated: true }), 100);
    }
  }, [messages]);

  const handleSend = async () => {
    const text = reply.trim();
    if (!text || !selectedChat) return;

    try {
      const payload = await apiClient.post<any>(
        `/api/agenda/me/conversaciones/${selectedChat.id}/mensajes`,
        {
          authenticated: true,
          body: {
            contenido: text,
            tipo: 'texto',
          },
        }
      );
      if (!payload?.success || !payload?.mensaje) {
        return;
      }

      const createdAt = parseDateMs(payload?.mensaje?.createdAt);
      const nextMessage: Message = {
        id: normalizeText(payload?.mensaje?.mensajeId || `out-${Date.now()}`),
        from: 'me',
        text,
        time: formatTimeLabel(createdAt),
        status: 'sent',
      };
      userAtBottomRef.current = true;

      appendMessage(selectedChat.id, nextMessage);
      setReply('');
      loadContacts();
    } catch {
      // noop
    }
  };

  const renderMenuItem = (
    icon: string,
    label: string,
    active = false,
    onPress?: () => void
  ) => (
    <Pressable
      onPress={onPress}
      style={({ pressed, hovered }: any) => [
        styles.menuItem,
        active && styles.menuItemActive,
        hovered && !active && styles.menuItemHover,
        pressed && styles.menuItemPressed,
      ]}
    >
      <MaterialIcons name={icon} size={20} color={active ? colors.primary : colors.muted} />
      <Text style={[styles.menuText, active && styles.menuTextActive]}>{label}</Text>
    </Pressable>
  );

  const toggleMobileMenu = () => setIsMobileMenuOpen((prev) => !prev);
  const closeMobileMenu = () => setIsMobileMenuOpen(false);
  const navigateFromMenu = (
    routeName:
      | 'DashboardPaciente'
      | 'NuevaConsultaPaciente'
      | 'PacienteCitas'
      | 'SalaEsperaVirtualPaciente'
      | 'PacienteRecetasDocumentos'
      | 'PacientePerfil'
      | 'PacienteConfiguracion'
  ) => {
    closeMobileMenu();
    navigation.navigate(routeName);
  };

  return (
    <View style={[styles.container, isInsidePortal ? null : (isDesktopLayout ? styles.containerDesktop : styles.containerMobile)]}>
      {!isInsidePortal && !isDesktopLayout ? (
        <View style={styles.mobileMenuBar}>
          <TouchableOpacity style={styles.mobileMenuButton} onPress={toggleMobileMenu}>
            <MaterialIcons name={isMobileMenuOpen ? 'close' : 'menu'} size={22} color={colors.dark} />
            <Text style={styles.mobileMenuButtonText}>
              {isMobileMenuOpen ? 'Cerrar menú' : 'Abrir menú'}
            </Text>
          </TouchableOpacity>
        </View>
      ) : null}

      {!isInsidePortal && (isDesktopLayout || isMobileMenuOpen) && (
      <View style={[styles.sidebar, isDesktopLayout ? styles.sidebarDesktop : styles.sidebarMobile]}>
        <View>
          <View style={styles.logoBox}>
            <Image source={ViremLogo} style={styles.logo} />
            <View>
              <Text style={styles.logoTitle}>VIREM</Text>
              <Text style={styles.logoSubtitle}>Portal Paciente</Text>
            </View>
          </View>
          <View style={styles.userBox}>
            <Image source={userAvatarSource} style={styles.userAvatar} />
            <Text style={styles.userName}>{fullName}</Text>
            <Text style={styles.userPlan}>{planLabel}</Text>
            {!hasProfilePhoto ? (
              <Text style={styles.hintText}>No tienes foto. Ve a Perfil para agregarla.</Text>
            ) : null}
          </View>
          {renderMenuItem('grid-view', t('menu.home'), false, () => navigateFromMenu('DashboardPaciente'))}
          {renderMenuItem('person-search', t('menu.searchDoctor'), false, () => navigateFromMenu('NuevaConsultaPaciente'))}
          {renderMenuItem('calendar-today', t('menu.appointments'), false, () => navigateFromMenu('PacienteCitas'))}
          {renderMenuItem('videocam', t('menu.videocall'), false, () => navigateFromMenu('SalaEsperaVirtualPaciente'))}
          {renderMenuItem('chat-bubble', t('menu.chat'), true)}
          {renderMenuItem('description', t('menu.recipesDocs'), false, () => navigateFromMenu('PacienteRecetasDocumentos'))}
          {renderMenuItem('account-circle', t('menu.profile'), false, () => navigateFromMenu('PacientePerfil'))}
          {renderMenuItem('settings', t('menu.settings'), false, () => navigateFromMenu('PacienteConfiguracion'))}
        </View>
        <TouchableOpacity
          style={styles.logoutButton}
          onPress={async () => {
            closeMobileMenu();
            await signOut();
            navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
          }}
        >
          <MaterialIcons name="logout" size={18} color="#fff" />
          <Text style={styles.logoutText}>{t('menu.logout')}</Text>
        </TouchableOpacity>
      </View>
      )}

      <View style={[styles.main, !isDesktopLayout ? styles.mainMobile : null]}>
        <View style={[styles.leftPanel, !isDesktopLayout ? styles.leftPanelMobile : null]}>
          <View style={styles.leftPanelHeader}>
            <Text style={styles.sectionTitle}>Chats</Text>
            <View style={styles.contactCountBadge}>
              <Text style={styles.contactCountText}>{filteredContacts.length}</Text>
            </View>
          </View>
          <View style={styles.searchBox}>
            <MaterialIcons name="search" size={18} color={colors.muted} />
            <TextInput style={styles.searchInput} placeholder="Buscar médico..." placeholderTextColor="#8aa7bf" value={searchText} onChangeText={setSearchText} />
          </View>
          <ScrollView showsVerticalScrollIndicator={false}>
            {loadingUser || loadingContacts ? (
              <View style={styles.emptyState}><MaterialIcons name="hourglass-top" size={32} color={colors.muted} /><Text style={styles.emptyTitle}>Cargando chats...</Text></View>
            ) : !filteredContacts.length ? (
              <View style={styles.emptyState}>
                <View style={styles.emptyIconBox}><MaterialIcons name="chat-bubble-outline" size={32} color={colors.primary} /></View>
                <Text style={styles.emptyTitle}>Sin conversaciones</Text>
                <Text style={styles.emptySubtitle}>Agenda una cita para chatear con un especialista.</Text>
                <TouchableOpacity style={styles.emptyCta} activeOpacity={0.8} onPress={() => navigation.navigate('NuevaConsultaPaciente')}>
                  <MaterialIcons name="add" size={16} color="#fff" /><Text style={styles.emptyCtaText}>Agendar consulta</Text>
                </TouchableOpacity>
              </View>
            ) : (
              filteredContacts.map((chat) => {
                const latest = (messagesByChat[chat.id] || []).slice(-1)[0];
                const isActive = selectedChat?.id === chat.id;
                return (
                  <TouchableOpacity key={chat.id} style={[styles.chatRow, isActive && styles.chatRowActive]} onPress={() => setSelectedChatId(chat.id)} activeOpacity={0.75}>
                    <View style={styles.chatAvatarWrap}>
                      <Image source={resolveAvatarSource(chat.avatarUrl)} style={styles.chatAvatar} />
                      <View style={styles.onlineDot} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <View style={styles.rowBetween}>
                        <Text style={[styles.chatName, isActive && styles.chatNameActive]} numberOfLines={1}>{chat.name}</Text>
                        <Text style={styles.chatTime}>{latest?.time || chat.timeLabel}</Text>
                      </View>
                      <Text style={styles.chatSpec} numberOfLines={1}>{chat.specialty}</Text>
                      <Text style={styles.chatMsg} numberOfLines={1}>{latest?.text || 'Inicia la conversación...'}</Text>
                    </View>
                    {chat.unreadCount > 0 && (<View style={styles.unreadBadge}><Text style={styles.unreadBadgeText}>{chat.unreadCount}</Text></View>)}
                  </TouchableOpacity>
                );
              })
            )}
          </ScrollView>
        </View>

        <View style={styles.chatPanel}>
          <View style={styles.chatHeader}>
            {selectedChat ? (
              <View style={styles.chatHeaderInner}>
                <Image source={resolveAvatarSource(selectedChat.avatarUrl)} style={styles.chatHeaderAvatar} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.chatHeaderName}>{selectedChat.name}</Text>
                  <Text style={styles.chatHeaderSpec}>{selectedChat.specialty}</Text>
                </View>
                {selectedChat.citaId ? (
                  <TouchableOpacity style={styles.joinBtn} activeOpacity={0.8} onPress={() => navigation.navigate('SalaEsperaVirtualPaciente', { citaId: selectedChat.citaId })}>
                    <MaterialIcons name="videocam" size={16} color="#fff" /><Text style={styles.joinBtnText}>Unirse</Text>
                  </TouchableOpacity>
                ) : null}
              </View>
            ) : (<Text style={styles.chatHeaderName}>Selecciona un chat</Text>)}
          </View>
          {isTyping && selectedChat && (
            <View style={styles.typingBar}>
              <View style={styles.typingDots}>
                <View style={styles.typingDot} /><View style={[styles.typingDot, styles.typingDot2]} /><View style={[styles.typingDot, styles.typingDot3]} />
              </View>
              <Text style={styles.typingText}>{selectedChat.name.split(' ')[0]} está escribiendo…</Text>
            </View>
          )}
          <ScrollView ref={scrollRef} onScroll={handleScroll} scrollEventThrottle={100} contentContainerStyle={styles.messagesWrap} showsVerticalScrollIndicator={false}>
            {loadingMessages ? (
              <View style={styles.emptyState}><MaterialIcons name="hourglass-top" size={28} color={colors.muted} /><Text style={styles.emptyTitle}>Cargando mensajes...</Text></View>
            ) : (
              messages.map((msg, index) => (
                <React.Fragment key={msg.id}>
                  {(msg.dateLabel || index === 0) && (
                    <View style={styles.dateSeparator}><View style={styles.dateLine} /><Text style={styles.dateLabel}>{msg.dateLabel || 'Hoy'}</Text><View style={styles.dateLine} /></View>
                  )}
                  <View style={[styles.msgWrap, msg.from === 'me' && styles.msgWrapMe]}>
                    <View style={[styles.msgBubble, msg.from === 'me' && styles.msgBubbleMe]}>
                      <Text style={[styles.msgText, msg.from === 'me' && styles.msgTextMe]}>{msg.text}</Text>
                    </View>
                    <View style={styles.msgMeta}>
                      <Text style={[styles.msgTime, msg.from === 'me' && styles.msgTimeMe]}>{msg.time}</Text>
                      {msg.from === 'me' && (
                        <Text style={styles.msgStatus}>{msg.status === 'read' ? '✓✓' : '✓'}</Text>
                      )}
                    </View>
                  </View>
                </React.Fragment>
              ))
            )}
          </ScrollView>
          <View style={styles.inputRow}>
            <TouchableOpacity style={styles.attachBtn} activeOpacity={0.7}>
              <MaterialIcons name="attach-file" size={20} color={colors.muted} />
            </TouchableOpacity>
            <TextInput value={reply} onChangeText={setReply} placeholder={selectedChat ? 'Escribe tu mensaje...' : 'Selecciona un chat'} placeholderTextColor="#8aa7bf" style={styles.input} multiline editable={Boolean(selectedChat)} />
            <TouchableOpacity style={[styles.sendBtn, (!selectedChat || !reply.trim()) && styles.sendBtnDisabled]} onPress={handleSend} disabled={!selectedChat || !reply.trim()} activeOpacity={0.8}>
              <MaterialIcons name="send" size={18} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  containerDesktop: { flexDirection: 'row' },
  containerMobile: { flexDirection: 'column' },
  mobileMenuBar: {
    paddingHorizontal: 14,
    paddingTop: 12,
    paddingBottom: 8,
    backgroundColor: colors.bg,
  },
  mobileMenuButton: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#d8e4f0',
    backgroundColor: colors.white,
  },
  mobileMenuButtonText: { color: colors.dark, fontWeight: '700', fontSize: 13 },
  sidebar: {
    backgroundColor: colors.white,
    justifyContent: 'space-between',
  },
  sidebarDesktop: {
    width: 280,
    borderRightWidth: 1,
    borderRightColor: '#eef2f7',
    padding: 20,
  },
  sidebarMobile: {
    width: '100%',
    borderBottomWidth: 1,
    borderBottomColor: '#eef2f7',
    padding: 14,
  },
  logoBox: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  logo: { width: 44, height: 44, resizeMode: 'contain' },
  logoTitle: { fontSize: 20, fontWeight: '800', color: colors.dark },
  logoSubtitle: { fontSize: 11, fontWeight: '700', color: colors.muted },
  userBox: { marginTop: 18, alignItems: 'center', paddingVertical: 12 },
  userAvatar: { width: 76, height: 76, borderRadius: 76, marginBottom: 10, borderWidth: 4, borderColor: '#f5f7fb' },
  userName: { fontWeight: '800', color: colors.dark, fontSize: 14, textAlign: 'center' },
  userPlan: { color: colors.muted, fontSize: 11, fontWeight: '700', marginTop: 2 },
  hintText: { marginTop: 6, color: colors.muted, fontSize: 11, fontWeight: '700', textAlign: 'center' },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 6,
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 12,
  },
  menuItemActive: {
    backgroundColor: 'rgba(19,127,236,0.10)',
    borderRightWidth: 3,
    borderRightColor: colors.primary,
  },
  menuItemHover: { backgroundColor: '#f4f8fc' },
  menuItemPressed: { opacity: 0.7, transform: [{ scale: 0.985 }] },
  menuText: { fontSize: 14, color: colors.muted, fontWeight: '700' },
  menuTextActive: { color: colors.primary },
  logoutButton: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.blue,
    paddingVertical: 12,
    borderRadius: 12,
  },
  logoutText: { color: '#fff', fontWeight: '800' },
  main: { flex: 1, flexDirection: 'row', gap: 12, padding: 16 },
  mainMobile: { flexDirection: 'column' },
  leftPanel: { width: 320, backgroundColor: '#fff', borderRadius: 18, borderWidth: 1, borderColor: '#e4edf7', padding: 14, shadowColor: colors.dark, shadowOpacity: 0.04, shadowRadius: 8, shadowOffset: { width: 0, height: 3 }, elevation: 1 },
  leftPanelMobile: { width: '100%' },
  leftPanelHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  sectionTitle: { fontSize: 22, fontWeight: '900', color: colors.dark },
  contactCountBadge: { backgroundColor: '#eef4fb', borderRadius: 10, paddingHorizontal: 8, paddingVertical: 2 },
  contactCountText: { fontSize: 12, fontWeight: '900', color: colors.primary },
  searchBox: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#f4f8fc', borderWidth: 1, borderColor: '#e3edf7', borderRadius: 12, paddingHorizontal: 12, marginBottom: 12 },
  searchInput: { flex: 1, height: 38, color: colors.dark, fontWeight: '600', fontSize: 13 },
  emptyState: { alignItems: 'center', justifyContent: 'center', paddingVertical: 30, paddingHorizontal: 16 },
  emptyIconBox: { width: 56, height: 56, borderRadius: 28, backgroundColor: '#f0f6ff', alignItems: 'center', justifyContent: 'center', marginBottom: 10 },
  emptyTitle: { color: colors.dark, fontSize: 15, fontWeight: '800', marginTop: 6 },
  emptySubtitle: { color: colors.muted, fontSize: 12, fontWeight: '600', textAlign: 'center', marginTop: 4, lineHeight: 17 },
  emptyCta: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 12, backgroundColor: '#1F4770', paddingVertical: 9, paddingHorizontal: 16, borderRadius: 10 },
  emptyCtaText: { color: '#fff', fontWeight: '800', fontSize: 13 },
  chatRow: { flexDirection: 'row', gap: 10, padding: 10, borderRadius: 12, marginBottom: 4, alignItems: 'center' },
  chatRowActive: { backgroundColor: '#eef6ff', borderWidth: 1, borderColor: '#d4e6f9' },
  chatAvatarWrap: { position: 'relative' },
  chatAvatar: { width: 44, height: 44, borderRadius: 44, borderWidth: 2, borderColor: '#f2f6fb' },
  onlineDot: { position: 'absolute', bottom: 1, right: 1, width: 10, height: 10, borderRadius: 10, backgroundColor: '#22c55e', borderWidth: 2, borderColor: '#fff' },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  chatName: { fontWeight: '800', color: colors.dark, fontSize: 14, flex: 1 },
  chatNameActive: { color: colors.primary },
  chatSpec: { color: colors.muted, fontSize: 11, fontWeight: '600', marginTop: 1 },
  chatTime: { color: '#8aa7bf', fontSize: 10, fontWeight: '700' },
  chatMsg: { color: colors.muted, fontSize: 12, marginTop: 2, fontWeight: '600' },
  unreadBadge: { backgroundColor: colors.primary, borderRadius: 10, minWidth: 20, height: 20, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 5 },
  unreadBadgeText: { color: '#fff', fontSize: 10, fontWeight: '900' },
  chatPanel: { flex: 1, backgroundColor: '#f8fbff', borderRadius: 18, borderWidth: 1, borderColor: '#e4edf7', overflow: 'hidden' },
  chatHeader: { backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#e5edf6', paddingHorizontal: 14, paddingVertical: 12 },
  chatHeaderInner: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  chatHeaderAvatar: { width: 38, height: 38, borderRadius: 38, borderWidth: 2, borderColor: '#f2f6fb' },
  chatHeaderName: { fontSize: 15, fontWeight: '800', color: colors.dark },
  chatHeaderSpec: { fontSize: 11, fontWeight: '600', color: colors.muted, marginTop: 1 },
  joinBtn: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: colors.primary, paddingVertical: 8, paddingHorizontal: 12, borderRadius: 10, shadowColor: colors.primary, shadowOpacity: 0.3, shadowRadius: 6, shadowOffset: { width: 0, height: 3 }, elevation: 2 },
  joinBtnText: { color: '#fff', fontWeight: '800', fontSize: 12 },
  messagesWrap: { padding: 14, gap: 8 },
  dateSeparator: { flexDirection: 'row', alignItems: 'center', gap: 10, marginVertical: 8, alignSelf: 'stretch' },
  dateLine: { flex: 1, height: 1, backgroundColor: '#e4edf7' },
  dateLabel: { color: '#8aa7bf', fontSize: 10, fontWeight: '800', textTransform: 'uppercase' },
  msgWrap: { maxWidth: '78%' },
  msgWrapMe: { alignSelf: 'flex-end', alignItems: 'flex-end' },
  msgBubble: { backgroundColor: '#fff', borderRadius: 16, borderTopLeftRadius: 4, borderWidth: 1, borderColor: '#e2edf8', paddingHorizontal: 14, paddingVertical: 10, shadowColor: colors.dark, shadowOpacity: 0.03, shadowRadius: 4, shadowOffset: { width: 0, height: 2 }, elevation: 1 },
  msgBubbleMe: { backgroundColor: '#1F4770', borderColor: '#1F4770', borderTopLeftRadius: 16, borderTopRightRadius: 4 },
  msgText: { color: colors.dark, fontWeight: '600', fontSize: 13, lineHeight: 19 },
  msgTextMe: { color: '#fff' },
  msgTime: { marginTop: 3, fontSize: 10, color: '#8da8c0', fontWeight: '700' },
  msgTimeMe: { color: '#8da8c0' },
  msgMeta: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 3 },
  msgStatus: { fontSize: 10, color: '#22c55e', fontWeight: '800' },
  typingBar: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 14, paddingVertical: 6, backgroundColor: '#f0f6ff', borderBottomWidth: 1, borderBottomColor: '#e4edf7' },
  typingDots: { flexDirection: 'row', gap: 3, alignItems: 'center' },
  typingDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.primary, opacity: 0.5 },
  typingDot2: { opacity: 0.7 },
  typingDot3: { opacity: 0.9 },
  typingText: { fontSize: 11, fontWeight: '700', color: colors.muted, fontStyle: 'italic' },
  inputRow: { backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#e5edf6', flexDirection: 'row', alignItems: 'flex-end', gap: 6, padding: 10 },
  attachBtn: { width: 38, height: 38, borderRadius: 10, backgroundColor: '#f4f8fc', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#e3edf7' },
  input: { flex: 1, backgroundColor: '#f4f8fc', borderWidth: 1, borderColor: '#e3edf7', borderRadius: 14, paddingHorizontal: 14, paddingVertical: 10, maxHeight: 120, fontSize: 13, fontWeight: '600', color: colors.dark },
  sendBtn: { width: 42, height: 42, borderRadius: 12, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center', shadowColor: colors.primary, shadowOpacity: 0.3, shadowRadius: 6, shadowOffset: { width: 0, height: 3 }, elevation: 2 },
  sendBtnDisabled: { opacity: 0.45, shadowOpacity: 0 },
});

export default PacienteChatScreen;




