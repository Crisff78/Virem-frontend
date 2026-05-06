const runtimeBackendUrl =
  (typeof process !== "undefined" ? process.env?.EXPO_PUBLIC_BACKEND_URL : "") ||
  "https://virem-backend.onrender.com"; // Default to production so it works for everyone

export const BACKEND_URL = String(runtimeBackendUrl).replace(/\/+$/, "");

export const apiUrl = (path: string) =>
  `${BACKEND_URL}${path.startsWith("/") ? path : `/${path}`}`;
