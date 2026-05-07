/**
 * Contenedor de video para la plataforma web.
 *
 * Crea un elemento <video> nativo del DOM y lo sincroniza con el MediaStream
 * provisto. La visibilidad del avatar se controla con la prop `enabled`.
 *
 * En native (iOS/Android) este componente nunca se renderiza — VideoContainer
 * usa ZegoTextureView en su lugar.
 */
import React, { useEffect, useRef } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

type Props = {
  /** MediaStream a reproducir. null → muestra avatar. */
  stream: MediaStream | null;
  /** Si true, silencia el audio (para el video local). */
  muted?: boolean;
  /** Si true, ocupa toda la pantalla. */
  fullscreen?: boolean;
  /** Etiqueta del avatar cuando no hay stream. */
  avatarLabel?: string;
  /** Si false, muestra avatar aunque haya stream (cámara apagada). */
  enabled?: boolean;
};

const WebVideoContainer = ({
  stream,
  muted = false,
  fullscreen = false,
  avatarLabel = '',
  enabled = true,
}: Props) => {
  const containerRef = useRef<any>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  // Crear el elemento <video> una sola vez y adjuntarlo al DOM
  useEffect(() => {
    const domNode: HTMLElement | null = containerRef.current;
    if (!domNode) return;

    if (!videoRef.current) {
      const video = document.createElement('video');
      video.autoplay = true;
      video.playsInline = true;
      video.style.width = '100%';
      video.style.height = '100%';
      video.style.objectFit = 'cover';
      video.style.display = 'block';
      video.style.background = '#000';
      domNode.appendChild(video);
      videoRef.current = video;
    }

    return () => {
      // Solo limpia al desmontar el componente
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Sincronizar stream y muted
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    video.muted = muted;
    if (stream && enabled) {
      if (video.srcObject !== stream) {
        video.srcObject = stream;
        video.play().catch(() => {});
      }
      video.style.display = 'block';
    } else {
      video.srcObject = null;
      video.style.display = 'none';
    }
  }, [stream, muted, enabled]);

  // Limpiar al desmontar
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
  fullscreen: {
    flex: 1,
    borderRadius: 0,
  },
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
  avatarLabel: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
    textAlign: 'center',
  },
});

export default WebVideoContainer;
