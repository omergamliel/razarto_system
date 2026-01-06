import { format } from 'date-fns';
import { he } from 'date-fns/locale';

// --- Shared swap helpers (centralized to avoid duplication across modals) ---
export const resolveSwapType = (shift, activeRequest) => {
  const explicit = activeRequest?.request_type || shift?.request_type || shift?.coverageType || shift?.swap_type;
  if (explicit && String(explicit).toLowerCase() === 'partial') return 'partial';
  if (explicit && String(explicit).toLowerCase() === 'full') return 'full';

  const start = activeRequest?.req_start_time || shift?.req_start_time || shift?.start_time;
  const end = activeRequest?.req_end_time || shift?.req_end_time || shift?.end_time;
  if (start && end && start !== end) return 'partial';
  return 'full';
};

export const resolveRequestWindow = (shift, activeRequest) => {
  const startDate = activeRequest?.req_start_date || shift?.req_start_date || shift?.start_date || shift?.date;
  const endDate = activeRequest?.req_end_date || shift?.req_end_date || shift?.end_date || startDate;
  const startTime = activeRequest?.req_start_time || shift?.req_start_time || shift?.start_time || '09:00';
  const endTime = activeRequest?.req_end_time || shift?.req_end_time || shift?.end_time || startTime;
  return { startDate, endDate, startTime, endTime };
};

export const buildDateTime = (dateStr, timeStr) => {
  if (!dateStr || !timeStr) return null;
  const dt = new Date(`${dateStr}T${timeStr}`);
  return isNaN(dt.getTime()) ? null : dt;
};

export const calculateMissingSegments = (baseStart, baseEnd, coverageEntries = []) => {
  if (!baseStart || !baseEnd || isNaN(baseStart.getTime()) || isNaN(baseEnd.getTime())) return [];

  const orderedCoverages = [...coverageEntries]
    .map((cov) => ({
      ...cov,
      start: buildDateTime(cov.cover_start_date, cov.cover_start_time),
      end: buildDateTime(cov.cover_end_date, cov.cover_end_time),
    }))
    .filter((cov) => cov.start && cov.end && cov.start < cov.end)
    .sort((a, b) => a.start - b.start);

  let gaps = [{ start: baseStart, end: baseEnd }];

  orderedCoverages.forEach((cov) => {
    gaps = gaps.flatMap((seg) => {
      if (cov.end <= seg.start || cov.start >= seg.end) return [seg];
      const pieces = [];
      if (cov.start > seg.start) pieces.push({ start: seg.start, end: cov.start });
      if (cov.end < seg.end) pieces.push({ start: cov.end, end: seg.end });
      return pieces;
    });
  });

  return gaps.filter((gap) => gap.end > gap.start && !isNaN(gap.start.getTime()) && !isNaN(gap.end.getTime()));
};

// Centralized deep link builder so all WhatsApp templates open the same in-app flow
export const buildShiftDeepLink = (shiftId, origin) => {
  if (!shiftId) return '';
  const base = origin || (typeof window !== 'undefined' ? window.location.origin : '');
  return `${base}?openShiftId=${shiftId}`;
};

export const buildSwapTemplate = ({ employeeName, startDate, startTime, endDate, endTime, approvalUrl, shiftId, origin }) => {
  const safeStart = startDate ? format(new Date(startDate), 'dd/MM/yyyy', { locale: he }) : '';
  const safeEnd = endDate ? format(new Date(endDate), 'dd/MM/yyyy', { locale: he }) : safeStart;
  const resolvedLink = approvalUrl || buildShiftDeepLink(shiftId, origin);

  return `היי, פתחתי בקשה ב-Razarto להחלפה למשמרת *${employeeName || ''}* 👮‍♂️\nמתאריך ${safeStart} בשעה ${startTime || ''} ועד תאריך ${safeEnd} בשעה ${endTime || ''} ⏰\n\nמי יכול לעזור? 🙏\nאפשר לאשר כאן:\n${resolvedLink || ''}`;
};

export const buildHeadToHeadTemplate = ({ targetUserName, targetShiftOwner, targetShiftDate, myShiftOwner, myShiftDate, uniqueApprovalUrl }) => {
  return `היי *${targetUserName || ''}*! 👋🏼\nאני מעוניין להחליף איתך משמרת רז״רתו ראש בראש:\n\n🫡 הצעת החלפה:\n🫵🏼 המשמרת שלך: *${targetShiftOwner || ''}* ${targetShiftDate || ''}\n🤞🏼 המשמרת שלי: *${myShiftOwner || ''}* ${myShiftDate || ''}\n\n✅ לחץ כאן לאישור ההחלפה בתוך המערכת:\n${uniqueApprovalUrl || ''}`;
};