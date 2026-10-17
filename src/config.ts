export function publicBackendConfig(url: unknown, key: unknown): { url: string; key: string } | null {
  if (typeof url !== 'string' || !/^https:\/\/[a-z0-9-]+\.supabase\.co$/.test(url) || typeof key !== 'string') return null;
  if (/^sb_publishable_[A-Za-z0-9_-]+$/.test(key)) return { url, key };
  // Legacy anon JWTs are public configuration. This is only a configuration check,
  // never authentication. The server independently verifies all user requests.
  try {
    const parts = key.split('.');
    if (parts.length !== 3) return null;
    const encoded = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const payload = JSON.parse(atob(encoded.padEnd(Math.ceil(encoded.length / 4) * 4, '=')));
    if (payload.role === 'anon') return { url, key };
  } catch { /* Invalid config fails closed. */ }
  return null;
}
