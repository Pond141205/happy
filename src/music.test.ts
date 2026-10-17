import { afterEach, expect, it, vi } from 'vitest';
afterEach(() => { vi.unstubAllGlobals(); vi.resetModules(); });
it('crossfades persistent transports without resetting either song', async () => {
  const tracks: FakeAudio[] = []; const gains: { gain: { value: number; setTargetAtTime: ReturnType<typeof vi.fn> }; connect: ReturnType<typeof vi.fn>; disconnect: ReturnType<typeof vi.fn> }[] = [];
  class FakeAudio {
    loop = false; preload = ''; currentTime = 0;
    play = vi.fn().mockResolvedValue(undefined); pause = vi.fn(); removeAttribute = vi.fn(); load = vi.fn();
    constructor(public src: string) { tracks.push(this); }
  }
  class FakeContext {
    currentTime = 10; destination = {};
    resume = vi.fn().mockResolvedValue(undefined); suspend = vi.fn().mockResolvedValue(undefined); close = vi.fn().mockResolvedValue(undefined);
    createMediaElementSource() { return { connect: vi.fn(), disconnect: vi.fn() }; }
    createGain() { const gain = { gain: { value: 0, setTargetAtTime: vi.fn() }, connect: vi.fn(), disconnect: vi.fn() }; gains.push(gain); return gain; }
  }
  vi.stubGlobal('Audio', FakeAudio); vi.stubGlobal('AudioContext', FakeContext);
  const { MuseumMusic } = await import('./music'); const player = new MuseumMusic();
  await player.start(); expect(tracks).toHaveLength(2);
  tracks[0].currentTime = 42; tracks[1].currentTime = 31;
  player.setMix(.5);
  expect(gains[0].gain.setTargetAtTime).toHaveBeenLastCalledWith(.18 * Math.SQRT1_2, 10, .35);
  expect(gains[1].gain.setTargetAtTime.mock.lastCall![0]).toBeCloseTo(.18 * Math.SQRT1_2);
  player.setChapter(1); player.setChapter(0);
  tracks.forEach(track => { expect(track.play).toHaveBeenCalledTimes(1); expect(track.pause).not.toHaveBeenCalled(); });
  expect(tracks.map(t => t.currentTime)).toEqual([42, 31]);
  player.duck(true); expect(gains[0].gain.setTargetAtTime).toHaveBeenLastCalledWith(.18 * .12, 10, .35);
  await player.stop(); await player.start(); expect(tracks.map(t => t.currentTime)).toEqual([42, 31]);
  player.dispose(); tracks.forEach(t => expect(t.removeAttribute).toHaveBeenCalledWith('src'));
});
