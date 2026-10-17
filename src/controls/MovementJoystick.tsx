import { useCallback, useEffect, useRef, useState, type PointerEvent } from 'react';
import { ChevronDown, ChevronLeft, ChevronRight, ChevronUp } from 'lucide-react';
import { JoystickController, NEUTRAL, type StickVector } from './joystick';

export default function Joystick({ disabled, onChange }: { disabled: boolean; onChange: (value: StickVector) => void }) {
  const controller = useRef(new JoystickController());
  const notify = useRef(onChange); notify.current = onChange;
  const [knob, setKnob] = useState<StickVector>({ ...NEUTRAL });
  const commit = useCallback(() => { const value = { ...controller.current.vector }; setKnob(value); notify.current(value); }, []);
  const reset = useCallback(() => { controller.current.reset(); commit(); }, [commit]);
  useEffect(() => { if (disabled) reset(); }, [disabled, reset]);
  useEffect(() => {
    const visibility = () => { if (document.hidden) reset(); };
    window.addEventListener('blur', reset);
    document.addEventListener('visibilitychange', visibility);
    return () => {
      window.removeEventListener('blur', reset); document.removeEventListener('visibilitychange', visibility);
      controller.current.reset(); notify.current({ ...NEUTRAL });
    };
  }, [reset]);
  const down = (event: PointerEvent<HTMLDivElement>) => {
    if (disabled || (event.pointerType === 'mouse' && event.button !== 0)) return;
    event.preventDefault(); event.stopPropagation();
    const rect = event.currentTarget.getBoundingClientRect();
    if (!controller.current.begin(event.pointerId, event.clientX, event.clientY, rect.x + rect.width / 2, rect.y + rect.height / 2, rect.width * .29)) return;
    event.currentTarget.setPointerCapture(event.pointerId); commit();
  };
  const move = (event: PointerEvent<HTMLDivElement>) => {
    if (disabled) return;
    if (controller.current.move(event.pointerId, event.clientX, event.clientY)) { event.preventDefault(); commit(); }
  };
  const end = (event: PointerEvent<HTMLDivElement>) => { if (controller.current.end(event.pointerId)) commit(); };
  return <div className={`joystick-controls ${disabled ? 'is-disabled' : ''}`}>
    <span className="joystick-label">กดค้างแล้วลากเพื่อเดิน</span>
    <div className="joystick-base" role="group" aria-label="จอยเดิน: ลากขึ้นเดินหน้า ลากลงถอยหลัง ลากซ้ายขวาเดินด้านข้าง" aria-disabled={disabled} data-testid="movement-joystick" data-stick-x={knob.x.toFixed(3)} data-stick-y={knob.y.toFixed(3)} onPointerDown={down} onPointerMove={move} onPointerUp={end} onPointerCancel={end} onLostPointerCapture={end}>
      <ChevronUp className="stick-north" aria-hidden="true" /><ChevronDown className="stick-south" aria-hidden="true" /><ChevronLeft className="stick-west" aria-hidden="true" /><ChevronRight className="stick-east" aria-hidden="true" />
      <span className="joystick-knob" style={{ transform: `translate(${knob.x * 40}px, ${-knob.y * 40}px)` }} />
    </div>
    <span className="joystick-description">ปล่อยจอยเพื่อหยุด</span>
  </div>;
}
