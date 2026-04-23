import * as ImagePicker from "expo-image-picker";
import { Platform } from "react-native";

import { ApiError, apiClient } from "./api";
import { getApiErrorMessage } from "./apiErrors";

export interface CountryCodeType {
  code: string;
  name: string;
  mask: string;
}

export type RegistroMedicoDraftPayload = {
  nombreCompleto: string;
  fechanacimiento: string;
  genero: string;
  especialidad: string;
  cedula: string;
  telefono: string;
  fotoUrl?: string;
  cedulaProfesionalUrl?: string;
  certificadoEspecialidadUrl?: string;
  exequaturValidationToken?: string;
};

type FaceDetectorModule = typeof import("expo-face-detector");

type ValidacionTelefonoBackendOk = { ok: true; meta?: any };
type ValidacionTelefonoBackendFail = { ok: false; reason: string };
export type ValidacionTelefonoBackendResult =
  | ValidacionTelefonoBackendOk
  | ValidacionTelefonoBackendFail;

type ValidacionExequaturOk = { ok: true; meta?: any };
type ValidacionExequaturFail = { ok: false; reason: string };
export type ValidacionExequaturResult = ValidacionExequaturOk | ValidacionExequaturFail;

let cachedFaceDetectorModule: FaceDetectorModule | null | undefined;

export const GENDER_OPTIONS = ["Hombre", "Mujer", "Otro"] as const;

export const countryCodes: CountryCodeType[] = [
  { code: "+1", name: "República Dominicana", mask: "XXX XXX XXXX" },
  { code: "+593", name: "Ecuador", mask: "XX XXX XXXX" },
  { code: "+1", name: "USA/CAN", mask: "XXX XXX XXXX" },
  { code: "+506", name: "Costa Rica", mask: "XXXX XXXX" },
  { code: "+34", name: "España", mask: "XXX XX XX XX" },
];

export const ESPECIALIDADES = [
  "Medicina General",
  "Psicología",
  "Psiquiatría",
  "Ginecología",
  "Pediatría",
  "Dermatología",
  "Odontología",
  "Nutrición",
  "Neurología",
  "Neumología",
  "Infectología",
  "Endocrinología",
  "Reumatología",
  "Medicina Familiar",
];

export const normalizeFullName = (value: string) =>
  String(value || "")
    .replace(/\s+/g, " ")
    .trim();

export const esFechaValida = (fechaStr: string) => {
  if (fechaStr.length !== 10) return false;

  const [dia, mes, anio] = fechaStr.split("/").map(Number);
  const fecha = new Date(anio, mes - 1, dia);

  const esLogica =
    fecha.getFullYear() === anio &&
    fecha.getMonth() === mes - 1 &&
    fecha.getDate() === dia;

  if (!esLogica) return false;

  const hoy = new Date();
  if (fecha > hoy) return false;

  if (anio < hoy.getFullYear() - 120) return false;

  return true;
};

export const esMayorDe18 = (fechaStr: string) => {
  if (!esFechaValida(fechaStr)) return false;

  const [dia, mes, anio] = fechaStr.split("/").map(Number);
  const nacimiento = new Date(anio, mes - 1, dia);

  const hoy = new Date();
  const cumple18 = new Date(
    nacimiento.getFullYear() + 18,
    nacimiento.getMonth(),
    nacimiento.getDate()
  );

  return hoy >= cumple18;
};

export const validarCedulaDominicana = (cedula: string) => {
  const c = cedula.replace(/\D/g, "");
  if (c.length !== 11) return false;

  let suma = 0;
  const multiplicadores = [1, 2, 1, 2, 1, 2, 1, 2, 1, 2];
  for (let i = 0; i < 10; i++) {
    let n = parseInt(c[i], 10) * multiplicadores[i];
    if (n >= 10) n = Math.floor(n / 10) + (n % 10);
    suma += n;
  }

  const digitoVerificador = (10 - (suma % 10)) % 10;
  return digitoVerificador === parseInt(c[10], 10);
};

export const filterOnlyLetters = (text: string) =>
  text.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑ ]/g, "");

export const applyPhoneMask = (text: string, mask: string) => {
  const digits = text.replace(/\D/g, "");
  let formatted = "";
  let digitIndex = 0;

  for (let i = 0; i < mask.length && digitIndex < digits.length; i++) {
    if (mask[i] === "X") {
      formatted += digits[digitIndex];
      digitIndex++;
    } else {
      formatted += mask[i];
    }
  }

  return formatted;
};

export const updateMaskedDateInput = (text: string) => {
  const cleaned = text.replace(/[^0-9]/g, "");
  let formatted = "";

  if (cleaned.length > 0) {
    if (cleaned.length <= 2) formatted = cleaned;
    else if (cleaned.length <= 4) {
      formatted = `${cleaned.substring(0, 2)}/${cleaned.substring(2)}`;
    } else {
      formatted = `${cleaned.substring(0, 2)}/${cleaned.substring(2, 4)}/${cleaned.substring(
        4,
        8
      )}`;
    }
  }

  return formatted.substring(0, 10);
};

export const formatCedulaRD = (text: string) => {
  const digits = text.replace(/\D/g, "").slice(0, 11);
  const p1 = digits.slice(0, 3);
  const p2 = digits.slice(3, 10);
  const p3 = digits.slice(10, 11);

  if (digits.length <= 3) return p1;
  if (digits.length <= 10) return `${p1}-${p2}`;
  return `${p1}-${p2}-${p3}`;
};

export const buildPersistentPhotoUri = (
  asset: ImagePicker.ImagePickerAsset | undefined
): string => {
  if (!asset) return "";

  const base64 = String((asset as any)?.base64 || "").trim();
  if (base64) {
    const mimeRaw = String((asset as any)?.mimeType || "").trim().toLowerCase();
    const mimeType = mimeRaw.startsWith("image/") ? mimeRaw : "image/jpeg";
    return `data:${mimeType};base64,${base64}`;
  }

  return String(asset.uri || "").trim();
};

export const toWebDataUrl = async (uri: string): Promise<string> => {
  if (Platform.OS !== "web") return uri;
  const cleanUri = String(uri || "").trim();
  if (!cleanUri || cleanUri.startsWith("data:image/")) return cleanUri;

  try {
    const response = await fetch(cleanUri);
    const blob = await response.blob();
    const dataUrl = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === "string" && reader.result.startsWith("data:image/")) {
          resolve(reader.result);
          return;
        }
        resolve(cleanUri);
      };
      reader.onerror = () => reject(new Error("No se pudo leer la imagen."));
      reader.readAsDataURL(blob);
    });
    return String(dataUrl || "").trim();
  } catch {
    return cleanUri;
  }
};

const loadFaceDetectorModule = async (): Promise<FaceDetectorModule | null> => {
  if (cachedFaceDetectorModule !== undefined) return cachedFaceDetectorModule;

  try {
    cachedFaceDetectorModule = await import("expo-face-detector");
  } catch {
    cachedFaceDetectorModule = null;
  }

  return cachedFaceDetectorModule;
};

export const validarQueSeaPersona = async (uri: string) => {
  if (Platform.OS === "web") return true;

  const FaceDetector = await loadFaceDetectorModule();
  if (!FaceDetector) {
    return true;
  }

  try {
    const result = await FaceDetector.detectFacesAsync(uri, {
      mode: FaceDetector.FaceDetectorMode.fast,
      detectLandmarks: FaceDetector.FaceDetectorLandmarks.none,
      runClassifications: FaceDetector.FaceDetectorClassifications.none,
    });
    return (result?.faces?.length ?? 0) > 0;
  } catch {
    return false;
  }
};

export const validarTelefonoBackend = async (
  countryCode: string,
  phoneFormatted: string
): Promise<ValidacionTelefonoBackendResult> => {
  try {
    const digits = phoneFormatted.replace(/\D/g, "");
    const data = await apiClient.post<any>("/api/validar-telefono", {
      body: { countryCode, phone: digits },
    });

    if (!data?.success) {
      return {
        ok: false as const,
        reason: String(data?.message || "").trim() || "No se pudo validar el telefono.",
      };
    }

    if (!data.valid) {
      return {
        ok: false as const,
        reason: "El número no es válido según Veriphone.",
      };
    }

    return { ok: true as const, meta: data };
  } catch (error) {
    return {
      ok: false as const,
      reason: getApiErrorMessage(error, "Error de red: no se pudo conectar con el backend."),
    };
  }
};

export const validarExequaturPorNombre = async (
  nombreCompleto: string
): Promise<ValidacionExequaturResult> => {
  try {
    const nombreNormalizado = normalizeFullName(nombreCompleto);

    const data = await apiClient.post<any>("/api/validar-exequatur", {
      body: { nombreCompleto: nombreNormalizado },
    });

    if (!data?.success) {
      const serviceUnavailable = Boolean(data?.serviceUnavailable);

      if (serviceUnavailable) {
        return {
          ok: false as const,
          reason:
            data?.message ||
            "No fue posible validar el Exequatur con el SNS en este momento. Intenta nuevamente.",
        };
      }

      return {
        ok: false as const,
        reason:
          String(data?.message || "").trim() || "No se pudo validar el Exequatur del SNS.",
      };
    }

    if (!data.exists) {
      const suggestedName = String(data?.match?.candidateName || "").trim();
      const reason = suggestedName
        ? `No se encontró coincidencia exacta en el Exequatur del SNS. Nombre similar encontrado: ${suggestedName}. Verifica el nombre completo tal como aparece en el SNS.`
        : "Este médico no aparece en el Exequatur del SNS. Verifica el nombre completo tal como aparece en el SNS.";

      return {
        ok: false as const,
        reason,
      };
    }

    return { ok: true as const, meta: data };
  } catch (error) {
    if (error instanceof ApiError) {
      const errorData =
        error.data && typeof error.data === "object"
          ? (error.data as Record<string, any>)
          : null;
      const serviceUnavailable =
        error.status === 503 || Boolean(errorData?.serviceUnavailable);

      return {
        ok: false as const,
        reason: getApiErrorMessage(
          error,
          serviceUnavailable
            ? "No fue posible validar el Exequatur con el SNS en este momento. Intenta nuevamente."
            : `No se pudo validar Exequatur (HTTP ${error.status}).`
        ),
      };
    }

    return {
      ok: false as const,
      reason: "Error de red: no se pudo consultar el Exequatur.",
    };
  }
};
