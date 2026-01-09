# ארכיטקטורה כללית

## שכבות מרכזיות
1. **UI / Components** – קומפוננטות React (דפים, מודאלים, תצוגות).
2. **State & Data** – `@tanstack/react-query` + hooks מקומיים.
3. **Auth & Context** – `AuthContext` מספק מידע על המשתמש והסטטוס.
4. **SDK Integration** – `base44` משמש ל-Auth, Entities, Integrations.
5. **Infrastructure** – Vite + Tailwind + ESLint + PostCSS.

## תצורת App ברמה גבוהה
- `main.jsx` מאתחל את React ומטעין CSS גלובלי.
- `App.jsx` עוטף את האפליקציה בספקים (AuthProvider, QueryClientProvider) ומגדיר את הראוטינג.
- `pages.config.js` מגדיר את מפת הדפים, ומציין מהו הדף הראשי.

## שרשרת כניסה (Bootstrap)
1. נטען `main.jsx`.
2. נטען `App.jsx` שמקים Router ו-Providers.
3. `AuthProvider` בודק מצב הרשאות וטעינת Public Settings.
4. אם יש שגיאת הרשאה → מוצג מסך `UserNotRegisteredError`.
5. אם אין שגיאה → נבנים Routes לפי `pages.config.js`.

## מודולים קריטיים
- **AuthContext** – נקודת הכניסה לאימות, סטטוסים, ופעולות logout/redirect.
- **ShiftCalendar** – קומפוננטת הבסיס להצגת לוח משמרות, כולל כל מודאלי העבודה.
- **CalendarHeader/CalendarGrid/ShiftCell** – משולש UI המרכזי של הלוח.

## אינטגרציות חיצוניות
- **Base44**: שימוש ב-`entities` לישויות כמו Shift, SwapRequest, AuthorizedPerson.
- **Core Integrations**: `UploadFile`, `SendEmail`, `SendSMS`, `InvokeLLM` (מוגדרים אך לא תמיד בשימוש).

## פריסה ומודולריות
המערכת מחולקת באופן ברור לפי דומיין:
- `components/calendar/` – לוגיקה עסקית של משמרות והחלפות.
- `components/admin/` – ניהול משתמשים והרשאות.
- `components/dashboard/` – תצוגות KPI/תמיכה.
- `components/ui/` – שכבת קומפוננטות בסיסית לשימוש חוזר.
