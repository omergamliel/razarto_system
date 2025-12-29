import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Calendar, User, ArrowRight, Clock, AlertCircle } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { format } from 'date-fns';
import { he } from 'date-fns/locale';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';

export default function KPIListModal({ isOpen, onClose, type, shifts, currentUser, onOfferCover, onRequestSwap }) {
  // Fetch all shift coverages for approved shifts
  const { data: allCoverages = [] } = useQuery({
    queryKey: ['all-shift-coverages'],
    queryFn: async () => {
      const approvedShifts = shifts.filter(s => s.status === 'approved');
      const coveragePromises = approvedShifts.map(shift => 
        base44.entities.ShiftCoverage.filter({ shift_id: shift.id })
      );
      const results = await Promise.all(coveragePromises);
      return results.flat();
    },
    enabled: isOpen && type === 'approved'
  });

  if (!isOpen) return null;

  // --- פונקציית עזר: בדיקת 24 שעות (הועתק מ-KPIHeader לסנכרון מלא) ---
  const isFull24Hours = (s) => {
    if (s.swap_start_time && s.swap_end_time) {
        return s.swap_start_time.startsWith('09:00') && s.swap_end_time.startsWith('09:00');
    }
    return true; 
  };

  const formatTimeBreakdown = (shift) => {
    if (!shift.covered_start_time) return null;
    
    const isFull = shift.covered_start_time === '09:00' && 
                   (shift.covered_end_time === '09:00' || shift.covered_end_time === '09:00 (למחרת)');
    
    if (isFull) {
      return '09:00 - 09:00 (למחרת) - החלפה מלאה';
    }

    return (
      <div className="space-y-1 text-xs mt-2">
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-red-400" />
          <span>09:00 - {shift.covered_start_time}: {shift.role}</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-blue-400" />
          <span>{shift.covered_start_time} - {shift.covered_end_time}: {shift.covering_role}</span>
        </div>
      </div>
    );
  };

  const getTitleAndColor = () => {
    switch (type) {
      case 'swap_requests':
        return { title: 'בקשות להחלפה', color: 'from-red-500 to-red-600' };
      case 'partial_gaps':
        return { title: 'משמרות בפער חלקי', color: 'from-yellow-500 to-yellow-600' };
      case 'approved':
        return { title: 'החלפות שבוצעו', color: 'from-green-500 to-green-600' };
      case 'my_shifts':
        return { title: 'המשמרות העתידיות שלי', color: 'from-blue-500 to-blue-600' };
      default:
        return { title: '', color: '' };
    }
  };

  // --- לוגיקת הסינון החדשה (תואמת ל-KPIHeader) ---
  const filterShifts = () => {
    switch (type) {
      case 'swap_requests': // אדום
        return shifts.filter(s => {
            const isSwapStatus = s.status === 'REQUIRES_FULL_COVERAGE' || 
                                 s.status === 'REQUIRES_SWAP' || 
                                 s.status === 'swap_requested';
            // מציג רק אם זה 24 שעות מלאות
            return isSwapStatus && isFull24Hours(s);
        });

      case 'partial_gaps': // צהוב
        return shifts.filter(s => {
            const isOfficialPartial = s.status === 'REQUIRES_PARTIAL_COVERAGE' || 
                                      s.status === 'partially_covered' ||
                                      s.status === 'REQUIRES_PARTIAL';
            
            // תופס גם משמרות שהתחילו כמלאות אבל נשברו (זמנים לא 09-09)
            const isDegradedFullSwap = (s.status === 'REQUIRES_FULL_COVERAGE' || 
                                        s.status === 'REQUIRES_SWAP' || 
                                        s.status === 'swap_requested') && !isFull24Hours(s);

            return isOfficialPartial || isDegradedFullSwap;
        });

      case 'approved': // ירוק
        return shifts
          .filter(s => s.status === 'approved' || s.status === 'SWAPPED' || s.status === 'COVERED')
          .sort((a, b) => new Date(a.date) - new Date(b.date));

      case 'my_shifts': // כחול
        return shifts.filter(s => {
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          const shiftDate = new Date(s.date);
          shiftDate.setHours(0, 0, 0, 0);
          const isFutureShift = shiftDate >= today;

          if (!isFutureShift) return false;

          // בדיקה מורחבת (גם לפי תפקיד וגם לפי שיבוץ ישיר)
          const isMyRole = currentUser?.assigned_role && s.role && typeof s.role === 'string' && s.role.includes(currentUser.assigned_role);
          const isAssignedDirectly = s.assigned_user_id === currentUser?.id || s.email === currentUser?.email;

          return isMyRole || isAssignedDirectly;
        }).sort((a, b) => new Date(a.date) - new Date(b.date));

      default:
        return [];
    }
  };

  const { title, color } = getTitleAndColor();
  const filteredShifts = filterShifts();

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        />

        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[80vh] overflow-hidden flex flex-col"
        >
          <div className={`bg-gradient-to-r ${color} p-6 text-white`}>
            <button
              onClick={onClose}
              className="absolute top-4 left-4 p-2 rounded-full hover:bg-white/20 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            <h2 className="text-2xl font-bold">{title}</h2>
            <p className="text-white/90 text-sm mt-1">
              {filteredShifts.length} משמרות
            </p>
          </div>

          <div className="flex-1 p-6 max-h-[60vh] overflow-y-auto">
            {filteredShifts.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <p>אין משמרות להצגה</p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredShifts.map((shift) => {
                  const shiftCoverages = allCoverages
                    .filter(c => c.shift_id === shift.id)
                    .sort((a, b) => {
                      const aTime = new Date(`${a.start_date}T${a.start_time}:00`);
                      const bTime = new Date(`${b.start_date}T${b.start_time}:00`);
                      return aTime - bTime;
                    });

                  return (
                    <div
                      key={shift.id}
                      className="bg-gray-50 rounded-xl p-4 border border-gray-200 hover:shadow-md transition-all"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-3">
                            <Calendar className="w-4 h-4 text-gray-500" />
                            <span className="font-semibold text-gray-800">
                              {format(new Date(shift.date), 'EEEE, d בMMMM', { locale: he })}
                            </span>
                          </div>

                          {type === 'approved' ? (
                            <div className="space-y-2">
                              {shiftCoverages.map((coverage, idx) => (
                                <div key={coverage.id} className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg p-3 border border-green-200">
                                  <div className="flex items-center justify-center gap-3 text-sm">
                                    <div className="text-center flex-1">
                                      <div className="text-sm font-bold text-gray-800">
                                        {shift.original_role?.replace(/^רז"ר\s+/, '').replace(/^רע"ן\s+/, '').replace(/^רז״ר\s+/, '').replace(/^רע״ן\s+/, '').trim() || 'תפקיד'}
                                      </div>
                                    </div>
                                    <ArrowRight className="w-4 h-4 text-green-600 flex-shrink-0" />
                                    <div className="text-center flex-1">
                                      <div className="text-sm font-bold text-green-700">
                                        {coverage.covering_role?.replace(/^רז"ר\s+/, '').replace(/^רע"ן\s+/, '').replace(/^רז״ר\s+/, '').replace(/^רע״ן\s+/, '').trim() || 'תפקיד'}
                                      </div>
                                    </div>
                                  </div>
                                  <div className="mt-2 pt-2 border-t border-green-200 space-y-1">
                                    <div className="flex items-center justify-center gap-2 text-xs text-gray-600">
                                      <Clock className="w-3 h-3" />
                                      <span>
                                        {format(new Date(coverage.start_date), 'd/M')} {coverage.start_time} - {format(new Date(coverage.end_date), 'd/M')} {coverage.end_time}
                                      </span>
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
                          ) : (
                            <>
                              <p className="text-sm text-[#E57373] font-medium">{shift.role}</p>
                              
                              {/* Display timing for swap requests and partial gaps */}
                              {(type === 'swap_requests' || type === 'partial_gaps') && (
                                <div className="mt-2 flex items-center gap-2 text-xs text-gray-600 bg-white/50 rounded-lg px-2 py-1">
                                  <Clock className="w-3 h-3" />
                                  {shift.swap_start_time && shift.swap_end_time ? (
                                    (() => {
                                      const startHour = parseInt(shift.swap_start_time.split(':')[0]);
                                      const endHour = parseInt(shift.swap_end_time.split(':')[0]);
                                      const startDateObj = new Date(shift.date);
                                      const endDateObj = endHour < startHour ? new Date(new Date(shift.date).setDate(new Date(shift.date).getDate() + 1)) : startDateObj;
                                      const startDate = format(startDateObj, 'd/M');
                                      const endDate = format(endDateObj, 'd/M');
                                      return <span>{type === 'partial_gaps' ? 'נשאר' : 'פער'}: {shift.swap_start_time} {startDate} - {shift.swap_end_time} {endDate}</span>;
                                    })()
                                  ) : (
                                    <span>09:00 {format(new Date(shift.date), 'd/M')} - 09:00 {format(new Date(shift.date), 'd/M')} (למחרת)</span>
                                  )}
                                </div>
                              )}
                            </>
                          )}

                          {shift.remaining_hours && (
                            <div className="flex items-center gap-2 text-xs text-orange-600 mt-2">
                              <AlertCircle className="w-3 h-3" />
                              <span>נותרו לכיסוי: {shift.remaining_hours}</span>
                            </div>
                          )}
                          </div>
                          {(type === 'swap_requests' || type === 'partial_gaps') && shift.assigned_email !== currentUser?.email && (
                          <Button
                            onClick={() => {
                              onClose();
                              onOfferCover(shift);
                            }}
                            size="sm"
                            className="bg-gradient-to-r from-[#64B5F6] to-[#42A5F5] hover:from-[#42A5F5] hover:to-[#2196F3] text-white"
                          >
                            אני אחליף
                            <ArrowRight className="w-4 h-4 mr-1" />
                          </Button>
                          )}
                          {(type === 'my_shifts' || (shift.assigned_email === currentUser?.email && shift.status === 'regular')) && onRequestSwap && (
                          <Button
                            onClick={() => {
                              onClose();
                              onRequestSwap(shift);
                            }}
                            size="sm"
                            className="bg-gradient-to-r from-[#E57373] to-[#EF5350] hover:from-[#EF5350] hover:to-[#F44336] text-white"
                          >
                            בקש החלפה
                            <ArrowRight className="w-4 h-4 mr-1" />
                          </Button>
                          )}
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