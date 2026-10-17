export type Memory = { id: string; title: string; caption: string; date: string; kind: 'photo' | 'video'; path?: string; posterPath?: string };
export type Chapter = { title: string; english: string; subtitle: string; color: string; memories: Memory[] };
export type Exhibition = { chapters: Chapter[]; letter: string; birthday: string; cakeDecorationPath?: string };

// Only fictional content belongs in this module. Real content comes from RLS-protected storage.
export const sample: Exhibition = {
  birthday: '01012000',
  letter: 'สุขสันต์วันเกิดนะเธอ\n\nขอบคุณที่เข้ามาเป็นความสุขในวันธรรมดาของเรา ไม่ว่าเวลาจะผ่านไปเท่าไร เราก็ยังอยากมีเธออยู่ในเรื่องราวต่อจากนี้\n\nต่อไปนี้ไม่ต้องนับวันรอผ่านหน้าจอแล้วนะ ยินดีต้อนรับกลับบ้าน กลับมาหาอาหารที่คิดถึง สถานที่ที่คุ้นเคย และอ้อมกอดที่รอเธออยู่เสมอ\n\nขอให้ปีนี้ใจดีกับเธอ และขอให้เรามีความทรงจำดี ๆ ด้วยกันอีกมากมาย\n\nด้วยรัก,\nคนที่รอเธอกลับมา',
  chapters: [
    { title: 'จุดเริ่มต้นของเรา', english: 'Where we began', subtitle: 'บางเรื่องราว เริ่มจากการได้เจอใครสักคน', color: '#b88e63', memories: [
      { id: 'first', title: 'ครั้งแรกที่ได้เจอ', caption: 'ตรงนี้จะเป็นรูปแรกของเรา และเรื่องเล่าเล็ก ๆ ของวันนั้น', date: 'THE FIRST HELLO', kind: 'photo' },
      { id: 'smile', title: 'รอยยิ้มที่จำได้เสมอ', caption: 'พื้นที่สำหรับความทรงจำที่ทำให้ยิ้มได้ทุกครั้งที่นึกถึง', date: 'A LITTLE BEGINNING', kind: 'photo' },
      { id: 'first-trip', title: 'ที่ที่เราเคยไปด้วยกัน', caption: 'พื้นที่สำหรับรูปการเดินทางของเรา', date: 'SOMEWHERE WITH YOU', kind: 'photo' },
      { id: 'little-film', title: 'ช่วงเวลาดี ๆ ที่เคยมี', caption: 'พื้นที่สำหรับคลิปสั้นและเสียงหัวเราะของเรา', date: 'THE GOOD WE HAD', kind: 'video' },
      { id: 'ordinary', title: 'วันธรรมดาที่อยากจดจำ', caption: 'พื้นที่สำหรับเรื่องเล่าจากวันธรรมดาของเรา', date: 'A SOFT LITTLE MEMORY', kind: 'photo' },
      { id: 'kept', title: 'เก็บไว้ในความทรงจำ', caption: 'พื้นที่สำหรับภาพอีกใบที่มีความหมาย', date: 'BEAUTIFUL THINGS', kind: 'photo' }] },
    { title: 'วันธรรมดาที่พิเศษ', english: 'Our little moments', subtitle: 'ไม่ต้องเป็นวันสำคัญ แค่มีเธออยู่ด้วยก็พอ', color: '#939e89', memories: [
      { id: 'days', title: 'วันธรรมดาของเรา', caption: 'จะใส่รูปมื้อโปรด ทริปเล็ก ๆ หรือวันอยู่ด้วยกันตรงนี้', date: 'THE EVERYDAY MAGIC', kind: 'photo' },
      { id: 'laugh', title: 'เสียงหัวเราะของเรา', caption: 'พื้นที่สำหรับวิดีโอสั้นที่อยากกลับมาดูด้วยกันอีกครั้ง', date: 'PRESS PLAY, FEEL AGAIN', kind: 'video' }] },
    { title: 'ระหว่างระยะทาง', english: 'An ocean apart', subtitle: 'อยู่คนละฟากฟ้า แต่ยังอยู่ในทุกวันของกันและกัน', color: '#698b99', memories: [
      { id: 'ocean', title: 'ไทย — อเมริกา', caption: 'พื้นที่สำหรับภาพจากช่วงที่เราห่างกัน และเรื่องที่อยากบอก', date: 'SAME SKY, SAME US', kind: 'photo' },
      { id: 'calls', title: 'อีกฝั่งของหน้าจอ', caption: 'พื้นที่สำหรับภาพหรือคลิปที่ช่วยให้ระยะทางดูสั้นลง', date: 'UNTIL WE MEET AGAIN', kind: 'video' }] },
    { title: 'กลับมาหากัน', english: 'Home is with you', subtitle: 'ในที่สุด การรอคอยก็มีปลายทางเป็นเธอ', color: '#ba9c70', memories: [
      { id: 'home', title: 'อ้อมกอดที่รออยู่', caption: 'ตรงนี้เก็บไว้ให้ภาพวันกลับบ้านของเรา', date: 'WELCOME HOME', kind: 'photo' },
      { id: 'future', title: 'เรื่องราวบทต่อไป', caption: 'ยังมีอีกหลายที่ที่อยากไป และอีกหลายวันที่อยากมีเธอ', date: 'TO BE CONTINUED, TOGETHER', kind: 'photo' }] },
    { title: 'แด่เธอ คนพิเศษ', english: 'A wish, just for you', subtitle: 'Happy birthday & welcome home, my love.', color: '#b59469', memories: [] },
  ],
};

export function safePath(value: unknown): string | undefined {
  if (value === undefined || value === '') return undefined;
  if (typeof value !== 'string' || value.length > 240 || !/^[a-zA-Z0-9_./-]+$/.test(value) || value.startsWith('/') || value.split('/').some(p => p === '..' || p === '.' || p === '')) throw new Error('Invalid private media path');
  return value;
}
const str = (x: unknown, max = 1000): string => { if (typeof x !== 'string' || x.length > max) throw new Error('Invalid exhibition text'); return x; };
export function parseExhibition(value: unknown): Exhibition {
  const v = value as Exhibition;
  if (!v || !Array.isArray(v.chapters) || ![2, 5].includes(v.chapters.length) || typeof v.birthday !== 'string' || !/^\d{8}$/.test(v.birthday)) throw new Error('Invalid exhibition');
  return { birthday: v.birthday, letter: str(v.letter, 12000), ...(v.cakeDecorationPath ? { cakeDecorationPath: safePath(v.cakeDecorationPath) } : {}), chapters: v.chapters.map(c => {
    if (!c || !/^#[0-9a-f]{6}$/i.test(c.color) || !Array.isArray(c.memories) || c.memories.length > 6) throw new Error('Invalid chapter');
    return { title: str(c.title, 120), english: str(c.english, 120), subtitle: str(c.subtitle, 250), color: c.color, memories: c.memories.map(m => {
      if (!m || !['photo', 'video'].includes(m.kind)) throw new Error('Invalid memory');
      return { id: str(m.id, 80), title: str(m.title, 120), caption: str(m.caption, 3000), date: str(m.date, 80), kind: m.kind, path: safePath(m.path), posterPath: safePath(m.posterPath) };
    }) };
  }) };
}
