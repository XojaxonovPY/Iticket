# iTicket.uz Frontend UI Architecture & Design System

Ushbu arxitektura kelajakda butun veb-sayt dizaynini (ranglar, shriftlar, mavzular, kartochkalar, inputlar) **bitta markaziy joydan** 5 soniyada o'zgartirish va boshqarish imkonini beradi.

---

## 1. Arxitektura qatlamlari (Architecture Layers)

```
┌─────────────────────────────────────────────────────────────┐
│  1. Single Source of Truth (Design Tokens)                  │
│     static/css/style.css (:root & html.dark)                │
└──────────────────────────────┬──────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────┐
│  2. Tailwind CSS Semantic Mapping                           │
│     templates/index.html (tailwind.config)                  │
└──────────────────────────────┬──────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────┐
│  3. Reusable UI Primitives (Atomic Components)              │
│     static/js/components/ui/UIComponents.js                  │
│     <Card>, <Button>, <Input>, <Badge>                      │
└──────────────────────────────┬──────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────┐
│  4. Business Components & Pages                             │
│     EventCard, Navbar, HomePage, CheckoutPage, etc.         │
└─────────────────────────────────────────────────────────────┘
```

---

## 2. Qanday qilib ranglar va foni 1 ta joydan o'zgartiriladi?

Har qanday rangni o'zgartirish uchun endi 15 ta sahifani ochish shart emas! Faqat `static/css/style.css` faylini ochib, kerakli o'zgaruvchini o'zgartirasiz:

```css
/* static/css/style.css */
:root {
    /* 🔴 Asosiy brend rangi (masalan, qizildan ko'k rangga o'tish uchun faqat shuni almashtirasiz) */
    --color-primary: #EB1C24;
    --color-primary-hover: #D0141B;

    /* ⚪ Oq rejim fonlari */
    --bg-surface: #F8FAFC;      /* Butun sahifa foni */
    --bg-card: #FFFFFF;         /* Barcha kartochkalar foni */
    --bg-input: #F8FAFC;        /* Barcha inputlar foni */
    --border-card: #E2E8F0;     /* Ajratuvchi chiziqlar */
    --text-main: #0F172A;       /* Asosiy matn rangi */
    --text-secondary: #64748B;  /* Qo'shimcha matn rangi */
}

html.dark {
    /* ⚫ Qora rejim fonlari */
    --bg-surface: #020617;      /* Chuqur qora fon */
    --bg-card: #0F172A;         /* Slate-900 kartochkalar */
    --bg-input: #1E293B;        /* Slate-800 inputlar */
    --border-card: #1E293B;     /* Qorong'i chegaralar */
    --text-main: #F8FAFC;       /* Oq matn */
    --text-secondary: #94A3B8;  /* Och kulrang tavsiflar */
}
```

---

## 3. Tayyor UI Primitives (Atomic Komponentlar)

`static/js/components/ui/UIComponents.js` da yaratilgan tayyor komponentlar avtomatik ravishda dark/light rejimga moslashadi:

### 1) `<UI.Card>`
Har qanday kartochka yoki konteyner uchun:
```jsx
const { Card } = window.UI;

<Card hoverable={true}>
    <h3>Kartochka sarlavhasi</h3>
    <p>Matn avtomatik ravishda moslashadi.</p>
</Card>
```

### 2) `<UI.Button>`
Standart tugmalar (loading holatini o'zi ko'rsatadi):
```jsx
const { Button } = window.UI;

<Button variant="primary" loading={isSubmitting}>
    Tasdiqlash
</Button>

<Button variant="secondary" icon="fa-solid fa-arrow-left">
    Orqaga qaytish
</Button>
```
*Variantlar:* `primary`, `secondary`, `outline`, `ghost`, `danger`.
*O'lchamlar:* `sm`, `md`, `lg`.

### 3) `<UI.Input>`
Avtomatik fon va xatolik chegarasiga ega forma maydoni:
```jsx
const { Input } = window.UI;

<Input
    type="text"
    placeholder="Ismingizni kiriting"
    error={fieldErrors.first_name}
    value={name}
    onChange={(e) => setName(e.target.value)}
/>
```

### 4) `<UI.Badge>`
Holatlar (yetkazildi, bekor qilindi, yosh chegarasi) uchun:
```jsx
const { Badge } = window.UI;

<Badge variant="success">Yetkazildi</Badge>
<Badge variant="danger">Bekor qilindi</Badge>
<Badge variant="warning">Kutilmoqda</Badge>
```

---

## 4. Central ThemeManager (`static/js/theme.js`)

Mavzuni dasturiy boshqarish uchun global API:
```javascript
// Joriy mavzuni olish ('light' | 'dark')
window.ThemeManager.getTheme();

// Qora rejimdami? (true | false)
window.ThemeManager.isDark();

// Rejimni almashtirish
window.ThemeManager.toggle();

// To'g'ridan-to'g'ri o'rnatish
window.ThemeManager.setTheme('dark');

// Mavzu o'zgarganini tinglash
const unsubscribe = window.ThemeManager.onThemeChange((theme, isDark) => {
    console.log("Mavzu o'zgardi:", theme);
});
```

---

## 5. Kelajakda Frontendni alohida Vite / React loyihaga ajratish

Agar kelajakda ushbu frontendni Django static dan chiqarib, alohida `React + Vite` yoki `Next.js` ga o'tkazsangiz:
1. `style.css` dagi CSS o'zgaruvchilarni to'g'ridan-to'g'ri `src/index.css` ga ko'chirasiz.
2. `tailwind.config` ni `tailwind.config.js` fayliga tashlaysiz.
3. `UIComponents.js` dagi `<Card>`, `<Button>`, `<Input>` larni `components/ui/` ga alohida `.tsx` yoki `.jsx` fayl qilib qo'yasiz.
4. Barcha komponentlar va sahifalar hech qanday o'zgarishsiz ishlashda davom etadi.
