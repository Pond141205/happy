import { describe, expect, it } from 'vitest';
import { publicBackendConfig } from './config';
const url = 'https://example.supabase.co';
const jwt = (role: string) => `e30.${btoa(JSON.stringify({ role }))}.test`;
describe('Public configuration safety', () => {
  it('allows publishable and legacy anon configuration', () => {
    expect(publicBackendConfig(url, 'sb_publishable_example')).not.toBeNull();
    expect(publicBackendConfig(url, jwt('anon'))).not.toBeNull();
  });
  it('rejects server secrets, service-role keys and malformed keys', () => {
    for (const key of ['sb_secret_example', jwt('service_role'), jwt('authenticated'), 'not-a-key', 'a.b.c']) expect(publicBackendConfig(url, key)).toBeNull();
  });
  it('rejects lookalike domains and insecure origins', () => {
    for (const origin of ['https://supabase.co.evil.test', 'http://example.supabase.co', 'https://example.supabase.co@evil.test', 'https://example.supabase.co/path']) expect(publicBackendConfig(origin, 'sb_publishable_example')).toBeNull();
  });
});
