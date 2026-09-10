export const AUTH_ACCESS_TOKEN_KEY = "accessToken";
const LEGACY_ACCESS_TOKEN_KEYS = [
  "eventixAccessToken",
  "eventix_access_token",
  "eventix-token",
  "eventixToken",
];

function clearLegacyAccessTokens() {
  LEGACY_ACCESS_TOKEN_KEYS.forEach((key) => localStorage.removeItem(key));
}

export function getAccessToken() {
  return localStorage.getItem(AUTH_ACCESS_TOKEN_KEY);
}

export function setAccessToken(token: string) {
  clearLegacyAccessTokens();
  localStorage.setItem(AUTH_ACCESS_TOKEN_KEY, token);
}

export function clearAccessToken() {
  clearLegacyAccessTokens();
  localStorage.removeItem(AUTH_ACCESS_TOKEN_KEY);
}
