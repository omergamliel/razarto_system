# קומפוננטות Onboarding (`src/components/onboarding`)

## `OnboardingModal.jsx`
**מטרה:** מסך קבלת פנים למשתמש שאותר במערכת אך עדיין לא חובר רשמית לחשבון.

**פונקציות/קומפוננטות:**
- `OnboardingModal({ isOpen, authorizedData, onConfirm, isLoading })` – מציג פרטי משתמש מזוהים ומאפשר לאשר חיבור.

**התנהגות מרכזית:**
- מציג ברכה אישית לפי שם פרטי.
- כפתור כניסה שמפעיל `onConfirm` (מחובר ל־linkUserMutation ב־`ShiftCalendar`).
