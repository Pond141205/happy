import { describe, expect, it } from 'vitest';
import { JoystickController, joystickVector, NEUTRAL } from './joystick';

describe('joystickVector', () => {
  it.each([[100, 60, 0, 1], [100, 140, 0, -1], [60, 100, -1, 0], [140, 100, 1, 0]])('maps pointer (%s,%s) to (%s,%s)', (x, y, vx, vy) => {
    expect(joystickVector(x, y, 100, 100, 40)).toEqual({ x: vx, y: vy });
  });
  it('stays at rest in the center dead zone', () => {
    expect(joystickVector(100, 100, 100, 100, 40)).toEqual(NEUTRAL);
    expect(joystickVector(104, 100, 100, 100, 40)).toEqual(NEUTRAL);
  });
  it('supports analog input and clamps dragging far outside the base', () => {
    const half = joystickVector(120, 100, 100, 100, 40);
    expect(half.x).toBeGreaterThan(0); expect(half.x).toBeLessThan(1);
    const far = joystickVector(1000, -1000, 100, 100, 40);
    expect(Math.hypot(far.x, far.y)).toBeCloseTo(1);
    expect(far.x).toBeGreaterThan(0); expect(far.y).toBeGreaterThan(0);
  });
  it.each([0, -1, NaN, Infinity])('ignores invalid radius %s', radius => {
    expect(joystickVector(120, 100, 100, 100, radius)).toEqual(NEUTRAL);
  });
  it('does not send invalid pointer coordinates into movement', () => {
    expect(joystickVector(NaN, 100, 100, 100, 40)).toEqual(NEUTRAL);
    expect(joystickVector(100, Infinity, 100, 100, 40)).toEqual(NEUTRAL);
  });
});
describe('JoystickController', () => {
  it('begin acquires one pointer and ignores a second finger', () => {
    const c = new JoystickController();
    expect(c.begin(1, 100, 60, 100, 100, 40)).toBe(true);
    expect(c.begin(2, 100, 140, 100, 100, 40)).toBe(false);
    expect(c.pointerId).toBe(1); expect(c.vector.y).toBe(1);
  });
  it('move only follows the owning pointer', () => {
    const c = new JoystickController(); c.begin(1, 100, 100, 100, 100, 40);
    expect(c.move(2, 100, 60)).toBe(false); expect(c.vector).toEqual(NEUTRAL);
    expect(c.move(1, 100, 140)).toBe(true); expect(c.vector.y).toBe(-1);
  });
  it('end stops movement even after leaving the base', () => {
    const c = new JoystickController(); c.begin(1, 100, 60, 100, 100, 40); c.move(1, 100, -1000);
    expect(c.end(2)).toBe(false); expect(c.vector.y).toBe(1);
    expect(c.end(1)).toBe(true); expect(c.vector).toEqual(NEUTRAL);
    expect(c.move(1, 100, 60)).toBe(false); expect(c.pointerId).toBeNull();
  });
  it('reset clears input and allows a new pointer after interruption', () => {
    const c = new JoystickController(); c.begin(1, 100, 60, 100, 100, 40); c.reset();
    expect(c.vector).toEqual(NEUTRAL); expect(c.pointerId).toBeNull();
    expect(c.begin(2, 140, 100, 100, 100, 40)).toBe(true); expect(c.vector.x).toBe(1);
  });
});
