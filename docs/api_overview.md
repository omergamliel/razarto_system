# שכבת API (Base44 SDK)

## `src/api/base44Client.js`
**מטרה:** יצירת לקוח SDK מרכזי לשימוש בכל שכבות האפליקציה.

**פונקציות/יצוא:**
- `base44` – מופע של `createClient` עם פרמטרים מ-`appParams` (appId, serverUrl, token, functionsVersion). מיועד לשימוש בכל מקום בו נדרשת קריאה ל-Entities/Auth/Integrations.

**קונטקסט שימוש:**
- נקודת חיבור לכל Entity/Integration באפליקציה.

---

## `src/api/entities.js`
**מטרה:** קיצור גישה ל-Entities ו-Auth דרך `base44`.

**פונקציות/יצוא:**
- `Query` – רפרנס ל-`base44.entities.Query` (כלי גנרי לשאילתות).
- `User` – רפרנס ל-`base44.auth` (פעולות אימות).

---

## `src/api/integrations.js`
**מטרה:** חשיפת אינטגרציות Core של Base44.

**פונקציות/יצוא:**
- `Core` – קבוצת אינטגרציות בסיסית.
- `InvokeLLM`, `SendEmail`, `SendSMS`, `UploadFile`, `GenerateImage`, `ExtractDataFromUploadedFile` – פעולות ישירות מתחת ל־`Core`.

**קונטקסט שימוש:**
- שימוש בהעלאת קבצים (למשל עדכון לוגו), שליחת מייל/SMS או תהליכי AI (אם יופעלו בהמשך).
