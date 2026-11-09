"use strict";
/* ============================================================
   윤리 클립아트 생성기 · Ethink  (app.js)
   - 형태: 사상가 대화 / 가상 인터뷰 / 벤다이어그램 / 상호 비판 / 순서도 / XYZ / 두루마리 / 신문 칼럼
   - 도식 엔진은 「길벗 도덕·윤리 출제 클립아트 스튜디오 v1.0.0」의 SVG 렌더러를 옮겨 왔습니다.
   ============================================================ */
const $=s=>document.querySelector(s);
const NS='http://www.w3.org/2000/svg';
const STORE='ethink-clipart-v1', GAL='ethink-clipart-gallery-v1', GUIDE='ethink-clipart-guide-off';
const PACK='packs/thinkers/';
const OFF=window.__ETHINK_OFFLINE||null;
const purl=f=>(OFF&&OFF.imgs&&OFF.imgs[f])?OFF.imgs[f]:PACK+f;
const FAM={
  gothic:"'HY중고딕','HYGothic-Medium','맑은 고딕','Malgun Gothic','Apple SD Gothic Neo','Noto Sans KR','Noto Sans CJK KR','Nanum Gothic',sans-serif",
  myeongjo:"'HY신명조','HYSinMyeongJo-Medium','신명조','바탕','Batang','AppleMyungjo','Noto Serif KR','Noto Serif CJK KR','Nanum Myeongjo',serif"
};
const LAT="'Times New Roman',Times,'Noto Serif','Noto Serif CJK KR',serif";
const ko=()=>FAM[S.font]||FAM.gothic;
const clone=o=>JSON.parse(JSON.stringify(o));
const esc=s=>String(s==null?'':s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const r1=n=>Math.round(n*10)/10;
const FS=()=>Number(S.fscale)||1;

/* ---------- 자산 ---------- */
let ASSETS=[],AMAP={};
async function loadAssets(){
  try{const j=OFF&&OFF.json?OFF.json:await (await fetch('packs/thinkers.json')).json();ASSETS=j.items;ASSETS.forEach(a=>AMAP[a.id]=a);}
  catch(e){toast('인물 삽화 목록을 불러오지 못했습니다.');}
}
const aName=a=>a?(a.names.join('·')||'인물'):'';
const aSrc=a=>a?a.src.replace(/-/g,'·'):'';

/* ---------- 형태 설명 ---------- */
const FORM_DESC={
  dialog:'사상가(갑·을·병)가 나란히 서서 말풍선으로 자기 입장을 말하는 형태. 한 명의 말풍선을 [가]로 비울 수 있습니다. 생윤·윤사 기출에서 가장 흔한 자료 제시 방식입니다.',
  interview:'질문자와 사상가의 문답을 글상자에 적고 오른쪽에 사상가 초상을 두는 가상 인터뷰 형태입니다.',
  venn:'두세 사상가의 입장을 원의 겹침으로 나타내는 벤다이어그램. 영역 기호(A·B·C…)와 범례가 자동으로 만들어집니다.',
  critique:'사상가끼리 서로 비판하는 방향을 화살표로 나타내는 상호 비판 도식. 범례와 예시 상자를 넣을 수 있습니다.',
  flow:'출발 조건에서 판단 기호(A·B…)를 거쳐 사상가의 입장에 이르는 순서도. 실선은 ‘예’, 점선은 ‘아니요’입니다.',
  xyz:'세 축(X·Y·Z)의 높낮이로 사상가 입장을 꼭짓점에 놓는 XYZ 좌표 도식입니다.',
  scroll:'원전·사료 인용문을 두루마리 양식에 담는 문서형. 출처 줄과 탐구 질문을 함께 넣을 수 있습니다.',
  column:'신문 칼럼·기사 양식. 신문 이름·날짜·제목·본문(1단 또는 2단)으로 구성합니다.'
};

/* ---------- 상태 ---------- */
function defaults(){return{
  tab:'dialog', font:'gothic', fscale:1, zoom:'fit', fname:'윤리_자료', qno:'',
  dialog:{slots:[{id:'p021',flip:false},{id:'p022',flip:false}],
    speakers:[{label:'갑',text:'사람은 누구나 남의 고통을 차마 보지 못하는 마음을 지니고 태어납니다. 이 마음을 넓혀 가는 것이 곧 도덕의 길입니다.',bub:null},
              {label:'을',text:'[가]',bub:null}],
    labels:'circle', figH:250, fs:22, title:'', board:false, table:false, equal:true},
  interview:{id:'p070',title:'에피쿠로스와의 가상 인터뷰',fs:21,
    lines:[{who:'질문자',text:'선생님께서 말씀하시는 쾌락은 무엇입니까?'},{who:'사상가',text:'[가]'},{who:'질문자',text:'그렇다면 죽음은 두려워할 일입니까?'},{who:'사상가',text:'죽음은 우리에게 아무것도 아닙니다. 우리가 있을 때 죽음은 없고, 죽음이 왔을 때 우리는 없기 때문입니다.'}]},
  venn:{n:3, shape:'circle', names:['갑','을','병'],
    labels3:{a:'A',b:'',c:'B',ab:'',ac:'',bc:'C',abc:'D'},
    labels2:{a:'A',ab:'B',b:'C'},
    pats:{}, hatch:true, gap:7, legend:true, lstyle:'gwa', lover:''},
  critique:{n:3, names:['갑','을','병'],
    on:{A:true,B:true,C:true,D:true,E:true,F:true},
    letters:{A:'A',B:'B',C:'C',D:'D',E:'E',F:'F'}, legend:true, example:true},
  flow:{tpl:'t2a', start:'사상가 갑, 을의\n입장을 탐구한다.', letters:['A','B','C','D'],
    res:['갑의 입장','을의 입장','병의 입장'], yes:'예', no:'아니요', legend:true},
  xyz:{v:{'001':'ㄱ','111':'ㄴ','101':'ㄷ','000':'ㄹ','010':'ㅁ'}, style:'circle',
    axes:['X','Y','Z'], hi:'높음', lo:'낮음', box:false, boxText:'· X :\n· Y :\n· Z :'},
  scroll:{src:'- 출처: 『논어』 「안연」',text:'자기를 이기고 예로 돌아가는 것이 인(仁)이다. 하루라도 자기를 이기고 예로 돌아가면 천하가 인으로 돌아갈 것이다. 인을 행하는 것은 자기에게 달린 것이지 남에게 달린 것이겠는가.',q:'1. 글쓴이가 말하는 인(仁)의 실천 방법은 무엇인가?\n2. 이 글의 주장이 오늘날 우리에게 주는 시사점은?',fs:22,width:860},
  column:{paper:'○○ 신문',date:'20△△년 △△월 △△일',kind:'칼럼',head:'[가], 공동체를 지탱하는 힘',body:'우리는 흔히 정의를 개인의 권리 문제로만 생각한다. 그러나 (가)의 관점에서 보면 정의는 공동체가 공유하는 선(善)에 대한 합의 없이는 성립할 수 없다. 개인은 공동체의 이야기 속에서 자기 정체성을 형성하는 존재이기 때문이다.',cols:2,fs:21,width:900},
  ov:{}, offs:{}
}}
let S=defaults();
try{const raw=localStorage.getItem(STORE);if(raw)S=Object.assign(defaults(),JSON.parse(raw))}catch(e){}
function merge(){const d=defaults();for(const k of Object.keys(d)){if(typeof d[k]==='object'&&d[k]&&!Array.isArray(d[k]))S[k]=Object.assign(d[k],S[k]||{})}
  for(const t of Object.keys(FORM_DESC)){if(!S.ov[t])S.ov[t]=[];if(!S.offs[t])S.offs[t]={}}}
merge();
let saveT=0;
function saveNow(){clearTimeout(saveT);try{localStorage.setItem(STORE,JSON.stringify(S))}catch(e){}
  const d=new Date();$('#autosave').textContent='자동 저장됨 '+d.toLocaleTimeString('ko-KR',{hour:'numeric',minute:'2-digit'})}
function save(){clearTimeout(saveT);saveT=setTimeout(saveNow,300)}
window.addEventListener('pagehide',saveNow);document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='hidden')saveNow()});
function toast(m){const t=$('#toast');t.textContent=m;t.classList.add('show');clearTimeout(t._t);t._t=setTimeout(()=>t.classList.remove('show'),2600)}
const cur=()=>S.tab;

/* ---------- 실행 취소 ---------- */
const UNDO=[],REDO=[];let lastSnap=JSON.stringify(S);
function snap(){const now=JSON.stringify(S);if(now===lastSnap)return;UNDO.push(lastSnap);if(UNDO.length>60)UNDO.shift();REDO.length=0;lastSnap=now;updUndo()}
function updUndo(){$('#bUndo').disabled=!UNDO.length;$('#bRedo').disabled=!REDO.length}
function undo(){if(!UNDO.length)return;REDO.push(JSON.stringify(S));S=Object.assign(defaults(),JSON.parse(UNDO.pop()));merge();lastSnap=JSON.stringify(S);sel=-1;renderAll();updUndo()}
function redo(){if(!REDO.length)return;UNDO.push(JSON.stringify(S));S=Object.assign(defaults(),JSON.parse(REDO.pop()));merge();lastSnap=JSON.stringify(S);sel=-1;renderAll();updUndo()}

/* ---------- 글자 측정 ---------- */
const mctx=document.createElement('canvas').getContext('2d');
function tw(s,fs,fam,bold){mctx.font=(bold?'bold ':'')+fs+'px '+fam;return mctx.measureText(String(s)).width}
function hasBatchim(w){const ch=String(w).trim().slice(-1);const c=ch.charCodeAt(0);if(c>=0xAC00&&c<=0xD7A3)return (c-0xAC00)%28!==0;
  if(/[A-Za-z]/.test(ch))return /[LMNRlmnr]/.test(ch);if(/[0-9]/.test(ch))return /[013678]/.test(ch);return true}
const jGwa=w=>w+(hasBatchim(w)?'과':'와');
const jI=w=>w+(hasBatchim(w)?'이':'가');
const jNeun=w=>w+(hasBatchim(w)?'은':'는');
function wrap(text,maxW,fs,fam,bold){
  const out=[];
  for(const para of String(text).split('\n')){
    if(!para){out.push('');continue}
    let line='';
    for(const ch of para){const t=line+ch;
      if(line&&tw(t,fs,fam,bold)>maxW){const sp=line.lastIndexOf(' ');
        if(ch!==' '&&sp>0){out.push(line.slice(0,sp));line=line.slice(sp+1)+ch}else{out.push(line);line=ch===' '?'':ch}}
      else line=t}
    out.push(line)}
  return out;
}
function txt(x,y,s,o={}){
  const fs=o.fs||22,fam=o.fam||ko(),anchor=o.anchor||'middle',lh=fs*(o.lh||1.3);
  const lines=String(s).split('\n');const y0=y-(lines.length-1)*lh/2;
  const halo=o.halo?` stroke="#fff" stroke-width="${o.halo}" stroke-linejoin="round" paint-order="stroke"`:'';
  const wt=o.bold?' font-weight="bold"':'';
  return `<text x="${r1(x)}" y="${r1(y0)}" font-size="${fs}" font-family="${esc(fam)}" text-anchor="${anchor}" dominant-baseline="central" fill="#000"${wt}${halo}>`+
    lines.map((l,i)=>`<tspan x="${r1(x)}" ${i?`dy="${r1(lh)}"`:''}>${esc(l)||' '}</tspan>`).join('')+`</text>`;
}
/* 표기법이 들어간 글: [가] 네모 빈칸, [ ] 빈 네모, _밑줄_ */
function tokenize(text){
  const toks=[];let ul=false;const s=String(text);
  for(let i=0;i<s.length;i++){const c=s[i];
    if(c==='['){const j=s.indexOf(']',i);if(j>0&&j-i<=6){const inner=s.slice(i+1,j).trim();toks.push({c:inner?`(${inner})`:'　　',box:true,ul});i=j;continue}}
    if(c==='_'){ul=!ul;continue}
    toks.push({c,ul})}
  return toks;
}
function wrapRich(text,maxW,fs,fam){
  const lines=[];
  for(const para of String(text).split('\n')){
    const toks=tokenize(para);let line=[],w=0;
    const W=t=>t.box?tw(t.c,fs,fam)+12:tw(t.c,fs,fam);
    for(const t of toks){const tw_=W(t);
      if(line.length&&w+tw_>maxW){
        let sp=-1;for(let k=line.length-1;k>=0;k--){if(line[k].c===' '&&!line[k].box){sp=k;break}}
        if(t.c!==' '&&sp>0){const rest=line.slice(sp+1);lines.push(line.slice(0,sp));line=rest.concat([t]);w=line.reduce((a,x)=>a+W(x),0)}
        else{lines.push(line);line=t.c===' '?[]:[t];w=t.c===' '?0:tw_}}
      else{line.push(t);w+=tw_}}
    lines.push(line)}
  return lines.map(L=>{const segs=[];for(const t of L){const last=segs[segs.length-1];
    if(last&&!t.box&&!last.box&&last.ul===t.ul)last.c+=t.c;else segs.push({c:t.c,box:!!t.box,ul:!!t.ul})}return segs});
}
function richSvg(lines,x,y,fs,fam,o={}){
  const lh=fs*(o.lh||1.5),anchor=o.anchor||'start';let s='';
  lines.forEach((segs,i)=>{const cy=y+lh*i+lh/2;
    const ws=segs.map(t=>t.box?tw(t.c,fs,fam)+12:tw(t.c,fs,fam));const total=ws.reduce((a,b)=>a+b,0);
    let cx=anchor==='middle'?x-total/2:anchor==='end'?x-total:x;
    segs.forEach((t,k)=>{const w=ws[k];
      if(t.box){s+=`<rect x="${r1(cx+2)}" y="${r1(cy-fs*0.68)}" width="${r1(w-4)}" height="${r1(fs*1.36)}" fill="#fff" stroke="#000" stroke-width="1.3"/>`;
        s+=`<text x="${r1(cx+w/2)}" y="${r1(cy)}" font-size="${fs}" font-family="${esc(fam)}" text-anchor="middle" dominant-baseline="central" fill="#000">${esc(t.c)}</text>`}
      else{s+=`<text x="${r1(cx)}" y="${r1(cy)}" font-size="${fs}" font-family="${esc(fam)}" dominant-baseline="central" fill="#000"${o.bold?' font-weight="bold"':''} xml:space="preserve">${esc(t.c)}</text>`;
        if(t.ul)s+=`<line x1="${r1(cx)}" y1="${r1(cy+fs*0.62)}" x2="${r1(cx+w)}" y2="${r1(cy+fs*0.62)}" stroke="#000" stroke-width="1.2"/>`}
      cx+=w})});
  return s;
}
function D(key,inner){const o=(S.offs[cur()]||{})[key]||{dx:0,dy:0};return `<g data-k="${key}" transform="translate(${r1(o.dx)} ${r1(o.dy)})">${inner}</g>`}
function circ(x,y,t,fs=20,r){r=r||fs*0.68;return `<circle cx="${r1(x)}" cy="${r1(y)}" r="${r1(r)}" fill="#fff" stroke="#000" stroke-width="1.3"/>`+txt(x,y+0.5,t,{fs,fam:ko()})}
function legendBox(title,rows,fs=19){
  const pad=12,lh=fs*1.5;let maxw=0;
  rows.forEach(r=>{let w=r.icon?r.icon.w+6:0;for(const [t,f] of r.parts)w+=tw(t,fs,f||ko());maxw=Math.max(maxw,w)});
  const tW=tw(title,fs,ko())+16;const W=Math.max(maxw+pad*2,tW+40),H=rows.length*lh+pad*2+4;
  let s=`<rect x="0" y="0" width="${r1(W)}" height="${r1(H)}" fill="#fff" stroke="#000" stroke-width="1.3"/>`;
  s+=`<rect x="${r1(W/2-tW/2)}" y="-3" width="${r1(tW)}" height="6" fill="#fff"/>`+txt(W/2,0,title,{fs});
  rows.forEach((r,i)=>{const y=pad+4+lh*i+lh/2;let x=pad;
    if(r.icon){s+=`<g transform="translate(${r1(x)} ${r1(y)})">${r.icon.svg}</g>`;x+=r.icon.w+6}
    s+=`<text x="${r1(x)}" y="${r1(y)}" font-size="${fs}" dominant-baseline="central" fill="#000">`+r.parts.map(([t,f])=>`<tspan font-family="${esc(f||ko())}">${esc(t)}</tspan>`).join('')+`</text>`});
  return {svg:s,w:W,h:H};
}
const ARROW_DEF=`<marker id="ah" viewBox="0 0 12 10" refX="11" refY="5" markerWidth="12" markerHeight="10" markerUnits="userSpaceOnUse" orient="auto-start-reverse"><path d="M0,1.2 L12,5 L0,8.8 z" fill="#000"/></marker>`;

/* ============================================================
   사상가 대화
   ============================================================ */
const W0=1000;
function speakersOf(d){let n=0;d.slots.forEach(s=>{const a=AMAP[s.id];n+=a?a.figures:1});return Math.max(1,n)}
function syncSpeakers(d){const n=speakersOf(d);const L=['갑','을','병','정','무','기'];
  while(d.speakers.length<n)d.speakers.push({label:L[d.speakers.length]||'',text:'',bub:null});
  while(d.speakers.length>n)d.speakers.pop()}
function imgTag(a,x,y,w,h,flip){const href=purl(a.id+'.webp');
  const t=flip?` transform="translate(${r1(2*x+w)} 0) scale(-1 1)"`:'';
  return `<image href="${href}" x="${r1(x)}" y="${r1(y)}" width="${r1(w)}" height="${r1(h)}" preserveAspectRatio="xMidYMax meet"${t}/>`}
/* 말풍선: 둥근 사각 + 꼬리 */
function bubblePath(b,tip){
  const {x,y,w,h}=b;const rx=12;
  let s=`<rect x="${r1(x)}" y="${r1(y)}" width="${r1(w)}" height="${r1(h)}" rx="${rx}" fill="#fff" stroke="#000" stroke-width="1.6"/>`;
  const cx=x+w/2,cy=y+h/2;const dx=tip.x-cx,dy=tip.y-cy;
  const bw=24;let bx1,by1,bx2,by2;
  const inside=tip.x>x&&tip.x<x+w&&tip.y>y&&tip.y<y+h;if(inside)return s;
  if(Math.abs(dx)/(w/2)>Math.abs(dy)/(h/2)){const sx=dx>0?x+w:x;const ty=Math.max(y+rx+bw/2,Math.min(y+h-rx-bw/2,tip.y>y+h?y+h-rx-bw/2:tip.y<y?y+rx+bw/2:tip.y));bx1=sx;by1=ty-bw/2;bx2=sx;by2=ty+bw/2;const ins=dx>0?-1.2:1.2;bx1+=ins;bx2+=ins}
  else{const sy=dy>0?y+h:y;const tx=Math.max(x+rx+bw/2,Math.min(x+w-rx-bw/2,tip.x));bx1=tx-bw/2;by1=sy;bx2=tx+bw/2;by2=sy;const ins=dy>0?-1.2:1.2;by1+=ins;by2+=ins}
  s+=`<path d="M${r1(bx1)} ${r1(by1)} L${r1(tip.x)} ${r1(tip.y)} L${r1(bx2)} ${r1(by2)}" fill="#fff" stroke="#000" stroke-width="1.6" stroke-linejoin="round"/>`;
  return s;
}
function dialogLayout(){
  const d=S.dialog;syncSpeakers(d);const fs=Math.round(d.fs*FS());const fam=ko();
  const M=24,figH=d.figH;const slots=d.slots.map(s=>({...s,a:AMAP[s.id]})).filter(s=>s.a);
  const units=slots.reduce((a,s)=>a+s.a.figures,0)||1;
  const avail=W0-M*2,uw=avail/units;
  const figs=[],anchors=[];let x=M;
  slots.forEach(s=>{const sw=uw*s.a.figures;let w=sw*0.94,h=w*s.a.h/s.a.w;if(h>figH){h=figH;w=h*s.a.w/s.a.h}
    const fx=x+(sw-w)/2;figs.push({a:s.a,flip:s.flip,x:fx,w,h,slotX:x,slotW:sw});
    for(let k=0;k<s.a.figures;k++){const ax=fx+w*(s.a.figures===1?0.5:(k===0?0.26:0.74));anchors.push({x:s.flip&&s.a.figures===2?fx+w*(k===0?0.74:0.26):ax,slotX:x+uw*k,slotW:uw})}
    x+=sw});
  // 말풍선 기본값
  const pre=d.speakers.map((sp,i)=>{const an=anchors[i]||{x:W0/2,slotX:M,slotW:avail};const w0=Math.min(an.slotW-14,460);const b=sp.bub||{};const w=b.w||w0;
    const lines=wrapRich(sp.text||' ',w-28,fs,fam);return {an,w0,w,lines,h0:Math.max(64,lines.length*fs*1.5+24)}});
  const hmax=Math.max(...pre.map(p=>p.h0));
  const bubs=d.speakers.map((sp,i)=>{const {an,w0,w,lines}=pre[i];const h0=d.equal===false?pre[i].h0:hmax;
    const b=sp.bub||{};const h=b.h||h0;
    const x0=Math.max(4,Math.min(W0-w-4,an.x-w/2+(b.dx||0))),y0=(b.dy||0);
    return {x:x0,y:y0,w,h,lines,tipdx:b.tx==null?0:b.tx,tipdy:b.ty==null?0:b.ty,an}});
  const minY=Math.min(0,...bubs.map(b=>b.y));
  const top=(d.title?70:16)+(d.labels==='prefix'?Math.round(26*FS()):0)-minY;
  const figTop=Math.max(...bubs.map(b=>top+b.y+b.h),top+60)+42;
  const total=figTop+Math.max(...figs.map(f=>f.h),figH*0.4)+(d.labels==='circle'?44:16)+(d.table?36:0);
  return {d,fs,fam,figs,anchors,bubs,top,figTop,total};
}
function rDialog(){
  const L=dialogLayout();const {d,fs,fam,figs,bubs,top,figTop}=L;let body='';
  if(d.title){const tf=Math.round(26*FS());body+=`<rect x="0" y="0" width="${W0}" height="${r1(L.total)}" fill="#fff" stroke="#000" stroke-width="2"/>`;
    body+=D('title',txt(W0/2,34,d.title,{fs:tf,bold:true}))}
  if(d.table){const ty=L.total-26;body+=`<ellipse cx="${W0/2}" cy="${r1(ty)}" rx="${W0/2-40}" ry="24" fill="#f4f4f4" stroke="#000" stroke-width="1.5"/>`}
  // 인물
  figs.forEach(f=>{const fy=figTop+(Math.max(...figs.map(g=>g.h))-f.h);body+=imgTag(f.a,f.x,fy,f.w,f.h,f.flip)});
  const figBottom=figTop+Math.max(...figs.map(g=>g.h));
  // 말풍선
  bubs.forEach((b,i)=>{const sp=d.speakers[i];const tip={x:b.an.x+b.tipdx,y:figTop+10+b.tipdy};
    const bx=b.x,by=top+b.y;
    let s=bubblePath({x:bx,y:by,w:b.w,h:b.h},tip);
    s+=richSvg(b.lines,bx+14,by+12,fs,fam,{lh:1.5});
    body+=`<g data-bub="${i}">${s}</g>`;
    if(d.labels==='circle'&&sp.label)body+=D('lab'+i,circ(b.an.x,figBottom+22,sp.label,Math.round(20*FS())));
    if(d.labels==='prefix'&&sp.label)body+=D('lab'+i,txt(bx+16,by-14,sp.label,{fs:Math.round(20*FS()),anchor:'start'}))});
  return {defs:'',body,x:0,y:0,w:W0,h:L.total,fixed:true};
}
let pickFor=null; // {kind:'dialog',i} | {kind:'interview'}
function pickerHtml(){
  if(!pickFor)return'';const q=(pickFor.q||'').trim().toLowerCase().split(/\s+/).filter(Boolean);const f=pickFor.f||'all';
  const list=ASSETS.filter(a=>{
    if(f==='single'&&(a.figures!==1||a.generic||a.variant!=='clean'))return false;
    if(f==='pair'&&(a.figures!==2||a.variant!=='clean'))return false;
    if(f==='generic'&&!a.generic)return false;
    if(f==='bubbles'&&a.variant!=='bubbles')return false;
    if(f==='sheet'&&a.variant!=='sheet')return false;
    const hay=(a.names.join(' ')+' '+a.src).toLowerCase();return q.every(w=>hay.includes(w))});
  const FL=[['all','전체'],['single','사상가 1인'],['pair','2인 짝 그림'],['generic','학생·질문자'],['bubbles','빈 말풍선 포함'],['sheet','포즈 모음']];
  const curId=pickFor.kind==='dialog'?(S.dialog.slots[pickFor.i]||{}).id:S.interview.id;
  return `<div class="picker"><div class="row"><input type="text" style="flex:1" placeholder="사상가 이름·시험 검색 (예: 칸트, 2025 수능)" data-pq value="${esc(pickFor.q||'')}"><button class="btn" data-pclose>닫기</button></div>
    <div class="row">${FL.map(([k,t])=>`<button class="chip ${f===k?'on':''}" data-pf="${k}">${t}</button>`).join('')}</div>
    <div class="count">${list.length}개 · 사상가 이름이나 시험(예: 2025·수능)으로 찾을 수 있습니다</div>
    <div class="gallery">${list.map(a=>`<button class="gitem ${a.figures===2?'pair':''} ${a.id===curId?'on':''}" data-pick="${a.id}" title="${esc(aName(a))} · ${esc(aSrc(a))}"><img loading="lazy" alt="" src="${purl(a.id+'.t.webp')}"><span>${esc(aName(a))}</span></button>`).join('')}</div></div>`;
}
const PRESETS=[
  {k:'t2',t:'사상가 2인',slots:['p021','p022'],labels:'circle',names:['갑','을']},
  {k:'t3',t:'사상가 3인',slots:['p021','p022','p118'],labels:'circle',names:['갑','을','병']},
  {k:'st',t:'학생 토론',slots:['p032','p033'],labels:'circle',names:['갑','을']},
  {k:'ts',t:'교사 + 학생',slots:['p080','p095','p096'],labels:'prefix',names:['교사','학생 1','학생 2']},
  {k:'qa',t:'질문자 + 사상가',slots:['p134','p137'],labels:'prefix',names:['질문자','아도르노']}];
function applyPreset(k){const p=PRESETS.find(x=>x.k===k);if(!p)return;const d=S.dialog;
  d.slots=p.slots.filter(id=>AMAP[id]).map(id=>({id,flip:false}));d.labels=p.labels;d.speakers.forEach(s=>s.bub=null);syncSpeakers(d);
  d.speakers.forEach((s,i)=>{s.label=p.names[i]||s.label;s.bub=null})}
function pDialog(){
  const d=S.dialog;syncSpeakers(d);
  let h=`<div class="grp"><h3>바로 채우기</h3><div class="row">${PRESETS.map(p=>`<button class="chip" data-preset="${p.k}">${p.t}</button>`).join('')}</div><p class="hint">인물 구성을 한 번에 바꿉니다. 대사는 그대로 남습니다.</p></div>`;
  h+=`<div class="grp"><h3>등장 인물</h3>`;
  d.slots.forEach((s,i)=>{const a=AMAP[s.id];
    h+=`<div class="speaker" data-slot="${i}"><div class="sp-head"><img class="thumb" alt="" src="${a?purl(a.id+'.t.webp'):''}"><b>인물 ${i+1}</b><span class="sp-name">${a?esc(aName(a))+' · '+esc(aSrc(a)):'(그림을 고르세요)'}</span><button class="btn" data-pickfor="${i}">바꾸기 ▸</button></div>
      ${pickFor&&pickFor.kind==='dialog'&&pickFor.i===i?pickerHtml():''}
      <div class="sp-tools"><label><input type="checkbox" data-bind="dialog.slots.${i}.flip" ${s.flip?'checked':''}> 좌우 반전</label>${d.slots.length>1?`<button class="btn danger" data-delslot="${i}">이 인물 삭제</button>`:''}</div></div>`});
  if(d.slots.length<4)h+=`<div class="row"><button class="btn" data-addslot>＋ 인물 추가</button><span class="hint">2인 짝 그림은 말풍선이 두 개 생깁니다.</span></div>`;
  h+=`</div><div class="grp"><h3>대사</h3>`;
  d.speakers.forEach((sp,i)=>{h+=`<div class="speaker sp-text" data-sp="${i}"><div class="row"><label>이름표 <input type="text" class="sm" data-bind="dialog.speakers.${i}.label" value="${esc(sp.label)}"></label><span class="hint">말풍선 ${i+1}</span>
    <button class="btn" data-resetbub="${i}" style="margin-left:auto;padding:3px 8px;font-size:12px">말풍선 위치·크기 되돌리기</button></div>
    <textarea data-bind="dialog.speakers.${i}.text" placeholder="대사를 입력하세요. [가] 로 비울 수 있습니다.">${esc(sp.text)}</textarea></div>`});
  h+=`</div><div class="grp"><h3>표시</h3>
    <div class="row"><span>이름표</span><span class="seg">${[['circle','인물 아래 ㉮ 원문자'],['prefix','말풍선 위 글자'],['none','없음']].map(([k,t])=>`<button data-set="dialog.labels" data-val="${k}" class="${d.labels===k?'on':''}">${t}</button>`).join('')}</span></div>
    <div class="row"><label>말풍선 글자 <input type="number" class="sm" min="14" max="40" data-bind="dialog.fs" value="${d.fs}"></label><label>인물 높이 <input type="number" class="sm" min="120" max="420" step="10" data-bind="dialog.figH" value="${d.figH}"></label></div>
    <div class="row"><label>제목(선택, 테두리 상자) <input type="text" style="width:100%" data-bind="dialog.title" value="${esc(d.title)}" placeholder="예: 학습 주제: [가]"></label></div>
    <div class="row"><label><input type="checkbox" data-bind="dialog.table" ${d.table?'checked':''}> 원탁(책상) 그리기</label><label><input type="checkbox" data-bind="dialog.equal" ${d.equal!==false?'checked':''}> 말풍선 높이 맞추기</label></div></div>`;
  return h;
}

/* ============================================================
   가상 인터뷰
   ============================================================ */
function rInterview(){
  const v=S.interview,a=AMAP[v.id],fs=Math.round(v.fs*FS()),fam=ko();
  const W=W0,pad=22;const pw=a?300:0;const textW=W-pad*2-pw-(a?20:0);
  let y=pad;let inner='';
  if(v.title){const tf=Math.round(fs*1.15);inner+=D('ititle',txt(W/2,y+tf*0.7,v.title,{fs:tf,bold:true}));y+=tf*1.6+6;
    inner+=`<line x1="${pad}" y1="${r1(y)}" x2="${W-pad}" y2="${r1(y)}" stroke="#000" stroke-width="1"/>`;y+=14}
  const lh=fs*1.55;
  v.lines.forEach((ln,i)=>{if(!ln.text&&!ln.who)return;const who=ln.who||'';const ww=who?tw(who+': ',fs,fam,true):0;
    const lines=wrapRich(ln.text||' ',textW-ww,fs,fam);
    if(who)inner+=`<text x="${pad}" y="${r1(y+lh/2)}" font-size="${fs}" font-family="${esc(fam)}" font-weight="bold" dominant-baseline="central">${esc(who)}:</text>`;
    inner+=richSvg(lines,pad+ww,y,fs,fam,{lh:1.55});y+=lines.length*lh+fs*0.45});
  let H=y+pad-fs*0.45;
  if(a){const w=pw,h=w*a.h/a.w;const ph=Math.min(h,Math.max(H-pad*2,200));const pwid=ph*a.w/a.h;H=Math.max(H,ph+pad*2);
    inner+=imgTag(a,W-pad-pwid,H-pad-ph,pwid,ph,false)}
  const body=`<rect x="1" y="1" width="${W-2}" height="${r1(H-2)}" fill="#fff" stroke="#000" stroke-width="1.8"/>`+inner;
  return {defs:'',body,x:0,y:0,w:W,h:H,fixed:true};
}
function pInterview(){
  const v=S.interview,a=AMAP[v.id];
  let h=`<div class="grp"><h3>사상가 초상</h3><div class="speaker"><div class="sp-head"><img class="thumb" alt="" src="${a?purl(a.id+'.t.webp'):''}"><span class="sp-name">${a?esc(aName(a))+' · '+esc(aSrc(a)):'(없음)'}</span><button class="btn" data-pickfor="iv">바꾸기 ▸</button>${a?`<button class="btn" data-noportrait>초상 없이</button>`:''}</div>${pickFor&&pickFor.kind==='interview'?pickerHtml():''}</div></div>`;
  h+=`<div class="grp"><h3>제목</h3><input type="text" style="width:100%" data-bind="interview.title" value="${esc(v.title)}" placeholder="예: 사상가 ○○와의 가상 인터뷰 (비우면 생략)"></div>`;
  h+=`<div class="grp"><h3>문답</h3>`;
  v.lines.forEach((ln,i)=>{h+=`<div class="row" style="align-items:flex-start"><input type="text" class="md" data-bind="interview.lines.${i}.who" value="${esc(ln.who)}" placeholder="말하는 이"><textarea style="flex:1;min-height:48px" data-bind="interview.lines.${i}.text" placeholder="내용 ([가]로 비울 수 있음)">${esc(ln.text)}</textarea><button class="btn danger" data-delline="${i}" title="삭제">✕</button></div>`});
  h+=`<div class="row"><button class="btn" data-addline>＋ 문답 추가</button><label>글자 <input type="number" class="sm" min="14" max="36" data-bind="interview.fs" value="${v.fs}"></label></div></div>`;
  return h;
}

/* ============================================================
   벤다이어그램 (v1 엔진)
   ============================================================ */
const PATS=[['auto','자동'],['none','없음'],['pv','세로줄'],['ps','빗금 ／'],['pb','빗금 ＼'],['px','사선 격자'],['pg','직각 격자'],['ph','가로줄'],['pd','점'],['gray','회색 채움']];
function patDefs(g){
  const L=(x1,y1,x2,y2)=>`<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="#000" stroke-width="1.05"/>`;
  const P=(id,inner,rot)=>`<pattern id="${id}" width="${g}" height="${g}" patternUnits="userSpaceOnUse"${rot?` patternTransform="rotate(${rot})"`:''}>${inner}</pattern>`;
  return P('pv',L(g/2,0,g/2,g))+P('ph',L(0,g/2,g,g/2))+P('ps',L(g/2,0,g/2,g),45)+P('pb',L(g/2,0,g/2,g),-45)+
    P('px',L(g/2,0,g/2,g)+L(0,g/2,g,g/2),45)+P('pg',L(g/2,0,g/2,g)+L(0,g/2,g,g/2))+P('pd',`<circle cx="${g/2}" cy="${g/2}" r="1.1" fill="#000"/>`);
}
function vennShapes(v){if(v.n===3){const r=150;return[{cx:0,cy:-88,rx:r,ry:r},{cx:-100,cy:86,rx:r,ry:r},{cx:100,cy:86,rx:r,ry:r}]}
  if(v.shape==='ellipse')return[{cx:-112,cy:0,rx:190,ry:120},{cx:112,cy:0,rx:190,ry:120}];return[{cx:-95,cy:0,rx:150,ry:150},{cx:95,cy:0,rx:150,ry:150}]}
const IDX={a:0,b:1,c:2};
const regionKeys=n=>n===3?['a','b','c','ab','ac','bc','abc']:['a','b','ab'];
const vennCache={};
function regionPoints(shapes){const sig=JSON.stringify(shapes);if(vennCache[sig])return vennCache[sig];
  const inside=(p,s)=>((p[0]-s.cx)/s.rx)**2+((p[1]-s.cy)/s.ry)**2<1;
  const bd=(p,s)=>Math.abs(Math.sqrt(((p[0]-s.cx)/s.rx)**2+((p[1]-s.cy)/s.ry)**2)-1)*Math.min(s.rx,s.ry);
  const best={};let x0=Infinity,x1=-Infinity,y0=Infinity,y1=-Infinity;
  shapes.forEach(s=>{x0=Math.min(x0,s.cx-s.rx);x1=Math.max(x1,s.cx+s.rx);y0=Math.min(y0,s.cy-s.ry);y1=Math.max(y1,s.cy+s.ry)});
  for(let x=x0;x<=x1;x+=3)for(let y=y0;y<=y1;y+=3){const p=[x,y];let key='';shapes.forEach((s,i)=>{if(inside(p,s))key+='abc'[i]});if(!key)continue;
    const d=Math.min(...shapes.map(s=>bd(p,s)));if(!best[key]||d>best[key].d)best[key]={x,y,d}}
  return vennCache[sig]=best}
const vennLabels=v=>v.n===3?v.labels3:v.labels2;
const autoPat=(v,k)=>v.n===3?({a:'pv',b:'pb',c:'ps'}[k]||'px'):({a:'pb',b:'ps'}[k]||'px');
function vennLegendLines(v){const L=vennLabels(v),N=v.names;const nm=k=>k.split('').map(c=>N[IDX[c]]);const lines=[];
  for(const k of regionKeys(v.n)){const lab=(L[k]||'').trim();if(!lab)continue;const ns=nm(k);let t;
    if(ns.length===1)t=ns[0]+'만의 입장';else if(v.lstyle==='comma')t=ns.join(', ')+(v.n===3&&ns.length===2?'만':'')+'의 공통 입장';
    else t=ns.slice(0,-1).map(jGwa).join(' ')+' '+ns[ns.length-1]+(v.n===3&&ns.length===2?'만':'')+'의 공통 입장';lines.push([lab,t])}
  lines.sort((a,b)=>a[0].localeCompare(b[0],'ko'));return lines}
function rVenn(){
  const v=S.venn,shapes=vennShapes(v),L=vennLabels(v),keys=regionKeys(v.n);const pts=regionPoints(shapes);
  let x0=Infinity,x1=-Infinity,y0=Infinity,y1=-Infinity;shapes.forEach(s=>{x0=Math.min(x0,s.cx-s.rx);x1=Math.max(x1,s.cx+s.rx);y0=Math.min(y0,s.cy-s.ry);y1=Math.max(y1,s.cy+s.ry)});
  let defs=patDefs(v.gap);shapes.forEach((s,i)=>defs+=`<clipPath id="vc${i}"><ellipse cx="${s.cx}" cy="${s.cy}" rx="${s.rx}" ry="${s.ry}"/></clipPath>`);
  let body='';
  if(v.hatch){for(const k of keys){const lab=(L[k]||'').trim();if(!lab)continue;let p=v.pats[k]||'auto';if(p==='auto')p=autoPat(v,k);if(p==='none')continue;
    const inc=k.split('').map(c=>IDX[c]);const exc=[0,1,2].slice(0,v.n).filter(i=>!inc.includes(i));const box=`x="${x0-5}" y="${y0-5}" width="${x1-x0+10}" height="${y1-y0+10}"`;
    defs+=`<mask id="vm_${k}" maskUnits="userSpaceOnUse" ${box}><rect ${box} fill="#fff"/>`+exc.map(i=>{const s=shapes[i];return `<ellipse cx="${s.cx}" cy="${s.cy}" rx="${s.rx}" ry="${s.ry}" fill="#000"/>`}).join('')+`</mask>`;
    let inner=`<rect ${box} fill="${p==='gray'?'#d4d4d4':`url(#${p})`}"/>`;inc.forEach(i=>inner=`<g clip-path="url(#vc${i})">${inner}</g>`);body+=`<g mask="url(#vm_${k})">${inner}</g>`}}
  shapes.forEach(s=>body+=`<ellipse cx="${s.cx}" cy="${s.cy}" rx="${s.rx}" ry="${s.ry}" fill="none" stroke="#000" stroke-width="1.8"/>`);
  for(const k of keys){const lab=(L[k]||'').trim();if(!lab||!pts[k])continue;body+=D('v_'+k,txt(pts[k].x,pts[k].y,lab,{fs:32*FS(),fam:LAT,halo:7}))}
  const N=v.names;const namePos=v.n===3?[[shapes[0].cx,shapes[0].cy-shapes[0].ry-20],[shapes[1].cx-shapes[1].rx*0.78,shapes[1].cy+shapes[1].ry*0.78+14],[shapes[2].cx+shapes[2].rx*0.78,shapes[2].cy+shapes[2].ry*0.78+14]]
    :[[shapes[0].cx-shapes[0].rx*0.25,shapes[0].cy-shapes[0].ry-20],[shapes[1].cx+shapes[1].rx*0.25,shapes[1].cy-shapes[1].ry-20]];
  namePos.forEach((p,i)=>{body+=D('vn'+i,txt(p[0],p[1],N[i],{fs:28*FS(),halo:8}))});
  let bx0=x0-30,bx1=x1+30,by0=y0-48,by1=y1+(v.n===3?40:20);
  if(v.legend){let lines=v.lover.trim()?v.lover.trim().split('\n').map(l=>{const m=l.match(/^\s*([^:：]+)\s*[:：]\s*(.*)$/);return m?[m[1],m[2]]:['',l]}):vennLegendLines(v);
    if(lines.length){const lb=legendBox('〈 범 례 〉',lines.map(([a,b])=>({parts:a?[[a,LAT],[': '+b,ko()]]:[[b,ko()]]})),19*FS());const lx=x1+50,ly=(y0+y1)/2-lb.h/2;
      body+=D('vleg',`<g transform="translate(${r1(lx)} ${r1(ly)})">${lb.svg}</g>`);bx1=Math.max(bx1,lx+lb.w+20);by0=Math.min(by0,ly-20);by1=Math.max(by1,ly+lb.h+20)}}
  return {defs,body,x:bx0,y:by0,w:bx1-bx0,h:by1-by0};
}
function pVenn(){const v=S.venn,L=vennLabels(v),N=v.names;
  const desc={a:N[0]+'만',b:N[1]+'만',c:N[2]+'만',ab:N[0]+'·'+N[1]+(v.n===3?'만':' 공통'),ac:N[0]+'·'+N[2]+'만',bc:N[1]+'·'+N[2]+'만',abc:N[0]+'·'+N[1]+'·'+N[2]+' 공통'};
  const lp=v.n===3?'venn.labels3':'venn.labels2';
  return `<div class="grp"><h3>원의 개수와 모양</h3><div class="row"><span class="seg">${[2,3].map(n=>`<button data-set="venn.n" data-val="${n}" class="${v.n===n?'on':''}">${n}개</button>`).join('')}</span>
    ${v.n===2?`<span class="seg">${[['circle','원'],['ellipse','타원']].map(([k,t])=>`<button data-set="venn.shape" data-val="${k}" class="${v.shape===k?'on':''}">${t}</button>`).join('')}</span>`:''}</div></div>
  <div class="grp"><h3>사상가 이름</h3><div class="row">${N.slice(0,v.n).map((x,i)=>`<input type="text" class="md" data-bind="venn.names.${i}" value="${esc(x)}">`).join('')}</div><p class="hint">정답지용으로 실제 사상가 이름을 넣어도 됩니다.</p></div>
  <div class="grp"><h3>영역 기호와 무늬</h3><table class="rg"><tr><th>영역</th><th>기호</th><th>무늬</th></tr>
    ${regionKeys(v.n).map(k=>`<tr><td>${esc(desc[k])}</td><td><input type="text" class="sm" maxlength="4" data-bind="${lp}.${k}" value="${esc(L[k]||'')}"></td><td><select data-bind="venn.pats.${k}">${PATS.map(([p,t])=>`<option value="${p}" ${(v.pats[k]||'auto')===p?'selected':''}>${t}</option>`).join('')}</select></td></tr>`).join('')}</table>
    <p class="hint">기호를 비우면 그 영역은 기호와 무늬가 빠집니다.</p>
    <div class="row" style="margin-top:8px"><label><input type="checkbox" data-bind="venn.hatch" ${v.hatch?'checked':''}> 무늬 넣기</label><label>간격 <input type="range" min="4" max="14" step="1" data-bind="venn.gap" value="${v.gap}"></label></div></div>
  <div class="grp"><h3>범례</h3><div class="row"><label><input type="checkbox" data-bind="venn.legend" ${v.legend?'checked':''}> 범례 표시</label>
    <select data-bind="venn.lstyle"><option value="gwa" ${v.lstyle==='gwa'?'selected':''}>갑과 을의 공통 입장</option><option value="comma" ${v.lstyle==='comma'?'selected':''}>갑, 을의 공통 입장</option></select></div>
    <textarea data-bind="venn.lover" placeholder="직접 고치려면 한 줄에 하나씩 (예: A: 갑만의 입장). 비워 두면 자동.">${esc(v.lover)}</textarea>
    <div class="row"><button class="btn" data-act="legendFill">자동 범례를 칸에 불러오기</button></div></div>`}

/* ============================================================
   상호 비판 / 순서도 / XYZ (v1 엔진)
   ============================================================ */
const CR_DEF={2:{pos:[[0,0],[310,0]],cent:[155,120],arr:{A:[0,1,'out'],B:[1,0,'in']}},
  3:{pos:[[175,0],[0,265],[350,265]],cent:[175,177],arr:{A:[0,1,'out'],B:[1,0,'in'],C:[2,1,'in'],D:[1,2,'out'],E:[2,0,'out'],F:[0,2,'in']}}};
function rCrit(){
  const c=S.critique,def=CR_DEF[c.n],R=62,N=c.names;let body='';
  def.pos.forEach((p,i)=>{body+=`<circle cx="${p[0]}" cy="${p[1]}" r="${R}" fill="#fff" stroke="#000" stroke-width="1.6"/>`+D('cn'+i,txt(p[0],p[1],N[i],{fs:30*FS()}))});
  const used=[];
  for(const [k,[f,t,side]] of Object.entries(def.arr)){if(!c.on[k])continue;used.push(c.letters[k]||k);
    const P=def.pos[f],Q=def.pos[t];const dx=Q[0]-P[0],dy=Q[1]-P[1],len=Math.hypot(dx,dy);const ux=dx/len,uy=dy/len;let nx=-uy,ny=ux;const mx=(P[0]+Q[0])/2,my=(P[1]+Q[1])/2;
    const out=((mx+nx-def.cent[0])**2+(my+ny-def.cent[1])**2)>((mx-def.cent[0])**2+(my-def.cent[1])**2);const sgn=(side==='out')===out?1:-1;nx*=sgn;ny*=sgn;
    const gap=c.n===2?R+26:R+20,off=7;const sx=P[0]+ux*gap+nx*off,sy=P[1]+uy*gap+ny*off,ex=Q[0]-ux*gap+nx*off,ey=Q[1]-uy*gap+ny*off;
    body+=`<line x1="${r1(sx)}" y1="${r1(sy)}" x2="${r1(ex)}" y2="${r1(ey)}" stroke="#000" stroke-width="1.5" marker-end="url(#ah)"/>`;
    body+=D('ca'+k,txt(mx+nx*26,my+ny*26,c.letters[k]||k,{fs:30*FS(),fam:LAT}))}
  let x0=-R-20,y0=-R-20,x1=(c.n===2?310:350)+R+20,y1=(c.n===2?0:265)+R+20;const rows=[];
  if(c.legend&&used.length){const range=used.length<=2?used.join(', '):used[0]+'~'+used[used.length-1];
    rows.push(legendBox('〈 범 례 〉',[{icon:{svg:`<line x1="0" y1="0" x2="44" y2="0" stroke="#000" stroke-width="1.5" marker-end="url(#ah)"/>`,w:46},parts:[[': 비판의 방향',ko()]]},{parts:[[range,LAT],[' : 비판의 내용',ko()]]}],19*FS()))}
  if(c.example){const a=used[0]||'A',fs=19*FS();const ex1=jNeun(a)+' '+jI(N[0])+' '+N[1]+'에게 제기할',ex2='수 있는 비판임.';
    const w=Math.max(tw(ex1,fs,ko()),tw(ex2,fs,ko()),150)+24,h=118;let s=`<rect x="0" y="0" width="${r1(w)}" height="${h}" fill="#fff" stroke="#000" stroke-width="1.3"/>`;
    const tW=tw('〈 예 시 〉',fs,ko())+16;s+=`<rect x="${r1(w/2-tW/2)}" y="-3" width="${r1(tW)}" height="6" fill="#fff"/>`+txt(w/2,0,'〈 예 시 〉',{fs});
    s+=circ(w/2-55,38,N[0],16,15)+circ(w/2+55,38,N[1],16,15)+`<line x1="${r1(w/2-36)}" y1="38" x2="${r1(w/2+36)}" y2="38" stroke="#000" stroke-width="1.4" marker-end="url(#ah)"/>`+txt(w/2,22,a,{fs:24,fam:LAT});
    s+=`<text x="12" y="75" font-size="${fs}" font-family="${esc(ko())}" dominant-baseline="central">${esc(ex1)}</text><text x="12" y="102" font-size="${fs}" font-family="${esc(ko())}" dominant-baseline="central">${esc(ex2)}</text>`;rows.push({svg:s,w,h})}
  if(rows.length){const W=Math.max(...rows.map(r=>r.w));const H=rows.reduce((a,r)=>a+r.h,0)+(rows.length-1)*22;let ly=(y0+y1)/2-H/2;const lx=x1+30;
    rows.forEach((r,i)=>{body+=D('cl'+i,`<g transform="translate(${r1(lx+(W-r.w)/2)} ${r1(ly)})">${r.svg}</g>`);ly+=r.h+22});
    const cy=(y0+y1)/2;x1=lx+W+20;y0=Math.min(y0,cy-H/2-20);y1=Math.max(y1,cy+H/2+20)}
  return {defs:ARROW_DEF,body,x:x0,y:y0,w:x1-x0,h:y1-y0};
}
function pCrit(){const c=S.critique,def=CR_DEF[c.n],N=c.names;
  return `<div class="grp"><h3>사상가 수</h3><div class="row"><span class="seg">${[2,3].map(n=>`<button data-set="critique.n" data-val="${n}" class="${c.n===n?'on':''}">${n}명</button>`).join('')}</span></div></div>
  <div class="grp"><h3>사상가 이름</h3><div class="row">${N.slice(0,c.n).map((x,i)=>`<input type="text" class="md" data-bind="critique.names.${i}" value="${esc(x)}">`).join('')}</div></div>
  <div class="grp"><h3>비판 화살표</h3><table class="rg"><tr><th>표시</th><th>방향</th><th>기호</th></tr>
    ${Object.entries(def.arr).map(([k,[f,t]])=>`<tr><td><input type="checkbox" data-bind="critique.on.${k}" ${c.on[k]?'checked':''}></td><td>${esc(N[f])} → ${esc(N[t])}</td><td><input type="text" class="sm" maxlength="3" data-bind="critique.letters.${k}" value="${esc(c.letters[k])}"></td></tr>`).join('')}</table>
    <p class="hint">한쪽 방향만 묻는 문항은 쓰지 않는 화살표의 체크를 끄세요.</p></div>
  <div class="grp"><h3>범례와 예시</h3><div class="row"><label><input type="checkbox" data-bind="critique.legend" ${c.legend?'checked':''}> 범례</label><label><input type="checkbox" data-bind="critique.example" ${c.example?'checked':''}> 예시 상자</label></div></div>`}

const FLOW_T={
  t2a:{name:'2명 · A 예→B / 아니요→C',n:2,nodes:{A:[0,1,0],B:[0,2,1],C:[1,2,2],R0:[0,3,0],R1:[1,3,1]},edges:[['A','B','y'],['B','R0','y'],['A','C','n'],['C','R1','y']]},
  t2b:{name:'2명 · A 예→갑 / 아니요→B',n:2,nodes:{A:[0,1,0],B:[1,2,1],R0:[0,3,0],R1:[1,3,1]},edges:[['A','R0','y'],['A','B','n'],['B','R1','y']]},
  t3a:{name:'3명 · A 예→갑 / 아니요→B',n:3,nodes:{A:[0,1,0],B:[1,2,1],C:[1,3,2],D:[2,3,3],R0:[0,4,0],R1:[1,4,1],R2:[2,4,2]},edges:[['A','R0','y'],['A','B','n'],['B','C','y'],['C','R1','y'],['B','D','n'],['D','R2','y']]},
  t3b:{name:'3명 · A 예→B / 아니요→D',n:3,nodes:{A:[0,1,0],B:[0,2,1],C:[1,2,2],D:[2,2,3],R0:[0,3,0],R1:[1,3,1],R2:[2,3,2]},edges:[['A','B','y'],['B','R0','y'],['B','C','n'],['C','R1','y'],['A','D','n'],['D','R2','y']]}};
function docShape(cx,cy,w,h){const x=cx-w/2,y=cy-h/2,b=y+h;return `<path d="M${r1(x)} ${r1(y)} H${r1(x+w)} V${r1(b-4)} C${r1(x+w*0.75)} ${r1(b-16)} ${r1(x+w*0.55)} ${r1(b-12)} ${r1(x+w*0.45)} ${r1(b-2)} C${r1(x+w*0.3)} ${r1(b+12)} ${r1(x+w*0.12)} ${r1(b+8)} ${r1(x)} ${r1(b+2)} Z" fill="#fff" stroke="#000" stroke-width="1.5"/>`}
function rFlow(){
  const f=S.flow,T=FLOW_T[f.tpl]||FLOW_T.t2a;const CW=250,RH=92,DW=104,DH=46,RW=124,RHh=46;const pos={};
  for(const [id,[c,r]] of Object.entries(T.nodes))pos[id]=[c*CW,r*RH+(id[0]==='R'?14:0)];let body='';
  const fs=21*FS(),lines=f.start.split('\n');const sw=Math.max(...lines.map(l=>tw(l,fs,ko())))+30,sh=lines.length*fs*1.3+20;const sy=0;
  body+=`<rect x="${r1(-sw/2+40)}" y="${r1(sy-sh/2)}" width="${r1(sw)}" height="${r1(sh)}" fill="#fff" stroke="#000" stroke-width="1.5"/>`+D('fs',txt(40,sy,f.start,{fs}));
  body+=`<line x1="0" y1="${r1(sy+sh/2)}" x2="0" y2="${r1(pos.A[1]-DH/2)}" stroke="#000" stroke-width="1.5"/>`;
  const top=id=>id[0]==='R'?pos[id][1]-RHh/2:pos[id][1]-DH/2;
  for(const [a,b,k] of T.edges){const [ax,ay]=pos[a],[bx,by]=pos[b];
    if(k==='y'){body+=`<line x1="${ax}" y1="${ay+DH/2}" x2="${bx}" y2="${r1(top(b)-1)}" stroke="#000" stroke-width="1.5" marker-end="url(#ah)"/>`;body+=D('fy'+a+b,txt(ax+10,(ay+DH/2+top(b))/2,f.yes,{fs:19*FS(),anchor:'start'}))}
    else if(ay===by){body+=`<line x1="${ax+DW/2}" y1="${ay}" x2="${bx-DW/2-1}" y2="${by}" stroke="#000" stroke-width="1.5" stroke-dasharray="5 4" marker-end="url(#ah)"/>`;body+=D('fn'+a+b,txt((ax+bx)/2,ay-14,f.no,{fs:19*FS()}))}
    else{body+=`<path d="M${ax+DW/2} ${ay} H${bx} V${r1(top(b)-1)}" fill="none" stroke="#000" stroke-width="1.5" stroke-dasharray="5 4" marker-end="url(#ah)"/>`;body+=D('fn'+a+b,txt(ax+DW/2+(bx-ax-DW/2)*0.42,ay-14,f.no,{fs:19*FS()}))}}
  for(const [id,[c,r,i]] of Object.entries(T.nodes)){const [x,y]=pos[id];
    if(id[0]==='R')body+=docShape(x,y,RW,RHh)+D('fr'+i,txt(x,y-3,f.res[i]||'',{fs:20*FS()}));
    else body+=`<path d="M${x-DW/2} ${y} L${x} ${y-DH/2} L${x+DW/2} ${y} L${x} ${y+DH/2} Z" fill="#fff" stroke="#000" stroke-width="1.5"/>`+D('fd'+i,txt(x,y+1,f.letters[i]||'',{fs:30*FS(),fam:LAT}))}
  const maxC=Math.max(...Object.values(T.nodes).map(n=>n[0]));let x0=Math.min(-RW/2,-sw/2+40)-20,x1=maxC*CW+RW/2+20,y0=-sh/2-20,y1=Math.max(...Object.values(pos).map(p=>p[1]))+RHh/2+30;
  if(f.legend){const ic=(svg,w=40)=>({svg,w});const lb=legendBox('〈 범 례 〉',[
      {icon:ic(`<rect x="0" y="-9" width="38" height="18" fill="#fff" stroke="#000" stroke-width="1.2"/>`),parts:[[': 출발 조건',ko()]]},
      {icon:ic(`<path d="M0 0 L19 -10 L38 0 L19 10 Z" fill="#fff" stroke="#000" stroke-width="1.2"/>`),parts:[[': 판단 내용',ko()]]},
      {icon:ic(`<line x1="0" y1="-5" x2="36" y2="-5" stroke="#000" stroke-width="1.2" marker-end="url(#ah)"/><line x1="0" y1="5" x2="36" y2="5" stroke="#000" stroke-width="1.2" stroke-dasharray="4 3" marker-end="url(#ah)"/>`),parts:[[': 판단 방향',ko()]]},
      {icon:ic(`<path d="M0 -9 H38 V6 C28 1 22 3 18 9 C12 14 6 12 0 10 Z" fill="#fff" stroke="#000" stroke-width="1.2"/>`),parts:[[': 사상가의 입장',ko()]]}],18*FS());
    const lx=x1+20,ly=y0+10;body+=D('fl',`<g transform="translate(${r1(lx)} ${r1(ly)})">${lb.svg}</g>`);x1=lx+lb.w+20;y1=Math.max(y1,ly+lb.h+20)}
  return {defs:ARROW_DEF,body,x:x0,y:y0,w:x1-x0,h:y1-y0};
}
function pFlow(){const f=S.flow,T=FLOW_T[f.tpl];const nl=Object.keys(T.nodes).filter(k=>k[0]!=='R').length;
  return `<div class="grp"><h3>순서도 틀</h3><select data-bind="flow.tpl" style="width:100%">${Object.entries(FLOW_T).map(([k,t])=>`<option value="${k}" ${f.tpl===k?'selected':''}>${t.name}</option>`).join('')}</select><p class="hint">실선은 ‘예’, 점선은 ‘아니요’ 방향입니다.</p></div>
  <div class="grp"><h3>출발 조건</h3><textarea data-bind="flow.start">${esc(f.start)}</textarea></div>
  <div class="grp"><h3>판단 기호</h3><div class="row">${f.letters.slice(0,nl).map((l,i)=>`<input type="text" class="sm" data-bind="flow.letters.${i}" value="${esc(l)}">`).join('')}</div></div>
  <div class="grp"><h3>사상가의 입장 (결과)</h3>${f.res.slice(0,T.n).map((r,i)=>`<div class="row"><input type="text" style="width:100%" data-bind="flow.res.${i}" value="${esc(r)}"></div>`).join('')}</div>
  <div class="grp"><h3>분기 문구</h3><div class="row"><label>실선 <input type="text" class="md" data-bind="flow.yes" value="${esc(f.yes)}"></label><label>점선 <input type="text" class="md" data-bind="flow.no" value="${esc(f.no)}"></label></div>
    <div class="row"><label><input type="checkbox" data-bind="flow.legend" ${f.legend?'checked':''}> 범례 표시</label></div></div>`}

const XYZ_V=['000','100','010','001','110','101','011','111'];
function rXyz(){
  const z=S.xyz,L=230,Y=[-0.5*L,-0.38*L];const P=k=>{const [a,b,c]=k.split('').map(Number);return [a*L+b*Y[0],-c*L+b*Y[1]]};let body='';
  const edges=[];for(const a of XYZ_V)for(const b of XYZ_V){if(a<b){let d=0;for(let i=0;i<3;i++)if(a[i]!==b[i])d++;if(d===1)edges.push([a,b])}}
  for(const [a,b] of edges){if(a==='000')continue;const hid=(a==='110'||b==='110');const p=P(a),q=P(b);
    body+=`<line x1="${r1(p[0])}" y1="${r1(p[1])}" x2="${r1(q[0])}" y2="${r1(q[1])}" stroke="#000" stroke-width="1.3" ${hid?'stroke-dasharray="6 5"':''}/>`}
  const ax=[[1.6*L,0],[1.85*Y[0],1.85*Y[1]],[0,-1.85*L]];ax.forEach(p=>body+=`<line x1="0" y1="0" x2="${r1(p[0])}" y2="${r1(p[1])}" stroke="#000" stroke-width="2.6" marker-end="url(#ah)"/>`);
  const A=z.axes,f=FS();
  body+=D('xa0',txt(ax[0][0]+26,ax[0][1],A[0],{fs:40*f,fam:LAT}));body+=D('xa1',txt(ax[1][0]-16,ax[1][1]-20,A[1],{fs:40*f,fam:LAT}));body+=D('xa2',txt(ax[2][0],ax[2][1]-28,A[2],{fs:40*f,fam:LAT}));
  body+=D('xh0',txt(ax[0][0]-40,30,z.hi,{fs:26*f}));body+=D('xh1',txt(ax[1][0]-34,ax[1][1]+42,z.hi,{fs:26*f}));body+=D('xh2',txt(36,ax[2][1]+40,z.hi,{fs:26*f}));body+=D('xlo',txt(0,32,z.lo,{fs:26*f}));
  const cen=P('111').map((v,i)=>(v+P('000')[i])/2);
  for(const k of XYZ_V){const t=(z.v[k]||'').trim();if(!t)continue;const p=P(k);body+=`<circle cx="${r1(p[0])}" cy="${r1(p[1])}" r="5.5" fill="#000"/>`;
    let dx=p[0]-cen[0],dy=p[1]-cen[1];const d=Math.hypot(dx,dy)||1;dx/=d;dy/=d;if(k==='000'){dx=0.9;dy=-0.6}if(k==='001'){dx=-0.9;dy=0.3}
    const lx=p[0]+dx*30,ly=p[1]+dy*30;let s;if(z.style==='circle')s=circ(lx,ly,t,20*f,15*f);else if(z.style==='paren')s=txt(lx,ly,'('+t+')',{fs:22*f});else s=txt(lx,ly,t,{fs:24*f});body+=D('xv'+k,s)}
  let x0=ax[1][0]-80,x1=ax[0][0]+50,y0=ax[2][1]-60,y1=60;
  if(z.box){const fs=20*f,lines=z.boxText.split('\n');const w=Math.max(260,...lines.map(l=>tw(l,fs,ko())+30)),h=lines.length*fs*1.8+20;const bx=x1+20,by=(y0+y1)/2-h/2;
    body+=D('xbox',`<g transform="translate(${r1(bx)} ${r1(by)})"><rect width="${r1(w)}" height="${r1(h)}" fill="#fff" stroke="#000" stroke-width="1.3"/>`+lines.map((l,i)=>`<text x="14" y="${r1(10+fs*0.9+i*fs*1.8)}" font-size="${fs}" font-family="${esc(ko())}" dominant-baseline="central">${esc(l)}</text>`).join('')+`</g>`);x1=bx+w+20}
  return {defs:ARROW_DEF,body,x:x0,y:y0,w:x1-x0,h:y1-y0};
}
function pXyz(){const z=S.xyz,nm=['낮음','높음'];
  return `<div class="grp"><h3>꼭짓점 기호</h3><table class="rg"><tr><th>${esc(z.axes[0])}</th><th>${esc(z.axes[1])}</th><th>${esc(z.axes[2])}</th><th>기호</th></tr>
    ${XYZ_V.map(k=>`<tr><td>${nm[k[0]]}</td><td>${nm[k[1]]}</td><td>${nm[k[2]]}</td><td><input type="text" class="sm" maxlength="3" data-bind="xyz.v.${k}" value="${esc(z.v[k]||'')}"></td></tr>`).join('')}</table>
    <p class="hint">기호를 비우면 점이 사라집니다. (X 높음·Y 높음·Z 낮음) 꼭짓점은 뒤쪽에 숨은 점입니다.</p>
    <div class="row"><span class="seg">${[['circle','㉠ 원문자'],['paren','(ㄱ) 괄호'],['plain','ㄱ 그대로']].map(([k,t])=>`<button data-set="xyz.style" data-val="${k}" class="${z.style===k?'on':''}">${t}</button>`).join('')}</span></div></div>
  <div class="grp"><h3>축 이름과 정도</h3><div class="row">${z.axes.map((a,i)=>`<input type="text" class="sm" data-bind="xyz.axes.${i}" value="${esc(a)}">`).join('')}</div>
    <div class="row"><label>높은 쪽 <input type="text" class="md" data-bind="xyz.hi" value="${esc(z.hi)}"></label><label>원점 <input type="text" class="md" data-bind="xyz.lo" value="${esc(z.lo)}"></label></div></div>
  <div class="grp"><h3>축 설명 상자</h3><div class="row"><label><input type="checkbox" data-bind="xyz.box" ${z.box?'checked':''}> 오른쪽에 표시</label></div><textarea data-bind="xyz.boxText">${esc(z.boxText)}</textarea></div>`}

/* ============================================================
   두루마리 (원전·사료)
   ============================================================ */
function rScroll(){
  const c=S.scroll,fs=Math.round(c.fs*FS()),fam=FAM.myeongjo;const W=c.width,pad=46,rollH=30;
  const srcLines=c.src?wrapRich(c.src,W-pad*2,fs*0.8,ko()):[];
  const lines=wrapRich(c.text||' ',W-pad*2,fs,fam);
  const bodyH=(srcLines.length?srcLines.length*fs*0.8*1.5+10:0)+lines.length*fs*1.6+pad*1.4;
  let s='';const x0=0;
  // 몸통
  s+=`<rect x="${x0+18}" y="${rollH-6}" width="${W-36}" height="${r1(bodyH+12)}" fill="#fff" stroke="#000" stroke-width="1.6"/>`;
  // 위·아래 두루마리 봉
  const roll=(y)=>`<rect x="${x0}" y="${y}" width="${W}" height="${rollH}" rx="${rollH/2}" fill="#fff" stroke="#000" stroke-width="1.6"/>
    <ellipse cx="${x0+rollH/2}" cy="${y+rollH/2}" rx="${rollH/2-1}" ry="${rollH/2-1}" fill="#e6e6e6" stroke="#000" stroke-width="1.2"/><ellipse cx="${x0+W-rollH/2}" cy="${y+rollH/2}" rx="${rollH/2-1}" ry="${rollH/2-1}" fill="#e6e6e6" stroke="#000" stroke-width="1.2"/>
    <line x1="${x0+rollH}" y1="${y+rollH*0.35}" x2="${x0+W-rollH}" y2="${y+rollH*0.35}" stroke="#000" stroke-width=".7" opacity=".5"/>`;
  s+=roll(0);s+=roll(rollH+bodyH);
  let y=rollH+pad*0.55;
  if(srcLines.length){s+=`<g data-k="src">${richSvg(srcLines,pad,y,fs*0.8,ko(),{lh:1.5})}</g>`;y+=srcLines.length*fs*0.8*1.5+10}
  s+=`<g data-k="body">${richSvg(lines,pad,y,fs,fam,{lh:1.6})}</g>`;
  let H=rollH*2+bodyH;
  if(c.q&&c.q.trim()){const qf=Math.round(fs*0.95);const ql=wrapRich(c.q,W-40,qf,ko());const qy=H+18;s+=D('q',richSvg(ql,20,qy,qf,ko(),{lh:1.6}));H=qy+ql.length*qf*1.6+6}
  return {defs:'',body:s,x:0,y:0,w:W,h:H,fixed:true};
}
function pScroll(){const c=S.scroll;
  return `<div class="grp"><h3>자료 출처 (선택)</h3><input type="text" style="width:100%" data-bind="scroll.src" value="${esc(c.src)}" placeholder="예: - 출처: 『논어』 「안연」"></div>
  <div class="grp"><h3>자료 본문 (인용)</h3><textarea style="min-height:110px" data-bind="scroll.text">${esc(c.text)}</textarea><p class="hint">본문은 명조로 찍힙니다. [가]·_밑줄_ 표기를 쓸 수 있습니다.</p></div>
  <div class="grp"><h3>아래 설명 / 탐구 질문 (선택)</h3><textarea data-bind="scroll.q">${esc(c.q)}</textarea></div>
  <div class="grp"><div class="row"><label>글자 <input type="number" class="sm" min="14" max="36" data-bind="scroll.fs" value="${c.fs}"></label><label>너비 <input type="number" class="sm" style="width:70px" min="500" max="1200" step="20" data-bind="scroll.width" value="${c.width}"></label></div></div>`}

/* ============================================================
   신문 칼럼
   ============================================================ */
function rColumn(){
  const c=S.column,fs=Math.round(c.fs*FS()),fam=FAM.myeongjo;const W=c.width,pad=34;let s='',y=pad;
  const inW=W-pad*2;
  // 신문 이름·날짜
  const sf=Math.round(fs*0.85);
  s+=`<text x="${pad}" y="${r1(y+sf*0.6)}" font-size="${r1(sf*1.15)}" font-family="${esc(fam)}" font-weight="bold" dominant-baseline="central">${esc(c.paper)}</text>`;
  s+=`<text x="${W-pad}" y="${r1(y+sf*0.6)}" font-size="${sf}" font-family="${esc(ko())}" text-anchor="end" dominant-baseline="central">${esc(c.date)}</text>`;
  if(c.kind){const kw=tw(c.kind,sf,ko())+18;const kx=pad+tw(c.paper,sf*1.15,fam,true)+14;s+=`<rect x="${r1(kx)}" y="${r1(y-2)}" width="${r1(kw)}" height="${r1(sf*1.3)}" fill="#000"/><text x="${r1(kx+kw/2)}" y="${r1(y+sf*0.6)}" font-size="${sf}" font-family="${esc(ko())}" text-anchor="middle" dominant-baseline="central" fill="#fff">${esc(c.kind)}</text>`}
  y+=sf*1.5;s+=`<line x1="${pad}" y1="${r1(y)}" x2="${W-pad}" y2="${r1(y)}" stroke="#000" stroke-width="3"/>`;y+=3;s+=`<line x1="${pad}" y1="${r1(y)}" x2="${W-pad}" y2="${r1(y)}" stroke="#000" stroke-width="1"/>`;y+=16;
  // 제목
  const hf=Math.round(fs*1.55);const hl=wrapRich(c.head||' ',inW,hf,fam);s+=`<g data-k="head">${richSvg(hl,W/2,y,hf,fam,{lh:1.3,anchor:'middle',bold:true})}</g>`;y+=hl.length*hf*1.3+14;
  s+=`<line x1="${pad}" y1="${r1(y)}" x2="${W-pad}" y2="${r1(y)}" stroke="#000" stroke-width="1"/>`;y+=16;
  // 본문
  const cols=c.cols===2?2:1,gap=26;const cw=(inW-gap*(cols-1))/cols;const all=wrapRich(c.body||' ',cw,fs,fam);
  const per=Math.ceil(all.length/cols);let maxL=0;
  for(let k=0;k<cols;k++){const part=all.slice(k*per,(k+1)*per);maxL=Math.max(maxL,part.length);s+=`<g data-k="col${k}">${richSvg(part,pad+k*(cw+gap),y,fs,fam,{lh:1.65})}</g>`;
    if(k<cols-1)s+=`<line x1="${r1(pad+(k+1)*cw+k*gap+gap/2)}" y1="${r1(y)}" x2="${r1(pad+(k+1)*cw+k*gap+gap/2)}" y2="${r1(y+per*fs*1.65)}" stroke="#000" stroke-width=".7"/>`}
  y+=maxL*fs*1.65+pad*0.8;
  const body=`<rect x="1" y="1" width="${W-2}" height="${r1(y-2)}" fill="#fff" stroke="#000" stroke-width="1.6"/>`+s;
  return {defs:'',body,x:0,y:0,w:W,h:y,fixed:true};
}
function pColumn(){const c=S.column;
  return `<div class="grp"><div class="row"><label>신문 이름 <input type="text" class="md" data-bind="column.paper" value="${esc(c.paper)}"></label><label>구분 <input type="text" class="sm" style="width:70px" data-bind="column.kind" value="${esc(c.kind)}" placeholder="칼럼"></label></div>
    <div class="row"><label>날짜 <input type="text" style="width:220px" data-bind="column.date" value="${esc(c.date)}"></label></div></div>
  <div class="grp"><h3>제목</h3><input type="text" style="width:100%" data-bind="column.head" value="${esc(c.head)}"></div>
  <div class="grp"><h3>본문</h3><textarea style="min-height:120px" data-bind="column.body">${esc(c.body)}</textarea>
    <div class="row"><span>단 구성</span><span class="seg">${[1,2].map(n=>`<button data-set="column.cols" data-val="${n}" class="${c.cols===n?'on':''}">${n}단</button>`).join('')}</span>
    <label>글자 <input type="number" class="sm" min="14" max="36" data-bind="column.fs" value="${c.fs}"></label><label>너비 <input type="number" class="sm" style="width:70px" min="500" max="1200" step="20" data-bind="column.width" value="${c.width}"></label></div></div>`}

/* ============================================================
   덧붙이는 글상자·표식·가림 (v1)
   ============================================================ */
function ovList(){return S.ov[cur()]}
let sel=-1;
function ovMetrics(o){
  if(o.t==='text'){const fam=o.font==='lat'?LAT:(FAM[o.font]||ko());const pad=o.border==='none'?2:10;const lines=wrap(o.text,o.w-pad*2,o.fs,fam,o.bold);const lh=o.fs*o.lh;return {fam,pad,lines,lh,w:o.w,h:Math.max(lines.length*lh+pad*2,o.fs+pad*2)}}
  if(o.t==='mark'){const fam=o.font==='lat'?LAT:ko();let w;if(o.shape==='circle')w=o.fs*1.4;else w=tw(o.shape==='paren'?'('+o.text+')':o.text,o.fs,fam)+4;return {fam,w,h:o.shape==='circle'?o.fs*1.4:o.fs*1.3}}
  return {w:o.w,h:o.h};
}
function ovSvg(o,i,exp){
  const m=ovMetrics(o);let s='';
  if(o.t==='text'){if(o.border!=='none'||o.bg==='white')s+=`<rect x="0" y="0" width="${r1(m.w)}" height="${r1(m.h)}" rx="${o.border==='round'?14:0}" fill="${o.bg==='white'?'#fff':'none'}" stroke="${o.border==='none'?'none':'#000'}" stroke-width="1.4"/>`;
    const ax=o.align==='left'?m.pad:o.align==='right'?m.w-m.pad:m.w/2;const an=o.align==='left'?'start':o.align==='right'?'end':'middle';
    s+=`<text font-size="${o.fs}" font-family="${esc(m.fam)}" text-anchor="${an}" fill="#000"${o.bold?' font-weight="bold"':''}>`+m.lines.map((l,k)=>`<tspan x="${r1(ax)}" y="${r1(m.pad+m.lh*k+m.lh/2)}" dominant-baseline="central">${esc(l)||' '}</tspan>`).join('')+`</text>`}
  else if(o.t==='mark'){if(o.shape==='circle')s+=`<circle cx="${r1(m.w/2)}" cy="${r1(m.h/2)}" r="${r1(m.w/2-1)}" fill="#fff" stroke="#000" stroke-width="1.4"/>`+txt(m.w/2,m.h/2+0.5,o.text,{fs:o.fs*0.92,fam:m.fam});
    else s+=txt(m.w/2,m.h/2,o.shape==='paren'?'('+o.text+')':o.text,{fs:o.fs,fam:m.fam,halo:o.halo?6:0})}
  else s+=`<rect x="0" y="0" width="${r1(o.w)}" height="${r1(o.h)}" fill="#fff"${exp?'':' stroke="#9bb" stroke-dasharray="4 3" stroke-width="1"'}/>`;
  if(!exp&&i===sel){s+=`<rect x="-4" y="-4" width="${r1(m.w+8)}" height="${r1(m.h+8)}" fill="none" stroke="#2b6cb0" stroke-width="1.5" stroke-dasharray="5 3" vector-effect="non-scaling-stroke"/>`;
    s+=`<circle data-h="${i}" cx="${r1(m.w+4)}" cy="${r1(m.h+4)}" r="${r1(9/scaleNow())}" fill="#2b6cb0" stroke="#fff" stroke-width="2" vector-effect="non-scaling-stroke" style="cursor:nwse-resize"/>`}
  return `<g data-ov="${i}" transform="translate(${r1(o.x)} ${r1(o.y)})">${s}</g>`;
}
function addOv(t){const L=ovList(),cx=VB.w/2,cy=VB.h/2;let o;
  if(t==='text')o={t:'text',x:cx-150,y:cy-30,w:300,fs:22,lh:1.45,text:'여기에 글을 입력하세요.',align:'left',border:'none',bg:'white',bold:false,font:S.font};
  else if(t==='mark')o={t:'mark',x:cx-20,y:cy-20,fs:26,text:'갑',shape:'circle',font:'ko',halo:true};
  else o={t:'mask',x:cx-80,y:cy-25,w:160,h:50};
  L.push(o);sel=L.length-1;save();snap();renderOv();renderOvPanel()}
function renderOvPanel(){
  const P=$('#ovpanel');const o=ovList()[sel];if(!o){P.classList.remove('show');P.innerHTML='';return}
  P.classList.add('show');const b=(k,v)=>`data-ob="${k}" value="${esc(v)}"`;let h='';
  if(o.t==='text'){h=`<div class="row"><b>글상자</b><span class="hint">줄바꿈은 Enter, 상자 폭에 맞춰 자동으로도 줄이 바뀝니다.</span></div><textarea data-ob="text" rows="3">${esc(o.text)}</textarea>
    <div class="row"><label>크기 <input type="number" class="sm" min="8" max="80" ${b('fs',o.fs)}></label><label>폭 <input type="number" class="sm" style="width:64px" min="40" max="2000" ${b('w',Math.round(o.w))}></label>
    <label>줄 간격 <select data-ob="lh">${[1.2,1.3,1.45,1.6,1.8].map(v=>`<option ${o.lh==v?'selected':''}>${v}</option>`).join('')}</select></label>
    <label>정렬 <select data-ob="align">${[['left','왼쪽'],['center','가운데'],['right','오른쪽']].map(([k,t])=>`<option value="${k}" ${o.align===k?'selected':''}>${t}</option>`).join('')}</select></label>
    <label>테두리 <select data-ob="border">${[['none','없음'],['rect','사각'],['round','둥근 사각']].map(([k,t])=>`<option value="${k}" ${o.border===k?'selected':''}>${t}</option>`).join('')}</select></label>
    <label>바탕 <select data-ob="bg">${[['white','흰색'],['none','투명']].map(([k,t])=>`<option value="${k}" ${o.bg===k?'selected':''}>${t}</option>`).join('')}</select></label>
    <label>글꼴 <select data-ob="font">${[['gothic','고딕'],['myeongjo','명조'],['lat','영문 명조']].map(([k,t])=>`<option value="${k}" ${o.font===k?'selected':''}>${t}</option>`).join('')}</select></label>
    <label><input type="checkbox" data-ob="bold" ${o.bold?'checked':''}> 굵게</label></div>`}
  else if(o.t==='mark'){h=`<div class="row"><b>표식</b><label>글자 <input type="text" class="md" ${b('text',o.text)}></label>
    <label>모양 <select data-ob="shape">${[['circle','원문자 (갑)'],['paren','괄호 (가)'],['plain','글자만']].map(([k,t])=>`<option value="${k}" ${o.shape===k?'selected':''}>${t}</option>`).join('')}</select></label>
    <label>크기 <input type="number" class="sm" min="8" max="120" ${b('fs',o.fs)}></label><label>글꼴 <select data-ob="font">${[['ko','한글'],['lat','영문 명조']].map(([k,t])=>`<option value="${k}" ${o.font===k?'selected':''}>${t}</option>`).join('')}</select></label>
    <label><input type="checkbox" data-ob="halo" ${o.halo?'checked':''}> 흰 테두리</label></div>
    <div class="row">${['갑','을','병','정','ㄱ','ㄴ','ㄷ','ㄹ','가','나','다','A','B','C'].map(t=>`<button class="chip" data-quick="${t}">${t}</button>`).join('')}</div>`}
  else h=`<div class="row"><b>흰색 가림 상자</b><label>폭 <input type="number" class="sm" style="width:64px" ${b('w',Math.round(o.w))}></label><label>높이 <input type="number" class="sm" style="width:64px" ${b('h',Math.round(o.h))}></label><span class="hint">점선은 화면에만 보이고 저장할 때는 사라집니다.</span></div>`;
  h+=`<div class="row" style="margin-top:6px"><button class="btn" data-oa="dup">복제</button><button class="btn" data-oa="front">맨 앞으로</button><button class="btn" data-oa="back">맨 뒤로</button><button class="btn danger" data-oa="del">삭제</button></div>`;P.innerHTML=h;
}
$('#ovpanel').addEventListener('input',e=>{const k=e.target.dataset.ob;if(!k)return;const o=ovList()[sel];if(!o)return;let v=e.target.type==='checkbox'?e.target.checked:e.target.value;if(['fs','w','h','lh'].includes(k))v=parseFloat(v)||o[k];o[k]=v;save();renderOv()});
$('#ovpanel').addEventListener('change',e=>{if(e.target.dataset.ob){renderOvPanel();snap()}});
$('#ovpanel').addEventListener('click',e=>{const L=ovList(),o=L[sel];if(!o)return;const q=e.target.dataset.quick;if(q){o.text=q;save();snap();renderOv();renderOvPanel();return}
  const a=e.target.dataset.oa;if(!a)return;if(a==='del'){L.splice(sel,1);sel=-1}else if(a==='dup'){const c=clone(o);c.x+=20;c.y+=20;L.push(c);sel=L.length-1}else if(a==='front'){L.splice(sel,1);L.push(o);sel=L.length-1}else if(a==='back'){L.splice(sel,1);L.unshift(o);sel=0}
  save();snap();renderOv();renderOvPanel()});

/* ============================================================
   그리기
   ============================================================ */
let VB={w:800,h:600},BASE='',DEFS='',FIXED=false;const PAD=16;
const RENDER={dialog:rDialog,interview:rInterview,venn:rVenn,critique:rCrit,flow:rFlow,xyz:rXyz,scroll:rScroll,column:rColumn};
const PANEL={dialog:pDialog,interview:pInterview,venn:pVenn,critique:pCrit,flow:pFlow,xyz:pXyz,scroll:pScroll,column:pColumn};
function build(){const t=cur();const r=RENDER[t]();FIXED=!!r.fixed;
  if(r.fixed){VB={w:Math.ceil(r.w),h:Math.ceil(r.h)};DEFS=r.defs;BASE=r.body;return}
  VB={w:Math.ceil(r.w+PAD*2),h:Math.ceil(r.h+PAD*2)};DEFS=r.defs;BASE=`<g transform="translate(${r1(PAD-r.x)} ${r1(PAD-r.y)})">${r.body}</g>`}
function scaleNow(){const b=$('#base').getBoundingClientRect();return b.width/VB.w||1}
function applyZoom(){const wrapW=$('#stagewrap').clientWidth-40;let z;
  if(S.zoom==='fit')z=Math.min(1.2,wrapW/VB.w,Math.max(360,window.innerHeight-260)/VB.h);else z=parseInt(S.zoom)/100;
  const W=Math.round(VB.w*z),H=Math.round(VB.h*z);
  for(const id of['base','ovl']){const s=$('#'+id);s.setAttribute('width',W);s.setAttribute('height',H);s.setAttribute('viewBox',`0 0 ${VB.w} ${VB.h}`)}
  $('#stage').style.width=W+'px';$('#stage').style.height=H+'px'}
function renderBase(){build();const base=$('#base');base.innerHTML=`<defs>${DEFS}</defs>${BASE}`;const t=cur();
  if(!FIXED){try{const g=base.querySelector(':scope > g');const inner=g.innerHTML;const bb=g.getBBox();
    if(bb.width>0){VB={w:Math.ceil(bb.width+PAD*2),h:Math.ceil(bb.height+PAD*2)};BASE=`<g transform="translate(${r1(PAD-bb.x)} ${r1(PAD-bb.y)})">${inner}</g>`;base.innerHTML=`<defs>${DEFS}</defs>${BASE}`}}catch(e){}}
  applyZoom();renderOv();save()}
function renderOv(){$('#ovl').innerHTML=ovList().map((o,i)=>ovSvg(o,i,false)).join('')}
function renderPanel(){const t=cur();$('#panel').innerHTML=PANEL[t]();document.querySelectorAll('#tabs button').forEach(b=>b.classList.toggle('on',b.dataset.mode===t));
  $('#formDesc').textContent=FORM_DESC[t];$('#selFont').value=S.font;$('#selScaleFont').value=String(S.fscale);$('#selZoom').value=S.zoom;$('#inFname').value=S.fname;$('#inQno').value=S.qno}
function renderAll(){renderPanel();renderBase();renderOvPanel()}

/* ---------- 패널 입력 ---------- */
function setPath(path,val){const ks=path.split('.');let o=S;for(let i=0;i<ks.length-1;i++){if(o[ks[i]]==null)o[ks[i]]={};o=o[ks[i]]}o[ks[ks.length-1]]=val}
const panelEl=$('#panel');
panelEl.addEventListener('input',e=>{
  if(e.target.dataset.pq!=null){pickFor.q=e.target.value;const sc=panelEl.scrollTop;const pos=e.target.selectionStart;renderPanel();panelEl.scrollTop=sc;const inp=panelEl.querySelector('[data-pq]');if(inp){inp.focus();try{inp.setSelectionRange(pos,pos)}catch(_){}}return}
  const p=e.target.dataset.bind;if(!p)return;let v=e.target.type==='checkbox'?e.target.checked:e.target.value;
  if(e.target.type==='range'||e.target.type==='number'||/\.(n|gap|cols|fs|figH|width)$/.test(p))v=Number(v);
  setPath(p,v);renderBase()});
panelEl.addEventListener('change',e=>{const p=e.target.dataset.bind;if(!p)return;snap();
  if(e.target.type==='checkbox'||e.target.tagName==='SELECT'||/names|axes|flip/.test(p)){const sc=panelEl.scrollTop;renderPanel();panelEl.scrollTop=sc}});
panelEl.addEventListener('click',e=>{
  const sc=panelEl.scrollTop;const rp=()=>{renderPanel();panelEl.scrollTop=sc};
  const b=e.target.closest('[data-set]');if(b){let v=b.dataset.val;if(/^\d+$/.test(v))v=Number(v);setPath(b.dataset.set,v);snap();rp();renderBase();return}
  const pr=e.target.closest('[data-preset]');if(pr){applyPreset(pr.dataset.preset);snap();rp();renderBase();return}
  const pf=e.target.closest('[data-pickfor]');if(pf){const v=pf.dataset.pickfor;pickFor=v==='iv'?{kind:'interview',q:'',f:'all'}:{kind:'dialog',i:Number(v),q:'',f:'all'};rp();return}
  if(e.target.closest('[data-pclose]')){pickFor=null;rp();return}
  const fc=e.target.closest('[data-pf]');if(fc){pickFor.f=fc.dataset.pf;rp();return}
  const pk=e.target.closest('[data-pick]');if(pk){const id=pk.dataset.pick;
    if(pickFor.kind==='dialog'){S.dialog.slots[pickFor.i].id=id;syncSpeakers(S.dialog)}else S.interview.id=id;
    pickFor=null;snap();rp();renderBase();return}
  if(e.target.closest('[data-addslot]')){S.dialog.slots.push({id:'p118',flip:false});syncSpeakers(S.dialog);snap();rp();renderBase();return}
  const ds=e.target.closest('[data-delslot]');if(ds){S.dialog.slots.splice(Number(ds.dataset.delslot),1);syncSpeakers(S.dialog);snap();rp();renderBase();return}
  const rb=e.target.closest('[data-resetbub]');if(rb){S.dialog.speakers[Number(rb.dataset.resetbub)].bub=null;snap();renderBase();return}
  if(e.target.closest('[data-noportrait]')){S.interview.id=null;snap();rp();renderBase();return}
  if(e.target.closest('[data-addline]')){S.interview.lines.push({who:S.interview.lines.length%2?'질문자':'사상가',text:''});snap();rp();renderBase();return}
  const dl=e.target.closest('[data-delline]');if(dl){S.interview.lines.splice(Number(dl.dataset.delline),1);snap();rp();renderBase();return}
  const a=e.target.closest('[data-act]');if(a&&a.dataset.act==='legendFill'){S.venn.lover=vennLegendLines(S.venn).map(([x,y])=>x+': '+y).join('\n');snap();rp();renderBase()}
});
panelEl.addEventListener('focusin',e=>{const sp=e.target.closest('.sp-text');document.querySelectorAll('.sp-text').forEach(x=>x.classList.toggle('on',x===sp));
  if(sp)hiBub=Number(sp.dataset.sp);else hiBub=-1;renderOv()});
document.querySelectorAll('#tabs button').forEach(b=>b.addEventListener('click',()=>{S.tab=b.dataset.mode;sel=-1;pickFor=null;snap();renderAll();panelEl.scrollTop=0}));
$('#selFont').addEventListener('change',e=>{S.font=e.target.value;snap();renderBase()});
$('#selScaleFont').addEventListener('change',e=>{S.fscale=Number(e.target.value);snap();renderBase()});
$('#selZoom').addEventListener('change',e=>{S.zoom=e.target.value;applyZoom();renderOv();save()});
$('#inFname').addEventListener('input',e=>{S.fname=e.target.value;save()});
$('#inQno').addEventListener('input',e=>{S.qno=e.target.value;save()});
window.addEventListener('resize',()=>{if(S.zoom==='fit'){applyZoom();renderOv()}});
$('#bUndo').addEventListener('click',undo);$('#bRedo').addEventListener('click',redo);

/* ---------- 끌기 (말풍선 · 글상자 · 도식 글자) ---------- */
let moveMode=false,drag=null,hiBub=-1;
$('#bMove').addEventListener('click',()=>{moveMode=!moveMode;$('#bMove').classList.toggle('on',moveMode);$('#stage').classList.toggle('move',moveMode);$('#modeHint').textContent=moveMode?'도식의 글자·기호·범례를 끌어서 옮기세요.':''});
$('#bResetPos').addEventListener('click',()=>{S.offs[cur()]={};if(cur()==='dialog')S.dialog.speakers.forEach(s=>s.bub=null);snap();renderBase();toast('글자·말풍선 위치를 처음 자리로 돌렸습니다.')});
$('#bAddText').addEventListener('click',()=>addOv('text'));$('#bAddMark').addEventListener('click',()=>addOv('mark'));$('#bAddMask').addEventListener('click',()=>addOv('mask'));
$('#bClearOv').addEventListener('click',()=>{if(!ovList().length)return;S.ov[cur()]=[];sel=-1;save();snap();renderOv();renderOvPanel();toast('이 형태의 글상자·표식을 모두 지웠습니다.')});
function svgPt(e){const s=$('#ovl');const pt=s.createSVGPoint();pt.x=e.clientX;pt.y=e.clientY;return pt.matrixTransform(s.getScreenCTM().inverse())}
const stage=$('#stage');
/* 말풍선 조절 핸들(화면용) */
function bubHandles(){if(cur()!=='dialog')return'';const L=dialogLayout();let s='';const rr=8/scaleNow();
  L.bubs.forEach((b,i)=>{const bx=b.x,by=L.top+b.y;const tip={x:b.an.x+b.tipdx,y:L.figTop+10+b.tipdy};
    if(i===hiBub)s+=`<rect x="${r1(bx-3)}" y="${r1(by-3)}" width="${r1(b.w+6)}" height="${r1(b.h+6)}" fill="none" stroke="#2b6cb0" stroke-dasharray="5 3" vector-effect="non-scaling-stroke"/>`;
    s+=`<rect data-bh="${i}" x="${r1(bx+b.w-rr)}" y="${r1(by+b.h-rr)}" width="${r1(rr*2)}" height="${r1(rr*2)}" fill="#fff" stroke="#2b6cb0" stroke-width="1.5" vector-effect="non-scaling-stroke" style="cursor:nwse-resize"/>`;
    s+=`<circle data-bt="${i}" cx="${r1(tip.x)}" cy="${r1(tip.y)}" r="${r1(rr*0.9)}" fill="#2b6cb0" stroke="#fff" stroke-width="1.5" vector-effect="non-scaling-stroke" style="cursor:crosshair"/>`});
  return s}
const _renderOv=renderOv;renderOv=function(){$('#ovl').innerHTML=bubHandles()+ovList().map((o,i)=>ovSvg(o,i,false)).join('')};
function bubOf(i){const sp=S.dialog.speakers[i];if(!sp.bub)sp.bub={};return sp.bub}
stage.addEventListener('pointerdown',e=>{
  const p=svgPt(e);
  const bh=e.target.closest('[data-bh]');if(bh){const i=+bh.dataset.bh;const L=dialogLayout();const b=L.bubs[i];drag={kind:'bres',i,sx:p.x,sy:p.y,w:b.w,h:b.h};stage.setPointerCapture(e.pointerId);e.preventDefault();return}
  const bt=e.target.closest('[data-bt]');if(bt){const i=+bt.dataset.bt;const o=bubOf(i);drag={kind:'btail',i,sx:p.x,sy:p.y,tx:o.tx||0,ty:o.ty||0};stage.setPointerCapture(e.pointerId);e.preventDefault();return}
  const h=e.target.closest('[data-h]');if(h){const o=ovList()[+h.dataset.h];drag={kind:'resize',o,sx:p.x,sy:p.y,w:o.w,h:o.h,fs:o.fs};stage.setPointerCapture(e.pointerId);e.preventDefault();return}
  const g=e.target.closest('[data-ov]');if(g){sel=+g.dataset.ov;const o=ovList()[sel];drag={kind:'ov',o,sx:p.x,sy:p.y,ox:o.x,oy:o.y};renderOv();drag.el=$('#ovl').querySelector(`[data-ov="${sel}"]`);renderOvPanel();stage.setPointerCapture(e.pointerId);e.preventDefault();return}
  // 말풍선 본체(기본 레이어)
  $('#ovl').style.pointerEvents='none';const under=document.elementFromPoint(e.clientX,e.clientY);$('#ovl').style.pointerEvents='';
  const bb=under&&under.closest&&under.closest('#base [data-bub]');
  if(bb&&!moveMode){const i=+bb.dataset.bub;const o=bubOf(i);drag={kind:'bmove',i,sx:p.x,sy:p.y,dx:o.dx||0,dy:o.dy||0,el:bb};hiBub=i;renderOv();
    const ta=panelEl.querySelector(`[data-bind="dialog.speakers.${i}.text"]`);if(ta){document.querySelectorAll('.sp-text').forEach(x=>x.classList.toggle('on',x.dataset.sp==i));ta.scrollIntoView({block:'nearest'})}
    stage.setPointerCapture(e.pointerId);e.preventDefault();return}
  if(moveMode){const k=under&&under.closest&&under.closest('#base [data-k]');
    if(k){const key=k.dataset.k;const offs=S.offs[cur()];const o=offs[key]||{dx:0,dy:0};drag={kind:'k',key,el:k,sx:p.x,sy:p.y,dx:o.dx,dy:o.dy};stage.setPointerCapture(e.pointerId);e.preventDefault();return}}
  if(sel!==-1){sel=-1;renderOv();renderOvPanel()}
});
stage.addEventListener('pointermove',e=>{if(!drag)return;const p=svgPt(e);const dx=p.x-drag.sx,dy=p.y-drag.sy;
  if(drag.kind==='ov'){drag.o.x=drag.ox+dx;drag.o.y=drag.oy+dy;if(drag.el)drag.el.setAttribute('transform',`translate(${r1(drag.o.x)} ${r1(drag.o.y)})`)}
  else if(drag.kind==='resize'){const o=drag.o;if(o.t==='text')o.w=Math.max(40,drag.w+dx);else if(o.t==='mask'){o.w=Math.max(10,drag.w+dx);o.h=Math.max(10,drag.h+dy)}else o.fs=Math.max(8,Math.min(160,drag.fs+(dx+dy)/2));renderOv()}
  else if(drag.kind==='k'){drag.el.setAttribute('transform',`translate(${r1(drag.dx+dx)} ${r1(drag.dy+dy)})`);drag.ndx=drag.dx+dx;drag.ndy=drag.dy+dy}
  else if(drag.kind==='bmove'){const o=bubOf(drag.i);o.dx=drag.dx+dx;o.dy=drag.dy+dy;renderBaseLight()}
  else if(drag.kind==='bres'){const o=bubOf(drag.i);o.w=Math.max(80,drag.w+dx);o.h=Math.max(40,drag.h+dy);renderBaseLight()}
  else if(drag.kind==='btail'){const o=bubOf(drag.i);o.tx=drag.tx+dx;o.ty=drag.ty+dy;renderBaseLight()}
});
let lightT=0;function renderBaseLight(){build();$('#base').innerHTML=`<defs>${DEFS}</defs>${BASE}`;applyZoomKeep();renderOv()}
function applyZoomKeep(){const z=scaleNow()||1;const W=Math.round(VB.w*z),H=Math.round(VB.h*z);for(const id of['base','ovl']){const s=$('#'+id);s.setAttribute('width',W);s.setAttribute('height',H);s.setAttribute('viewBox',`0 0 ${VB.w} ${VB.h}`)}$('#stage').style.width=W+'px';$('#stage').style.height=H+'px'}
function endDrag(){if(!drag)return;
  if(drag.kind==='k'&&drag.ndx!=null){S.offs[cur()][drag.key]={dx:drag.ndx,dy:drag.ndy};drag=null;snap();renderBase();return}
  if(drag.kind==='resize'||drag.kind==='ov')renderOvPanel();
  if(['bmove','bres','btail'].includes(drag.kind)){drag=null;snap();renderBase();return}
  drag=null;save();snap()}
stage.addEventListener('pointerup',endDrag);stage.addEventListener('pointercancel',endDrag);
document.addEventListener('keydown',e=>{
  const tag=(e.target.tagName||'').toLowerCase();const typing=tag==='input'||tag==='textarea'||tag==='select';
  if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='s'){e.preventDefault();saveToGallery();return}
  if((e.ctrlKey||e.metaKey)&&!typing&&e.key.toLowerCase()==='z'){e.preventDefault();e.shiftKey?redo():undo();return}
  if((e.ctrlKey||e.metaKey)&&!typing&&e.key.toLowerCase()==='y'){e.preventDefault();redo();return}
  if(typing)return;
  if(sel>=0){const o=ovList()[sel];if(!o)return;
    if(e.key==='Delete'||e.key==='Backspace'){ovList().splice(sel,1);sel=-1;save();snap();renderOv();renderOvPanel();e.preventDefault();return}
    const st=e.shiftKey?10:1;const mv={ArrowLeft:[-st,0],ArrowRight:[st,0],ArrowUp:[0,-st],ArrowDown:[0,st]}[e.key];if(mv){o.x+=mv[0];o.y+=mv[1];save();renderOv();e.preventDefault()}}
  else if(hiBub>=0&&cur()==='dialog'){const st=e.shiftKey?10:1;const mv={ArrowLeft:[-st,0],ArrowRight:[st,0],ArrowUp:[0,-st],ArrowDown:[0,st]}[e.key];if(mv){const o=bubOf(hiBub);o.dx=(o.dx||0)+mv[0];o.dy=(o.dy||0)+mv[1];renderBase();e.preventDefault()}}
});

/* ============================================================
   내보내기
   ============================================================ */
const dataCache={};
async function toDataUrl(url){if(dataCache[url])return dataCache[url];const r=await fetch(url);const b=await r.blob();const d=await new Promise(res=>{const fr=new FileReader();fr.onload=()=>res(fr.result);fr.readAsDataURL(b)});dataCache[url]=d;return d}
async function inlineImages(svg){const hrefs=[...new Set([...svg.matchAll(/href="([^"]+\.webp)"/g)].map(m=>m[1]))];
  for(const h of hrefs){try{const d=await toDataUrl(h);svg=svg.split(`href="${h}"`).join(`href="${d}"`)}catch(e){}}return svg}
async function exportSvg(){const trans=$('#chkTrans').checked;const ov=ovList().map((o,i)=>ovSvg(o,i,true)).join('');
  let svg=`<svg xmlns="${NS}" xmlns:xlink="http://www.w3.org/1999/xlink" width="${VB.w}" height="${VB.h}" viewBox="0 0 ${VB.w} ${VB.h}"><defs>${DEFS}</defs>${trans?'':`<rect width="100%" height="100%" fill="#fff"/>`}${BASE}${ov}</svg>`;
  return await inlineImages(svg)}
const FNAME={dialog:'사상가대화',interview:'인터뷰',venn:'벤다이어그램',critique:'상호비판',flow:'순서도',xyz:'XYZ',scroll:'두루마리',column:'칼럼'};
function fname(ext){const d=new Date(),p=n=>String(n).padStart(2,'0');const base=(S.fname||'윤리_자료').trim();return `${base}_${FNAME[cur()]}_${d.getFullYear()}${p(d.getMonth()+1)}${p(d.getDate())}_${p(d.getHours())}${p(d.getMinutes())}.${ext}`}
function download(blob,name){const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=name;document.body.appendChild(a);a.click();setTimeout(()=>{URL.revokeObjectURL(a.href);a.remove()},1500)}
async function toPng(scale){const sc=scale||Number($('#selScale').value)||3;const svg=await exportSvg();
  return new Promise((res,rej)=>{const img=new Image();
    img.onload=()=>{const c=document.createElement('canvas');c.width=Math.round(VB.w*sc);c.height=Math.round(VB.h*sc);const x=c.getContext('2d');
      if(!$('#chkTrans').checked){x.fillStyle='#fff';x.fillRect(0,0,c.width,c.height)}x.drawImage(img,0,0,c.width,c.height);c.toBlob(b=>b?res(b):rej(new Error('blob')),'image/png')};
    img.onerror=()=>rej(new Error('img'));const bytes=new TextEncoder().encode(svg);let bin='';const CH=0x8000;for(let i=0;i<bytes.length;i+=CH)bin+=String.fromCharCode.apply(null,bytes.subarray(i,i+CH));img.src='data:image/svg+xml;base64,'+btoa(bin)})}
$('#bPng').addEventListener('click',async()=>{try{const b=await toPng();download(b,fname('png'));toast('PNG 파일을 저장했습니다.')}catch(e){toast('PNG를 만들지 못했습니다. 크롬·엣지에서 시도해 주세요.')}});
$('#bSvg').addEventListener('click',async()=>{download(new Blob([await exportSvg()],{type:'image/svg+xml'}),fname('svg'));toast('SVG 파일을 저장했습니다.')});
$('#bPrint').addEventListener('click',async()=>{try{const b=await toPng();const url=URL.createObjectURL(b);const pa=$('#printArea');pa.innerHTML=`<img src="${url}" alt="">`;
  const img=pa.querySelector('img');await new Promise(r=>{img.onload=r;setTimeout(r,800)});window.print();setTimeout(()=>{pa.innerHTML='';URL.revokeObjectURL(url)},1000)}catch(e){toast('인쇄용 이미지를 만들지 못했습니다.')}});
$('#bCopy').addEventListener('click',async()=>{try{if(!navigator.clipboard||!window.ClipboardItem)throw 0;await navigator.clipboard.write([new ClipboardItem({'image/png':toPng()})]);toast('이미지를 복사했습니다. 한글 문서에 Ctrl+V로 붙여 넣으세요.')}
  catch(e){toast('이 브라우저에서는 복사가 막혀 있습니다. PNG 저장을 이용해 주세요.')}});

/* ============================================================
   내 갤러리
   ============================================================ */
function galLoad(){try{return JSON.parse(localStorage.getItem(GAL)||'[]')}catch(e){return[]}}
function galSave(list){try{localStorage.setItem(GAL,JSON.stringify(list))}catch(e){toast('갤러리 저장 공간이 부족합니다. 오래된 항목을 지워 주세요.')}$('#galCount').textContent=galLoad().length}
async function saveToGallery(){try{const b=await toPng(0.6);const thumb=await new Promise(res=>{const fr=new FileReader();fr.onload=()=>res(fr.result);fr.readAsDataURL(b)});
  const list=galLoad();list.unshift({id:Date.now(),date:new Date().toISOString(),form:cur(),formName:FNAME[cur()],qno:S.qno||'',fname:S.fname||'',thumb,state:clone(S)});
  if(list.length>40)list.length=40;galSave(list);toast('갤러리에 저장했습니다. (이 브라우저에만 보관)')}catch(e){toast('갤러리에 저장하지 못했습니다.')}}
$('#bSaveGal').addEventListener('click',saveToGallery);
function renderGallery(){const list=galLoad();const B=$('#galBody');
  if(!list.length){B.innerHTML='<p class="empty">저장한 그림이 없습니다. 「갤러리에 저장」 또는 Ctrl+S로 저장하세요.</p>';return}
  B.innerHTML=`<div class="galgrid">${list.map(g=>`<div class="galcard"><img src="${g.thumb}" alt=""><div class="gi"><b>${esc(g.qno||g.fname||g.formName)}</b><span class="mono">${esc(g.formName)} · ${new Date(g.date).toLocaleString('ko-KR',{month:'numeric',day:'numeric',hour:'numeric',minute:'2-digit'})}</span></div>
    <div class="ga"><button class="btn" data-gload="${g.id}">불러오기</button><button class="btn" data-gpng="${g.id}">PNG</button><button class="btn danger" data-gdel="${g.id}">삭제</button></div></div>`).join('')}</div>`}
$('#galBody').addEventListener('click',async e=>{const list=galLoad();
  const l=e.target.closest('[data-gload]');if(l){const g=list.find(x=>x.id==l.dataset.gload);if(g){S=Object.assign(defaults(),g.state);merge();sel=-1;snap();renderAll();closeModals();toast('갤러리에서 불러왔습니다.')}return}
  const d=e.target.closest('[data-gdel]');if(d){galSave(list.filter(x=>x.id!=d.dataset.gdel));renderGallery();return}
  const p=e.target.closest('[data-gpng]');if(p){const g=list.find(x=>x.id==p.dataset.gpng);if(!g)return;const keep=JSON.stringify(S);S=Object.assign(defaults(),g.state);merge();build();
    try{const b=await toPng();download(b,fname('png'))}catch(_){toast('PNG를 만들지 못했습니다.')}S=Object.assign(defaults(),JSON.parse(keep));merge();build();return}});

/* ---------- 모달 ---------- */
function closeModals(){document.querySelectorAll('.modal').forEach(m=>m.hidden=true)}
document.querySelectorAll('[data-close]').forEach(b=>b.addEventListener('click',()=>{if($('#chkNoGuide').checked)localStorage.setItem(GUIDE,'1');closeModals()}));
document.querySelectorAll('.modal').forEach(m=>m.addEventListener('click',e=>{if(e.target===m)closeModals()}));
$('#bGuide').addEventListener('click',()=>{$('#guideModal').hidden=false});
$('#bGallery').addEventListener('click',()=>{renderGallery();$('#galModal').hidden=false});

/* ---------- 시작 ---------- */
(async function(){
  await loadAssets();
  $('#galCount').textContent=galLoad().length;
  renderAll();updUndo();
  if(!localStorage.getItem(GUIDE)){$('#chkNoGuide').checked=true;$('#guideModal').hidden=false}
})();
