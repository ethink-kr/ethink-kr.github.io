#!/usr/bin/env python3
"""윤리 실험실 활동지 HWPX 만들기 (웹 「활동지 인쇄」 화면과 같은 내용)

python3 _tools/worksheet-hwpx.py <skill_dir> <out_dir>
→ files/ethics-lab-01-thinker-worksheet.hwpx, files/ethics-lab-02-timetable-worksheet.hwpx
HWPX 스킬의 report 템플릿 header.xml을 바탕으로 글자·테두리 스타일 몇 개를 더해 쓴다.
"""
import re, subprocess, sys, tempfile, os
from xml.sax.saxutils import escape

SKILL, OUT = sys.argv[1], sys.argv[2]

# ── 쪽 설정 (mm → HWPUNIT) ─────────────────────────────
MM = 283.465
PAGE_W = 59528
M_LR, M_TOP, M_BOT, M_HEAD, M_FOOT = round(18 * MM), round(14 * MM), round(12 * MM), round(4 * MM), round(4 * MM)
BODY_W = PAGE_W - 2 * M_LR

# ── header.xml: report 템플릿 + 활동지용 스타일 ──────────────
hdr = open(f"{SKILL}/templates/report/header.xml", encoding="utf-8").read()
hdr = hdr.replace('faceColor="#D9D9D9"', 'faceColor="#EEEEEE"')          # 표 머리 칸: 옅은 회색
CHAR_BASE = re.search(r'<hh:charPr id="1" .*?</hh:charPr>', hdr, re.S).group(0)  # 10pt 함초롬돋움

def char(i, height, bold=False, color="#000000"):
    c = CHAR_BASE.replace('id="1"', f'id="{i}"', 1).replace('height="1000"', f'height="{height}"', 1)
    c = c.replace('textColor="#000000"', f'textColor="{color}"', 1)
    if bold:
        c = c.replace('<hh:underline', '<hh:bold/>\n        <hh:underline', 1)
    return c

NEW_CHARS = [char(16, 1800, True), char(17, 1050, True), char(18, 1000, True), char(19, 850, False, "#555555"), char(20, 1000)]
hdr = hdr.replace("</hh:charProperties>", "\n".join(NEW_CHARS) + "\n</hh:charProperties>")
n_char = len(re.findall(r"<hh:charPr ", hdr))
hdr = re.sub(r'<hh:charProperties itemCnt="\d+"', f'<hh:charProperties itemCnt="{n_char}"', hdr)

BF_BOTTOM = '''<hh:borderFill id="7" threeD="0" shadow="0" centerLine="NONE" breakCellSeparateLine="0">
        <hh:slash type="NONE" Crooked="0" isCounter="0"/>
        <hh:backSlash type="NONE" Crooked="0" isCounter="0"/>
        <hh:leftBorder type="NONE" width="0.1 mm" color="#000000"/>
        <hh:rightBorder type="NONE" width="0.1 mm" color="#000000"/>
        <hh:topBorder type="NONE" width="0.1 mm" color="#000000"/>
        <hh:bottomBorder type="SOLID" width="0.12 mm" color="#000000"/>
        <hh:diagonal type="SOLID" width="0.1 mm" color="#000000"/>
      </hh:borderFill>'''
BF_THICK = BF_BOTTOM.replace('id="7"', 'id="8"').replace('<hh:bottomBorder type="SOLID" width="0.12 mm"', '<hh:bottomBorder type="SOLID" width="0.5 mm"')
hdr = hdr.replace("</hh:borderFills>", BF_BOTTOM + "\n      " + BF_THICK + "\n    </hh:borderFills>")
n_bf = len(re.findall(r"<hh:borderFill ", hdr))
hdr = re.sub(r'<hh:borderFills itemCnt="\d+"', f'<hh:borderFills itemCnt="{n_bf}"', hdr)

# 스타일 번호
C_TITLE, C_Q, C_TH, C_NOTE, C_TD = 16, 17, 18, 19, 20
P_LEFT, P_Q, P_CENTER_CELL, P_CELL, P_NOTE = 11, 12, 21, 22, 9
BF_NONE, BF_LINE, BF_HEAD, BF_UNDER, BF_RULE = 2, 3, 6, 7, 8

# ── section0.xml 조립 ──────────────────────────────────
_id = [1000000001]
def nid():
    _id[0] += 1
    return _id[0]

def para(text, char_id, para_id=P_LEFT, page_break=False):
    t = f"<hp:t>{escape(text)}</hp:t>" if text else "<hp:t/>"
    return (f'<hp:p id="{nid()}" paraPrIDRef="{para_id}" styleIDRef="0" pageBreak="{1 if page_break else 0}" columnBreak="0" merged="0">'
            f'<hp:run charPrIDRef="{char_id}">{t}</hp:run></hp:p>')

def cell(text, col, row, w, h, bf, char_id, para_id, valign="CENTER"):
    t = f"<hp:t>{escape(text)}</hp:t>" if text else "<hp:t/>"
    return (f'<hp:tc name="" header="0" hasMargin="0" protect="0" editable="0" dirty="1" borderFillIDRef="{bf}">'
            f'<hp:subList id="" textDirection="HORIZONTAL" lineWrap="BREAK" vertAlign="{valign}" linkListIDRef="0" '
            f'linkListNextIDRef="0" textWidth="0" textHeight="0" hasTextRef="0" hasNumRef="0">'
            f'<hp:p paraPrIDRef="{para_id}" styleIDRef="0" pageBreak="0" columnBreak="0" merged="0" id="{nid()}">'
            f'<hp:run charPrIDRef="{char_id}">{t}</hp:run></hp:p></hp:subList>'
            f'<hp:cellAddr colAddr="{col}" rowAddr="{row}"/><hp:cellSpan colSpan="1" rowSpan="1"/>'
            f'<hp:cellSz width="{w}" height="{h}"/><hp:cellMargin left="510" right="510" top="141" bottom="141"/></hp:tc>')

def table(rows, widths, heights, border=BF_LINE):
    """rows: [[(text, kind)...]] kind: head|text|center|blank|label|under"""
    assert sum(widths) == BODY_W, (sum(widths), BODY_W)
    trs = []
    for r, row in enumerate(rows):
        tds = []
        for c, (text, kind) in enumerate(row):
            bf, ch, pa, va = {
                "head": (BF_HEAD, C_TH, P_CENTER_CELL, "CENTER"),
                "text": (border, C_TD, P_CELL, "CENTER"),
                "center": (border, C_TD, P_CENTER_CELL, "CENTER"),
                "blank": (border, C_TD, P_CELL, "TOP"),
                "label": (BF_NONE, C_TD, P_CELL, "BOTTOM"),
                "under": (BF_UNDER, C_TD, P_CELL, "BOTTOM"),
            }[kind]
            tds.append(cell(text, c, r, widths[c], heights[r], bf, ch, pa, va))
        trs.append("<hp:tr>" + "".join(tds) + "</hp:tr>")
    tid = nid()
    return (f'<hp:p id="{nid()}" paraPrIDRef="{P_LEFT}" styleIDRef="0" pageBreak="0" columnBreak="0" merged="0"><hp:run charPrIDRef="{C_TD}">'
            f'<hp:tbl id="{tid}" zOrder="0" numberingType="TABLE" textWrap="TOP_AND_BOTTOM" textFlow="BOTH_SIDES" lock="0" '
            f'dropcapstyle="None" pageBreak="CELL" repeatHeader="0" rowCnt="{len(rows)}" colCnt="{len(widths)}" cellSpacing="0" '
            f'borderFillIDRef="{border}" noAdjust="0">'
            f'<hp:sz width="{BODY_W}" widthRelTo="ABSOLUTE" height="{sum(heights)}" heightRelTo="ABSOLUTE" protect="0"/>'
            f'<hp:pos treatAsChar="1" affectLSpacing="0" flowWithText="1" allowOverlap="0" holdAnchorAndSO="0" vertRelTo="PARA" '
            f'horzRelTo="COLUMN" vertAlign="TOP" horzAlign="LEFT" vertOffset="0" horzOffset="0"/>'
            f'<hp:outMargin left="0" right="0" top="0" bottom="0"/><hp:inMargin left="510" right="510" top="141" bottom="141"/>'
            + "".join(trs) + "</hp:tbl></hp:run></hp:p>")

def box(h_mm):
    return table([[("", "blank")]], [BODY_W], [round(h_mm * MM)])

def split(total, ratios):
    ws = [round(total * r / sum(ratios)) for r in ratios]
    ws[-1] += total - sum(ws)
    return ws

def meta_row(labels):
    lw = [round(24 * MM), round(13 * MM), round(21 * MM)][: len(labels)]
    rest = BODY_W - sum(lw)
    vw = split(rest, [1.3, 1.6, 0.6][: len(labels)])
    widths, cells = [], []
    for l, a, b in zip(labels, lw, vw):
        widths += [a, b]
        cells += [(l, "label"), ("", "under")]
    return table([cells], widths, [round(9 * MM)], border=BF_NONE)

def first_para():
    sec = open(f"{SKILL}/templates/report/section0.xml", encoding="utf-8").read()
    p = re.search(r'<hp:p id="1000000001".*?</hp:p>', sec, re.S).group(0)
    p = re.sub(r'<hp:margin [^>]*/>', f'<hp:margin header="{M_HEAD}" footer="{M_FOOT}" gutter="0" left="{M_LR}" right="{M_LR}" top="{M_TOP}" bottom="{M_BOT}"/>', p)
    return p, sec[: sec.index("<hp:p ")]

def build(name, title, meta_labels, body, note):
    fp, head = first_para()
    parts = [fp, para(title, C_TITLE, P_LEFT), meta_row(meta_labels)] + body + [para(note, C_NOTE, P_Q)]
    xml = head + "\n".join(parts) + "\n</hs:sec>\n"
    with tempfile.TemporaryDirectory() as d:
        hp, sp = os.path.join(d, "header.xml"), os.path.join(d, "section0.xml")
        open(hp, "w", encoding="utf-8").write(hdr)
        open(sp, "w", encoding="utf-8").write(xml)
        out = os.path.join(OUT, name)
        subprocess.run([sys.executable, f"{SKILL}/scripts/build_hwpx.py", "--header", hp, "--section", sp,
                        "--title", title, "--creator", "Ethink", "--output", out], check=True)
        subprocess.run([sys.executable, f"{SKILL}/scripts/validate.py", out], check=True)

def q(text, page_break=False):
    return para(text, C_Q, P_Q, page_break)

# ── EXPERIENCE 01 나와 닮은 사상가 ─────────────────────────
AX = [("옳음의 기준", "원칙과 의무", "행복과 결과"), ("삶의 무게중심", "나와 자유", "우리와 공동체"), ("변화의 방향", "마음 닦기", "세상 바꾸기")]
LW = round(26 * MM)
thinker = [
    q("1. 끝까지 남은 문장과 그 주인"),
    table([[("남은 문장", "head"), ("", "blank")], [("사상가", "head"), ("", "text")], [("결승 상대", "head"), ("", "text")], [("나의 결", "head"), ("", "text")]],
          [LW, BODY_W - LW], [round(15 * MM), round(8 * MM), round(8 * MM), round(8 * MM)]),
    q("2. 나의 윤리적 결 — 결과 화면에서 점이 놓인 쪽에 표시"),
    table([[(a, "head"), ("☐ " + n, "text"), ("☐ 가운데", "text"), ("☐ " + p, "text")] for a, n, p in AX],
          [LW] + split(BODY_W - LW, [3, 2, 3]), [round(8 * MM)] * 3),
    q("3. 끝까지 남은 문장을 고른 이유. 어떤 말이 마음을 움직였나요?"), box(22),
    q("4. 결과로 나온 사상가의 생각 가운데 동의하는 점 하나, 동의하기 어려운 점 하나"), box(28),
    q("5. 결승에서 떨어진 문장의 사상가는 무엇을 중시했나요? 두 사상가가 맞선다면 어떤 쟁점에서 부딪힐까요?"), box(28),
    q("6. 추천 책에서 확인해 보고 싶은 질문 하나"), box(18),
]
build("ethics-lab-01-thinker-worksheet.hwpx", "나와 닮은 사상가는? — 활동지", ["학년·반·번호", "이름", "범위"], thinker,
      "문장은 수능·평가원·교육청 학력평가 제시문과 길벗 교과서에서 가져왔습니다. 결과는 이번 판에서 고른 문장의 무게일 뿐 성격 검사가 아닙니다.")

# ── EXPERIENCE 02 내 삶의 시간표 ──────────────────────────
CATS = [("일과 준비", "추가 업무·진로 준비"), ("관계", "친구·가족과 함께하는 시간"), ("돌봄", "누군가의 일상을 돕는 시간"), ("휴식", "쉬기·산책·아무것도 하지 않기"),
        ("배움", "성적·성과와 무관하게 배우기"), ("공동체", "이웃·사회에 참여하기"), ("나의 즐거움", "취미·놀이·혼자만의 몰입")]
PROMPTS = ["처음에 가장 중요하게 생각한 가치는 무엇인가요?", "사건과 읽은 글을 만나고 새롭게 고려한 것은 무엇인가요?",
           "유지하거나 바꾼 선택을 어떤 근거로 설명할 수 있나요?", "내 삶에서 해 볼 작은 실천, 또는 함께 바꾸고 싶은 조건은 무엇인가요?"]
tw = split(BODY_W, [2.2, 4.2, 1.2, 1.2, 1.2])
rows = [[("삶의 영역", "head"), ("뜻", "head"), ("처음", "head"), ("다시 선택", "head"), ("변화", "head")]]
rows += [[(c, "text"), (m, "text"), ("", "center"), ("", "center"), ("", "center")] for c, m in CATS]
rows += [[("새 일정(사건에서 선택)", "text"), ("", "text"), ("0", "center"), ("", "center"), ("", "center")],
         [("합계", "head"), ("", "text"), ("56", "center"), ("56", "center"), ("", "center")]]
timetable = [
    q("1. 다온의 일주일 56시간을 배분하고, 사건 이후 다시 배분해 봅시다."),
    table(rows, tw, [round(7.5 * MM)] * len(rows)),
    q("2. 내가 고른 사건과 선택, 그 이유"), box(36),
    q("3. 읽은 문장 가운데 다온의 선택을 가장 흔든 문장과 그 까닭"), box(36),
    q("4. 성찰 기록", page_break=True),  # 앞면 1~3, 뒷면 4~5
]
for i, p in enumerate(PROMPTS):
    timetable += [para(f"{i + 1}) {p}", C_TD, P_LEFT), box(30 if i == 2 else 24)]
timetable += [q("5. 모둠의 한 문장 — 합의한 원칙 / 합의하지 못한 지점"), box(24)]
build("ethics-lab-02-timetable-worksheet.hwpx", "내 삶의 시간표 — 활동지", ["학년·반·번호", "이름", "사건 번호"], timetable,
      "168시간 중 기본생활·필수일정 112시간을 제외한 56시간을 배분하는 수업용 가정입니다. 배분의 증감은 가치의 우열이나 도덕성 점수를 뜻하지 않습니다.")
