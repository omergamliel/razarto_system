import { format } from 'date-fns';
import { he } from 'date-fns/locale';

/**
 * תבנית הודעת בקשת החלפה לווטסאפ
 */
export function buildSwapTemplate({
  employeeName,
  startDate,
  startTime,
  endDate,
  endTime,
  approvalUrl
}) {
  const startDateObj = startDate ? new Date(startDate) : null;
  const isValidDate = startDateObj && !isNaN(startDateObj);

  let dateLine = 'תאריך לא ידוע';
  
  if (isValidDate) {
    const dayText = format(startDateObj, 'EEEE', { locale: he });
    const dateText = format(startDateObj, 'dd/MM/yyyy', { locale: he });
    dateLine = `${dayText} ${dateText}`;
  }

  const timeRange = `${startTime || '09:00'} - ${endTime || '09:00'}`;

  return `🔁 *בקשת החלפה חדשה!*

📅 תאריך: ${dateLine}
⏰ שעות: ${timeRange}
👤 מבקש: ${employeeName || 'עובד'}

${employeeName || 'העובד'} מבקש/ת החלפה על המשמרת.
המעוניינים להחליף – נא ללחוץ על הקישור לאישור:

${approvalUrl || 'קישור לא זמין'}

תודה רבה! 🙏`;
}

/**
 * תבנית הודעת החלפה ראש בראש
 */
export function buildHeadToHeadTemplate({
  targetUserName,
  targetShiftOwner,
  targetShiftDate,
  myShiftOwner,
  myShiftDate,
  uniqueApprovalUrl
}) {
  return `🔄 *הצעת החלפה ראש בראש*

היי ${targetUserName || 'חבר/ה'},

אני מעוניין/ת להחליף איתך משמרות:

📌 *המשמרת שלך:*
👤 ${targetShiftOwner || 'לא ידוע'}
📅 ${targetShiftDate || 'תאריך לא ידוע'}

🔁 *המשמרת שלי שאני מציע/ה:*
👤 ${myShiftOwner || 'לא ידוע'}
📅 ${myShiftDate || 'תאריך לא ידוע'}

${uniqueApprovalUrl ? `לחץ/י כאן לאישור ההחלפה במערכת:\n${uniqueApprovalUrl}` : 'יש ליצור קשר ישיר לאישור'}

תודה! 🙏`;
}