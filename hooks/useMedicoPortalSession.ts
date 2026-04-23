import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { useAuth } from '../providers/AuthProvider';
import {
  CachedMedicoProfile,
  readMedicoProfileCacheMap,
  writeMedicoProfileCacheMap,
} from '../utils/medicoProfileCache';
import { sanitizeRemoteImageUrl } from '../utils/imageSources';
import { MedicoSessionUser, useMedicoSessionProfile } from './useMedicoSessionProfile';

type UseMedicoPortalSessionOptions = {
  syncOnMount?: boolean;
  addDoctorPrefix?: boolean;
};

const normalizeText = (value: unknown) =>
  String(value || '')
    .replace(/\s+/g, ' ')
    .trim();

const ensureDoctorPrefix = (value: string) => {
  const clean = normalizeText(value);
  if (!clean) return 'Doctor';
  const lowered = clean.toLowerCase();
  if (lowered.startsWith('dr ') || lowered.startsWith('dr.')) return clean;
  return `Dr. ${clean}`;
};

const toCachedProfile = (
  sessionUser: MedicoSessionUser | null,
  previous: CachedMedicoProfile | null = null
): CachedMedicoProfile => ({
  ...(previous || {}),
  nombreCompleto: normalizeText(
    sessionUser?.nombreCompleto || sessionUser?.medico?.nombreCompleto || previous?.nombreCompleto
  ),
  especialidad: normalizeText(
    sessionUser?.especialidad || sessionUser?.medico?.especialidad || previous?.especialidad
  ),
  fechanacimiento: normalizeText(
    sessionUser?.fechanacimiento || sessionUser?.medico?.fechanacimiento || previous?.fechanacimiento
  ),
  genero: normalizeText(sessionUser?.genero || sessionUser?.medico?.genero || previous?.genero),
  cedula: normalizeText(sessionUser?.cedula || sessionUser?.medico?.cedula || previous?.cedula),
  telefono: normalizeText(
    sessionUser?.telefono || sessionUser?.medico?.telefono || previous?.telefono
  ),
  fotoUrl: sanitizeRemoteImageUrl(
    sessionUser?.fotoUrl || sessionUser?.medico?.fotoUrl || previous?.fotoUrl
  ),
});

export function useMedicoPortalSession(options: UseMedicoPortalSessionOptions = {}) {
  const { syncOnMount = true, addDoctorPrefix = false } = options;
  const { signOut, updateUser } = useAuth<Record<string, unknown>>();
  const { sessionUser, syncProfile } = useMedicoSessionProfile();
  const autoSyncDoneRef = useRef(false);
  const [loadingUser, setLoadingUser] = useState(syncOnMount);

  const user = useMemo(() => sessionUser || null, [sessionUser]);

  const refreshUser = useCallback(async () => {
    setLoadingUser(true);
    try {
      return (await syncProfile()) as MedicoSessionUser | null;
    } catch {
      return sessionUser || null;
    } finally {
      setLoadingUser(false);
    }
  }, [sessionUser, syncProfile]);

  const persistUser = useCallback(
    async (nextUser: MedicoSessionUser | null) => {
      if (!nextUser) return null;

      await updateUser(nextUser as Record<string, unknown>);

      const email = normalizeText(nextUser.email).toLowerCase();
      if (email) {
        const cacheMap = await readMedicoProfileCacheMap();
        cacheMap[email] = toCachedProfile(nextUser, cacheMap[email] || null);
        await writeMedicoProfileCacheMap(cacheMap);
      }

      return nextUser;
    },
    [updateUser]
  );

  useEffect(() => {
    if (!syncOnMount) {
      setLoadingUser(false);
      return;
    }

    if (autoSyncDoneRef.current) {
      return;
    }

    autoSyncDoneRef.current = true;
    refreshUser().catch(() => undefined);
  }, [refreshUser, syncOnMount]);

  const doctorBaseName = useMemo(
    () => normalizeText(user?.nombreCompleto || user?.medico?.nombreCompleto),
    [user?.medico?.nombreCompleto, user?.nombreCompleto]
  );
  const doctorName = useMemo(
    () => (addDoctorPrefix ? ensureDoctorPrefix(doctorBaseName) : doctorBaseName || 'Doctor'),
    [addDoctorPrefix, doctorBaseName]
  );
  const doctorSpec = useMemo(
    () => normalizeText(user?.especialidad || user?.medico?.especialidad) || 'Especialidad no definida',
    [user?.especialidad, user?.medico?.especialidad]
  );
  const fotoUrl = useMemo(
    () => sanitizeRemoteImageUrl(user?.fotoUrl || user?.medico?.fotoUrl),
    [user?.fotoUrl, user?.medico?.fotoUrl]
  );

  return {
    user,
    loadingUser,
    refreshUser,
    persistUser,
    signOut,
    doctorName,
    doctorSpec,
    fotoUrl,
    hasProfilePhoto: Boolean(fotoUrl),
  };
}
