/**
 * Contenedor de video para la plataforma web.
 *
 * Crea un elemento <video> nativo del DOM y lo sincroniza con el MediaStream
 * provisto. Cuando no hay stream, muestra un avatar premium con animación
 * de pulso indicando que se espera al otro participante.
 */
import React, { useEffect, useRef, useState } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';

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
  /** Ajuste del video: 'cover' (llena) o 'contain' (completo sin recorte). */
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

  // Premium pulse animation for the waiting avatar
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
      video.style.objectFit = fit;
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
    video.style.objectFit = fit;

    if (stream && enabled) {
      if (video.srcObject !== stream) {
        video.srcObject = stream;
        // Ensure play is called and state is updated
        video.play().catch((e) => console.warn('[WebVideo] play error:', e));
      }
      video.style.display = 'block';
    } else {
      video.srcObject = null;
      video.style.display = 'none';
    }
  }, [stream, muted, enabled, fit]);

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
          {/* Pulse ring behind avatar */}
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
          {avatarLabel ? (
            <Text style={[styles.avatarLabel, fullscreen && styles.avatarLabelLg]}>
              {avatarLabel}
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
  avatarLabel: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
    textAlign: 'center',
  },
  avatarLabelLg: {
    fontSize: 16,
    fontWeight: '800',
    marginTop: 8,
  },
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

export default WebVideoContainer;
