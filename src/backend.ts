import { createClient } from '@supabase/supabase-js';
import { parseExhibition } from './content';
import { publicBackendConfig } from './config';
const url = import.meta.env.VITE_SUPABASE_URL;
const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
const config = publicBackendConfig(url, key);
export const backend = config
  ? createClient(config.url, config.key, { auth: { flowType: 'pkce', persistSession: true, storage: window.sessionStorage, autoRefreshToken: true, detectSessionInUrl: true } }) : null;
export async function loadExhibition() {
  if (!backend) throw new Error('ยังไม่ได้เชื่อมต่อพิพิธภัณฑ์ส่วนตัว');
  const { data: user, error: authError } = await backend.auth.getUser();
  if (authError || !user.user) throw new Error('กรุณาเข้าสู่ระบบอีกครั้ง');
  // RLS checks the server-side allowlist, not an email or boolean in the browser.
  const { data, error } = await backend.from('exhibitions').select('content').eq('id', 'our-museum').single();
  if (error || !data) throw new Error('บัญชีนี้ยังไม่ได้รับสิทธิ์ หรือพิพิธภัณฑ์ยังไม่พร้อม กรุณาติดต่อเจ้าของ');
  return parseExhibition(data.content);
}
export async function privateBlob(path: string) {
  if (import.meta.env.DEV && /^local\/gallery\/(thumb|full)\/\d{2}\.webp$/.test(path)) {
    const response = await fetch(`/__local-media/${path.slice(6)}`, { cache: 'no-store' });
    if (!response.ok) throw new Error('Local photo unavailable');
    return response.blob();
  }
  if (!backend) throw new Error('ไม่สามารถเปิดไฟล์ได้');
  const { data, error } = await backend.storage.from('memories').download(path);
  if (error || !data) throw new Error('ไม่สามารถเปิดไฟล์ได้ กรุณาลองอีกครั้ง');
  return data;
}
