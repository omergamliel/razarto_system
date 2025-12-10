import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Calendar, User, ArrowRight, Clock, AlertCircle } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { format } from 'date-fns';
import { he } from 'date-fns/locale';

export default function KPIListModal({ isOpen, onClose, type, shifts, currentUser, onOfferCover, onRequestSwap }) {
  if (!isOpen) return null;

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

  const filterShifts = () => {
    switch (type) {
      case 'swap_requests':
        return shifts.filter(s => s.status === 'swap_requested');
      case 'partial_gaps':
        return shifts.filter(s => s.status === 'partially_covered');
      case 'approved':
        return shifts.filter(s => s.status === 'approved');
      case 'my_shifts':
        // Containment logic for "my shifts"
        return shifts.filter(s => {
          const isFutureShift = new Date(s.date) >= new Date();
          if (!isFutureShift) return false;
          
          // Check if user's role is contained in shift's role
          if (currentUser?.assigned_role && s.role && s.role.includes(currentUser.assigned_role)) {
            return true;
          }
          
          return false;
        });
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

          <ScrollArea className="flex-1 p-6">
            {filteredShifts.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <p>אין משמרות להצגה</p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredShifts.map((shift) => (
                  <div
                    key={shift.id}
                    className="bg-gray-50 rounded-xl p-4 border border-gray-200 hover:shadow-md transition-all"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Calendar className="w-4 h-4 text-gray-500" />
                          <span className="font-semibold text-gray-800">
                            {format(new Date(shift.date), 'EEEE, d בMMMM', { locale: he })}
                          </span>
                        </div>

                        {type === 'approved' && shift.covering_role ? (
                          <div className="bg-white rounded-lg p-3 mb-2">
                            <div className="flex items-center justify-center gap-2 text-sm mb-2">
                              <div className="text-center flex-1">
                                <div className="text-xs text-gray-500">תפקיד מקורי</div>
                                <div className="font-bold text-red-600">{shift.role}</div>
                                <div className="text-xs text-gray-500 mt-0.5">{shift.swap_request_by}</div>
                              </div>
                              <ArrowRight className="w-4 h-4 text-gray-400" />
                              <div className="text-center flex-1">
                                <div className="text-xs text-gray-500">תפקיד מחליף</div>
                                <div className="font-bold text-blue-600">{shift.covering_role}</div>
                                <div className="text-xs text-gray-500 mt-0.5">{shift.covering_person}</div>
                              </div>
                            </div>
                            <div className="border-t border-gray-200 pt-2">
                              <div className="flex items-center gap-2 mb-1">
                                <Clock className="w-3 h-3 text-gray-500" />
                                <span className="text-xs font-semibold text-gray-700">פילוח שעות:</span>
                              </div>
                              {formatTimeBreakdown(shift)}
                            </div>
                          </div>
                        ) : (
                          <>
                            <div className="flex items-center gap-2 mb-1">
                              <User className="w-4 h-4 text-gray-500" />
                              <span className="text-sm text-gray-700">{shift.assigned_person}</span>
                            </div>
                            <p className="text-sm text-[#E57373] font-medium">{shift.role}</p>
                          </>
                        )}

                        {shift.remaining_hours && (
                          <div className="flex items-center gap-2 text-xs text-orange-600 mt-2">
                            <AlertCircle className="w-3 h-3" />
                            <span>נותרו לכיסוי: {shift.remaining_hours}</span>
                          </div>
                        )}
                      </div>
                      {type === 'swap_requests' && shift.assigned_email !== currentUser?.email && (
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
                      {type === 'my_shifts' && onRequestSwap && (
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
                ))}
              </div>
            )}
          </ScrollArea>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}