import React from 'react';
import { format, isToday, isSameMonth } from 'date-fns';
import { he } from 'date-fns/locale';
import { motion } from 'framer-motion';
import { Clock, CheckCircle2, AlertCircle } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';

export default function ShiftCell({ 
  date, 
  shift, 
  onClick, 
  currentMonth,
  isWeekView = false,
  currentUserEmail,
  isAdmin = false
}) {

  // --- Fetch Request Info if Exists ---
  const { data: activeRequest } = useQuery({
    queryKey: ['shift-active-request', shift?.id],
    queryFn: async () => {
       if (!shift?.id) return null;
       // Find open requests for this shift
       const reqs = await base44.entities.SwapRequest.filter({ shift_id: shift.id, status: 'Open' });
       return reqs.length > 0 ? reqs[0] : null;
    },
    enabled: !!shift?.id && shift?.status === 'Swap_Requested'
  });

  // --- Logic Checks ---
  const isMyShift = shift && currentUserEmail && shift.user_name === currentUserEmail; // Assuming user_name might be email in some contexts, or need to pass user ID. 
  // Better logic: we need to check if the current user ID matches original_user_id
  // But here we only have email. Let's rely on visual status for now.

  const status = shift?.status || 'Active';
  const isSwapRequested = status === 'Swap_Requested';
  const isCovered = status === 'Covered';
  
  // Specific Swap Types (from request table)
  const isPartial = activeRequest?.request_type === 'Partial';
  const isFullSwap = activeRequest?.request_type === 'Full';

  const handleClick = () => {
    onClick(date, shift);
  };

  const isCurrentMonth = isSameMonth(date, currentMonth);
  const today = isToday(date);
  
  const getStatusStyles = () => {
    if (!shift) return {};
    
    // Priority 1: Partial Coverage
    if (isPartial) {
      return {
        bg: 'bg-gradient-to-br from-[#FFFDE7] to-[#FFF9C4]',
        border: 'border-[#FDD835]',
        badge: 'bg-[#FDD835]',
        icon: AlertCircle,
        label: 'כיסוי חלקי'
      };
    }

    // Priority 2: Full Swap Request
    if (isFullSwap) {
      return {
        bg: 'bg-gradient-to-br from-[#FFEBEE] to-[#FFCDD2]',
        border: 'border-[#E57373]',
        badge: 'bg-[#E57373]',
        icon: AlertCircle,
        label: 'דרוש החלפה'
      };
    }
    
    // Priority 3: Covered/Approved
    if (isCovered) {
      return {
        bg: 'bg-gradient-to-br from-[#E8F5E9] to-[#C8E6C9]',
        border: 'border-[#66BB6A]',
        badge: 'bg-[#66BB6A]',
        icon: CheckCircle2,
        label: 'טופל'
      };
    }
    
    // Priority 4: Regular (My Shift vs Others)
    // Note: To perfectly detect "My Shift" we need user ID context. Assuming standard for now.
    return {
      bg: 'bg-white',
      border: 'border-gray-200',
      badge: 'bg-gray-400',
      icon: Clock,
      label: ''
    };
  };

  const styles = getStatusStyles();
  const StatusIcon = styles.icon || Clock;
  
  return (
    <motion.div
      whileHover={{ scale: 1.02, y: -2 }}
      whileTap={{ scale: 0.98 }}
      onClick={handleClick}
      className={`
        relative cursor-pointer rounded-lg md:rounded-xl transition-all duration-200
        min-h-[85px] md:min-h-[110px] p-1 md:p-3
        ${styles.bg}
        ${styles.border ? `border-2 ${styles.border}` : 'border border-gray-100'}
        ${!isCurrentMonth ? 'opacity-40' : ''}
        ${today ? 'ring-2 ring-[#64B5F6] ring-offset-2' : ''}
        hover:shadow-lg
        group
      `}
    >
      <div className={`
        absolute top-1 right-1 md:top-2 md:right-2 w-6 h-6 md:w-8 md:h-8 rounded-lg flex items-center justify-center
        ${today ? 'bg-[#64B5F6] text-white' : 'bg-gray-100 text-gray-600'}
        font-semibold text-xs md:text-sm
      `}>
        {format(date, 'd')}
      </div>

      {shift && (
        <div className="mt-6 md:mt-10 space-y-0.5 md:space-y-1">
          {/* User Name / Role */}
          <p className="font-normal md:font-semibold text-gray-800 text-center text-[10px] leading-tight md:text-base break-words px-0.5">
            {shift.user_name || 'לא ידוע'}
          </p>

          {/* Status Badge */}
          {styles.label && (
            <div className="mt-0.5 md:mt-2 flex items-center gap-0.5 justify-center">
              <StatusIcon className="w-2.5 h-2.5 md:w-3 md:h-3 text-gray-600 flex-shrink-0" />
              <span className="text-[8px] md:text-xs text-gray-600 font-normal leading-tight">
                {styles.label}
              </span>
            </div>
          )}

          {/* Time Range (if custom) */}
          {(shift.start_time !== '09:00' || shift.end_time !== '09:00') && (
            <p className="text-[8px] md:text-xs text-gray-500 mt-0.5 text-center leading-tight">
              {shift.start_time} - {shift.end_time}
            </p>
          )}
        </div>
      )}

      {!shift && isCurrentMonth && isAdmin && (
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
          <span className="text-xs text-gray-400">לחץ להוספה</span>
        </div>
      )}
    </motion.div>
  );
}