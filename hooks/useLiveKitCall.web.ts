import { useState, useEffect, useCallback, useRef } from 'react';
import {
  Room,
  RoomEvent,
  VideoPresets,
  RemoteParticipant,
} from 'livekit-client';
import { apiClient } from '../utils/api';
import { LiveKitCallApi, CallState } from './useLiveKitCall.types';

export function useLiveKitCall(citaId: string): LiveKitCallApi {
  const [state, setState] = useState<CallState>('idle');
  const [error, setError] = useState<string | null>(null);
  const [micEnabled, setMicEnabled] = useState(true);
  const [cameraEnabled, setCameraEnabled] = useState(true);
  const [isFrontCamera, setIsFrontCamera] = useState(true);
  const [durationSec, setDurationSec] = useState(0);
  const [remainingMs, setRemainingMs] = useState(0);
  const [remoteParticipants, setRemoteParticipants] = useState<any[]>([]);

  const roomRef = useRef<any>(null);
  const mountedRef = useRef(false);

  const start = useCallback(async () => {
    if (state !== 'idle') return;
    setState('joining');
    setError(null);

    try {
      console.log('[LiveKit Web] Requesting token for cita:', citaId);
      const response = await apiClient.post<any>(
        `/api/video/me/citas/${citaId}/token`,
        { body: {}, authenticated: true }
      );

      console.log('[LiveKit Web] Token response:', {
        success: response.success,
        provider: response.provider,
        hasLiveKit: !!response.livekit,
      });

      if (!response.success || !response.livekit) {
        throw new Error(response.message || 'Proveedor no disponible');
      }

      const { url, token } = response.livekit;
      console.log('[LiveKit Web] Connecting to:', url);

      const room = new Room({
        videoCaptureDefaults: { resolution: VideoPresets.h720.resolution },
        publishDefaults: { videoSimulcast: true },
      });
      roomRef.current = room;

      const syncRemotes = () => {
        const map = room.remoteParticipants;
        setRemoteParticipants(map ? Array.from(map.values()) : []);
      };

      room.on(RoomEvent.Connected, () => {
        console.log('[LiveKit Web] Connected!');
        setState('connected');
        syncRemotes();
      });
      room.on(RoomEvent.Disconnected, () => {
        console.log('[LiveKit Web] Disconnected');
        setState('disconnected');
        setRemoteParticipants([]);
      });
      room.on(RoomEvent.Reconnecting, () => setState('reconnecting'));
      room.on(RoomEvent.Reconnected, () => {
        setState('connected');
        syncRemotes();
      });
      room.on(RoomEvent.ParticipantConnected, syncRemotes);
      room.on(RoomEvent.ParticipantDisconnected, syncRemotes);

      await room.connect(url, token, { autoSubscribe: true });
      await room.localParticipant.enableCameraAndMicrophone();

      setMicEnabled(room.localParticipant.isMicrophoneEnabled);
      setCameraEnabled(room.localParticipant.isCameraEnabled);

    } catch (err: any) {
      console.error('[LiveKit Web] Connection error:', err);
      setError(err.message || 'No se pudo conectar a la videollamada');
      setState('idle');
    }
  }, [citaId, state]);

  const end = useCallback(async (reason?: string) => {
    if (roomRef.current) {
      roomRef.current.disconnect();
      roomRef.current = null;
    }
    setState('ended');
    setRemoteParticipants([]);
    try {
      await apiClient.post(`/api/video/me/citas/${citaId}/end`, {
        body: { reason },
        authenticated: true,
      });
    } catch (_) {}
  }, [citaId]);

  const toggleMic = useCallback(async () => {
    if (!roomRef.current) return;
    const enabled = !micEnabled;
    await roomRef.current.localParticipant.setMicrophoneEnabled(enabled);
    setMicEnabled(enabled);
  }, [micEnabled]);

  const toggleCamera = useCallback(async () => {
    if (!roomRef.current) return;
    const enabled = !cameraEnabled;
    await roomRef.current.localParticipant.setCameraEnabled(enabled);
    setCameraEnabled(enabled);
  }, [cameraEnabled]);

  const flipCamera = useCallback(async () => {
    setIsFrontCamera(f => !f);
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      setTimeout(() => {
        if (!mountedRef.current && roomRef.current) {
          roomRef.current.disconnect();
          roomRef.current = null;
        }
      }, 100);
    };
  }, []);

  useEffect(() => {
    if (state !== 'connected') return;
    const timer = setInterval(() => setDurationSec(d => d + 1), 1000);
    return () => clearInterval(timer);
  }, [state]);

  return {
    state,
    error,
    localParticipant: roomRef.current?.localParticipant,
    remoteParticipants,
    micEnabled,
    cameraEnabled,
    isFrontCamera,
    durationSec,
    remainingMs,
    start,
    end,
    toggleMic,
    toggleCamera,
    flipCamera,
    room: roomRef.current,
  };
}