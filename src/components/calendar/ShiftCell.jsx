import React from 'react';
import { format, isToday, isSameMonth } from 'date-fns';
import { motion } from 'framer-motion';
import { Clock, CheckCircle2, AlertCircle, ArrowLeftRight } from 'lucide-react';

export default function ShiftCell({
  date,
  shift,
  onClick,
  currentMonth,
  isWeekView = false,
  currentUserEmail,
  isAdmin = false
}) {

  const handleClick = () => {
    onClick(date, shift);
  };

  const isCurrentMonth = isSameMonth(date, currentMonth);
  const today = isToday(date);

  const getStatusStyles = () => {
    if (!shift) return {};

    const status = shift.status || 'regular';
    const coverageType = shift.coverageType || shift.swap_type;

    if (status === 'partial' || (status === 'requested' && coverageType === 'partial')) {
      return {
        bg: 'bg-yellow-50',
        border: 'border-yellow-300',
        badge: 'bg-yellow-500',
        icon: AlertCircle
      };
    }

    if (status === 'requested') {
      return {
        bg: 'bg-red-50',
        border: 'border-red-300',
        badge: 'bg-red-500',
        icon: ArrowLeftRight
      };
    }

    if (status === 'covered') {
      return {
        bg: 'bg-green-50',
        border: 'border-green-300',
        badge: 'bg-green-500',
        icon: CheckCircle2
      };
    }

    return {
      bg: 'bg-white',
      border: 'border-gray-200',
      badge: 'bg-gray-400',
      icon: Clock
    };
  };

  const styles = getStatusStyles();

  const assignments = React.useMemo(() => {
    if (!shift) return [];

    if (shift.coverages && shift.coverages.length > 0) {
      return shift.coverages.map((cov, idx) => ({
        key: `${cov.id || cov.cover_start_time}-${idx}`,
        name: cov.covering_name || 'מחליף',
        timeRange: cov.cover_start_time && cov.cover_end_time
          ? `${cov.cover_start_time} - ${cov.cover_end_time}`
          : ''
      }));
    }

    return [{
      key: shift.id,
      name: shift.user_name || 'לא ידוע',
      timeRange: (shift.start_time !== '09:00' || shift.end_time !== '09:00')
        ? `${shift.start_time} - ${shift.end_time}`
        : ''
    }];
  }, [shift]);

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
        <div className="mt-6 md:mt-10 space-y-1 md:space-y-1.5">
          {/* Assignees / Covering Users */}
          <div className="space-y-0.5">
            {assignments.map(item => (
              <div key={item.key} className="text-center">
                <p className="font-normal md:font-semibold text-gray-800 text-[10px] leading-tight md:text-base break-words px-0.5">
                  {item.name}
                </p>
                {item.timeRange && (
                  <p className="text-[8px] md:text-xs text-gray-500 mt-0.5 text-center leading-tight">
                    {item.timeRange}
                  </p>
                )}
              </div>
            ))}
          </div>
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