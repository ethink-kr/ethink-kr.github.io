// 인스타그램 카드 뉴스(여러 장, 세로 1080×1350) 만들기
// 사용: NODE_PATH=$(npm root -g) node _tools/ig-cards.cjs <글 파일> [카드 문안 파일]
//   예: node _tools/ig-cards.cjs _items/2026-10-24/1.md            → 문안: _items/2026-10-24/ig-cards-1.yml
//       node _tools/ig-cards.cjs _reads/2026-10-29-hate-speech.md  → 문안: _reads/ig/2026-10-29-hate-speech.yml
// 결과: assets/ig/<이름>-01.jpg, -02.jpg … (뉴스 글 이름은 YYYY-MM-DD-N, 책 글은 파일 이름)
// 필요: playwright, js-yaml (npm i -g playwright js-yaml)
//
// 문안 파일(YAML) 형식 — 8~10장, 카드 한 장에 짧은 문단 3~4개. 사실·수치·사상가 풀이까지 담아 글을 안 읽어도 내용이 잡히게.
//   approved: false            # 재형 님 승인 뒤 true. false면 자동 게시하지 않는다(_tools/ig-post.cjs).
//   cards:
//     - type: cover             # image(저작권이 풀린 그림·사상가 초상·직접 찍은 사진, /assets/art/…), focus(object-position), credit(그림 출처),
//                               # hook(표지에 얹을 질문 한 줄, 25자 안팎), sub(작은 글씨 한 줄, 없으면 제목 뒷부분 또는 책 이름)
//     - type: text              # label(작은 머리글), big(크게 보일 숫자나 말, 선택), big_note, lines(문장 목록), image/focus/credit(그림, 선택)
//                               # lines 안에서 **말**은 굵게(강조색) 보인다. quote 카드는 note(풀이 한두 문장)를 더할 수 있다.
//     - type: quote             # who(사상가 이름, _data/faces.yml의 초상), text, source
//     - type: flow              # label, steps: [[단계, 설명], …] (최대 4)
//     - type: compare           # label, left: {head, text, note}, right: {head, text, note}
//     - type: notes             # label, lines(번호 붙은 짧은 문단 2~4개) — 프로젝트 썸원식 글 카드
//     - type: underline         # 책 글: lines(밑줄 문장 1~2개), page
//     - type: book              # 책 글: 표지(작게)·책 이름·지은이. 표지 출처를 함께 적는다.
//     - type: end               # '이번 주 질문'으로 질문을 다시 보여 주고 댓글을 청한다(ask로 문구 바꾸기)
// 바탕색: 시사 글은 연한 녹색(#eef1ec), 책 글은 종이색(#f4ece0), 편집자 노트는 흰 종이(#fbfaf7)에 남색. 모든 카드 왼쪽 위에 같은 분류 표시.
// 편집자 노트: node _tools/ig-cards.cjs _notes/YYYY-MM-DD-이름.yml  (no: '№1' 같은 번호, caption: 캡션, cards: …, cover는 kicker/hook/sub/by)
const { chromium } = require('playwright');
const yaml = require('js-yaml');
const fs = require('fs'); const path = require('path');
const ROOT = path.join(__dirname, '..');
const [,, postArg, cardsArg] = process.argv;
if (!postArg) { console.error('usage: node _tools/ig-cards.cjs <글 파일> [카드 문안 파일]'); process.exit(1); }
const postPath = path.resolve(postArg);
const src = fs.readFileSync(postPath, 'utf8');
// 편집자 노트: _notes/YYYY-MM-DD-이름.yml 하나에 승인·캡션·카드가 모두 들어 있다(사이트에는 올리지 않는 인스타그램 전용 게시물).
const isNote = postPath.includes(`${path.sep}_notes${path.sep}`) && /\.ya?ml$/.test(postPath);
const fm = isNote ? {} : (yaml.load(src.split(/^---\s*$/m)[1]) || {});
const isRead = postPath.includes(`${path.sep}_reads${path.sep}`);
let name, defCards;
if (isNote) { name = path.basename(postPath).replace(/\.ya?ml$/, ''); defCards = postPath; }
else if (isRead) { name = path.basename(postPath, '.md'); defCards = path.join(ROOT, '_reads', 'ig', name + '.yml'); }
else { const day = path.basename(path.dirname(postPath)); const n = path.basename(postPath, '.md'); name = `${day}-${n}`; defCards = path.join(path.dirname(postPath), `ig-cards-${n}.yml`); }
const cardsPath = path.resolve(cardsArg || defCards);
const doc = yaml.load(fs.readFileSync(cardsPath, 'utf8')) || {};
const cards = doc.cards || [];
const faces = yaml.load(fs.readFileSync(path.join(ROOT, '_data', 'faces.yml'), 'utf8')) || [];
const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const dataUri = p => { const f = path.join(ROOT, p.replace(/^\//, '')); return fs.existsSync(f) ? `data:image/jpeg;base64,${fs.readFileSync(f).toString('base64')}` : ''; };
function face(who) {
  const f = faces.find(x => x.name === who || (x.match || []).some(m => m.replace(/[,·\s]+$/, '') === who));
  if (!f) return '';
  if (f.img) return `<img class="face" src="${dataUri(f.img)}" alt="">`;
  return `<span class="face face-i">${esc(f.initial || who[0])}</span>`;
}
// 테마: 시사 글(뉴스), 책 글, 편집자 노트는 바탕색으로 구분한다.
const T = isNote
  ? { bg: '#fbfaf7', card: '#ffffff', line: '#e3e1db', ink: '#22252b', sub: '#62666e', accent: '#2f4366', deep: '#24324d', hl: '#dfe6f3' }
  : isRead
  ? { bg: '#f4ece0', card: '#fffaf2', line: '#e2d6c4', ink: '#2a211c', sub: '#6b5d52', accent: '#8a3b28', deep: '#5a2619', hl: '#f3d9a4' }
  : { bg: '#eef1ec', card: '#ffffff', line: '#d6ddd6', ink: '#1c2421', sub: '#5b6662', accent: '#23614f', deep: '#173f34', hl: '#f2df74' };
// 모든 카드 왼쪽 위에 같은 자리로 들어가는 분류
const corner = isNote ? `편집자 노트${doc.no ? ' · ' + doc.no : ''}` : isRead ? `윤리로 읽는 책${fm.writer ? ' · ' + fm.writer : ''}` : `시사 윤리${fm.section ? ' · ' + fm.section : ''}`;
const css = `
@import url('https://fonts.googleapis.com/css2?family=Gowun+Batang:wght@400;700&family=IBM+Plex+Sans+KR:wght@400;500;600&family=IBM+Plex+Mono:wght@500&display=swap');
:root{--bg:${T.bg};--card:${T.card};--line:${T.line};--ink:${T.ink};--sub:${T.sub};--ac:${T.accent};--deep:${T.deep};--hl:${T.hl}}
*{box-sizing:border-box;margin:0}
body{width:1080px;height:1350px;background:var(--bg);font-family:"IBM Plex Sans KR",sans-serif;color:var(--ink);position:relative;overflow:hidden}
.wrap{position:absolute;left:84px;right:84px;top:72px;bottom:72px;display:flex;flex-direction:column}
.top{display:flex;justify-content:space-between;align-items:center}
.cat{font-size:26px;font-weight:600;color:#fff;background:var(--ac);padding:10px 20px;border-radius:4px;letter-spacing:.03em}
.page{font-family:"IBM Plex Mono",monospace;font-size:26px;color:var(--sub)}
.label{font-family:"Gowun Batang",serif;font-weight:700;font-size:54px;line-height:1.3;color:var(--ink);margin-top:68px;word-break:keep-all}
.label::after{content:"";display:block;width:72px;height:6px;background:var(--ac);margin-top:24px}
.body{margin-top:40px;display:flex;flex-direction:column;gap:26px}
.line{font-size:37px;line-height:1.62;word-break:keep-all}
.big{font-family:"Gowun Batang",serif;font-weight:700;font-size:150px;line-height:1.15;color:var(--ac);letter-spacing:-.02em}
.bignote{font-size:30px;color:var(--sub);margin-top:14px;line-height:1.5;word-break:keep-all}
.hl{background:linear-gradient(transparent 58%,var(--hl) 58%,var(--hl) 92%,transparent 92%);-webkit-box-decoration-break:clone;box-decoration-break:clone}
.quote{margin-top:44px;background:var(--card);border:2px solid var(--line);border-radius:10px;padding:52px 52px 44px;display:flex;flex-direction:column;gap:34px}
.quote p.t{font-family:"Gowun Batang",serif;font-size:39px;line-height:1.7;word-break:keep-all}
.who{display:flex;align-items:center;gap:22px;font-size:26px;color:var(--sub);line-height:1.5}
.who b{color:var(--ink);font-size:30px;display:block}
.quote .from{margin-top:-30px;text-align:right;font-size:26px;color:var(--sub);line-height:1.5}
.quote .t + .from{margin-top:0}
.face{width:96px;height:96px;border-radius:50%;object-fit:cover;flex:none;border:2px solid var(--line)}
.face-i{display:inline-flex;align-items:center;justify-content:center;background:var(--ac);color:#fff;font-family:"Gowun Batang",serif;font-weight:700;font-size:40px}
.flow{list-style:none;padding:0;margin-top:48px;display:flex;flex-direction:column;gap:20px;counter-reset:s}
.flow li{counter-increment:s;background:var(--card);border:2px solid var(--line);border-radius:10px;padding:24px 30px 24px 104px;position:relative}
.flow li::before{content:counter(s);position:absolute;left:30px;top:24px;width:52px;height:52px;border-radius:50%;background:var(--ac);color:#fff;font-family:"IBM Plex Mono",monospace;font-size:28px;display:grid;place-items:center}
.flow b{font-size:34px;display:block}
.flow span{font-size:28px;color:var(--sub);line-height:1.5;word-break:keep-all;display:block;margin-top:6px}
.cmp{margin-top:52px;display:flex;flex-direction:column;gap:20px}
.cell{background:var(--card);border:2px solid var(--line);border-radius:10px;padding:36px 40px}
.cell.strong{border:4px solid var(--ac)}
.cell h3{font-family:"Gowun Batang",serif;font-size:44px;line-height:1.35}
.cell p{font-size:32px;line-height:1.55;margin-top:12px;word-break:keep-all}
.cell .note{font-size:26px;color:var(--sub)}
.arrow{text-align:center;font-size:44px;color:var(--ac);line-height:1}
.ul{margin-top:56px;display:flex;flex-direction:column;gap:30px}
.ul p{font-family:"Gowun Batang",serif;font-size:46px;line-height:1.72;word-break:keep-all}
.ul .pg{font-family:"IBM Plex Mono",monospace;font-size:26px;color:var(--sub)}
.notes{margin-top:40px;padding-left:0;list-style:none;display:flex;flex-direction:column;gap:30px;counter-reset:n}
.notes li{counter-increment:n;font-size:36px;line-height:1.6;word-break:keep-all;padding-left:64px;position:relative}
.notes li::before{content:counter(n) ".";position:absolute;left:0;font-family:"IBM Plex Mono",monospace;color:var(--ac);font-size:34px}
.notes li b,.line b,.qnote b{color:var(--ac);font-weight:600}
.pic{margin-top:40px;position:relative}
.pic img{width:100%;height:400px;object-fit:cover;border-radius:6px;display:block}
.pic span{position:absolute;right:10px;bottom:10px;font-size:19px;color:#fff;background:rgba(0,0,0,.55);padding:3px 9px;border-radius:3px}
.qnote{font-size:34px;line-height:1.6;margin-top:36px;word-break:keep-all}
.book{margin-top:64px;display:flex;gap:48px;align-items:flex-start}
.book img{width:300px;border-radius:4px;box-shadow:0 8px 24px rgba(0,0,0,.18)}
.book h2{font-family:"Gowun Batang",serif;font-size:54px;line-height:1.3;word-break:keep-all}
.book p{font-size:30px;color:var(--sub);line-height:1.6;margin-top:18px}
.book .credit{font-size:22px;margin-top:28px}
.foot{display:flex;justify-content:space-between;align-items:baseline;margin-top:auto;padding-top:22px;border-top:1px solid var(--line);font-size:24px;color:var(--sub)}
.foot .brand{font-family:"Gowun Batang",serif;font-weight:700;font-size:32px;color:var(--ink)}
.foot .url{font-family:"IBM Plex Mono",monospace;color:var(--ac)}
/* 표지: 위는 그림, 아래는 진한 색 바탕에 질문 한 줄 */
.cv-img{position:absolute;left:0;top:0;width:1080px;height:830px;object-fit:cover}
.cv-top{position:absolute;left:56px;right:56px;top:52px;display:flex;justify-content:space-between;align-items:center}
.cv-top .page{color:#fff;background:rgba(0,0,0,.45);padding:8px 16px;border-radius:4px}
.cv-credit{position:absolute;right:20px;top:796px;font-size:19px;color:#fff;background:rgba(0,0,0,.5);padding:4px 10px;border-radius:3px}
.cv-panel{position:absolute;left:0;right:0;top:830px;bottom:0;background:var(--deep);color:#fff;padding:56px 84px 56px;display:flex;flex-direction:column}
.cv-q{font-family:"Gowun Batang",serif;font-weight:700;font-size:70px;line-height:1.36;word-break:keep-all;letter-spacing:-.01em}
.cv-sub{font-size:28px;line-height:1.5;color:rgba(255,255,255,.78);margin-top:22px;word-break:keep-all}
.cv-foot{display:flex;justify-content:space-between;align-items:baseline;margin-top:auto;font-size:26px;color:rgba(255,255,255,.8)}
.cv-foot .url{font-family:"IBM Plex Mono",monospace;color:rgba(255,255,255,.85)}
.cv-book{position:absolute;left:0;top:0;width:1080px;height:830px;display:grid;place-items:center;padding-top:60px}
.cv-book img{height:600px;border-radius:4px;box-shadow:0 18px 40px rgba(0,0,0,.25)}
/* 편집자 노트 표지: 그림 없이 글로만 */
.nc-kicker{margin-top:150px;font-size:30px;color:var(--ac);font-weight:600;letter-spacing:.04em}
.nc-q{font-family:"Gowun Batang",serif;font-weight:700;font-size:84px;line-height:1.3;letter-spacing:-.01em;word-break:keep-all;margin-top:28px}
.nc-sub{font-size:34px;line-height:1.6;color:var(--sub);margin-top:44px;word-break:keep-all}
.nc-by{font-family:"Gowun Batang",serif;font-size:32px;margin-top:auto;margin-bottom:40px}
/* 마지막 장: 이번 주 질문 */
.wk{margin-top:96px;font-size:30px;font-weight:600;color:var(--ac);letter-spacing:.06em}
.endq{font-family:"Gowun Batang",serif;font-weight:700;font-size:60px;line-height:1.45;word-break:keep-all;margin-top:26px}
.ask{font-size:36px;line-height:1.6;margin-top:56px;word-break:keep-all}
.cta{font-size:30px;line-height:1.7;margin-top:auto;margin-bottom:40px;color:var(--sub)}
.cta b{color:var(--ac)}`;
const total = cards.length;
const head = i => `<div class="top"><span class="cat">${esc(corner)}</span><span class="page">${i + 1} / ${total}</span></div>`;
function page(i, inner, footLeft) {
  return `<div class="wrap">${head(i)}${inner}<div class="foot"><span>${esc(footLeft || '')}</span><span class="url">ethink.kr</span></div></div>`;
}
function render(c, i) {
  const t = c.type;
  if (t === 'cover') {
    const q = c.hook || c.question || fm.question;
    const sub = c.sub || (isRead ? `『${fm.book}』 ${fm.writer}` : (fm.title || '').split(/,\s*/).slice(-1)[0]);
    if (!c.image && isNote) return `<div class="wrap">${head(i)}<p class="nc-kicker">${esc(c.kicker || '')}</p><p class="nc-q">${esc(c.hook || c.title)}</p><p class="nc-sub">${esc(c.sub || '')}</p><p class="nc-by">${esc(c.by || '글 박재형')}</p><div class="foot"><span>옆으로 넘겨 보세요 →</span><span class="url">ethink.kr</span></div></div>`;
    const img = c.image ? `<img class="cv-img" src="${dataUri(c.image)}" style="object-position:${esc(c.focus || '50% 50%')}" alt="">`
      : (isRead && fm.cover ? `<div class="cv-book"><img src="${dataUri(fm.cover)}" alt=""></div>` : ''); // 그림이 없는 책 글은 표지를 종이 바탕 가운데에
    return `${img}<div class="cv-top"><span class="cat">${esc(corner)}</span><span class="page">${i + 1} / ${total}</span></div>${c.credit ? `<span class="cv-credit">${esc(c.credit)}</span>` : ''}<div class="cv-panel"><p class="cv-q">${esc(q)}</p><p class="cv-sub">${esc(sub)}</p><div class="cv-foot"><span>옆으로 넘겨 보세요 →</span><span class="url">ethink.kr</span></div></div>`;
  }
  const pic = c.image ? `<div class="pic"><img src="${dataUri(c.image)}" style="object-position:${esc(c.focus || '50% 50%')}" alt="">${c.credit ? `<span>${esc(c.credit)}</span>` : ''}</div>` : '';
  const rich = l => esc(l).replace(/\*\*(.+?)\*\*/g, '<b>$1</b>'); // **굵게**
  if (t === 'text') return page(i, `<p class="label">${esc(c.label)}</p>${pic}<div class="body">${c.big ? `<div><p class="big">${esc(c.big)}</p>${c.big_note ? `<p class="bignote">${esc(c.big_note)}</p>` : ''}</div>` : ''}${(c.lines || []).map(l => `<p class="line">${rich(l)}</p>`).join('')}</div>`);
  if (t === 'notes') return page(i, `<p class="label">${esc(c.label)}</p>${pic}<ol class="notes">${(c.lines || []).map(l => `<li>${rich(l)}</li>`).join('')}</ol>`);
  if (t === 'quote') return page(i, `<p class="label">${esc(c.label || '사상가의 문장')}</p><div class="quote"><p class="t"${String(c.text).length > 150 ? ' style="font-size:32px"' : String(c.text).length > 95 ? ' style="font-size:35px"' : ''}>${esc(c.text)}</p>${c.who ? `<div class="who">${face(c.who)}<b>${esc(c.who)}</b></div>` : ''}${c.source ? `<p class="from">출처: ${esc(String(c.source).replace(/^출처:\s*/, ''))}</p>` : ''}</div>${c.note ? `<p class="qnote">${rich(c.note)}</p>` : ''}`);
  if (t === 'flow') return page(i, `<p class="label">${esc(c.label || '수업 흐름')}</p><ol class="flow">${(c.steps || []).slice(0, 4).map(([a, b]) => `<li><b>${esc(a)}</b><span>${esc(b)}</span></li>`).join('')}</ol>`);
  if (t === 'compare') {
    const cell = (x, strong) => `<div class="cell${strong ? ' strong' : ''}"><h3>${esc(x.head)}</h3><p>${esc(x.text)}</p>${x.note ? `<p class="note">${esc(x.note)}</p>` : ''}</div>`;
    return page(i, `<p class="label">${esc(c.label)}</p><div class="cmp">${cell(c.left)}<div class="arrow">${esc(c.arrow || '↓')}</div>${cell(c.right, true)}</div>`);
  }
  if (t === 'underline') return page(i, `<p class="label">${esc(c.label || '밑줄 친 문장')}</p><div class="ul">${(c.lines || []).map(l => `<p><span class="hl">${esc(l)}</span></p>`).join('')}${c.page ? `<span class="pg">${esc(c.page)}쪽</span>` : ''}</div>`);
  if (t === 'book') {
    const cov = fm.cover ? dataUri(fm.cover) : '';
    return page(i, `<p class="label">${esc(c.label || '이번에 읽은 책')}</p><div class="book">${cov ? `<img src="${cov}" alt="">` : ''}<div><h2>${esc(fm.book)}</h2><p>${esc(fm.writer)} 지음${fm.translator ? ` · ${esc(fm.translator)} 옮김` : ''}<br>${esc(fm.publisher || '')}</p>${(c.lines || []).map(l => `<p>${esc(l)}</p>`).join('')}${cov && fm.cover_from ? `<p class="credit">표지 이미지: ${esc(fm.cover_from)}</p>` : ''}</div></div>`);
  }
  if (t === 'end') {
    const q = c.question || fm.question;
    return page(i, `<p class="wk">이번 주 질문</p><p class="endq"><span class="hl">${esc(q)}</span></p><p class="ask">${esc(c.ask || '여러분의 생각을 댓글로 남겨 주세요. 한 줄이어도 좋습니다.')}</p><p class="cta">${c.cta ? esc(c.cta).replace(/\n/g, '<br>') : '전문과 수업 활동 예시는<br><b>프로필 링크 · ethink.kr</b>에서 읽을 수 있습니다.'}</p>`, '저장해 두고 다시 읽어 보세요');
  }
  throw new Error('알 수 없는 카드 종류: ' + t);
}
(async () => {
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1080, height: 1350 }, deviceScaleFactor: 1 });
  const dir = path.join(ROOT, 'assets', 'ig'); fs.mkdirSync(dir, { recursive: true });
  for (const f of fs.readdirSync(dir)) if (new RegExp(`^${name}-\\d{2}\\.jpg$`).test(f)) fs.unlinkSync(path.join(dir, f));
  for (let i = 0; i < cards.length; i++) {
    await p.setContent(`<!doctype html><html lang="ko"><head><meta charset="utf-8"><style>${css}</style></head><body>${render(cards[i], i)}</body></html>`);
    await p.waitForTimeout(i === 0 ? 2500 : 600);
    const out = path.join(dir, `${name}-${String(i + 1).padStart(2, '0')}.jpg`);
    await p.screenshot({ path: out, type: 'jpeg', quality: 90 }); console.log(out);
  }
  // 스토리용(1080×1920): 표지 카드를 가운데에 놓고 위아래는 카드 바탕색으로 채운다(스토리 화면 위·아래 가려지는 영역을 피함).
  const sp = await b.newPage({ viewport: { width: 1080, height: 1920 }, deviceScaleFactor: 1 });
  const cover = path.join(dir, `${name}-01.jpg`);
  await sp.setContent(`<!doctype html><html><body style="margin:0;width:1080px;height:1920px;background:${T.bg};display:flex;align-items:center;justify-content:center"><img src="data:image/jpeg;base64,${fs.readFileSync(cover).toString('base64')}" style="width:1080px;height:1350px;display:block"></body></html>`);
  await sp.waitForTimeout(500);
  const sout = path.join(dir, `${name}-story.jpg`); await sp.screenshot({ path: sout, type: 'jpeg', quality: 90 }); console.log(sout);
  await b.close();
})();
