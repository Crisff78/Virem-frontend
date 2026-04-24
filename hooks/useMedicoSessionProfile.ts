import { useCallback, useEffect, useRef } from 'react';

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
    fechanacimiento?: string;
    genero?: string;
    cedula?: string;
    telefono?: string;
    fotoUrl?: string;
    medico?: {
        nombreCompleto?: string;
        especialidad?: string;
        fechanacimiento?: string;
        genero?: string;
        cedula?: string;
        telefono?: string;
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

const toComparableUser = (user: MedicoSessionUser | null) => ({
    id: normalizeText(user?.id),
    usuarioid: normalizeText(user?.usuarioid),
    email: normalizeText(user?.email).toLowerCase(),
    nombreCompleto: normalizeText(user?.nombreCompleto),
    especialidad: normalizeText(user?.especialidad),
    fechanacimiento: normalizeText(user?.fechanacimiento),
    genero: normalizeText(user?.genero),
    cedula: normalizeText(user?.cedula),
    telefono: normalizeText(user?.telefono),
    fotoUrl: sanitizeFotoUrl(user?.fotoUrl),
    medico: {
        nombreCompleto: normalizeText(user?.medico?.nombreCompleto),
        especialidad: normalizeText(user?.medico?.especialidad),
        fechanacimiento: normalizeText(user?.medico?.fechanacimiento),
        genero: normalizeText(user?.medico?.genero),
        cedula: normalizeText(user?.medico?.cedula),
        telefono: normalizeText(user?.medico?.telefono),
        fotoUrl: sanitizeFotoUrl(user?.medico?.fotoUrl),
    },
});

const areUsersEquivalent = (
    left: MedicoSessionUser | null,
    right: MedicoSessionUser | null
) =>
    JSON.stringify(toComparableUser(left)) === JSON.stringify(toComparableUser(right));

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
        fechanacimiento: normalizeText(
            sessionUser?.fechanacimiento ||
                sessionUser?.medico?.fechanacimiento ||
                cachedProfile?.fechanacimiento
        ),
        genero: normalizeText(
            sessionUser?.genero || sessionUser?.medico?.genero || cachedProfile?.genero
        ),
        cedula: normalizeText(
            sessionUser?.cedula || sessionUser?.medico?.cedula || cachedProfile?.cedula
        ),
        telefono: normalizeText(
            sessionUser?.telefono || sessionUser?.medico?.telefono || cachedProfile?.telefono
        ),
        fotoUrl: sanitizeFotoUrl(
            sessionUser?.fotoUrl || sessionUser?.medico?.fotoUrl || cachedProfile?.fotoUrl
        ),
    } satisfies MedicoSessionUser;
};

export function useMedicoSessionProfile() {
    const { user, updateUser } = useAuth<Record<string, unknown>>();

    const sessionUser = (user as MedicoSessionUser | null) || null;
    const sessionUserRef = useRef<MedicoSessionUser | null>(sessionUser);

    useEffect(() => {
        sessionUserRef.current = sessionUser;
    }, [sessionUser]);

    const syncProfile = useCallback(async () => {
        let nextUser = sessionUserRef.current;
        const email = normalizeText(nextUser?.email).toLowerCase();
        const cacheMap = await readMedicoProfileCacheMap();
        const cachedProfile = email ? cacheMap[email] || null : null;

        nextUser = mergeCachedProfile(nextUser, cachedProfile);

        const [dashboardPayload, authPayload, profilePayload] = await Promise.all([
            apiClient.get<any>('/api/users/me/dashboard-medico', {
                authenticated: true,
            }).catch(() => null),
            apiClient.get<any>('/api/auth/me', {
                authenticated: true,
            }).catch(() => null),
            apiClient.get<any>('/api/users/me/profile', {
                authenticated: true,
            }).catch(() => null),
        ]);

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

        if (authPayload?.success && authPayload?.user) {
            nextUser = {
                ...(nextUser || {}),
                ...(authPayload.user as MedicoSessionUser),
            };
        }

        const profile = (profilePayload?.profile || null) as Record<string, unknown> | null;
        if (profile) {
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
                fechanacimiento: normalizeText(
                    profile?.fechanacimiento ||
                        nextUser?.fechanacimiento ||
                        nextUser?.medico?.fechanacimiento
                ),
                genero: normalizeText(
                    profile?.genero || nextUser?.genero || nextUser?.medico?.genero
                ),
                cedula: normalizeText(
                    profile?.cedula || nextUser?.cedula || nextUser?.medico?.cedula
                ),
                telefono: normalizeText(
                    profile?.telefono || nextUser?.telefono || nextUser?.medico?.telefono
                ),
                fotoUrl: sanitizeFotoUrl(
                    profile?.fotoUrl || nextUser?.fotoUrl || nextUser?.medico?.fotoUrl
                ),
            };
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
                fechanacimiento: normalizeText(
                    nextUser?.fechanacimiento ||
                        nextUser?.medico?.fechanacimiento ||
                        cacheMap[finalEmail]?.fechanacimiento
                ),
                genero: normalizeText(
                    nextUser?.genero ||
                        nextUser?.medico?.genero ||
                        cacheMap[finalEmail]?.genero
                ),
                cedula: normalizeText(
                    nextUser?.cedula ||
                        nextUser?.medico?.cedula ||
                        cacheMap[finalEmail]?.cedula
                ),
                telefono: normalizeText(
                    nextUser?.telefono ||
                        nextUser?.medico?.telefono ||
                        cacheMap[finalEmail]?.telefono
                ),
                fotoUrl: sanitizeFotoUrl(
                    nextUser?.fotoUrl ||
                        nextUser?.medico?.fotoUrl ||
                        cacheMap[finalEmail]?.fotoUrl
                ),
            };
            await writeMedicoProfileCacheMap(cacheMap);
        }

        if (nextUser && !areUsersEquivalent(sessionUserRef.current, nextUser)) {
            await updateUser(nextUser as Record<string, unknown>);
        }

        return nextUser;
    }, [updateUser]);

    return {
        sessionUser,
        syncProfile,
    };
}
