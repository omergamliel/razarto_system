import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Calendar, ArrowRight, Clock, AlertCircle, CalendarPlus, Send, MessageCircle } from 'lucide-react'; // אייקונים מעודכנים
import { Button } from "@/components/ui/button";
import { format } from 'date-fns';
import { he } from 'date-fns/locale';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';

export default function KPIListModal({ isOpen, onClose, type, shifts, currentUser, onOfferCover, onRequestSwap }) {
  
  const { data: allCoverages = [] } = useQuery({
    queryKey: ['all-shift-coverages-modal', type, currentUser?.email],
    queryFn: async () => {
      if (type === 'approved') {
          const approvedShifts = shifts.filter(s => s.status === 'approved');
          const coveragePromises = approvedShifts.map(shift => 
            base44.entities.ShiftCoverage.filter({ shift_id: shift.id })
          );
          const results = await Promise.all(coveragePromises);
          return results.flat();
      }
      if (type === 'my_shifts' && currentUser?.email) {
          return await base44.entities.ShiftCoverage.filter({ covering_email: currentUser.email });
      }
      return [];
    },
    enabled: isOpen && (type === 'approved' || type === 'my_shifts')
  });

  if (!isOpen) return null;

  // --- פונקציה להוספה ליומן גוגל ---
  const handleAddToCalendar = (shift) => {
    const baseDate = new Date(shift.date);
    let startTimeStr = shift.swap_start_time || '09:00';
    let endTimeStr = shift.swap_end_time || '09:00';

    const [startH, startM] = startTimeStr.split(':').map(Number);
    const [endH, endM] = endTimeStr.split(':').map(Number);

    const startDate = new Date(baseDate);
    startDate.setHours(startH, startM, 0);

    const endDate = new Date(baseDate);
    if (endH < startH || (endH === startH && startTimeStr === '09:00' && endTimeStr === '09:00')) {
        endDate.setDate(endDate.getDate() + 1);
    }
    endDate.setHours(endH, endM, 0);

    const formatGCalDate = (date) => {
       return date.getFullYear().toString() +
              (date.getMonth() + 1).toString().padStart(2, '0') +
              date.getDate().toString().padStart(2, '0') +
              'T' +
              date.getHours().toString().padStart(2, '0') +
              date.getMinutes().toString().padStart(2, '0') +
              '00';
    };

    const gStart = formatGCalDate(startDate);
    const gEnd = formatGCalDate(endDate);

    const title = encodeURIComponent(`משמרת - ${shift.role || 'תפקיד'}`);
    const details = encodeURIComponent(`משמרת בניהול המערכת. בהצלחה! 👮‍♂️`);
    const location = encodeURIComponent('בסיס');

    const gCalUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${gStart}/${gEnd}&details=${details}&location=${location}`;

    window.open(gCalUrl, '_blank');
  };

  // --- פונקציה לשליחה בווצאפ ---
  const handleWhatsAppShare = (shift) => {
    const shiftDate = format(new Date(shift.date), 'dd/MM', { locale: he });
    let shiftTimes = "09:00 - 09:00";
    if (shift.swap_start_time && shift.swap_end_time) {
        shiftTimes = `${shift.swap_start_time} - ${shift.swap_end_time}`;
    }
    const roleName = shift.role || 'תפקיד';
    const appLink = window.location.href; 
    const message = `היי, אני צריך/ה עזרה בהחלפה למשמרת *${roleName}* 👮‍♂️\nבתאריך: *${shiftDate}*\nבשעות: *${shiftTimes}* ⏰\n\nמי יכול לעזור? 🙏\nאפשר לאשר כאן: ${appLink}`;
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };

  const isFull24Hours = (s) => {
    if (s.swap_start_time && s.swap_end_time) {
        return s.swap_start_time.startsWith('09:00') && s.swap_end_time.startsWith('09:00');
    }
    return true; 
  };

  const getTitleAndColor = () => {
    switch (type) {
      case 'swap_requests': return { title: 'בקשות להחלפה', color: 'from-red-500 to-red-600' };
      case 'partial_gaps': return { title: 'משמרות בפער חלקי', color: 'from-yellow-500 to-yellow-600' };
      case 'approved': return { title: 'החלפות שבוצעו', color: 'from-green-500 to-green-600' };
      case 'my_shifts': return { title: 'המשמרות העתידיות שלי', color: 'from-blue-500 to-blue-600' };
      default: return { title: '', color: '' };
    }
  };

  const filterShifts = () => {
    switch (type) {
      case 'swap_requests':
        return shifts.filter(s => {
            const isSwapStatus = s.status === 'REQUIRES_FULL_COVERAGE' || s.status === 'REQUIRES_SWAP' || s.status === 'swap_requested';
            return isSwapStatus && isFull24Hours(s);
        });
      case 'partial_gaps':
        return shifts.filter(s => {
            const isOfficialPartial = s.status === 'REQUIRES_PARTIAL_COVERAGE' || s.status === 'partially_covered' || s.status === 'REQUIRES_PARTIAL';
            const isDegradedFullSwap = (s.status === 'REQUIRES_FULL_COVERAGE' || s.status === 'REQUIRES_SWAP' || s.status === 'swap_requested') && !isFull24Hours(s);
            return isOfficialPartial || isDegradedFullSwap;
        });
      case 'approved':
        return shifts.filter(s => s.status === 'approved' || s.status === 'SWAPPED' || s.status === 'COVERED').sort((a, b) => new Date(a.date) - new Date(b.date));
      case 'my_shifts':
        return shifts.filter(s => {
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          const shiftDate = new Date(s.date);
          shiftDate.setHours(0, 0, 0, 0);
          if (shiftDate < today) return false;
          const isMyRole = currentUser?.assigned_role && s.role && typeof s.role === 'string' && s.role.includes(currentUser.assigned_role);
          const isAssignedDirectly = s.assigned_user_id === currentUser?.id || s.email === currentUser?.email;
          const isCoveringPartially = allCoverages.some(c => c.shift_id === s.id);
          return isMyRole || isAssignedDirectly || isCoveringPartially;
        }).sort((a, b) => new Date(a.date) - new Date(b.date));
      default: return [];
    }
  };

  const { title, color } = getTitleAndColor();
  const filteredShifts = filterShifts();

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
        <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="relative bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
          
          <div className={`bg-gradient-to-r ${color} p-6 text-white`}>
            <button onClick={onClose} className="absolute top-4 left-4 p-2 rounded-full hover:bg-white/20 transition-colors"><X className="w-5 h-5" /></button>
            <h2 className="text-2xl font-bold">{title}</h2>
            <p className="text-white/90 text-sm mt-1">{filteredShifts.length} משמרות</p>
          </div>

          <div className="flex-1 p-6 max-h-[60vh] overflow-y-auto">
            {filteredShifts.length === 0 ? (
              <div className="text-center py-12 text-gray-500"><p>אין משמרות להצגה</p></div>
            ) : (
              <div className="space-y-3">
                {filteredShifts.map((shift) => {
                  const shiftCoverages = allCoverages.filter(c => c.shift_id === shift.id).sort((a, b) => new Date(`${a.start_date}T${a.start_time}:00`) - new Date(`${b.start_date}T${b.start_time}:00`));
                  const myPartialCoverages = type === 'my_shifts' ? shiftCoverages.filter(c => c.covering_email === currentUser?.email) : [];
                  const isMySwapRequest = shift.assigned_email === currentUser?.email && shift.status !== 'regular' && shift.status !== 'approved';

                  return (
                    <div key={shift.id} className="bg-gray-50 rounded-xl p-4 border border-gray-200 hover:shadow-md transition-all">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-3">
                            <Calendar className="w-4 h-4 text-gray-500" />
                            <span className="font-semibold text-gray-800">{format(new Date(shift.date), 'EEEE, d בMMMM', { locale: he })}</span>
                          </div>

                          {/* תוכן פרטי המשמרת - נשאר אותו דבר... */}
                          {myPartialCoverages.length > 0 && shift.assigned_email !== currentUser?.email ? (
                             <div className="bg-blue-50 border border-blue-100 rounded-lg p-3">
                                <div className="flex justify-between items-start mb-2"><p className="text-sm text-gray-600">משמרת ראשית של: <b>{shift.role}</b></p></div>
                                <div className="text-sm font-bold text-blue-700 flex flex-col gap-1">
                                   <div className="flex items-center gap-2"><Clock className="w-4 h-4" /><span>אתה מכסה את השעות:</span></div>
                                   <div className="pr-6">
                                       {myPartialCoverages.map(c => (
                                           <div key={c.id} className="bg-white/50 w-fit px-2 py-0.5 rounded text-xs mt-1">{format(new Date(c.start_date), 'd/M')} {c.start_time} - {format(new Date(c.end_date), 'd/M')} {c.end_time}</div>
                                       ))}
                                   </div>
                                </div>
                             </div>
                          ) : (
                              <>
                                {type === 'approved' ? (
                                    <div className="space-y-2">
                                    {shiftCoverages.map((coverage) => (
                                        <div key={coverage.id} className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg p-3 border border-green-200">
                                            <div className="text-sm font-bold text-green-700 text-center">{coverage.covering_role || 'תפקיד'}</div>
                                            <div className="text-xs text-center mt-1">{format(new Date(coverage.start_date), 'd/M')} {coverage.start_time} - {coverage.end_time}</div>
                                        </div>
                                    ))}
                                    </div>
                                ) : (
                                    <>
                                    <p className="text-sm text-[#E57373] font-medium">{shift.role}</p>
                                    {(type === 'swap_requests' || type === 'partial_gaps' || isMySwapRequest) && (
                                        <div className="mt-2 flex items-center gap-2 text-xs text-gray-600 bg-white/50 rounded-lg px-2 py-1">
                                        <Clock className="w-3 h-3" />
                                        {shift.swap_start_time && shift.swap_end_time ? (
                                            <span>{type === 'partial_gaps' ? 'נשאר' : 'פער'}: {shift.swap_start_time} - {shift.swap_end_time}</span>
                                        ) : (
                                            <span>09:00 - 09:00 (למחרת)</span>
                                        )}
                                        </div>
                                    )}
                                    </>
                                )}
                              </>
                          )}

                          {shift.remaining_hours && type !== 'approved' && (
                            <div className="flex items-center gap-2 text-xs text-orange-600 mt-2"><AlertCircle className="w-3 h-3" /><span>נותרו לכיסוי: {shift.remaining_hours}</span></div>
                          )}
                          
                          {/* --- אזור הכפתורים החדש והמסודר --- */}
                          <div className="mt-3 flex flex-wrap gap-2">
                              {/* 1. אני אחליף (עבור אחרים שרוצים לקחת משמרת) */}
                              {(type === 'swap_requests' || type === 'partial_gaps') && shift.assigned_email !== currentUser?.email && (
                                    <Button onClick={() => { onClose(); onOfferCover(shift); }} size="sm" className="bg-blue-500 text-white w-full hover:bg-blue-600 flex-1">
                                        אני אחליף <ArrowRight className="w-4 h-4 mr-1" />
                                    </Button>
                              )}
                              
                              {/* 2. מצב רגיל (משמרת שלי) -> כפתור בקש החלפה + כפתור יומן */}
                              {type === 'my_shifts' && shift.assigned_email === currentUser?.email && shift.status === 'regular' && onRequestSwap && (
                                <div className="flex w-full gap-2">
                                    <Button onClick={() => { onClose(); onRequestSwap(shift); }} size="sm" className="bg-red-100 text-red-600 hover:bg-red-200 border-none flex-[2]">
                                        בקש החלפה <ArrowRight className="w-4 h-4 mr-1" />
                                    </Button>
                                    {/* כפתור יומן אפור/כחול */}
                                    <Button onClick={() => handleAddToCalendar(shift)} size="sm" variant="outline" className="text-gray-600 border-gray-200 hover:bg-gray-50 flex-1" title="הוסף ליומן גוגל">
                                        <CalendarPlus className="w-4 h-4" />
                                    </Button>
                                </div>
                              )}

                              {/* 3. מצב החלפה פעילה (כבר ביקשתי) -> כפתור ווצאפ ירוק + כפתור יומן */}
                              {type === 'my_shifts' && isMySwapRequest && (
                                <div className="flex w-full gap-2">
                                    <Button onClick={() => handleWhatsAppShare(shift)} size="sm" className="bg-[#25D366] hover:bg-[#128C7E] text-white flex-[2] flex items-center justify-center gap-2">
                                        <MessageCircle className="w-4 h-4" />
                                        שלח לקבוצה
                                    </Button>
                                    {/* כפתור יומן אפור/כחול (שיהיה זמין תמיד) */}
                                    <Button onClick={() => handleAddToCalendar(shift)} size="sm" variant="outline" className="text-gray-600 border-gray-200 hover:bg-gray-50 flex-1" title="הוסף ליומן גוגל">
                                        <CalendarPlus className="w-4 h-4" />
                                    </Button>
                                </div>
                              )}

                              {/* 4. כיסוי חלקי שלי -> כפתור יומן רחב */}
                              {type === 'my_shifts' && myPartialCoverages.length > 0 && (
                                  <Button onClick={() => handleAddToCalendar(shift)} size="sm" variant="outline" className="text-blue-600 border-blue-200 hover:bg-blue-50 w-full" title="הוסף ליומן גוגל">
                                      <CalendarPlus className="w-4 h-4 mr-2" /> הוסף ליומן
                                  </Button>
                              )}
                          </div>

                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}