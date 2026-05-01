const normalizeText = (value: unknown) =>
  String(value ?? '')
    .replace(/\s+/g, ' ')
    .trim();

export const getRoleId = (user: unknown): number => {
  const source = (user ?? {}) as Record<string, unknown>;
  const roleId = Number(source.rolid ?? source.rolId ?? source.roleId);
  return Number.isFinite(roleId) ? roleId : 0;
};

export const ensurePatientSessionUser = <T>(user: T | null | undefined): T | null => {
  if (!user) return null;
  if (getRoleId(user) === 2) return null;
  return user;
};

export const getPatientDisplayName = (user: unknown, fallback = 'Paciente'): string => {
  const source = (user ?? {}) as Record<string, unknown>;
  const fullName = normalizeText(source.nombreCompleto ?? source.fullName ?? source.name);
  if (fullName) return fullName;

  const firstName = normalizeText(source.nombres ?? source.nombre ?? source.firstName);
  const lastName = normalizeText(source.apellidos ?? source.apellido ?? source.lastName);
  const combined = normalizeText(`${firstName} ${lastName}`);
  return combined || normalizeText(source.username) || fallback;
};
