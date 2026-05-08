import { Track } from 'livekit-client';

export type CallState = 'idle' | 'joining' | 'connected' | 'disconnected' | 'reconnecting' | 'ended';

export interface LiveKitCallApi {
  state: CallState;
  error: string | null;
  localParticipant: any;
  remoteParticipants: any[];
  micEnabled: boolean;
  cameraEnabled: boolean;
  isFrontCamera: boolean;
  durationSec: number;
  remainingMs: number;
  start: () => Promise<void>;
  end: (reason?: string) => Promise<void>;
  toggleMic: () => Promise<void>;
  toggleCamera: () => Promise<void>;
  flipCamera: () => Promise<void>;
  room: any;
}
