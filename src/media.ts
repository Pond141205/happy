import { useEffect, useState } from 'react';
import { encryptedPhoto } from './birthdayAccess';
const privateBlob = async (path: string) => path.startsWith('encrypted-media/') ? encryptedPhoto(path) : (await import('./backend')).privateBlob(path);

export function usePrivateMedia(path?: string, enabled = true) {
  const [state, setState] = useState<{ url?: string; error?: string }>({});
  useEffect(() => {
    let active = true;
    let objectUrl: string | undefined;
    setState({});
    if (path && enabled) privateBlob(path).then(blob => {
      if (!active) return;
      objectUrl = URL.createObjectURL(blob);
      setState({ url: objectUrl });
    }).catch(() => { if (active) setState({ error: 'เปิดไฟล์ไม่สำเร็จ กรุณาปิดแล้วลองใหม่' }); });
    return () => { active = false; if (objectUrl) URL.revokeObjectURL(objectUrl); };
  }, [path, enabled]);
  return state;
}
