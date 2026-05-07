import React, { useEffect, useRef, useState } from 'react';
import { Animated, StyleSheet, Text, View, Platform } from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';

type Props = {
  stream: MediaStream | null;
  muted?: boolean;
  fullscreen?: boolean;
  avatarLabel?: string;
  enabled?: boolean;
  fit?: 'cover' | 'contain';
};

const WebVideoContainer: React.FC<Props> = ({
  stream,
  muted = false,
  fullscreen = false,
  avatarLabel,
  enabled = true,
  fit = 'cover',
}) => {
  const containerRef = useRef<any>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const pulseAnim = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const showAvatar = !stream || !enabled;
    if (!showAvatar) return;

    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1, duration: 1200, useNativeDriver: false }),
        Animated.timing(pulseAnim, { toValue: 0.3, duration: 1200, useNativeDriver: false }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [stream, enabled, pulseAnim]);

  useEffect(() => {
    if (Platform.OS !== 'web' || typeof document === 'undefined') return;
    
    const domNode: HTMLElement | null = containerRef.current;
    if (!domNode) return;

    if (!videoRef.current) {
      const video = document.createElement('video');
      video.autoplay = true;
      video.playsInline = true;
      video.style.width = '100%';
      video.style.height = '100%';
      video.style.objectFit = fit;
      video.style.display = 'block';
      video.style.background = '#000';
      domNode.appendChild(video);
      videoRef.current = video;
    }
  }, [fit]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    video.muted = muted;
    video.style.objectFit = fit;

    if (stream && enabled) {
      if (video.srcObject !== stream) {
        video.srcObject = stream;
        video.play().catch((e) => console.warn('[WebVideo] play error:', e));
      }
      video.style.display = 'block';
    } else {
      video.srcObject = null;
      video.style.display = 'none';
    }
  }, [stream, muted, enabled, fit]);

  useEffect(() => {
    return () => {
      if (videoRef.current) {
        videoRef.current.srcObject = null;
        videoRef.current.remove();
        videoRef.current = null;
      }
    };
  }, []);

  const showAvatar = !stream || !enabled;

  return (
    <View
      ref={containerRef}
      style={[styles.wrap, fullscreen ? styles.fullscreen : null]}
    >
      {showAvatar && (
        <View style={styles.avatarWrap}>
          <Animated.View
            style={[
              styles.pulseRing,
              fullscreen && styles.pulseRingLg,
              { opacity: pulseAnim },
            ]}
          />
          <View style={[styles.avatarCircle, fullscreen && styles.avatarCircleLg]}>
            <MaterialIcons
              name="person"
              size={fullscreen ? 80 : 36}
              color="#fff"
            />
          </View>
          {avatarLabel && (
            <Text style={[styles.avatarLabel, fullscreen && styles.avatarLabelLg]}>
              {avatarLabel}
            </Text>
          )}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: { backgroundColor: '#0a1931', borderRadius: 14, overflow: 'hidden' },
  fullscreen: { flex: 1, borderRadius: 0 },
  avatarWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#0a1931' },
  pulseRing: { position: 'absolute', width: 160, height: 160, borderRadius: 160, borderWidth: 2, borderColor: 'rgba(19,127,236,0.4)' },
  pulseRingLg: { width: 200, height: 200, borderRadius: 200 },
  avatarCircle: { width: 96, height: 96, borderRadius: 96, backgroundColor: 'rgba(255,255,255,0.12)', alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: 'rgba(19,127,236,0.3)' },
  avatarCircleLg: { width: 140, height: 140, borderRadius: 140 },
  avatarLabel: { color: '#fff', fontSize: 14, fontWeight: '700', textAlign: 'center' },
  avatarLabelLg: { fontSize: 16, fontWeight: '800', marginTop: 8 },
});

export default WebVideoContainer;
