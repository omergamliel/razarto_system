# קבצי אתחול ו-CSS

## `src/main.jsx`
**מטרה:** נקודת כניסה ל-React.

**פונקציות/קומפוננטות:**
- `ReactDOM.createRoot(...).render(<App />)` – אתחול ה־Root.
- מאזין ל-`import.meta.hot` ושולח `postMessage` ל־Parent לפני/אחרי HMR.

---

## `src/App.jsx`
**מטרה:** קומפוננטת שורש של האפליקציה.

**פונקציות/קומפוננטות:**
- `LayoutWrapper({ children, currentPageName })` – מעטפת אופציונלית לפריסה.
- `AuthenticatedApp()` – מטפל ב־Loading/Auth Errors ומגדיר Routes.
- `App()` – עוטף Providers, Router, `NavigationTracker`, `Toaster`, `VisualEditAgent`.

---

## `src/App.css`
**מטרה:** סגנונות כלליים ייעודיים לאפליקציה (מעל Tailwind).

---

## `src/index.css`
**מטרה:** סגנונות בסיסיים, כולל Tailwind base/utilities.

---

## `src/assets/react.svg`
**מטרה:** Asset סטטי (אייקון ברירת מחדל). אינו בשימוש ישיר בקוד הליבה.
