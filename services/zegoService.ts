/**
 * Wrapper del SDK de Zego Express (`zego-express-engine-reactnative`).
 *
 * El SDK es nativo: requiere Expo prebuild + dev client.
 * En Expo Go o en web, el require se carga "lazy" y devuelve null.
 * Las pantallas de video deben verificar `isAvailable()` y mostrar un
 * fallback (link Jitsi/LiveKit) si es false.
 */

import { Platform } from 'react-native';

type ZegoExpressEngineType = any;
type ZegoTextureViewType = any;

let zegoModule: { ZegoExpressEngine: ZegoExpressEngineType; ZegoTextureView?: ZegoTextureViewType } | null = null;
let initPromise: Promise<ZegoExpressEngineType | null> | null = null;
let activeRoomId: string | null = null;

function loadModule(): typeof zegoModule {
  if (zegoModule) return zegoModule;
  if (Platform.OS === 'web') return null; // SDK no soportado en web
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const mod = require('zego-express-engine-reactnative');
    zegoModule = {
      ZegoExpressEngine: mod.default || mod.ZegoExpressEngine,
      ZegoTextureView: mod.ZegoTextureView,
    };
    return zegoModule;
  } catch (err) {
    console.warn('[zego] SDK no instalado o no disponible en este runtime:', (err as Error)?.message);
    return null;
  }
}

export function isZegoAvailable(): boolean {
  return loadModule() !== null;
}

export function getZegoTextureView(): ZegoTextureViewType | null {
  return loadModule()?.ZegoTextureView || null;
}

function getAppId(): number {
  const raw = (process.env.EXPO_PUBLIC_ZEGO_APP_ID || '').trim();
  const parsed = Number.parseInt(raw, 10);
  return Number.isFinite(parsed) ? parsed : 0;
}

function getAppSign(): string {
  return String(process.env.EXPO_PUBLIC_ZEGO_APP_SIGN || '').trim();
}

/**
 * Inicializa la engine (idempotente).
 * scenario 0 = General, 1 = Communication, 2 = LiveStream
 */
export async function ensureZegoInitialized(scenario: number = 1): Promise<ZegoExpressEngineType | null> {
  if (initPromise) return initPromise;
  const mod = loadModule();
  if (!mod) return null;

  initPromise = (async () => {
    try {
      const appId = getAppId();
      const appSign = getAppSign();
      if (!appId || !appSign) {
        console.warn('[zego] EXPO_PUBLIC_ZEGO_APP_ID o EXPO_PUBLIC_ZEGO_APP_SIGN faltan');
        return null;
      }
      const engine = await mod.ZegoExpressEngine.createEngineWithProfile({
        appID: appId,
        appSign,
        scenario,
      });
      return engine;
    } catch (err) {
      console.error('[zego] createEngineWithProfile fallo:', err);
      initPromise = null;
      return null;
    }
  })();

  return initPromise;
}

export async function getZegoEngine(): Promise<ZegoExpressEngineType | null> {
  if (initPromise) return initPromise;
  return ensureZegoInitialized();
}

/**
 * loginRoom + startPublishingStream con tokens emitidos por el backend.
 */
export async function joinZegoRoom(opts: {
  token: string;
  roomId: string;
  userId: string;
  userName: string;
}): Promise<{ ok: boolean; streamId: string }> {
  const engine = await ensureZegoInitialized();
  if (!engine) return { ok: false, streamId: '' };

  const config = {
    isUserStatusNotify: true,
    token: opts.token,
  };

  await engine.loginRoom(opts.roomId, { userID: opts.userId, userName: opts.userName }, config);
  const streamId = `${opts.roomId}-${opts.userId}`;
  await engine.startPublishingStream(streamId);
  activeRoomId = opts.roomId;
  return { ok: true, streamId };
}

export async function leaveZegoRoom(): Promise<void> {
  const engine = await getZegoEngine();
  if (!engine) return;
  try {
    await engine.stopPublishingStream();
  } catch (_) {}
  if (activeRoomId) {
    try {
      await engine.logoutRoom(activeRoomId);
    } catch (_) {}
  }
  activeRoomId = null;
}

export async function destroyZego(): Promise<void> {
  const mod = loadModule();
  if (!mod) return;
  try {
    await mod.ZegoExpressEngine.destroyEngine();
  } catch (_) {}
  initPromise = null;
  activeRoomId = null;
}

/* ----- Controles media ----- */

export async function setMicrophoneEnabled(enabled: boolean): Promise<void> {
  const engine = await getZegoEngine();
  if (!engine) return;
  try {
    await engine.muteMicrophone(!enabled);
  } catch (err) {
    console.warn('[zego] muteMicrophone:', err);
  }
}

export async function setCameraEnabled(enabled: boolean): Promise<void> {
  const engine = await getZegoEngine();
  if (!engine) return;
  try {
    await engine.enableCamera(enabled);
  } catch (err) {
    console.warn('[zego] enableCamera:', err);
  }
}

export async function switchCamera(useFrontCamera: boolean): Promise<void> {
  const engine = await getZegoEngine();
  if (!engine) return;
  try {
    await engine.useFrontCamera(useFrontCamera);
  } catch (err) {
    console.warn('[zego] useFrontCamera:', err);
  }
}

export async function setSpeakerEnabled(enabled: boolean): Promise<void> {
  const engine = await getZegoEngine();
  if (!engine) return;
  try {
    await engine.setAudioRouteToSpeaker(enabled);
  } catch (_) {}
}
