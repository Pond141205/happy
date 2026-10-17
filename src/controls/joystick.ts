export type StickVector = { x: number; y: number };
export const NEUTRAL: StickVector = { x: 0, y: 0 };
export const STICK_DEAD_ZONE = .12;

/** Screen up is positive forward; the output always stays inside the unit circle. */
export function joystickVector(x: number, y: number, centerX: number, centerY: number, radius: number): StickVector {
  if (![x, y, centerX, centerY, radius].every(Number.isFinite) || radius <= 0) return { ...NEUTRAL };
  const dx = (x - centerX) / radius, dy = (centerY - y) / radius;
  const length = Math.hypot(dx, dy);
  if (length <= STICK_DEAD_ZONE) return { ...NEUTRAL };
  const strength = (Math.min(1, length) - STICK_DEAD_ZONE) / (1 - STICK_DEAD_ZONE);
  return { x: dx / length * strength, y: dy / length * strength };
}

/** Owns a single pointer so a second finger can look around without stealing the stick. */
export class JoystickController {
  vector: StickVector = { ...NEUTRAL };
  pointerId: number | null = null;
  private bounds = { x: 0, y: 0, radius: 1 };
  begin(id: number, x: number, y: number, centerX: number, centerY: number, radius: number) {
    if (this.pointerId !== null) return false;
    this.pointerId = id;
    this.bounds = { x: centerX, y: centerY, radius };
    this.move(id, x, y);
    return true;
  }
  move(id: number, x: number, y: number) {
    if (id !== this.pointerId) return false;
    this.vector = joystickVector(x, y, this.bounds.x, this.bounds.y, this.bounds.radius);
    return true;
  }
  end(id: number) {
    if (id !== this.pointerId) return false;
    this.reset();
    return true;
  }
  reset() { this.pointerId = null; this.vector = { ...NEUTRAL }; }
}
