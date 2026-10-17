export type SceneLoadState = { id: number; phase: 'code' | 'assets' | 'preparing' | 'ready' | 'error'; loaded: number; total: number };
export class SceneLoadTracker {
  private state: SceneLoadState = { id: 0, phase: 'code', loaded: 0, total: 0 };
  private listeners = new Set<() => void>();
  getSnapshot = () => this.state;
  subscribe = (listener: () => void) => { this.listeners.add(listener); return () => { this.listeners.delete(listener); }; };
  private update(value: SceneLoadState) { this.state = value; this.listeners.forEach(listener => listener()); }
  start() { const id = this.state.id + 1; this.update({ id, phase: 'code', loaded: 0, total: 0 }); return id; }
  assets(id: number, loaded: number, total: number) {
    if (id !== this.state.id || this.state.phase === 'ready' || this.state.phase === 'error') return;
    const count = Number.isFinite(total) ? Math.max(0, Math.floor(total)) : 0;
    this.update({ id, phase: 'assets', loaded: Math.min(count, Number.isFinite(loaded) ? Math.max(0, Math.floor(loaded)) : 0), total: count });
  }
  preparing(id: number) { if (id === this.state.id && !['ready', 'error'].includes(this.state.phase) && !(this.state.phase === 'assets' && this.state.loaded < this.state.total)) this.update({ ...this.state, phase: 'preparing' }); }
  ready(id: number) { if (id === this.state.id && this.state.phase === 'preparing') this.update({ ...this.state, phase: 'ready' }); }
  fail(id: number) { if (id === this.state.id && this.state.phase !== 'ready') this.update({ ...this.state, phase: 'error' }); }
}
/** A rendered frame after the reflection capture must finish before revealing the scene. */
export class SceneWarmupGate {
  private framesAfterProbe = 0;
  private complete = false;
  frame(probeReady: boolean) { if (this.complete || !probeReady) return false; if (++this.framesAfterProbe < 2) return false; this.complete = true; return true; }
}
export const sceneLoading = new SceneLoadTracker();
