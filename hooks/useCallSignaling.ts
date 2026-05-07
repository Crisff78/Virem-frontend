import { useCallback, useEffect, useRef, useState } from 'react';
import { useSocket } from '../providers/SocketProvider';
import { useSocketEvent } from './useSocketEvent';

export type IncomingCallPayload = {
  citaId: string;
  callerRole: 'medico' | 'paciente';
  callerName: string;
  callerUsuarioId: number;
  at: string;
};

type AckResponse = { ok: boolean; code?: string };

const ACK_TIMEOUT = 5000;

function emitWithAck(socket: any, eventName: string, payload: any): Promise<AckResponse> {
  return new Promise((resolve) => {
    if (!socket) return resolve({ ok: false, code: 'no_socket' });
    let done = false;
    const finish = (r: AckResponse) => {
      if (done) return;
      done = true;
      clearTimeout(timer);
      resolve(r);
    };
    const timer = setTimeout(() => finish({ ok: false, code: 'ack_timeout' }), ACK_TIMEOUT);
    socket.emit(eventName, payload, (resp: AckResponse) => finish(resp || { ok: false, code: 'ack_invalid' }));
  });
}

/**
 * Mantiene el estado global de la llamada entrante para mostrar la pantalla
 * IncomingCallScreen automaticamente.
 */
export function useIncomingCallListener() {
  const [incoming, setIncoming] = useState<IncomingCallPayload | null>(null);

  useSocketEvent<IncomingCallPayload>('call:incoming', (payload) => {
    if (!payload?.citaId) return;
    setIncoming({
      citaId: String(payload.citaId),
      callerRole: payload.callerRole === 'medico' ? 'medico' : 'paciente',
      callerName: String(payload.callerName || 'Llamada entrante'),
      callerUsuarioId: Number(payload.callerUsuarioId || 0),
      at: String(payload.at || new Date().toISOString()),
    });
  });

  // Si la otra punta cancela / acepta / cuelga, limpiamos
  useSocketEvent('call:cancelled', () => setIncoming(null));
  useSocketEvent('call:accepted', () => setIncoming(null));
  useSocketEvent('call:rejected', () => setIncoming(null));
  useSocketEvent('call:ended', () => setIncoming(null));

  const dismiss = useCallback(() => setIncoming(null), []);
  return { incoming, dismiss };
}

/**
 * Helpers para emitir eventos call:* desde quien sea.
 */
export function useCallSignaler() {
  const { ensureConnected } = useSocket();
  const socketRef = useRef<any>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const s = await ensureConnected();
      if (!cancelled) socketRef.current = s;
    })();
    return () => {
      cancelled = true;
    };
  }, [ensureConnected]);

  const invite = useCallback(async (citaId: string) => {
    const s = socketRef.current || (await ensureConnected());
    return emitWithAck(s, 'call:invite', { citaId });
  }, [ensureConnected]);

  const accept = useCallback(async (citaId: string) => {
    const s = socketRef.current || (await ensureConnected());
    return emitWithAck(s, 'call:accept', { citaId });
  }, [ensureConnected]);

  const reject = useCallback(async (citaId: string, reason?: string) => {
    const s = socketRef.current || (await ensureConnected());
    return emitWithAck(s, 'call:reject', { citaId, reason });
  }, [ensureConnected]);

  const end = useCallback(async (citaId: string, reason?: string) => {
    const s = socketRef.current || (await ensureConnected());
    return emitWithAck(s, 'call:end', { citaId, reason });
  }, [ensureConnected]);

  const cancel = useCallback(async (citaId: string) => {
    const s = socketRef.current || (await ensureConnected());
    return emitWithAck(s, 'call:cancel', { citaId });
  }, [ensureConnected]);

  const reportMediaState = useCallback(
    async (citaId: string, state: { mic?: boolean; camera?: boolean }) => {
      const s = socketRef.current || (await ensureConnected());
      return emitWithAck(s, 'call:media-state', { citaId, ...state });
    },
    [ensureConnected]
  );

  return { invite, accept, reject, end, cancel, reportMediaState };
}
