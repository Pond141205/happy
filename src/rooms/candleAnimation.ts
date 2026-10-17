export const BLOW_DURATION = 3;
export function candleAnimation(elapsed: number, out: boolean, reduced = false) {
  const t = Number.isFinite(elapsed) ? Math.max(0, elapsed) : BLOW_DURATION;
  if (!out) return { flame: 1, bend: 0, smoke: 0, rise: 0 };
  return { flame: Math.max(0, 1 - t / (reduced ? .2 : 1.15)), bend: reduced ? 0 : Math.sin(Math.min(1, t / 1.15) * Math.PI) * .65,
    smoke: reduced ? 0 : Math.max(0, Math.min(1, (t - .45) * 3)) * Math.max(0, 1 - t / BLOW_DURATION), rise: Math.min(1, t / BLOW_DURATION) };
}
