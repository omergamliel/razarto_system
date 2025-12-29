import React from 'react';
import { motion } from 'framer-motion';
import { AlertCircle, Clock, CheckCircle, Calendar } from 'lucide-react';
import { Card } from "@/components/ui/card";
// 1. הוספת אימפורטים נדרשים
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';

export default function KPIHeader({ shifts, currentUser, onKPIClick }) {

  // 2. שליפת הכיסויים החלקיים שלי מהשרת
  const { data: myCoverages = [] } = useQuery({
    queryKey: ['my-coverages', currentUser?.email],
    queryFn: async () => {
      if (!currentUser?.email) return [];
      // מביא את כל הרשומות בטבלת הכיסויים שבהן אני הוא המכסה
      return await base44.entities.ShiftCoverage.filter({
        covering_email: currentUser.email
      });
    },
    enabled: !!currentUser?.email
  });

  const isFull24Hours = (s) => {
    if (s.swap_start_time && s.swap_end_time) {
        return s.swap_start_time.startsWith('09:00') && s.swap_end_time.startsWith('09:00');
    }
    return true; 
  };

  // --- 1. KPI אדום ---
  const swapRequestsCount = shifts.filter(s => {
    const isSwapStatus = s.status === 'REQUIRES_FULL_COVERAGE' || 
                         s.status === 'REQUIRES_SWAP' || 
                         s.status === 'swap_requested';
    return isSwapStatus && isFull24Hours(s);
  }).length;

  // --- 2. KPI צהוב ---
  const partialGapsCount = shifts.filter(s => {
    const isOfficialPartial = s.status === 'REQUIRES_PARTIAL_COVERAGE' || 
                              s.status === 'partially_covered' ||
                              s.status === 'REQUIRES_PARTIAL';

    const isDegradedFullSwap = (s.status === 'REQUIRES_FULL_COVERAGE' || 
                                s.status === 'REQUIRES_SWAP' || 
                                s.status === 'swap_requested') && !isFull24Hours(s);

    return isOfficialPartial || isDegradedFullSwap;
  }).length;

  // --- 3. KPI ירוק ---
  const approvedCount = shifts.filter(s => 
    s.status === 'SWAPPED' || s.status === 'COVERED' || s.status === 'approved'
  ).length;

  // --- 4. KPI כחול (התיקון) ---
  const myShiftsCount = shifts.filter(s => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const shiftDate = new Date(s.date);
    shiftDate.setHours(0, 0, 0, 0);
    
    if (shiftDate < today) return false;

    // בדיקה א': תפקיד או שיבוץ ישיר (מה שהיה קודם)
    const isMyRole = currentUser?.assigned_role && 
                     s.role && 
                     typeof s.role === 'string' && 
                     s.role.includes(currentUser.assigned_role);
    
    const isAssignedDirectly = s.assigned_user_id === currentUser?.id || 
                               s.email === currentUser?.email;

    // בדיקה ב' (החדשה): האם אני מופיע בטבלת הכיסויים של המשמרת הזו?
    const isCoveringPartially = myCoverages.some(coverage => coverage.shift_id === s.id);

    // אם אחד התנאים מתקיים - תספור את זה
    return isMyRole || isAssignedDirectly || isCoveringPartially;
  }).length;

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