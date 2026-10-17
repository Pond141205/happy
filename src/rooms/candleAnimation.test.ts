import { expect, it } from 'vitest';
import { candleAnimation, BLOW_DURATION } from './candleAnimation';
it('bends and shrinks the flame before releasing smoke, then clears both', () => {
  expect(candleAnimation(0, false).flame).toBe(1);
  expect(candleAnimation(.6, true).flame).toBeLessThan(1);
  expect(candleAnimation(.6, true).bend).toBeGreaterThan(0);
  expect(candleAnimation(1.3, true).flame).toBe(0);
  expect(candleAnimation(1.3, true).smoke).toBeGreaterThan(0);
  expect(candleAnimation(BLOW_DURATION, true).smoke).toBe(0);
});
it('uses a short fade without movement or smoke for reduced motion', () => {
  expect(candleAnimation(.3, true, true)).toMatchObject({ flame: 0, bend: 0, smoke: 0 });
  expect(candleAnimation(Infinity, true).smoke).toBe(0);
});
