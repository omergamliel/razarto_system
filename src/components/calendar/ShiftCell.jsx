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
    // UPDATED: Added new statuses here
    if (shift.status === 'swap_requested' || 
        shift.status === 'partially_covered' || 
        shift.status === 'REQUIRES_FULL_COVERAGE' || 
        shift.status === 'REQUIRES_PARTIAL_COVERAGE') {
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
    
    // Priority 1: Red for FULL coverage requests
    // UPDATED: Check specifically for REQUIRES_FULL_COVERAGE
    if (shift.status === 'REQUIRES_FULL_COVERAGE' || shift.status === 'swap_requested') {
      return {
        bg: 'bg-gradient-to-br from-[#FFEBEE] to-[#FFCDD2]',
        border: 'border-[#E57373]',
        badge: 'bg-[#E57373]',
        icon: AlertCircle
      };
    }
    
    // Priority 2: Yellow for PARTIAL coverage requests
    // UPDATED: Check specifically for REQUIRES_PARTIAL_COVERAGE
    if (shift.status === 'REQUIRES_PARTIAL_COVERAGE' || shift.status === 'partially_covered') {
      return {
        bg: 'bg-gradient-to-br from-[#FFFDE7] to-[#FFF9C4]',
        border: 'border-[#FDD835]',
        badge: 'bg-[#FDD835]',
        icon: AlertCircle
      };
    }
    
    // Priority 3: Green for approved swaps (fully covered only)
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
    return role
      .replace(/^רז"ר\s+/, '')
      .replace(/^רע"ן\s+/, '')
      .replace(/^רז״ר\s+/, '')
      .replace(/^רע״ן\s+/, '')
      .trim();
  };

  // Helper to check if any swap logic applies
  const isSwapRelated = ['swap_requested', 'partially_covered', 'REQUIRES_FULL_COVERAGE', 'REQUIRES_PARTIAL_COVERAGE'].includes(shift?.status);

  return (
    <motion.div
      whileHover={{ scale: 1.02, y: -2 }}
      whileTap={{ scale: 0.98 }}
      onClick={handleClick}
      className={`
        relative cursor-pointer rounded-lg md:rounded-xl transition-all duration-200
        min-h-[85px] md:min-h-[110px] p-1 md:p-3
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

      {/* Shift Content */}
      {shift && (
        <div className="mt-6 md:mt-10 space-y-0.5 md:space-y-1">
          {/* Original Requester Name for swap requests and partial coverage */}
          {isSwapRelated && shift.role && (
            <p className="font-normal md:font-semibold text-gray-800 text-center text-[10px] leading-tight md:text-base break-words px-0.5">
              {getCleanRoleName(shift.role)}
            </p>
          )}

          {/* Approved Swap - Show covering role */}
          {shift.status === 'approved' && shift.role && (
            <p className="font-normal md:font-semibold text-gray-800 text-center text-[10px] leading-tight md:text-base break-words px-0.5">
              {getCleanRoleName(shift.role)}
            </p>
          )}

          {/* Regular shift - show role */}
          {shift.status === 'regular' && shift.role && (
            <p className="font-normal md:font-semibold text-gray-800 text-center text-[10px] leading-tight md:text-base break-words px-0.5">
              {getCleanRoleName(shift.role)}
            </p>
          )}

          {/* Partial Coverage Indicator (Visual for who is covering) */}
          {(shift.status === 'REQUIRES_PARTIAL_COVERAGE' || shift.status === 'partially_covered') && shift.covering_role && (
            <div className="mt-0.5 bg-blue-50/90 rounded px-1 py-0.5 border border-blue-300">
              <p className="text-[8px] md:text-[10px] text-blue-700 font-medium text-center leading-tight break-words">
                כיסוי חלקי: {shift.covering_role.split(',')[0]}
                {shift.covering_role.split(',').length > 1 && ` +${shift.covering_role.split(',').length - 1}`}
              </p>
            </div>
          )}

          {/* Status Badge */}
          {shift.status !== 'regular' && (
            <div className="mt-0.5 md:mt-2 flex items-center gap-0.5 justify-center">
              <StatusIcon className="w-2.5 h-2.5 md:w-3 md:h-3 text-gray-600 flex-shrink-0" />
              <span className="text-[8px] md:text-xs text-gray-600 font-normal leading-tight">
                
                {/* Logic for FULL Coverage Text */}
                {(shift.status === 'REQUIRES_FULL_COVERAGE' || shift.status === 'swap_requested') && 'דרוש כיסוי מלא'}
                
                {/* Logic for PARTIAL Coverage Text */}
                {(shift.status === 'REQUIRES_PARTIAL_COVERAGE' || shift.status === 'partially_covered') && 'דרוש כיסוי חלקי'}
                
                {shift.status === 'approved' && 'הוחלף'}
              </span>
            </div>
          )}

          {/* Time Range Display */}
          {isSwapRelated && shift.swap_start_time && shift.swap_end_time && (
            <p className="text-[8px] md:text-xs text-gray-500 mt-0.5 text-center leading-tight">
              {shift.swap_start_time} - {shift.swap_end_time}
            </p>
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