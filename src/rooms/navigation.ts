import { BIRTHDAY, PASSAGES } from './layout';
export type Point = { x: number; z: number };
export function constrainPosition(point: Point, previous?: Point): Point {
  const result = { x: Math.max(-4.25, Math.min(4.25, point.x)), z: Math.max(-26.5, Math.min(7, point.z)) };
  for (const middle of PASSAGES) {
    if (result.z < middle + 2.5 && result.z > middle - 2.5 && Math.abs(result.x) > 1.02) {
      if (previous && Math.abs(previous.z - middle) < 2.5) result.x = Math.sign(result.x) * 1.02;
      else result.z = (previous?.z ?? point.z) > middle ? middle + 2.5 : middle - 2.5;
    }
  }
  const dz = result.z - BIRTHDAY.centerZ;
  const radius = Math.hypot(result.x, dz);
  if (radius < BIRTHDAY.obstacleRadius) {
    if (radius < 0.001) { result.x = 0; result.z = BIRTHDAY.centerZ + BIRTHDAY.obstacleRadius; }
    else { result.x *= BIRTHDAY.obstacleRadius / radius; result.z = BIRTHDAY.centerZ + dz * BIRTHDAY.obstacleRadius / radius; }
  }
  return result;
}
