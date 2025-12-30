import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Calendar, ArrowLeft, Clock, AlertCircle, CalendarPlus, MessageCircle } from 'lucide-react';
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
                  const amICoveringOnly = myPartialCoverages.length > 0 && shift.assigned_email !== currentUser?.email;
                  const isMySwapRequest = shift.assigned_email === currentUser?.email && shift.status !== 'regular' && shift.status !== 'approved';

                  const handleWhatsAppClick = () => {
                      if (isMySwapRequest) {
                          handleWhatsAppShare(shift);
                      } else {
                          onClose();
                          if (onRequestSwap) onRequestSwap(shift);
                      }
                  };

                  return (
                    <div key={shift.id} className="bg-gray-50 rounded-xl p-4 border border-gray-200 hover:shadow-md transition-all">
                      
                      <div className="flex items-center justify-between gap-3">
                        
                        {/* צד ימין - פרטי המשמרת */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <Calendar className="w-4 h-4 text-gray-500" />
                            <span className="font-semibold text-gray-800">{format(new Date(shift.date), 'EEEE, d בMMMM', { locale: he })}</span>
                          </div>

                          {/* --- החלק ששונה: תצוגת ההחלפות המאושרות עם תיקון סדר אנשים --- */}
                          {type === 'approved' ? (
                             <div className="space-y-2 mt-2">
                                {shiftCoverages.map((coverage) => (
                                    <div key={coverage.id} className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg p-3 border border-green-200">
                                        
                                        {/* שורת האנשים - הוחלף הסדר כדי שב-RTL המחליף יהיה בימין */}
                                        <div className="flex items-center justify-center gap-3 text-sm">
                                            
                                            {/* 1. המחליף (הירוק) - ראשון בקוד => יופיע בצד ימין */}
                                            <div className="text-center flex-1">
                                                <div className="text-sm font-bold text-green-700">
                                                    {coverage.covering_role?.replace(/^רז"ר\s+/, '').replace(/^רע"ן\s+/, '').trim() || 'תפקיד'}
                                                </div>
                                            </div>

                                            {/* חץ */}
                                            <ArrowLeft className="w-4 h-4 text-green-600 flex-shrink-0" />
                                            
                                            {/* 2. המקורי (האפור) - שני בקוד => יופיע בצד שמאל */}
                                            <div className="text-center flex-1">
                                                <div className="text-sm font-bold text-gray-800">
                                                    {shift.original_role?.replace(/^רז"ר\s+/, '').replace(/^רע"ן\s+/, '').trim() || 'תפקיד'}
                                                </div>
                                            </div>
                                            
                                        </div>

                                        {/* שורת השעות - LTR */}
                                        <div className="mt-2 pt-2 border-t border-green-200 space-y-1">
                                            <div className="flex items-center justify-center gap-2 text-xs text-gray-600" dir="ltr">
                                                <span>
                                                    {format(new Date(coverage.start_date), 'd/M')} {coverage.start_time} - {format(new Date(coverage.end_date), 'd/M')} {coverage.end_time}
                                                </span>
                                                <Clock className="w-3 h-3" />
                                            </div>
                                            <div className="text-[10px] text-gray-500 text-center">
                                                אושר ב: {(() => {
                                                    const date = new Date(shift.updated_date);
                                                    const israelTime = new Date(date.getTime() + (2 * 60 * 60 * 1000));
                                                    return format(israelTime, 'd/M/yy בשעה HH:mm');
                                                })()}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                             </div>
                          ) : amICoveringOnly ? (
                             <div className="bg-blue-50 border border-blue-100 rounded-lg p-2 mt-1">
                                <div className="flex justify-between items-start"><p className="text-xs text-gray-600">משמרת ראשית: <b>{shift.role}</b></p></div>
                                <div className="text-xs font-bold text-blue-700 mt-1">
                                   <div className="flex items-center gap-1"><Clock className="w-3 h-3" /><span>כיסוי חלקי:</span></div>
                                   <div className="pr-4">
                                       {myPartialCoverages.map(c => (
                                           <div key={c.id}>{c.start_time} - {c.end_time}</div>
                                       ))}
                                   </div>
                                </div>
                             </div>
                          ) : (
                              <>
                                <p className="text-sm text-[#E57373] font-medium">{shift.role}</p>
                                {(type === 'swap_requests' || type === 'partial_gaps' || isMySwapRequest) && (
                                    <div className="mt-1 flex items-center gap-2 text-xs text-gray-600">
                                        <Clock className="w-3 h-3" />
                                        {shift.swap_start_time && shift.swap_end_time ? (
                                            <span>{type === 'partial_gaps' ? 'נשאר' : 'פער'}: {shift.swap_start_time}-{shift.swap_end_time}</span>
                                        ) : (
                                            <span>09:00-09:00</span>
                                        )}
                                    </div>
                                )}
                              </>
                          )}

                          {shift.remaining_hours && type !== 'approved' && (
                            <div className="flex items-center gap-2 text-xs text-orange-600 mt-1"><AlertCircle className="w-3 h-3" /><span>נותר: {shift.remaining_hours} ש'</span></div>
                          )}
                        </div>

                        {/* צד שמאל - אייקונים */}
                        <div className="flex items-center gap-2 flex-shrink-0">
                              
                              {(type === 'swap_requests' || type === 'partial_gaps') && shift.assigned_email !== currentUser?.email && (
                                    <Button onClick={() => { onClose(); onOfferCover(shift); }} size="sm" className="bg-blue-500 text-white hover:bg-blue-600 px-3 h-9">
                                        אחליף <ArrowRight className="w-4 h-4 mr-1" />
                                    </Button>
                              )}
                              
                              {type === 'my_shifts' && (
                                <>
                                    <Button 
                                        onClick={() => handleAddToCalendar(shift)} 
                                        size="icon" 
                                        variant="outline" 
                                        className="rounded-full w-10 h-10 border-blue-200 text-blue-600 hover:bg-blue-50 transition-colors shadow-sm"
                                        title="הוסף ליומן"
                                    >
                                        <CalendarPlus className="w-5 h-5" />
                                    </Button>

                                    {!amICoveringOnly && (
                                        <Button 
                                            onClick={handleWhatsAppClick}
                                            size="icon"
                                            className={`rounded-full w-10 h-10 transition-all shadow-sm ${
                                                isMySwapRequest 
                                                ? "bg-[#25D366] hover:bg-[#128C7E] text-white" 
                                                : "bg-white border border-red-200 text-red-500 hover:bg-red-50"
                                            }`}
                                            title={isMySwapRequest ? "שתף בווצאפ" : "בקש החלפה"}
                                        >
                                            <MessageCircle className="w-5 h-5" />
                                        </Button>
                                    )}
                                </>
                              )}
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