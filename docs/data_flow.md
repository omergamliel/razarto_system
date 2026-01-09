# זרימת נתונים ותהליכים (Data Flow)

## 1) אתחול אפליקציה
- `main.jsx` טוען את `App` ומחבר CSS גלובלי.
- `App.jsx` עוטף את האפליקציה ב-`AuthProvider` וב-`QueryClientProvider`.
- הראוטינג נבנה דינמית מתוך `pages.config.js`.

## 2) תהליך אימות משתמש
1. `AuthProvider` מופעל בעת טעינת האפליקציה.
2. מתבצעת קריאה ל־`/api/apps/public` לקבלת `public_settings`.
3. אם אין Token → המשתמש מוגדר כלא מאומת.
4. אם יש Token → קריאה ל־`base44.auth.me()` לקבלת פרטי המשתמש.
5. שגיאות רלוונטיות:
   - `auth_required` → ניווט ל-Login.
   - `user_not_registered` → הצגת `UserNotRegisteredError`.

## 3) טעינת לוח משמרות
- `ShiftCalendar` מפעיל מספר Query-ים:
  - `Shift.list()` – רשימת משמרות.
  - `SwapRequest.list()` – בקשות החלפה.
  - `ShiftCoverage.list()` – כיסויים/אישורים.
  - `AuthorizedPerson.list()` – הרשאות משתמשים.
- הנתונים מנורמלים באמצעות `normalizeShiftContext` (ב־`whatsappTemplates.jsx`).

## 4) יצירת בקשת החלפה
1. המשתמש פותח `SwapRequestModal`.
2. המשתמש בוחר Full/Partial ומגדיר חלון זמן.
3. `handleSubmit` בונה Payload עם תאריכים ושעות.
4. המידע נשלח ל-Backend דרך `base44.entities.SwapRequest.create()`.
5. המערכת מרעננת Query כדי לעדכן את הלוח בזמן אמת.

## 5) אישור החלפה / כיסוי
- דרך `AcceptSwapModal` או `ShiftDetailsModal`.
- המערכת בונה חלון כיסוי ושולחת `ShiftCoverage.create()`.
- `computeCoverageSummary` מחשבת האם הכיסוי מלא/חלקי ומעדכנת סטטוס.

## 6) תבניות שיתוף (WhatsApp)
- `buildSwapTemplate` ו-`buildHeadToHeadTemplate` בונים הודעה + Deep Link.
- `buildShiftDeepLink` מייצר URL שמחזיר את המשתמש לאפליקציה במצב “פתיחת משמרת ספציפית”.

## 7) לוגיקה של KPI
- `KPIHeader` ו-`KPIListModal` משתמשים ב־`SwapRequest` ו־`ShiftCoverage` כדי להציג מדדים (פתוחות, חלקיות, היסטוריה, משמרות עתידיות).

## 8) מעקב ניווט
- `NavigationTracker` מאזין לנתיב הנוכחי.
- מבצע:
  - `postMessage` ל-Parent Iframe עם URL עדכני.
  - `appLogs.logUserInApp()` לצורך ניטור פעילות משתמשים.
