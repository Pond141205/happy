import { expect, it } from 'vitest';
import { wishFrame, WISH_DURATION, WISH_BLOW_AT } from './wishRitual';
it('closes eyes and fades music before wishing and blowing, then opens before popup', () => {
  expect(wishFrame(0)).toMatchObject({closed:0,music:1,blow:false,finished:false});
  expect(wishFrame(.9).closed).toBeCloseTo(.5);
  expect(wishFrame(2.2)).toMatchObject({closed:1,music:0,wish:true,blow:false});
  expect(wishFrame(WISH_BLOW_AT)).toMatchObject({closed:1,music:0,blow:true});
  expect(wishFrame(8.5).closed).toBeGreaterThan(0);
  expect(wishFrame(8.5).closed).toBeLessThan(1);
  expect(wishFrame(WISH_DURATION)).toMatchObject({closed:0,music:1,wish:false,finished:true});
});
it('clamps invalid time and supports reduced motion', () => {
 expect(wishFrame(-1).closed).toBe(0); expect(wishFrame(Infinity).finished).toBe(true);
 expect(wishFrame(3,true).closed).toBe(.96);
});
