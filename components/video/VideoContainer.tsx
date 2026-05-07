import React, { useEffect, useRef } from 'react';
import { Animated, Platform, StyleSheet, Text, View } from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { getZegoEngine, getZegoTextureView } from '../../services/zegoService';
import WebVideoContainer from './WebVideoContainer';

type Props = {
  /** ID del stream Zego a renderizar (nativo). */
  streamId?: string | null;
  /** MediaStream del navegador (web). */
  stream?: MediaStream | null;
  /** Modo: 'local' = preview de propia cámara; 'remote' = stream entrante. */
  mode: 'local' | 'remote';
  /** Si false, muestra avatar en vez de video. */
  enabled: boolean;
  fullscreen?: boolean;
  avatarLabel?: string;
};

// ── Componente nativo Zego (solo iOS/Android) ─────────────────────────────
class ZegoSurface extends React.Component<{
  streamId?: string | null;
  mode: 'local' | 'remote';
}> {
  private viewRef: any = null;

  componentDidMount() {
    this.attach();
  }

  componentDidUpdate(prev: { streamId?: string | null; mode: string }) {
    if (prev.streamId !== this.props.streamId || prev.mode !== this.props.mode) {
      this.attach();
    }
  }

  attach = async () => {
    const engine = await getZegoEngine();
    if (!engine || !this.viewRef) return;
    try {
      const reactTag = this.viewRef._nativeTag || this.viewRef;
      if (this.props.mode === 'local') {
        await engine.startPreview({ reactTag, viewMode: 0 });
      } else if (this.props.streamId) {
        await engine.startPlayingStream(this.props.streamId, { reactTag, viewMode: 0 });
      }
    } catch (err) {
      console.warn('[VideoContainer] attach:', err);
    }
  };

  render() {
    const TextureView = getZegoTextureView();
    if (!TextureView) {
      return <View style={StyleSheet.absoluteFill} />;
    }
    return (
      <TextureView
        ref={(r: any) => (this.viewRef = r)}
        style={StyleSheet.absoluteFill}
      />
    );
  }
}

// ── Premium waiting avatar with pulse ─────────────────────────────────────
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
      {fullscreen && (
        <View style={styles.waitingDots}>
          <View style={styles.dotActive} />
          <View style={[styles.dotActive, { opacity: 0.6 }]} />
          <View style={[styles.dotActive, { opacity: 0.3 }]} />
        </View>
      )}
    </View>
  );
};

// ── Componente principal ──────────────────────────────────────────────────
const VideoContainer: React.FC<Props> = ({
  streamId,
  stream,
  mode,
  enabled,
  fullscreen,
  avatarLabel,
}) => {
  // ── Web: usa MediaStream nativo del navegador ─────────────────────────
  if (Platform.OS === 'web') {
    return (
      <WebVideoContainer
        stream={stream ?? null}
        muted={mode === 'local'} // silenciar el video local para evitar eco
        fullscreen={fullscreen}
        avatarLabel={avatarLabel}
        enabled={enabled}
      />
    );
  }

  // ── Native: usa Zego TextureView ──────────────────────────────────────
  const showAvatar = !enabled || (mode === 'remote' && !streamId);

  return (
    <View style={[styles.wrap, fullscreen && styles.fullscreen]}>
      {!showAvatar ? (
        <ZegoSurface streamId={streamId} mode={mode} />
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
  waitingDots: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 8,
  },
  dotActive: {
    width: 8,
    height: 8,
    borderRadius: 8,
    backgroundColor: '#137fec',
  },
});

export default VideoContainer;
