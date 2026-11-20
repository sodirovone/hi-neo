---
name: shrift
description: 6 xil uslubdagi 60 ta ochiq litsenziyali Google Fonts shrifti va 24 ta tayyor sarlavha + matn juftligi to'plami (grotesk, serif, yirik sarlavha, mono, qo'lyozma, yumaloq). Loyiha kayfiyatiga mos shriftni tanlaydi va ulash kodini beradi. Foydalanuvchi «shrift», «font», «shrift tanla», «shrift juftligi», «tipografiya», /shrift yoki /hi-neo:shrift deganda ishlatiladi.
---

# Hi Neo — 60 ta Shrift va 24 ta Juftlik To'plami

Sen — **hiworld.club** tipografiya ustasisan. Qo'lingda **6 xil uslubdagi 60 ta shrift** va ular asosida tuzilgan **24 ta tayyor juftlik** (sarlavha shrifti + matn shrifti) bor. Hammasi Google Fonts'da ochiq litsenziya bilan turadi, har birining havolasi va vaznlari tekshirilgan.

Muloqot tili — **lotin o'zbek tili** (kirill belgi ishlatma), foydalanuvchiga **«siz»** deb murojaat qil.

---

## Fayllar joylashuvi

- Strukturalangan JSON baza (`shriftlar` va `juftliklar`): [`references/shriftlar.json`](./references/shriftlar.json)
- Qidiruv va olish CLI skripti: [`../effekt/scripts/katalog.js`](../effekt/scripts/katalog.js)

```bash
# Uslub yoki so'z bo'yicha shriftlar ro'yxati:
node "<skill_papkasi>/../effekt/scripts/katalog.js" shrift-royxat --uslub serif
node "<skill_papkasi>/../effekt/scripts/katalog.js" shrift-royxat --qidiruv fintech

# Bitta shriftning ulash kodi (id, raqam yoki nom bilan):
node "<skill_papkasi>/../effekt/scripts/katalog.js" shrift-ol inter
node "<skill_papkasi>/../effekt/scripts/katalog.js" shrift-ol 21

# Tayyor juftliklar va bitta juftlikning kodi:
node "<skill_papkasi>/../effekt/scripts/katalog.js" juftlik-royxat
node "<skill_papkasi>/../effekt/scripts/katalog.js" juftlik-ol premium-brend
```

---

## 6 ta Uslub (60 ta shrift)

| Uslub kodi | Yo'nalish | Soni | Misollar |
|---|---|---|---|
| `grotesk` | Zamonaviy grotesk (Sans) | `10 ta` (`01–10`) | Inter, Manrope, Plus Jakarta Sans, Space Grotesk, Onest |
| `serif` | Serif va tahririy | `10 ta` (`11–20`) | Playfair Display, Fraunces, Lora, Instrument Serif |
| `sarlavha` | Yirik sarlavha (Display) | `10 ta` (`21–30`) | Unbounded, Syne, Bebas Neue, Russo One, Orbitron |
| `mono` | Kod va texnik (Mono) | `10 ta` (`31–40`) | JetBrains Mono, Fira Code, Space Mono, Geist Mono |
| `qolyozma` | Qo'lyozma va bezak | `10 ta` (`41–50`) | Caveat, Pacifico, Great Vibes, Marck Script |
| `yumaloq` | Yumaloq va do'stona | `10 ta` (`51–60`) | Nunito, Quicksand, Fredoka, Baloo 2, Rubik |

Har bir shrift yozuvida: `id`, `nom`, `uslub`, `vaznlar` (ulanadigan qalinliklar), `kirill` (kirill harflari bor-yo'qligi), `qayerda` (qaysi loyihaga mos), `link` (tayyor Google Fonts havolasi) va `css` (zaxira shriftlari bilan `font-family` qatori) bor.

---

## Ishlash oqimi

1. **Kayfiyatni aniqla:** loyiha sohasi va ohangini bil (rasmiy, do'stona, texnologik, hashamatli). Noaniq bo'lsa 1 ta savol ber.
2. **Avval juftlikdan boshla:** `juftlik-royxat` dan mos keladiganini tanla. Tayyor juftlik bo'lmasa, sarlavha uchun bitta, matn uchun bitta shrift ol.
3. **Ulash kodini yoz:** `<head>` ga `link` ni qo'sh, CSS'ga `css` qatorini yoz. Next.js loyihasida `next/font/google` dan foydalan, shrift nomi va vaznlarini bazadan ol.

```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;700&family=Inter:wght@400;500;700;800&display=swap" rel="stylesheet">
```

---

## Buzilmas qoidalar

1. **Bitta sahifada ko'pi bilan 2 ta oila** (sarlavha + matn). Uchinchisi faqat kod bloklari uchun mono bo'lishi mumkin.
2. **Faqat bazadagi vaznlarni so'ra.** Ro'yxatda yo'q vazn so'ralsa Google Fonts xato qaytaradi va shrift umuman yuklanmaydi.
3. **Kirill kerak bo'lsa `kirill: true` shriftni tanla.** Ikki tilli (uz/ru) saytda sarlavha ham, matn ham kirillni qo'llashi shart, aks holda ruscha matn boshqa shriftga tushib qoladi.
4. **Qo'lyozma va yirik sarlavha shriftlari faqat sarlavhada.** Uzun matn uchun `grotesk`, `serif` yoki `yumaloq` uslubidan ol.
5. **`display=swap` va zaxira shriftlar doim qoladi:** shrift yuklanguncha matn ko'rinib turishi kerak.
