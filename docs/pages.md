# Pages וראוטינג

## `src/pages.config.js`
**מטרה:** מיפוי דפי האפליקציה והגדרת הדף הראשי.

**ייצוא:**
- `PAGES` – אובייקט `{ "Home": Home }`.
- `pagesConfig` – `{ mainPage: "Home", Pages: PAGES }`.

**שימוש:**
- `App.jsx` קורא ל־`pagesConfig` ובונה Routes בצורה דינמית.

---

## `src/pages/Home.jsx`
**מטרה:** דף הבית של האפליקציה.

**פונקציות/קומפוננטות:**
- `Home` – מציג את `ShiftCalendar` ואת קרדיט זכויות יוצרים קבוע בתחתית.

**קונטקסט שימוש:**
- זהו הדף הראשי המוגדר ב־`pages.config.js`.
