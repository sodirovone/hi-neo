# Vitrina manbalari

`skills/vitrina/assets/vitrina.html` qo'lda tahrirlanmaydi — u shu papkadagi qismlardan yig'iladi:

| Fayl | Nima |
|---|---|
| `shell.css` | Vitrinaning ko'rinishi (palitra, betlar, yumshoq harakatlar) |
| `body.html` | 9 ta betning HTML qismi |
| `logic.js` | Betlar orasida o'tish, sahifalash, 31 ta effekt demosi, rang/gradient muharriri, 50 ta Hero maket va Avto-Audit |
| `logo.uri`, `fav.uri` | Plagin ikonkasi (sahifa ichiga joylanadi) |
| `assemble.py` | Yig'uvchi: qismlar + JSON bazalar -> `vitrina.html` |

Effekt, animatsiya, ikonka va shrift ma'lumotlari `skills/*/references/*.json` dan olinadi, shuning uchun bazani o'zgartirgach vitrinani qayta yig'ing:

```bash
# Plagin papkasida:
python scripts/vitrina/assemble.py . -

# hiworld.club uchun nusxa bilan birga (canonical va og teglar qo'shiladi):
python scripts/vitrina/assemble.py . - ../hineo.html

node scripts/tekshir.js
```
