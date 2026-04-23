import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

export const MEDICO_DRAFT_PREFIX = 'medicoRegDraft:';

const normalizeDraftKey = (draftKey?: string) => {
    const key = String(draftKey || '').trim();
    return key.startsWith(MEDICO_DRAFT_PREFIX) ? key : '';
};

const isRecord = (value: unknown): value is Record<string, any> =>
    Boolean(value) && typeof value === 'object' && !Array.isArray(value);

export const createMedicoDraftKey = () => `${MEDICO_DRAFT_PREFIX}${Date.now()}`;

export async function persistMedicoDraft(
    draftKey: string,
    payload: Record<string, any>
) {
    const key = normalizeDraftKey(draftKey);
    if (!key) return;

    const raw = JSON.stringify(payload || {});
    await AsyncStorage.setItem(key, raw);

    try {
        if (Platform.OS === 'web') {
            localStorage.setItem(key, raw);
            return;
        }

        await SecureStore.setItemAsync(key, raw);
    } catch {
        // Non-blocking on secondary storage.
    }
}

export async function readMedicoDraft(draftKey?: string) {
    const key = normalizeDraftKey(draftKey);
    if (!key) return null;

    try {
        let raw: string | null = null;

        if (Platform.OS === 'web') {
            raw = localStorage.getItem(key);
        } else {
            try {
                raw = await SecureStore.getItemAsync(key);
            } catch {
                raw = null;
            }
        }

        if (!raw) {
            raw = await AsyncStorage.getItem(key);
        }
        if (!raw) return null;

        const parsed = JSON.parse(raw);
        return isRecord(parsed) ? parsed : null;
    } catch {
        return null;
    }
}

export async function clearMedicoDraft(draftKey?: string) {
    const key = normalizeDraftKey(draftKey);
    if (!key) return;

    try {
        await AsyncStorage.removeItem(key);
    } catch {
        // noop
    }

    try {
        if (Platform.OS === 'web') {
            localStorage.removeItem(key);
            return;
        }

        await SecureStore.deleteItemAsync(key);
    } catch {
        // noop
    }
}
