# The Museum of Us

พิพิธภัณฑ์ความทรงจำ 3D สำหรับ Happy Birthday + Welcome Home สร้างด้วย React, TypeScript, Three.js / React Three Fiber และ Supabase พร้อมเผยแพร่ frontend บน GitHub Pages

## เปิดตัวอย่างบนเครื่อง

ใช้ Node.js 22 และ pnpm 11:

```sh
pnpm install
pnpm dev
```

เปิด `http://127.0.0.1:5173/` เลือก **ชมเวอร์ชันตัวอย่าง** รหัส **01012000** ข้อมูลทั้งหมดเป็นสมมติ ใช้ภาพทิวทัศน์ตัวอย่างและสอง MP3 ที่ใส่ไว้ใน `public/audio/` ไม่มีรูป/คลิปส่วนตัวหรือฟอนต์จากเว็บภายนอก

เดินด้วยจอยบนหน้าจอเท่านั้น: กดค้างแล้วลากขึ้น/ลงเพื่อเดินหน้า/ถอยหลัง ซ้าย/ขวาเพื่อเดินด้านข้าง ปล่อยจอยเพื่อหยุด ลากบนฉากเพื่อมอง แตะรูปเพื่อเปิด หมายเลขห้องใน 3D เป็นตัวบอกตำแหน่ง ไม่มีการเดินด้วยคีย์บอร์ด แตะพื้น หรือพาชมอัตโนมัติ

## ขอบเขตความปลอดภัย

- โหมดตัวอย่างมีเฉพาะ Vite development และใช้เฉพาะ `src/content.ts` ซึ่งต้องเป็นข้อมูลสมมติเท่านั้น ปุ่มเข้าโหมดนี้ถูกตัดออกจาก production
- GitHub Pages เผยแพร่ HTML, JavaScript และฉากห้องว่างให้คนทั่วไปโหลดได้ หน้าเว็บนี้ไม่อ้างว่าซ่อน frontend ทั้งหมด
- ข้อมูลจริงมาจากตาราง `exhibitions` และ bucket `memories` ของ Supabase ซึ่งเปิด RLS และอนุญาตเฉพาะ UUID ที่เจ้าของเพิ่มไว้ฝั่งฐานข้อมูล
- วันเกิดเป็นลูกเล่น **หลังยืนยันบัญชีและสิทธิ์แล้ว** ไม่ใช่รหัสรักษาความปลอดภัยหลัก
- OAuth ใช้ Google ผ่าน Supabase PKCE; session เก็บใน sessionStorage (ปิดแท็บแล้วไม่เก็บถาวร) ไม่มี secret key ใน frontend
- ไฟล์ private โหลดด้วย authenticated download แล้วแสดงผ่าน Blob URL ไม่ออก signed URL สาธารณะ ปิดหน้าต่าง/ออกจากระบบแล้ว revoke Blob URL ของหน้าเว็บ
- ก่อนโหลดข้อมูลตรวจผู้ใช้กับ Auth server และทบทวนสิทธิ์เป็นระยะ การถอนสิทธิ์ป้องกันการดาวน์โหลดครั้งถัดไป แต่ไม่เรียกคืนไฟล์ที่ถูกดาวน์โหลดไปแล้ว
- ไม่มี analytics, remote fonts, public thumbnails หรือ service worker cache
- ถ้าไม่ได้ตั้งค่า Supabase หรือไม่มีสิทธิ์ production จะเปิดเนื้อหาไม่ได้ ไม่ fallback เป็น demo
- ภาพ/คลิปที่ผู้มีสิทธิ์เปิดดูแล้วสามารถบันทึกหรืออัดหน้าจอได้ ป้องกันสิ่งนี้ทั้งหมดไม่ได้

## เชื่อม Supabase Free (ทำภายหลังได้)

1. สร้างโปรเจกต์ Free ใหม่สำหรับงานนี้โดยเฉพาะ และรัน `supabase/schema.sql` ใน SQL Editor
2. Authentication > Providers เปิด Google และใส่ Client ID / Secret จาก Google Cloud OAuth (Secret อยู่ใน Supabase เท่านั้น) เพิ่ม callback URL ที่ Supabase แสดงใน Google Cloud
3. ตั้ง Site URL และ Redirect URLs ให้ตรงกับ URL เว็บจริงรวม subpath และ `/` ท้าย เช่น `https://YOUR-NAME.github.io/Happy/` เพิ่ม localhost เฉพาะเมื่อต้องการพัฒนากับบัญชีจริง อย่าใช้ wildcard กว้าง
4. คัดลอก `.env.example` เป็น `.env.local` ใส่ Project URL กับ **publishable key** เท่านั้น ห้ามใช้ `service_role` หรือ `sb_secret_...` ไฟล์นี้ถูก gitignore
5. ล็อกอินด้วยบัญชีคุณและแฟนหนึ่งครั้งเพื่อให้เกิดผู้ใช้ใน Authentication > Users ตอนนี้จะเห็นข้อความว่ายังไม่ได้รับสิทธิ์ ซึ่งถูกต้อง
6. ใน SQL Editor เพิ่ม UUID ของสองบัญชีจริงเข้า `private.museum_members` ตามตัวอย่างท้าย schema ห้าม commit อีเมลหรือ UUID จริงลง repository
7. ใน Table Editor เพิ่มแถว `public.exhibitions`: `id = our-museum`, `content = JSON ตาม supabase/exhibition.example.json` แก้วันเกิด/ข้อความจริงใน Dashboard โดยตรง ห้ามแก้ตัวอย่างใน repo เป็นข้อมูลจริง
8. คง schema `private` ไว้นอก exposed schemas และคง bucket `memories` เป็น private ตรวจว่าไม่มี policy เก่าหรือ bucket อื่นที่เปิดไฟล์ซ้ำ

Google login สำเร็จเพียงอย่างเดียวไม่ให้สิทธิ์ดู มีเพียง UUID ใน allowlist เท่านั้นที่อ่านได้ ผู้ชมไม่มีสิทธิ์เพิ่ม/แก้ไข/ลบข้อมูลหรือไฟล์ ใช้ Supabase Dashboard ของเจ้าของในการจัดการ

## เพิ่มรูปและคลิปภายหลัง

อัปโหลดผ่าน Dashboard > Storage > memories (private) ตั้งชื่อไฟล์ภาษาอังกฤษ เช่น `chapter-1/first.webp` แล้วเพิ่ม `path` ให้ความทรงจำนั้นใน JSON:

```json
{
  "id": "first",
  "title": "ชื่อความทรงจำ",
  "caption": "เรื่องของวันนั้น",
  "date": "วันที่หรือข้อความสั้น",
  "kind": "photo",
  "path": "chapter-1/first.webp"
}
```

วิดีโอใช้ `kind: video`, `path: chapter-2/laugh.mp4`, `posterPath: chapter-2/laugh-cover.webp` ภาพปกต้องอยู่ private เช่นกัน หากไม่มีภาพปกจะแสดงกรอบตัวอย่าง

เปิดใช้งานเฉพาะ 2 chapters แรก ห้องละไม่เกิน 6 ความทรงจำ ชื่อบทภาษาอังกฤษใช้กับป้าย 3D; ข้อความภาษาไทยแสดงใน UI โดยฟอนต์ที่ bundle มาด้วย

แนะนำภาพ WebP/JPEG ความกว้าง 1600–2000px และคลิป MP4 H.264 + AAC บีบอัดไม่เกิน 50 MB/ไฟล์ ตั้งเป้ารวม 200–400 MB เว็บดาวน์โหลดคลิปเต็มเมื่อเปิดรายละเอียดเพื่อไม่ใช้ลิงก์สาธารณะ จึงเหมาะกับคลิปสั้น รูปโหลดเฉพาะห้องใกล้เคียง/อัลบั้มที่กำลังเปิด

## โฮสต์บน GitHub Pages

1. สร้าง repository บน GitHub แล้ว push โค้ดนี้ขึ้น branch `main` (GitHub Free Pages ต้องใช้ public repository; repo นี้มีเฉพาะโค้ดและข้อมูลสมมติ)
2. Settings > Pages > Source เลือก **GitHub Actions**
3. Settings > Secrets and variables > Actions > Variables เพิ่ม `VITE_SUPABASE_URL` และ `VITE_SUPABASE_PUBLISHABLE_KEY` (สองค่านี้เป็น public config)
4. Workflow ตั้ง base path จากชื่อ repository อัตโนมัติ ถ้าเป็น `username.github.io` หรือใช้โดเมน root ให้เพิ่ม `VITE_BASE_PATH = /`
5. Run workflow **Deploy museum to GitHub Pages** ระบบทดสอบ build ตรวจว่าปุ่ม demo ถูกตัดออก แล้ว deploy เฉพาะ `dist/`
6. ตั้ง OAuth Redirect URLs ให้ตรงกับ URL ที่ GitHub Pages แสดง แล้วทดสอบสิทธิ์จริงตาม checklist ด้านล่าง

อย่าใส่รูป/คลิปจริงใน `public/`, `src/`, JSON ตัวอย่าง หรือ Git แม้ภายหลังลบก็อาจยังอยู่ในประวัติ ถ้าต้องพักไฟล์ในเครื่องใช้ `private-media/` ซึ่ง gitignore ไว้

## ตรวจสอบก่อนส่งให้แฟน

```sh
pnpm test
pnpm build
node scripts/check-build.mjs
pnpm preview
```

การทดสอบอัตโนมัติครอบคลุมการปฏิเสธ config/data/path ที่ผิดและ production demo guard ยังไม่แทนการทดสอบ RLS/OAuth บนโปรเจกต์จริง:

- ไม่ล็อกอิน: เรียกข้อมูลนิทรรศการ/ไฟล์ไม่ได้ และไม่มี demo ใน production
- ล็อกอินบัญชีอื่น: อ่านตารางและ bucket ไม่ได้ แม้รู้ path
- สองบัญชีที่อนุญาต: เปิดรูปและเล่นวิดีโอได้ (ปุ่มวันเกิดเป็นเพียงลูกเล่น)
- คัดลอก storage URL ไปหน้าต่างไม่ระบุตัวตน: เปิดไฟล์ไม่ได้
- ถอนสมาชิก: คำขออ่านใหม่ถูกปฏิเสธ
- ออกจากระบบ: UI กลับประตู ปิดสื่อและเพลง
- มือถือ: เปิดเพลงหลังแตะปุ่ม เล่นคลิปพร้อมลดเสียงเพลง และกลับจากอัลบั้มได้

## ห้อง 1 และห้อง 2

- Room 1 / Chapter 01: Memory Gallery Hall — เพดานโค้งแต่งคิ้ว ผนังเขียวมะกอก เสาครีม กรอบทอง แสงบ่าย พื้นไม้ก้างปลา และม้านั่ง ไม่มีเค้กหรือสวน
- ทางเชื่อมยาว 4 เมตร แยกประตูสองห้องชัดเจน ชื่อบทเปลี่ยนเมื่อกล้องเข้าสู่ห้องจริง
- Room 2 / Chapter 02: Birthday Cake Room — เรือนกระจกใสใต้โดมโครงทองเหลือง ท่ามกลางป่าและภูเขา 3D ยามเย็น เถาไม้ เค้กสองชั้นพร้อม Badtz-Maru บนแท่นเซาะร่องกลางสวนหญ้าและดอกมิกกี้เม้าส์ พร้อมเป่าเทียน
- เปิดเฉพาะสองห้องแรก ทางเดินจบที่ห้อง 2 ตัวบอกห้องมี 01–02 ข้อมูลบทเก่ายังเก็บไว้เพื่อพัฒนาต่อภายหลัง แต่ไม่แสดงในฉากหรือเมนู

ไฟล์หลัก: `Room1.tsx`, `Room2.tsx`, `BirthdayInstallation.tsx`, `GalleryShell.tsx`, `Transition.tsx` ใน `src/rooms/` ส่วน `layout.ts` กำหนดจุดห้องและชื่อบท และ `navigation.ts` จำกัดขอบห้อง ประตู และการชนเค้กในห้อง 2

พื้นไม้ใช้ระนาบเดียวต่อห้องพร้อม texture ก้างปลาที่สร้างด้วยโค้ด ไม่มีพื้นซ้อนกัน ส่วนโดม คิ้วเพดาน ดอกไม้ และเถาไม้รวม geometry และใบไม้ใช้ instancing เพื่อลด draw calls

ภาพตกแต่งเค้กเลือกผ่าน `cakeDecorationPath` ใน JSON บน Supabase และ private bucket เดิม โดยมีโมเดลสำรอง ภาพทิวทัศน์ใน `public/images/` เป็นภาพตัวอย่างที่สร้างขึ้น ไม่ใช่รูปส่วนตัว รูปจริงยังโหลดผ่าน private storage เท่านั้น เมื่อระบุ path จริงแต่โหลดไม่ได้ จะไม่แทนที่ด้วยภาพสาธารณะ

### ค่าใช้จ่ายและสถานะการเชื่อมบริการ

ใช้เฉพาะ Free plan และโดเมน github.io ไม่ต้องซื้อโดเมน/เพลง/เซิร์ฟเวอร์ Supabase Free ปัจจุบันมี storage 1 GB, ขนาดไฟล์ 50 MB, egress 5 GB uncached + 5 GB cached และอาจพักโปรเจกต์หลังไม่ใช้ 1 สัปดาห์ ตรวจ Dashboard และเปิดโปรเจกต์ก่อนวันเซอร์ไพรส์ โควตา/นโยบายผู้ให้บริการอาจเปลี่ยนได้

เผยแพร่ frontend แล้วที่ https://pond141205.github.io/happy/ ผ่าน GitHub Actions โดยคงหน้าทางเข้าล็อกไว้ตามที่เจ้าของเลือก ยังไม่ได้ตั้งค่าบัญชี Supabase, OAuth หรือ allowlist การยืนยันสิทธิ์และความปลอดภัยของข้อมูลจริงต้องทำหลังเชื่อมบริการครบ


## เพลงประจำห้อง (ปัจจุบัน)

ใช้ไฟล์ที่ผู้ใช้ใส่ไว้: `public/audio/you-and-i.mp3` สำหรับห้อง 1 และ `public/audio/about-you.mp3` สำหรับห้อง 2 แทนระบบเพลงเดียวเดิม ตั้งค่าเปลี่ยนไฟล์ได้ด้วย VITE_ROOM1_BGM / VITE_ROOM2_BGM (ค่า VITE_ROOM12_BGM เดิมไม่ใช้แล้ว)

สองเพลงใช้ตัวเล่นเดิมตลอดการเข้าชม เดินต่อแม้อีกเพลงเงียบ ไม่มีการเปลี่ยน currentTime เมื่อเดินกลับห้อง เฟด equal-power ตามตำแหน่งทางเชื่อม z=-8 ถึง -12 และเกลี่ยเสียงด้วย Web Audio GainNode เพื่อรองรับมือถือด้วย ปิดเสียงหรือซ่อนแท็บจะพักทั้งคู่ และเล่นต่อจากจุดเดิมเมื่อกลับมา หากเพลงจบจะวนรอบตามปกติ รีโหลดหน้าเว็บจะเริ่มการเล่นรอบใหม่



## Joystick-only controls

`src/controls/MovementJoystick.tsx` manages mouse/touch pointers with capture; `joystick.ts` owns one pointer, applies a dead zone and normalizes analog input. `movement.ts` is the only horizontal movement function and checks collisions in small substeps. Paused scenes, dialogs, blur, hidden tabs, pointer release/cancel and unmount clear joystick input. Camera position and look direction are saved across album/3D switches; no other button moves the camera. See `TEST_RESULTS.md` for the per-function cases and browser checks.

The compass button restores the forward viewing direction without changing position. The memory list is collapsible; frames remain clickable. Birthday controls float below the installation rather than covering it with a large card.

## กระจกและสภาพแวดล้อมห้อง 2

`ConservatoryShell.tsx` ใช้ผนังที่เจาะช่องโค้งจริง หน้าต่างและโดมรวมเป็นกระจก `MeshPhysicalMaterial` ที่มี transmission และความหนาบาง พร้อม reflection probe จับภาพห้องและป่า 3D รอบอาคารหนึ่งครั้งเมื่อเข้าฉาก ไม่มีภาพวิวแปะบนกระจก ภาพ `garden-twilight.png` เดิมเก็บเป็นภาพต้นแบบและไม่ถูกโหลดในฉากแล้ว

`ForestEnvironment.tsx` สร้างพื้นดินลาดลงสู่หุบเขา โขดหิน เฟิร์น พุ่มไม้ ต้นไม้พร้อมกิ่งและใบไม้ และแนวภูเขา 3 ชั้นรอบอาคาร ท้องฟ้าเป็น shader ต่อเนื่อง ฉากทั้งหมดสร้างในเครื่องด้วย Three.js ไม่ต้องเรียกบริการหรือโหลดโมเดลจากภายนอก ต้นไม้และสวนมีระยะจริงจึงเกิด parallax เมื่อเดิน ใบไม้และหินใช้ instancing ส่วนกิ่งและเฟิร์นรวม geometry เพื่อลด draw calls

`forestLayout.ts` ใช้ seed เดิมเพื่อให้ภูมิประเทศและต้นไม้ไม่เปลี่ยนเมื่อกลับจากอัลบั้ม พร้อมเว้นพื้นที่สองห้อง ทางเชื่อม และมุมมองหุบเขาหลังเค้ก กล้องแสดงผลไกล 480 หน่วยเพื่อไม่ตัดท้องฟ้าหรือแนวภูเขา

วัสดุกระจกอ้างอิง [Three.js MeshPhysicalMaterial](https://threejs.org/docs/pages/MeshPhysicalMaterial.html) ภาพคอนเซปต์เป็นแนวทางศิลป์ ส่วนหน้าเว็บเรนเดอร์ด้วย WebGL จริง

## GitHub Pages และ iPhone — 2026-10-18

Repository: `Pond141205/happy`; workflow ใช้ `/happy/` อัตโนมัติ ไม่ต้องตั้ง Supabase เพื่อ build/deploy หน้าเว็บได้ ก่อนเชื่อม Supabase หน้า production จะคงล็อกไว้ ไม่มีปุ่ม demo และยังเข้าห้องไม่ได้ การใช้รหัสวันเกิดเพียงอย่างเดียวไม่ปลดล็อก production

Pages แจก frontend และทุกไฟล์ใน `public/` ให้คนทั่วไปดาวน์โหลดได้ รวมสอง MP3 และภาพทิวทัศน์ตัวอย่าง หน้าล็อกไม่ได้เข้ารหัสไฟล์เหล่านี้ อย่าใส่รูป/คลิปส่วนตัวที่นี่ ให้เพิ่มผ่าน private Supabase Storage ภายหลัง

ฉาก 3D โหลดหลังผ่านหน้าทางเข้าเท่านั้น เพื่อลดการดาวน์โหลดและใช้ GPU ก่อนเข้าชม มือถือใช้ safe area และความสูงจอแบบ dynamic รองรับการหมุนจอ มีจอยและปุ่มขนาดสำหรับนิ้ว ความละเอียดฉากและ transmission ของกระจกมีงบสำหรับมือถือ และลดความละเอียดเมื่อเฟรมเรตต่ำต่อเนื่อง เงาของอาคารคำนวณใหม่เมื่อ geometry เปลี่ยนแทนทุกเฟรม

ทดสอบ viewport 402×874, 874×402 และ 402×740 บนเบราว์เซอร์เดสก์ท็อปแล้ว ยังต้องทดสอบ Safari บน iPhone 17 Pro จริง รวมเสียงหลังแตะหน้าจอ การหมุนจอ การกลับจากแท็บอื่น และความร้อน/เฟรมเรตในห้องกระจก ไม่รับประกัน 60 FPS จากการจำลองขนาดจอ

ตรวจ production แบบเดียวกับ Pages บนเครื่อง (PowerShell):

```powershell
$env:VITE_BASE_PATH='/happy/'
pnpm test
pnpm build
pnpm check:pages
pnpm preview
```

เปิด `http://127.0.0.1:4173/happy/` หน้าจริงจะล็อกไว้ ส่วน demo ใช้ `pnpm dev` เท่านั้น หลังเชื่อม Supabase ให้ตั้ง Site URL/redirect เป็น `https://pond141205.github.io/happy/` และเพิ่มสองบัญชีใน allowlist ตามขั้นตอนด้านบน

## ต้นไม้ภาพถ่ายและ LOD

## โถงรูปส่วนตัว 32 เฟรม

โถงแรกยาว 64 เมตร ช่วง z=-8 ถึง 56 เริ่มเดินที่ z=54.4 มีเฟรมฝั่งละ 16 รูป เว้น 3.7 เมตร ห้องเค้กและทางเชื่อมอยู่ตำแหน่งเดิม แสดงรูปแบบ contain ไม่ตัดคนออกจากภาพ

รูปที่นำเข้าจาก ZIP เก็บเฉพาะเครื่องใน `private-media/gallery/` (Git ignore) ภาพย่อ 512px สำหรับผนัง/อัลบั้ม และเต็ม 1600px สำหรับเปิดดู เรียงตามชื่อไฟล์ใน manifest ซึ่งเก็บในโฟลเดอร์เดียวกัน ลบ EXIF ในสำเนา WebP แล้ว ต้นฉบับและ ZIP ไม่ถูกแก้ไข ภาพย่อในเครื่องทั้ง 32 รูปโหลดค้างไว้ (รวมประมาณ 735 KB) เพื่อให้ทุกเฟรมมีรูป ส่วนไฟล์ private จากเซิร์ฟเวอร์ยังโหลดตามระยะ 13/16 เมตร

ใช้ `pnpm dev` → ชมเวอร์ชันตัวอย่าง → 01012000 เพื่อดูรูปในเครื่อง route `/__local-media` มีเฉพาะ Vite dev ที่ bind 127.0.0.1 และไม่ใช่ระบบล็อกอินสำหรับเปิดสาธารณะ **ห้ามนำ dev server นี้ไปเปิดผ่าน tunnel หรือเปลี่ยน host เป็น 0.0.0.0 เมื่อมีรูปจริง** Production build ไม่รวมรูปหรือ route นี้ และยังต้องเชื่อม Supabase private storage ก่อนดูรูปออนไลน์ สร้าง private exhibition ที่มี 32 memories พร้อม storage paths เพื่อใช้บนเว็บจริง

ภูเขาไกลใช้ภาพพาโนรามาที่สร้างใหม่ใน `public/images/environment/mountain-panorama.webp` แทนวงภูเขา 3D ลด geometry ระยะไกล เหลือต้นไม้/พื้นใกล้ที่มีระยะจริง ภาพ WebP ประมาณ 104 KB แต่เมื่อถอดรหัสพร้อม mipmaps ใช้ GPU memory ประมาณ 10.7 MiB เครดิตและ prompt อยู่ข้างไฟล์ใน README

ฉากกลางใช้ `forest-ridges.webp` ซึ่งครอปแนวป่าโปร่งใส 3 ชั้นเป็น atlas เดียว 384 KB วางที่ระยะ 90/125/195 เมตร เพิ่ม 576 triangles และ 3 meshes ต่อการวาดฉาก (รวมการวาดซ้ำผ่านกระจก/เงาสะท้อนอาจมากกว่า 3 draw calls) ใช้ aspect 6:1 ของแต่ละแถบตามขนาดจริง ภูเขาใช้ช่วงมุม 90×45 องศาต่อภาพ 2:1 และ mirrored repeat แทนการบีบแกนตั้งเดิม ภาพระยะไกลเป็นฉากลวงตา ไม่ใช่พื้นที่ที่เดินเข้าไปได้

หน้าโหลดแสดงทันทีหลังเข้าประตู: เปิดห้อง → โหลดไฟล์ตามจำนวนจริง → เตรียมแสง/กระจก จึงเปิดจอยเมื่อฉากผ่านการเตรียมแล้ว ไม่ใช้เปอร์เซ็นต์จำลอง ระหว่างรอไปอัลบั้มได้ หาก WebGL หยุดระบบเดิมจะพาไปอัลบั้มพร้อมปุ่มลองใหม่ โมเดล Badtz-Maru ใหม่เป็น geometry 3D แยก 4 วัสดุ ใช้เฉพาะเค้กห้อง 2

`ForestTrees.tsx` แทนต้นไม้ใบสามเหลี่ยมเดิมด้วยกิ่ง 3D ที่แตกแขนง ใบแบบ twig cards มีภาพพื้นผิวใบจริง และเปลือกไม้พร้อม normal map ใช้พื้นผิว CC0 ของ Rico Cilliers / Poly Haven ที่ครอปและจัด atlas ใหม่ ดูเครดิตใน `public/textures/forest/README.md`

ต้นใกล้ใช้โมเดลละเอียดและลมเบา ๆ ต้นกลางลด geometry แต่ขยายพุ่มชดเชย ต้นไกลใช้ภาพต้นไม้ที่ bake ไว้ 4 มุมและเลือกมุมตามผู้ชม แต่ละต้นยังมีตำแหน่งจริงในโลก จึงมี parallax ระหว่างต้นเมื่อเดิน ภาพระยะไกลมีความลึกจำกัดเมื่อเทียบกับโมเดลใกล้

แบ่งป่าเป็นโซน 64 เมตร แต่ละโซนใช้ instancing ร่วมกันและ frustum culling ตาม bounds อัปเดต LOD เมื่อเดินเกิน 0.6 เมตร โดยเว้นอย่างน้อย 0.35 วินาทีและมี hysteresis คงตำแหน่ง/seed เดิม ไม่เปลี่ยนป่าเมื่อกลับจากอัลบั้ม

- เดสก์ท็อป: ต้นละเอียดไม่เกิน 8 ต้น และต้นกลางไม่เกิน 40 ต้น
- มือถือ/coarse pointer/ขอบ canvas สั้น ≤500px: ไม่เกิน 6 และ 28 ต้นตามลำดับ
- เฉพาะต้นใกล้ทอดเงา ส่วนภาพไกลไม่ทอดเงา ลมบนใบเป็น shader เบาและเงาใช้ snapshot ตามระบบเดิม
- texture ใหม่ 4 ไฟล์รวมประมาณ 0.42 MB; GPU memory แบบ RGBA รวม mipmaps ประมาณ 12.3 MiB ยังไม่ใช้ KTX2/WASM เพื่อคง CSP และไม่เพิ่มตัวถอดรหัส

โหมดตรวจภาพในเครื่อง: `/scripts/scene-check.html` → **Forest through glass** / **Mountain window**; ปุ่ม **Phone canvas** ใช้ canvas 402×874 เพื่อทดสอบงบภาพแบบมือถือ ไม่ใช่การจำลอง Safari หรือการทดสอบเครื่องจริง หน้าตรวจนี้ไม่รวมใน production

ข้อความสำหรับตรวจและเขียนใหม่อยู่ใน `private-media/text-review/WEBSITE_TEXTS.md` / `.txt` และรายการดิบพร้อมตำแหน่งโค้ดอยู่ใน `ALL_TEXTS.json` เอกสารนี้ไม่รวมใน Git หรือเว็บสาธารณะ แก้เอกสารแล้วค่อยนำข้อความกลับไปใส่ในเว็บ สคริปต์ `node scripts/export-website-texts.mjs` ส่งออกรายการปัจจุบัน และจะไม่เขียนทับเอกสาร Markdown ที่มีอยู่
