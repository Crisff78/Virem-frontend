/**
 * Hook de videollamada unificado para Web basado en Zego Cloud SDK.
 * 
 * Reemplaza la implementación manual de WebRTC para garantizar paridad con
 * la aplicación móvil y estabilidad en redes complejas.
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { Platform } from 'react-native';
import { ZegoExpressEngine } from 'zego-express-engine-webrtc';

import { appointmentVideoService, type ZegoTokenResponse } from '../services/appointmentVideoService';
import type { CallConnectionState, ZegoCallApi } from './useZegoCall';

export type WebRTCCallApi = ZegoCallApi & {
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;
};

const IS_WEB = Platform.OS === 'web';

export function useWebRTCCall(
  citaId: string | undefined,
  _initiate: boolean // Ya no lo usamos para lógica de señales, Zego es automático
): WebRTCCallApi {
  const cleanCitaId = String(citaId || '').trim();

  // ── State ────────────────────────────────────────────────────────────────
  const [state, setState] = useState<CallConnectionState>('idle');
  const [error, setError] = useState<string | null>(null);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [localStreamId, setLocalStreamId] = useState('');
  const [remoteStreamId, setRemoteStreamId] = useState<string | null>(null);
  const [remoteUserId, setRemoteUserId] = useState<string | null>(null);
  const [remoteUserName, setRemoteUserName] = useState<string | null>(null);
  const [micEnabled, setMicEnabled] = useState(true);
  const [cameraEnabled, setCameraEnabled] = useState(true);
  const [durationSec, setDurationSec] = useState(0);
  const [remainingMs, setRemainingMs] = useState(0);

  // ── Refs ─────────────────────────────────────────────────────────────────
  const zgRef = useRef<ZegoExpressEngine | null>(null);
  const tokenRef = useRef<ZegoTokenResponse | null>(null);
  const startedAtRef = useRef<number | null>(null);
  const tickerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const autoEndRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Ticker: duracion + corte forzado por horario ──────────────────────────
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
        const rem = closesAt - Date.now();
        setRemainingMs(Math.max(0, rem));
        if (rem <= 0) {
          end('time_up').catch(() => {});
        }
      }
    }, 1000);
    return () => {
      if (tickerRef.current) clearInterval(tickerRef.current);
    };
  }, [state]);

  // ── Handlers de Zego ──────────────────────────────────────────────────────
  const setupZegoListeners = (zg: ZegoExpressEngine) => {
    zg.on('roomStreamUpdate', async (roomID, updateType, streamList) => {
      console.log('[ZegoWeb] roomStreamUpdate:', updateType, streamList);
      if (updateType === 'ADD') {
        const s = streamList[0];
        if (s) {
          try {
            const stream = await zg.startPlayingStream(s.streamID);
            setRemoteStream(stream);
            setRemoteStreamId(s.streamID);
            setRemoteUserId(s.user?.userID || null);
            setRemoteUserName(s.user?.userName || null);
            setState('live');
            if (!startedAtRef.current) startedAtRef.current = Date.now();
          } catch (err) {
            console.error('[ZegoWeb] Error al reproducir stream remoto:', err);
          }
        }
      } else if (updateType === 'DELETE') {
        const s = streamList[0];
        if (s && s.streamID === remoteStreamId) {
          zg.stopPlayingStream(s.streamID);
          setRemoteStream(null);
          setRemoteStreamId(null);
          setRemoteUserId(null);
          setRemoteUserName(null);
        }
      }
    });

    zg.on('roomStateUpdate', (roomID, state, errorCode) => {
      console.log('[ZegoWeb] roomStateUpdate:', state, errorCode);
      if (state === 'CONNECTED') {
        // Logged in
      } else if (state === 'DISCONNECTED') {
        setState('idle');
      }
    });

    zg.on('publisherStateUpdate', (result: any) => {
      console.log('[ZegoWeb] publisherStateUpdate:', result.state);
      if (result.state === 'PUBLISHING') {
        // Local stream is live
      }
    });
  };

  // ── start ─────────────────────────────────────────────────────────────────
  const start = useCallback(async () => {
    if (!IS_WEB || !cleanCitaId) return;

    setState('connecting');
    setError(null);

    try {
      // 1. Obtener Token y Configuración desde el backend
      const tokenRes = await appointmentVideoService.requestToken(cleanCitaId);
      tokenRef.current = tokenRes;

      if (!tokenRes.access.canJoin) {
        setError('La videollamada no está disponible en este momento.');
        setState('error');
        return;
      }

      // 2. Inicializar Engine
      const zg = new ZegoExpressEngine(tokenRes.zego.appId, tokenRes.zego.server);
      zgRef.current = zg;
      setupZegoListeners(zg);

      // 3. Login Room
      await zg.loginRoom(
        tokenRes.zego.roomId,
        tokenRes.zego.token,
        { userID: tokenRes.zego.userId, userName: tokenRes.zego.userName },
        { userUpdate: true }
      );

      // 4. Crear y Publicar Stream Local
      const stream = await zg.createStream({
        camera: {
          video: true,
          audio: true,
          videoQuality: 2 // 720p
        }
      });
      
      const sId = `stream-${tokenRes.zego.userId}`;
      setLocalStreamId(sId);
      setLocalStream(stream);
      
      await zg.startPublishingStream(sId, stream);
      
      // Programar fin automático si hay closesAt
      if (tokenRes.access.closesAt) {
        const ms = Math.max(0, tokenRes.access.closesAt - Date.now());
        setRemainingMs(ms);
        if (autoEndRef.current) clearTimeout(autoEndRef.current);
        autoEndRef.current = setTimeout(() => {
          end('time_up');
        }, ms + 1000);
      }

    } catch (err: any) {
      console.error('[ZegoWeb] Error en start:', err);
      const msg = err?.message || 'No se pudo iniciar la videollamada con Zego.';
      setError(msg);
      setState('error');
    }
  }, [cleanCitaId]);

  // ── end ───────────────────────────────────────────────────────────────────
  const end = useCallback(async (reason?: string) => {
    if (autoEndRef.current) clearTimeout(autoEndRef.current);
    if (tickerRef.current) clearInterval(tickerRef.current);

    const zg = zgRef.current;
    if (zg) {
      try {
        if (localStreamId) zg.stopPublishingStream(localStreamId);
        if (remoteStreamId) zg.stopPlayingStream(remoteStreamId);
        if (localStream) zg.destroyStream(localStream);
        await zg.logoutRoom();
      } catch (_) {}
    }

    zgRef.current = null;
    setLocalStream(null);
    setRemoteStream(null);
    setState('ended');
    
    if (cleanCitaId) {
      try { await appointmentVideoService.endCall(cleanCitaId); } catch (_) {}
    }
    if (reason === 'time_up') {
      setError('La ventana de la videollamada expiró.');
    }
  }, [cleanCitaId, localStream, localStreamId, remoteStreamId]);

  // ── Controles de media ────────────────────────────────────────────────────
  const toggleMic = useCallback(async () => {
    const next = !micEnabled;
    setMicEnabled(next);
    if (zgRef.current && localStream) {
       zgRef.current.mutePublishStreamAudio(localStream, !next);
    }
  }, [micEnabled, localStream]);

  const toggleCamera = useCallback(async () => {
    const next = !cameraEnabled;
    setCameraEnabled(next);
    if (zgRef.current && localStream) {
       zgRef.current.mutePublishStreamVideo(localStream, !next);
    }
  }, [cameraEnabled, localStream]);

  // ── Limpieza al desmontar ─────────────────────────────────────────────────
  useEffect(() => {
    return () => {
      if (autoEndRef.current) clearTimeout(autoEndRef.current);
      if (tickerRef.current) clearInterval(tickerRef.current);
      const zg = zgRef.current;
      if (zg) {
        zg.logoutRoom();
      }
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
    useFrontCamera: true,
    durationSec,
    remainingMs,
    start,
    end,
    toggleMic,
    toggleCamera,
    flipCamera: async () => {}, // No-op en web
    localStream,
    remoteStream,
  };
}
