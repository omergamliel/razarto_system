# קומפוננטות Admin (`src/components/admin`)

## `AdminSettingsModal.jsx`
**מטרה:** מסך ניהול ראשי: משתמשים, הרשאות, תצורות מערכת, FAQ, סטטוס מערכת.

**פונקציות עיקריות:**
- `getPermissionStyle(perm)` – בחירת צבעים לתגית הרשאה.
- `handleSendInvite(user)` – פתיחת WhatsApp להזמנה למערכת.
- `handleSystemChange(field, value)` – עדכון ערכי מערכת (כותרות וכו').
- `handleSupportChange(field, value)` – עדכון הגדרות תמיכה.
- `handleFaqToggle(id)` – פתיחה/סגירה של פריט FAQ.
- `handleFaqChange(id, field, value)` – עדכון טקסט FAQ.
- `handleAddFaq()` – יצירת פריט FAQ חדש.
- `moveFaq(id, direction)` – שינוי סדר FAQ.
- `handleCloseAddUser()` – סגירת מודאל יצירת משתמש.
- `getFilteredPeople()` – חיפוש/סינון אנשי צוות לפי טקסט ומחלקה.

**אינטראקציות מול Base44:**
- `AuthorizedPerson.list/create/update/delete`.
- שימוש ב־`useMutation` לעדכון נתונים.

---

## `SeedRolesData.jsx`
**מטרה:** כלי עזר לאתחול נתוני תפקידי מערכת.

**פונקציות/קומפוננטות:**
- `SeedRolesData()` – קומפוננטה שמפעילה יצירת נתוני Seed (עבור מנהל).

---

## `UpdateUserSerialIds.jsx`
**מטרה:** כלי עזר לעדכון `serial_id` עבור משתמשים.

**פונקציות/קומפוננטות:**
- `UpdateUserSerialIds()` – קומפוננטה לביצוע פעולה נקודתית (מנהל).
