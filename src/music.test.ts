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
  player.duck(false); player.atmosphere(0); expect(gains[0].gain.setTargetAtTime).toHaveBeenLastCalledWith(0, 10, .35);
  player.atmosphere(.5); expect(gains[0].gain.setTargetAtTime).toHaveBeenLastCalledWith(.09, 10, .35);
  player.endWish(); expect(gains[0].gain.setTargetAtTime).toHaveBeenLastCalledWith(.18, 10, .35);
  await player.stop(); await player.start(); expect(tracks.map(t => t.currentTime)).toEqual([42, 31]);
  player.dispose(); tracks.forEach(t => expect(t.removeAttribute).toHaveBeenCalledWith('src'));
});

it('schedules one breath after the wish and cancels it on cleanup', async () => {
 const sources: {start: ReturnType<typeof vi.fn>; stop: ReturnType<typeof vi.fn>; connect: ReturnType<typeof vi.fn>; disconnect: ReturnType<typeof vi.fn>; buffer?: unknown; onended?: () => void}[] = [];
 const ramps = vi.fn();
 class FakeAudio { play=vi.fn().mockResolvedValue(undefined); pause=vi.fn(); removeAttribute=vi.fn(); load=vi.fn(); }
 class FakeContext {
  currentTime=10; sampleRate=8000; destination={};
  resume=vi.fn().mockResolvedValue(undefined); close=vi.fn().mockResolvedValue(undefined);
  createMediaElementSource(){return {connect:vi.fn(),disconnect:vi.fn()};}
  createGain(){return {gain:{value:0,setTargetAtTime:vi.fn(),setValueAtTime:vi.fn(),linearRampToValueAtTime:ramps},connect:vi.fn(),disconnect:vi.fn()};}
  createBuffer(_channels:number,length:number){return {getChannelData:()=>new Float32Array(length)};}
  createBufferSource(){const node={start:vi.fn(),stop:vi.fn(),connect:vi.fn(),disconnect:vi.fn()};sources.push(node);return node;}
  createBiquadFilter(){return {type:'',frequency:{value:0},Q:{value:0},connect:vi.fn(),disconnect:vi.fn()};}
 }
 vi.stubGlobal('Audio',FakeAudio);vi.stubGlobal('AudioContext',FakeContext);
 const {MuseumMusic}=await import('./music');const player=new MuseumMusic();
 player.beginWish(4.8);
 expect(sources[0].start).toHaveBeenCalledWith(14.8);
 expect(sources[0].stop).toHaveBeenCalledWith(16.45);
 expect(ramps).toHaveBeenLastCalledWith(0,16.45);
 player.endWish();expect(sources[0].stop).toHaveBeenCalledTimes(2);
 sources[0].onended?.();expect(sources[0].disconnect).toHaveBeenCalled();
 player.dispose();
});
