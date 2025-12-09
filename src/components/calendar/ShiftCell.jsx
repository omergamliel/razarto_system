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
  isWeekView = false
}) {
  const isCurrentMonth = isSameMonth(date, currentMonth);
  const today = isToday(date);
  
  const getStatusStyles = () => {
    if (!shift) return {};
    
    switch (shift.status) {
      case 'swap_requested':
        return {
          bg: 'bg-gradient-to-br from-[#FFEBEE] to-[#FFCDD2]',
          border: 'border-[#E57373]',
          badge: 'bg-[#E57373]',
          icon: AlertCircle
        };
      case 'swap_confirmed':
        return {
          bg: 'bg-gradient-to-br from-[#E3F2FD] to-[#BBDEFB]',
          border: 'border-[#64B5F6]',
          badge: 'bg-[#64B5F6]',
          icon: CheckCircle2
        };
      case 'partially_covered':
        return {
          bg: 'bg-gradient-to-br from-[#FFF3E0] to-[#FFE0B2]',
          border: 'border-[#FFB74D]',
          badge: 'bg-[#FFB74D]',
          icon: AlertCircle
        };
      default:
        return {
          bg: 'bg-white',
          border: 'border-gray-200',
          badge: 'bg-gray-400',
          icon: Clock
        };
    }
  };

  const statusStyles = getStatusStyles();
  const StatusIcon = statusStyles.icon || Clock;

  return (
    <motion.div
      whileHover={{ scale: 1.02, y: -2 }}
      whileTap={{ scale: 0.98 }}
      onClick={() => onClick(date, shift)}
      className={`
        relative cursor-pointer rounded-xl transition-all duration-200
        ${isWeekView ? 'min-h-[140px] p-4' : 'min-h-[90px] md:min-h-[110px] p-2 md:p-3'}
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
        absolute top-2 right-2 w-7 h-7 md:w-8 md:h-8 rounded-lg flex items-center justify-center
        ${today ? 'bg-[#64B5F6] text-white' : 'bg-gray-100 text-gray-600'}
        font-semibold text-sm
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
        <div className={`${isWeekView ? 'mt-4' : 'mt-8 md:mt-10'}`}>
          {/* Role Name */}
          {shift.role && (
            <p className={`
              font-semibold text-[#E57373] truncate mb-1
              ${isWeekView ? 'text-sm text-center' : 'text-[10px] md:text-xs'}
            `}>
              {shift.role}
            </p>
          )}
          {/* Person Name */}
          <p className={`
            font-medium text-gray-800 truncate
            ${isWeekView ? 'text-base text-center' : 'text-xs md:text-sm'}
          `}>
            {shift.assigned_person}
          </p>

          {/* Status Badge */}
          {shift.status !== 'regular' && (
            <div className={`
              mt-1 md:mt-2 flex items-center gap-1 
              ${isWeekView ? 'justify-center' : ''}
            `}>
              <StatusIcon className="w-3 h-3 text-gray-600" />
              <span className="text-[10px] md:text-xs text-gray-600">
                {shift.status === 'swap_requested' && 'בקשה להחלפה'}
                {shift.status === 'swap_confirmed' && 'אושר'}
                {shift.status === 'partially_covered' && '⚠️ פער'}
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

      {/* Empty State */}
      {!shift && isCurrentMonth && (
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
          <span className="text-xs text-gray-400">לחץ להוספה</span>
        </div>
      )}
    </motion.div>
  );
}