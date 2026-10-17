# Joystick movement verification

## Automated checks

`node node_modules/vitest/vitest.mjs run`: **70 passed, 9 files**.

| Function / behavior | Cases | Result |
| --- | --- | --- |
| `joystickVector` | Forward, backward, left, right, dead zone, analog strength, diagonal clamping, invalid radius/coordinates | Pass |
| `JoystickController.begin` | Pointer ownership, rejects a second pointer | Pass |
| `JoystickController.move` | Owning pointer only, forward/backward values | Pass |
| `JoystickController.end` | Matching pointer resets immediately, unrelated pointer cannot stop movement, no stale movement after release | Pass |
| `JoystickController.reset` | Neutral input, releases ownership, accepts a new pointer | Pass |
| `stepMovement` | Idle, four directions, camera-relative direction, diagonal speed, analog speed, immediate stop, disabled movement, 30/60/144 FPS, capped frame gaps, malformed input, no pose mutation | Pass |
| `constrainPosition` | Gallery bounds, narrow passage, doorway collision, cake exclusion including its exact center | Pass |
| Walking through the rooms | Cross to Room 2 and reverse, align with doorway, stop at cake and walk around it, stop at both ends | Pass |
| Existing content, auth configuration, media path, music and chapter tests | Existing regression coverage | Pass |

The movement tests exposed a doorway bug: standing exactly at the wall boundary was treated as being inside the passage, so the next forward step could move the camera sideways into the doorway. The boundary comparison now keeps the camera at the wall until the joystick moves it into alignment.

## Browser checks

Verified against the running local site with the actual joystick, mouse input, canvas coordinates, dialogs, and album controls:

- Forward joystick changed camera Z from `6.4000` to `6.2378`.
- Releasing the pointer returned joystick Y to `0.000`; camera stayed at `6.2378`.
- Backward joystick returned camera Z to `6.4000`.
- Right joystick changed camera X from `0.0000` to `0.0811`; left returned it to `0.0000`.
- Holding W did not change camera position.
- Clicking the floor did not change camera position.
- 3D chapter numbers are indicators, with no chapter jump or guided-tour control.
- Selecting another chapter in the album and returning to 3D restored the actual room and the saved camera position, rather than moving to the selected album room.
- Opening Help disabled the joystick and reset its input to zero; closing Help enabled it again.

Touch behavior uses Pointer Events with capture, cancel and lost-capture handlers, plus a single-pointer controller. A physical mobile-device touch test has not been performed. Automated tests do not replace testing WebGL/OAuth on the eventual deployed site.

## Run again

```sh
pnpm test
pnpm build
node scripts/check-build.mjs
```

## Two-room visual upgrade — 2026-10-17

- TypeScript compile, production build and production guard checks passed. The build retains CSP and removes the development demo entry and source maps.
- Full existing regression suite: **70 tests passed across 9 files** after the upgrade.
- Both MP3 HTTP responses verified: You & I 4,280,765 bytes; About You 7,659,448 bytes.
- Inspected actual WebGL scenes: Room 1 has a vaulted gallery, six framed scenery placeholders, parquet and a side bench; cake and meadow remain in Room 2 beyond the arched connecting passage.
- Walked through the passage with the actual joystick; UI changed to Chapter 02 and About You in Room 2.
- Compass restored forward orientation while position stayed at X `-0.4091`, Z `-12.1888`.
- Album → 3D restored X `-0.4091`, Z `-12.1888`, yaw `-0.0000` exactly, with the correct Room 2 title.
- Birthday button changed to the wish-confirmation text and became disabled after blowing the candles. Candle light now turns off with the flames.
- Expanded/collapsed the memory list and opened a memory dialog. The joystick's `aria-disabled` became `true` during the dialog and was restored on close.
- A fresh browser tab loaded and displayed the final gallery with **no console errors or warnings**. Vite now deduplicates React/Three and prebundles the renderer/addons together to avoid stale mixed dependency graphs during development refreshes.
- Saved real browser screenshots of both rooms. No full-room concept image is substituted for the navigable scene.

No physical mobile-device test or deployed Supabase OAuth/RLS test was performed in this upgrade. Hosting and private personal media still require the existing backend setup described in README.

## Clear glass and spatial forest — 2026-10-18

- **79 tests passed across 11 files**, including 9 new geometry/environment checks. TypeScript, production build, CSP/demo guard and both MP3 HTTP checks passed.
- Raycasts pass through the real arched holes in every side/back window, while solid wall areas and arch corners still block the view. Glass covers those openings and the dome with a physical transmission material and no image map.
- Tree roots match the terrain, positions are deterministic across remounts, and trunks avoid both rooms, the connecting passage and the mountain sightline. Tests also cover terrain continuity and stronger parallax at near distances.
- Walked with the joystick from Room 1 through the passage to Z `-13.0778`; Chapter 02 and About You appeared on entry. No keyboard or click-to-walk input was added.
- Sideways joystick changed X from `1.0142` to `0.2717`, with Z unchanged at `-13.0778`. Releasing reset both joystick values to `0.000`.
- Album → 3D preserved X `0.2717`, Z `-13.0778` and yaw `0.0000` exactly, recreating the same forest and glass reflection probe.
- Verified camera far plane `480`; this also fixes stale development cameras clipping the new sky and distant mountains.
- Actual WebGL views show the forest through the windows and dome, layered mountains, clear glazing and sunlight on the parquet. Browser console returned no errors or warnings.
- Blowing the candles in the new scene changed the wish text and disabled the button as expected.
- Reflections use a single local cubemap capture per scene mount. They are an approximation, not continuously traced mirrors. No physical mobile performance test was performed.

## GitHub Pages and mobile readiness — 2026-10-18

- **85 tests passed in 12 files**. New tests cover mobile pixel budgets at DPR 3, desktop/invalid dimensions, sustained low FPS reduction, recovery and ignoring inactive/throttled frames. Forest crowns now also clear the building footprint.
- TypeScript and production build passed with `VITE_BASE_PATH=/happy/`. Production guard retained CSP, excluded the development demo and source maps. HTTP smoke checked 51 assets under the project subpath, including both MP3 responses and their MIME types.
- Browser viewport checks at 402×874, 874×402 and 402×740: entered scene had no horizontal/vertical overflow; joystick, music, album and help controls fit. Portrait joystick moved Z from 6.4000 to 3.7171; album → 3D restored 3.7171. Help disabled the joystick and closing it restored input.
- Production preview at `/happy/`: no demo button, no WebGL canvas before admission, and Google entry with missing backend stayed at the entrance with the preparation message. Console had no errors/warnings. This is a locked deployment until Supabase is configured, as requested.
- An earlier preview tab crashed while loading a second WebGL scene. The entrance now does not mount/download the 3D module before admission; the final locked preview loaded and was verified in a clean tab.
- Responsive browser checks are not an iOS device simulation. Safari/WebGL, audio, thermal performance and frame rate on a physical iPhone 17 Pro remain unverified. Live Supabase OAuth/RLS remains untested because no backend project exists yet.
- Published to `https://pond141205.github.io/happy/`; GitHub Actions run `39082918867` completed build and deploy successfully. Verified the live URL in a browser: no demo button/canvas, missing-backend entry stayed locked, no console errors/warnings. The repository contains sample content and public music only; personal media is not uploaded.
