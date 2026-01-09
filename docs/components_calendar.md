# קומפוננטות Calendar (`src/components/calendar`)

## `ShiftCalendar.jsx`
**מטרה:** קומפוננטת הליבה שמנהלת את לוח המשמרות, Query-ים, מודאלים ופעולות החלפה.

**פונקציות/Handlers מרכזיים:**
- `appendSwapLog(message, data)` – רישום לוגים דיבוגיים לתהליך החלפה.
- `closeAllModals()` – סגירה מרוכזת של כל המודאלים.
- `handleCellClick(date, shift)` – פתיחת מודאל לפי תא שנלחץ.
- `handleOfferCover(shift)` – פתיחת תהליך הצעת כיסוי משמרת.
- `handleOpenSwapRequest(shift)` – פתיחת מודאל יצירת בקשת החלפה.
- `handleSwapSubmit(data)` – שליחת בקשה ל-Backend (Full/Partial) ועדכון Query.

**תצוגות ומודאלים שנשענים עליו:**
- `CalendarHeader`, `CalendarGrid`, `ShiftDetailsModal`, `SwapRequestModal`, `AcceptSwapModal`, `AddShiftModal`, `KPIListModal`, `AdminSettingsModal` ועוד.

---

## `CalendarHeader.jsx`
**מטרה:** פס עליון עם ניווט בתאריכים, לוגו, פעולות מנהל וסטטוס משתמש.

**פונקציות:**
- `getTimeBasedGreeting()` – ברכה לפי שעה.
- `navigatePrev()` / `navigateNext()` – שינוי תאריך לפי `viewMode`.
- `formatTitle()` – כותרת תאריך לפי חודש/שבוע.
- `handleLogoClick()` – פתיחת בחירת קובץ עבור מנהל.
- `handleFileUpload(e)` – העלאת לוגו דרך `UploadFile`.

---

## `CalendarGrid.jsx`
**מטרה:** יצירת גריד ימים (חודשי/שבועי) והצגת `ShiftCell` לכל יום.

**פונקציות:**
- `getEnrichedShift(shift)` – העשרת משמרת בפרטי משתמש.
- `getDaysToDisplay()` – יצירת רשימת ימים לפי תצוגה.
- `getShiftForDate(date)` – מציאת משמרת תואמת לתאריך.

---

## `ShiftCell.jsx`
**מטרה:** תא יומי בגריד עם סטטוס משמרת.

**פונקציות:**
- `handleClick()` – מעביר `date` ו־`shift` ל־callback.
- `getStatusStyles()` – בחירת צבעים/אייקונים לפי סטטוס.

**שדות נגזרים:**
- `nameLines` – בניית רשימת משתתפים (בעל משמרת + כיסויים).

---

## `SwapRequestModal.jsx`
**מטרה:** פתיחת בקשת החלפה מלאה/חלקית.

**פונקציות:**
- `handleSliderDrag(e, handleIndex)` – גרירת טווח שעות ב־UI.
- `updateInputsFromRange(newRange)` – סנכרון אינפוטים עם טווח.
- `handleManualInputChange(type, val)` – עדכון ידני של שעות.
- `handleSubmit(e)` – בניית Payload ושליחה ל־`onSubmit`.
- `formatDisplayDate(isoDateStr)` – פורמט תאריך להצגה.

---

## `AcceptSwapModal.jsx`
**מטרה:** קבלת בקשת החלפה/כיסוי (Full או Partial).

**פונקציות:**
- `formatSegmentText(segment)` – פורמט טווח זמן מוצג.
- `handleSubmit(e)` – יצירת נתוני כיסוי ושליחה ל־`onAccept`.

**לוגיקה מרכזית:**
- משתמשת ב־`normalizeShiftContext`, `computeCoverageSummary`, `resolveSwapType` כדי להגדיר חלונות זמן וכיסויים חסרים.

---

## `ShiftDetailsModal.jsx`
**מטרה:** הצגת פרטי משמרת, כיסויים, סטטוסים ופעולות.

**פונקציות:**
- `handleDelete()` – מחיקת משמרת/בקשה (לפי הרשאות).
- `isCoveredSwap(shift)` – בדיקת סטטוס כיסוי מלא מול כיסויים קיימים.
- `formatSegment(start, end)` – תיאור טווח כיסוי.
- `formatSegmentNarrative(start, end)` – ניסוח טקסטואלי לטווח.
- `handleAddToCalendar()` – הוספה ללוח שנה חיצוני.
- `handleWhatsAppShare()` – שיתוף בקשה דרך WhatsApp.

---

## `ShiftActionModal.jsx`
**מטרה:** מודאל פעולות מהיר למשמרת.

**פונקציות:**
- `handleDelete()` – טריגר למחיקת משמרת.

---

## `ShiftDetailsModal.jsx`
(תועד לעיל)

---

## `PendingRequestsModal.jsx`
**מטרה:** רשימת בקשות החלפה פתוחות למשתמשים אחרים.

**פונקציות:**
- קומפוננטה מציגה `pendingRequests` ומאפשרת `onAccept`.

---

## `PendingApprovalModal.jsx`
**מטרה:** מודאל לאישורי בקשות/כיסויים הממתינים למנהל.

**פונקציות:**
- `handleApprove()` – אישור בקשה.
- `formatTimeBreakdown(request)` – פירוק טווחי זמן לתצוגה.

---

## `AddShiftModal.jsx`
**מטרה:** הוספת משמרת חדשה ע״י מנהל.

**פונקציות:**
- `handleSubmit(e)` – בניית משמרת עם תאריכים ושעות ברירת מחדל.
- `handleDepartmentChange(value)` – עדכון מחלקה וניקוי בחירת משתמש.

---

## `EditRoleModal.jsx`
**מטרה:** שינוי שיוך משתמש/תפקיד למשמרת קיימת.

**פונקציות:**
- `handleSubmit(e)` – שליחת עדכון התפקיד.
- `handleDepartmentChange(value)` – בחירת מחלקה.

---

## `SwapSuccessModal.jsx`
**מטרה:** מסך הצלחה לאחר כיסוי/בקשה.

**פונקציות:**
- `handleWhatsAppShare()` – שיתוף הודעה אחרי הצלחה.

---

## `HeadToHeadSelectorModal.jsx`
**מטרה:** בחירת משמרת להצעת החלפה “ראש בראש”.

**פונקציות:**
- `handleSelectShift(shift)` – בחירת משמרת.
- `handleSendProposal()` – שליחת הצעה למשתמש אחר.

---

## `HeadToHeadApprovalModal.jsx`
**מטרה:** אישור החלפה ראש בראש בין שני משתמשים.

**פונקציות:**
- `getShiftInfo(id)` – שליפת נתוני משמרת מה-Backend.
- `ShiftCard({ shift, label, type })` – תצוגה פנימית של משמרת.

---

## `CoverSegmentModal.jsx`
**מטרה:** בחירת מקטע כיסוי ספציפי (Legacy).

**פונקציות עיקריות:**
- `computeUncoveredSegments(windowStart, windowEnd, coveragesList)` – חישוב פערים בכיסוי.
- `handleTypeChange(type)` – שינוי סוג כיסוי.
- `handleSegmentSelect(index)` – בחירת מקטע.
- `formatSegmentLabel(start, end)` – ניסוח label למקטע.
- `updateInputsFromRange(newRange)` – סנכרון אינפוטים עם טווח.
- `handleSliderDrag(event, handleIndex)` – גרירת טווח כיסוי.
- `handleManualTimeChange(field, value)` – שינוי ידני של שעות.
- `handleSubmit(e)` – שליחת הכיסוי ל־onSubmit.

> הערה: ב־`ShiftCalendar` נעשה מעבר ל־`AcceptSwapModal`, אך הקובץ נשאר לתאימות.

---

## `BackgroundShapes.jsx`
**מטרה:** שכבת רקע דקורטיבית ללוח.

**פונקציות:**
- `BackgroundShapes()` – מחזיר אלמנטים אבסטרקטיים (SVG/Divs).

---

## `departmentData.jsx`
**מטרה:** נתוני מחלקות ותפקידים סטטיים.

**פונקציות/יצוא:**
- `DEPARTMENTS` – מפה של קבוצות למחלקות.
- `getDepartmentList()` – מחזיר רשימת מפתחות.
- `getRolesForDepartment(department)` – מחזיר רשימת תפקידים למחלקה.

---

## `whatsappTemplates.jsx`
**מטרה:** לוגיקה משותפת לניהול בקשות והודעות WhatsApp.

**פונקציות:**
- `resolveSwapType(shift, activeRequest)` – Full/Partial.
- `resolveRequestWindow(shift, activeRequest)` – חלון הבקשה.
- `buildDateTime(dateStr, timeStr)` – בניית `Date` מאוחד.
- `normalizeCoverageEntry(coverage, fallbackWindow)` – התאמת שדות זמן.
- `resolveShiftWindow(shift, requestWindow)` – חלון משמרת.
- `calculateMissingSegments(baseStart, baseEnd, coverageEntries)` – איתור פערים בכיסוי.
- `computeCoverageSummary({ shift, activeRequest, coverages })` – תקציר כיסויים.
- `normalizeShiftContext(shift, opts)` – איחוד נתוני משמרת/כיסוי/משתמש.
- `buildShiftDeepLink(shiftId)` – יצירת קישור ישיר למשמרת.
- `buildHeadToHeadDeepLink(targetId, offerId)` – קישור להחלפת ראש-בראש.
- `buildSwapTemplate(...)` – הודעת WhatsApp לבקשת החלפה.
- `buildHeadToHeadTemplate(...)` – הודעת WhatsApp להחלפה יזומה.

---

## `PendingRequestsSidebar.jsx`
**מטרה:** קובץ ריק/שמורה עתידית (0 שורות).
