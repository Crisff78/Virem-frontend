const runtimeBackendUrl =
  (typeof process !== "undefined" ? process.env?.EXPO_PUBLIC_BACKEND_URL : "") ||
  "http://localhost:3000";

export const BACKEND_URL = String(runtimeBackendUrl).replace(/\/+$/, "");

export const apiUrl = (path: string) =>
  `${BACKEND_URL}${path.startsWith("/") ? path : `/${path}`}`;
