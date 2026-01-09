# מודולי ליבה (`src/lib`)

## `app-params.js`
**מטרה:** ניהול פרמטרים של אפליקציה (appId, serverUrl, token) מתוך URL/Storage.

**פונקציות:**
- `toSnakeCase(str)` – ממיר שם פרמטר ל־snake_case לשימוש ב־localStorage.
- `getAppParamValue(paramName, options)` – מאתר פרמטר מ־URL, שומר ב־localStorage, או משתמש ב־defaultValue.
- `getAppParams()` – מחזיר אובייקט פרמטרים מלא (כולל `clear_access_token`).
- `appParams` – אובייקט יצואי (Spread של `getAppParams`).

## `query-client.js`
**מטרה:** יצירת מופע QueryClient עם ברירות מחדל.

**פונקציות/יצוא:**
- `queryClientInstance` – מופע של `QueryClient` עם `refetchOnWindowFocus: false` ו־`retry: 1`.

## `utils.js`
**מטרה:** Utilities כלליים ל־Tailwind ולזיהוי Iframe.

**פונקציות/יצוא:**
- `cn(...inputs)` – משלב classNames עם `clsx` ו־`tailwind-merge`.
- `isIframe` – בוליאן המציין אם האפליקציה נטענת בתוך iframe.

## `PageNotFound.jsx`
**מטרה:** דף 404 עם התאמה למנהל (Admin Note).

**פונקציות/קומפוננטות:**
- `PageNotFound` – קומפוננטה המציגה 404, מזהה אם המשתמש Admin כדי להציג הודעת ניהול.

## `AuthContext.jsx`
**מטרה:** ניהול אימות משתמשים והחזקת סטייט גלובלי בנושא Auth.

**פונקציות/קומפוננטות:**
- `AuthProvider` – Provider המקיף את האפליקציה.
- `checkAppState` – בדיקת Public Settings + סטטוס הרשאות.
- `checkUserAuth` – בדיקת משתמש דרך `base44.auth.me()`.
- `logout(shouldRedirect)` – ניקוי טוקן ו-logout דרך SDK.
- `navigateToLogin()` – Redirect למסך התחברות.
- `useAuth()` – Hook לחשיפת ה-Context.

## `NavigationTracker.jsx`
**מטרה:** מעקב אחר ניווט באפליקציה.

**פונקציות/קומפוננטות:**
- `NavigationTracker` – מאזין ל-URL, שולח `postMessage` ל-Parent, ומעדכן `appLogs` ב-Base44.

## `VisualEditAgent.jsx`
**מטרה:** שכבת “Visual Edit” עבור עריכת Tailwind בזמן אמת בתוך iframe.

**פונקציות עיקריות:**
- `createOverlay(isSelected)` – יוצר שכבת Highlight על רכיב.
- `positionOverlay(overlay, element)` – ממקם Overlay לפי Bounding Box.
- `findElementsById(id)` – מאתר אלמנטים לפי data-source-location/visual-selector-id.
- `clearHoverOverlays()` – מנקה Highlightים זמניים.
- `handleMouseOver`, `handleMouseOut`, `handleElementClick` – טיפול אינטראקציות עכבר.
- `unselectElement()` – מנקה בחירה פעילה.
- `updateElementClasses(visualSelectorId, classes, replace)` – מעדכן className.
- `updateElementContent(visualSelectorId, content)` – מעדכן תוכן פנימי.
- `toggleVisualEditMode(isEnabled)` – מצב עריכה ON/OFF.
- `handleMessage(event)` – האזנה ל־postMessage מה־Parent.
- `handleScroll`, `handleResize` – עדכון overlay בהתאם לגלילה/שינוי גודל.

**הערה:** הפונקציות הללו מופעלות דרך `useEffect` כדי לעדכן UI בזמן אמת.
