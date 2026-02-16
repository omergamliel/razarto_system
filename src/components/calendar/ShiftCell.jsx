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

    if (status === 'requested' || status === 'Swap_Requested') {
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

    if (shift.isMine) {
      return {
        bg: 'bg-blue-50',
        border: 'border-blue-300',
        badge: 'bg-blue-500',
        icon: Clock
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

  const displayName = React.useMemo(() => {
    if (!shift) return '';
    return shift.user_name || shift.role || 'לא ידוע';
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
        <div className="mt-6 md:mt-10">
          <p className="text-center font-normal md:font-semibold text-[10px] md:text-base leading-tight text-gray-800 break-words px-0.5">
            {displayName}
          </p>
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