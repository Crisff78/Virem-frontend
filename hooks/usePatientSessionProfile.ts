import { useCallback, useEffect, useRef } from 'react';

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
    name?: string;
    username?: string;
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
            Object.prototype.hasOwnProperty.call(profileUser, 'nombres')
                ? profileUser.nombres
                : profileUser.nombre || safeBase?.nombres || safeBase?.nombre
        ),
        apellidos: normalizeText(
            Object.prototype.hasOwnProperty.call(profileUser, 'apellidos')
                ? profileUser.apellidos
                : profileUser.apellido || safeBase?.apellidos || safeBase?.apellido
        ),
        nombre: normalizeText(
            Object.prototype.hasOwnProperty.call(profileUser, 'nombre')
                ? profileUser.nombre
                : profileUser.nombres || safeBase?.nombre
        ),
        apellido: normalizeText(
            Object.prototype.hasOwnProperty.call(profileUser, 'apellido')
                ? profileUser.apellido
                : profileUser.apellidos || safeBase?.apellido
        ),
        name: normalizeText(
            Object.prototype.hasOwnProperty.call(profileUser, 'name')
                ? profileUser.name
                : safeBase?.name
        ),
        username: normalizeText(
            Object.prototype.hasOwnProperty.call(profileUser, 'username')
                ? profileUser.username
                : safeBase?.username
        ),
        plan: normalizeText(
            Object.prototype.hasOwnProperty.call(profileUser, 'plan')
                ? profileUser.plan
                : safeBase?.plan
        ),
        fotoUrl: sanitizeFotoUrl(
            Object.prototype.hasOwnProperty.call(profileUser, 'fotoUrl')
                ? profileUser.fotoUrl
                : safeBase?.fotoUrl
        ),
        email: normalizeText(
            Object.prototype.hasOwnProperty.call(profileUser, 'email')
                ? profileUser.email
                : safeBase?.email
        ),
        telefono: normalizeText(
            Object.prototype.hasOwnProperty.call(profileUser, 'telefono')
                ? profileUser.telefono
                : safeBase?.telefono
        ),
        cedula: normalizeText(
            Object.prototype.hasOwnProperty.call(profileUser, 'cedula')
                ? profileUser.cedula
                : safeBase?.cedula
        ),
        genero: normalizeText(
            Object.prototype.hasOwnProperty.call(profileUser, 'genero')
                ? profileUser.genero
                : safeBase?.genero
        ),
        fechanacimiento: normalizeText(
            Object.prototype.hasOwnProperty.call(profileUser, 'fechanacimiento')
                ? profileUser.fechanacimiento
                : safeBase?.fechanacimiento
        ),
        direccion: normalizeText(
            Object.prototype.hasOwnProperty.call(profileUser, 'direccion')
                ? profileUser.direccion
                : safeBase?.direccion
        ),
        tipoSangre: normalizeText(
            Object.prototype.hasOwnProperty.call(profileUser, 'tipoSangre')
                ? profileUser.tipoSangre
                : safeBase?.tipoSangre
        ),
        alergias: normalizeText(
            Object.prototype.hasOwnProperty.call(profileUser, 'alergias')
                ? profileUser.alergias
                : safeBase?.alergias
        ),
        medicamentos: normalizeText(
            Object.prototype.hasOwnProperty.call(profileUser, 'medicamentos')
                ? profileUser.medicamentos
                : safeBase?.medicamentos
        ),
        antecedentes: normalizeText(
            Object.prototype.hasOwnProperty.call(profileUser, 'antecedentes')
                ? profileUser.antecedentes
                : safeBase?.antecedentes
        ),
        contactoEmergenciaNombre: normalizeText(
            Object.prototype.hasOwnProperty.call(profileUser, 'contactoEmergenciaNombre')
                ? profileUser.contactoEmergenciaNombre
                : safeBase?.contactoEmergenciaNombre
        ),
        contactoEmergenciaTelefono: normalizeText(
            Object.prototype.hasOwnProperty.call(profileUser, 'contactoEmergenciaTelefono')
                ? profileUser.contactoEmergenciaTelefono
                : safeBase?.contactoEmergenciaTelefono
        ),
        contactoEmergenciaParentesco: normalizeText(
            Object.prototype.hasOwnProperty.call(profileUser, 'contactoEmergenciaParentesco')
                ? profileUser.contactoEmergenciaParentesco
                : safeBase?.contactoEmergenciaParentesco
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
            Object.prototype.hasOwnProperty.call(authUser, 'nombres')
                ? authUser.nombres
                : authUser.nombre || safeBase?.nombres || safeBase?.nombre
        ),
        apellidos: normalizeText(
            Object.prototype.hasOwnProperty.call(authUser, 'apellidos')
                ? authUser.apellidos
                : authUser.apellido || safeBase?.apellidos || safeBase?.apellido
        ),
        nombre: normalizeText(
            Object.prototype.hasOwnProperty.call(authUser, 'nombre')
                ? authUser.nombre
                : authUser.nombres || safeBase?.nombre
        ),
        apellido: normalizeText(
            Object.prototype.hasOwnProperty.call(authUser, 'apellido')
                ? authUser.apellido
                : authUser.apellidos || safeBase?.apellido
        ),
        name: normalizeText(
            Object.prototype.hasOwnProperty.call(authUser, 'name') ? authUser.name : safeBase?.name
        ),
        username: normalizeText(
            Object.prototype.hasOwnProperty.call(authUser, 'username')
                ? authUser.username
                : safeBase?.username
        ),
        plan: normalizeText(
            Object.prototype.hasOwnProperty.call(authUser, 'plan') ? authUser.plan : safeBase?.plan
        ),
        fotoUrl: sanitizeFotoUrl(
            Object.prototype.hasOwnProperty.call(authUser, 'fotoUrl')
                ? authUser.fotoUrl
                : safeBase?.fotoUrl
        ),
        email: normalizeText(
            Object.prototype.hasOwnProperty.call(authUser, 'email') ? authUser.email : safeBase?.email
        ),
        telefono: normalizeText(
            Object.prototype.hasOwnProperty.call(authUser, 'telefono')
                ? authUser.telefono
                : safeBase?.telefono
        ),
        cedula: normalizeText(
            Object.prototype.hasOwnProperty.call(authUser, 'cedula') ? authUser.cedula : safeBase?.cedula
        ),
        genero: normalizeText(
            Object.prototype.hasOwnProperty.call(authUser, 'genero') ? authUser.genero : safeBase?.genero
        ),
        fechanacimiento: normalizeText(
            Object.prototype.hasOwnProperty.call(authUser, 'fechanacimiento')
                ? authUser.fechanacimiento
                : safeBase?.fechanacimiento
        ),
        direccion: normalizeText(
            Object.prototype.hasOwnProperty.call(authUser, 'direccion')
                ? authUser.direccion
                : safeBase?.direccion
        ),
        tipoSangre: normalizeText(
            Object.prototype.hasOwnProperty.call(authUser, 'tipoSangre')
                ? authUser.tipoSangre
                : safeBase?.tipoSangre
        ),
        alergias: normalizeText(
            Object.prototype.hasOwnProperty.call(authUser, 'alergias')
                ? authUser.alergias
                : safeBase?.alergias
        ),
        medicamentos: normalizeText(
            Object.prototype.hasOwnProperty.call(authUser, 'medicamentos')
                ? authUser.medicamentos
                : safeBase?.medicamentos
        ),
        antecedentes: normalizeText(
            Object.prototype.hasOwnProperty.call(authUser, 'antecedentes')
                ? authUser.antecedentes
                : safeBase?.antecedentes
        ),
        contactoEmergenciaNombre: normalizeText(
            Object.prototype.hasOwnProperty.call(authUser, 'contactoEmergenciaNombre')
                ? authUser.contactoEmergenciaNombre
                : safeBase?.contactoEmergenciaNombre
        ),
        contactoEmergenciaTelefono: normalizeText(
            Object.prototype.hasOwnProperty.call(authUser, 'contactoEmergenciaTelefono')
                ? authUser.contactoEmergenciaTelefono
                : safeBase?.contactoEmergenciaTelefono
        ),
        contactoEmergenciaParentesco: normalizeText(
            Object.prototype.hasOwnProperty.call(authUser, 'contactoEmergenciaParentesco')
                ? authUser.contactoEmergenciaParentesco
                : safeBase?.contactoEmergenciaParentesco
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

const toComparableUser = (user: PatientSessionUser | null) => ({
    id: normalizeText(user?.id),
    usuarioid: normalizeText(user?.usuarioid),
    email: normalizeText(user?.email).toLowerCase(),
    nombres: normalizeText(user?.nombres),
    apellidos: normalizeText(user?.apellidos),
    plan: normalizeText(user?.plan),
    fotoUrl: sanitizeFotoUrl(user?.fotoUrl),
    telefono: normalizeText(user?.telefono),
    cedula: normalizeText(user?.cedula),
    genero: normalizeText(user?.genero),
    fechanacimiento: normalizeText(user?.fechanacimiento),
    direccion: normalizeText(user?.direccion),
    tipoSangre: normalizeText(user?.tipoSangre),
    alergias: normalizeText(user?.alergias),
    medicamentos: normalizeText(user?.medicamentos),
    antecedentes: normalizeText(user?.antecedentes),
});

const areUsersEquivalent = (
    left: PatientSessionUser | null,
    right: PatientSessionUser | null
) => JSON.stringify(toComparableUser(left)) === JSON.stringify(toComparableUser(right));

export function usePatientSessionProfile() {
    const { user, updateUser } = useAuth<Record<string, unknown>>();

    const sessionUser = ensurePatientSessionUser(user as PatientSessionUser | null);
    const sessionUserRef = useRef<PatientSessionUser | null>(sessionUser);

    useEffect(() => {
        sessionUserRef.current = sessionUser;
    }, [sessionUser]);

    const syncProfile = useCallback(async () => {
        let nextUser = ensurePatientSessionUser(sessionUserRef.current);

        try {
            const profilePayload = await apiClient.get<any>('/api/users/me/paciente-profile', {
                authenticated: true,
            });
            if (profilePayload?.success && profilePayload?.profile) {
                nextUser = mergePatientProfile(nextUser, profilePayload.profile as PatientSessionUser);
                if (nextUser && !areUsersEquivalent(sessionUserRef.current, nextUser)) {
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
                if (nextUser && !areUsersEquivalent(sessionUserRef.current, nextUser)) {
                    await updateUser(nextUser as Record<string, unknown>);
                }
                return nextUser;
            }
        } catch {
            // noop
        }

        return nextUser;
    }, [updateUser]);

    return {
        sessionUser,
        syncProfile,
    };
}
