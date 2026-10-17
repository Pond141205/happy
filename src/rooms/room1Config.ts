// Public design settings only; personal media still comes from Supabase's private bucket.
export const ROOM1 = {
  intro: 'Before anything else, there were beautiful things.',
  palette: { wall: '#65705a', trim: '#eee9db', wood: '#775039', brass: '#b99b62' },
  center: { x: 0, z: 0 },
};
export const ROOM1_FRAME_SLOTS = [
  { position: [-4.91, 2.9, 2] as [number, number, number], rotation: Math.PI / 2, scale: 0.9 },
  { position: [4.91, 2.9, 2] as [number, number, number], rotation: -Math.PI / 2, scale: 0.9 },
  { position: [-4.91, 2.9, -2] as [number, number, number], rotation: Math.PI / 2, scale: 0.9 },
  { position: [4.91, 2.9, -2] as [number, number, number], rotation: -Math.PI / 2, scale: 0.9 },
  { position: [-3.05, 2.9, -7.65] as [number, number, number], rotation: 0, scale: 0.82 },
  { position: [3.05, 2.9, -7.65] as [number, number, number], rotation: 0, scale: 0.82 },
];
