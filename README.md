# ⏰ SmartBudilnik (Alarm Clock)

HTML, CSS va JavaScript (Web Audio API) yordamida yaratilgan zamonaviy, interaktiv va qulay onlayn budilnik websayti.

---

## 🌟 Asosiy Xususiyatlar

- 🕒 **Jonli Analog va Raqamli Soat**: Millisekund darajasida silliq harakatlanuvchi strelkalar va soniya ko'rsatkichi.
- 🔊 **Web Audio API Sintezi**: Tashqi audio fayllarga bog'liq bo'lmagan 4 xil ohang:
  - 🔔 *Klassik Budilnik* (Retro bip-bip)
  - 🎵 *Raqamli Melodiya* (Arpejio chime)
  - 🌅 *Mayin Tong* (Yumshoq garmonik)
  - 🚨 *Favqulodda Signal* (Tezkor sirena)
- 📁 **Maxsus Audio Yuklash**: O'z sevimli `.mp3` yoki `.wav` musiqangizni yuklab o'rnatish imkoniyati.
- ⚡ **Tezkor Vaqt Tugmalari**: +5 min, +15 min, +30 min, 07:00, 08:00, 13:00 tugmalari.
- ⏱️ **Qolgan Vaqt Hisoblagichi**: Har bir budilnik uchun qolgan vaqtni real vaqtda ko'rsatib boradi (*masalan: "2 soat 15 daqiqa qoldi"*).
- 😴 **Snooze (+5 daqiqa kechiktirish)**: Budilnik jiringlaganda to'xtatish yoki yana 5 daqiqaga kechiktirish.
- 🎨 **3 Xil Vizual Mavzu**:
  - Tungi (Midnight Dark)
  - Neon (Cyberpunk)
  - Zumrad (Emerald Aurora)
- 💾 **LocalStorage**: Sahifa yangilanganda ham kiritilgan barcha signallar saqlanib qoladi.
- 🔔 **Brauzer Bildirishnomalari**: Brauzer orqali xabar yuborish imkoniyati.

---

## 📂 Fayllar Strukturasi

```text
├── index.html        # Asosiy HTML5 tuzilmasi
├── style.css         # Glassmorphism, neon nurlari va responsive dizayn
├── app.js            # Web Audio API, soat mexanikasi va budilnik mantiqi
└── README.md         # Loyiha tavsifi
```

---

## 🚀 Ishga Tushirish

Loyihani ishga tushirish uchun hech qanday qo'shimcha o'rnatish talab etilmaydi:
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
