import React, { useEffect, useState, useRef } from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { Room, RoomEvent, VideoPreserveAspectRatio, Track } from 'livekit-client';

type VideoCallFrameProps = {
  roomName: string;
  displayName: string;
  onHangup?: () => void;
  onReadyToClose?: () => void;
  token?: string;
  liveKitUrl?: string;
};

const VideoCallFrame: React.FC<VideoCallFrameProps> = ({
  onHangup,
  token,
  liveKitUrl = 'wss://virem.livekit.cloud',
}) => {
  const [room, setRoom] = useState<Room | null>(null);
  const [remoteTrack, setRemoteTrack] = useState<any>(null);
  const [localTrack, setLocalTrack] = useState<any>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const localVideoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (!token) return;

    const r = new Room();
    setRoom(r);

    r.on(RoomEvent.TrackSubscribed, (track) => {
      if (track.kind === 'video') {
        setRemoteTrack(track);
      }
    });

    r.on(RoomEvent.LocalTrackPublished, (publication) => {
      if (publication.track?.kind === 'video') {
        setLocalTrack(publication.track);
      }
    });

    r.connect(liveKitUrl, token).then(() => {
      r.localParticipant.setCameraEnabled(true);
      r.localParticipant.setMicrophoneEnabled(true);
    });

    return () => {
      r.disconnect();
    };
  }, [token, liveKitUrl]);

  useEffect(() => {
    if (remoteTrack && remoteVideoRef.current) {
      remoteTrack.attach(remoteVideoRef.current);
    }
  }, [remoteTrack]);

  useEffect(() => {
    if (localTrack && localVideoRef.current) {
      localTrack.attach(localVideoRef.current);
    }
  }, [localTrack]);

  if (!token) {
    return (
      <View style={styles.errorOverlay}>
        <MaterialIcons name="error-outline" size={48} color="#ef4444" />
        <Text style={styles.errorText}>No se pudo obtener el token de acceso.</Text>
        <TouchableOpacity style={styles.retryBtn} onPress={onHangup}>
          <Text style={styles.retryBtnText}>Regresar</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.stage}>
        <View style={styles.remoteContainer}>
          {!remoteTrack && (
            <View style={styles.waitingContainer}>
              <ActivityIndicator size="large" color="#137fec" />
              <Text style={styles.waitingText}>Esperando al otro participante...</Text>
            </View>
          )}
          <video 
            ref={remoteVideoRef} 
            style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
            autoPlay 
            playsInline 
          />
        </View>

        <View style={styles.localContainer}>
          <video 
            ref={localVideoRef} 
            style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
            autoPlay 
            playsInline 
            muted 
          />
        </View>
      </View>

      <View style={styles.controlsOverlay}>
        <View style={styles.controlsRow}>
          <TouchableOpacity 
            style={[styles.controlBtn, styles.hangupBtn]} 
            onPress={onHangup}
          >
            <MaterialIcons name="call-end" size={28} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

export default VideoCallFrame;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  stage: { flex: 1, position: 'relative' },
  remoteContainer: { flex: 1, backgroundColor: '#0A1931', justifyContent: 'center', alignItems: 'center' },
  localContainer: {
    position: 'absolute',
    top: 50,
    right: 20,
    width: 120,
    height: 180,
    borderRadius: 16,
    backgroundColor: '#1A3D63',
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.2)',
    zIndex: 10,
  },
  controlsOverlay: { position: 'absolute', bottom: 40, left: 0, right: 0, alignItems: 'center', zIndex: 20 },
  controlsRow: { flexDirection: 'row', backgroundColor: 'rgba(0,0,0,0.6)', paddingVertical: 12, paddingHorizontal: 25, borderRadius: 40, gap: 20, alignItems: 'center' },
  controlBtn: { width: 50, height: 50, borderRadius: 25, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center' },
  hangupBtn: { width: 60, height: 60, borderRadius: 30, backgroundColor: '#ef4444' },
  waitingContainer: { position: 'absolute', zIndex: 5, alignItems: 'center', justifyContent: 'center' },
  waitingText: { color: '#8aa7bf', marginTop: 15, fontSize: 14, fontWeight: '600' },
  errorOverlay: { flex: 1, backgroundColor: '#0A1931', alignItems: 'center', justifyContent: 'center', padding: 20 },
  errorText: { marginTop: 15, color: '#fff', fontSize: 16, textAlign: 'center' },
  retryBtn: { marginTop: 20, backgroundColor: '#137fec', paddingVertical: 10, paddingHorizontal: 20, borderRadius: 8 },
  retryBtnText: { color: '#fff', fontWeight: '700' },
});
