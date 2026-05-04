import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import {
  LiveKitRoom,
  VideoTrack,
  useTracks,
  AudioSession,
  registerGlobals,
} from '@livekit/react-native';
import { Track } from 'livekit-client';

// Register WebRTC globals
if (Platform.OS !== 'web') {
  registerGlobals();
}

type VideoCallFrameProps = {
  roomName: string;
  displayName: string;
  onHangup?: () => void;
  onReadyToClose?: () => void;
  token?: string; // LiveKit token
  liveKitUrl?: string;
};

/**
 * Professional Video Call component using LiveKit.
 * Features: Native WebRTC, Audio Session management, Toggle Cam/Mic, Switch Camera.
 */
const VideoCallFrame: React.FC<VideoCallFrameProps> = ({
  roomName,
  displayName,
  onHangup,
  onReadyToClose,
  token,
  liveKitUrl = 'wss://virem.livekit.cloud',
}: VideoCallFrameProps) => {
  const [micEnabled, setMicEnabled] = useState<boolean>(true);
  const [camEnabled, setCamEnabled] = useState<boolean>(true);

  useEffect(() => {
    if (Platform.OS !== 'web') {
      AudioSession.startAudioSession();
      return () => {
        AudioSession.stopAudioSession();
      };
    }
  }, []);

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
    <LiveKitRoom
      serverUrl={liveKitUrl}
      token={token}
      connect={true}
      audio={true}
      video={true}
      onDisconnected={onHangup}
      style={styles.container}
    >
      <RoomControls 
        onHangup={onHangup}
        micEnabled={micEnabled}
        setMicEnabled={setMicEnabled}
        camEnabled={camEnabled}
        setCamEnabled={setCamEnabled}
      />
      <ParticipantView />
    </LiveKitRoom>
  );
};

const ParticipantView = () => {
  const tracks = useTracks([
    { source: Track.Source.Camera, withPlaceholder: true },
    { source: Track.Source.ScreenShare, withPlaceholder: false },
  ]);

  // Find remote camera track
  const remoteTrack = tracks.find(t => !t.participant.isLocal && t.source === Track.Source.Camera);
  // Find local camera track
  const localTrack = tracks.find(t => t.participant.isLocal && t.source === Track.Source.Camera);

  return (
    <View style={styles.stage}>
      {/* Remote Video (Full Screen) */}
      <View style={styles.remoteContainer}>
        {remoteTrack ? (
          <VideoTrack trackRef={remoteTrack} style={styles.remoteVideo} />
        ) : (
          <View style={styles.waitingContainer}>
            <ActivityIndicator size="large" color="#137fec" />
            <Text style={styles.waitingText}>Esperando al otro participante...</Text>
          </View>
        )}
      </View>

      {/* Local Video (PiP) */}
      <View style={styles.localContainer}>
        {localTrack && (
          <VideoTrack trackRef={localTrack} style={styles.localVideo} />
        )}
      </View>
    </View>
  );
};

const RoomControls = ({ onHangup, micEnabled, setMicEnabled, camEnabled, setCamEnabled }: { onHangup?: () => void, micEnabled: boolean, setMicEnabled: (v: boolean) => void, camEnabled: boolean, setCamEnabled: (v: boolean) => void }) => {
  return (
    <View style={styles.controlsOverlay}>
      <View style={styles.controlsRow}>
        <TouchableOpacity 
          style={[styles.controlBtn, !micEnabled && styles.controlBtnOff]} 
          onPress={() => setMicEnabled(!micEnabled)}
        >
          <MaterialIcons name={micEnabled ? "mic" : "mic-off"} size={24} color="#fff" />
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.controlBtn, !camEnabled && styles.controlBtnOff]} 
          onPress={() => setCamEnabled(!camEnabled)}
        >
          <MaterialIcons name={camEnabled ? "videocam" : "videocam-off"} size={24} color="#fff" />
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.controlBtn, styles.hangupBtn]} 
          onPress={onHangup}
        >
          <MaterialIcons name="call-end" size={28} color="#fff" />
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default VideoCallFrame;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  stage: {
    flex: 1,
    position: 'relative',
  },
  remoteContainer: {
    flex: 1,
    backgroundColor: '#0A1931',
    justifyContent: 'center',
    alignItems: 'center',
  },
  remoteVideo: {
    width: '100%',
    height: '100%',
  },
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
  localVideo: {
    flex: 1,
  },
  controlsOverlay: {
    position: 'absolute',
    bottom: 40,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 20,
  },
  controlsRow: {
    flexDirection: 'row',
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingVertical: 12,
    paddingHorizontal: 25,
    borderRadius: 40,
    gap: 20,
    alignItems: 'center',
  },
  controlBtn: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  controlBtnOff: {
    backgroundColor: '#ef4444',
  },
  hangupBtn: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#ef4444',
  },
  waitingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  waitingText: {
    color: '#8aa7bf',
    marginTop: 15,
    fontSize: 14,
    fontWeight: '600',
  },
  errorOverlay: {
    flex: 1,
    backgroundColor: '#0A1931',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  errorText: {
    marginTop: 15,
    color: '#fff',
    fontSize: 16,
    textAlign: 'center',
  },
  retryBtn: {
    marginTop: 20,
    backgroundColor: '#137fec',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  retryBtnText: {
    color: '#fff',
    fontWeight: '700',
  },
});
