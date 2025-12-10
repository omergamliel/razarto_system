import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Calendar, User, ArrowRight } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { format } from 'date-fns';
import { he } from 'date-fns/locale';

export default function KPIListModal({ isOpen, onClose, type, shifts, currentUser, onOfferCover }) {
  if (!isOpen) return null;

  const getTitleAndColor = () => {
    switch (type) {
      case 'swap_requests':
        return { title: 'בקשות להחלפה', color: 'from-red-500 to-red-600' };
      case 'partial_gaps':
        return { title: 'משמרות בפער חלקי', color: 'from-yellow-500 to-yellow-600' };
      case 'approved':
        return { title: 'החלפות שאושרו', color: 'from-green-500 to-green-600' };
      case 'my_shifts':
        return { title: 'המשמרות שלי', color: 'from-blue-500 to-blue-600' };
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
        return shifts.filter(s => 
          s.assigned_email === currentUser?.email && 
          new Date(s.date) >= new Date()
        );
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
                        <div className="flex items-center gap-2 mb-1">
                          <User className="w-4 h-4 text-gray-500" />
                          <span className="text-sm text-gray-700">{shift.assigned_person}</span>
                        </div>
                        <p className="text-sm text-[#E57373] font-medium">{shift.role}</p>
                        {shift.remaining_hours && (
                          <p className="text-xs text-yellow-600 mt-1">
                            נותרו לכיסוי: {shift.remaining_hours}
                          </p>
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