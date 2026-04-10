
export const DEPARTMENTS = {
  'א': [
    'אינטגרציה מבצעית',
    'ביטחון',
    'דיגיטל',
    'צבאי מערכתי'
  ],
  'מ': [
    'דרום',
    'מרכז',
    'צפון',
    'עורף',
    'מבצעים',
    'סייבר',
    'שליטה',
    'תה"ם'
  ],
  'ת': [
    'תקיפה',
    'ח"ח',
    'רציפות התפקוד',
    'גיו"כ',
    'עומק',
    'מעג"ש',
    'תב"ל',
    'תכנון'
  ]
};

export const getDepartmentList = () => Object.keys(DEPARTMENTS);

export const getRolesForDepartment = (department) => DEPARTMENTS[department] || [];
