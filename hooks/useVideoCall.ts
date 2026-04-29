import { useCallback, useState } from 'react';
import { apiClient } from '../utils/api';
import { useAuth } from '../providers/AuthProvider';

type VideoRoomInfo = {
  videoSalaId: string;
  proveedor: string;
  roomName: string;
  joinUrl: string;
  estado: string;
  canJoin: boolean;
  jitsiDomain?: string;
  jwtToken?: string;
};

export function useVideoCall() {
  const { token } = useAuth();
  const [isInCall, setIsInCall] = useState(false);
  const [roomInfo, setRoomInfo] = useState<VideoRoomInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const startCall = useCallback(async (citaId: string, isDoctor: boolean = false) => {
    setLoading(true);
    setError(null);
    try {
      const endpoint = isDoctor 
        ? `/api/agenda/me/citas/${citaId}/video-sala/abrir`
        : `/api/agenda/me/citas/${citaId}/video-sala`;
      
      let payload: any;
      if (isDoctor) {
        payload = await apiClient.post<any>(endpoint, { authenticated: true });
      } else {
        payload = await apiClient.get<any>(endpoint, { authenticated: true });
      }

      if (!payload?.success || !payload?.videoSala) {
        throw new Error(payload?.message || 'No se pudo obtener la información de la sala.');
      }

      const sala = payload.videoSala;
      if (!sala.canJoin) {
        throw new Error('Tu médico aún no ha iniciado la videollamada. Por favor, espera un momento.');
      }

      setRoomInfo({
        videoSalaId: sala.videoSalaId,
        proveedor: sala.proveedor || 'jitsi',
        roomName: sala.roomName || sala.room_name,
        joinUrl: sala.joinUrl,
        estado: sala.estado,
        canJoin: sala.canJoin,
        // The backend should ideally provide these for embedded use
        jitsiDomain: sala.jitsiDomain || 'meet.jit.si',
        jwtToken: sala.jwtToken,
      });
      setIsInCall(true);
    } catch (err: any) {
      setError(err.message || 'Error al iniciar la videollamada.');
    } finally {
      setLoading(false);
    }
  }, []);

  const endCall = useCallback(() => {
    setIsInCall(false);
    setRoomInfo(null);
  }, []);

  return {
    isInCall,
    roomInfo,
    loading,
    error,
    startCall,
    endCall,
    setError,
  };
}
