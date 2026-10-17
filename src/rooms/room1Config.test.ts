import { expect, it } from 'vitest';
import { ROOM1, ROOM1_FRAME_SLOTS } from './room1Config';
import { INITIAL_POSE, stepMovement } from '../controls/movement';
import { chapterAt } from './layout';
it('fits all 32 exhibits on two long walls without overlapping frames or the exit', () => {
  expect(ROOM1_FRAME_SLOTS).toHaveLength(32);
  expect(ROOM1.centerZ - ROOM1.length / 2).toBe(-8);
  for (const side of [-1, 1]) {
    const frames = ROOM1_FRAME_SLOTS.filter(s => Math.sign(s.position[0]) === side);
    expect(frames).toHaveLength(16);
    frames.forEach((s, i) => { expect(s.position[2]).toBeGreaterThan(-6); expect(s.position[2]).toBeLessThan(54); if (i) expect(frames[i - 1].position[2] - s.position[2]).toBeGreaterThan(2.38 * s.scale); });
  }
});
it('starts inside the extended hall and allows joystick travel all the way to the birthday passage', () => {
  let position = { x: INITIAL_POSE.x, z: INITIAL_POSE.z };
  expect(chapterAt(position.z)).toBe(0);
  for (let i = 0; i < 60 * 44; i++) position = stepMovement(position, { x: 0, y: 1 }, 0, 1 / 60, true);
  expect(position.z).toBeLessThan(-12); expect(chapterAt(position.z)).toBe(1);
});
