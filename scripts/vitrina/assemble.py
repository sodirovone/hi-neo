# -*- coding: utf-8 -*-
"""vitrina.html ni qismlardan yig'adi: qobiq CSS + 64 animatsiya CSS + HTML + ma'lumotlar + JS.

Ishlatish: assemble.py <plagin_papkasi> <asl_vitrina> [sayt_fayli]
Uchinchi argument berilsa, hiworld.club uchun nusxa ham yoziladi (canonical va og teglar bilan).
"""
import json, re, sys, os

S = os.path.dirname(os.path.abspath(__file__)) + "/"
ROOT = sys.argv[1].rstrip("/") + "/"
OUT = ROOT + "skills/vitrina/assets/vitrina.html"
SITE_OUT = sys.argv[3] if len(sys.argv) > 3 else None


def rd(p):
    return open(p, encoding="utf-8").read().replace("\r\n", "\n")



shell = rd(S + "shell.css").replace("__LOGO_URI__", rd(S + "logo.uri").strip())
anim_css = rd(ROOT + "skills/animatsiya/assets/neo-animations.css").rstrip("\n")
# Ko'rgazmada animatsiyalar doim o'ynaydi: «harakatni kamaytirish» bloki faqat vitrina nusxasidan olinadi
anim_css, _n = re.subn(r"@media \(prefers-reduced-motion: reduce\) \{\n  \[class\*=\"neo-anim-\"\] \{.*?\n  \}\n\}\n", "", anim_css, count=1, flags=re.S)
assert _n == 1, "reduced-motion bloki topilmadi"
body = rd(S + "body.html")
logic = rd(S + "logic.js")

ef = json.loads(rd(ROOT + "skills/effekt/references/effektlar.json"))
an = json.loads(rd(ROOT + "skills/animatsiya/references/animatsiyalar.json"))
sh = json.loads(rd(ROOT + "skills/shrift/references/shriftlar.json"))
ic = json.loads(rd(ROOT + "skills/ikonka/references/ikonkalar.json"))
rg = json.loads(rd(ROOT + "skills/rang/references/palitralar.json"))
gr = json.loads(rd(ROOT + "skills/rang/references/gradientlar.json"))
hm = json.loads(rd(ROOT + "skills/sahifa/references/hero-maketlar.json"))
IC_NUM = len(ic["ikonkalar"])
IC_N = format(IC_NUM, ",")
IC_CATS = len(ic["meta"]["kategoriyalar"])
PAL_NUM = len(rg["palitralar"])
GR_NUM = len(gr["gradientlar"])
COLOR_NUM = PAL_NUM + GR_NUM
HM_NUM = len(hm["maketlar"])
md = rd(ROOT + "skills/sahifa/references/maket-shablonlar.md")
maket = re.search(r"```html\n(.*?)\n```", md, re.S).group(1) + "\n"

ANIM_STYLES = {"kirish": "Kirish va paydo bo'lish (Entrance)", "interaktiv": "Mikro-interaksiya va UI", "matn": "Tipografiya va matn", "fon": "Fon va atmosfera (Ambient)", "uch-olcham": "3D va perspektiva (CSS 3D)", "yuklanish": "Yuklanish va indikatorlar", "nur-chegara": "Chegara va yorug'lik (Glow)", "otish": "Sahifa va bo'lim o'tishlari"}


def js(v):
    # </script> va HTML izohlari skript ichida sinmasligi uchun
    return json.dumps(v, ensure_ascii=False, separators=(",", ":")).replace("</", "<\\/").replace("<!--", "<\\!--")


fonts = [{k: f[k] for k in ("id", "raqam", "nom", "uslub", "vaznlar", "kirill", "qayerda", "link", "css")} for f in sh["shriftlar"]]
pairs = [{k: j[k] for k in ("id", "raqam", "nom", "sarlavha", "matn", "kayfiyat", "qayerda", "link", "css")} for j in sh["juftliklar"]]

TITLE = "Hi Neo — effekt, animatsiya, ikonka, shrift, gradient va 50 ta Hero maket plagini"
DESC = "Hi Neo plagini: 31 ta WOW veb-effekt, 64 ta CSS animatsiya, " + IC_N + " ta alohida minimalist SVG ikonka, 60 ta shrift, " + str(PAL_NUM) + " ta rang palitrasi, " + str(GR_NUM) + " ta premium gradient (xameleon va shaffof tugmalar bilan) hamda " + str(HM_NUM) + " ta birinchi bet (Hero) maketi."

data = "\n".join([
    "    const EFFECTS = " + js(ef["effektlar"]) + ";",
    "    const ANIMS = " + js(an["animatsiyalar"]) + ";",
    "    const ANIM_STYLES = " + js(ANIM_STYLES) + ";",
    "    const FONTS = " + js(fonts) + ";",
    "    const FONT_PAIRS = " + js(pairs) + ";",
    "    const FONT_STYLES = " + js(sh["meta"]["uslublar"]) + ";",
    "    const PALETTES = " + js(rg["palitralar"]) + ";",
    "    const PALETTE_STYLES = " + js(rg["meta"]["uslublar"]) + ";",
    "    const GRADIENTS = " + js(gr["gradientlar"]) + ";",
    "    const GRADIENT_STYLES = " + js(gr["meta"]["uslublar"]) + ";",
    "    const HERO_LAYOUTS = " + js(hm["maketlar"]) + ";",
    "    const HERO_STYLES = " + js(hm["meta"]["uslublar"]) + ";",
    "    const ICON_CATS = " + js(ic["meta"]["kategoriyalar"]) + ";",
    "    const ICONS_RAW = " + js([[x["id"], x["nom"], x["en"], x["kat"], x["svg"]] for x in ic["ikonkalar"]]) + ";",
    "    const MAKET_CODE = " + js(maket) + ";",
])


def build(title, extra_head, home_url):
    head = """<!DOCTYPE html>
<html lang="uz" data-theme="dark">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>%s</title>
  <meta name="description" content="%s">
  <meta name="theme-color" content="#050a17">
%s  <link rel="icon" type="image/png" href="%s">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <script>
    // Sahifa chizilishidan oldin mavzu qo'yiladi (saqlangan tanlov yoki tizim sozlamasi): miltillash bo'lmaydi
    (function () {
      var root = document.documentElement, saved = null;
      try { saved = localStorage.getItem('hw-theme'); } catch (e) {}
      var theme = saved === 'dark' || saved === 'light' ? saved
        : (window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark');
      root.setAttribute('data-theme', theme);
      root.style.colorScheme = theme;
    })();
  </script>
  <style>
""" % (title, DESC, extra_head, rd(S + "fav.uri").strip())
    return (head + shell + anim_css + "\n\n  </style>\n</head>\n<body>\n" + body.replace("__HOME_URL__", home_url).replace("__IC_NUM__", str(IC_NUM)).replace("__IC_N__", IC_N).replace("__IC_CATS__", str(IC_CATS)).replace("__PAL_N__", str(PAL_NUM)).replace("__GR_N__", str(GR_NUM)).replace("__COLOR_N__", str(COLOR_NUM)).replace("__HM_N__", str(HM_NUM))
            + "\n  <script>\n" + data + "\n" + logic + "  </script>\n</body>\n</html>\n")


def write(path, html):
    open(path, "w", encoding="utf-8", newline="\n").write(html)
    print("yozildi:", path, len(html.encode("utf-8")), "bayt |", html.count("\n"), "qator |",
          "</script>:", len(re.findall(r"</script>", html, re.I)), "| lime:", len(re.findall(r"c8ff00|200,\s*255,\s*0", html, re.I)))


write(OUT, build(TITLE, "", "https://hiworld.club"))

if SITE_OUT:
    url = "https://hiworld.club/hineo.html"
    site_title = TITLE + " · hiworld.club"
    extra = "".join("  %s\n" % line for line in [
        '<meta name="robots" content="index, follow">',
        '<link rel="canonical" href="%s">' % url,
        '<meta property="og:type" content="website">',
        '<meta property="og:site_name" content="hiworld.club">',
        '<meta property="og:locale" content="uz_UZ">',
        '<meta property="og:url" content="%s">' % url,
        '<meta property="og:title" content="%s">' % site_title,
        '<meta property="og:description" content="%s">' % DESC,
        '<meta property="og:image" content="https://hiworld.club/assets/hi-neo/icon-512.png">',
    ])
    write(SITE_OUT, build(site_title, extra, "./"))
