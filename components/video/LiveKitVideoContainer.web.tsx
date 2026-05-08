import React, { useEffect, useRef } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { VideoTrack } from '@livekit/components-react';
import { Track, Participant } from 'livekit-client';

type Props = {
  participant?: InstanceType<typeof Participant> | null;
  mode: 'local' | 'remote';
  enabled: boolean;
  fullscreen?: boolean;
  avatarLabel?: string;
};

const WaitingAvatar: React.FC<{ fullscreen?: boolean; label?: string }> = ({
  fullscreen,
  label,
}) => {
  return (
    <View style={styles.avatarWrap}>
      <View style={[styles.avatarCircle, fullscreen && styles.avatarCircleLg]}>
        <MaterialIcons
          name="person"
          size={fullscreen ? 80 : 36}
          color="#fff"
        />
      </View>
      {label ? (
        <Text style={[styles.avatarLabel, fullscreen && styles.avatarLabelLg]}>
          {label}
        </Text>
      ) : null}
    </View>
  );
};

const LiveKitVideoContainer: React.FC<Props> = ({
  participant,
  mode,
  enabled,
  fullscreen,
  avatarLabel,
}) => {
  const track = participant?.getTrack(Track.Source.Camera)?.videoTrack;
  const showVideo = enabled && participant && track;

  return (
    <View style={[styles.wrap, fullscreen && styles.fullscreen]}>
      {showVideo ? (
        <VideoTrack
          trackRef={track}
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
        />
      ) : (
        <WaitingAvatar fullscreen={fullscreen} label={avatarLabel} />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: {
    backgroundColor: '#0a1931',
    borderRadius: 14,
    overflow: 'hidden',
    flex: 1,
  },
  fullscreen: { flex: 1, borderRadius: 0 },
  avatarWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    backgroundColor: '#0a1931',
  },
  avatarCircle: {
    width: 96,
    height: 96,
    borderRadius: 96,
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'rgba(19,127,236,0.3)',
  },
  avatarCircleLg: {
    width: 140,
    height: 140,
    borderRadius: 140,
  },
  avatarLabel: { color: '#fff', fontSize: 14, fontWeight: '700', textAlign: 'center' },
  avatarLabelLg: { fontSize: 16, fontWeight: '800', marginTop: 8 },
});

export default LiveKitVideoContainer;
