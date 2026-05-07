const runtimeBackendUrl = process.env.EXPO_PUBLIC_BACKEND_URL || "https://virem-backend.onrender.com";

export const BACKEND_URL = String(runtimeBackendUrl).replace(/\/+$/, "");

export const apiUrl = (path: string) =>
  `${BACKEND_URL}${path.startsWith("/") ? path : `/${path}`}`;
