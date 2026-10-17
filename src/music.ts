import { localAudioUrl, ROOM_TRACKS } from './audioConfig';

/** Two persistent transports: crossing rooms only changes gains, never playback time. */
export class MuseumMusic {
  private tracks = ROOM_TRACKS.map(track => {
    const audio = new Audio(localAudioUrl(track.path, import.meta.env.BASE_URL));
    audio.loop = true; audio.preload = 'metadata';
    return audio;
  });
  private context?: AudioContext;
  private gains: GainNode[] = [];
  private sources: MediaElementAudioSourceNode[] = [];
  private level = .18;
  private ambience = 1;
  private breath?: AudioBufferSourceNode;
  private blend = 0;
  private ducked = false;
  private disposed = false;
  private generation = 0;
  private starting?: Promise<void>;
  private setup() {
    if (this.context) return;
    this.context = new AudioContext();
    this.gains = this.tracks.map(audio => {
      const source = this.context!.createMediaElementSource(audio);
      const gain = this.context!.createGain();
      gain.gain.value = 0;
      source.connect(gain); gain.connect(this.context!.destination);
      this.sources.push(source); return gain;
    });
    this.updateGains(true);
  }
  start(): Promise<void> {
    if (this.disposed) return Promise.reject(new Error('Player disposed'));
    if (this.starting) return this.starting;
    this.setup();
    const generation = ++this.generation;
    // Both play calls occur in the user gesture, including the initially silent track.
    const requests = [this.context!.resume(), ...this.tracks.map((audio, index) => {
      // Reload a previously failed resource so the button can recover after a file is fixed.
      if (audio.error) audio.load();
      return audio.play().catch(error => {
        if (error instanceof DOMException && error.name === 'NotAllowedError') throw error;
        throw new Error(`เปิดเพลง ${ROOM_TRACKS[index].title} ไม่สำเร็จ กรุณารีเฟรชหน้าเว็บแล้วลองอีกครั้ง`);
      });
    })];
    this.starting = Promise.all(requests).then(() => {
      if (this.disposed || generation !== this.generation) this.tracks.forEach(audio => audio.pause());
    }).catch(error => {
      this.tracks.forEach(audio => audio.pause());
      throw error;
    }).finally(() => { this.starting = undefined; });
    return this.starting;
  }
  setMix(blend: number) {
    const next = Math.max(0, Math.min(1, blend));
    if (Math.abs(next - this.blend) < .001) return;
    this.blend = next; this.updateGains();
  }
  setChapter(chapter: number) { this.setMix(chapter === 0 ? 0 : 1); }
  volume(value: number) { this.level = Math.max(0, Math.min(.6, value)); this.updateGains(); }
  duck(value: boolean) { this.ducked = value; this.updateGains(); }
  atmosphere(value: number) { this.ambience = Math.max(0, Math.min(1, value)); this.updateGains(); }
  beginWish(delay: number) {
    this.setup();
    const ctx = this.context!;
    // Prime Web Audio directly in the tap gesture, including when music is paused.
    void ctx.resume().catch(() => {});
    this.endWish();
    const duration = 1.65;
    const buffer = ctx.createBuffer(1, Math.ceil(ctx.sampleRate * duration), ctx.sampleRate);
    const channel = buffer.getChannelData(0); let low = 0;
    for (let i = 0; i < channel.length; i++) { const white = Math.random() * 2 - 1; low = .96 * low + .04 * white; channel[i] = .55 * white + 2.2 * low; }
    const source = ctx.createBufferSource(); source.buffer = buffer;
    const filter = ctx.createBiquadFilter(); filter.type = 'bandpass'; filter.frequency.value = 1150; filter.Q.value = .48;
    const gain = ctx.createGain(); const when = ctx.currentTime + delay;
    gain.gain.setValueAtTime(0, ctx.currentTime);
    gain.gain.setValueAtTime(0, when);
    gain.gain.linearRampToValueAtTime(.32, when + .18);
    gain.gain.linearRampToValueAtTime(.21, when + .75);
    gain.gain.linearRampToValueAtTime(0, when + duration);
    source.connect(filter); filter.connect(gain); gain.connect(ctx.destination);
    source.onended = () => { source.disconnect(); filter.disconnect(); gain.disconnect(); if (this.breath === source) this.breath = undefined; };
    this.breath = source; source.start(when); source.stop(when + duration);
  }
  endWish() { this.breath?.stop(); this.breath = undefined; this.atmosphere(1); }
  private updateGains(immediate = false) {
    if (!this.context) return;
    const master = this.level * this.ambience * (this.ducked ? .12 : 1);
    const values = [Math.cos(this.blend * Math.PI / 2), Math.sin(this.blend * Math.PI / 2)];
    this.gains.forEach((gain, i) => {
      const value = values[i] < 1e-6 ? 0 : values[i] * master;
      if (immediate) gain.gain.value = value;
      else gain.gain.setTargetAtTime(value, this.context!.currentTime, .35);
    });
  }
  async stop() { this.generation++; this.tracks.forEach(audio => audio.pause()); await this.context?.suspend(); }
  dispose() {
    this.endWish(); this.disposed = true; this.generation++;
    this.tracks.forEach(audio => { audio.pause(); audio.removeAttribute('src'); audio.load(); });
    this.sources.forEach(source => source.disconnect()); this.gains.forEach(gain => gain.disconnect());
    void this.context?.close();
  }
}
