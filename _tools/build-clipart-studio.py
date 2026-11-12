#!/usr/bin/env python3
"""[주의] v1.2.0(2026-11-12)부터는 tools/clipart/index.html을 직접 고칩니다. 이 스크립트를 다시 돌리면 v1.2.0 수정분이 v1.1.0으로 덮어써지니 실행하지 마세요. 삽화를 새로 넣을 때 img/·assets.json 만드는 부분만 참고하세요.

윤리 출제 클립아트 스튜디오(웹판) 빌드.
   10월 15일자 「길벗 도덕·윤리 출제 클립아트 스튜디오 v1.0.0.html」(단일 파일)을
   웹 게시용으로 풀어 놓습니다: 삽화는 img/ 폴더의 파일로 빼고, 화면·코드는 그대로 둡니다.
   사용: python3 build-clipart-studio.py <v1.html 경로> <출력 폴더>"""
import sys,re,json,base64,os
src=open(sys.argv[1],encoding='utf-8').read(); OUT=sys.argv[2]
os.makedirs(os.path.join(OUT,'img'),exist_ok=True)
m=re.search(r'<script[^>]*id="assets"[^>]*>(.*?)</script>',src,re.S)
assets=json.loads(m.group(1)); meta=[]
for a in assets:
    open(os.path.join(OUT,'img',a['id']+'.jpg'),'wb').write(base64.b64decode(a['full']))
    open(os.path.join(OUT,'img',a['id']+'.t.jpg'),'wb').write(base64.b64decode(a['thumb']))
    meta.append({k:v for k,v in a.items() if k not in('full','thumb')})
json.dump(meta,open(os.path.join(OUT,'assets.json'),'w',encoding='utf-8'),ensure_ascii=False)
html=src.replace(m.group(0),'')
def rep(old,new,count=1):
    global html
    assert old in html, old[:60]
    html=html.replace(old,new,count)
# --- 삽화: 내장 base64 → 파일에서 불러오기
rep("const ASSETS=JSON.parse(document.getElementById('assets').textContent);\nconst AMAP={};ASSETS.forEach(a=>AMAP[a.id]=a);",
    "let ASSETS=[];const AMAP={};const FULL={};\nfunction loadFull(id){if(FULL[id])return;FULL[id]='loading';fetch('img/'+id+'.jpg').then(r=>r.blob()).then(b=>{const fr=new FileReader();fr.onload=()=>{FULL[id]=fr.result;renderBase()};fr.readAsDataURL(b)}).catch(()=>{FULL[id]=null;toast('그림을 불러오지 못했습니다.')})}")
rep('src="data:image/jpeg;base64,${a.thumb}"','src="img/${a.id}.t.jpg"')
rep("""  const W=1000,H=Math.round(W*a.h/a.w);
  return {defs:'',body:`<image href="data:image/jpeg;base64,${a.full}\"""",
    """  const W=1000,H=Math.round(W*a.h/a.w);
  if(!FULL[a.id]||FULL[a.id]==='loading'){loadFull(a.id);return {defs:'',body:txt(500,H/2,'그림을 불러오는 중입니다…',{fs:26}),x:0,y:0,w:W,h:H}}
  return {defs:'',body:`<image href="${FULL[a.id]}\"""")
i=html.rindex('renderAll();')
html=html[:i]+"fetch('assets.json').then(r=>r.json()).then(j=>{ASSETS=j;ASSETS.forEach(a=>AMAP[a.id]=a);renderAll()}).catch(()=>{renderAll();toast('삽화 목록을 불러오지 못했습니다.')});"+html[i+len('renderAll();'):]
rep("const STORE='gilbut-ethics-clipart-v1';","const STORE='ethink-clipart-studio-v1';")
# --- 표기: Ethink 중심, 길벗 보조
html=re.sub(r'<img alt="길벗" src="data:image/png;base64,[^"]+">','<a class="ebrand" href="/" title="Ethink 홈으로">Ethink</a>',html,count=1)
rep('<title>길벗 도덕·윤리 출제 클립아트 스튜디오</title>','<title>윤리 출제 클립아트 스튜디오 · Ethink</title>\n<meta name="description" content="벤다이어그램·상호 비판·순서도·XYZ 도식과 사상가·양식 삽화로 윤리 시험지와 활동지 그림을 만드는 도구입니다.">')
rep('<h1>길벗 도덕·윤리 출제 클립아트 스튜디오</h1>','<h1>윤리 출제 클립아트 스튜디오</h1>')
rep('<span class="badge">인터넷 없이 사용</span><span class="badge">v1.0.0</span>','<span class="badge">v1.1.0 웹판</span>')
rep('<footer>제공 (주)도서출판 길벗 · 길벗 도덕·윤리 출제 클립아트 스튜디오 v1.0.0 · 최종 수정 2026. 10. 15.</footer>',
    '<footer>제작 Ethink(에씽크) · 삽화 (주)도서출판 길벗 「윤리 기출문제 클립아트」 · 윤리 출제 클립아트 스튜디오 v1.1.0 (첫 판 2026. 10. 15.) · <a href="/" style="color:inherit">ethink.kr</a></footer>')
rep('</style>','.ebrand{font-family:"Gowun Batang","Nanum Myeongjo",serif;font-weight:700;font-size:26px;color:#fff;text-decoration:none;letter-spacing:.01em}\n</style>')
open(os.path.join(OUT,'index.html'),'w',encoding='utf-8').write(html)
print(len(meta),'assets;','index.html',len(html)//1024,'KB')
