import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

export const MEDICO_CACHE_BY_EMAIL_KEY = 'medicoProfileByEmail';

export type CachedMedicoProfile = {
    nombreCompleto?: string;
    especialidad?: string;
    fotoUrl?: string;
};

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
