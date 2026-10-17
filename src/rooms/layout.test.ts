import { expect, it } from 'vitest';
import { chapterAt, CHAPTER_STOPS, chapterPresentation } from './layout';
import { sample } from '../content';
it('keeps the gallery and passage in chapter 1 until entering the birthday room', () => {
  expect(chapterAt(0)).toBe(0);
  expect(chapterAt(-10)).toBe(0);
  expect(chapterAt(-12.01)).toBe(1);
  expect(chapterAt(-20)).toBe(1);
  CHAPTER_STOPS.forEach((z, i) => expect(chapterAt(z)).toBe(i));
  expect(CHAPTER_STOPS).toHaveLength(2);
  expect(chapterAt(-80)).toBe(1);
});
it('uses birthday identity even with an older stored exhibition', () => {
  expect(chapterPresentation(sample.chapters[1], 1).english).toBe('A birthday, just for you');
  expect(chapterPresentation(sample.chapters[0], 0).english).toBe('Where we began');
});
