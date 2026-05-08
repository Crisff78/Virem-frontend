import { useState, useEffect, useCallback, useRef } from 'react';
import { Room, RoomEvent, VideoPresets } from 'livekit-client';
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

  const roomRef = useRef<InstanceType<typeof Room> | null>(null);

  const start = useCallback(async () => {
    if (state !== 'idle') return;
    setState('joining');
    setError(null);

    try {
      const response = await apiClient.post<any>(`/api/video/me/citas/${citaId}/token`, { body: {}, authenticated: true });
      if (!response.success || !response.livekit) {
        throw new Error(response.message || 'Error al obtener token de videollamada');
      }

      const { url, token } = response.livekit;

      const room = new Room({
        videoCaptureDefaults: {
          resolution: VideoPresets.h720.resolution,
        },
        publishDefaults: {
          videoSimulcast: true,
        },
      });
      roomRef.current = room;

      room.on(RoomEvent.Connected, () => setState('connected'));
      room.on(RoomEvent.Disconnected, () => setState('disconnected'));
      room.on(RoomEvent.Reconnecting, () => setState('reconnecting'));
      room.on(RoomEvent.Reconnected, () => setState('connected'));

      await room.connect(url, token);
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
    try {
      await apiClient.post(`/api/video/me/citas/${citaId}/end`, { body: { reason }, authenticated: true });
    } catch (e) {}
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
    setIsFrontCamera(!isFrontCamera);
  }, [isFrontCamera]);

  useEffect(() => {
    return () => {
      if (roomRef.current) {
        roomRef.current.disconnect();
      }
    };
  }, []);

  useEffect(() => {
    if (state !== 'connected') return;
    const timer = setInterval(() => {
      setDurationSec(d => d + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [state]);

  return {
    state,
    error,
    localParticipant: roomRef.current?.localParticipant,
    remoteParticipants: Array.from(roomRef.current?.participants.values() || []),
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
