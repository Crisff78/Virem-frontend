import React, {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useRef,
    useState,
} from 'react';
import { io, Socket } from 'socket.io-client';

import { BACKEND_URL } from '../config/backend';
import { useAuth } from './AuthProvider';

type SocketJoinAck = {
    ok: boolean;
    code?: string;
    room?: string;
    citaId?: string;
    conversacionId?: string;
};

type SocketContextValue = {
    socket: Socket | null;
    isConnected: boolean;
    lastError: string;
    ensureConnected: () => Promise<Socket | null>;
    joinConversation: (conversationId: string) => Promise<SocketJoinAck>;
    leaveConversation: (conversationId: string) => void;
    joinCita: (citaId: string) => Promise<SocketJoinAck>;
    leaveCita: (citaId: string) => void;
};

const SocketContext = createContext<SocketContextValue | null>(null);

const normalizeText = (value: unknown) => String(value || '').trim();

const SOCKET_ACK_TIMEOUT_MS = 5000;
const SOCKET_CONNECT_TIMEOUT_MS = 5000;

export const SocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { token } = useAuth();
    const socketRef = useRef<Socket | null>(null);
    const cleanupSocketListenersRef = useRef<(() => void) | null>(null);
    const tokenRef = useRef('');
    const [socket, setSocket] = useState<Socket | null>(null);
    const [isConnected, setIsConnected] = useState(false);
    const [lastError, setLastError] = useState('');
    tokenRef.current = normalizeText(token);

    const bindSocketState = useCallback((nextSocket: Socket) => {
        const handleConnect = () => {
            setIsConnected(true);
            setLastError('');
        };

        const handleDisconnect = () => {
            setIsConnected(false);
        };

        const handleConnectError = (error: Error) => {
            setIsConnected(false);
            setLastError(String(error?.message || 'socket_error'));
        };

        nextSocket.on('connect', handleConnect);
        nextSocket.on('disconnect', handleDisconnect);
        nextSocket.on('connect_error', handleConnectError);

        return () => {
            nextSocket.off('connect', handleConnect);
            nextSocket.off('disconnect', handleDisconnect);
            nextSocket.off('connect_error', handleConnectError);
        };
    }, []);

    const ensureSocket = useCallback(() => {
        const cleanToken = normalizeText(tokenRef.current);
        if (!cleanToken) return null;

        if (!socketRef.current) {
            const nextSocket = io(BACKEND_URL, {
                transports: ['websocket'],
                autoConnect: false,
                auth: { token: cleanToken },
            });
            socketRef.current = nextSocket;
            setSocket(nextSocket);
            cleanupSocketListenersRef.current = bindSocketState(nextSocket);
        }

        socketRef.current.auth = { token: cleanToken };
        return socketRef.current;
    }, [bindSocketState]);

    const disposeSocket = useCallback(() => {
        cleanupSocketListenersRef.current?.();
        cleanupSocketListenersRef.current = null;

        if (socketRef.current) {
            socketRef.current.disconnect();
            socketRef.current = null;
        }

        setSocket(null);
        setIsConnected(false);
    }, []);

    const ensureConnected = useCallback(async () => {
        const nextSocket = ensureSocket();
        if (!nextSocket) return null;
        if (nextSocket.connected) return nextSocket;

        return await new Promise<Socket | null>((resolve) => {
            let settled = false;

            const finish = (value: Socket | null) => {
                if (settled) return;
                settled = true;
                clearTimeout(timer);
                nextSocket.off('connect', onConnect);
                nextSocket.off('connect_error', onError);
                resolve(value);
            };

            const onConnect = () => finish(nextSocket);
            const onError = () => finish(null);
            const timer = setTimeout(() => finish(null), SOCKET_CONNECT_TIMEOUT_MS);

            nextSocket.once('connect', onConnect);
            nextSocket.once('connect_error', onError);
            nextSocket.connect();
        });
    }, [ensureSocket]);

    const emitWithAck = useCallback(
        async (eventName: 'join:conversation' | 'join:cita', resourceId: string) => {
            const nextSocket = await ensureConnected();
            const cleanResourceId = normalizeText(resourceId);
            if (!nextSocket || !cleanResourceId) {
                return { ok: false, code: 'socket_unavailable' } as SocketJoinAck;
            }

            return await new Promise<SocketJoinAck>((resolve) => {
                let settled = false;

                const finish = (value: SocketJoinAck) => {
                    if (settled) return;
                    settled = true;
                    clearTimeout(timer);
                    resolve(value);
                };

                const timer = setTimeout(
                    () => finish({ ok: false, code: 'socket_ack_timeout' }),
                    SOCKET_ACK_TIMEOUT_MS
                );

                nextSocket.emit(eventName, cleanResourceId, (response: SocketJoinAck) => {
                    finish(response || { ok: false, code: 'socket_ack_invalid' });
                });
            });
        },
        [ensureConnected]
    );

    const joinConversation = useCallback(
        async (conversationId: string) => emitWithAck('join:conversation', conversationId),
        [emitWithAck]
    );

    const leaveConversation = useCallback((conversationId: string) => {
        const cleanConversationId = normalizeText(conversationId);
        if (!socketRef.current || !cleanConversationId) return;
        socketRef.current.emit('leave:conversation', cleanConversationId);
    }, []);

    const joinCita = useCallback(
        async (citaId: string) => emitWithAck('join:cita', citaId),
        [emitWithAck]
    );

    const leaveCita = useCallback((citaId: string) => {
        const cleanCitaId = normalizeText(citaId);
        if (!socketRef.current || !cleanCitaId) return;
        socketRef.current.emit('leave:cita', cleanCitaId);
    }, []);

    useEffect(() => {
        const cleanToken = normalizeText(token);

        if (!cleanToken) {
            tokenRef.current = '';
            disposeSocket();
            setLastError('');
            return;
        }

        const currentAuthToken = normalizeText((socketRef.current?.auth as any)?.token);
        if (socketRef.current && currentAuthToken !== cleanToken) {
            disposeSocket();
        }

        tokenRef.current = cleanToken;
    }, [disposeSocket, token]);

    useEffect(() => {
        return () => {
            disposeSocket();
        };
    }, [disposeSocket]);

    const value = useMemo<SocketContextValue>(
        () => ({
            socket,
            isConnected,
            lastError,
            ensureConnected,
            joinConversation,
            leaveConversation,
            joinCita,
            leaveCita,
        }),
        [
            ensureConnected,
            isConnected,
            joinCita,
            joinConversation,
            lastError,
            leaveCita,
            leaveConversation,
            socket,
        ]
    );

    return <SocketContext.Provider value={value}>{children}</SocketContext.Provider>;
};

export function useSocket() {
    const context = useContext(SocketContext);
    if (!context) {
        throw new Error('useSocket must be used within SocketProvider');
    }
    return context;
}
