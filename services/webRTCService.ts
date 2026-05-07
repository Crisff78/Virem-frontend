/**
 * Utilidades WebRTC nativas del navegador.
 *
 * Solo se usa en la plataforma web. En native (iOS/Android) el video corre
 * sobre Zego Express Engine (zegoService.ts).
 *
 * No se importa ningún paquete externo: el navegador ya incluye RTCPeerConnection,
 * MediaDevices y MediaStream como APIs estándar.
 */
import { Platform } from 'react-native';

/** STUN servers públicos de Google — sin costo, sin registro */
export const ICE_SERVERS: RTCIceServer[] = [
  { urls: ['stun:stun.l.google.com:19302', 'stun:stun1.l.google.com:19302'] },
];

/** True si el navegador soporta WebRTC */
export function isWebRTCAvailable(): boolean {
  return (
    Platform.OS === 'web' &&
    typeof window !== 'undefined' &&
    typeof (window as any).RTCPeerConnection !== 'undefined' &&
    typeof navigator !== 'undefined' &&
    typeof navigator.mediaDevices?.getUserMedia === 'function'
  );
}

export type PCCallbacks = {
  onIceCandidate: (candidate: RTCIceCandidateInit) => void;
  onTrack: (stream: MediaStream) => void;
  onConnectionStateChange: (state: RTCPeerConnectionState) => void;
};

/**
 * Crea y devuelve una RTCPeerConnection configurada con los STUN servers
 * y los callbacks provistos.
 */
export function createPeerConnection(callbacks: PCCallbacks): RTCPeerConnection {
  const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });

  pc.onicecandidate = (e) => {
    if (e.candidate) callbacks.onIceCandidate(e.candidate.toJSON());
  };

  pc.ontrack = (e) => {
    const stream = e.streams?.[0];
    if (stream) callbacks.onTrack(stream);
  };

  pc.onconnectionstatechange = () => {
    callbacks.onConnectionStateChange(pc.connectionState);
  };

  return pc;
}

/**
 * Obtiene el MediaStream local (cámara + micrófono).
 * Lanza si el usuario no concede permisos.
 */
export async function getLocalStream(
  constraints: MediaStreamConstraints = {
    video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 } },
    audio: true,
  }
): Promise<MediaStream> {
  return navigator.mediaDevices.getUserMedia(constraints);
}

/** Detiene todos los tracks de un stream (libera cámara/micrófono). */
export function stopStream(stream: MediaStream | null | undefined): void {
  stream?.getTracks().forEach((t) => t.stop());
}
