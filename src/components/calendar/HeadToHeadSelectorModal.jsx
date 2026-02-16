import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Calendar, ArrowLeftRight, Send } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { format } from 'date-fns';
import { he } from 'date-fns/locale';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

export default function HeadToHeadSelectorModal({ isOpen, onClose, targetShift, currentUser }) {
  const [selectedShift, setSelectedShift] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // שליפת המשמרות העתידיות שלי לצורך בחירה
  const { data: allShifts = [], isLoading } = useQuery({
    queryKey: ['my-future-shifts-h2h', currentUser?.serial_id],
    queryFn: () => base44.entities.Shift.list(),
    enabled: isOpen && !!currentUser?.serial_id
  });

  const myFutureFullShifts = allShifts.filter(shift => {
    const isMyShift = shift.original_user_id === currentUser?.serial_id;
    if (!isMyShift) return false;
    
    const shiftDate = new Date(shift.start_date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (shiftDate < today) return false;
    
    const status = String(shift.status || 'Active').toLowerCase();
    return status === 'active' || status === 'regular' || status === 'swap_requested';
  }).sort((a, b) => new Date(a.start_date) - new Date(b.start_date));

  const handleSelectShift = (shift) => {
    setSelectedShift(shift);
  };

  const handleSendProposal = async () => {
    if (!selectedShift) {
      toast.error('נא לבחור משמרת להחלפה');
      return;
    }

    setIsSubmitting(true);

    try {
      // 1. יצירת רשומת הבקשה בסטטוס Pending במסד הנתונים
      await base44.entities.SwapRequest.create({
        shift_id: targetShift.id,
        requesting_user_id: currentUser?.serial_id,
        request_type: 'Head2Head',
        req_start_date: targetShift.start_date,
        req_end_date: targetShift.end_date || targetShift.start_date,
        req_start_time: targetShift.start_time || '09:00',
        req_end_time: targetShift.end_time || '09:00',
        offered_shift_id: selectedShift.id,
        status: 'Pending'
      });

      // 2. הכנת הנתונים להודעה
      const targetDateStr = format(new Date(targetShift.start_date), 'dd/MM');
      const myDateStr = format(new Date(selectedShift.start_date), 'dd/MM');
      const targetName = targetShift.user_name || 'חבר';
      const myName = currentUser?.full_name || 'חבר';

      // 3. בניית ההודעה בפורמט המדויק שביקשת
      const message = `היי *${targetName}*! 👋🏼
אני אשמח להחליף איתך משמרת רז״רתו ראש בראש:

🫡 הצעת החלפה:
🫵🏼 המשמרת שלך: *${targetName}* ${targetDateStr}
🤞🏼 המשמרת שלי: *${myName}* ${myDateStr}

✅ לאישור ההחלפה בתוך המערכת יש ללחוץ כאן:
https://razar-toran-b555aef5.base44.app?headToHeadTarget=${targetShift.id}&headToHeadOffer=${selectedShift.id}`;

      // 4. פתיחת WhatsApp בפורמט היציב ביותר לנייד
      const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(message)}`;
      
      toast.success('הבקשה נוצרה! עובר ל-WhatsApp...');
      
      // הפניה ישירה כדי למנוע את "חסימת הפופ-אפ"
      setTimeout(() => {
        window.location.href = whatsappUrl;
        onClose();
      }, 500);

    } catch (error) {
      console.error('Error:', error);
      toast.error('שגיאה ביצירת הבקשה');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen || !targetShift) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
        <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="relative bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[85vh] overflow-hidden flex flex-col">
          
          <div className="bg-gradient-to-r from-purple-500 to-purple-600 p-6 text-white shrink-0">
            <button onClick={onClose} className="absolute top-4 left-4 p-2 rounded-full hover:bg-white/20 transition-colors"><X className="w-5 h-5" /></button>
            <div className="flex items-center gap-3">
              <div className="p-3 bg-white/20 rounded-xl"><ArrowLeftRight className="w-6 h-6" /></div>
              <div>
                <h2 className="text-2xl font-bold">החלפה ראש בראש</h2>
                <p className="text-white/90 text-sm mt-1">בחר איזו משמרת שלך תיתן בתמורה</p>
              </div>
            </div>
          </div>

          <div className="p-6 space-y-4 flex-1 overflow-hidden flex flex-col">
            <div className="bg-purple-50 border border-purple-200 rounded-xl p-4 shrink-0">
              <p className="text-sm text-purple-700 font-medium mb-2">המשמרת שאת רוצה לקחת:</p>
              <p className="font-bold text-gray-800">{targetShift.user_name}</p>
              <p className="text-sm text-gray-600">{format(new Date(targetShift.start_date), 'EEEE, d בMMMM', { locale: he })}</p>
            </div>

            <div className="flex-1 overflow-hidden flex flex-col min-h-0 border-t pt-4">
              <h3 className="font-bold text-gray-700 mb-3 shrink-0">בחר משמרת שלך להחלפה:</h3>
              {isLoading ? (
                <div className="text-center py-8 text-gray-500">טוען משמרות...</div>
              ) : myFutureFullShifts.length === 0 ? (
                <div className="text-center py-8 bg-gray-50 rounded-xl border border-dashed border-gray-300">
                  <p className="text-gray-500 font-medium mb-1">לא נמצאו משמרות מתאימות</p>
                </div>
              ) : (
                <div className="space-y-2 overflow-y-auto pr-1">
                  {myFutureFullShifts.map((shift) => (
                    <div
                      key={shift.id}
                      onClick={() => handleSelectShift(shift)}
                      className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                        selectedShift?.id === shift.id ? 'border-purple-500 bg-purple-50 shadow-md ring-1 ring-purple-500' : 'border-gray-100 hover:border-purple-300 bg-white'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-bold text-gray-800">המשמרת שלי</p>
                          <p className="text-sm text-gray-600">{format(new Date(shift.start_date), 'd בMMMM (EEEE)', { locale: he })}</p>
                        </div>
                        {selectedShift?.id === shift.id && <Send className="w-4 h-4 text-purple-500" />}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="p-6 pt-0 flex gap-3 shrink-0 bg-white border-t border-gray-100 mt-auto">
            <Button onClick={onClose} variant="outline" className="flex-1 h-12 rounded-xl">ביטול</Button>
            <Button 
              onClick={handleSendProposal} 
              disabled={!selectedShift || isSubmitting} 
              className={`flex-1 h-12 text-white rounded-xl shadow-md ${!selectedShift || isSubmitting ? 'bg-gray-300' : 'bg-gradient-to-r from-purple-500 to-purple-600'}`}
            >
              {isSubmitting ? 'מעבד...' : 'שלח הצעה ב-WhatsApp'}
            </Button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}