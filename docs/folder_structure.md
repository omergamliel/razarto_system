# מבנה תיקיות וקבצים

> המסמך מציג עץ מבני של הפרויקט + הסבר תמציתי על כל שכבה.

## עץ מבנה (קצר)
```
.
├── docs/                      # תיעוד הפרויקט בעברית
├── src/
│   ├── api/                   # שכבת SDK מול Base44
│   ├── assets/                # קבצי מדיה סטטיים (SVG/תמונות)
│   ├── components/            # קומפוננטות UI/פיצ'רים
│   │   ├── admin/              # מסכי ניהול
│   │   ├── calendar/           # לוח משמרות והחלפות
│   │   ├── dashboard/          # KPI, עזרה, סטטיסטיקות
│   │   ├── onboarding/         # מסכי הצטרפות
│   │   └── ui/                 # קומפוננטות בסיסיות (shadcn)
│   ├── hooks/                 # Hooks מותאמים
│   ├── lib/                   # לוגיקה תשתיתית/Context/Utils
│   ├── pages/                 # דפי אפליקציה
│   ├── utils/                 # פונקציות עזר כלליות
│   ├── App.jsx                # קומפוננטת שורש
│   ├── main.jsx               # Entry point
│   ├── App.css, index.css     # סגנונות גלובליים
│   └── pages.config.js        # מיפוי דפים ונתיב ראשי
├── index.html                 # תבנית HTML
├── package.json               # סקריפטים ותלויות
├── vite.config.js             # קונפיגורציית Vite
├── tailwind.config.js         # קונפיגורציית Tailwind
├── postcss.config.js          # קונפיגורציית PostCSS
├── eslint.config.js           # קונפיגורציית ESLint
├── jsconfig.json              # הגדרות TypeScript/Paths
└── components.json            # הגדרות shadcn/ui
```

## הסברים כלליים
- **`src/api/`** – מייצר לקוח SDK ומחבר ישויות/אינטגרציות.
- **`src/lib/`** – שכבת לוגיקה תשתיתית (Auth, QueryClient, מעקב ניווט).
- **`src/components/`** – הליבה הויזואלית והעסקית של האפליקציה.
- **`src/pages/`** – דפים שמרכיבים את ה-Routes.
- **`src/utils/`** – פונקציות עזר שאינן תלויות UI.

> פירוט על כל קובץ נמצא במסמכי התיעוד הייעודיים בתוך `docs/`.
