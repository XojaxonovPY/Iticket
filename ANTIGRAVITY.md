# Antigravity Assistant Guide - Iticket Project

Bu fayl **Antigravity AI agenti** uchun loyihaning arxitekturasi, buyruqlari, qoidalari va ish jarayonlarini to'liq tushuntiruvchi qo'llanma hisoblanadi.

---

## 1. Loyiha haqida qisqacha

* **Loyiha nomi:** Iticket (Tadbir va chiptalar savdosi platformasi - iticket.uz analogi)
* **Asosiy maqsad:** Yuqori unumdorlikka (High Performance), past latency'ga ega, asinxron REST API backend.
* **Paket menejeri:** `uv` (zamonaviy, ultra-tezkor Python package manager).
* **Python versiyasi:** `3.12+`
* **Veb server:** `Granian` (Rust asosidagi yuqori unumdorlikdagi ASGI HTTP server).
* **API Framework:** `Django Ninja` (Pydantic v2 asosidagi asinxron API).
* **Ma'lumotlar bazasi:** PostgreSQL (Production / Render) yoki SQLite (Local fallback).

---

## 2. Loyiha arxitekturasi va tuzilishi

Loyiha toza qatlamli arxitekturaga (Clean Layered Architecture) asoslangan:

```
Iticket/
├── apps/
│   ├── api/             # Django Ninja routerlari va endpointlar (auth, event, user, cards, orders, transactions, system)
│   ├── schema/          # Pydantic v2 so'rov va javob sxemalari (Request/Response schemas)
│   ├── commons/         # Umumiy utilitalar, tokenlar, dekoratorlar, maxsus exceptions
│   ├── fixtures/        # Boshlang'ich JSON backuplar (category, country, place, sales_outlets, question, event, ticket)
│   ├── models.py        # Django ORM modellari
│   ├── admin.py         # Django Admin sozlamalari
│   └── filters.py       # Qidiruv va filterlash logikasi
├── root/
│   ├── asgi.py          # ASGI kirish nuqtasi (Granian orqali ishlatiladi)
│   ├── settings.py      # Django sozlamalari (DATABASE_URL, DJANGO_SECRET_KEY, dj_database_url)
│   └── urls.py          # Asosiy URL routing (/api/docs, /admin, /)
├── static/              # Frontend aktivlari (SPA React 18)
│   ├── css/style.css    # Central Design Tokens (:root, html.dark)
│   ├── locales/         # i18n tarjimalar (uz.json, ru.json, en.json)
│   └── js/
│       ├── app.js       # Asosiy React app va router
│       ├── theme.js     # Dark/Light rejim menejeri (localStorage)
│       ├── i18n.js      # Ko'p tillilik menejeri
│       ├── api/         # Backend bilan API mijoz (client.js, services.js)
│       ├── components/  # Reusable UI primitives va komponentlar
│       └── pages/       # Barcha SPA sahifalari
├── templates/
│   └── index.html       # SPA kirish sahifasi (CDN React 18 + Tailwind)
├── docs/
│   └── UI_ARCHITECTURE.md # Frontend Design System qo'llanmasi
├── Dockerfile           # Python 3.12-slim asosidagi multi-stage production Dockerfile
├── entrypoint.sh        # Konteyner kirish skripti (migratsiyalar, fixturelar, Granian)
├── render.yaml          # Render Cloud Blueprint konfiguratsiyasi
├── pyproject.toml       # Loyiha metadata va bog'liqliklari
└── uv.lock              # Qulflangan paketlar versiyalari
```

---

## 3. Server va Ishga tushirish qoidalari

### 3.1 Server: Granian ASGI
Loyiha WSGI emas, **ASGI** rejimida ishlaydi. Ishga tushirish buyrug'i:
```bash
# Production (Konteyner ichida):
granian --interface asginl root.asgi:application --host 0.0.0.0 --port 8000 --workers 1 --access-log

# Mahalliy ishlab chiqishda (Reload bilan):
uv run granian --interface asgi root.asgi:application --host 127.0.0.1 --port 8000 --reload
```

### 3.2 Paketlar va Muhit boshqaruvi (`uv`)
Paketlarni o'rnatish va boshqarishda faqat `uv` ishlatiladi:
```bash
uv sync                           # Bog'liqliklarni o'rnatish
uv add <package_name>             # Yangi paket qo'shish
uv run python manage.py <command> # Buyruqlarni virtual muhitda bajarish
```

---

## 4. Boshlang'ich Ma'lumotlar (Fixtures)

Loyiha `apps/fixtures/` papkasida 195 ta dastlabki ma'lumotlarga ega. 
Yuklashda xorijiy kalitlar (Foreign Keys) zanjiri quyidagi qat'iy tartibda bo'lishi shart:
1. `category`
2. `country`
3. `place`
4. `sales_outlets`
5. `question`
6. `event`
7. `ticket`

Konteyner ishga tushganda `entrypoint.sh` avtomatik ravishda `Category.objects.exists()` orqali bazani tekshiradi:
* Baza bo'sh bo'lsa — fixturelar avtomatik yuklanadi.
* Baza to'la bo'lsa — qayta yuklanmasdan o'tkazib yuboriladi.
* Majburiy yuklash uchun: Muhit o'zgaruvchisiga `LOAD_FIXTURES=true` beriladi.

Qo'lda yuklash buyrug'i:
```bash
uv run python manage.py loaddata category country place sales_outlets question event ticket
```

---

## 5. Dasturlash va Kod yozish qoidalari (Guidelines for Agent)

1. **Django Ninja va Pydantic v2:**
   - Har bir yangi API endpoint `apps/api/` ichidagi mos modulga qo'shiladi.
   - Request va Response ma'lumotlari faqat `apps/schema/` ichidagi Pydantic sxemalar orqali qabul qilinadi va qaytariladi.
   - Mumkin bo'lgan joylarda `async def` va asinxron ORM (`await Model.objects.aget(...)`) ishlatilsin.

2. **So'rovlar va ORM optimizatsiyasi:**
   - N+1 muammolarini oldini olish uchun `select_related` va `prefetch_related` doimiy qo'llansin.
   - Pul va to'lovlar bilan bog'liq jarayonlarda (Orders, Tickets, Transactions) ma'lumotlar yaxlitligi uchun tranzaksiyalar (`transaction.atomic()` yoki `select_for_update()`) ishlatilsin.

3. **Xavfsizlik:**
   - `.env` yoki maxfiy kalitlar hech qachon git commit'ga kiritilmasin.
   - Parollar, karta ma'lumotlari to'g'ridan-to'g'ri ochiq saqlanmaydi (hash yoki tokenizatsiya).

4. **Konteyner va Deploy yaxlitligi:**
   - `Dockerfile` va `entrypoint.sh` dagi o'zgarishlar faqat sinovdan o'tkazilgach kiritilishi shart.
   - Statik fayllar `python manage.py collectstatic --noinput` orqali tayyorlanishi inobatga olingan.

---

## 6. Frontend Arxitekturasi va Qoidalari (SPA & UI System)

1. **Texnologiya:**
   - Frontend alohida Node.js server emas, balki `templates/index.html` orqali yuklanadigan **React 18 SPA (In-browser JSX/Babel)** hisoblanadi.
   - Tailwind CSS va markaziy Design Tokens (`static/css/style.css`) orqali stillanadi.

2. **UI Komponentlar va Dizayn:**
   - Ranglar, kartochka va input fonlari faqat `static/css/style.css` dagi CSS o'zgaruvchilar orqali o'zgartiriladi.
   - Yangi UI elementlar yaratilganda `static/js/components/ui/UIComponents.js` dagi atomik komponentlar (`Card`, `Button`, `Input`, `Badge`) ishlatiladi.

3. **Backend API Integratsiyasi:**
   - Barcha API chaqiruvlari `static/js/api/client.js` va `static/js/api/services.js` orqali amalga oshiriladi.
   - JWT autentifikatsiya tokenlari avtomatik ravishda `localStorage` dan olinadi va yangilanadi.

4. **Ko'p tillilik va Mavzular:**
   - Har qanday yangi matn `static/locales/{uz, ru, en}.json` fayllariga kiritilishi shart.
   - Mavzu boshqaruvi `static/js/theme.js` orqali sinxronlashadi.
   - To'liq yo'riqnoma: `docs/UI_ARCHITECTURE.md`.

