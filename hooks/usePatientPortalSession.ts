import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { useAuth } from '../providers/AuthProvider';
import { sanitizeRemoteImageUrl } from '../utils/imageSources';
import { ensurePatientSessionUser, getPatientDisplayName } from '../utils/patientSession';
import { type PatientSessionUser, usePatientSessionProfile } from './usePatientSessionProfile';

type UsePatientPortalSessionOptions = {
  syncOnMount?: boolean;
  fallbackName?: string;
};

export function usePatientPortalSession(options: UsePatientPortalSessionOptions = {}) {
  const { syncOnMount = true, fallbackName = 'Paciente' } = options;
  const { signOut, updateUser } = useAuth<Record<string, unknown>>();
  const { sessionUser, syncProfile } = usePatientSessionProfile();
  const autoSyncDoneRef = useRef(false);
  const [loadingUser, setLoadingUser] = useState(syncOnMount);

  const user = useMemo(
    () => ensurePatientSessionUser(sessionUser as PatientSessionUser | null),
    [sessionUser]
  );

  const refreshUser = useCallback(async () => {
    setLoadingUser(true);
    try {
      return ensurePatientSessionUser((await syncProfile()) as PatientSessionUser | null);
    } catch {
      return ensurePatientSessionUser(sessionUser as PatientSessionUser | null);
    } finally {
      setLoadingUser(false);
    }
  }, [sessionUser, syncProfile]);

  const persistUser = useCallback(
    async (nextUser: PatientSessionUser | null) => {
      const safeUser = ensurePatientSessionUser(nextUser);
      if (safeUser) {
        await updateUser(safeUser as Record<string, unknown>);
      }
      return safeUser;
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

  const fullName = useMemo(() => getPatientDisplayName(user, fallbackName), [fallbackName, user]);
  const planLabel = useMemo(() => {
    const plan = String(user?.plan || '').trim();
    return plan ? `Paciente ${plan}` : 'Paciente';
  }, [user?.plan]);
  const fotoUrl = useMemo(() => sanitizeRemoteImageUrl(user?.fotoUrl), [user?.fotoUrl]);

  return {
    user,
    loadingUser,
    refreshUser,
    persistUser,
    signOut,
    fullName,
    planLabel,
    fotoUrl,
    hasProfilePhoto: Boolean(fotoUrl),
  };
}
