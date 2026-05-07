/**
 * Hook de videollamada basado en WebRTC nativo del navegador.
 *
 * Solo activo en Platform.OS === 'web'. En cualquier otra plataforma, todas
 * las funciones son no-ops y los streams devueltos son null.
 *
 * Diseño del flujo de señalización (via Socket.IO):
 *   1. Iniciador (initiate=true) entra a VideoCallScreen → start() → obtiene media,
 *      crea PeerConnection, escucha rtc:ready.
 *   2. Receptor (initiate=false) acepta la llamada → entra a VideoCallScreen →
 *      start() → obtiene media, crea PeerConnection, emite rtc:ready.
 *   3. Iniciador recibe rtc:ready → crea offer → emite rtc:offer.
 *   4. Receptor recibe rtc:offer → crea answer → emite rtc:answer.
 *   5. Iniciador recibe rtc:answer → setRemoteDescription.
 *   6. Ambos intercambian candidatos ICE via rtc:ice.
 *   7. La conexión P2P se establece y ontrack dispara el remoteStream.
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { Platform } from 'react-native';

import { useSocket } from '../providers/SocketProvider';
import { useSocketEvent } from './useSocketEvent';
import { appointmentVideoService } from '../services/appointmentVideoService';
import type { CallConnectionState, ZegoCallApi } from './useZegoCall';

export type WebRTCCallApi = ZegoCallApi & {
  /** MediaStream de la cámara local — solo web, null en native */
  localStream: MediaStream | null;
  /** MediaStream del participante remoto — solo web, null en native */
  remoteStream: MediaStream | null;
  /** Función para emitir señales de WebRTC via socket */
  emitSignal: (event: string, payload: object) => void;
  /** Acceso al objeto PeerConnection para configuraciones avanzadas */
  pc: RTCPeerConnection | null;
};

const IS_WEB = Platform.OS === 'web';
const NOOP_ASYNC = async (): Promise<void> => {};

const ICE_SERVERS = [
  { urls: ['stun:stun.l.google.com:19302', 'stun:stun1.l.google.com:19302'] },
];

export function useWebRTCCall(
  citaId: string | undefined,
  initiate: boolean
): WebRTCCallApi {
  const cleanCitaId = String(citaId || '').trim();

  // ── State ────────────────────────────────────────────────────────────────
  const [state, setState] = useState<CallConnectionState>('idle');
  const [error, setError] = useState<string | null>(null);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [remoteUserName, setRemoteUserName] = useState<string | null>(null);
  const [micEnabled, setMicEnabled] = useState(true);
  const [cameraEnabled, setCameraEnabled] = useState(true);
  const [durationSec, setDurationSec] = useState(0);
  const [remainingMs, setRemainingMs] = useState(0);

  // ── Refs ─────────────────────────────────────────────────────────────────
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const pendingOfferRef = useRef<RTCSessionDescriptionInit | null>(null);
  const iceCandidateQueueRef = useRef<RTCIceCandidateInit[]>([]);
  const remoteDescSetRef = useRef(false);
  const startedAtRef = useRef<number | null>(null);
  const closesAtRef = useRef<number | null>(null);
  const tickerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const autoEndRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const { socket, ensureConnected } = useSocket();

  // ── Emit helper ──────────────────────────────────────────────────────────
  const emitSignal = useCallback(
    (event: string, payload: object) => {
      const s = socket;
      if (s?.connected) {
        s.emit(event, payload);
      } else {
        ensureConnected()
          .then((s2) => s2?.emit(event, payload))
          .catch(() => {});
      }
    },
    [socket, ensureConnected]
  );

  // ── ICE candidate queue (buffer antes de setRemoteDescription) ───────────
  const flushICEQueue = useCallback(async (pc: RTCPeerConnection) => {
    const queue = iceCandidateQueueRef.current.splice(0);
    for (const c of queue) {
      try {
        await pc.addIceCandidate(new RTCIceCandidate(c));
      } catch (_) {}
    }
  }, []);

  const addIceCandidate = useCallback(
    async (candidateInit: RTCIceCandidateInit) => {
      if (!pcRef.current) return;
      if (!remoteDescSetRef.current) {
        iceCandidateQueueRef.current.push(candidateInit);
        return;
      }
      try {
        await pcRef.current.addIceCandidate(new RTCIceCandidate(candidateInit));
      } catch (err) {
        console.warn('[WebRTC] addIceCandidate:', err);
      }
    },
    []
  );

  // ── Helper: construir RTCPeerConnection ───────────────────────────────────
  const buildPC = useCallback(
    (stream: MediaStream): RTCPeerConnection => {
      const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });

      // Agregar tracks locales
      stream.getTracks().forEach((t) => pc.addTrack(t, stream));

      // ICE → relay via socket
      pc.onicecandidate = (e) => {
        if (e.candidate) {
          emitSignal('rtc:ice', { 
            citaId: cleanCitaId, 
            candidate: e.candidate.toJSON(),
            fromRole: IS_WEB ? 'web' : 'native'
          });
        }
      };

      // Track remoto → actualizar estado
      pc.ontrack = (e) => {
        console.log('[WebRTC] ontrack event:', e.track.kind);
        const rs = e.streams?.[0];
        if (rs) {
          setRemoteStream(rs);
          if (!startedAtRef.current) startedAtRef.current = Date.now();
          setState('live');
        } else {
          // Fallback if streams array is empty (some browsers)
          const newStream = new MediaStream([e.track]);
          setRemoteStream(newStream);
          setState('live');
        }
      };

      // Estado de conexión
      pc.onconnectionstatechange = () => {
        const cs = pc.connectionState;
        if (cs === 'connected') {
          setState('live');
          if (!startedAtRef.current) startedAtRef.current = Date.now();
        } else if (cs === 'disconnected' || cs === 'failed') {
          setState((prev) => (prev === 'live' ? 'reconnecting' : prev));
        }
      };

      pcRef.current = pc;
      return pc;
    },
    [cleanCitaId, emitSignal]
  );

  // ── Signaling Handlers ───────────────────────────────────────────────────
  
  const onRtcReady = useCallback(async () => {
    if (!IS_WEB || !initiate || !pcRef.current) return;
    console.log('[WebRTC] Received rtc:ready (or periodic trigger), creating/sending offer...');
    try {
      const offer = await pcRef.current.createOffer({
        iceRestart: state === 'reconnecting',
      });
      await pcRef.current.setLocalDescription(offer);
      emitSignal('rtc:offer', { citaId: cleanCitaId, offer, fromRole: 'medico' });
    } catch (err) {
      console.warn('[WebRTC] rtc:ready → createOffer error:', err);
    }
  }, [IS_WEB, initiate, cleanCitaId, emitSignal, state]);

  const onRtcOffer = useCallback(async (payload: any) => {
    if (!IS_WEB || !payload?.offer || !cleanCitaId || !pcRef.current) return;
    if (initiate) return; // Initiator shouldn't receive offer
    
    // Si ya estamos live, ignorar ofertas repetidas a menos que sea un reinicio de ICE
    if (state === 'live' && !payload.offer.sdp?.includes('ice-ufrag')) return;

    console.log('[WebRTC] Received offer, creating answer...');
    try {
      await pcRef.current.setRemoteDescription(new RTCSessionDescription(payload.offer));
      remoteDescSetRef.current = true;
      await flushICEQueue(pcRef.current);
      
      const answer = await pcRef.current.createAnswer();
      await pcRef.current.setLocalDescription(answer);
      emitSignal('rtc:answer', { citaId: cleanCitaId, answer, fromRole: 'paciente' });
      
      setState('connecting');
    } catch (err) {
      console.warn('[WebRTC] rtc:offer handler error:', err);
    }
  }, [IS_WEB, cleanCitaId, initiate, emitSignal, flushICEQueue, state]);

  const onRtcAnswer = useCallback(async (payload: any) => {
    if (!IS_WEB || !payload?.answer || !pcRef.current) return;
    console.log('[WebRTC] Received answer, setting remote description...');
    try {
      await pcRef.current.setRemoteDescription(new RTCSessionDescription(payload.answer));
      remoteDescSetRef.current = true;
      await flushICEQueue(pcRef.current);
      if (payload.fromRole) {
        setRemoteUserName(payload.fromRole === 'medico' ? 'Tu médico' : 'Tu paciente');
      }
    } catch (err) {
      console.warn('[WebRTC] rtc:answer handler error:', err);
    }
  }, [IS_WEB, flushICEQueue]);

  const onRtcIce = useCallback(async (payload: any) => {
    if (!IS_WEB || !payload?.candidate) return;
    await addIceCandidate(payload.candidate);
  }, [IS_WEB, addIceCandidate]);

  const onCallIncoming = useCallback(() => {
    if (!IS_WEB || initiate || !pcRef.current) return;
    // The other party (initiator) just joined or re-sent an invitation.
    // If we are already in the call screen, let's signal we are ready.
    console.log('[WebRTC] Received call:incoming, sending rtc:ready...');
    emitSignal('rtc:ready', { citaId: cleanCitaId });
  }, [IS_WEB, initiate, cleanCitaId, emitSignal]);

  useSocketEvent('rtc:ready', onRtcReady, IS_WEB && !!cleanCitaId && initiate);
  useSocketEvent('rtc:offer', onRtcOffer, IS_WEB && !!cleanCitaId && !initiate);
  useSocketEvent('rtc:answer', onRtcAnswer, IS_WEB && !!cleanCitaId && initiate);
  useSocketEvent('rtc:ice', onRtcIce, IS_WEB && !!cleanCitaId);
  useSocketEvent('call:incoming', onCallIncoming, IS_WEB && !!cleanCitaId && !initiate);
  useSocketEvent('call:accepted', onRtcReady, IS_WEB && !!cleanCitaId && initiate);

  // ── Socket: la otra punta cuelga ─────────────────────────────────────────
  useSocketEvent<{ citaId?: string }>(
    'call:ended',
    (payload) => {
      if (!IS_WEB || !cleanCitaId) return;
      if (payload?.citaId && String(payload.citaId) !== cleanCitaId) return;
      end('ended_by_remote').catch(() => {});
    },
    IS_WEB && !!cleanCitaId
  );

  // ── Ticker: duracion + corte forzado por horario ──────────────────────────
  useEffect(() => {
    if (!IS_WEB || state !== 'live') {
      if (tickerRef.current) clearInterval(tickerRef.current);
      return;
    }
    tickerRef.current = setInterval(() => {
      const startedAt = startedAtRef.current || Date.now();
      setDurationSec(Math.floor((Date.now() - startedAt) / 1000));
      if (closesAtRef.current) {
        const rem = closesAtRef.current - Date.now();
        setRemainingMs(Math.max(0, rem));
        if (rem <= 0) {
          end('time_up').catch(() => {});
        }
      }
    }, 1000);
    return () => {
      if (tickerRef.current) clearInterval(tickerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  // ── start ─────────────────────────────────────────────────────────────────
  const start = useCallback(async () => {
    if (!IS_WEB) return; // Zego maneja native

    if (!cleanCitaId) {
      setError('Cita inválida.');
      setState('error');
      return;
    }

    setState('connecting');
    setError(null);
    iceCandidateQueueRef.current = [];
    remoteDescSetRef.current = false;
    pendingOfferRef.current = null;
    startedAtRef.current = null;

    try {
      // 1. Verificar ventana de acceso y obtener closesAt
      const accessSnap = await appointmentVideoService.getAccess(cleanCitaId);
      if (!accessSnap.access.canJoin) {
        setError('La videollamada no está disponible en este momento.');
        setState('error');
        return;
      }
      if (accessSnap.access.closesAt) {
        closesAtRef.current = accessSnap.access.closesAt;
        const ms = Math.max(0, accessSnap.access.closesAt - Date.now());
        setRemainingMs(ms);
        if (autoEndRef.current) clearTimeout(autoEndRef.current);
        autoEndRef.current = setTimeout(() => end('time_up').catch(() => {}), ms + 1000);
      }

      // 2. Obtener media local — con calidad de audio optimizada
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });
      localStreamRef.current = stream;
      setLocalStream(stream);

      // 3. Crear PeerConnection (agrega tracks, configura listeners)
      buildPC(stream);

      // 4. Señalización:
      //    - Iniciador (Medico): emite call:invite para notificar al paciente que ya entró
      //    - Receptor (Paciente): emite rtc:ready para que el iniciador sepa que puede enviar el offer
      if (initiate) {
        emitSignal('call:invite', { citaId: cleanCitaId });
      } else {
        // Emit ready immediately
        emitSignal('rtc:ready', { citaId: cleanCitaId });
      }

      // 5. Unirse al cuarto de socket para asegurar recepción de mensajes
      if (socket) {
        socket.emit('join:cita', cleanCitaId);
      }
    } catch (err: any) {
      const msg =
        err?.name === 'NotAllowedError'
          ? 'Necesitas permitir el acceso a cámara y micrófono.'
          : err?.message || 'No se pudo iniciar la videollamada.';
      setError(msg);
      setState('error');
    }
  }, [cleanCitaId, initiate, buildPC, emitSignal]);

  // ── Signaling Retry Loop (Aggressive Handshake) ─────────────────────────
  useEffect(() => {
    if (!IS_WEB || !cleanCitaId || state === 'live' || state === 'ended') return;
    
    const interval = setInterval(() => {
      if (!pcRef.current) return;

      if (initiate) {
        // Initiator keeps sending offer until connected
        if (!remoteDescSetRef.current) {
          console.log('[WebRTC] Aggressive retry: creating new offer...');
          onRtcReady(); 
        }
      } else {
        // Receiver keeps signaling presence
        if (!remoteDescSetRef.current) {
          console.log('[WebRTC] Aggressive retry: sending rtc:ready...');
          emitSignal('rtc:ready', { citaId: cleanCitaId });
        }
      }
    }, 3000); // Every 3 seconds until remote description is set

    return () => clearInterval(interval);
  }, [IS_WEB, cleanCitaId, state, initiate, emitSignal, onRtcReady]);

  // ── end ───────────────────────────────────────────────────────────────────
  const end = useCallback(
    async (reason?: string) => {
      if (autoEndRef.current) clearTimeout(autoEndRef.current);
      if (tickerRef.current) clearInterval(tickerRef.current);

      try {
        pcRef.current?.close();
      } catch (_) {}
      pcRef.current = null;
      remoteDescSetRef.current = false;

      localStreamRef.current?.getTracks().forEach((t) => t.stop());
      localStreamRef.current = null;

      setLocalStream(null);
      setRemoteStream(null);
      setRemoteUserName(null);
      setState('ended');
      startedAtRef.current = null;

      if (cleanCitaId) {
        try {
          await appointmentVideoService.endCall(cleanCitaId);
        } catch (_) {}
      }
      if (reason === 'time_up') {
        setError('La ventana de la videollamada expiró.');
      }
    },
    [cleanCitaId]
  );

  // ── Controles de media ────────────────────────────────────────────────────
  const toggleMic = useCallback(async () => {
    const next = !micEnabled;
    setMicEnabled(next);
    localStreamRef.current?.getAudioTracks().forEach((t) => (t.enabled = next));
  }, [micEnabled]);

  const toggleCamera = useCallback(async () => {
    const next = !cameraEnabled;
    setCameraEnabled(next);
    localStreamRef.current?.getVideoTracks().forEach((t) => (t.enabled = next));
  }, [cameraEnabled]);

  // ── Limpieza al desmontar — liberar cámara y peer connection ────────────
  useEffect(() => {
    return () => {
      if (autoEndRef.current) clearTimeout(autoEndRef.current);
      if (tickerRef.current) clearInterval(tickerRef.current);
      try {
        pcRef.current?.close();
      } catch (_) {}
      pcRef.current = null;
      remoteDescSetRef.current = false;
      // Stop all tracks to turn off camera LED
      localStreamRef.current?.getTracks().forEach((t) => t.stop());
      localStreamRef.current = null;
      iceCandidateQueueRef.current = [];
    };
  }, []);

  return {
    // Campos compatibles con ZegoCallApi
    state,
    error,
    localStreamId: '',     // native-only (Zego)
    remoteStreamId: null,  // native-only (Zego)
    remoteUserId: null,
    remoteUserName,
    micEnabled,
    cameraEnabled,
    useFrontCamera: true,
    durationSec,
    remainingMs,
    start,
    end,
    toggleMic,
    toggleCamera,
    flipCamera: NOOP_ASYNC, // no-op en web (la cámara frontal/trasera es solo mobile)
    // Extras web
    localStream,
    remoteStream,
    emitSignal,
    pc: pcRef.current,
  };
}
