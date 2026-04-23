import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

export const MEDICO_CACHE_BY_EMAIL_KEY = 'medicoProfileByEmail';

export type CachedMedicoProfile = {
    nombreCompleto?: string;
    especialidad?: string;
    fechanacimiento?: string;
    genero?: string;
    cedula?: string;
    telefono?: string;
    fotoUrl?: string;
};

const normalizeString = (value: unknown) => String(value || '').trim();

const parseJson = <T,>(raw: string | null): T | null => {
    if (!raw) return null;
    try {
        return JSON.parse(raw) as T;
    } catch {
        return null;
    }
};

export async function readMedicoProfileCacheMap() {
    try {
        const raw =
            Platform.OS === 'web'
                ? localStorage.getItem(MEDICO_CACHE_BY_EMAIL_KEY)
                : await SecureStore.getItemAsync(MEDICO_CACHE_BY_EMAIL_KEY);
        return parseJson<Record<string, CachedMedicoProfile>>(raw) || {};
    } catch {
        return {};
    }
}

export async function writeMedicoProfileCacheMap(
    cacheMap: Record<string, CachedMedicoProfile>
) {
    const raw = JSON.stringify(cacheMap || {});
    try {
        if (Platform.OS === 'web') {
            localStorage.setItem(MEDICO_CACHE_BY_EMAIL_KEY, raw);
            return;
        }
        await SecureStore.setItemAsync(MEDICO_CACHE_BY_EMAIL_KEY, raw);
    } catch {
        // noop
    }
}

export async function cacheMedicoProfileByEmail(
    email: string,
    profile: CachedMedicoProfile
) {
    const key = normalizeString(email).toLowerCase();
    if (!key) return;

    const cacheMap = await readMedicoProfileCacheMap();
    cacheMap[key] = {
        nombreCompleto: normalizeString(profile.nombreCompleto) || undefined,
        especialidad: normalizeString(profile.especialidad) || undefined,
        fechanacimiento: normalizeString(profile.fechanacimiento) || undefined,
        genero: normalizeString(profile.genero) || undefined,
        cedula: normalizeString(profile.cedula) || undefined,
        telefono: normalizeString(profile.telefono) || undefined,
        fotoUrl: normalizeString(profile.fotoUrl) || undefined,
    };

    await writeMedicoProfileCacheMap(cacheMap);
}
