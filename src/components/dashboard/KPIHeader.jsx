import React from 'react';
import { motion } from 'framer-motion';
import { AlertCircle, Clock, CheckCircle, Calendar } from 'lucide-react';
import { Card } from "@/components/ui/card";

export default function KPIHeader({ shifts, currentUserEmail, currentUserId, onKPIClick }) {

  // --- פונקציית עזר לבדיקת משמרת מלאה (24 שעות) ---
  // מחזירה אמת רק אם השעות הן 09:00 עד 09:00
  const isFull24Hours = (s) => {
    // אם אין שעות החלפה מוגדרות, נניח שזה לא רלוונטי או מלא (תלוי דאטה),
    // אבל כאן נחמיר: אם יש זמנים, הם חייבים להיות 09:00-09:00
    if (s.swap_start_time && s.swap_end_time) {
        return s.swap_start_time === '09:00' && s.swap_end_time === '09:00';
    }
    // אם אין זמנים והסטטוס הוא החלפה - נניח שזה מלא כברירת מחדל (אלא אם תשנה את זה)
    return true; 
  };

  // --- 1. KPI אדום: בקשות להחלפה למשמרת מלאה ---
  const swapRequests = shifts.filter(s => {
    // בודק אם הסטטוס הוא "דרושה החלפה" (או סטטוס ישן)
    const isSwapStatus = s.status === 'REQUIRES_SWAP' || s.status === 'swap_requested';
    
    // תנאי קריטי: חייב להיות 24 שעות מלאות!
    // אם זה "דרושה החלפה" אבל השעות הן חלקיות - זה לא ייכנס לפה.
    return isSwapStatus && isFull24Hours(s);
  }).length;


  // --- 2. KPI צהוב: בקשות להחלפה חלקית ---
  const partialGaps = shifts.filter(s => {
    // מקרה א': הסטטוס הוא מפורשות "כיסוי חלקי"
    const isOfficialPartial = s.status === 'REQUIRES_PARTIAL_COVERAGE' || 
                              s.status === 'partially_covered' ||
                              s.status === 'REQUIRES_PARTIAL';

    // מקרה ב': הסטטוס הוא "דרושה החלפה" (כאילו מלא), אבל השעות הן לא 24 מלאות
    // (למשל: מישהו כבר לקח חלק מהמשמרת, או שביקשו מראש רק על חלק)
    const isDegradedFullSwap = (s.status === 'REQUIRES_SWAP' || s.status === 'swap_requested') && !isFull24Hours(s);

    return isOfficialPartial || isDegradedFullSwap;
  }).length;


  // --- 3. KPI ירוק: היסטוריית החלפות שבוצעו ---
  const approved = shifts.filter(s => 
    // סופר כל מה שנסגר מעגל: הוחלף או כוסה
    s.status === 'SWAPPED' || s.status === 'COVERED' || s.status === 'approved'
  ).length;


  // --- 4. KPI כחול: המשמרות העתידיות שלי ---
  const myShifts = shifts.filter(s => {
    // בדיקת תאריך (עתידי + היום)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const shiftDate = new Date(s.date);
    shiftDate.setHours(0, 0, 0, 0);
    
    if (shiftDate < today) return false;

    // בדיקת שייכות:
    // בודק אם ה-ID או המייל שלי מופיעים כמי שמשובץ למשמרת בפועל.
    // זה תופס גם שיבוץ מקורי וגם אם התנדבתי והחלפתי מישהו (וה-assigned עודכן).
    const isAssignedToMe = (s.assigned_user_id === currentUserId) || 
                           (s.email === currentUserEmail); // גיבוי למקרה שאין ID

    return isAssignedToMe;
  }).length;


  const kpis = [
    {
      id: 'swap_requests',
      title: 'בקשות להחלפה למשמרת מלאה',
      count: swapRequests,
      icon: AlertCircle,
      color: 'from-red-500 to-red-600',
      bgColor: 'bg-red-50',
      textColor: 'text-red-600',
      borderColor: 'border-red-200'
    },
    {
      id: 'partial_gaps',
      title: 'בקשות להחלפה למשמרת חלקית',
      count: partialGaps,
      icon: Clock,
      color: 'from-yellow-500 to-yellow-600',
      bgColor: 'bg-yellow-50',
      textColor: 'text-yellow-600',
      borderColor: 'border-yellow-200'
    },
    {
      id: 'approved',
      title: 'היסטוריית החלפות שבוצעו',
      count: approved,
      icon: CheckCircle,
      color: 'from-green-500 to-green-600',
      bgColor: 'bg-green-50',
      textColor: 'text-green-600',
      borderColor: 'border-green-200'
    },
    {
      id: 'my_shifts',
      title: 'המשמרות העתידיות שלי',
      count: myShifts,
      icon: Calendar,
      color: 'from-blue-500 to-blue-600',
      bgColor: 'bg-blue-50',
      textColor: 'text-blue-600',
      borderColor: 'border-blue-200'
    }
  ];

  return (
    <div className="grid grid-cols-4 gap-2 md:gap-4 mb-6">
      {kpis.map((kpi, index) => (
        <motion.div
          key={kpi.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
        >
          <Card
            onClick={() => onKPIClick(kpi.id)}
            className={`cursor-pointer hover:shadow-lg transition-all duration-300 border-2 ${kpi.borderColor} ${kpi.bgColor} p-2 md:p-4`}
          >
            <div className="flex flex-col md:flex-row items-center justify-between mb-1 md:mb-3">
              <div className={`p-1 md:p-2 rounded-lg bg-gradient-to-br ${kpi.color}`}>
                <kpi.icon className="w-3 h-3 md:w-5 md:h-5 text-white" />
              </div>
              <span className={`text-xl md:text-3xl font-bold ${kpi.textColor}`}>
                {kpi.count}
              </span>
            </div>
            <h3 className="text-[10px] md:text-sm font-semibold text-gray-700 leading-tight">
              {kpi.title}
            </h3>
          </Card>
        </motion.div>
      ))}
    </div>
  );
}