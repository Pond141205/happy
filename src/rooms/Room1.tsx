import type { ReactNode } from 'react';
import GalleryShell from './GalleryShell';
import BatchBoxes from './BatchBoxes';
import { ROOM1 } from './room1Config';
export default function Room1({ children }: { children: ReactNode }) {
  return <BatchBoxes name="room-1-memory-gallery"><group position={[0, 0, ROOM1.centerZ]}><GalleryShell length={ROOM1.length} /></group>{children}</BatchBoxes>;
}
