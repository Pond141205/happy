import { constrainPosition, type Point } from '../rooms/navigation';
import type { StickVector } from './joystick';
export type CameraPose = Point & { yaw: number; pitch: number };
export const WALK_SPEED = 1.65;
export const INITIAL_POSE: CameraPose = { x: 0, z: 54.4, yaw: 0, pitch: -.055 };

/** Only a nonzero joystick input can change horizontal camera position. */
export function stepMovement(position: Point, stick: StickVector, yaw: number, delta: number, enabled: boolean): Point {
  if (!enabled || ![position.x, position.z, stick.x, stick.y, yaw, delta].every(Number.isFinite) || delta <= 0) return { ...position };
  const magnitude = Math.hypot(stick.x, stick.y);
  if (magnitude < 1e-6) return { ...position };
  const divisor = Math.max(1, magnitude), x = stick.x / divisor, forward = stick.y / divisor;
  const distance = WALK_SPEED * Math.min(delta, .05);
  const dx = (-Math.sin(yaw) * forward + Math.cos(yaw) * x) * distance;
  const dz = (-Math.cos(yaw) * forward - Math.sin(yaw) * x) * distance;
  const steps = Math.max(1, Math.ceil(Math.hypot(dx, dz) / .025));
  let next = { ...position };
  for (let i = 0; i < steps; i++) next = constrainPosition({ x: next.x + dx / steps, z: next.z + dz / steps }, next);
  return next;
}
