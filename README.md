# 🎟️ Iticket — Event Ticketing Platform Backend

[![Python](https://img.shields.io/badge/Python-3.12+-3776AB?style=flat&logo=python&logoColor=white)](https://python.org)
[![Django Ninja](https://img.shields.io/badge/Django_Ninja-Fast_Async_API-092E20?style=flat&logo=django&logoColor=white)](https://django-ninja.dev)
[![Granian](https://img.shields.io/badge/Server-Granian_ASGI_(Rust)-black?style=flat)](https://github.com/emmett-framework/granian)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-336791?style=flat&logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Docker](https://img.shields.io/badge/Docker-Ready-2496ED?style=flat&logo=docker&logoColor=white)](https://www.docker.com/)
[![Package Manager](https://img.shields.io/badge/uv-Astral-blueviolet?style=flat)](https://github.com/astral-sh/uv)

**Iticket** — bu konsertlar, teatr, sport va madaniy tadbirlar uchun chiptalar sotish tizimi (iticket.uz analogi) backend platformasi. Loyiha yuqori unumdorlik (high-performance), minimal kechikish (low-latency) va asinxron arxitekturaga asoslangan holda ishlab chiqilgan.

---

## 🚀 Asosiy Xususiyatlari

- ⚡ **Ultra-tezkor Asinxron API:** Django Ninja va Pydantic v2 asosidagi to'liq tiplangan va tezkor REST API.
- 🦀 **Rust Asosidagi Server (Granian):** An'anaviy Gunicorn/Uvicorn o'rniga eng yuqori RPS ko'rsatkichiga ega Rust ASGI serveri.
- 🔐 **Xavfsiz Autentifikatsiya:** JWT (JSON Web Tokens) orqali himoyalangan avtorizatsiya va profil boshqaruvi.
- 🎭 **Tadbirlar va Joylar (Events & Venues):** Tadbirlar, toifalar, joylar (zallar) va chiptalarni to'liq boshqarish.
- 💳 **Buyurtmalar va To'lovlar:** Buyurtmalar yaratish, bank kartalarini saqlash va tranzaksiyalar tarixi.
- 🌐 **Ko'p tillilik (i18n):** O'zbek, rus va ingliz tillarida ma'lumotlarni saqlash va tarjimalar tizimi.
- 📦 **Avtomatik Fixture Yuklanishi:** 195 ta boshlang'ich ma'lumotlar (toifalar, shaharlar, zallar, tadbirlar, chiptalar) birinchi ishga tushirishda avtomatik bazaga yuklanadi.
- 🐳 **Production-Ready Docker:** Ko'p bosqichli, xavfsiz va ixcham Docker konteyneri.
- ☁️ **Render Cloud Tayyor:** `render.yaml` orqali bepul PostgreSQL va Web Service'ga bir klikda deploy qilish imkoniyati.

---

## 🛠️ Texnologiyalar Steki

| Qism | Texnologiya |
|---|---|
| **Dasturlash tili** | Python 3.12+ |
| **API Framework** | Django + Django Ninja (Async) |
| **Frontend Framework** | React 18 (SPA, In-browser JSX/Babel) |
| **UI & Stillar** | Tailwind CSS + CSS Design Tokens |
| **Sxemalar & Validatsiya** | Pydantic v2 |
| **ASGI Server** | Granian (Rust HTTP engine) |
| **Ma'lumotlar bazasi** | PostgreSQL (Production) / SQLite (Mahalliy) |
| **Paket menejeri** | `uv` (Astral) |
| **Konteynerlashtirish** | Docker & Docker Compose |
| **Deploy platformasi** | Render.com |

---

## 📁 Loyiha Tuzilishi

```text
Iticket/
├── apps/
│   ├── api/             # Django Ninja routerlari (auth, event, user, cards, orders, transactions)
│   ├── schema/          # Pydantic v2 so'rov va javob sxemalari
│   ├── commons/         # Maxsus istisnolar (exceptions), dekoratorlar, tokenlar
│   ├── fixtures/        # Boshlang'ich JSON ma'lumotlar (195 ta obyekt)
│   ├── models.py        # Django ORM ma'lumotlar modellari
│   ├── admin.py         # Django Admin boshqaruv paneli
│   └── filters.py       # Qidiruv va saralash filtrlari
├── root/
│   ├── asgi.py          # Granian uchun ASGI kirish nuqtasi
│   ├── settings.py      # Django sozlamalari
│   └── urls.py          # URL yo'naltirishlari va Swagger UI
├── static/
│   ├── css/style.css    # Central Design Tokens (:root & dark theme ranglari)
│   ├── locales/         # Ko'p tillilik lug'atlari (uz.json, ru.json, en.json)
│   └── js/
│       ├── app.js       # Asosiy React App va router
│       ├── theme.js     # Dark / Light rejim menejeri
│       ├── i18n.js      # Ko'p tillilik menejeri
│       ├── api/         # Backend bilan asinxron fetch mijozlari
│       ├── components/  # Navbar, Footer, AuthModal, Toast, UIComponents
│       └── pages/       # Home, EventDetail, Cart, Checkout, Profile, Wishlist, Outlets, FAQ
├── templates/
│   └── index.html       # Single Page Application (SPA) bosh sahifasi
├── Dockerfile           # Production Dockerfile
├── entrypoint.sh        # Migratsiya, fixture va serverni ishga tushirish skripti
├── render.yaml          # Render Cloud sozlamalari
└── pyproject.toml       # Loyiha bog'liqliklari
```

---

## 🎨 Frontend Arxitekturasi va Imkoniyatlari

Loyiha frontend qismi zamonaviy **Single Page Application (SPA)** sifatida ishlab chiqilgan:

* **Node.js-siz ishlaydigan React 18:** Alomat qurish (build step / `npm run build`) bosqichisiz to'g'ridan-to'g'ri brauzerda ishlaydi. Django serverini ishga tushirishning o'zi yetarli.
* **Markaziy Dizayn Tizimi (Design Tokens):** Barcha ranglar, shriftlar va fonlar [`static/css/style.css`](static/css/style.css) faylida CSS o'zgaruvchilari orqali belgilangan. Brend rangini bitta joydan o'zgartirish butun saytga bir zumda ta'sir qiladi.
* **Qora va Oq Rejim (Dark / Light Mode):** [`static/js/theme.js`](static/js/theme.js) orqali mavzuni boshqarish. Tanlov `localStorage` da avtomatik saqlanadi.
* **Ko'p Tillilik (i18n):** O'zbek, rus va ingliz tillarida sahifani yangilamasdan (re-render orqali) lahzada almashtirish.
* **Modulli Sahifalar va Komponentlar:**
  * **Sahifalar:** Bosh sahifa (Home), Tadbir tafsilotlari (Event Detail), Savatcha (Cart), To'lov (Checkout), Profil (Profile), Kassalar ro'yxati (Outlets), Ko'p beriladigan savollar (FAQ).
  * **UI Primitives:** `<Card>`, `<Button>`, `<Input>`, `<Badge>` kabi tayyor komponentlar avtomatik ravishda dark/light rejimga moslashadi.
* **Batafsil arxitektura qo'llanmasi:** [`docs/UI_ARCHITECTURE.md`](docs/UI_ARCHITECTURE.md).

---

## 💻 Mahalliy Muhitda Ishga Tushirish (Local Setup)

### Talablar:
- **Python 3.12+**
- **uv** (tavsiya etiladi: `curl -LsSf https://astral.sh/uv/install.sh | sh`) yoki **pip**
- **Git**

### 1. Repozitoriyani klonlash:
```bash
git clone https://github.com/your-username/iticket.git
cd iticket
```

### 2. Bog'liqliklarni o'rnatish (`uv` yordamida):
```bash
uv sync
```

### 3. Muhit o'zgaruvchilarini sozlash:
Loyiha ildizida `.env` faylini yarating:
```env
DEBUG=True
SECRET_KEY=your-super-secret-django-key
ALLOWED_HOSTS=127.0.0.1,localhost
# PostgreSQL uchun (agar bo'sh qoldirilsa, avtomatik sqlite3 ishlatiladi):
# DATABASE_URL=postgres://user:password@localhost:5432/iticket_db
```

### 4. Migratsiyalarni qo'llash va Boshlang'ich ma'lumotlarni yuklash:
```bash
uv run python manage.py migrate
uv run python manage.py loaddata category country place sales_outlets question event ticket
```

### 5. Serverni ishga tushirish:
```bash
# Granian ASGI bilan:
uv run granian --interface asgi root.asgi:application --host 127.0.0.1 --port 8000 --reload

# Yoki Django standart serveri bilan:
uv run python manage.py runserver
```

---

## 🐳 Docker Orqali Ishga Tushirish

Loyihada barcha migratsiyalar, statik fayllarni yig'ish va ma'lumotlar bazasini to'ldirish [entrypoint.sh](entrypoint.sh) orqali to'liq avtomatlashtirilgan.

### 1. Docker imidjini yig'ish:
```bash
docker build -t iticket .
```

### 2. Konteynerni ishga tushirish:
```bash
docker run -d -p 8000:8000 --name iticket_app --env-file .env iticket
```
Konteyner ishga tushgach, tizim avtomatik ravishda:
- Barcha migratsiyalarni tekshiradi va qo'llaydi.
- Agar baza bo'sh bo'lsa, 195 ta fixture ma'lumotlarini yuklaydi.
- Granian ASGI serverini 8000-portda yoqadi.

---

## 📖 Interaktiv API Hujjatlari (Swagger / OpenAPI)

Server ishga tushgandan so'ng, quyidagi manzillar orqali to'liq interaktiv API hujjatlaridan foydalanishingiz mumkin:

* **Swagger UI:** [http://127.0.0.1:8000/api/docs](http://127.0.0.1:8000/api/docs)
* **Django Admin:** [http://127.0.0.1:8000/admin](http://127.0.0.1:8000/admin)

---

## ⚙️ Muhit O'zgaruvchilari (Environment Variables)

| O'zgaruvchi | Tavsif | Birlamchi qiymat |
|---|---|---|
| `DEBUG` | Ishlab chiqish rejimi (`True` / `False`) | `False` |
| `SECRET_KEY` | Django maxfiy xavfsizlik kaliti | *Majburiy* |
| `DATABASE_URL` | PostgreSQL ulanish manzili | Bo'sh bo'lsa `sqlite3` |
| `ALLOWED_HOSTS` | Ruxsat etilgan domenlar | `*` |
| `PORT` | Server tinglaydigan port | `8000` |
| `LOAD_FIXTURES` | Fixturelarni majburiy qayta yuklash (`true`/`false`) | `false` |

---

## 🚀 Render.com Platformasiga Deploy Qilish

Loyiha ildizida Render uchun maxsus [render.yaml](render.yaml) mavjud.

1. Repozitoriyangizni GitHub/GitLab'ga push qiling.
2. [Render.com](https://render.com) hisobingizga kiring.
3. **Blueprints** bo'limiga o'ting va ushbu repozitoriyani ulang.
4. Render avtomatik ravishda:
   - Bepul **PostgreSQL** bazasini ochadi.
   - **Web Service** konteynerini `Dockerfile` asosida yig'adi.
   - Barcha muhit o'zgaruvchilarini (`DATABASE_URL`, `SECRET_KEY`) o'zi bog'laydi va ishga tushiradi.
5. Loyiha ishlab turgan link https://iticket-8wxh.onrender.com/