import React from 'react';
import { motion } from 'framer-motion';
import { AlertCircle, Clock, CheckCircle, Calendar } from 'lucide-react';
import { Card } from "@/components/ui/card";

export default function KPIHeader({ shifts, currentUserEmail, currentUserId, onKPIClick }) {

  // --- פונקציית עזר קריטית: האם זו משמרת של 24 שעות? ---
  const isFull24Hours = (s) => {
    // נדרש שגם ההתחלה וגם הסיום יהיו קיימים ושווים ל-09:00
    if (s.swap_start_time && s.swap_end_time) {
        // שימוש ב-startsWith כדי למנוע בעיות של שניות (למשל 09:00:00)
        return s.swap_start_time.startsWith('09:00') && s.swap_end_time.startsWith('09:00');
    }
    // אם אין שעות החלפה ספציפיות, והסטטוס הוא החלפה - נניח שזה מלא
    return true; 
  };

  // --- 1. KPI אדום: בקשות להחלפה למשמרת מלאה (בלבד!) ---
  const swapRequestsList = shifts.filter(s => {
    // רשימת הסטטוסים שיכולים להיות החלפה
    const isSwapStatus = s.status === 'REQUIRES_FULL_COVERAGE' || 
                         s.status === 'REQUIRES_SWAP' || 
                         s.status === 'swap_requested';
    
    // תנאי ברזל: חייב להיות 24 שעות מלאות
    return isSwapStatus && isFull24Hours(s);
  });
  
  const swapRequestsCount = swapRequestsList.length;


  // --- 2. KPI צהוב: בקשות להחלפה חלקית ---
  const partialGapsList = shifts.filter(s => {
    // בדיקה 1: סטטוסים שהם במוצהר "חלקי"
    const isOfficialPartial = s.status === 'REQUIRES_PARTIAL_COVERAGE' || 
                              s.status === 'partially_covered' ||
                              s.status === 'REQUIRES_PARTIAL';

    // בדיקה 2: סטטוסים של "החלפה" (אדום לשעבר) אבל שהשעות הן כבר לא 24 מלאות
    const isDegradedFullSwap = (s.status === 'REQUIRES_FULL_COVERAGE' || 
                                s.status === 'REQUIRES_SWAP' || 
                                s.status === 'swap_requested') && !isFull24Hours(s);

    return isOfficialPartial || isDegradedFullSwap;
  });

  const partialGapsCount = partialGapsList.length;


  // --- 3. KPI ירוק: היסטוריית החלפות ---
  const approvedCount = shifts.filter(s => 
    s.status === 'SWAPPED' || s.status === 'COVERED' || s.status === 'approved'
  ).length;


  // --- 4. KPI כחול: המשמרות העתידיות שלי ---
  const myShiftsCount = shifts.filter(s => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const shiftDate = new Date(s.date);
    shiftDate.setHours(0, 0, 0, 0);
    
    if (shiftDate < today) return false;

    const isAssignedToMe = (s.assigned_user_id === currentUserId) || 
                           (s.email === currentUserEmail) ||
                           (s.role === currentUserEmail); // גיבוי נוסף

    return isAssignedToMe;
  }).length;


  // --- בניית האובייקטים לרינדור ---
  const kpis = [
    {
      id: 'swap_requests',
      title: 'בקשות להחלפה למשמרת מלאה',
      count: swapRequestsCount,
      icon: AlertCircle,
      color: 'from-red-500 to-red-600',
      bgColor: 'bg-red-50',
      textColor: 'text-red-600',
      borderColor: 'border-red-200'
    },
    {
      id: 'partial_gaps',
      title: 'בקשות להחלפה למשמרת חלקית',
      count: partialGapsCount,
      icon: Clock,
      color: 'from-yellow-500 to-yellow-600',
      bgColor: 'bg-yellow-50',
      textColor: 'text-yellow-600',
      borderColor: 'border-yellow-200'
    },
    {
      id: 'approved',
      title: 'היסטוריית החלפות שבוצעו',
      count: approvedCount,
      icon: CheckCircle,
      color: 'from-green-500 to-green-600',
      bgColor: 'bg-green-50',
      textColor: 'text-green-600',
      borderColor: 'border-green-200'
    },
    {
      id: 'my_shifts',
      title: 'המשמרות העתידיות שלי',
      count: myShiftsCount,
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