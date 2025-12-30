import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Calendar, Clock, ArrowLeftRight } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { format, addDays } from 'date-fns';
import { he } from 'date-fns/locale';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

export default function HeadToHeadSelectorModal({ isOpen, onClose, targetShift, currentUser }) {
  const [selectedShift, setSelectedShift] = useState(null);

  const { data: allShifts = [], isLoading } = useQuery({
    queryKey: ['my-future-shifts', currentUser?.email],
    queryFn: () => base44.entities.Shift.list(),
    enabled: isOpen && !!currentUser?.email
  });

  const myFutureFullShifts = allShifts.filter(shift => {
    if (shift.assigned_email !== currentUser?.email) return false;
    
    const shiftDate = new Date(shift.date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    shiftDate.setHours(0, 0, 0, 0);
    
    if (shiftDate < today) return false;
    
    // Check if it's a full shift (no swap times or 09:00-09:00)
    const isFull = !shift.swap_start_time || 
                   (shift.swap_start_time === '09:00' && shift.swap_end_time === '09:00');
    
    return isFull && shift.status === 'regular';
  }).sort((a, b) => new Date(a.date) - new Date(b.date));

  const handleSelectShift = (shift) => {
    setSelectedShift(shift);
  };

  const handleSendProposal = () => {
    if (!selectedShift) {
      toast.error('נא לבחור משמרת להחלפה');
      return;
    }

    const appLink = window.location.origin + window.location.pathname;
    const proposalLink = `${appLink}?mode=head_to_head_approval&targetId=${targetShift.id}&offerId=${selectedShift.id}`;
    
    const targetDate = format(new Date(targetShift.date), 'dd/MM', { locale: he });
    const offerDate = format(new Date(selectedShift.date), 'dd/MM', { locale: he });
    
    const message = `היי! 👋
אני מעוניין להחליף איתך משמרת ראש בראש:

🔄 *הצעת החלפה:*
📅 המשמרת שלך: *${targetShift.role}* בתאריך ${targetDate}
🔁 המשמרת שלי: *${selectedShift.role}* בתאריך ${offerDate}

לחץ כאן לאישור ההחלפה:
${proposalLink}`;

    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
    toast.success('ההצעה נשלחה בהצלחה!');
    onClose();
  };

  if (!isOpen || !targetShift) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        />

        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[85vh] overflow-hidden flex flex-col"
        >
          <div className="bg-gradient-to-r from-purple-500 to-purple-600 p-6 text-white">
            <button
              onClick={onClose}
              className="absolute top-4 left-4 p-2 rounded-full hover:bg-white/20 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            
            <div className="flex items-center gap-3">
              <div className="p-3 bg-white/20 rounded-xl">
                <ArrowLeftRight className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-2xl font-bold">החלפה ראש בראש</h2>
                <p className="text-white/90 text-sm mt-1">בחר משמרת שלך להצעה</p>
              </div>
            </div>
          </div>

          <div className="p-6 space-y-4">
            <div className="bg-purple-50 border border-purple-200 rounded-xl p-4">
              <p className="text-sm text-purple-700 font-medium mb-2">המשמרת המבוקשת:</p>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-bold text-gray-800">{targetShift.role}</p>
                  <div className="flex items-center gap-2 text-sm text-gray-600 mt-1">
                    <Calendar className="w-4 h-4" />
                    <span>{format(new Date(targetShift.date), 'EEEE, d בMMMM', { locale: he })}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="border-t pt-4">
              <h3 className="font-bold text-gray-700 mb-3">בחר משמרת שלך להחלפה:</h3>
              
              {isLoading ? (
                <div className="text-center py-8 text-gray-500">טוען משמרות...</div>
              ) : myFutureFullShifts.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-500 mb-2">אין לך משמרות עתידיות זמינות להחלפה</p>
                  <p className="text-xs text-gray-400">רק משמרות מלאות ללא בקשות החלפה זמינות</p>
                </div>
              ) : (
                <div className="space-y-2 max-h-[40vh] overflow-y-auto">
                  {myFutureFullShifts.map((shift) => (
                    <motion.div
                      key={shift.id}
                      whileHover={{ scale: 1.02 }}
                      onClick={() => handleSelectShift(shift)}
                      className={`
                        p-4 rounded-xl border-2 cursor-pointer transition-all
                        ${selectedShift?.id === shift.id
                          ? 'border-purple-500 bg-purple-50 shadow-md'
                          : 'border-gray-200 hover:border-gray-300 bg-white'
                        }
                      `}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <p className="font-semibold text-gray-800">{shift.role}</p>
                          <div className="flex items-center gap-2 text-sm text-gray-600 mt-1">
                            <Calendar className="w-3 h-3" />
                            <span>{format(new Date(shift.date), 'd בMMMM', { locale: he })}</span>
                          </div>
                          <div className="flex items-center gap-2 text-xs text-gray-500 mt-1">
                            <Clock className="w-3 h-3" />
                            <span>09:00 - 09:00 (משמרת מלאה)</span>
                          </div>
                        </div>
                        {selectedShift?.id === shift.id && (
                          <div className="w-6 h-6 bg-purple-500 rounded-full flex items-center justify-center">
                            <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="p-6 pt-0 flex gap-3">
            <Button
              onClick={onClose}
              variant="outline"
              className="flex-1 h-12 rounded-xl"
            >
              ביטול
            </Button>
            <Button
              onClick={handleSendProposal}
              disabled={!selectedShift}
              className="flex-1 h-12 bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white rounded-xl disabled:opacity-50"
            >
              שלח הצעה בוואטסאפ
            </Button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}