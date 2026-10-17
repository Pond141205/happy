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

## Roof / entrance geometry fixes — 2026-10-18

- Filled the four gaps between the elliptical conservatory dome and rectangular wall footprint with an extruded roof shoulder. It overlaps the glazing and wall tops; no landscape plane was added.
- Closed Room 1's unused starting doorway with a solid wall and an arched double door. The doorway toward the connecting passage remains open; navigation bounds are unchanged. End walls render from both sides.
- Removed four additive light planes in Room 1. Their visible triangle edges were causing the broad diagonal bands across the wall/door in the reported screenshot; real scene lighting remains.
- **88 tests passed**. Three new raycast checks cover roof corners, a 21×33 grid of roof coverage, and the closed entrance versus the open passage. TypeScript, production build, production security guard and 51-asset Pages smoke checks passed.
- Inspected actual WebGL views from the dome corner, back roof seam, starting door and connecting corridor. The roof has no sky gaps at the corners, the starting door no longer looks into the forest, the diagonal overlay bands are gone, and Room 2 remains visible through the intended passage.
- Manual developer-only views: `http://127.0.0.1:5173/scripts/scene-check.html`. This standalone harness does not change visitor navigation and is excluded from production; the production check also guards against accidentally publishing it.

## Textured forest / mobile LOD — 2026-10-18

- Replaced the old 552,000-triangle leaf instances with a branching tree model, photographed twig-card atlas, bark color/normal maps, and four baked orthographic views for distant trees. The multi-million-triangle source model is not loaded. Source surfaces are CC0, credited with original URLs and hashes in `public/textures/forest/`.
- Actual forest-side view: desktop profile **8 / 40 / 52** near/middle/far trees, **111,528 triangles**, 22 possible forest batches before per-cell culling. A **402×874 canvas** switched to touch profile **6 / 28 / 66**, **79,844 triangles**, 19 possible batches. These counts describe forest geometry, not whole-scene FPS or all shadow/transmission passes.
- Four local texture files total **415,524 bytes**, with an estimated **12.3 MiB** decoded RGBA + mipmap budget. WebP saves transfer size; it is not GPU texture compression. No new runtime dependency, remote asset request, WASM decoder or CSP relaxation was added.
- **95 tests passed across 13 files**. New coverage checks deterministic branches, tapering, finite geometry, canopy clearance extents, atlas UVs/normals, near/middle triangle reduction, per-device LOD caps, hysteresis, four-view rotation selection, batch limits and asset dimensions/sizes/hashes. A taper defect found by the tests was corrected.
- TypeScript and production build passed; production guard still excludes demo/QA entry pages. Pages HTTP smoke passed **55 assets**, including the four WebP textures beneath `/happy/` with correct MIME types.
- Inspected rendered forest-through-glass, close-tree and mountain-window views. Leaf/bark textures and the distant-tree shader compiled without console errors/warnings. Phone-sized canvas testing verifies the responsive rendering profile; physical iPhone 17 Pro/Safari performance and heat remain unverified.
- Local test worker startup exhausted memory when using the default worker count; `pnpm test` now caps Vitest at two workers and the full suite passes. This was the desktop test runner, not a measured mobile WebGL failure.

## Mountain panorama, scene loading and Badtz-Maru — 2026-10-18

### Follow-up: middle-distance forest and image proportions

- Corrected mountain UV scale to four 90°×45° photographic sectors, respecting the 2:1 source aspect near the horizon instead of the previous vertical compression. Mirrored repeat avoids abrupt color jumps between adjacent sectors.
- Added three transparent ridge strips cropped into one 1536×768 atlas, 384,028 bytes / about 6 MiB RGBA with mipmaps. Radius 76/125/195 m and distinct heights/rotation give overlapping parallax depths between close 3D trees and the far panorama. Geometry adds 576 triangles and three meshes; transmission and reflection passes can draw them again. No extra shadow casters or per-frame layer animation.
- **104 tests passed across 15 files**; TypeScript, production guard, build and **57-asset** Pages smoke passed. New regression checks angular aspect, strip aspect, depth ordering, overlapping heights and atlas transfer budget.
- Visual QA was interrupted: the existing in-app browser development tab stopped responding to CDP while selecting the mountain-window view. User refresh was requested. Final composed scene appearance and physical iPhone performance remain unverified in this follow-up; the generated source atlas itself was visually inspected.

- Replaced the three distant mountain rings and procedural sky with one photographic-style AI panorama on a 3,968-triangle sphere. The 2048×1024 WebP is 103,732 bytes; estimated decoded RGBA + mipmaps is 10.7 MiB. Nearby terrain and trees retain depth. Generation provenance and final prompt are alongside the asset.
- Added a loading overlay tied to actual Three.js asset counts, reflection capture and two subsequent warmup frames. Joystick remains paused until ready. A two-animation-frame mount delay lets the overlay paint before synchronous Canvas preparation; no invented timer/percentage marks the scene ready. Optional photos arriving later do not reopen it; stale attempt callbacks are rejected.
- Rebuilt Badtz-Maru as four merged material meshes with a beveled spiky head outline, half-lidded eyes, a shaped beak and belly/feet. Raycast regression verifies pupils are in front of the face. The topper remains exclusively in Room 2.
- **103 tests passed in 15 files**. Added coverage for loading counts, preparation gating, stale callbacks, failure/retry, listener cleanup, finite panorama UVs, transfer/triangle budgets and visible character features. TypeScript, production build/security guard and **56-asset** Pages HTTP smoke passed.
- Inspected actual mountain-window and cake-portrait WebGL views; the new panorama and character rendered without console warnings/errors in the isolated QA scene. App loading state appeared immediately in the DOM; after preparation, `data-scene-ready=true`, the overlay was absent and camera position remained `(0, 6.4)`. Album-during-loading shortcut worked.
- One initial main-scene attempt lost its WebGL context after switching between development QA scenes. Existing album recovery handled it; retry reached ready. This desktop browser run is not proof of sustained iPhone/Safari FPS or thermal behavior. The loading screen communicates work; it does not eliminate shader compilation cost. Production entrance remains locked pending Supabase setup.

## Private 32-photo gallery — 2026-10-18

- Imported all 32 JPEG entries from the user ZIP locally. Generated 32 512px thumbnails (735,172 bytes total) and 32 full-size WebPs, max 1600px, with orientation applied and EXIF removed. Originals remain unchanged. Files and filename manifest stay inside ignored private-media / .asset-work directories; no personal photos are uploaded.
- Expanded Room 1 to 64m, z=-8..56, with 16 frames per side, 3.7m spacing, matching pilasters, extended parquet/vault and lighting. Starts at z=54.4. Corridor, audio blend and Room 2 remain fixed. Photos fit within mats without cropping or stretching.
- Wall photos load within 13m, release beyond 16m, and use thumbnails; detail dialog alone loads full size. Placeholder canvases reduced from 1024x768 to 256x192 and plaques from 768x144 to 384x72 to bound 32-frame memory.
- 106 tests passed / 16 files. New coverage checks frame counts, spacing, hall exit and joystick travel from the new start into Room 2. Parser accepts 32 memories and rejects 33. TypeScript/build/security guard/57-asset smoke passed. Production guard explicitly rejects private-media files and the development-only local photo endpoint.
- All 64 local image responses returned 200/WebP. Browser album confirmed 32/32 decoded images; photo 32 detail decoded at 1152x1536. Actual WebGL showed the extended hall and near photos, data-scene-ready=true at z=54.4; joystick moved to z=53.2489. Console had no errors/warnings after clean retry. One HMR scene lost its context during editing; the existing retry recovered. Sustained iPhone performance remains unverified.

## Entrance scenery intersection / no photo captions — 2026-10-18

- The nearest 76m scenery ring intersected the extended hall entrance at local z=76, appearing as two forest strips in the solid wall. Moved the ring to 90m; added an extent regression requiring every ridge radius to clear the hall corner plus margin. Door and wall geometry remain intact.
- Removed physical wall plaques, generated placeholder words/numbers, album captions, detail titles/dates/descriptions and named tray labels. Accessible image names remain for screen readers. Eliminated unused plaque/placeholder canvas textures.
- 106 tests passed. Actual closed-entrance WebGL view shows a solid wall with no forest strips, no wall plaques and no console errors/warnings. The photo dialog accessibility tree contains only the photo and close button, no visible text captions. Private media remains local and excluded from production.

## Blank photo material fix and text review — 2026-10-18

- The no-caption cleanup removed the previous texture fallback, exposing a Three material transition from no map to map without rebuilding the shader defines. The photo material now remounts when its loaded/empty state changes, so the USE_MAP shader variant is compiled when the async image arrives.
- All 32 local 512px thumbnails now remain loaded rather than intentionally blanking distant frames; their combined transfer is 735,172 bytes. Full images still load only in the detail dialog, and remote full-size storage media retains distance gating.
- Actual development gallery wall view shows the photographs instead of white planes; isolated QA console returned no warnings/errors. 106 tests, TypeScript, production build/security guard and 57-asset smoke passed.
- Exported editable page-by-page text review as local ignored Markdown/TXT, plus 207 source records in JSON including old inactive copy, errors, aria text and source locations. No personal review document is published; exporter preserves an existing Markdown review instead of overwriting edits.

## Birthday-only entrance, animated candles and optional final letter — 2026-10-18

- Removed Google OAuth UI and app auth subscriptions. Entrance starts at birthday input, accepts six/eight digits, and decrypts the production AES-GCM envelope with PBKDF2-SHA256/310,000 iterations. Wrong codes and tampered ciphertext fail. Code/plaintext letter stay in ignored private-media/experience.json; only encrypted envelope is published. Birthday guessing remains possible; this is not account-level authorization. Photos stay local.
- Prime audio muted during the direct submit gesture, then restore volume only after unlocking, preserving iOS gesture requirements without playing music for rejected codes.
- Added flicker, bending/shrinking flames, damped candle light, seven low-poly smoke puffs per candle, and a three-second blow sequence. Reduced motion skips smoke/movement. The invitation then offers open/decline; declining permits reopening later. The full supplied letter is rendered as 14 escaped React text paragraphs in a scrollable dialog.
- 112 tests passed / 18 files, including exact-code decryption, six/eight-digit support, wrong code, tampering, flame/smoke timing and reduced motion. TypeScript, production guard, build and 58-asset smoke passed. Guards verify no Google sign-in UI, local private endpoints or plaintext envelope fields in production.
- Browser: wrong code stayed at entrance; matching code entered without Google. Blow button showed the animation state before invitation. Decline closed it, reopen worked, and the letter's first/last text and 14 paragraphs matched. Saved actual invitation screenshot. QA scene candle controls rendered without shader errors. Main development scene experienced an existing WebGL context loss and used its album fallback for dialog QA; physical iPhone thermal/FPS remains unverified.
