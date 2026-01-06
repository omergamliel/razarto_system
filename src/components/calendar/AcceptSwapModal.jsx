import React, { useState, useEffect } from 'react';
import { format, addDays } from 'date-fns';
import { he } from 'date-fns/locale';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CheckCircle, Clock, AlertCircle } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from 'sonner';

export default function AcceptSwapModal({ 
  isOpen, 
  onClose, 
  shift, 
  onAccept, 
  isAccepting,
  existingCoverages = []
}) {
  const [coverFull, setCoverFull] = useState(true);
  const [coverageChoice, setCoverageChoice] = useState('full');
  
  // State for manual time inputs
  const [startDate, setStartDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endDate, setEndDate] = useState('');
  const [endTime, setEndTime] = useState('');
  const [remainingGap, setRemainingGap] = useState(null);

  // 1. Detect if this is a request for a Full Swap (24h)
  const isFullSwapRequest = shift?.request_type === 'Full' || (
    (shift?.req_start_time === shift?.start_time && shift?.req_end_time === shift?.end_time) ||
    (!shift?.req_start_time && !shift?.req_end_time)
  );

  // Initialize values when modal opens
  useEffect(() => {
    if (!shift || !isOpen) return;
    
    // Default Dates from shift
    const shiftStartDate = shift.start_date ? shift.start_date : format(new Date(), 'yyyy-MM-dd');
    const shiftEndDate = shift.end_date ? shift.end_date : format(addDays(new Date(shiftStartDate), 1), 'yyyy-MM-dd');
    
    const originalStartTime = shift.req_start_time || shift.start_time || '09:00';
    const originalEndTime = shift.req_end_time || shift.end_time || '09:00';

    // --- GAP CALCULATION LOGIC (Preserved from original) ---
    // If there are existing coverages, calculate the remaining gap
    if (existingCoverages && existingCoverages.length > 0) {
       const validCoverages = existingCoverages;
       
       if (validCoverages.length > 0) {
         // Sort by end time
         const sorted = [...validCoverages].sort((a, b) => {
           const aTime = new Date(`${a.cover_start_date}T${a.cover_start_time}:00`);
           const bTime = new Date(`${b.cover_start_date}T${b.cover_start_time}:00`);
           return aTime - bTime;
         });
         
         const latestCoverage = sorted[sorted.length - 1];
         
         // Next start is where the last one ended
         const nextStartTime = latestCoverage.cover_end_time;
         const nextStartDate = latestCoverage.cover_end_date;
         
         // Determine end (Original End)
         const calculatedEndDate = shiftEndDate;
         
         setStartDate(nextStartDate);
         setStartTime(nextStartTime);
         setEndDate(calculatedEndDate);
         setEndTime(originalEndTime);
         setCoverFull(false); // Force partial mode if there's already coverage
         
         setRemainingGap({
           startTime: nextStartTime,
           endTime: originalEndTime,
           startDate: nextStartDate,
           endDate: calculatedEndDate
         });
         return;
       }
    }

    // Standard Initialization (No gaps)
    setStartDate(shiftStartDate);
    setStartTime(originalStartTime);
    setEndDate(shiftEndDate);
    setEndTime(originalEndTime);
    
    // Logic: If it's a full swap request, default to Full Cover. 
    // If it's partial request (e.g. "I need 4 hours"), default to Partial mode.
    if (isFullSwapRequest) {
        setCoverFull(true);
        setCoverageChoice('full');
    } else {
        setCoverFull(false); 
        setCoverageChoice('partial');
    }

  }, [shift, isOpen, existingCoverages, isFullSwapRequest]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    const wantsFull = coverFull;
    
    let submissionData = {
        type: wantsFull ? 'Full' : 'Partial',
        // If full, force shift times. If partial, use inputs.
        startTime: wantsFull ? (shift.start_time || '09:00') : startTime,
        endTime: wantsFull ? (shift.end_time || '09:00') : endTime,
        startDate: wantsFull ? shift.start_date : startDate,
        endDate: wantsFull ? shift.end_date : endDate
    };

    // Validation for Partial
    if (!wantsFull) {
        if (!startDate || !startTime || !endDate || !endTime) {
            toast.error('נא למלא את כל השדות');
            return;
        }
        const start = new Date(`${startDate}T${startTime}`);
        const end = new Date(`${endDate}T${endTime}`);
        if (start >= end) {
            toast.error('שעת הסיום חייבת להיות אחרי שעת ההתחלה');
            return;
        }
    }

    try {
      await onAccept(submissionData);
      if (wantsFull) {
        toast.success('ההחלפה בוצעה בהצלחה!');
      }
    } catch (err) {
      toast.error('אירעה שגיאה בעת שליחת הכיסוי');
    }
  };

  if (!isOpen || !shift) return null;
  
  const displayDate = shift.date || shift.start_date;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }} 
            onClick={onClose} 
            className="absolute inset-0 bg-black/40 backdrop-blur-sm" 
        />
        
        {/* Modal Content */}
        <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 20 }} 
            animate={{ opacity: 1, scale: 1, y: 0 }} 
            exit={{ opacity: 0, scale: 0.95, y: 20 }} 
            className="relative bg-white rounded-3xl shadow-2xl w-full max-w-md max-h-[85vh] overflow-hidden flex flex-col"
        >
          
          {/* Header */}
          <div className="bg-gradient-to-r from-[#64B5F6] to-[#42A5F5] p-6 text-white text-right">
            <button onClick={onClose} className="absolute top-4 left-4 p-2 rounded-full hover:bg-white/20 transition-colors">
                <X className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-3">
              <div className="p-3 bg-white/20 rounded-xl"><CheckCircle className="w-6 h-6" /></div>
              <div>
                <h2 className="text-xl font-bold">כיסוי משמרת</h2>
                <p className="text-white/80 text-sm">
                  {displayDate && format(new Date(displayDate), 'EEEE, d בMMMM', { locale: he })}
                </p>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-6 overflow-y-auto flex-1 text-right" dir="rtl">
            
            {/* Info Box: Original User */}
            <div className="bg-gradient-to-br from-[#E3F2FD] to-[#BBDEFB] rounded-xl p-4 border border-blue-100">
              <p className="text-sm text-blue-600 mb-1 font-medium">משובץ למשמרת (מקורי)</p>
              <div className="flex items-center justify-between">
                  <p className="font-bold text-gray-800 text-lg">{shift.user_name || 'לא ידוע'}</p>
                  <span className="bg-white/50 px-2 py-1 rounded text-xs font-semibold text-blue-800">
                      {shift.department ? `מחלקה ${shift.department}` : ''}
                  </span>
              </div>
            </div>

            {/* --- LOGIC BRANCHING --- */}
            
            {isFullSwapRequest ? (
                /* UI FOR FULL SWAP REQUEST (New Design) */
                <div className="space-y-5">
                    <h3 className="text-gray-800 font-semibold leading-relaxed bg-blue-50 p-3 rounded-lg border border-blue-100">
                        עלתה בקשה מהמשתמש/ת <span className="text-blue-600">{shift.user_name}</span> לכיסוי מלא של המשמרת, האם ברצונך לכסות משמרת מלאה?
                    </h3>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {/* Green Button (YES) */}
                        <button
                            type="button"
                            onClick={() => { setCoverFull(true); setCoverageChoice('full'); }}
                            className={`p-4 rounded-2xl border-2 transition-all flex flex-col items-center justify-center gap-2 shadow-sm
                                ${coverFull 
                                    ? 'bg-green-500 border-green-600 text-white shadow-green-200 ring-2 ring-green-300 ring-offset-2' 
                                    : 'bg-white border-green-200 text-green-700 hover:bg-green-50'
                                }`}
                        >
                            <CheckCircle className={`w-6 h-6 ${coverFull ? 'text-white' : 'text-green-600'}`} />
                            <span className="font-bold text-lg">כן, 24 שעות</span>
                        </button>

                        {/* Red Button (NO) */}
                        <button
                            type="button"
                            onClick={() => { setCoverFull(false); setCoverageChoice('partial'); }}
                            className={`p-4 rounded-2xl border-2 transition-all flex flex-col items-center justify-center gap-2 shadow-sm
                                ${!coverFull 
                                    ? 'bg-red-500 border-red-600 text-white shadow-red-200 ring-2 ring-red-300 ring-offset-2' 
                                    : 'bg-white border-red-200 text-red-700 hover:bg-red-50'
                                }`}
                        >
                            <AlertCircle className={`w-6 h-6 ${!coverFull ? 'text-white' : 'text-red-600'}`} />
                            <span className="font-bold text-lg">לא, כיסוי חלקי</span>
                        </button>
                    </div>
                </div>
            ) : (
                /* UI FOR REGULAR/PARTIAL REQUEST (Legacy/Simple) */
                <div className="space-y-3">
                    <Label className="text-gray-700 font-medium text-lg">פרטי הכיסוי המבוקש</Label>
                    <div className="text-sm text-gray-500">
                        זוהי בקשה לכיסוי חלקי או ספציפי. אנא וודא את השעות למטה.
                    </div>
                </div>
            )}

            {/* PARTIAL FORM (Only shows if user clicked Red/Partial OR if it's not a full request) */}
            <AnimatePresence>
                {!coverFull && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="space-y-4 overflow-hidden border-t pt-4"
                    >
                        <Label className="text-gray-700 font-medium">בחר שעות לכיסוי</Label>
                        <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 space-y-3">
                            {/* Start Time */}
                            <div className="flex flex-col sm:flex-row gap-3">
                                <div className="flex-1">
                                    <Label className="text-xs text-gray-500 mb-1">תאריך התחלה</Label>
                                    <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="text-center h-10 bg-white" />
                                </div>
                                <div className="flex-1">
                                    <Label className="text-xs text-gray-500 mb-1">שעת התחלה</Label>
                                    <Input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} className="text-center h-10 bg-white" />
                                </div>
                            </div>
                            
                            {/* End Time */}
                            <div className="flex flex-col sm:flex-row gap-3">
                                <div className="flex-1">
                                    <Label className="text-xs text-gray-500 mb-1">תאריך סיום</Label>
                                    <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="text-center h-10 bg-white" />
                                </div>
                                <div className="flex-1">
                                    <Label className="text-xs text-gray-500 mb-1">שעת סיום</Label>
                                    <Input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} className="text-center h-10 bg-white" />
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* SUMMARY BOX (Only shows for Full Cover in Full Request) */}
            {coverFull && isFullSwapRequest && (
                <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-gray-50 border border-gray-200 rounded-xl p-4 shadow-sm"
                >
                    <div className="flex items-center gap-2 mb-2 border-b border-gray-200 pb-2">
                        <Clock className="w-4 h-4 text-blue-600" />
                        <span className="font-bold text-gray-800 text-sm">סיכום השינויים</span>
                    </div>
                    <p className="text-sm text-gray-700 leading-relaxed">
                        תתבצע החלפה במשמרת זו בין המשתמשים <strong>{shift.user_name}</strong> (מקורי) לבין <strong>{/* We assume current user is accepting */}אותך</strong> (המחליפ/ה).
                    </p>
                </motion.div>
            )}

            <Button 
              type="submit" 
              disabled={isAccepting}
              className={`w-full py-6 rounded-xl text-lg font-bold shadow-lg transition-all transform active:scale-95 mt-4
                ${coverFull ? 'bg-gradient-to-r from-green-500 to-green-600 hover:to-green-700 text-white' : 'bg-gradient-to-r from-blue-500 to-blue-600 hover:to-blue-700 text-white'}
              `}
            >
              {isAccepting ? 'מעבד...' : 'אשר כיסוי'}
            </Button>

          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}