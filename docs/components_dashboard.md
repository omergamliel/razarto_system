# קומפוננטות Dashboard (`src/components/dashboard`)

## `KPIHeader.jsx`
**מטרה:** פס KPI ראשי עם מדדים (בקשות מלאות/חלקיות/היסטוריה/משמרות עתידיות).

**קומפוננטות/פונקציות:**
- `KPIHeader({ shifts, currentUser, onKPIClick })` – מבצע Query-ים ומציג KPI Cards. כל כרטיס מפעיל `onKPIClick`.

---

## `KPIListModal.jsx`
**מטרה:** מודאל המציג רשימות לפי סוג KPI.

**פונקציות עיקריות:**
- `formatDateTimeForDisplay(dateStr, timeStr)` – עיצוב זמן להצגה.
- `isFullShift(shift)` – זיהוי משמרת מלאה.
- `getShiftTimeDisplay(shift)` – יצירת טווח זמן להצגה.
- `computeMissingSegments(windowStart, windowEnd, coverageSegments)` – חישוב פערי כיסוי.
- `getStartDateTime(item)` – זמן התחלה לאייטם.
- `getLatestActivityDate(item)` – זמן פעילות אחרון.
- `getDisplayDay(dateStr)` – שם יום בעברית.
- `isOpenStatus(status)` – בדיקת סטטוס פתוח.
- `handleAddToCalendar(item)` – יצירת קובץ Calendar ושמירה מקומית.
  - כולל helper פנימי `formatForCalendar(dateObj, fallbackDateStr)` לעיבוד תאריך.
- `handleRequestSwap(item)` – טריגר לבקשת החלפה.
- `getApprovalUrl(item)` – בניית URL אישור.
- `handleReshareWhatsapp(item)` – שיתוף WhatsApp מחדש.
- `getTitleAndColor()` – קביעה דינמית של כותרת וצבעים לפי סוג KPI.

---

## `HallOfFameModal.jsx`
**מטרה:** הצגת “היכל התהילה” למובילי החלפות.

**פונקציות:**
- `getRankBadge(rank)` – בחירת תגית/צבע לפי דירוג.

---

## `HelpSupportModal.jsx`
**מטרה:** מודאל תמיכה/FAQ עם אפשרות פתיחה/סגירה לשאלות.

**פונקציות:**
- `toggleExpand(index)` – פתיחה/סגירה של שאלה לפי אינדקס.
