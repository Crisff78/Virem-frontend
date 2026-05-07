import { useCallback, useEffect, useRef, useState } from 'react';
import { Platform, PermissionsAndroid } from 'react-native';
import {
  appointmentVideoService,
  type ZegoTokenResponse,
} from '../services/appointmentVideoService';
import {
  ensureZegoInitialized,
  getZegoEngine,
  isZegoAvailable,
  joinZegoRoom,
  leaveZegoRoom,
  destroyZego,
  setCameraEnabled as zegoSetCamera,
  setMicrophoneEnabled as zegoSetMic,
  switchCamera as zegoSwitchCamera,
} from '../services/zegoService';

export type CallConnectionState = 'idle' | 'connecting' | 'live' | 'reconnecting' | 'ended' | 'error';

export type ZegoCallState = {
  state: CallConnectionState;
  error: string | null;
  localStreamId: string;
  remoteStreamId: string | null;
  remoteUserId: string | null;
  remoteUserName: string | null;
  micEnabled: boolean;
  cameraEnabled: boolean;
  useFrontCamera: boolean;
  durationSec: number;
  /** ms restantes hasta el cierre forzado por horario */
  remainingMs: number;
  /** Web-only: MediaStream local (siempre null en native/Zego) */
  localStream: MediaStream | null;
  /** Web-only: MediaStream remoto (siempre null en native/Zego) */
  remoteStream: MediaStream | null;
};

export type ZegoCallApi = ZegoCallState & {
  start: () => Promise<void>;
  end: (reason?: string) => Promise<void>;
  toggleMic: () => Promise<void>;
  toggleCamera: () => Promise<void>;
  flipCamera: () => Promise<void>;
};

async function requestAndroidPermissions(): Promise<boolean> {
  if (Platform.OS !== 'android') return true;
  try {
    const granted = await PermissionsAndroid.requestMultiple([
      PermissionsAndroid.PERMISSIONS.CAMERA,
      PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
    ]);
    return (
      granted[PermissionsAndroid.PERMISSIONS.CAMERA] === PermissionsAndroid.RESULTS.GRANTED &&
      granted[PermissionsAndroid.PERMISSIONS.RECORD_AUDIO] === PermissionsAndroid.RESULTS.GRANTED
    );
  } catch (err) {
    console.warn('[zego] permisos:', err);
    return false;
  }
}

export function useZegoCall(citaId: string | undefined): ZegoCallApi {
  const [state, setState] = useState<CallConnectionState>('idle');
  const [error, setError] = useState<string | null>(null);
  const [localStreamId, setLocalStreamId] = useState('');
  const [remoteStreamId, setRemoteStreamId] = useState<string | null>(null);
  const [remoteUserId, setRemoteUserId] = useState<string | null>(null);
  const [remoteUserName, setRemoteUserName] = useState<string | null>(null);
  const [micEnabled, setMicEnabled] = useState(true);
  const [cameraEnabled, setCameraEnabled] = useState(true);
  const [useFrontCamera, setUseFrontCamera] = useState(true);
  const [durationSec, setDurationSec] = useState(0);
  const [remainingMs, setRemainingMs] = useState(0);

  const tokenRef = useRef<ZegoTokenResponse | null>(null);
  const startedAtRef = useRef<number | null>(null);
  const tickerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const autoEndRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const cleanCitaId = (citaId || '').trim();

  /** Listeners SDK (solo en nativo) */
  useEffect(() => {
    if (!isZegoAvailable()) return;
    let mounted = true;

    (async () => {
      const engine = await ensureZegoInitialized();
      if (!engine || !mounted) return;
      try {
        engine.on('roomStreamUpdate', (_roomId: string, updateType: number, streamList: any[]) => {
          // updateType: 0 = ADD, 1 = DELETE
          if (updateType === 0 && streamList?.length) {
            const s = streamList[0];
            setRemoteStreamId(s.streamID);
            setRemoteUserId(s?.user?.userID || null);
            setRemoteUserName(s?.user?.userName || null);
            try { engine.startPlayingStream(s.streamID); } catch (_) {}
          } else if (updateType === 1) {
            // Se fue
            try {
              for (const s of streamList || []) engine.stopPlayingStream(s.streamID);
            } catch (_) {}
            setRemoteStreamId(null);
            setRemoteUserId(null);
            setRemoteUserName(null);
          }
        });

        engine.on('roomStateUpdate', (_roomId: string, stateCode: number) => {
          // 0 = Disconnected, 1 = Connecting, 2 = Connected
          if (stateCode === 1) setState((prev) => (prev === 'live' ? 'reconnecting' : 'connecting'));
          if (stateCode === 2) {
            setState('live');
            if (!startedAtRef.current) startedAtRef.current = Date.now();
          }
        });

        engine.on('roomUserUpdate', (_roomId: string, _updateType: number, _userList: any[]) => {
          // dejado para extender
        });
      } catch (err) {
        console.warn('[zego] listeners:', err);
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

  /** Ticker de duracion + corte forzado por horario */
  useEffect(() => {
    if (state !== 'live') {
      if (tickerRef.current) clearInterval(tickerRef.current);
      return;
    }
    tickerRef.current = setInterval(() => {
      const startedAt = startedAtRef.current || Date.now();
      setDurationSec(Math.floor((Date.now() - startedAt) / 1000));

      const closesAt = tokenRef.current?.access?.closesAt;
      if (closesAt) {
        const remaining = closesAt - Date.now();
        setRemainingMs(Math.max(0, remaining));
        if (remaining <= 0) {
          // Cierre automatico al expirar la ventana de la cita
          end('time_up').catch(() => undefined);
        }
      }
    }, 1000);
    return () => {
      if (tickerRef.current) clearInterval(tickerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  /** Iniciar / unirse */
  const start = useCallback(async () => {
    if (Platform.OS === 'web') return; // web usa useWebRTCCall en su lugar
    if (!cleanCitaId) {
      setError('Cita invalida.');
      setState('error');
      return;
    }
    if (!isZegoAvailable()) {
      setError(
        'El SDK de video no esta disponible en este entorno. Usa el dev client (no Expo Go).'
      );
      setState('error');
      return;
    }

    setState('connecting');
    setError(null);
    try {
      const granted = await requestAndroidPermissions();
      if (!granted) {
        setError('Necesitas permitir camara y microfono.');
        setState('error');
        return;
      }

      const tokenResponse = await appointmentVideoService.requestToken(cleanCitaId);
      tokenRef.current = tokenResponse;

      // Programar fin automatico cuando la ventana cierre
      const closesAt = tokenResponse.access?.closesAt;
      if (closesAt) {
        const ms = Math.max(0, closesAt - Date.now());
        if (autoEndRef.current) clearTimeout(autoEndRef.current);
        autoEndRef.current = setTimeout(() => {
          end('time_up').catch(() => undefined);
        }, ms + 1000);
      }

      const join = await joinZegoRoom({
        token: tokenResponse.zego.token,
        roomId: tokenResponse.zego.roomId,
        userId: tokenResponse.zego.userId,
        userName: tokenResponse.zego.userName,
      });
      if (!join.ok) {
        setError('No se pudo unir a la sala.');
        setState('error');
        return;
      }
      setLocalStreamId(join.streamId);
      // Estado se resolvera en roomStateUpdate -> 'live'
    } catch (err: any) {
      const msg =
        err?.data?.message || err?.message || 'No se pudo iniciar la videollamada.';
      setError(msg);
      setState('error');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cleanCitaId]);

  const end = useCallback(async (reason?: string) => {
    if (autoEndRef.current) clearTimeout(autoEndRef.current);
    if (tickerRef.current) clearInterval(tickerRef.current);
    try {
      await leaveZegoRoom();
    } catch (_) {}
    if (cleanCitaId) {
      try {
        await appointmentVideoService.endCall(cleanCitaId);
      } catch (_) {}
    }
    setState('ended');
    setRemoteStreamId(null);
    setRemoteUserId(null);
    setRemoteUserName(null);
    if (reason === 'time_up') {
      setError('La ventana de la videollamada expiró.');
    }
  }, [cleanCitaId]);

  const toggleMic = useCallback(async () => {
    const next = !micEnabled;
    setMicEnabled(next);
    await zegoSetMic(next);
  }, [micEnabled]);

  const toggleCamera = useCallback(async () => {
    const next = !cameraEnabled;
    setCameraEnabled(next);
    await zegoSetCamera(next);
  }, [cameraEnabled]);

  const flipCamera = useCallback(async () => {
    const next = !useFrontCamera;
    setUseFrontCamera(next);
    await zegoSwitchCamera(next);
  }, [useFrontCamera]);

  /** Limpieza al desmontar — detener todo para evitar fugas de memoria */
  useEffect(() => {
    return () => {
      if (autoEndRef.current) clearTimeout(autoEndRef.current);
      if (tickerRef.current) clearInterval(tickerRef.current);
      // Detener streams y salir de la sala
      leaveZegoRoom().catch(() => undefined);
      // Destruir el motor completamente para liberar cámara/micrófono
      destroyZego().catch(() => undefined);
    };
  }, []);

  return {
    state,
    error,
    localStreamId,
    remoteStreamId,
    remoteUserId,
    remoteUserName,
    micEnabled,
    cameraEnabled,
    useFrontCamera,
    durationSec,
    remainingMs,
    start,
    end,
    toggleMic,
    toggleCamera,
    flipCamera,
    // Web-only — siempre null en este hook (Zego no usa MediaStream del navegador)
    localStream: null as MediaStream | null,
    remoteStream: null as MediaStream | null,
  };
}
