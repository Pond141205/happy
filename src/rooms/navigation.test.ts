import { describe, expect, it } from 'vitest';
import { constrainPosition } from './navigation';
describe('constrainPosition', () => {
  it('preserves legal gallery positions', () => {
    expect(constrainPosition({ x: 0, z: 0 })).toEqual({ x: 0, z: 0 });
    expect(constrainPosition({ x: -4, z: 3 })).toEqual({ x: -4, z: 3 });
  });
  it('clamps outside boundaries', () => {
    expect(constrainPosition({ x: 100, z: 100 })).toEqual({ x: 4.25, z: 55 });
    expect(constrainPosition({ x: -100, z: -100 })).toEqual({ x: -4.25, z: -26.5 });
  });
  it('keeps passage movement within its narrow walls', () => {
    expect(constrainPosition({ x: 2, z: -10 }, { x: .9, z: -10 })).toEqual({ x: 1.02, z: -10 });
  });
  it('does not pull someone sideways through the doorway wall', () => {
    expect(constrainPosition({ x: 3, z: -7.51 }, { x: 3, z: -7.5 })).toEqual({ x: 3, z: -7.5 });
  });
  it('keeps positions outside the cake circle including its exact center', () => {
    for (const point of [{ x: 0, z: -20 }, { x: .1, z: -19.9 }]) {
      const next = constrainPosition(point);
      expect(Math.hypot(next.x, next.z + 20)).toBeCloseTo(1.9);
    }
  });
});
