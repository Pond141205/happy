import { describe, expect, it } from 'vitest';
import { parseExhibition, safePath, sample } from './content';
describe('Private content boundary', () => {
  it('accepts a complete placeholder exhibition and relative storage paths', () => {
    expect(parseExhibition(sample)).toEqual(sample);
    expect(safePath('chapter-1/photo_01.webp')).toBe('chapter-1/photo_01.webp');
  });
  it.each(['https://evil.example/photo.jpg', '//evil.example/a', '../private.jpg', 'a/../b', '/a.jpg', 'a/./b', 'a//b', 'a?token=123', 'a%2f..%2fb', 'javascript:alert(1)', 'a\\b', ''])('rejects URL or ambiguous path %s', path => {
    if (path === '') expect(safePath(path)).toBeUndefined();
    else expect(() => safePath(path)).toThrow();
  });
  it('rejects incomplete or malformed server data instead of falling back to private demo access', () => {
    for (const value of [null, {}, { ...sample, chapters: [] }, { ...sample, birthday: 'abc' }, { ...sample, letter: 'x'.repeat(12001) }]) expect(() => parseExhibition(value)).toThrow();
  });
  it('does not accept remote image URLs in trusted-looking content', () => {
    const content = structuredClone(sample);
    content.chapters[0].memories[0].path = 'https://tracker.example/image.jpg';
    expect(() => parseExhibition(content)).toThrow();
  });
  it('enforces media kinds and bounded frame counts', () => {
    const content = structuredClone(sample);
    content.chapters[0].memories = Array(7).fill(content.chapters[0].memories[0]);
    expect(() => parseExhibition(content)).toThrow();
  });
});
