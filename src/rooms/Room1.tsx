import type { ReactNode } from 'react';
import GalleryShell from './GalleryShell';
export default function Room1({ children }: { children: ReactNode }) {
  return <group name="room-1-memory-gallery"><GalleryShell>{children}</GalleryShell></group>;
}
