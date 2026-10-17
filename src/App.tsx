import { Component, lazy, Suspense, useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { ArrowDown, ArrowLeft, ArrowRight, Check, CircleHelp, Compass, Flame, Heart, Image as ImageIcon, KeyRound, LayoutGrid, LockKeyhole, LogOut, Maximize2, Play, ShieldCheck, Volume2, VolumeX, X } from 'lucide-react';
import { backend, loadExhibition } from './backend';
import { sample, type Exhibition, type Memory } from './content';
import { MuseumMusic } from './music';
import { usePrivateMedia } from './media';
import { ROOM1 } from './rooms/room1Config';
import { chapterAt, chapterPresentation } from './rooms/layout';
import Joystick from './controls/MovementJoystick';
import { INITIAL_POSE, type CameraPose } from './controls/movement';
import { NEUTRAL, type StickVector } from './controls/joystick';

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
    <div className="memory-description"><span className="eyebrow">{memory.date}</span><h2>{memory.title}</h2><p>{memory.caption}</p>{!memory.path && <span className="sample-note">ยังไม่ได้เพิ่ม{memory.kind === 'video' ? 'วิดีโอ' : 'รูปภาพ'}</span>}</div>
  </Dialog>;
}
function AlbumCard({ memory, number, onClick }: { memory: Memory; number: number; onClick: () => void }) {
  const { url } = usePrivateMedia(memory.kind === 'photo' ? memory.path : memory.posterPath);
  return <button className="album-card" onClick={onClick}><div className="album-art">{url ? <img src={url} alt={memory.title} /> : <><span>{String(number).padStart(2, '0')}</span><small>{memory.kind === 'video' ? 'A MOMENT IN MOTION' : 'A PLACE FOR OUR MEMORY'}</small></>}{memory.kind === 'video' && <Play className="album-play" />}</div><div className="album-caption"><span>{memory.title}</span><Maximize2 size={16} /></div></button>;
}
export default function App() {
  const [content, setContent] = useState<Exhibition>(sample);
  const [stage, setStage] = useState<'login' | 'birthday' | 'museum'>('login');
  const [demo, setDemo] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [signedIn, setSignedIn] = useState(false);
  const [code, setCode] = useState('');
  const [chapter, setChapter] = useState(0);
  const [lookReset, setLookReset] = useState(0);
  const cameraPose = useRef<CameraPose>({ ...INITIAL_POSE });
  const joystick = useRef<StickVector>({ ...NEUTRAL });
  const [album, setAlbum] = useState(false);
  const [failed3D, setFailed3D] = useState(false);
  const [sceneVersion, setSceneVersion] = useState(0);
  const [sceneError, setSceneError] = useState('');
  const wants3D = useRef(true);
  const Gallery = useMemo(() => lazy(() => import('./Gallery')), [sceneVersion]);
  const handleSceneError = useCallback((reason?: string) => {
    if (!wants3D.current) return;
    setSceneError(reason || 'WebGL context unavailable'); setFailed3D(true); joystick.current = { ...NEUTRAL };
  }, []);
  const [memory, setMemory] = useState<Memory | null>(null);
  const [help, setHelp] = useState(false);

  const [candleOut, setCandleOut] = useState(false);
  const [musicOn, setMusicOn] = useState(false);
  const [audioError, setAudioError] = useState('');
  const [volume, setVolume] = useState(18);
  const [hidden, setHidden] = useState(document.hidden);
  const [reduced, setReduced] = useState(window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  const music = useRef<MuseumMusic | null>(null);
  const demoRef = useRef(false);
  const epoch = useRef(0);
  const goChapter = (i: number) => { if (album || failed3D) setChapter(Math.max(0, Math.min(1, i))); };
  const clear = () => {
    epoch.current++; setStage('login'); setContent(sample); setMemory(null);  setHelp(false); joystick.current = { ...NEUTRAL }; setDemo(false); demoRef.current = false; setSignedIn(false); setCode(''); setCandleOut(false); setChapter(0); cameraPose.current = { ...INITIAL_POSE }; joystick.current = { ...NEUTRAL }; setMusicOn(false); void music.current?.stop();
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
  useEffect(() => {
    if (!backend) return;
    let active = true;
    let scheduled: ReturnType<typeof setTimeout> | undefined;
    const authenticate = async () => {
      if (demoRef.current) return;
      const attempt = ++epoch.current;
      setBusy(true); setError('');
      try {
        const exhibition = await loadExhibition();
        if (active && attempt === epoch.current) { setContent(exhibition); setStage(s => s === 'museum' ? s : 'birthday'); }
      } catch (e) {
        if (active && attempt === epoch.current) { setContent(sample); setStage('login'); setMemory(null);  setMusicOn(false); joystick.current = { ...NEUTRAL }; setError(e instanceof Error ? e.message : 'เข้าสู่ระบบไม่สำเร็จ'); }
      } finally { if (active && attempt === epoch.current) setBusy(false); }
    };
    const { data: { subscription } } = backend.auth.onAuthStateChange((event, session) => {
      if (!active || demoRef.current) return;
      setSignedIn(!!session);
      if (!session) { clear(); setBusy(false); return; }
      if (event === 'INITIAL_SESSION' || event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        // Defer Supabase requests outside the auth callback to avoid holding its internal lock.
        if (scheduled) clearTimeout(scheduled);
        scheduled = setTimeout(() => void authenticate(), 0);
      }
    });
    const interval = setInterval(() => { if (!document.hidden && !demoRef.current) void backend!.auth.getSession().then(({ data }) => { if (data.session) void authenticate(); }); }, 60000);
    return () => { active = false; epoch.current++; subscription.unsubscribe(); clearInterval(interval); if (scheduled) clearTimeout(scheduled); };
  }, []);
  async function login() {
    setError('');
    if (!backend) { setError('พิพิธภัณฑ์ยังไม่เปิดให้เข้าชม เจ้าของกำลังเตรียมการต้อนรับอยู่'); return; }
    setBusy(true);
    try {
      const { error: err } = await backend.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: `${window.location.origin}${import.meta.env.BASE_URL}`, queryParams: { prompt: 'select_account' } } });
      if (err) throw err;
    } catch { setError('เข้าสู่ระบบไม่สำเร็จ กรุณาลองใหม่อีกครั้ง'); setBusy(false); }
  }
  function enter() {
    if (code !== content.birthday) { setError('ลองอีกครั้งนะ วันที่พิเศษของเธอ ✧'); return; }
    setError(''); setStage('museum'); setChapter(0); cameraPose.current = { ...INITIAL_POSE }; joystick.current = { ...NEUTRAL };
    setAudioError('');
    void music.current?.start().then(() => setMusicOn(true)).catch(e => {
      setMusicOn(false);
      setAudioError(e instanceof Error ? e.message : 'เปิดเสียงไม่ได้ กรุณากดปุ่มเปิดเพลงอีกครั้ง');
    });
  }
  const toggleMusic = () => { setAudioError(''); if (musicOn) { void music.current?.stop(); setMusicOn(false); } else { void music.current?.start().then(() => setMusicOn(true)).catch(e => setAudioError(e instanceof Error ? e.message : 'เปิดเสียงไม่ได้')); } };
  const logout = async () => { clear(); if (backend) await backend.auth.signOut({ scope: 'local' }); };
  const current = chapterPresentation(content.chapters[chapter], chapter);
  const entered = stage === 'museum';
  const showAlbum = album || failed3D;
  const toggleView = () => {
    joystick.current = { ...NEUTRAL };
    if (showAlbum) {
      wants3D.current = true;
      setSceneError('');
      setChapter(chapterAt(cameraPose.current.z));
      setSceneVersion(n => n + 1);
      setFailed3D(false);
      setAlbum(false);
    } else { wants3D.current = false; setAlbum(true); }
  };
  const paused = !!memory || help || hidden || showAlbum;
  const onPlaying = useRef((playing: boolean) => music.current?.duck(playing)).current;

  return <main data-scene-error={localPreview ? sceneError : undefined} className={`app ${entered ? 'entered' : 'at-door'} ${showAlbum && entered ? 'album-mode' : ''}`}>
    {entered && !showAlbum && <div className="scene" aria-label="พิพิธภัณฑ์สามมิติ"><SceneBoundary key={sceneVersion} onError={handleSceneError}><Suspense fallback={<div className="scene-loading"><span className="loading-ring" />กำลังเปิดไฟในพิพิธภัณฑ์…</div>}><Gallery content={content} entered={entered} chapter={chapter} pose={cameraPose} stick={joystick} paused={paused} reduced={reduced} candleOut={candleOut} lookReset={lookReset} onChapter={setChapter} onAudioMix={mix => music.current?.setMix(mix)} onMemory={setMemory} onError={handleSceneError} /></Suspense></SceneBoundary></div>}
    <div className="scene-shade" />
    <header className="topbar"><a className="brand" href="#" onClick={e => { e.preventDefault(); if (entered) goChapter(0); }}><Monogram /><span>THE MUSEUM <i>of</i> US</span></a><div className="top-actions">{demo && <span className="preview-badge">ตัวอย่าง · ไม่มีข้อมูลจริง</span>}<span className="private-label"><LockKeyhole size={13} /> A PRIVATE EXHIBITION</span>{entered && <button className="icon-button" onClick={() => void logout()} aria-label="ออกจากระบบ"><LogOut size={18} /></button>}</div></header>
    {!entered ? <>
      <section className="entrance">
        <div className="eyebrow entrance-eyebrow"><span /> MADE FOR ONE VERY SPECIAL PERSON</div>
        <h1>A little museum.<br />A lot of <em>us.</em></h1>
        <p className="entrance-thai">ทุกความทรงจำ<br />พาเธอกลับบ้าน</p>
        <p className="entrance-description">เรื่องราวเล็ก ๆ ของเรา ในสถานที่ที่เก็บไว้ให้เธอ<br />สุขสันต์วันเกิด และยินดีต้อนรับกลับมานะ</p>
        <div className="entry-panel">
          <div className="entry-heading">{stage === 'birthday' ? <KeyRound size={19} /> : <LockKeyhole size={19} />}<span>{stage === 'birthday' ? 'กุญแจคือวันพิเศษของเธอ' : 'นิทรรศการนี้ มีไว้ให้เธอคนเดียว'}</span></div>
          {stage === 'birthday' ? <form onSubmit={e => { e.preventDefault(); enter(); }}>
            <label htmlFor="birthday">วันเกิดของเธอ <span>(วัน / เดือน / ปี ค.ศ.)</span></label>
            <input id="birthday" type="password" inputMode="numeric" autoComplete="off" placeholder="DDMMYYYY" value={code} maxLength={8} onChange={e => { setCode(e.target.value.replace(/\D/g, '')); setError(''); }} aria-describedby="birthday-hint" autoFocus />
            <p id="birthday-hint" className="field-hint">{demo ? 'รหัสตัวอย่าง 01012000' : 'เลข 8 หลัก ที่เป็นจุดเริ่มต้นของคนโปรด'}</p>
            <button className="primary-button" type="submit" disabled={code.length !== 8}>เปิดประตูความทรงจำ <ArrowRight size={18} /></button>
          </form> : <><button className="primary-button" onClick={() => void login()} disabled={busy}><ShieldCheck size={18} />{busy ? 'กำลังตรวจสอบสิทธิ์…' : 'เข้าสู่ระบบด้วย Google'}<ArrowRight size={18} /></button><p className="entry-fineprint">เฉพาะบัญชีที่ได้รับเชิญเท่านั้น</p></>}
          {error && <p className="error" role="alert">{error}</p>}
          {signedIn && stage === 'login' && <button className="text-button" onClick={() => void logout()}>ออกจากระบบเพื่อเปลี่ยนบัญชี</button>}
          {localPreview && stage === 'login' && <button className="preview-link" onClick={() => { epoch.current++; demoRef.current = true; setDemo(true); setContent(sample); setStage('birthday'); setBusy(false); setError(''); }}>ชมเวอร์ชันตัวอย่าง <ArrowRight size={14} /></button>}
          {stage === 'birthday' && <button className="text-button back-login" onClick={() => void logout()}><ArrowLeft size={14} /> กลับหน้าเข้าสู่ระบบ</button>}
        </div>
      </section>
      <aside className="entrance-caption"><span className="caption-line" /><span>01 — 02</span><p>Some places hold art.<br /><em>This one holds us.</em></p></aside>
      <footer className="entrance-footer"><span>HAPPY BIRTHDAY & WELCOME HOME</span><span><Heart size={13} /> WITH LOVE, ALWAYS.</span></footer>
    </> : <>
      {showAlbum ? <section className="album"><span className="eyebrow">CHAPTER {String(chapter + 1).padStart(2, '0')} / 02</span><h1 className="serif">{current.english}</h1><p>{current.subtitle}</p>{failed3D && <p className="sample-note" data-scene-error={localPreview ? sceneError : undefined}>ฉาก 3D หยุดทำงานชั่วคราว กด “ลองเปิด 3D อีกครั้ง” เพื่อกลับเข้าห้องได้</p>}<div className="album-grid">{current.memories.map((m, i) => <AlbumCard key={m.id} memory={m} number={chapter * 2 + i + 1} onClick={() => setMemory(m)} />)}</div></section> : <section className="chapter-heading"><span className="eyebrow">CHAPTER {String(chapter + 1).padStart(2, '0')} / 02</span><h1 className="serif">{current.english}</h1><p>{current.subtitle}</p></section>}
      {chapter === 1 && <section className={`finale birthday-controls ${showAlbum ? 'finale-album' : ''}`}><span className="eyebrow">YOU ARE MY FAVOURITE CHAPTER</span><h2>Happy birthday,<br /><em>my love.</em></h2><p>{candleOut ? 'ขอให้ทุกคำอธิษฐานของเธอเป็นจริง' : 'หลับตา อธิษฐาน แล้วเป่าเทียนด้วยกันนะ'}</p><button className="primary-button" disabled={candleOut} onClick={() => setCandleOut(true)}>{candleOut ? <><Heart size={18} /> ขอให้คำอธิษฐานเป็นจริง</> : <><Flame size={18} /> อธิษฐานและเป่าเทียน</>}</button>{candleOut && <span className="wish-note"><Heart size={15} /> Welcome home. You were always worth the wait.</span>}</section>}
      {!showAlbum && chapter === 0 && <aside className="room1-intro"><p>{ROOM1.intro}</p></aside>}
      {!showAlbum && chapter === 0 && <details className="memory-tray"><summary><span className="eyebrow">EXPLORE THE MEMORIES</span><span>ความทรงจำในห้องนี้</span></summary>{current.memories.map((m, i) => <button key={m.id} onClick={() => setMemory(m)}><span className="memory-index">{String(i + 1).padStart(2, '0')}</span><span>{m.title}</span>{m.kind === 'video' ? <Play size={15} /> : <Maximize2 size={15} />}</button>)}<small className="sample-art-note">ภาพทิวทัศน์ตัวอย่าง · รอใส่รูปของเรา</small></details>}
      <div className="viewer-tools"><button className={`tool-button ${showAlbum ? 'active' : ''}`} onClick={toggleView}><LayoutGrid size={17} /><span>{failed3D ? 'ลองเปิด 3D อีกครั้ง' : showAlbum ? 'กลับห้อง 3D' : 'ดูแบบอัลบั้ม'}</span></button>{!showAlbum && <button className="icon-button" onClick={() => setLookReset(v => v + 1)} aria-label="มองตรงไปยังปลายพิพิธภัณฑ์" title="มองตรงไปยังปลายพิพิธภัณฑ์"><Compass size={18} /></button>}<button className="icon-button" onClick={() => setHelp(true)} aria-label="วิธีเดินชม"><CircleHelp size={19} /></button></div>
      {audioError && <p className="audio-error" role="alert">{audioError}</p>}
      <div className="bottom-bar"><div className="sound-control"><button className="icon-button" onClick={toggleMusic} aria-label={musicOn ? 'ปิดเพลง' : 'เปิดเพลง'}>{musicOn ? <Volume2 size={19} /> : <VolumeX size={19} />}</button><div><span className="sound-title">{chapter === 0 ? 'You & I' : 'About You'}</span><span className="sound-subtitle">{musicOn ? 'ROOM SOUNDTRACK' : 'MUSIC IS PAUSED'}</span></div><input type="range" min="0" max="60" value={volume} onChange={e => setVolume(Number(e.target.value))} aria-label="ความดังเพลง" /></div><nav className="chapter-navigation" aria-label="ห้องที่กำลังชม">{content.chapters.slice(0, 2).map((c, i) => showAlbum ? <button key={i} className={`chapter-dot ${i === chapter ? 'selected' : ''}`} aria-current={i === chapter ? 'step' : undefined} aria-label={`ดูอัลบั้มห้อง ${i + 1} ${chapterPresentation(c, i).title}`} onClick={() => goChapter(i)}>{String(i + 1).padStart(2, '0')}</button> : <span key={i} className={`chapter-dot ${i === chapter ? 'selected' : ''}`} aria-current={i === chapter ? 'step' : undefined} aria-label={chapterPresentation(c, i).title}>{String(i + 1).padStart(2, '0')}</span>)}</nav><span className="movement-note">เดินด้วยจอยเท่านั้น</span></div>
      {!showAlbum && <div className="walk-hint"><ArrowDown size={13} /><span>ลากบนฉากเพื่อมองรอบ ๆ · ใช้จอยเพื่อเดิน</span></div>}
    </>}
    {entered && !showAlbum && <Joystick disabled={paused} onChange={value => { joystick.current = value; }} />}
    {memory && <MemoryDetail memory={memory} onClose={() => setMemory(null)} onPlaying={onPlaying} />}
    {help && <Dialog title="วิธีเดินชม" onClose={() => setHelp(false)}><div className="help-content"><span className="eyebrow">TAKE YOUR TIME</span><h2>เดินช้า ๆ ก็ได้นะ</h2><p>ที่นี่ไม่มีเวลาปิด ทุกความทรงจำรอเธออยู่</p><dl><dt>มองรอบห้อง</dt><dd>ลากเมาส์หรือลากนิ้วบนฉาก</dd><dt>เดินไปข้างหน้า</dt><dd>ลากจอยขึ้นเพื่อเดินหน้า ลากลงเพื่อถอยหลัง ลากซ้าย–ขวาเพื่อเดินด้านข้าง ปล่อยเพื่อหยุด</dd><dt>ดูความทรงจำ</dt><dd>แตะกรอบรูป หรือชื่อรูปทางด้านข้าง</dd><dt>ไปห้องถัดไป</dt><dd>ใช้จอยเดินผ่านประตู หมายเลขด้านล่างบอกห้องที่กำลังอยู่</dd><dt>นั่งดูสบาย ๆ</dt><dd>เลือกดูแบบอัลบั้ม แล้วกดกลับห้อง 3D เพื่อกลับมาที่เดิม</dd></dl><button className="primary-button" onClick={() => setHelp(false)}>พร้อมแล้ว <Check size={18} /></button></div></Dialog>}
  </main>;
}
