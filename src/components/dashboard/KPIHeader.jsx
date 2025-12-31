import React from 'react';
import { motion } from 'framer-motion';
import { AlertCircle, Clock, CheckCircle, Calendar } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';

export default function KPIHeader({ shifts, currentUser, onKPIClick }) {

  // --- Logic ---

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

  // 1. Red KPI: Full Swap Requests
  const swapRequestsCount = shifts.filter(s => {
    const isSwapStatus = s.status === 'REQUIRES_FULL_COVERAGE' || 
                         s.status === 'REQUIRES_SWAP' || 
                         s.status === 'swap_requested';
    return isSwapStatus && isFull24Hours(s);
  }).length;

  // 2. Yellow KPI: Partial Gaps
  const partialGapsCount = shifts.filter(s => {
    const isOfficialPartial = s.status === 'REQUIRES_PARTIAL_COVERAGE' || 
                              s.status === 'partially_covered' ||
                              s.status === 'REQUIRES_PARTIAL';

    // A requested full swap that ISN'T 24 hours counts as partial for our logic
    const isDegradedFullSwap = (s.status === 'REQUIRES_FULL_COVERAGE' || 
                                s.status === 'REQUIRES_SWAP' || 
                                s.status === 'swap_requested') && !isFull24Hours(s);

    return isOfficialPartial || isDegradedFullSwap;
  }).length;

  // 3. Green KPI: Approved / History
  const approvedCount = shifts.filter(s => 
    s.status === 'SWAPPED' || s.status === 'COVERED' || s.status === 'approved'
  ).length;

  // 4. Blue KPI: My Shifts
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
      mobileTitle: 'בקשות למלאה',
      desktopTitle: 'בקשות להחלפה מלאה',
      count: swapRequestsCount,
      icon: AlertCircle,
      gradient: 'from-red-500 to-red-600',
      bgColor: 'bg-red-50',
      textColor: 'text-red-600',
      borderColor: 'border-red-200'
    },
    {
      id: 'partial_gaps',
      mobileTitle: 'בקשות לחלקית',
      desktopTitle: 'בקשות להחלפה חלקית',
      count: partialGapsCount,
      icon: Clock,
      gradient: 'from-yellow-500 to-yellow-600',
      bgColor: 'bg-yellow-50',
      textColor: 'text-yellow-600',
      borderColor: 'border-yellow-200'
    },
    {
      id: 'approved',
      mobileTitle: 'היסטוריה',
      desktopTitle: 'היסטוריית החלפות',
      count: approvedCount,
      icon: CheckCircle,
      gradient: 'from-green-500 to-green-600',
      bgColor: 'bg-green-50',
      textColor: 'text-green-600',
      borderColor: 'border-green-200'
    },
    {
      id: 'my_shifts',
      mobileTitle: 'המשמרות שלי',
      desktopTitle: 'המשמרות העתידיות שלי',
      count: myShiftsCount,
      icon: Calendar,
      gradient: 'from-blue-500 to-blue-600',
      bgColor: 'bg-blue-50',
      textColor: 'text-blue-600',
      borderColor: 'border-blue-200'
    }
  ];

  return (
    <div className="grid grid-cols-4 gap-2 mb-6">
      {kpis.map((kpi, index) => (
        <motion.div
          key={kpi.id}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.05 }}
          onClick={() => onKPIClick && onKPIClick(kpi.id)}
          className={`
            ${kpi.bgColor} border ${kpi.borderColor} 
            rounded-xl cursor-pointer hover:shadow-md transition-all
            flex flex-col items-center justify-center text-center
            p-2 md:p-4 md:flex-row md:gap-3 md:items-center md:text-right
            h-full
          `}
        >
          <div className={`p-1.5 md:p-3 rounded-lg md:rounded-xl bg-gradient-to-br ${kpi.gradient} text-white shadow-sm mb-1 md:mb-0`}>
            <kpi.icon className="w-4 h-4 md:w-6 md:h-6" />
          </div>

          <div className="flex flex-col items-center md:items-start">
            <span className={`text-xl md:text-3xl font-extrabold ${kpi.textColor} leading-none mb-1 md:mb-0`}>
              {kpi.count}
            </span>
            
            <p className="text-[10px] md:text-xs font-bold text-gray-700 leading-tight">
              <span className="md:hidden block px-1">{kpi.mobileTitle}</span>
              <span className="hidden md:block">{kpi.desktopTitle}</span>
            </p>
          </div>
        </motion.div>
      ))}
    </div>
  );
}