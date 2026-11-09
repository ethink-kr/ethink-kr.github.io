#!/usr/bin/env python3
"""윤리 클립아트 생성기 오프라인 단일 HTML 빌드.
   사용: python3 _tools/build-clipart-offline.py  (저장소 루트에서)
   결과: tools/clipart/ethink-clipart-offline.html (CSS·JS·인물 삽화 전부 포함)"""
import os,json,base64,re
ROOT=os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
D=os.path.join(ROOT,'tools','clipart')
html=open(os.path.join(D,'index.html'),encoding='utf-8').read()
css=open(os.path.join(D,'style.css'),encoding='utf-8').read()
js=open(os.path.join(D,'app.js'),encoding='utf-8').read()
j=json.load(open(os.path.join(D,'packs','thinkers.json'),encoding='utf-8'))
imgs={}
for f in sorted(os.listdir(os.path.join(D,'packs','thinkers'))):
    if f.endswith('.webp'):
        imgs[f]='data:image/webp;base64,'+base64.b64encode(open(os.path.join(D,'packs','thinkers',f),'rb').read()).decode()
off='<script>window.__ETHINK_OFFLINE='+json.dumps({'json':j,'imgs':imgs},ensure_ascii=False).replace('</','<\\/')+';</script>'
html=re.sub(r'<link rel="stylesheet" href="style\.css[^"]*">',lambda m:'<style>\n'+css.replace('</','<\\/')+'\n</style>',html)
html=re.sub(r'<script src="app\.js[^"]*"></script>',lambda m:off+'\n<script>\n'+js.replace('</script>','<\\/script>')+'\n</script>',html)
html=html.replace('href="guide.html"','href="https://ethink.kr/tools/clipart/guide.html"')
html=html.replace('href="/"','href="https://ethink.kr/"')
html=re.sub(r'<a class="btn" href="ethink-clipart-offline\.html"[^>]*>오프라인용 내려받기</a>','',html)
html=html.replace('<title>윤리 클립아트 생성기 · Ethink</title>','<title>윤리 클립아트 생성기 (오프라인) · Ethink</title>')
html=html.replace('<span class="badge">출제 도구</span>','<span class="badge">출제 도구 · 오프라인판</span>')
out=os.path.join(D,'ethink-clipart-offline.html')
open(out,'w',encoding='utf-8').write(html)
print(out, round(os.path.getsize(out)/1024/1024,2),'MB', len(imgs),'images')
