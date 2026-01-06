import { format } from 'date-fns';
import { he } from 'date-fns/locale';

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