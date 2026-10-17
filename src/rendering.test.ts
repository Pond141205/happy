import { describe, expect, it } from 'vitest';
import { AdaptiveResolution, renderBudget } from './rendering';
describe('iPhone and desktop render budgets', () => {
  it('budgets a high-DPR iPhone in both orientations without rendering its entire native pixel count', () => {
    for (const [w, h] of [[402, 874], [874, 402]]) {
      const p = renderBudget(w, h, 3, true);
      expect(p.compact).toBe(true); expect(p.dpr).toBe(1.25);
      expect(w * h * p.dpr ** 2).toBeLessThanOrEqual(800_000);
      expect(p.transmissionScale).toBe(.5); expect(p.fov).toBe(w < h ? 72 : 62);
    }
  });
  it('also handles tablet touch, desktop resize, low-DPR screens and malformed dimensions', () => {
    expect(renderBudget(1024, 1366, 2, true).compact).toBe(true);
    expect(renderBudget(1920, 1080, 2, false).compact).toBe(false);
    expect(renderBudget(3840, 2160, 2, false).dpr ** 2 * 3840 * 2160).toBeLessThanOrEqual(2_500_001);
    expect(renderBudget(402, 874, 1, true).dpr).toBe(1);
    expect(Number.isFinite(renderBudget(NaN, Infinity, NaN, false).dpr)).toBe(true);
  });
});
describe('Measured resolution changes', () => {
  it('keeps good frame rates at the selected quality', () => {
    const c = new AdaptiveResolution(1.75); for (let i = 0; i < 1200; i++) c.sample(1 / 60, true); expect(c.dpr).toBe(1.75);
  });
  it('reduces quality for sustained slow rendering, waits before another change, and has a floor', () => {
    const c = new AdaptiveResolution(1.75); let adjustments = 0;
    for (let i = 0; i < 120; i++) if (c.sample(1 / 30, true)) adjustments++;
    expect(adjustments).toBe(1); expect(c.dpr).toBe(1.75 * .875);
    for (let i = 0; i < 1800; i++) c.sample(1 / 30, true);
    expect(c.dpr).toBe(1.75 * .75);
  });
  it('recovers quality gradually and ignores hidden/paused scenes, invalid samples and long tab gaps', () => {
    const c = new AdaptiveResolution(1.75);
    for (let i = 0; i < 120; i++) c.sample(1 / 30, true);
    const reduced = c.dpr;
    for (let i = 0; i < 100; i++) { c.sample(1 / 15, false); c.sample(1, true); c.sample(NaN, true); }
    expect(c.dpr).toBe(reduced);
    for (let i = 0; i < 1500; i++) c.sample(1 / 60, true);
    expect(c.dpr).toBe(1.75);
  });
});
