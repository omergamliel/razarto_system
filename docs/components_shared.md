# קומפוננטות כלליות (`src/components`)

## `LoadingSkeleton.jsx`
**מטרה:** תצוגת שלד/טעינה עם אפקט shimmer.

**פונקציות/קומפוננטות:**
- `LoadingSkeleton({ variant, lines, className, ariaLabel })` – מציג בלוק או מספר שורות לפי `variant`.

**התנהגות חשובה:**
- מזריק `<style>` עם keyframes ל־shimmer אם הוא לא קיים במסמך.

---

## `UserNotRegisteredError.jsx`
**מטרה:** תצוגת חסימה למשתמש שאין לו הרשאה לאפליקציה.

**פונקציות/קומפוננטות:**
- `UserNotRegisteredError({ onRefresh })` – מסך שגיאה מעוצב.
- `handleContactSupport()` – פותח WhatsApp עם הודעת תמיכה מוכנה.

**קונטקסט שימוש:**
- מוצג מתוך `AuthContext` כאשר מתקבלת שגיאת `user_not_registered`.
