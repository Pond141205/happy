// Manual visual regression harness. Vite's production entry excludes this page.
import { useState } from 'react';
import { createRoot } from 'react-dom/client';
import Gallery from '../src/Gallery';
import { sample } from '../src/content';
import type { CameraPose } from '../src/controls/movement';

const views: Record<string, CameraPose> = {
  'Dome corners': { x: 0, z: -16, yaw: -.65, pitch: .55 },
  'Back roof seam': { x: 0, z: -23, yaw: 0, pitch: .5 },
  'Closed entrance': { x: 0, z: 48, yaw: Math.PI, pitch: .05 },
  'Connecting passage': { x: 0, z: -5, yaw: 0, pitch: .1 },
  'Forest through glass': { x: 0, z: -23, yaw: 1.05, pitch: .12 },
  'Mountain window': { x: 0, z: -23, yaw: 0, pitch: .1 },
  'Close tree': { x: -3.4, z: -21, yaw: Math.PI / 2, pitch: .2 },
  'Cake portrait': { x: 0, z: -16.7, yaw: 0, pitch: -.1 },
};
function Check() {
  const [view, setView] = useState('Dome corners');
  const [phone, setPhone] = useState(false);
  const pose = { current: { ...views[view] } };
  const stick = { current: { x: 0, y: 0 } };
  return <><div style={{ position: 'fixed', left: 0, top: 0, width: phone ? 402 : '100vw', height: phone ? 874 : '100vh', maxWidth: '100vw', maxHeight: '100vh' }}><Gallery key={view} content={sample} entered chapter={views[view].z < -12 ? 1 : 0} pose={pose} stick={stick} paused={false} reduced candleOut={false} lookReset={0} onChapter={() => {}} onAudioMix={() => {}} onMemory={() => {}} onError={reason => console.error(reason)} /></div><nav style={{ position: 'fixed', left: 16, top: 16, display: 'flex', flexWrap: 'wrap', gap: 8, maxWidth: 'calc(100vw - 32px)' }}>{Object.keys(views).map(name => <button key={name} onClick={() => setView(name)} style={{ padding: 12 }}>{name}</button>)}<button style={{ padding: 12 }} onClick={() => setPhone(!phone)}>{phone ? 'Full canvas' : 'Phone canvas'}</button></nav></>;
}
if (import.meta.env.DEV) {
  const root = import.meta.hot?.data.root ?? createRoot(document.getElementById('root')!);
  if (import.meta.hot) import.meta.hot.data.root = root;
  root.render(<Check />);
}
