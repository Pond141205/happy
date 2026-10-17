export const WISH_DURATION = 9.6;
export const WISH_BLOW_AT = 4.8;
const clamp = (n: number) => Math.max(0, Math.min(1, n));
const smooth = (n: number) => { const x = clamp(n); return x * x * (3 - 2 * x); };
export function wishFrame(elapsed: number, reduced = false) {
  const t = Math.max(0, Number.isFinite(elapsed) ? elapsed : WISH_DURATION);
  const closed = t < 1.8 ? smooth(t / 1.8) : t < 7.5 ? 1 : 1 - smooth((t - 7.5) / 2.1);
  return { closed: reduced ? closed * .96 : closed, music: t < 2 ? 1 - smooth(t / 2) : t < 7.5 ? 0 : smooth((t - 7.5) / 2.1), wish: t >= 1.8 && t < 6.8, blow: t >= WISH_BLOW_AT, finished: t >= WISH_DURATION };
}
