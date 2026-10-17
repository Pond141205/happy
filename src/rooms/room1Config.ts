// Public design settings only; personal media still comes from Supabase's private bucket.
export const ROOM1 = {
  length: 64, centerZ: 24, entranceZ: 56,
  intro: 'Before anything else, there were beautiful things.',
  palette: { wall: '#65705a', trim: '#eee9db', wood: '#775039', brass: '#b99b62' },
  center: { x: 0, z: 0 },
};
export const ROOM1_FRAME_SLOTS = Array.from({ length: 16 }, (_, bay) => [-1, 1].map(side => ({
  position: [side * 4.91, 2.9, 52 - bay * 3.7] as [number, number, number],
  rotation: -side * Math.PI / 2, scale: .9,
}))).flat();
