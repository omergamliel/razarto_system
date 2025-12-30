import React from 'react';
import { motion } from 'framer-motion';
import { AlertCircle, Clock, CheckCircle, Calendar } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';

export default function KPIHeader({ shifts, currentUser, onKPIClick }) {

  // --- לוגיקה קיימת (ללא שינוי) ---

  // שליפת הכיסויים החלקיים שלי מהשרת
  const { data: myCoverages = [] } = useQuery({
    queryKey: ['my-coverages', currentUser?.email],
    queryFn: async () => {
      if (!currentUser?.email) return [];
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

  // 1. KPI אדום
  const swapRequestsCount = shifts.filter(s => {
    const isSwapStatus = s.status === 'REQUIRES_FULL_COVERAGE' || 
                         s.status === 'REQUIRES_SWAP' || 
                         s.status === 'swap_requested';
    return isSwapStatus && isFull24Hours(s);
  }).length;

  // 2. KPI צהוב
  const partialGapsCount = shifts.filter(s => {
    const isOfficialPartial = s.status === 'REQUIRES_PARTIAL_COVERAGE' || 
                              s.status === 'partially_covered' ||
                              s.status === 'REQUIRES_PARTIAL';

    const isDegradedFullSwap = (s.status === 'REQUIRES_FULL_COVERAGE' || 
                                s.status === 'REQUIRES_SWAP' || 
                                s.status === 'swap_requested') && !isFull24Hours(s);

    return isOfficialPartial || isDegradedFullSwap;
  }).length;

  // 3. KPI ירוק
  const approvedCount = shifts.filter(s => 
    s.status === 'SWAPPED' || s.status === 'COVERED' || s.status === 'approved'
  ).length;

  // 4. KPI כחול
  const myShiftsCount = shifts.filter(s => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const shiftDate = new Date(s.date);
    shiftDate.setHours(0, 0, 0, 0);
    
    if (shiftDate < today) return false;

    const isMyRole = currentUser?.assigned_role && 
                     s.role && 
                     typeof s.role === 'string' && 
                     s.role.includes(currentUser.assigned_role);
    
    const isAssignedDirectly = s.assigned_user_id === currentUser?.id || 
                               s.email === currentUser?.email;

    const isCoveringPartially = myCoverages.some(coverage => coverage.shift_id === s.id);

    return isMyRole || isAssignedDirectly || isCoveringPartially;
  }).length;

  const kpis = [
    {
      id: 'swap_requests',
      title: 'בקשות להחלפה למשמרת מלאה',
      count: swapRequestsCount,
      icon: AlertCircle,
      gradient: 'from-red-500 to-red-600',
      bgColor: 'bg-red-50',
      textColor: 'text-red-600',
      borderColor: 'border-red-200'
    },
    {
      id: 'partial_gaps',
      title: 'בקשות להחלפה למשמרת חלקית',
      count: partialGapsCount,
      icon: Clock,
      gradient: 'from-yellow-500 to-yellow-600',
      bgColor: 'bg-yellow-50',
      textColor: 'text-yellow-600',
      borderColor: 'border-yellow-200'
    },
    {
      id: 'approved',
      title: 'היסטוריית החלפות שבוצעו',
      count: approvedCount,
      icon: CheckCircle,
      gradient: 'from-green-500 to-green-600',
      bgColor: 'bg-green-50',
      textColor: 'text-green-600',
      borderColor: 'border-green-200'
    },
    {
      id: 'my_shifts',
      title: 'המשמרות העתידיות שלי',
      count: myShiftsCount,
      icon: Calendar,
      gradient: 'from-blue-500 to-blue-600',
      bgColor: 'bg-blue-50',
      textColor: 'text-blue-600',
      borderColor: 'border-blue-200'
    }
  ];

  return (
    // --- הקונטיינר הראשי: במובייל Flex עם גלילה, במחשב Grid רגיל ---
    <div className="flex overflow-x-auto pb-4 gap-3 -mx-4 px-4 md:grid md:grid-cols-4 md:gap-4 md:mx-0 md:px-0 md:overflow-visible md:pb-0 snap-x scrollbar-hide mb-6">
      {kpis.map((kpi, index) => (
        <motion.div
          key={kpi.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
          onClick={() => onKPIClick && onKPIClick(kpi.id)}
          // --- הגדרת רוחב: במובייל 85% מהמסך, במחשב גמיש ---
          className={`
            min-w-[85vw] md:min-w-0 snap-center
            ${kpi.bgColor} border-2 ${kpi.borderColor} 
            rounded-2xl p-4 cursor-pointer hover:shadow-md transition-all
            relative overflow-hidden group
          `}
        >
          {/* שורה עליונה: אייקון ומספר צמודים */}
          <div className="flex items-center gap-3 mb-3">
            
            {/* אייקון בתוך ריבוע צבעוני */}
            <div className={`p-3 rounded-xl bg-gradient-to-br ${kpi.gradient} text-white shadow-sm group-hover:scale-110 transition-transform`}>
              <kpi.icon className="w-6 h-6" />
            </div>

            {/* המספר הגדול */}
            <span className={`text-4xl font-extrabold ${kpi.textColor}`}>
              {kpi.count}
            </span>

          </div>

          {/* כותרת */}
          <div className="relative z-10">
            <p className="text-sm font-medium text-gray-700 leading-tight">
              {kpi.title}
            </p>
          </div>

          {/* עיגול דקורטיבי ברקע (לעיצוב בלבד) */}
          <div className={`absolute -bottom-4 -left-4 w-24 h-24 rounded-full bg-gradient-to-tr ${kpi.gradient} opacity-5 group-hover:scale-125 transition-transform duration-500`} />
        </motion.div>
      ))}
    </div>
  );
}