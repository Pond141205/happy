export const ROOM_TRACKS = [
  { title: 'You & I', path: import.meta.env.VITE_ROOM1_BGM || 'audio/you-and-i.mp3' },
  { title: 'About You', path: import.meta.env.VITE_ROOM2_BGM || 'audio/about-you.mp3' },
] as const;
export function localAudioUrl(path: string, base: string) {
  if (!path) return undefined;
  if (!path.startsWith('audio/') || !/\.(mp3|ogg|wav|m4a)$/i.test(path) || /[\\?#:%]/.test(path) || path.split('/').some(p => !p || p === '.' || p === '..')) throw new Error('Audio must be a relative local file inside audio/');
  // Keep legal path characters such as & intact. Vite's static server uses
  // decodeURI, which leaves %26 encoded and otherwise falls back to index.html.
  return `${base}${path.split('/').map(part => encodeURI(part)).join('/')}`;
}
export function passageMix(z: number) { return Math.max(0, Math.min(1, (-z - 8) / 4)); }
