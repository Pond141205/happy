import type { Chapter } from '../content';
export const ROOM_CENTERS = [0, -20] as const;
export const CHAPTER_STOPS = ROOM_CENTERS.map(z => z + 6.4);
export const BIRTHDAY = { centerZ: -20, meadowRadius: 1.72, obstacleRadius: 1.9 };
export const PASSAGES = [-10];
export function chapterAt(z: number) { return Math.max(0, Math.min(1, Math.floor((8 - z) / 20))); }
export function chapterPresentation(chapter: Chapter, index: number): Chapter {
  if (index === 0) return { ...chapter, title: 'ห้องความทรงจำ', english: 'Where we began', subtitle: 'ก่อนเรื่องอื่นใด เราเคยมีความทรงจำดี ๆ ร่วมกัน' };
  if (index === 1) return { ...chapter, title: 'ห้องวันเกิดของเธอ', english: 'A birthday, just for you', subtitle: 'ห้องนี้ตั้งใจทำให้เธอ คนพิเศษของเรา', memories: [] };
  return chapter;
}
