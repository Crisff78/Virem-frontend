export type CallState = 'idle' | 'joining' | 'connected' | 'disconnected' | 'reconnecting' | 'ended';

export interface VideoCallApi {
  state: CallState;
  error: string | null;
  durationSec: number;
  remainingMs: number;
  start: () => Promise<void>;
  end: (reason?: string) => Promise<void>;
  provider: 'jitsi';
  jitsiConfig?: {
    domain: string;
    roomName: string;
    displayName: string;
    userId: string;
  };
}
