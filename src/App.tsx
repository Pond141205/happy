import { Component, lazy, Suspense, useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore, type ReactNode } from 'react';
import { ArrowDown, ArrowRight, Check, CircleHelp, Compass, Flame, Heart, Image as ImageIcon, KeyRound, LayoutGrid, LockKeyhole, LogOut, Maximize2, Play, Volume2, VolumeX, X } from 'lucide-react';
import { unlockExperience, clearPrivateMedia, type PrivateExperience } from './birthdayAccess';
import { sample, type Exhibition, type Memory } from './content';
import { MuseumMusic } from './music';
import { usePrivateMedia } from './media';
import { ROOM1 } from './rooms/room1Config';
import { chapterAt, chapterPresentation } from './rooms/layout';
import Joystick from './controls/MovementJoystick';
import { INITIAL_POSE, type CameraPose } from './controls/movement';
import { NEUTRAL, type StickVector } from './controls/joystick';
import { sceneLoading } from './sceneLoading';
import SceneLoading from './SceneLoadingOverlay';
import WishRitual from './WishOverlay';
import { WISH_BLOW_AT } from './wishRitual';

const localPreview = import.meta.env.DEV;
class SceneBoundary extends Component<{ children: ReactNode; onError: (reason?: string) => void }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  componentDidCatch(error: Error) { console.error('3D scene failed:', error); this.props.onError(error.message); }
  render() { return this.state.failed ? null : this.props.children; }
}
function Monogram() { return <span className="monogram" aria-hidden="true">m<span>u</span></span>; }
function Dialog({ title, children, onClose, className = '' }: { title: string; children: ReactNode; onClose: () => void; className?: string }) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => { const el = ref.current!; el.showModal(); return () => el.close(); }, []);
  return <dialog ref={ref} className={`dialog ${className}`} aria-label={title} onCancel={onClose} onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
    <button className="icon-button close-dialog" onClick={onClose} aria-label="ปิด"><X /></button>{children}
  </dialog>;
}
function MemoryDetail({ memory, onClose, onPlaying }: { memory: Memory; onClose: () => void; onPlaying: (playing: boolean) => void }) {
  const { url, error } = usePrivateMedia(memory.path);
  useEffect(() => () => onPlaying(false), [onPlaying]);
  return <Dialog title={memory.title} onClose={onClose} className="memory-dialog">
    <div className="memory-view">
      {url ? memory.kind === 'video'
        ? <video src={url} controls playsInline preload="metadata" onPlay={() => onPlaying(true)} onPause={() => onPlaying(false)} onEnded={() => onPlaying(false)} onError={() => onPlaying(false)} />
        : <img src={url} alt={memory.title} />
        : <div className="empty-frame"><span className="serif">{memory.kind === 'video' ? 'Play it again.' : 'Remember this?'}</span><span>{error || (memory.path ? 'กำลังเปิดความทรงจำ…' : 'เก็บพื้นที่นี้ไว้ให้ความทรงจำของเรา')}</span>{memory.kind === 'video' ? <Play size={24} /> : <ImageIcon size={24} />}</div>}
    </div>
  </Dialog>;
}
function AlbumCard({ memory, number, onClick }: { memory: Memory; number: number; onClick: () => void }) {
  const path = memory.posterPath || memory.path;
  const preview = import.meta.env.DEV && path?.startsWith('local/gallery/full/') ? path.replace('/full/', '/thumb/') : path;
  const { url } = usePrivateMedia(preview);
  return <button className="album-card" onClick={onClick}><div className="album-art">{url ? <img src={url} alt={memory.title} /> : <><span>{String(number).padStart(2, '0')}</span></>}{memory.kind === 'video' && <Play className="album-play" />}</div></button>;
}
export default function App() {
  const [content, setContent] = useState<Exhibition>(sample);
  const [stage, setStage] = useState<'birthday' | 'museum'>('birthday');
  const demo = localPreview;
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [code, setCode] = useState('');
  const [chapter, setChapter] = useState(0);
  const [lookReset, setLookReset] = useState(0);
  const cameraPose = useRef<CameraPose>({ ...INITIAL_POSE });
  const joystick = useRef<StickVector>({ ...NEUTRAL });
  const [album, setAlbum] = useState(false);
  const [failed3D, setFailed3D] = useState(false);
  const [sceneVersion, setSceneVersion] = useState(0);
  const [loadingId, setLoadingId] = useState(0);
  const loading = useSyncExternalStore(sceneLoading.subscribe, sceneLoading.getSnapshot);
  const sceneReady = loading.id === loadingId && loading.phase === 'ready';
  const [sceneError, setSceneError] = useState('');
  const wants3D = useRef(true);
  const Gallery = useMemo(() => lazy(() => import('./Gallery')), [sceneVersion]);
  const handleSceneError = useCallback((reason?: string) => {
    if (!wants3D.current) return;
    setSceneError(reason || 'WebGL context unavailable'); setFailed3D(true); joystick.current = { ...NEUTRAL };
  }, []);
  const [memory, setMemory] = useState<Memory | null>(null);
  const [help, setHelp] = useState(false);
  const [toolsOpen, setToolsOpen] = useState(false);

  const [candleOut, setCandleOut] = useState(false);
  const [blowing, setBlowing] = useState(false);
  const [messageDialog, setMessageDialog] = useState<'closed' | 'ask' | 'letter'>('closed');
  const [privateExperience, setPrivateExperience] = useState<PrivateExperience | null>(null);

  const [musicOn, setMusicOn] = useState(false);
  const [audioError, setAudioError] = useState('');
  const [volume, setVolume] = useState(18);
  const [hidden, setHidden] = useState(document.hidden);
  const [reduced, setReduced] = useState(window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  const music = useRef<MuseumMusic | null>(null);
  const epoch = useRef(0);
  const ritualGain = useCallback((gain: number) => music.current?.atmosphere(gain), []);
  const ritualBlow = useCallback(() => setCandleOut(true), []);
  const ritualComplete = useCallback(() => { music.current?.endWish(); setBlowing(false); setMessageDialog('ask'); }, []);
  const blowCandles = () => { if (candleOut || blowing) return; joystick.current = { ...NEUTRAL }; setToolsOpen(false); music.current?.beginWish(WISH_BLOW_AT); setBlowing(true); };
  const goChapter = (i: number) => { if (album || failed3D) setChapter(Math.max(0, Math.min(1, i))); };
  const clear = () => {
    music.current?.endWish(); setToolsOpen(false); clearPrivateMedia(); sceneLoading.start(); setAlbum(false); setFailed3D(false); setSceneError(''); setAudioError(''); setBusy(false); wants3D.current = true;
    epoch.current++; setStage('birthday'); setContent(sample); setMemory(null);  setHelp(false); joystick.current = { ...NEUTRAL };  setCode(''); setCandleOut(false); setBlowing(false); setMessageDialog('closed'); setPrivateExperience(null); setChapter(0); cameraPose.current = { ...INITIAL_POSE }; joystick.current = { ...NEUTRAL }; setMusicOn(false); void music.current?.stop();
  };
  useEffect(() => {
    music.current = new MuseumMusic();
    const visibility = () => setHidden(document.hidden);
    const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const motion = () => setReduced(motionQuery.matches);
    document.addEventListener('visibilitychange', visibility); motionQuery.addEventListener('change', motion);
    return () => { music.current?.dispose(); music.current = null; document.removeEventListener('visibilitychange', visibility); motionQuery.removeEventListener('change', motion); };
  }, []);
  useEffect(() => { if (hidden) { void music.current?.stop(); } else if (musicOn) void music.current?.start().catch(() => setMusicOn(false)); }, [hidden, musicOn]);
  useEffect(() => { music.current?.volume(volume / 100); }, [volume]);
  useEffect(() => { if (album || failed3D) music.current?.setChapter(chapter); }, [chapter, album, failed3D]);
  async function enter() {
    if (busy) return;
    const attempt = ++epoch.current;
    setBusy(true); setError('');
    music.current?.volume(0);
    const audioStart = music.current?.start().then(() => true, () => false);
    try { const unlocked = await unlockExperience(code); if (attempt !== epoch.current) return; setPrivateExperience(unlocked); if (unlocked.photos) setContent({ ...sample, chapters: sample.chapters.map((c, i) => i ? c : { ...c, memories: unlocked.photos!.map((p, index) => ({ id: `photo-${index}`, title: `ความทรงจำ ${index + 1}`, caption: '', date: '', kind: 'photo', path: p.path, posterPath: p.thumbnailPath })) }) }); }
    catch (e) { void music.current?.stop(); if (attempt === epoch.current) setError(e instanceof Error ? e.message : 'เปิดประตูไม่สำเร็จ'); return; }
    finally { if (attempt === epoch.current) setBusy(false); }
    if (attempt !== epoch.current) return;
    setLoadingId(sceneLoading.start());
    setError(''); setStage('museum'); setChapter(0); cameraPose.current = { ...INITIAL_POSE }; joystick.current = { ...NEUTRAL };
    setAudioError('');
    void audioStart?.then(ok => { if (attempt !== epoch.current) return; music.current?.volume(volume / 100); setMusicOn(ok); if (!ok) setAudioError('เปิดเสียงไม่ได้ กรุณากดปุ่มเปิดเพลงอีกครั้ง'); });
  }
  const toggleMusic = () => { setAudioError(''); if (musicOn) { void music.current?.stop(); setMusicOn(false); } else { void music.current?.start().then(() => setMusicOn(true)).catch(e => setAudioError(e instanceof Error ? e.message : 'เปิดเสียงไม่ได้')); } };
  const logout = async () => { clear(); };
  const current = chapterPresentation(content.chapters[chapter], chapter);
  const entered = stage === 'museum';
  const showAlbum = album || failed3D;
  const toggleView = () => {
    setToolsOpen(false); joystick.current = { ...NEUTRAL };
    if (showAlbum) {
      setLoadingId(sceneLoading.start());
      wants3D.current = true;
      setSceneError('');
      setChapter(chapterAt(cameraPose.current.z));
      setSceneVersion(n => n + 1);
      setFailed3D(false);
      setAlbum(false);
    } else { wants3D.current = false; setAlbum(true); }
  };
  const paused = blowing || !!memory || help || messageDialog !== 'closed' || hidden || showAlbum || !sceneReady;
  const onPlaying = useRef((playing: boolean) => music.current?.duck(playing)).current;

  return <main data-scene-error={localPreview ? sceneError : undefined} className={`app ${entered ? 'entered' : 'at-door'} ${showAlbum && entered ? 'album-mode' : ''} ${toolsOpen ? 'mobile-tools-open' : ''}`}>
    {entered && !showAlbum && <div className="scene" aria-label="พิพิธภัณฑ์สามมิติ"><SceneBoundary key={sceneVersion} onError={handleSceneError}><Suspense fallback={null}><Gallery content={content} entered={entered} chapter={chapter} pose={cameraPose} stick={joystick} paused={paused} ritualActive={blowing} preparing={!sceneReady} loadingId={loadingId} reduced={reduced} candleOut={candleOut} lookReset={lookReset} onChapter={setChapter} onAudioMix={mix => music.current?.setMix(mix)} onMemory={setMemory} onError={handleSceneError} /></Suspense></SceneBoundary></div>}
    {entered && !showAlbum && !sceneReady && <SceneLoading key={loadingId} state={loading} onAlbum={() => { joystick.current = { ...NEUTRAL }; wants3D.current = false; setAlbum(true); }} />}
    <div className="scene-shade" />
    <header className="topbar"><a className="brand" href="#" onClick={e => { e.preventDefault(); if (entered) goChapter(0); }}><Monogram /><span>THE MUSEUM <i>of</i> US</span></a><div className="top-actions">{demo && <span className="preview-badge">ตัวอย่างในเครื่อง</span>}<span className="private-label"><LockKeyhole size={13} /> A PRIVATE EXHIBITION</span>{entered && <button className="icon-button" onClick={() => void logout()} aria-label="ออกจากระบบ"><LogOut size={18} /></button>}</div></header>
    {!entered ? <>
      <section className="entrance">
        <div className="eyebrow entrance-eyebrow"><span /> MADE FOR ONE VERY SPECIAL PERSON</div>
        <h1>A little museum.<br />A lot of <em>us.</em></h1>
        <div className="entry-panel">
          <div className="entry-heading"><KeyRound size={19} /><span>กุญแจคือวันเกิดของเทอ</span></div>
          <form onSubmit={e => { e.preventDefault(); void enter(); }}>
            <label htmlFor="birthday">วันเกิดของเทอ <span>(วัน / เดือน / ปี)</span></label>
            <input id="birthday" type="password" inputMode="numeric" autoComplete="off" placeholder="DDMMYY" value={code} maxLength={8} disabled={busy} onChange={e => { setCode(e.target.value.replace(/\D/g, '')); setError(''); }} aria-describedby="birthday-hint" autoFocus />
            <p id="birthday-hint" className="field-hint">กรอกรหัสวันเกิด 6 หรือ 8 หลัก</p>
            <button className="primary-button" type="submit" disabled={![6, 8].includes(code.length) || busy}>{busy ? 'กำลังเปิดประตู…' : 'เปิดประตูความทรงจำ'} <ArrowRight size={18} /></button>
          </form>
          {error && <p className="error" role="alert">{error}</p>}
        </div>
      </section>
      <aside className="entrance-caption"><span className="caption-line" /><span>01 — 02</span><p>Some places hold art.<br /><em>This one holds us.</em></p></aside>
      <footer className="entrance-footer"><span>HAPPY BIRTHDAY & WELCOME HOME</span><span><Heart size={13} /> WITH LOVE, ALWAYS.</span></footer>
    </> : <>
      {showAlbum ? <section className="album"><span className="eyebrow">CHAPTER {String(chapter + 1).padStart(2, '0')} / 02</span><h1 className="serif">{current.english}</h1><p>{current.subtitle}</p>{failed3D && <p className="sample-note" data-scene-error={localPreview ? sceneError : undefined}>ฉาก 3D หยุดทำงานชั่วคราว กด “ลองเปิด 3D อีกครั้ง” เพื่อกลับเข้าห้องได้</p>}<div className="album-grid">{current.memories.map((m, i) => <AlbumCard key={m.id} memory={m} number={chapter * 2 + i + 1} onClick={() => setMemory(m)} />)}</div></section> : <section className="chapter-heading"><span className="eyebrow">CHAPTER {String(chapter + 1).padStart(2, '0')} / 02</span><h1 className="serif">{current.english}</h1><p>{current.subtitle}</p></section>}
      {chapter === 1 && <section className={`finale birthday-controls ${showAlbum ? 'finale-album' : ''}`}><span className="eyebrow">YOU ARE MY FAVOURITE CHAPTER</span><h2>Happy birthday,<br /><em>my love.</em></h2><p>{blowing ? 'กำลังเป่าเทียน…' : candleOut ? 'ขอให้ทุกคำอธิษฐานของเทอเป็นจริง' : 'หลับตา อธิษฐาน แล้วเป่าเทียนด้วยกันนะ'}</p><button className="primary-button" disabled={candleOut || blowing} onClick={blowCandles}>{blowing ? <>กำลังเป่าเทียน…</> : candleOut ? <><Heart size={18} /> ขอให้คำอธิษฐานเป็นจริง</> : <><Flame size={18} /> อธิษฐานและเป่าเทียน</>}</button>{candleOut && !blowing && <button className="text-button last-message-trigger" onClick={() => setMessageDialog('ask')}>Just one thing</button>}{candleOut && !blowing && <span className="wish-note"><Heart size={15} /> Welcome home. You were always worth the wait.</span>}</section>}
      {!showAlbum && chapter === 0 && <aside className="room1-intro"><p>{ROOM1.intro}</p></aside>}
      {!showAlbum && chapter === 0 && <details className="memory-tray"><summary><span className="eyebrow">EXPLORE THE MEMORIES</span><span>ความทรงจำในห้องนี้</span></summary>{current.memories.map((m, i) => <button key={m.id} onClick={() => setMemory(m)}><span className="memory-index">{String(i + 1).padStart(2, '0')}</span>{m.kind === 'video' ? <Play size={15} /> : <Maximize2 size={15} />}</button>)}<small className="sample-art-note">32 ภาพความทรงจำ · กดที่กรอบเพื่อดูรูปเต็ม</small></details>}
      <button className="mobile-menu-toggle icon-button" aria-label="เมนู" aria-expanded={toolsOpen} onClick={() => setToolsOpen(v => !v)}>•••</button>
      <div className="viewer-tools"><button className="tool-button mobile-exit" onClick={() => void logout()}>ออกจากห้อง</button><button className={`tool-button ${showAlbum ? 'active' : ''}`} onClick={toggleView}><LayoutGrid size={17} /><span>{failed3D ? 'ลองเปิด 3D อีกครั้ง' : showAlbum ? 'กลับห้อง 3D' : 'ดูแบบอัลบั้ม'}</span></button>{!showAlbum && <button className="icon-button" onClick={() => setLookReset(v => v + 1)} aria-label="มองตรงไปยังปลายพิพิธภัณฑ์" title="มองตรงไปยังปลายพิพิธภัณฑ์"><Compass size={18} /></button>}<button className="icon-button" onClick={() => setHelp(true)} aria-label="วิธีเดินชม"><CircleHelp size={19} /></button></div>
      {audioError && <p className="audio-error" role="alert">{audioError}</p>}
      <div className="bottom-bar"><div className="sound-control"><button className="icon-button" onClick={toggleMusic} aria-label={musicOn ? 'ปิดเพลง' : 'เปิดเพลง'}>{musicOn ? <Volume2 size={19} /> : <VolumeX size={19} />}</button><div><span className="sound-title">{chapter === 0 ? 'You & I' : 'About You'}</span><span className="sound-subtitle">{musicOn ? 'ROOM SOUNDTRACK' : 'MUSIC IS PAUSED'}</span></div><input type="range" min="0" max="60" value={volume} onChange={e => setVolume(Number(e.target.value))} aria-label="ความดังเพลง" /></div><nav className="chapter-navigation" aria-label="ห้องที่กำลังชม">{content.chapters.slice(0, 2).map((c, i) => showAlbum ? <button key={i} className={`chapter-dot ${i === chapter ? 'selected' : ''}`} aria-current={i === chapter ? 'step' : undefined} aria-label={`ดูอัลบั้มห้อง ${i + 1} ${chapterPresentation(c, i).title}`} onClick={() => goChapter(i)}>{String(i + 1).padStart(2, '0')}</button> : <span key={i} className={`chapter-dot ${i === chapter ? 'selected' : ''}`} aria-current={i === chapter ? 'step' : undefined} aria-label={chapterPresentation(c, i).title}>{String(i + 1).padStart(2, '0')}</span>)}</nav><span className="movement-note">เดินด้วยจอยเท่านั้น</span></div>
      {!showAlbum && <div className="walk-hint"><ArrowDown size={13} /><span>ลากบนฉากเพื่อมองรอบ ๆ · ใช้จอยเพื่อเดิน</span></div>}
    </>}
    {entered && !showAlbum && <Joystick disabled={paused} onChange={value => { joystick.current = value; }} />}
    {memory && <MemoryDetail memory={memory} onClose={() => setMemory(null)} onPlaying={onPlaying} />}
    {blowing && <WishRitual reduced={reduced} onFrame={ritualGain} onBlow={ritualBlow} onComplete={ritualComplete} />}
    {messageDialog === 'ask' && <Dialog title="Just one thing" onClose={() => setMessageDialog('closed')} className="last-message-dialog"><div className="message-invitation"><h2>Just one thing</h2><p>มีข้อความสุดท้ายถึงเทอ อยากเปิดอ่านไหม?</p><button className="primary-button" onClick={() => setMessageDialog('letter')}>เปิดอ่านข้อความ <ArrowRight size={18} /></button><button className="text-button" onClick={() => setMessageDialog('closed')}>ยังไม่เปิด</button></div></Dialog>}
    {messageDialog === 'letter' && <Dialog title="Just one thing" onClose={() => setMessageDialog('closed')} className="last-message-dialog"><article className="last-message-letter"><h2>Just one thing</h2>{privateExperience?.message.split(/\n\s*\n/).map((paragraph, i) => <p key={i}>{paragraph}</p>)}</article></Dialog>}
    {help && <Dialog title="วิธีเดินชม" onClose={() => setHelp(false)}><div className="help-content"><span className="eyebrow">TAKE YOUR TIME</span><h2>เดินช้า ๆ ก็ได้นะ</h2><p>ที่นี่ไม่มีเวลาปิด ทุกความทรงจำรอเทออยู่</p><dl><dt>มองรอบห้อง</dt><dd>ลากเมาส์หรือลากนิ้วบนฉาก</dd><dt>เดินไปข้างหน้า</dt><dd>ลากจอยขึ้นเพื่อเดินหน้า ลากลงเพื่อถอยหลัง ลากซ้าย–ขวาเพื่อเดินด้านข้าง ปล่อยเพื่อหยุด</dd><dt>ดูความทรงจำ</dt><dd>แตะกรอบรูป หรือชื่อรูปทางด้านข้าง</dd><dt>ไปห้องถัดไป</dt><dd>ใช้จอยเดินผ่านประตู หมายเลขด้านล่างบอกห้องที่กำลังอยู่</dd><dt>นั่งดูสบาย ๆ</dt><dd>เลือกดูแบบอัลบั้ม แล้วกดกลับห้อง 3D เพื่อกลับมาที่เดิม</dd></dl><button className="primary-button" onClick={() => setHelp(false)}>พร้อมแล้ว <Check size={18} /></button></div></Dialog>}
  </main>;
}
