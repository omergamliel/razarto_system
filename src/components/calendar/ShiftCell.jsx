import React from 'react';
import { format, isToday, isSameMonth } from 'date-fns';
import { he } from 'date-fns/locale';
import { motion } from 'framer-motion';
import { Clock, CheckCircle2, AlertCircle } from 'lucide-react';

export default function ShiftCell({ 
  date, 
  shift, 
  onClick, 
  currentMonth,
  isWeekView = false,
  currentUserEmail,
  currentUserRole,
  isAdmin = false
}) {
  // Check if shift role matches user role (containment logic)
  const isMyShift = shift && currentUserRole && shift.role && 
    typeof shift.role === 'string' && shift.role.includes(currentUserRole);

  const handleClick = () => {
    // Always pass the click event - permission check is in parent
    onClick(date, shift);
    if (!shift) return;

    // Regular shift - only owner can click (must match role AND name exactly)
    if (shift.status === 'regular') {
      if (isMyShift) {
        onClick(date, shift);
      }
      return;
    }

    // Swap requested or partial - everyone can click
    if (shift.status === 'swap_requested' || shift.status === 'partially_covered') {
      onClick(date, shift);
      return;
    }

    // Approved - everyone can view
    if (shift.status === 'approved') {
      onClick(date, shift);
      return;
    }

    // Default - allow click
    onClick(date, shift);
  };
  const isCurrentMonth = isSameMonth(date, currentMonth);
  const today = isToday(date);
  
  const getStatusStyles = () => {
    if (!shift) return {};
    
    // Priority 1: Red for swap requests (even if it's my shift)
    if (shift.status === 'swap_requested') {
      return {
        bg: 'bg-gradient-to-br from-[#FFEBEE] to-[#FFCDD2]',
        border: 'border-[#E57373]',
        badge: 'bg-[#E57373]',
        icon: AlertCircle
      };
    }
    
    // Priority 2: Yellow for partial coverage
    if (shift.status === 'partially_covered') {
      return {
        bg: 'bg-gradient-to-br from-[#FFFDE7] to-[#FFF9C4]',
        border: 'border-[#FDD835]',
        badge: 'bg-[#FDD835]',
        icon: AlertCircle
      };
    }
    
    // Priority 3: Green for approved swaps
    if (shift.status === 'approved') {
      return {
        bg: 'bg-gradient-to-br from-[#E8F5E9] to-[#C8E6C9]',
        border: 'border-[#66BB6A]',
        badge: 'bg-[#66BB6A]',
        icon: CheckCircle2
      };
    }
    
    // Priority 4: Blue for my shifts (only if no special status)
    if (isMyShift) {
      return {
        bg: 'bg-gradient-to-br from-[#E3F2FD] to-[#BBDEFB]',
        border: 'border-[#64B5F6]',
        badge: 'bg-[#64B5F6]',
        icon: Clock
      };
    }
    
    // Priority 5: Gray for others
    return {
      bg: 'bg-white',
      border: 'border-gray-200',
      badge: 'bg-gray-400',
      icon: Clock
    };
  };

  const statusStyles = getStatusStyles();
  const StatusIcon = statusStyles.icon || Clock;
  
  // Extract clean role name (remove prefix like רז"ר, רע"ן)
  const getCleanRoleName = (role) => {
    if (!role || typeof role !== 'string') return '';
    // Remove common prefixes
    return role
      .replace(/^רז"ר\s+/, '')
      .replace(/^רע"ן\s+/, '')
      .replace(/^רז״ר\s+/, '')
      .replace(/^רע״ן\s+/, '')
      .trim();
  };

  return (
    <motion.div
      whileHover={{ scale: 1.02, y: -2 }}
      whileTap={{ scale: 0.98 }}
      onClick={handleClick}
      className={`
        relative cursor-pointer rounded-xl transition-all duration-200
        ${isWeekView ? 'min-h-[140px] p-3 md:p-4' : 'min-h-[70px] md:min-h-[110px] p-1.5 md:p-3'}
        ${statusStyles.bg}
        ${statusStyles.border ? `border-2 ${statusStyles.border}` : 'border border-gray-100'}
        ${!isCurrentMonth ? 'opacity-40' : ''}
        ${today ? 'ring-2 ring-[#64B5F6] ring-offset-2' : ''}
        hover:shadow-lg
        group
      `}
    >
      {/* Date Badge */}
      <div className={`
        absolute top-1 right-1 md:top-2 md:right-2 w-6 h-6 md:w-8 md:h-8 rounded-lg flex items-center justify-center
        ${today ? 'bg-[#64B5F6] text-white' : 'bg-gray-100 text-gray-600'}
        font-semibold text-xs md:text-sm
      `}>
        {format(date, 'd')}
      </div>

      {/* Day Name (Week View) */}
      {isWeekView && (
        <div className="text-center mb-2 pt-8">
          <span className="text-base font-semibold text-gray-600">
            {['א', 'ב', 'ג', 'ד', 'ה', 'ו', 'ש'][date.getDay()]}
          </span>
        </div>
      )}

      {/* Shift Content */}
      {shift && (
        <div className={`${isWeekView ? 'mt-4' : 'mt-6 md:mt-10'} space-y-0.5 md:space-y-1`}>
          {/* Role Name Only */}
          {shift.role && (
            <p className={`
              font-normal md:font-semibold text-gray-800 truncate text-center
              ${isWeekView ? 'text-base md:text-lg' : 'text-xs md:text-base'}
            `}>
              {getCleanRoleName(shift.role)}
            </p>
          )}
          
          {/* Covering Person (for confirmed swaps) */}
          {shift.status === 'swap_confirmed' && shift.covering_role && (
            <div className={`
              bg-white/80 rounded px-2 py-1 border border-[#64B5F6]
              ${isWeekView ? 'text-center' : ''}
            `}>
              <p className="text-[10px] md:text-xs text-[#64B5F6] font-semibold truncate">
                {shift.covering_role}
              </p>
              <p className="text-[9px] md:text-[10px] text-gray-600 truncate">
                {shift.confirmed_by}
              </p>
            </div>
          )}

          {/* Status Badge */}
          {shift.status !== 'regular' && (
            <div className={`
              mt-1 md:mt-2 flex items-center gap-1 
              ${isWeekView ? 'justify-center' : ''}
            `}>
              <StatusIcon className="w-3 h-3 text-gray-600" />
              <span className="text-[9px] md:text-xs text-gray-600 font-normal">
                {shift.status === 'swap_requested' && (
                  shift.swap_type === 'full' 
                    ? 'בקשה להחלפה למשמרת מלאה' 
                    : 'בקשה להחלפה לכיסוי חלקי'
                )}
                {shift.status === 'approved' && 'הוחלף'}
                {shift.status === 'partially_covered' && (shift.remaining_hours ? `נותר: ${shift.remaining_hours}` : 'פער חלקי')}
              </span>
            </div>
          )}

          {/* Full Swap Display with Date Range */}
          {shift.swap_type === 'full' && shift.status === 'swap_requested' && (
            <p className={`
              text-[10px] md:text-xs text-gray-500 mt-1
              ${isWeekView ? 'text-center' : ''}
            `}>
              24 שעות ({format(date, 'd/M')} - {format(new Date(date.getTime() + 86400000), 'd/M')})
            </p>
          )}

          {/* Partial Time Display */}
          {shift.swap_type === 'partial' && shift.swap_start_time && (
            <p className={`
              text-[10px] md:text-xs text-gray-500 mt-1
              ${isWeekView ? 'text-center' : ''}
            `}>
              {shift.swap_start_time} - {shift.swap_end_time}
            </p>
          )}

          {/* Gap Display for Partially Covered */}
          {shift.status === 'partially_covered' && shift.gap_hours && (
            <div className={`
              mt-1 bg-white/80 rounded px-2 py-1
              ${isWeekView ? 'text-center' : ''}
            `}>
              <p className="text-[10px] md:text-xs text-[#FFB74D] font-semibold">
                פער: {shift.gap_hours}
              </p>
              {shift.covered_start_time && (
                <p className="text-[9px] md:text-[10px] text-gray-500">
                  מכוסה: {shift.covered_start_time}-{shift.covered_end_time}
                </p>
              )}
            </div>
          )}
        </div>
      )}

      {/* Empty State - Admin Only */}
      {!shift && isCurrentMonth && isAdmin && (
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
          <span className="text-xs text-gray-400">לחץ להוספה</span>
        </div>
      )}
    </motion.div>
  );
}