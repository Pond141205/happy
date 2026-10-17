import { afterEach, describe, expect, it, vi } from 'vitest';
afterEach(() => { vi.unstubAllEnvs(); vi.resetModules(); vi.restoreAllMocks(); });
describe('Fail-closed backend', () => {
  it('cannot load real content or media when configuration is absent', async () => {
    vi.stubEnv('VITE_SUPABASE_URL', ''); vi.stubEnv('VITE_SUPABASE_PUBLISHABLE_KEY', '');
    const { backend, loadExhibition, privateBlob } = await import('./backend');
    expect(backend).toBeNull();
    await expect(loadExhibition()).rejects.toThrow();
    await expect(privateBlob('photo.webp')).rejects.toThrow();
  });
  it('rejects non-HTTPS or unexpected backend origins', async () => {
    vi.stubEnv('VITE_SUPABASE_URL', 'http://attacker.example'); vi.stubEnv('VITE_SUPABASE_PUBLISHABLE_KEY', 'public-test-key');
    const { backend } = await import('./backend'); expect(backend).toBeNull();
  });
});
