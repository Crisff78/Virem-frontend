import React, { useEffect, useRef } from 'react';
import { Animated, Platform, StyleSheet, Text, View } from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { VideoView } from '@livekit/react-native';
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
  const pulse = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 1200, useNativeDriver: false }),
        Animated.timing(pulse, { toValue: 0.3, duration: 1200, useNativeDriver: false }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [pulse]);

  return (
    <View style={styles.avatarWrap}>
      <Animated.View
        style={[
          styles.pulseRing,
          fullscreen && styles.pulseRingLg,
          { opacity: pulse },
        ]}
      />
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
  const videoTrack = participant?.getTrack(Track.Source.Camera)?.videoTrack;
  const showVideo = enabled && participant && videoTrack;

  return (
    <View style={[styles.wrap, fullscreen && styles.fullscreen]}>
      {showVideo ? (
        <VideoView
          track={videoTrack}
          style={StyleSheet.absoluteFill}
          mirror={mode === 'local'}
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
  pulseRing: {
    position: 'absolute',
    width: 160,
    height: 160,
    borderRadius: 160,
    borderWidth: 2,
    borderColor: 'rgba(19,127,236,0.4)',
  },
  pulseRingLg: {
    width: 200,
    height: 200,
    borderRadius: 200,
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
