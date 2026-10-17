export function renderBudget(width: number, height: number, deviceDpr: number, coarse: boolean) {
  const w = Number.isFinite(width) && width > 0 ? width : 1024;
  const h = Number.isFinite(height) && height > 0 ? height : 768;
  const compact = coarse || Math.min(w, h) <= 500;
  const native = Number.isFinite(deviceDpr) && deviceDpr > 0 ? deviceDpr : 1;
  const pixels = compact ? 1_200_000 : 2_500_000;
  return { compact, dpr: Math.min(native, compact ? 1.75 : 1.5, Math.sqrt(pixels / (w * h))), transmissionScale: compact ? .75 : 1, fov: w < h ? 72 : 62 };
}

/** Change resolution only after sustained samples; ignore suspended tabs and shader compilation gaps. */
export class AdaptiveResolution {
  private elapsed = 0;
  private windowSeconds = 0;
  private windowFrames = 0;
  private cooldown = 0;
  private scale = 1;
  constructor(readonly baseDpr: number) {}
  get dpr() { return this.baseDpr * this.scale; }
  sample(delta: number, active: boolean): number | undefined {
    if (!active) { this.windowSeconds = this.windowFrames = 0; return; }
    if (!Number.isFinite(delta) || delta <= 0 || delta > .15) return;
    this.elapsed += delta; this.cooldown = Math.max(0, this.cooldown - delta);
    if (this.elapsed < 2) return;
    this.windowSeconds += delta; this.windowFrames++;
    if (this.windowSeconds < 1.5) return;
    const fps = this.windowFrames / this.windowSeconds;
    this.windowSeconds = this.windowFrames = 0;
    if (this.cooldown > 0) return;
    const next = fps < 42 ? Math.max(.75, this.scale - .125) : fps > 56 ? Math.min(1, this.scale + .125) : this.scale;
    if (next === this.scale) return;
    this.scale = next; this.cooldown = 10; return this.dpr;
  }
}
