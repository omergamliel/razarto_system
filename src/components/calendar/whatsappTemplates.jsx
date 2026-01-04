import { format } from 'date-fns';
import { he } from 'date-fns/locale';

export const buildSwapTemplate = ({ employeeName, startDate, startTime, endDate, endTime, approvalUrl }) => {
  const safeStart = startDate ? format(new Date(startDate), 'dd/MM/yyyy', { locale: he }) : '';
  const safeEnd = endDate ? format(new Date(endDate), 'dd/MM/yyyy', { locale: he }) : safeStart;

  return `היי, פתחתי בקשה ב-Razarto להחלפה למשמרת *${employeeName || ''}* 👮‍♂️\nמתאריך ${safeStart} בשעה ${startTime || ''} ועד תאריך ${safeEnd} בשעה ${endTime || ''} ⏰\n\nמי יכול לעזור? 🙏\nאפשר לאשר כאן:\n${approvalUrl || ''}`;
};

export const buildHeadToHeadTemplate = ({ targetUserName, targetShiftOwner, targetShiftDate, myShiftOwner, myShiftDate, uniqueApprovalUrl }) => {
  return `היי *${targetUserName || ''}*! 👋🏼\nאני מעוניין להחליף איתך משמרת רז״רתו ראש בראש:\n\n🫡 הצעת החלפה:\n🫵🏼 המשמרת שלך: *${targetShiftOwner || ''}* ${targetShiftDate || ''}\n🤞🏼 המשמרת שלי: *${myShiftOwner || ''}* ${myShiftDate || ''}\n\n✅ לחץ כאן לאישור ההחלפה בתוך המערכת:\n${uniqueApprovalUrl || ''}`;
};