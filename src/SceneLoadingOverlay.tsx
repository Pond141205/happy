import { useEffect, useState } from 'react';
import type { SceneLoadState } from './sceneLoading';

export default function SceneLoading({ state, onAlbum }: { state: SceneLoadState; onAlbum: () => void }) {
  const [slow, setSlow] = useState(false);
  useEffect(() => { const timer = setTimeout(() => setSlow(true), 12000); return () => clearTimeout(timer); }, []);
  const title = state.phase === 'error' ? 'ฉากยังเปิดไม่สำเร็จ' : state.phase === 'assets' ? 'กำลังโหลดทิวทัศน์' : state.phase === 'preparing' ? 'กำลังเตรียมแสงและกระจก' : 'กำลังเปิดพิพิธภัณฑ์';
  return <section className="scene-loading-overlay" role="status" aria-live="polite" aria-busy={state.phase !== 'error'} data-testid="scene-loading">
    <div className="scene-loading-card"><span className="eyebrow">A LITTLE MOMENT, JUST FOR US</span><div className="loading-arch" aria-hidden="true"><span className="loading-ring" /></div><h2>{title}</h2><p>{state.phase === 'error' ? 'ลองเปิดใหม่ หรือดูความทรงจำแบบอัลบั้มก่อนได้นะ' : 'กำลังจัดทุกความทรงจำให้พร้อมต้อนรับเธอ'}</p>
      {state.total > 0 && <p className="loading-count">โหลดไฟล์แล้ว {state.loaded} / {state.total}</p>}
      <div className="loading-stages" aria-hidden="true"><span className={state.phase === 'code' ? 'current' : ''}>เปิดห้อง</span><span className={state.phase === 'assets' ? 'current' : ''}>โหลดทิวทัศน์</span><span className={state.phase === 'preparing' ? 'current' : ''}>เตรียมแสง</span></div>
      {slow && <p className="loading-slow">ครั้งแรกอาจใช้เวลาสักครู่ กำลังเตรียมฉาก 3D บนอุปกรณ์ของเธอ</p>}
      <button className="text-button" onClick={onAlbum}>ดูแบบอัลบั้มระหว่างรอ</button>
    </div>
  </section>;
}
