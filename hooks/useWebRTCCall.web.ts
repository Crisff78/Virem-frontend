/**
 * Hook de videollamada unificado para Web basado en Zego Cloud SDK.
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
  _initiate: boolean = false
): WebRTCCallApi {
  const cleanCitaId = String(citaId || '').trim();

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

  const zgRef = useRef<ZegoExpressEngine | null>(null);
  const tokenRef = useRef<ZegoTokenResponse | null>(null);
  const startedAtRef = useRef<number | null>(null);
  const tickerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const autoEndRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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

  const setupZegoListeners = (zg: ZegoExpressEngine) => {
    zg.on('roomStreamUpdate', async (roomID, updateType, streamList) => {
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
      if (state === 'DISCONNECTED') {
        setState('idle');
      }
    });
  };

  const start = useCallback(async () => {
    if (!IS_WEB || !cleanCitaId) return;
    setState('connecting');
    setError(null);

    try {
      const tokenRes = await appointmentVideoService.requestToken(cleanCitaId);
      tokenRef.current = tokenRes;

      if (!tokenRes.access.canJoin) {
        setError('La videollamada no está disponible en este momento.');
        setState('error');
        return;
      }

      const zg = new ZegoExpressEngine(tokenRes.zego.appId, tokenRes.zego.server);
      zgRef.current = zg;
      setupZegoListeners(zg);

      await zg.loginRoom(
        tokenRes.zego.roomId,
        tokenRes.zego.token,
        { userID: tokenRes.zego.userId, userName: tokenRes.zego.userName },
        { userUpdate: true }
      );

      const stream = await zg.createStream({
        camera: { video: true, audio: true, videoQuality: 2 }
      });
      
      const sId = `stream-${tokenRes.zego.userId}`;
      setLocalStreamId(sId);
      setLocalStream(stream);
      await zg.startPublishingStream(sId, stream);
      
      if (tokenRes.access.closesAt) {
        const ms = Math.max(0, tokenRes.access.closesAt - Date.now());
        setRemainingMs(ms);
        if (autoEndRef.current) clearTimeout(autoEndRef.current);
        autoEndRef.current = setTimeout(() => {
          end('time_up');
        }, ms + 1000);
      }
    } catch (err: any) {
      setError(err?.message || 'Error con Zego');
      setState('error');
    }
  }, [cleanCitaId]);

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
  }, [cleanCitaId, localStream, localStreamId, remoteStreamId]);

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

  return {
    state, error, localStreamId, remoteStreamId, remoteUserId, remoteUserName,
    micEnabled, cameraEnabled, useFrontCamera: true, durationSec, remainingMs,
    start, end, toggleMic, toggleCamera, flipCamera: async () => {},
    localStream, remoteStream,
  };
}
