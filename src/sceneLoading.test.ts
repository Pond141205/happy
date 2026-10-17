import { describe, expect, it, vi } from 'vitest';
import { SceneLoadTracker, SceneWarmupGate } from './sceneLoading';

describe('Scene loading lifecycle', () => {
  it('reports actual counts and waits for downloads and rendered reflection frames', () => {
    const tracker = new SceneLoadTracker(), id = tracker.start(), gate = new SceneWarmupGate();
    expect(tracker.getSnapshot().phase).toBe('code');
    tracker.assets(id, 2, 8); tracker.preparing(id); tracker.ready(id);
    expect(tracker.getSnapshot()).toMatchObject({ phase: 'assets', loaded: 2, total: 8 });
    for (let i = 0; i < 30; i++) expect(gate.frame(false)).toBe(false);
    tracker.assets(id, 8, 8); tracker.preparing(id); expect(gate.frame(true)).toBe(false);
    expect(gate.frame(true)).toBe(true); tracker.ready(id); expect(tracker.getSnapshot().phase).toBe('ready');
    expect(gate.frame(true)).toBe(false);
  });
  it('rejects stale callbacks after logout, album return or retry', () => {
    const tracker = new SceneLoadTracker(), old = tracker.start(), current = tracker.start();
    tracker.assets(old, 9, 9); tracker.preparing(old); tracker.ready(old); tracker.fail(old);
    expect(tracker.getSnapshot()).toEqual({ id: current, phase: 'code', loaded: 0, total: 0 });
    tracker.preparing(current); tracker.ready(current); expect(tracker.getSnapshot().phase).toBe('ready');
  });
  it('does not reopen the loading screen for optional images arriving after readiness', () => {
    const tracker = new SceneLoadTracker(), id = tracker.start(); tracker.preparing(id); tracker.ready(id);
    tracker.assets(id, 0, 2); tracker.fail(id); tracker.preparing(id); expect(tracker.getSnapshot().phase).toBe('ready');
  });
  it('keeps failed preparation locked until a new attempt starts', () => {
    const tracker = new SceneLoadTracker(), id = tracker.start(); tracker.fail(id); tracker.preparing(id); tracker.ready(id); tracker.assets(id, 1, 1);
    expect(tracker.getSnapshot().phase).toBe('error'); expect(tracker.start()).toBeGreaterThan(id); expect(tracker.getSnapshot().phase).toBe('code');
  });
  it('sanitizes invalid counts and releases subscribers on unmount', () => {
    const tracker = new SceneLoadTracker(), spy = vi.fn(), unsubscribe = tracker.subscribe(spy), id = tracker.start();
    tracker.assets(id, 99, 4); expect(tracker.getSnapshot()).toMatchObject({ loaded: 4, total: 4 });
    tracker.assets(id, NaN, Infinity); expect(tracker.getSnapshot()).toMatchObject({ loaded: 0, total: 0 });
    const calls = spy.mock.calls.length; unsubscribe(); tracker.start(); expect(spy).toHaveBeenCalledTimes(calls);
  });
});
