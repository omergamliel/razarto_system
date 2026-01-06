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
  const [startDate, setStartDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endDate, setEndDate] = useState('');
  const [endTime, setEndTime] = useState('');
  const [remainingGap, setRemainingGap] = useState(null);

  // FIXED: Detect full swap context
  const isFullSwapRequest = shift?.request_type === 'Full' || (
    (shift?.req_start_time === shift?.start_time && shift?.req_end_time === shift?.end_time) ||
    (!shift?.req_start_time && !shift?.req_end_time)
  );

  // Initialize and update values when modal opens or shift changes
  useEffect(() => {
    if (!shift || !isOpen) return;
    
    // Default Dates
    const shiftStartDate = shift.start_date ? shift.start_date : format(new Date(), 'yyyy-MM-dd');
    const shiftEndDate = shift.end_date ? shift.end_date : format(addDays(new Date(shiftStartDate), 1), 'yyyy-MM-dd');
    
    // Get original request times (from SwapRequest attached to shift object or defaults)
    const originalStartTime = shift.req_start_time || shift.start_time || '09:00';
    const originalEndTime = shift.req_end_time || shift.end_time || '09:00';
    
    // --- GAP CALCULATION LOGIC ---
    // If there are existing coverages, find the gap
    if (existingCoverages && existingCoverages.length > 0) {
      // Filter out coverages by the requester (if any)
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
        // Simple logic: Assuming original end is the target
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

    // No existing coverages - clean slate
    const isPartialRequest = shift.status === 'Partially_Covered' || shift.request_type === 'Partial';

    if (isPartialRequest) {
       // Pre-fill with requested partial times
       setStartDate(shift.req_start_date || shiftStartDate);
       setStartTime(originalStartTime);
       setEndDate(shift.req_end_date || shiftEndDate);
       setEndTime(originalEndTime);
       setCoverFull(false);
       setCoverageChoice('partial');
    } else {
       // Default Full
       setStartDate(shiftStartDate);
       setStartTime(originalStartTime);
       setEndDate(shiftEndDate);
       setEndTime(originalEndTime);
       setCoverFull(true);
       setCoverageChoice('full');
    }

  }, [shift, isOpen, existingCoverages]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Prepare Submission Data
    const wantsFull = coverageChoice === 'full';
    let submissionData = {
        type: wantsFull ? 'Full' : 'Partial',
        // If full, take defaults from shift, else take form inputs
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
  
  const displayDate = shift.date || shift.start_date; // Handle both key names

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
        
        <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="relative bg-white rounded-3xl shadow-2xl w-full max-w-md max-h-[80vh] overflow-hidden flex flex-col">
          
          <div className="bg-gradient-to-r from-[#64B5F6] to-[#42A5F5] p-6 text-white">
            <button onClick={onClose} className="absolute top-4 left-4 p-2 rounded-full hover:bg-white/20 transition-colors"><X className="w-5 h-5" /></button>
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

          <form onSubmit={handleSubmit} className="p-6 space-y-5 overflow-y-auto flex-1">
            
            {/* Request Info Box */}
            <div className="bg-gradient-to-br from-[#FFEBEE] to-[#FFCDD2] rounded-xl p-4">
              <p className="text-sm text-gray-600 mb-1">מבקש ההחלפה</p>
              <p className="font-semibold text-gray-800">{shift.user_name || 'לא ידוע'}</p>
              <div className="mt-2 pt-2 border-t border-[#E57373]/30 flex items-center gap-2 text-sm text-gray-700">
                  <Clock className="w-4 h-4" />
                  {shift.request_type === 'Full' ? 'משמרת מלאה (24 שעות)' : 'כיסוי חלקי מבוקש'}
              </div>
            </div>

            {/* FIXED: New Full Swap UI */}
            {isFullSwapRequest ? (
              <div className="space-y-4">
                <div className="bg-blue-50 border border-blue-100 p-4 rounded-2xl text-right">
                  <p className="text-sm text-blue-900 font-semibold leading-relaxed">
                    עלתה בקשה מהמשתמש/ת {shift.user_name || 'לא ידוע'} לכיסוי מלא של המשמרת, האם ברצונך לכסות משמרת מלאה?
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => { setCoverFull(true); setCoverageChoice('full'); }}
                    className={`w-full p-5 rounded-2xl text-white font-bold text-lg transition-all shadow-md ${coverageChoice === 'full' ? 'bg-green-600 ring-4 ring-green-200 scale-[1.02]' : 'bg-green-500 hover:bg-green-600'}`}
                  >
                    כן, 24 שעות
                  </button>
                  <button
                    type="button"
                    onClick={() => { setCoverFull(false); setCoverageChoice('partial'); }}
                    className={`w-full p-5 rounded-2xl text-white font-bold text-lg transition-all shadow-md ${coverageChoice === 'partial' ? 'bg-red-600 ring-4 ring-red-200 scale-[1.02]' : 'bg-red-500 hover:bg-red-600'}`}
                  >
                    לא, כיסוי חלקי
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <Label className="text-gray-700 font-medium text-lg">לכסות משמרת מלאה?</Label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => { setCoverFull(true); setCoverageChoice('full'); }}
                    className={`p-4 rounded-xl border-2 transition-all text-center ${coverFull ? 'border-[#64B5F6] bg-[#E3F2FD] shadow-md' : 'border-gray-200 hover:border-gray-300'}`}
                  >
                    <div className="font-semibold text-gray-800">כן</div>
                    <div className="text-xs text-gray-500 mt-1">24 שעות</div>
                  </button>
                  <button
                    type="button"
                    onClick={() => { setCoverFull(false); setCoverageChoice('partial'); }}
                    className={`p-4 rounded-xl border-2 transition-all text-center ${!coverFull ? 'border-[#64B5F6] bg-[#E3F2FD] shadow-md' : 'border-gray-200 hover:border-gray-300'}`}
                  >
                    <div className="font-semibold text-gray-800">לא</div>
                    <div className="text-xs text-gray-500 mt-1">כיסוי חלקי</div>
                  </button>
                </div>
              </div>
            )}

            {/* Partial Coverage Form */}
            <AnimatePresence>
              {!coverFull && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="space-y-4 overflow-hidden"
                >
                  <Label className="text-gray-700 font-medium">פרטי הכיסוי שלך</Label>
                  <div className="bg-gray-50 rounded-xl p-4 space-y-3">
                    
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

            {/* FIXED: Summary for full swap */}
            {coverageChoice === 'full' && isFullSwapRequest && (
              <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4 shadow-sm space-y-2">
                <p className="text-sm font-bold text-blue-900">סיכום השינויים</p>
                <p className="text-sm text-blue-800 leading-relaxed">
                  תתבצע החלפה במשמרת זו בין המשתמשים <span className="font-bold">{shift.user_name || 'מקורי'}</span> (מקורי) לבין <span className="font-bold">{shift.current_user_name || shift.covering_user_name || 'את/ה'}</span> (המחליפ/ה)
                </p>
              </div>
            )}

            <Button
              type="submit"
              disabled={isAccepting}
              className="w-full bg-gradient-to-r from-[#64B5F6] to-[#42A5F5] hover:from-[#42A5F5] hover:to-[#2196F3] text-white py-6 rounded-xl text-lg font-medium shadow-lg mt-4"
            >
              {isAccepting ? 'מעבד...' : 'אשר כיסוי'}
            </Button>

          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}