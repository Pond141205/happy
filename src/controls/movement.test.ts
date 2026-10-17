import { describe, expect, it } from 'vitest';
import { stepMovement, WALK_SPEED } from './movement';
import type { Point } from '../rooms/navigation';
import { chapterAt } from '../rooms/layout';

function walk(position: Point, stick: { x: number; y: number }, seconds: number, fps = 60, yaw = 0) {
  let next = { ...position };
  for (let i = 0; i < Math.round(seconds * fps); i++) next = stepMovement(next, stick, yaw, 1 / fps, true);
  return next;
}
describe('stepMovement', () => {
  it('stays exactly still without joystick input', () => {
    expect(walk({ x: 0, z: 3 }, { x: 0, y: 0 }, 10)).toEqual({ x: 0, z: 3 });
  });
  it.each([[0, 1, 0, -1], [0, -1, 0, 1], [1, 0, 1, 0], [-1, 0, -1, 0]])('moves for joystick (%s,%s)', (x, y, dx, dz) => {
    const end = walk({ x: 0, z: 0 }, { x, y }, 1);
    expect(end.x).toBeCloseTo(dx * WALK_SPEED); expect(end.z).toBeCloseTo(dz * WALK_SPEED);
  });
  it('uses the direction the camera is facing', () => {
    const end = walk({ x: 0, z: 0 }, { x: 0, y: 1 }, 1, 60, Math.PI / 2);
    expect(end.x).toBeCloseTo(-WALK_SPEED); expect(end.z).toBeCloseTo(0);
  });
  it('keeps diagonal speed equal to straight speed', () => {
    const end = walk({ x: 0, z: 0 }, { x: 1, y: 1 }, 1);
    expect(Math.hypot(end.x, end.z)).toBeCloseTo(WALK_SPEED);
  });
  it('respects analog strength and stops immediately on release', () => {
    const slow = walk({ x: 0, z: 0 }, { x: 0, y: .5 }, 1);
    expect(slow.z).toBeCloseTo(-WALK_SPEED / 2);
    expect(walk(slow, { x: 0, y: 0 }, 3)).toEqual(slow);
  });
  it('does not move when disabled by a dialog, album or hidden tab', () => {
    expect(stepMovement({ x: 0, z: 3 }, { x: 1, y: 1 }, 0, 1 / 60, false)).toEqual({ x: 0, z: 3 });
  });
  it.each([30, 60, 144])('has the same speed at %s FPS', fps => {
    expect(walk({ x: 0, z: 3 }, { x: 0, y: 1 }, 1, fps).z).toBeCloseTo(3 - WALK_SPEED);
  });
  it('caps a stalled frame rather than jumping across walls', () => {
    expect(stepMovement({ x: 0, z: 3 }, { x: 0, y: 1 }, 0, 50, true).z).toBeCloseTo(3 - WALK_SPEED * .05);
  });
  it.each([NaN, Infinity, -1, 0])('ignores unsafe delta %s', delta => {
    expect(stepMovement({ x: 0, z: 3 }, { x: 0, y: 1 }, 0, delta, true)).toEqual({ x: 0, z: 3 });
  });
  it('does not mutate the input pose or drift on malformed input', () => {
    const start = Object.freeze({ x: 0, z: 3 });
    expect(stepMovement(start, { x: NaN, y: 0 }, 0, 1 / 60, true)).toEqual(start);
    walk(start, { x: 0, y: 1 }, 1); expect(start).toEqual({ x: 0, z: 3 });
  });
});
describe('Joystick movement through the museum', () => {
  it('moves forward from Room 1 into Room 2 and reverses back', () => {
    const end = walk({ x: 0, z: 0 }, { x: 0, y: 1 }, 9);
    expect(chapterAt(end.z)).toBe(1);
    const back = walk(end, { x: 0, y: -1 }, 9);
    expect(back.z).toBeCloseTo(0); expect(chapterAt(back.z)).toBe(0);
  });
  it('blocks a doorway wall without teleporting sideways on the next frame', () => {
    const end = walk({ x: 3, z: -6 }, { x: 0, y: 1 }, 5);
    expect(end.x).toBe(3); expect(end.z).toBe(-7.5);
  });
  it('allows sideways movement to line up with the doorway', () => {
    const blocked = walk({ x: 3, z: -6 }, { x: 0, y: 1 }, 3);
    const centered = walk(blocked, { x: -1, y: 0 }, 3 / WALK_SPEED);
    const entered = walk(centered, { x: 0, y: 1 }, 4);
    expect(chapterAt(entered.z)).toBe(1); expect(Math.abs(entered.x)).toBeLessThan(.03);
  });
  it('cannot walk through the cake but can walk around it', () => {
    const stopped = walk({ x: 0, z: -16 }, { x: 0, y: 1 }, 10);
    expect(stopped.z).toBeCloseTo(-18.1);
    let around = walk(stopped, { x: 1, y: 0 }, 2.5 / WALK_SPEED);
    around = walk(around, { x: 0, y: 1 }, 6 / WALK_SPEED);
    expect(around.z).toBeLessThan(-22); expect(around.x).toBeGreaterThan(2);
  });
  it('blocks outside walls and both ends of the experience', () => {
    expect(walk({ x: 0, z: 0 }, { x: 1, y: 0 }, 10).x).toBe(4.25);
    expect(walk({ x: 0, z: 0 }, { x: -1, y: 0 }, 10).x).toBe(-4.25);
    expect(walk({ x: 0, z: 54 }, { x: 0, y: -1 }, 10).z).toBe(55);
    expect(walk({ x: 3, z: -24 }, { x: 0, y: 1 }, 10).z).toBe(-26.5);
  });
});
