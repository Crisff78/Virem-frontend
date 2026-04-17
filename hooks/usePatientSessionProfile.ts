import { useCallback } from 'react';

import { useAuth } from '../providers/AuthProvider';
import { apiClient } from '../utils/api';
import { ensurePatientSessionUser } from '../utils/patientSession';

export type PatientSessionUser = {
    id?: number | string;
    usuarioid?: number | string;
    rolid?: number | string;
    rolId?: number | string;
    roleId?: number | string;
    nombres?: string;
    apellidos?: string;
    nombre?: string;
    apellido?: string;
    firstName?: string;
    lastName?: string;
    nombreCompleto?: string;
    email?: string;
    plan?: string;
    fotoUrl?: string;
    telefono?: string;
    cedula?: string;
    genero?: string;
    fechanacimiento?: string;
    direccion?: string;
    tipoSangre?: string;
    alergias?: string;
    medicamentos?: string;
    antecedentes?: string;
    contactoEmergenciaNombre?: string;
    contactoEmergenciaTelefono?: string;
    contactoEmergenciaParentesco?: string;
    recibirEmail?: boolean;
    recibirSMS?: boolean;
    compartirHistorial?: boolean;
};

const normalizeText = (value: unknown) => String(value || '').trim();

const sanitizeFotoUrl = (value: unknown) => {
    const clean = normalizeText(value);
    if (!clean) return '';
    if (clean.toLowerCase().startsWith('blob:')) return '';
    return clean;
};

const extractUserId = (value: unknown) => {
    const source = (value || {}) as Record<string, unknown>;
    return normalizeText(source.usuarioid || source.id);
};

const resolveBooleanField = (
    source: PatientSessionUser,
    key: 'recibirEmail' | 'recibirSMS' | 'compartirHistorial',
    fallbackValue: boolean
) => {
    if (Object.prototype.hasOwnProperty.call(source, key)) {
        return Boolean(source[key]);
    }

    return fallbackValue;
};

const mergePatientProfile = (
    baseUser: PatientSessionUser | null,
    profileUser: PatientSessionUser
) => {
    const cachedUserId = extractUserId(baseUser);
    const profileUserId = extractUserId(profileUser);
    const safeBase =
        cachedUserId && profileUserId && cachedUserId !== profileUserId ? null : baseUser;

    return {
        ...(safeBase || {}),
        ...profileUser,
        nombres: normalizeText(
            profileUser?.nombres || safeBase?.nombres || safeBase?.nombre || profileUser?.nombre
        ),
        apellidos: normalizeText(
            profileUser?.apellidos ||
                safeBase?.apellidos ||
                safeBase?.apellido ||
                profileUser?.apellido
        ),
        nombre: normalizeText(profileUser?.nombre || profileUser?.nombres || safeBase?.nombre),
        apellido: normalizeText(
            profileUser?.apellido || profileUser?.apellidos || safeBase?.apellido
        ),
        plan: normalizeText(profileUser?.plan || safeBase?.plan),
        fotoUrl: sanitizeFotoUrl(profileUser?.fotoUrl || safeBase?.fotoUrl),
        email: normalizeText(profileUser?.email || safeBase?.email),
        telefono: normalizeText(profileUser?.telefono || safeBase?.telefono),
        cedula: normalizeText(profileUser?.cedula || safeBase?.cedula),
        genero: normalizeText(profileUser?.genero || safeBase?.genero),
        fechanacimiento: normalizeText(
            profileUser?.fechanacimiento || safeBase?.fechanacimiento
        ),
        direccion: normalizeText(profileUser?.direccion || safeBase?.direccion),
        tipoSangre: normalizeText(profileUser?.tipoSangre || safeBase?.tipoSangre),
        alergias: normalizeText(profileUser?.alergias || safeBase?.alergias),
        medicamentos: normalizeText(profileUser?.medicamentos || safeBase?.medicamentos),
        antecedentes: normalizeText(profileUser?.antecedentes || safeBase?.antecedentes),
        contactoEmergenciaNombre: normalizeText(
            profileUser?.contactoEmergenciaNombre || safeBase?.contactoEmergenciaNombre
        ),
        contactoEmergenciaTelefono: normalizeText(
            profileUser?.contactoEmergenciaTelefono || safeBase?.contactoEmergenciaTelefono
        ),
        contactoEmergenciaParentesco: normalizeText(
            profileUser?.contactoEmergenciaParentesco || safeBase?.contactoEmergenciaParentesco
        ),
        recibirEmail: resolveBooleanField(
            profileUser,
            'recibirEmail',
            Boolean(safeBase?.recibirEmail ?? true)
        ),
        recibirSMS: resolveBooleanField(
            profileUser,
            'recibirSMS',
            Boolean(safeBase?.recibirSMS ?? true)
        ),
        compartirHistorial: resolveBooleanField(
            profileUser,
            'compartirHistorial',
            Boolean(safeBase?.compartirHistorial ?? false)
        ),
    } satisfies PatientSessionUser;
};

const mergeAuthMeUser = (baseUser: PatientSessionUser | null, authUser: PatientSessionUser) => {
    const cachedUserId = extractUserId(baseUser);
    const authUserId = extractUserId(authUser);
    const safeBase =
        cachedUserId && authUserId && cachedUserId !== authUserId ? null : baseUser;
    const authRoleId = Number(authUser?.rolid ?? authUser?.rolId ?? authUser?.roleId);

    if (authRoleId === 2) {
        return null;
    }

    return {
        ...(safeBase || {}),
        ...authUser,
        nombres: normalizeText(
            authUser?.nombres || safeBase?.nombres || safeBase?.nombre || authUser?.nombre
        ),
        apellidos: normalizeText(
            authUser?.apellidos || safeBase?.apellidos || safeBase?.apellido || authUser?.apellido
        ),
        nombre: normalizeText(authUser?.nombre || authUser?.nombres || safeBase?.nombre),
        apellido: normalizeText(authUser?.apellido || authUser?.apellidos || safeBase?.apellido),
        plan: normalizeText(authUser?.plan || safeBase?.plan),
        fotoUrl: sanitizeFotoUrl(authUser?.fotoUrl || safeBase?.fotoUrl),
        email: normalizeText(authUser?.email || safeBase?.email),
        telefono: normalizeText(authUser?.telefono || safeBase?.telefono),
        cedula: normalizeText(authUser?.cedula || safeBase?.cedula),
        genero: normalizeText(authUser?.genero || safeBase?.genero),
        fechanacimiento: normalizeText(authUser?.fechanacimiento || safeBase?.fechanacimiento),
        direccion: normalizeText(authUser?.direccion || safeBase?.direccion),
        tipoSangre: normalizeText(authUser?.tipoSangre || safeBase?.tipoSangre),
        alergias: normalizeText(authUser?.alergias || safeBase?.alergias),
        medicamentos: normalizeText(authUser?.medicamentos || safeBase?.medicamentos),
        antecedentes: normalizeText(authUser?.antecedentes || safeBase?.antecedentes),
        contactoEmergenciaNombre: normalizeText(
            authUser?.contactoEmergenciaNombre || safeBase?.contactoEmergenciaNombre
        ),
        contactoEmergenciaTelefono: normalizeText(
            authUser?.contactoEmergenciaTelefono || safeBase?.contactoEmergenciaTelefono
        ),
        contactoEmergenciaParentesco: normalizeText(
            authUser?.contactoEmergenciaParentesco || safeBase?.contactoEmergenciaParentesco
        ),
        recibirEmail: resolveBooleanField(
            authUser,
            'recibirEmail',
            Boolean(safeBase?.recibirEmail ?? true)
        ),
        recibirSMS: resolveBooleanField(
            authUser,
            'recibirSMS',
            Boolean(safeBase?.recibirSMS ?? true)
        ),
        compartirHistorial: resolveBooleanField(
            authUser,
            'compartirHistorial',
            Boolean(safeBase?.compartirHistorial ?? false)
        ),
    } satisfies PatientSessionUser;
};

export function usePatientSessionProfile() {
    const { user, updateUser } = useAuth<Record<string, unknown>>();

    const sessionUser = ensurePatientSessionUser(user as PatientSessionUser | null);

    const syncProfile = useCallback(async () => {
        let nextUser = ensurePatientSessionUser(user as PatientSessionUser | null);

        try {
            const profilePayload = await apiClient.get<any>('/api/users/me/paciente-profile', {
                authenticated: true,
            });
            if (profilePayload?.success && profilePayload?.profile) {
                nextUser = mergePatientProfile(nextUser, profilePayload.profile as PatientSessionUser);
                if (nextUser) {
                    await updateUser(nextUser as Record<string, unknown>);
                }
                return nextUser;
            }
        } catch {
            // noop
        }

        try {
            const authPayload = await apiClient.get<any>('/api/auth/me', {
                authenticated: true,
            });
            if (authPayload?.success && authPayload?.user) {
                nextUser = mergeAuthMeUser(nextUser, authPayload.user as PatientSessionUser);
                if (nextUser) {
                    await updateUser(nextUser as Record<string, unknown>);
                }
                return nextUser;
            }
        } catch {
            // noop
        }

        return nextUser;
    }, [updateUser, user]);

    return {
        sessionUser,
        syncProfile,
    };
}
