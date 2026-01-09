# קונפיגורציה ותצורת מערכת

## קבצי תצורה מרכזיים

### `package.json`
- סקריפטים:
  - `dev` – הרצת Vite במצב פיתוח.
  - `build` – בניית Production.
  - `lint` / `lint:fix` – בדיקות ESLint.
  - `typecheck` – בדיקת טיפוסים (TS) לפי `jsconfig.json`.
  - `preview` – תצוגת Build מקומית.
- תלויות עיקריות: React, Vite, Base44 SDK, TanStack Query, Tailwind, Radix, framer-motion.

### `vite.config.js`
- מגדיר את תהליך הבנייה, כולל תוסף React ותמיכה ב־Base44.

### `tailwind.config.js` + `postcss.config.js`
- הגדרות Tailwind + PostCSS עבור עיבוד CSS.

### `eslint.config.js`
- כללי lint ל־JavaScript/React.

### `jsconfig.json`
- הגדרות paths ו־type checking עבור פרויקט המבוסס JS.

### `components.json`
- תצורת shadcn/ui (מיקום קבצי UI, style, paths).

### `index.html`
- תבנית HTML שממנה ה־Vite מזריק את האפליקציה.
