import { useCallback } from 'react';

import { useAuth } from '../providers/AuthProvider';
import { apiClient } from '../utils/api';
import {
    CachedMedicoProfile,
    readMedicoProfileCacheMap,
    writeMedicoProfileCacheMap,
} from '../utils/medicoProfileCache';

export type MedicoSessionUser = {
    id?: number | string;
    usuarioid?: number | string;
    email?: string;
    nombreCompleto?: string;
    especialidad?: string;
    fotoUrl?: string;
    medico?: {
        nombreCompleto?: string;
        especialidad?: string;
        fotoUrl?: string;
    };
};

const normalizeText = (value: unknown) =>
    String(value || '')
        .replace(/\s+/g, ' ')
        .trim();

const sanitizeFotoUrl = (value: unknown) => {
    const clean = normalizeText(value);
    if (!clean) return '';
    if (clean.toLowerCase().startsWith('blob:')) return '';
    return clean;
};

const mergeCachedProfile = (
    sessionUser: MedicoSessionUser | null,
    cachedProfile: CachedMedicoProfile | null
) => {
    if (!cachedProfile) return sessionUser;
    return {
        ...(sessionUser || {}),
        nombreCompleto: normalizeText(
            sessionUser?.nombreCompleto ||
                sessionUser?.medico?.nombreCompleto ||
                cachedProfile?.nombreCompleto
        ),
        especialidad: normalizeText(
            sessionUser?.especialidad ||
                sessionUser?.medico?.especialidad ||
                cachedProfile?.especialidad
        ),
        fotoUrl: sanitizeFotoUrl(
            sessionUser?.fotoUrl || sessionUser?.medico?.fotoUrl || cachedProfile?.fotoUrl
        ),
    } satisfies MedicoSessionUser;
};

export function useMedicoSessionProfile() {
    const { user, updateUser } = useAuth<Record<string, unknown>>();

    const sessionUser = (user as MedicoSessionUser | null) || null;

    const syncProfile = useCallback(async () => {
        let nextUser = sessionUser;
        const email = normalizeText(nextUser?.email).toLowerCase();
        const cacheMap = await readMedicoProfileCacheMap();
        const cachedProfile = email ? cacheMap[email] || null : null;

        nextUser = mergeCachedProfile(nextUser, cachedProfile);

        try {
            const dashboardPayload = await apiClient.get<any>('/api/users/me/dashboard-medico', {
                authenticated: true,
            });
            if (dashboardPayload?.success && dashboardPayload?.dashboard?.profile) {
                const profile = dashboardPayload.dashboard.profile;
                nextUser = {
                    ...(nextUser || {}),
                    nombreCompleto: normalizeText(
                        profile?.nombreCompleto ||
                            nextUser?.nombreCompleto ||
                            nextUser?.medico?.nombreCompleto
                    ),
                    especialidad: normalizeText(
                        profile?.especialidad ||
                            nextUser?.especialidad ||
                            nextUser?.medico?.especialidad
                    ),
                    fotoUrl: sanitizeFotoUrl(
                        profile?.fotoUrl || nextUser?.fotoUrl || nextUser?.medico?.fotoUrl
                    ),
                };
            }
        } catch {
            // noop
        }

        try {
            const authPayload = await apiClient.get<any>('/api/auth/me', {
                authenticated: true,
            });
            if (authPayload?.success && authPayload?.user) {
                nextUser = {
                    ...(nextUser || {}),
                    ...(authPayload.user as MedicoSessionUser),
                };
            }
        } catch {
            // noop
        }

        try {
            const profilePayload = await apiClient.get<any>('/api/users/me/profile', {
                authenticated: true,
            });
            const serverFoto = sanitizeFotoUrl(profilePayload?.profile?.fotoUrl || '');
            if (serverFoto) {
                nextUser = {
                    ...(nextUser || {}),
                    fotoUrl: serverFoto,
                };
            }
        } catch {
            // noop
        }

        const nextEmail = normalizeText(nextUser?.email).toLowerCase();
        const nextFoto = sanitizeFotoUrl(nextUser?.fotoUrl || nextUser?.medico?.fotoUrl || '');
        const cachedFoto = sanitizeFotoUrl(cachedProfile?.fotoUrl || '');

        if (nextEmail && !nextFoto && cachedFoto) {
            try {
                const syncPayload = await apiClient.put<any>('/api/users/me/profile', {
                    authenticated: true,
                    body: { fotoUrl: cachedFoto },
                });
                const syncedFoto = sanitizeFotoUrl(syncPayload?.profile?.fotoUrl || cachedFoto);
                nextUser = {
                    ...(nextUser || {}),
                    fotoUrl: syncedFoto,
                };
            } catch {
                // noop
            }
        }

        const finalEmail = normalizeText(nextUser?.email).toLowerCase();
        if (finalEmail) {
            cacheMap[finalEmail] = {
                ...cacheMap[finalEmail],
                nombreCompleto: normalizeText(
                    nextUser?.nombreCompleto ||
                        nextUser?.medico?.nombreCompleto ||
                        cacheMap[finalEmail]?.nombreCompleto
                ),
                especialidad: normalizeText(
                    nextUser?.especialidad ||
                        nextUser?.medico?.especialidad ||
                        cacheMap[finalEmail]?.especialidad
                ),
                fotoUrl: sanitizeFotoUrl(
                    nextUser?.fotoUrl ||
                        nextUser?.medico?.fotoUrl ||
                        cacheMap[finalEmail]?.fotoUrl
                ),
            };
            await writeMedicoProfileCacheMap(cacheMap);
        }

        if (nextUser) {
            await updateUser(nextUser as Record<string, unknown>);
        }

        return nextUser;
    }, [sessionUser, updateUser]);

    return {
        sessionUser,
        syncProfile,
    };
}
