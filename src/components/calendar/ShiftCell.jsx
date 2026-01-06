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

    if (status === 'requested' || status === 'Swap_Requested') {
      return {
        bg: 'bg-red-50',
        border: 'border-red-300',
        badge: 'bg-red-500',
        icon: ArrowLeftRight
      };
    }

    if (status === 'partial' || (status === 'requested' && coverageType === 'partial')) {
      return {
        bg: 'bg-yellow-50',
        border: 'border-yellow-300',
        badge: 'bg-yellow-500',
        icon: AlertCircle
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

  const assignments = React.useMemo(() => {
    if (!shift) return [];

    const buildSafeDateTime = (dateStr, timeStr) => {
      if (!dateStr || !timeStr) return null;
      const dt = new Date(`${dateStr}T${timeStr}`);
      return isNaN(dt.getTime()) ? null : dt;
    };

    const requestStartStr = shift.active_request?.req_start_time || shift.swap_start_time || shift.start_time || '09:00';
    const requestEndStr = shift.active_request?.req_end_time || shift.swap_end_time || shift.end_time || '09:00';
    const requestStartDate = shift.active_request?.req_start_date || shift.start_date;
    const requestEndDate = shift.active_request?.req_end_date || shift.end_date || requestStartDate;

    const baseStart = buildSafeDateTime(requestStartDate, requestStartStr);
    if (!baseStart) return [];
    let baseEnd = buildSafeDateTime(requestEndDate, requestEndStr) || baseStart;
    if (baseEnd <= baseStart) baseEnd = addDays(baseEnd, 1);

    const coverageSegments = (shift.coverages || [])
      .filter(cov => cov.status !== 'Cancelled')
      .map((cov, idx) => {
        const covStart = buildSafeDateTime(cov.cover_start_date || requestStartDate, cov.cover_start_time || requestStartStr);
        let covEnd = buildSafeDateTime(cov.cover_end_date || requestEndDate, cov.cover_end_time || requestEndStr);
        if (!covStart || !covEnd) return null;
        if (covEnd <= covStart) covEnd = addDays(covEnd, 1);
        return {
          key: `${cov.id || idx}-${cov.cover_start_time || ''}`,
          name: cov.covering_name || 'מחליף',
          start: covStart,
          end: covEnd,
        };
      })
      .filter(Boolean);

    const mergedCoverages = coverageSegments
      .map(seg => ({ start: seg.start, end: seg.end }))
      .sort((a, b) => a.start - b.start)
      .reduce((acc, seg) => {
        if (!acc.length) return [seg];
        const last = acc[acc.length - 1];
        if (seg.start <= last.end) {
          last.end = new Date(Math.max(last.end, seg.end));
          return acc;
        }
        return [...acc, seg];
      }, []);

    let ownerSlots = [{ start: baseStart, end: baseEnd }];

    mergedCoverages.forEach(cov => {
      ownerSlots = ownerSlots.flatMap(slot => {
        if (cov.end <= slot.start || cov.start >= slot.end) return [slot];
        const pieces = [];
        if (cov.start > slot.start) pieces.push({ start: slot.start, end: cov.start });
        if (cov.end < slot.end) pieces.push({ start: cov.end, end: slot.end });
        return pieces;
      });
    });

    ownerSlots = ownerSlots.filter(seg => seg.end > seg.start);

    const formatRange = (start, end) => {
      if (!start || !end || isNaN(start.getTime()) || isNaN(end.getTime())) return null;
      const startText = format(start, 'HH:mm');
      const endText = format(end, 'HH:mm');
      return `${startText} - ${endText}`;
    };

    const hasMultipleCoverages = coverageSegments.length > 1;
    const hasOwnerCoverage = ownerSlots.length > 0;
    const showTimeForPartial = coverageSegments.length > 0 && (
      hasOwnerCoverage ||
      hasMultipleCoverages ||
      shift.coverageType === 'partial' ||
      shift.status === 'partial'
    );

    const coverageAssignments = coverageSegments.map(seg => ({
      key: seg.key,
      name: seg.name,
      timeRange: showTimeForPartial ? formatRange(seg.start, seg.end) : null,
    }));

    const ownerName = shift.user_name || 'לא ידוע';
    const ownerAssignments = ownerSlots.map((seg, idx) => ({
      key: `owner-${shift.id}-${idx}`,
      name: ownerName,
      timeRange: showTimeForPartial ? formatRange(seg.start, seg.end) : null,
      isOwner: true,
    }));

    const uniqueAssignments = [];

    if (shift.status === 'covered' && shift.coverageType !== 'partial' && coverageSegments.length && !hasOwnerCoverage) {
      uniqueAssignments.push(...coverageAssignments);
    } else {
      uniqueAssignments.push(...ownerAssignments, ...coverageAssignments);
    }

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