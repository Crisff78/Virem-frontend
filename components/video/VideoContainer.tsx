import React from 'react';
import { Platform, StyleSheet, Text, View } from 'react-native';
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
        <View style={styles.avatarWrap}>
          <View style={[styles.avatarCircle, fullscreen && styles.avatarCircleLg]}>
            <MaterialIcons
              name="person"
              size={fullscreen ? 80 : 36}
              color="#fff"
            />
          </View>
          {avatarLabel ? (
            <Text style={styles.avatarLabel}>{avatarLabel}</Text>
          ) : null}
        </View>
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
    gap: 10,
    backgroundColor: '#0a1931',
  },
  avatarCircle: {
    width: 96,
    height: 96,
    borderRadius: 96,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarCircleLg: {
    width: 140,
    height: 140,
    borderRadius: 140,
  },
  avatarLabel: { color: '#fff', fontSize: 14, fontWeight: '700' },
});

export default VideoContainer;
