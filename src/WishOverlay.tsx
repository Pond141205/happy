import { useEffect, useState } from 'react';
import { wishFrame } from './wishRitual';
export default function WishRitual({ reduced, onFrame, onBlow, onComplete }: { reduced: boolean; onFrame: (gain: number) => void; onBlow: () => void; onComplete: () => void }) {
  const [elapsed, setElapsed] = useState(0);
  useEffect(() => {
    const start = performance.now(); let blew = false;
    const timer = window.setInterval(() => {
      const t = (performance.now() - start) / 1000; const frame = wishFrame(t, reduced);
      setElapsed(t); onFrame(frame.music);
      if (frame.blow && !blew) { blew = true; onBlow(); }
      if (frame.finished) { clearInterval(timer); onComplete(); }
    }, 50);
    return () => { clearInterval(timer); onFrame(1); };
  }, [reduced, onFrame, onBlow, onComplete]);
  const frame = wishFrame(elapsed, reduced);
  return <div className="wish-ritual" role="status" aria-label="หลับตา อธิษฐาน แล้วเป่าเทียน" aria-live="polite">
    <div className="wish-eyelid wish-eyelid-top" style={reduced ? { transform: "none", opacity: frame.closed } : { transform: `translateY(${(frame.closed - 1) * 100}%)` }} />
    <div className="wish-eyelid wish-eyelid-bottom" style={reduced ? { transform: "none", opacity: frame.closed } : { transform: `translateY(${(1 - frame.closed) * 100}%)` }} />
    <div className={`wish-words ${frame.wish ? 'visible' : ''}`}><span>Make a wish</span><p>ขอให้คำอธิษฐานของเทอเป็นจริง</p></div>
  </div>;
}
