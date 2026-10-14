# ⏰ SmartBudilnik (Online Alarm Clock)

HTML5, CSS3 va JavaScript (Web Audio API) yordamida yaratilgan zamonaviy, interaktiv va qulay onlayn budilnik websayti. Qidiruv tizimlari (Google, Yandex, Bing) uchun to'liq **SEO (Search Engine Optimization)** standartlariga moslashtirilgan.

---

## 🌟 Asosiy Xususiyatlar

- 🕒 **Jonli Analog va Raqamli Soat**: `requestAnimationFrame` orqali 60 FPS silliqlikda aylanuvchi strelkalar va soniya ko'rsatkichi.
- 🔊 **Web Audio API Sintezi**: Tashqi audio fayllarsiz, brauzerning o'zida yaratiladigan 4 xil ohang:
  - 🔔 *Klassik Budilnik* (Retro bip-bip)
  - 🎵 *Raqamli Melodiya* (Arpejio chime)
  - 🌅 *Mayin Tong* (Yumshoq garmonik akkordlar)
  - 🚨 *Favqulodda Signal* (Tezkor sirena)
- 📁 **Maxsus Audio Yuklash**: Istalgan `.mp3` yoki `.wav` musiqangizni yuklab o'rnatish imkoniyati.
- ⚡ **Tezkor Vaqt Tugmalari**: `+5 daqiqa`, `+15 daqiqa`, `+30 daqiqa`, `07:00`, `08:00`, `13:00`.
- ⏱️ **Qolgan Vaqt Hisoblagichi**: Har bir budilnik uchun qolgan vaqtni real vaqtda ko'rsatib boradi (*"2 soat 15 daqiqa qoldi"*).
- 😴 **Snooze (+5 daqiqa kechiktirish)**: Signal chalganda to'xtatish yoki yana 5 daqiqaga kechiktirish.
- 🎨 **3 Xil Vizual Mavzu**:
  - Tungi (Midnight Dark)
  - Neon (Cyberpunk)
  - Zumrad (Emerald Aurora)
- 💾 **LocalStorage**: Sahifa yangilanganda ham barcha o'rnatilgan signallar va parametrlar saqlanadi.
- 🔔 **Brauzer Bildirishnomalari**: Desktop Notification API orqali ogohlantirish.

---

## 🎯 SEO va Texnik Optimallashtirish

1. **Semantik HTML5**: `<header>`, `<main>`, `<section>`, `<article>`, `<details>`, `<summary>`, `<nav>`, `<footer>` teglari.
2. **Meta Teglar**: Kalit so'zlar (`Onlayn budilnik`, `Online alarm clock`, `Tezkor budilnik`), unikal `<title>`, batafsil tavsif (`meta description`), `canonical` havola.
3. **Open Graph & Twitter Cards**: Telegram, Facebook, Twitter va boshqa ijtimoiy tarmoqlarda chiroyli preview hosil bo'lishi uchun to'liq OG teglari.
4. **Strukturaviy Ma'lumotlar (Schema.org / JSON-LD)**:
   - `WebApplication` sxemasi
   - `FAQPage` sxemasi (Google Rich Results / Snippets uchun)
5. **Indekslash Fayllari**:
   - `robots.txt` — qidiruv botlari uchun ruxsatlar.
   - `sitemap.xml` — sahifa xaritasi va indekslash ustuvorligi.
6. **PWA & Favicon**:
   - `manifest.json` — mobil ilova sifatida o'rnatish imkoniyati.
   - `favicon.svg` — yuqori sifatli vektor piktogramma.

---

## 📂 Fayllar Strukturasi

```text
├── index.html        # Semantik HTML5, SEO meta teglar, Schema JSON-LD va FAQ bo'limi
├── style.css         # Glassmorphism, neon animatsiyalar va to'liq responsive dizayn
├── app.js            # requestAnimationFrame 60fps soat, Web Audio API va Snooze
├── robots.txt        # Qidiruv tizimlari (Googlebot) uchun yo'riqnoma
├── sitemap.xml       # Sayt xaritasi
├── manifest.json     # PWA va mobil ilova ko'rsatkichlari
├── favicon.svg       # Vektor SVG favikon
└── README.md         # Loyiha hujjatlari
```

---

## 🚀 Ishga Tushirish

1. `index.html` faylini istalgan brauzerda (Chrome, Firefox, Edge, Safari) oching.
2. Yoki oddiy local server orqali ishga tushiring:
   ```bash
   python -m http.server 3000
   ```
   So'ngra brauzerda `http://localhost:3000` ga kiring.

---

## 👨‍💻 Muallif

- GitHub: [@Ablzv](https://github.com/Ablzv)
- Loyiha: [Budulnik](https://github.com/Ablzv/Budulnik)
