import { expect, it } from 'vitest';
import { localAudioUrl } from './audioConfig';
it('resolves optional music under GitHub Pages subpaths', () => {
  expect(localAudioUrl('', '/Happy/')).toBeUndefined();
  expect(localAudioUrl('audio/instrumental.mp3', '/Happy/')).toBe('/Happy/audio/instrumental.mp3');
});
it('rejects remote or path-traversing audio assets', () => {
  for (const path of ['https://example.com/song.mp3', 'audio/../song.mp3', '//example.com/song.mp3', 'audio/a//b.mp3']) expect(() => localAudioUrl(path, '/')).toThrow();
});

it('encodes the supplied filenames and blends across the whole passage', async () => {
  const { passageMix } = await import('./audioConfig');
  expect(localAudioUrl('audio/milk. - You&I.mp3', '/Happy/')).toBe('/Happy/audio/milk.%20-%20You&I.mp3');
  expect(passageMix(-7)).toBe(0);
  expect(passageMix(-10)).toBe(.5);
  expect(passageMix(-13)).toBe(1);
  expect(passageMix(-9)).toBe(.25);
});
