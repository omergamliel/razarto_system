import React from 'react';
import { format, isToday, isSameMonth, addDays } from 'date-fns';
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

    const requestStartStr = shift.active_request?.req_start_time || shift.swap_start_time || shift.start_time || '09:00';
    const requestEndStr = shift.active_request?.req_end_time || shift.swap_end_time || shift.end_time || '09:00';
    const requestStartDate = shift.active_request?.req_start_date || shift.start_date;
    const requestEndDate = shift.active_request?.req_end_date || shift.end_date || requestStartDate;

    const baseStart = new Date(`${requestStartDate}T${requestStartStr}`);
    let baseEnd = new Date(`${requestEndDate}T${requestEndStr}`);
    if (baseEnd <= baseStart) baseEnd = addDays(baseEnd, 1);

    const formatRange = (start, end) => {
      const startText = format(start, 'HH:mm');
      const endText = format(end, 'HH:mm');
      return `${startText} - ${endText}`;
    };

    const coverageSegments = (shift.coverages || []).map((cov, idx) => {
      const covStart = new Date(`${cov.cover_start_date || requestStartDate}T${cov.cover_start_time || requestStartStr}`);
      let covEnd = new Date(`${cov.cover_end_date || requestEndDate}T${cov.cover_end_time || requestEndStr}`);
      if (covEnd <= covStart) covEnd = addDays(covEnd, 1);
      return {
        key: `${cov.id || idx}-${cov.cover_start_time || ''}`,
        name: cov.covering_name || 'מחליף',
        start: covStart,
        end: covEnd,
        timeRange: formatRange(covStart, covEnd),
      };
    });

    let missing = [{ start: baseStart, end: baseEnd }];
    coverageSegments.sort((a, b) => a.start - b.start).forEach(cov => {
      missing = missing.flatMap(seg => {
        if (cov.end <= seg.start || cov.start >= seg.end) return [seg];
        const gaps = [];
        if (cov.start > seg.start) gaps.push({ start: seg.start, end: cov.start });
        if (cov.end < seg.end) gaps.push({ start: cov.end, end: seg.end });
        return gaps;
      });
    });

    const uniqueAssignments = [
      {
        key: shift.id,
        name: shift.user_name || 'לא ידוע',
        timeRange: formatRange(baseStart, baseEnd),
        isOwner: true,
      },
      ...coverageSegments,
      ...missing
        .filter(seg => seg.end > seg.start)
        .map((seg, idx) => ({
          key: `gap-${idx}`,
          name: 'שעות חסרות',
          timeRange: formatRange(seg.start, seg.end),
          isGap: true,
        })),
    ];

    return uniqueAssignments;
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
                <p className={`font-normal md:font-semibold text-[10px] leading-tight md:text-base break-words px-0.5 ${item.isGap ? 'text-red-700' : 'text-gray-800'}`}>
                  {item.name}
                </p>
                {item.timeRange && (
                  <p className={`text-[8px] md:text-xs mt-0.5 text-center leading-tight ${item.isGap ? 'text-red-600 font-semibold' : 'text-gray-500'}`} dir="ltr">
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