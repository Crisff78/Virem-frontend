import { useState } from 'react';
import type { CallConnectionState } from './useZegoCall';

/**
 * Tipos compartidos para la API de videollamada.
 */
export type WebRTCCallApi = {
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
  remainingMs: number;
  start: () => Promise<void>;
  end: (reason?: string) => Promise<void>;
  toggleMic: () => Promise<void>;
  toggleCamera: () => Promise<void>;
  flipCamera: () => Promise<void>;
  localStream: any;
  remoteStream: any;
};

/**
 * Versión NO-OP para móvil del hook WebRTC.
 * Evita que el SDK de Web de Zego choque en dispositivos nativos.
 * En móvil se debe usar useZegoCall.ts en su lugar.
 */
export function useWebRTCCall(
  citaId?: string,
  _initiate?: boolean
): WebRTCCallApi {
  const [state] = useState<CallConnectionState>('idle');

  return {
    state,
    error: null,
    localStreamId: '',
    remoteStreamId: null,
    remoteUserId: null,
    remoteUserName: null,
    micEnabled: true,
    cameraEnabled: true,
    useFrontCamera: true,
    durationSec: 0,
    remainingMs: 0,
    start: async () => { console.warn('[useWebRTCCall] No disponible en móvil. Usa useZegoCall.'); },
    end: async () => {},
    toggleMic: async () => {},
    toggleCamera: async () => {},
    flipCamera: async () => {},
    localStream: null,
    remoteStream: null,
  };
}
