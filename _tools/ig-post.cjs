// 지정한 날짜의 웹 글 카드 뉴스를 인스타그램(@ethink.kr)에 올립니다. 「인스타그램 수동 작업」(ig-manual.yml)에서 재형 님이 지시할 때만 돌아갑니다(자동 게시 없음).
// 필요한 환경 변수: IG_USER_ID(인스타그램 전문가 계정 ID), IG_ACCESS_TOKEN(장기 토큰, 60일).
// 글 폴더 _items/YYYY-MM-DD/N.md 옆에 ig.txt(캡션)와 ig-cards-N.yml(카드 문안, approved: true)이 있고,
// assets/ig/YYYY-MM-DD-N-01.jpg … (카드 뉴스, _tools/ig-cards.cjs로 만듦)이 있어야 합니다. 여러 장이면 캐러셀로 올립니다.
// 같은 글을 두 번 올리지 않도록, 최근 올린 게시물의 캡션 첫 줄과 비교합니다.
// 첫 댓글: 문안 파일에 poll(q, options) 또는 first_comment가 있으면 게시 직후 계정 이름으로 첫 댓글을 답니다
//   (인스타그램 API로는 투표를 만들 수 없어, 투표는 재형 님이 앱에서 직접 답니다. 이 댓글은 번호로 답하게 하는 대체 질문).
//   댓글 관리 권한(instagram_business_manage_comments)이 토큰에 없으면 실패를 기록만 하고 넘어갑니다.
// 사용: node _tools/ig-post.cjs [YYYY-MM-DD]   (날짜를 주지 않으면 어제, Asia/Seoul)
const fs = require('fs'); const path = require('path');
const ROOT = path.join(__dirname, '..');
const SITE = 'https://ethink.kr';
const API = 'https://graph.instagram.com/v21.0';
const USER = process.env.IG_USER_ID, TOKEN = process.env.IG_ACCESS_TOKEN;
if (!USER || !TOKEN) { console.log('IG_USER_ID 또는 IG_ACCESS_TOKEN이 없어 건너뜁니다.'); process.exit(0); }

const kst = new Date(Date.now() + 9 * 3600 * 1000);
const arg = process.argv[2] || '';
// 편집자 노트·GPT 카드 뉴스: node _tools/ig-post.cjs <yml 경로>  (yml 안에 approved·caption·cards, 이미지는 assets/ig/<yml 이름>-01.jpg …)
const noteFile = /\.ya?ml$/.test(arg) ? path.resolve(ROOT, arg) : null;
// 인스타그램 API 캐러셀 최대 장수(메타 개발자 문서: 이미지·동영상 20개까지)
const MAX_CARDS = 20;
const day = noteFile ? '' : (arg || new Date(kst.getTime() - 24 * 3600 * 1000).toISOString().slice(0, 10));
const dir = noteFile ? path.dirname(noteFile) : path.join(ROOT, '_items', day);
if (!fs.existsSync(noteFile || dir)) { console.log(`${arg || day}: 올릴 글이 없습니다.`); process.exit(0); }

const sleep = ms => new Promise(r => setTimeout(r, ms));
async function api(p, opt = {}) {
  const u = new URL(API + p); u.searchParams.set('access_token', TOKEN);
  const r = await fetch(u, opt); const j = await r.json().catch(() => ({}));
  if (!r.ok || j.error) throw new Error(`${p}: ${JSON.stringify(j.error || j)}`);
  return j;
}
function firstLine(s) { return String(s || '').split('\n').map(x => x.trim()).find(Boolean) || ''; }

// 첫 댓글 끝에 붙는 팔로우 안내(문안 파일에 follow: false를 쓰면 뺍니다).
const FOLLOW = '에씽크(@ethink.kr)를 팔로우하시면\n수업 아이디어와 인사이트를 얻으실 수 있어요.';
// 첫 댓글 문구: first_comment가 있으면 그대로, 없으면 poll(q, options)로 만듭니다. 끝에 팔로우 안내를 붙입니다.
function commentText(doc) {
  if (!doc) return '';
  let body = '';
  if (doc.first_comment) body = String(doc.first_comment).trim();
  else {
    const p = doc.poll; if (!p || !p.q || !Array.isArray(p.options) || !p.options.length) return '';
    body = [`${p.q}`, ...p.options.map((o, i) => `${i + 1}. ${o}`), '', p.ask || '번호와 이유를 한 줄로 댓글에 남겨 주세요!'].join('\n');
  }
  return doc.follow === false ? body : `${body}\n\n${FOLLOW}`;
}
// 캡션 정리(2026-11-12 재형 님 지시): 인스타그램에는 '에씽크'만 드러내고 글쓴이 이름(박재형)은 쓰지 않는다.
// 첫 댓글(투표)과 같은 문장은 캡션에서 뺀다. 캡션과 댓글이 겹치지 않게 한다.
function tidyCaption(caption, comment) {
  let s = String(caption || '').replace(/박재형\s*[,·]\s*/g, '').replace(/박재형\s*/g, '');
  const dup = new Set(String(comment || '').split('\n').map(x => x.trim()).filter(x => x.length > 1));
  if (dup.size) s = s.split('\n').filter(l => !dup.has(l.trim())).join('\n');
  return s.replace(/\n{3,}/g, '\n\n').trim();
}
// 게시물을 올린 직후 첫 댓글을 답니다. 실패해도 게시물은 이미 올라간 것이므로 기록만 하고 넘어갑니다.
async function postFirstComment(mediaId, text, label) {
  if (!text) return;
  try {
    await sleep(5000);
    const u = new URL(`${API}/${mediaId}/comments`); u.searchParams.set('access_token', TOKEN);
    const r = await fetch(u, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ message: text }) });
    const j = await r.json().catch(() => ({}));
    if (!r.ok || j.error) throw new Error(JSON.stringify(j.error || j));
    console.log(`${label}: 첫 댓글을 달았습니다. 댓글 ID ${j.id}`);
  } catch (e) { console.log(`${label}: 첫 댓글 실패(게시물은 올라갔습니다) — ${String(e.message).slice(0, 300)}`); }
}
// 게시물을 올린 직후 표지를 스토리(9:16)로도 올립니다. 스토리가 실패해도 게시물은 이미 올라간 것이므로 오류만 기록하고 넘어갑니다.
async function postStory(name, label) {
  const url = `${SITE}/assets/ig/${name}-story.jpg`;
  try {
    let ok = false;
    for (let i = 0; i < 6; i++) { ok = await fetch(url, { method: 'HEAD' }).then(r => r.ok).catch(() => false); if (ok) break; await sleep(20000); }
    if (!ok) { console.log(`${label}: 스토리 이미지(${name}-story.jpg)가 없어 스토리는 건너뜁니다.`); return; }
    const c = await api(`/${USER}/media`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ image_url: url, media_type: 'STORIES' }) });
    for (let i = 0; i < 24; i++) { const st = await api(`/${c.id}?fields=status_code`); if (st.status_code === 'FINISHED') break; if (st.status_code === 'ERROR') throw new Error('스토리 컨테이너 오류'); await sleep(5000); }
    const pub = await api(`/${USER}/media_publish`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ creation_id: c.id }) });
    console.log(`${label}: 스토리에도 올렸습니다. ID ${pub.id}`);
  } catch (e) { console.log(`${label}: 스토리 게시 실패(게시물은 올라갔습니다) — ${e.message}`); }
}

async function publish(imgs, caption, label) {
  let ok = false;
  for (let i = 0; i < 10; i++) {
    const rs = await Promise.all(imgs.map(u => fetch(u, { method: 'HEAD' }).then(r => r.ok).catch(() => false)));
    if (rs.every(Boolean)) { ok = true; break; } await sleep(30000);
  }
  if (!ok) { console.log(`${label}: 카드 이미지를 아직 받을 수 없습니다.`); return null; }
  const post = async body => api(`/${USER}/media`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  const waitReady = async id => { for (let i = 0; i < 24; i++) { const st = await api(`/${id}?fields=status_code`); if (st.status_code === 'FINISHED') return; if (st.status_code === 'ERROR') throw new Error(`${label}: 컨테이너 오류`); await sleep(5000); } };
  let c;
  if (imgs.length === 1) c = await post({ image_url: imgs[0], caption });
  else { const kids = []; for (const u of imgs) { const k = await post({ image_url: u, is_carousel_item: true }); await waitReady(k.id); kids.push(k.id); } c = await post({ media_type: 'CAROUSEL', children: kids.join(','), caption }); }
  await waitReady(c.id);
  const pub = await api(`/${USER}/media_publish`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ creation_id: c.id }) });
  return pub.id;
}
async function postNote(file, done) {
  const yaml = require('js-yaml');
  const doc = yaml.load(fs.readFileSync(file, 'utf8')) || {};
  const name = path.basename(file).replace(/\.ya?ml$/, '');
  if (doc.approved !== true) { console.log(`${name}: 아직 승인되지 않아(approved: false) 건너뜁니다.`); return 0; }
  const caption = tidyCaption(doc.caption, commentText(doc));
  if (!caption) { console.log(`${name}: caption이 없어 건너뜁니다.`); return 0; }
  if (done.has(firstLine(caption))) { console.log(`${name}: 이미 올라간 노트입니다.`); return 0; }
  const count = (doc.cards || []).length;
  if (!count || count > MAX_CARDS) { console.log(`${name}: 카드 수(${count})가 1~${MAX_CARDS}장이 아닙니다.`); return 0; }
  const imgs = Array.from({ length: count }, (_, i) => `${SITE}/assets/ig/${name}-${String(i + 1).padStart(2, '0')}.jpg`);
  const id = await publish(imgs, caption, name);
  if (id) { console.log(`${name}: 인스타그램에 올렸습니다. 게시물 ID ${id} — ${doc.kind || '편집자 노트'}`); await postFirstComment(id, commentText(doc), name); await postStory(name, name); }
  return id ? 1 : 0;
}
(async () => {
  const recent = await api(`/${USER}/media?fields=caption,timestamp&limit=10`);
  const done = new Set((recent.data || []).map(m => firstLine(m.caption)));
  const files = noteFile ? [path.basename(noteFile)] : fs.readdirSync(dir).filter(f => /^\d+\.md$/.test(f)).sort((a, b) => parseInt(a) - parseInt(b));
  let posted = 0;
  for (const f of files) {
    if (noteFile) { posted += await postNote(noteFile, done); continue; }
    const n = f.replace('.md', '');
    const md = fs.readFileSync(path.join(dir, f), 'utf8');
    const fm = md.split('---')[1] || '';
    const title = (fm.match(/^title:\s*(.+)$/m) || [])[1]?.trim().replace(/^["']|["']$/g, '') || '';
    const dateLine = (fm.match(/^date:\s*(.+)$/m) || [])[1] || '';
    const when = new Date(dateLine.trim().replace(' ', 'T').replace(/\s*\+0900$/, '+09:00'));
    if (!isNaN(when) && when.getTime() > Date.now()) { console.log(`${day}/${n}: 아직 발행 시각 전입니다(${dateLine.trim()}).`); continue; }
    const capPath = fs.existsSync(path.join(dir, `ig-${n}.txt`)) ? path.join(dir, `ig-${n}.txt`) : path.join(dir, 'ig.txt');
    if (!fs.existsSync(capPath)) { console.log(`${day}/${n}: 캡션 파일(ig.txt)이 없어 건너뜁니다.`); continue; }
    const caption = tidyCaption(fs.readFileSync(capPath, 'utf8'), '');
    if (done.has(firstLine(caption))) { console.log(`${day}/${n}: 이미 올라간 글입니다.`); continue; }
    // 카드 뉴스 문안(ig-cards-N.yml)에 approved: true가 있어야 올린다(재형 님 승인).
    const cardsPath = path.join(dir, `ig-cards-${n}.yml`);
    if (!fs.existsSync(cardsPath)) { console.log(`${day}/${n}: 카드 문안(ig-cards-${n}.yml)이 없어 건너뜁니다(승인 전).`); continue; }
    const cardsSrc = fs.readFileSync(cardsPath, 'utf8');
    if (!/^approved:\s*true\s*$/m.test(cardsSrc)) { console.log(`${day}/${n}: 카드 뉴스가 아직 승인되지 않아(approved: false) 건너뜁니다.`); continue; }
    const count = (cardsSrc.match(/^\s*-\s*type:/gm) || []).length;
    if (!count || count > MAX_CARDS) { console.log(`${day}/${n}: 카드 수(${count})가 1~${MAX_CARDS}장이 아니어서 건너뜁니다.`); continue; }
    const imgs = Array.from({ length: count }, (_, i) => `${SITE}/assets/ig/${day}-${n}-${String(i + 1).padStart(2, '0')}.jpg`);
    let ok = false;
    for (let i = 0; i < 10; i++) {
      const rs = await Promise.all(imgs.map(u => fetch(u, { method: 'HEAD' }).then(r => r.ok).catch(() => false)));
      if (rs.every(Boolean)) { ok = true; break; } await sleep(30000);
    }
    if (!ok) { console.log(`${day}/${n}: 카드 이미지를 아직 받을 수 없습니다. 다음 실행에서 다시 시도합니다.`); continue; }
    const post = async body => api(`/${USER}/media`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    const waitReady = async id => {
      for (let i = 0; i < 24; i++) {
        const st = await api(`/${id}?fields=status_code`);
        if (st.status_code === 'FINISHED') return;
        if (st.status_code === 'ERROR') throw new Error(`${day}/${n}: 컨테이너 오류`);
        await sleep(5000);
      }
    };
    let c;
    if (count === 1) { c = await post({ image_url: imgs[0], caption }); }
    else {
      const kids = [];
      for (const u of imgs) { const k = await post({ image_url: u, is_carousel_item: true }); await waitReady(k.id); kids.push(k.id); }
      c = await post({ media_type: 'CAROUSEL', children: kids.join(','), caption });
    }
    await waitReady(c.id);
    const pub = await api(`/${USER}/media_publish`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ creation_id: c.id }) });
    console.log(`${day}/${n}: 인스타그램에 올렸습니다. 게시물 ID ${pub.id} — ${title}`);
    let cardsDoc = null; try { cardsDoc = require('js-yaml').load(cardsSrc); } catch (e) { console.log(`${day}/${n}: 문안 파일을 읽지 못해 첫 댓글은 건너뜁니다 — ${e.message}`); }
    await postFirstComment(pub.id, commentText(cardsDoc), `${day}/${n}`);
    await postStory(`${day}-${n}`, `${day}/${n}`);
    posted++;
  }
  // 장기 토큰 갱신(발급 24시간 뒤부터 가능, 60일 연장). 새 토큰은 GH_PAT가 있을 때만 저장소 비밀에 다시 넣습니다.
  try {
    const r = await api(`/refresh_access_token?grant_type=ig_refresh_token`);
    if (r.access_token) {
      fs.writeFileSync(path.join(process.env.RUNNER_TEMP || '/tmp', 'ig_token_new'), r.access_token);
      console.log(`토큰을 갱신했습니다(${Math.round(r.expires_in / 86400)}일 남음).`);
    }
  } catch (e) { console.log('토큰 갱신은 건너뜁니다: ' + e.message.slice(0, 160)); }
  console.log(`올린 글 ${posted}편.`);
})().catch(e => { console.error(e.message); process.exit(1); });
