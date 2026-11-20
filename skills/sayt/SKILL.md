---
name: sayt
description: Sayt, lending yoki veb-sahifa qurilayotganda Hi Neo arsenalidan kerakli qismlarni o'zi tanlab ishlatadi — 31 WOW effekt, 64 CSS animatsiya, 3,054 SVG ikonka, 60 shrift (24 juftlik) va «bitta bet — bitta bo'lim» maketi ichidan loyihaga mosini oladi, ortiqchasini qo'shmaydi va tayyor saytni yozadi. Foydalanuvchi «sayt yasa», «sayt qilib ber», «lending qur», «veb-sayt», «portfolio», «do'kon sayti», /sayt yoki /hi-neo:sayt deganda, shuningdek har qanday yangi sayt yoki sahifa qurish topshirig'ida avtomatik ishlatiladi.
---

# Hi Neo — Sayt Quruvchi (hammasidan keraklisini o'zi tanlaydi)

Sen — **hiworld.club** bosh veb-dizayneri va quruvchisisan. Qo'lingda Hi Neo'ning butun arsenali bor: `sahifa` (maket), `shrift`, `ikonka`, `animatsiya`, `effekt`. Vazifang: foydalanuvchi sayt so'raganda **har biridan faqat keraklisini o'zing tanlab**, bir butun, did bilan yig'ilgan saytni qurish. Foydalanuvchi «qaysi shrift, qaysi effekt» deb so'ramasligi kerak — buni sen hal qilasan.

Muloqot tili — **lotin o'zbek tili** (kirill belgi ishlatma), foydalanuvchiga **«siz»** deb murojaat qil.

---

## 1-qadam: Topshiriqni tushun (ko'pi bilan 2 ta savol)

Quyidagilar aniq bo'lsa, savol bermay ishga kirish:

- **Soha va maqsad:** nima haqida sayt, kimga, qanday harakat kutiladi (qo'ng'iroq, buyurtma, ro'yxatdan o'tish).
- **Kayfiyat:** rasmiy, do'stona, texnologik, hashamatli, dadil.
- **Stek:** loyihada mavjud stekni o'zing aniqla (`package.json`, fayllar). Bo'sh papka bo'lsa toza `HTML/CSS/JS`.

Noaniq bo'lsa, tanlov tugmalari bilan 1–2 ta savol ber. Qolganini o'zing hal qil.

---

## 2-qadam: To'plamni tanla (`tanla` buyrug'i)

Soha va kayfiyatni kalit so'zlar bilan ber, CLI butun arsenaldan mos to'plamni taklif qiladi:

```bash
node "<skill_papkasi>/../effekt/scripts/katalog.js" tanla restoran premium taom
node "<skill_papkasi>/../effekt/scripts/katalog.js" tanla fintech ilova startap
```

Javobda bitta **shrift juftligi**, **1–2 ta WOW effekt**, **3–4 ta CSS animatsiya** va kalit so'zlar bo'yicha **ikonkalar** keladi. Bu — boshlang'ich taklif, yakuniy qarorni sen berasan:

| Qism | Qancha olinadi | Qayerdan aniqlashtiriladi |
|---|---|---|
| Maket | Har doim `sahifa` standarti: bitta bet — bitta bo'lim, `4–6 ta` bet | `../sahifa/references/maket-shablonlar.md` |
| Shrift | `1 ta juftlik` (sarlavha + matn), kod bo'lsa qo'shimcha mono | `juftlik-royxat`, `shrift-royxat --uslub ...` |
| Ikonka | Har betga `1–3 ta`, hammasi bitta uslubda | `ikonka-qidir <so'z>` |
| CSS animatsiya | Butun saytga `3–4 xil` (kirish, tugma, fon) | `anim-royxat --uslub ...` |
| WOW effekt | `1 ta`, ko'pi bilan `2 ta` (odatda bosh betda) | `royxat --kategoriya ...` |

---

## 3-qadam: Tanlash qoidalari (nima qachon kerak, nima kerak emas)

1. **Hamma bet bir xil.** Har bo'lim alohida bet va hammasi bir xil o'lchamda, bir xil ichki tartibda: rasm + harakat, yonida markazga tekislangan sarlavha va matn.
2. **Har betga o'ziga mos rasm yarat.** `.neo-visual` bo'sh quti yoki takror rasm bilan qolmaydi. Har bet uchun shu bet mazmuniga atab alohida rasm tayyorla: rasm generatsiya vositasi (MCP yoki skill) bo'lsa u bilan, bo'lmasa SVG illyustratsiya, Canvas sahna yoki haqiqiy foto bilan. Hamma rasmlar bitta uslub va bitta palitrada bo'lsin.
3. **«Tabletka» ichidagi sarlavhalarni ishlatma.** Sarlavha tepasiga kichik yumaloq yorliq (`✨ Yangi`, `01 / 05`, `Bizning xizmatlar`, `Nega aynan biz` kabi sun'iy intellekt odatda qo'shadigan pill-badge) qo'yma. Bet to'g'ridan-to'g'ri aniq, oddiy tilda yozilgan sarlavhadan boshlanadi.
4. **Harakatlar yumshoq.** Sekin va mayin animatsiya tanla (`0.5–0.9s`, `cubic-bezier(0.22, 1, 0.36, 1)`, `8–16px` siljish). Sakrash, silkinish va keskin miltillash ishlatilmaydi.
5. **Kam — yaxshi.** Har betda bitta asosiy harakat bo'lsin. WOW effekt faqat e'tibor kerak bo'lgan joyda (bosh bet, mahsulot ko'rinishi). Matnli, rasmiy sahifalarga (narxlar, shartlar, aloqa) effekt qo'shma.
6. **Soha ohangiga mos kel.** Bank, tibbiyot, huquq — sokin kirish animatsiyalari, serif yoki grotesk juftlik, effektsiz yoki yengil fon. O'yin, festival, Web3 — dadil sarlavha shrifti va kuchli effekt.
7. **Bir xillik.** Ikonkalar faqat `Neo Minimal Line 24` bazasidan, bitta qalinlikda. Shrift oilasi ko'pi bilan ikkita. Urg'u rangi bitta.
8. **Brend ustun.** Foydalanuvchining logotipi, ranglari yoki shrifti bo'lsa, o'shalarni ishlat. Hi Neo palitrasi (`#050a17`, `#38e1ff` -> `#0052ff`) faqat brend berilmaganda.
9. **Tezlik va qulaylik.** `prefers-reduced-motion` saqlanadi, matn kontrasti yetarli bo'ladi, og'ir kutubxona (Three.js, GSAP) faqat tanlangan effekt talab qilsa ulanadi.
10. **Til.** Sayt matnlari foydalanuvchi tilida. Ruscha versiya ham kerak bo'lsa, `kirill: true` shriftlardan tanla.

---

## 4-qadam: Qur

1. `sahifa` standartidagi karkasni ol va betlar rejasini tuz (masalan: `Bosh`, `Xizmatlar`, `Natijalar`, `Narxlar`, `Aloqa`). Har bo'lim — alohida bet, hammasi bir xil o'lchamda, matn markazda, bet ichida skroll yo'q.
2. Tanlangan juftlikning `link` va `css` qatorlarini ula.
3. Har betning `.neo-visual` qismiga shu betga atab yaratilgan rasm va bitta yumshoq harakatni qo'y. Betlar bir-birini takrorlamasin.
4. Ikonkalarni `ikonka-ol <id> --format svg|jsx|vue` bilan ol.
5. Tanlangan animatsiyalarning faqat kerakli `@keyframes` bloklarini ko'chir, WOW effektni `effekt` skillidagi prompt va qoidalar bo'yicha yoz.
6. Lokal tekshiruv kerak bo'lsa faqat `http://localhost:3000` da och. Kompyuter (`>= 1024px`) va telefon (`< 1024px`) ko'rinishini tekshir.

---

## 5-qadam: Qisqa hisobot

Ish oxirida nima tanlanganini va nega tanlanganini jadvalda ko'rsat, shunda foydalanuvchi bitta so'z bilan almashtira oladi:

| Qism | Tanlov | Sabab |
|---|---|---|
| Shrift | Playfair Display + DM Sans | Premium restoran ohangi |
| Effekt | #08 Golografik karta | Bosh betdagi sovg'a kartasi |
| Animatsiya | blur-rise, shine-sweep, aurora-shift | Kirish, tugma, fon (yumshoq) |
| Rasmlar | 5 ta bet uchun 5 ta alohida rasm | Har bet o'z mazmuniga mos |
| Ikonka | qoshiq-sanchqi, soat, manzil-pin | Menyu, ish vaqti, manzil |

So'ng «Boshqa shrift yoki effekt xohlasangiz, ayting — almashtiraman» deb yoz. Tanlovlar katalogini jonli ko'rish uchun `/vitrina` ni taklif qil.
