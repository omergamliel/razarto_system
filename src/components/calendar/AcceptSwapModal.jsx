import React, { useState, useEffect } from 'react';
import { format, addDays, parse } from 'date-fns';
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
  const [startDate, setStartDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endDate, setEndDate] = useState('');
  const [endTime, setEndTime] = useState('');
  const [remainingGap, setRemainingGap] = useState(null);

  // Initialize and update values when modal opens or shift changes
  useEffect(() => {
    if (!shift || !isOpen) return;
    
    const shiftStartDate = shift.date;
    const shiftEndDate = format(addDays(new Date(shift.date), 1), 'yyyy-MM-dd');
    
    // Get original request times
    const originalStartTime = shift.swap_start_time || '09:00';
    const originalEndTime = shift.swap_end_time || '09:00';
    
    // Calculate next gap based on existing coverages
    if (existingCoverages && existingCoverages.length > 0) {
      const validCoverages = existingCoverages.filter(c => c.covering_email !== shift.swap_request_by);
      
      if (validCoverages.length > 0) {
        const sorted = [...validCoverages].sort((a, b) => {
          const aTime = new Date(`${a.start_date}T${a.start_time}:00`);
          const bTime = new Date(`${b.start_date}T${b.start_time}:00`);
          return aTime - bTime;
        });
        
        const latestCoverage = sorted[sorted.length - 1];
        const nextStartTime = latestCoverage.end_time;
        const nextStartDate = latestCoverage.end_date;
        
        const originalEndHour = parseInt(originalEndTime.split(':')[0]);
        const nextStartHour = parseInt(nextStartTime.split(':')[0]);
        const calculatedEndDate = originalEndHour < nextStartHour ? shiftEndDate : nextStartDate;
        
        setStartDate(nextStartDate);
        setStartTime(nextStartTime);
        setEndDate(calculatedEndDate);
        setEndTime(originalEndTime);
        setCoverFull(false);
        
        setRemainingGap({ 
          startTime: nextStartTime, 
          endTime: originalEndTime, 
          startDate: nextStartDate, 
          endDate: calculatedEndDate 
        });
        return;
      }
    }
    
    // No existing coverages - check if it's a swap request
    if ((shift.status === 'swap_requested' || shift.status === 'partially_covered') && shift.swap_start_time && shift.swap_end_time) {
      const startHour = parseInt(originalStartTime.split(':')[0]);
      const endHour = parseInt(originalEndTime.split(':')[0]);
      const calculatedEndDate = endHour < startHour ? shiftEndDate : shiftStartDate;
      
      setRemainingGap({ 
        startTime: originalStartTime, 
        endTime: originalEndTime, 
        startDate: shiftStartDate, 
        endDate: calculatedEndDate 
      });
      setStartDate(shiftStartDate);
      setStartTime(originalStartTime);
      setEndDate(calculatedEndDate);
      setEndTime(originalEndTime);
      setCoverFull(false);
    } else {
      // Default to full coverage
      setStartDate(shiftStartDate);
      setStartTime('09:00');
      setEndDate(shiftEndDate);
      setEndTime('09:00');
      setCoverFull(true);
    }
  }, [shift, isOpen, existingCoverages]);

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // If covering full shift, no validation needed
    if (coverFull) {
      onAccept({
        coverFull: true,
        coverDate: shift?.date,
        startTime: '09:00',
        endTime: '09:00',
        endDate: format(addDays(new Date(shift.date), 1), 'yyyy-MM-dd')
      });
      return;
    }
    
    // Partial coverage - validate fields are filled
    if (!startDate || !startTime || !endDate || !endTime) {
      toast.error('נא למלא את כל השדות');
      return;
    }
    
    const selectedStart = new Date(`${startDate}T${startTime}:00`);
    const selectedEnd = new Date(`${endDate}T${endTime}:00`);
    
    // Validate end is after start
    if (selectedStart >= selectedEnd) {
      toast.error('שעת הסיום חייבת להיות אחרי שעת ההתחלה');
      return;
    }
    
    // Get the valid range for this shift
    const originalStartTime = shift.swap_start_time || '09:00';
    const originalEndTime = shift.swap_end_time || '09:00';
    
    // Calculate the minimum start time (original or after latest coverage)
    let validRangeStart = new Date(`${shift.date}T${originalStartTime}:00`);
    if (existingCoverages && existingCoverages.length > 0) {
      const validCoverages = existingCoverages.filter(c => c.covering_email !== shift.swap_request_by);
      if (validCoverages.length > 0) {
        const sorted = [...validCoverages].sort((a, b) => {
          const aTime = new Date(`${a.start_date}T${a.start_time}:00`);
          const bTime = new Date(`${b.start_date}T${b.start_time}:00`);
          return aTime - bTime;
        });
        const latestCoverage = sorted[sorted.length - 1];
        validRangeStart = new Date(`${latestCoverage.end_date}T${latestCoverage.end_time}:00`);
      }
    }
    
    // Calculate the maximum end time (original request end time)
    const originalEndHour = parseInt(originalEndTime.split(':')[0]);
    const originalStartHour = parseInt(originalStartTime.split(':')[0]);
    let validRangeEndDate = shift.date;
    if (originalEndHour < originalStartHour) {
      validRangeEndDate = format(addDays(new Date(shift.date), 1), 'yyyy-MM-dd');
    }
    const validRangeEnd = new Date(`${validRangeEndDate}T${originalEndTime}:00`);
    
    // Validate coverage is within the valid range
    if (selectedStart < validRangeStart) {
      toast.error('טעות בבחירת שעה', {
        description: `הכיסוי חייב להתחיל מ-${format(validRangeStart, 'HH:mm d/M')} ואילך`,
        duration: 5000
      });
      return;
    }
    
    if (selectedEnd > validRangeEnd) {
      toast.error('טעות בבחירת שעה', {
        description: `הכיסוי לא יכול לחרוג מ-${format(validRangeEnd, 'HH:mm d/M')}`,
        duration: 5000
      });
      return;
    }
    
    // All validations passed - submit
    onAccept({
      coverFull: false,
      coverDate: startDate,
      startTime: startTime,
      endTime: endTime,
      endDate: endDate
    });
  };

  if (!isOpen || !shift) return null;
  
  const shiftStartDate = new Date(`${shift.date}T09:00:00`);
  const shiftEndDate = addDays(shiftStartDate, 1);

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
          className="relative bg-white rounded-3xl shadow-2xl w-full max-w-md max-h-[80vh] overflow-hidden flex flex-col"
        >
          <div className="bg-gradient-to-r from-[#64B5F6] to-[#42A5F5] p-6 text-white">
            <button
              onClick={onClose}
              className="absolute top-4 left-4 p-2 rounded-full hover:bg-white/20 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            
            <div className="flex items-center gap-3">
              <div className="p-3 bg-white/20 rounded-xl">
                <CheckCircle className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-xl font-bold">כיסוי משמרת</h2>
                <p className="text-white/80 text-sm">
                  {format(new Date(shift.date), 'EEEE, d בMMMM', { locale: he })}
                </p>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-5 overflow-y-auto flex-1">
            <div className="bg-gradient-to-br from-[#FFEBEE] to-[#FFCDD2] rounded-xl p-4">
              <p className="text-sm text-gray-600 mb-1">מבקש</p>
              <p className="font-semibold text-gray-800">{shift.role}</p>
              <div className="mt-2 pt-2 border-t border-[#E57373]/30">
                <div className="flex items-center gap-2 text-sm text-gray-700">
                  <Clock className="w-4 h-4" />
                  {shift.swap_type === 'full' 
                    ? 'משמרת מלאה (24 שעות)'
                    : (() => {
                        const startHour = parseInt(shift.swap_start_time.split(':')[0]);
                        const endHour = parseInt(shift.swap_end_time.split(':')[0]);
                        const startDate = format(new Date(shift.date), 'd/M');
                        const endDate = endHour < startHour ? format(addDays(new Date(shift.date), 1), 'd/M') : startDate;
                        return `${shift.swap_start_time} ${startDate} - ${shift.swap_end_time} ${endDate}`;
                      })()
                  }
                </div>
              </div>
            </div>

            {existingCoverages && existingCoverages.filter(c => c.covering_email !== shift.swap_request_by).length > 0 && (
              <div className="bg-yellow-50 rounded-xl p-4 border border-yellow-200">
                <p className="text-sm font-semibold text-yellow-800 mb-3">כיסויים קיימים:</p>
                <div className="space-y-2">
                  {existingCoverages
                    .filter(c => c.covering_email !== shift.swap_request_by)
                    .sort((a, b) => {
                      const aTime = new Date(`${a.start_date}T${a.start_time}:00`);
                      const bTime = new Date(`${b.start_date}T${b.start_time}:00`);
                      return aTime - bTime;
                    })
                    .map((coverage, idx) => (
                      <div key={coverage.id} className="text-sm text-yellow-700 bg-white/50 rounded-lg p-2">
                        <div className="font-semibold">{coverage.covering_role || coverage.covering_person}</div>
                        <div className="text-xs mt-1">
                          {coverage.start_time} {format(new Date(coverage.start_date), 'd/M')} - {coverage.end_time} {format(new Date(coverage.end_date), 'd/M')}
                        </div>
                      </div>
                    ))}
                </div>
                {shift.remaining_hours && (
                  <div className="text-sm text-yellow-800 mt-3 pt-3 border-t border-yellow-200 font-medium">
                    נותר לכיסוי: {shift.remaining_hours}
                  </div>
                )}
              </div>
            )}

            {shift.status === 'partially_covered' && remainingGap && (
              <div className="bg-yellow-50 border-2 border-yellow-300 rounded-xl p-4">
                <p className="text-sm font-semibold text-yellow-800 mb-2">טווח שעות מבוקש להחלפה:</p>
                <div className="flex items-center justify-center gap-2 text-yellow-700">
                  <Clock className="w-5 h-5" />
                  <span className="font-bold text-lg">
                    {remainingGap.startTime} {format(new Date(remainingGap.startDate), 'd/M')} - {remainingGap.endTime} {format(new Date(remainingGap.endDate), 'd/M')}
                  </span>
                </div>
                <p className="text-xs text-yellow-700 text-center mt-2">
                  יש לכסות בטווח שעות זה בלבד
                </p>
              </div>
            )}
            {shift.status === 'partially_covered' && !remainingGap && shift.swap_start_time && shift.swap_end_time && (
              <div className="bg-yellow-50 border-2 border-yellow-300 rounded-xl p-4">
                <p className="text-sm font-semibold text-yellow-800 mb-2">טווח שעות מבוקש להחלפה:</p>
                <div className="flex items-center justify-center gap-2 text-yellow-700">
                  <Clock className="w-5 h-5" />
                  <span className="font-bold text-lg">
                    {(() => {
                      const startHour = parseInt(shift.swap_start_time.split(':')[0]);
                      const endHour = parseInt(shift.swap_end_time.split(':')[0]);
                      const startDate = format(new Date(shift.date), 'd/M');
                      const endDate = endHour < startHour ? format(addDays(new Date(shift.date), 1), 'd/M') : startDate;
                      return `${shift.swap_start_time} ${startDate} - ${shift.swap_end_time} ${endDate}`;
                    })()}
                  </span>
                </div>
                <p className="text-xs text-yellow-700 text-center mt-2">
                  יש לכסות בטווח שעות זה בלבד
                </p>
              </div>
            )}

            {shift.status !== 'partially_covered' && (
            <div className="space-y-3">
              <Label className="text-gray-700 font-medium text-lg">
                לכסות משמרת מלאה?
              </Label>
              
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setCoverFull(true)}
                  className={`
                    p-4 rounded-xl border-2 transition-all text-center
                    ${coverFull 
                      ? 'border-[#64B5F6] bg-[#E3F2FD] shadow-md' 
                      : 'border-gray-200 hover:border-gray-300'
                    }
                  `}
                >
                  <div className="font-semibold text-gray-800">כן</div>
                  <div className="text-xs text-gray-500 mt-1">24 שעות</div>
                </button>
                
                <button
                  type="button"
                  onClick={() => setCoverFull(false)}
                  className={`
                    p-4 rounded-xl border-2 transition-all text-center
                    ${!coverFull 
                      ? 'border-[#64B5F6] bg-[#E3F2FD] shadow-md' 
                      : 'border-gray-200 hover:border-gray-300'
                    }
                  `}
                >
                  <div className="font-semibold text-gray-800">לא</div>
                  <div className="text-xs text-gray-500 mt-1">כיסוי חלקי</div>
                </button>
              </div>
            </div>
            )}

            <AnimatePresence>
              {!coverFull && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="space-y-4 overflow-hidden"
                >
                  <Label className="text-gray-700 font-medium">פרטי הכיסוי שלך</Label>
                  
                  {shift.status !== 'partially_covered' && (
                  <div className="bg-blue-50 border border-blue-200 rounded-xl p-3">
                    <div className="flex items-start gap-2">
                      <AlertCircle className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                      <p className="text-xs text-blue-700">
                        הכיסוי חייב להיות בתוך חלון 24 השעות של המשמרת: {format(shiftStartDate, 'HH:mm d/M')} - {format(shiftEndDate, 'HH:mm d/M')}
                      </p>
                    </div>
                  </div>
                  )}
                  
                  <div className="bg-gray-50 rounded-xl p-4 space-y-3">
                    <Label className="text-gray-700 font-semibold">החל מ:</Label>
                    <div className="flex flex-col sm:flex-row gap-3">
                      <div className="flex-1 min-w-0">
                        <Label className="text-xs text-gray-500 mb-1 block">החל מתאריך</Label>
                        <Input
                          type="date"
                          value={startDate}
                          onChange={(e) => setStartDate(e.target.value)}
                          min={shift?.date}
                          max={format(shiftEndDate, 'yyyy-MM-dd')}
                          className="text-center h-12 rounded-xl w-full"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <Label className="text-xs text-gray-500 mb-1 block">החל משעה</Label>
                        <Input
                          type="time"
                          value={startTime}
                          onChange={(e) => setStartTime(e.target.value)}
                          className="text-center h-12 rounded-xl w-full"
                          dir="ltr"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="bg-gray-50 rounded-xl p-4 space-y-3">
                    <Label className="text-gray-700 font-semibold">ועד ל:</Label>
                    <div className="flex flex-col sm:flex-row gap-3">
                      <div className="flex-1 min-w-0">
                        <Label className="text-xs text-gray-500 mb-1 block">ועד לתאריך</Label>
                        <Input
                          type="date"
                          value={endDate}
                          onChange={(e) => setEndDate(e.target.value)}
                          min={shift?.date}
                          max={format(shiftEndDate, 'yyyy-MM-dd')}
                          className="text-center h-12 rounded-xl w-full"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <Label className="text-xs text-gray-500 mb-1 block">עד לשעה</Label>
                        <Input
                          type="time"
                          value={endTime}
                          onChange={(e) => setEndTime(e.target.value)}
                          className="text-center h-12 rounded-xl w-full"
                          dir="ltr"
                        />
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-green-50 border border-green-200 rounded-xl p-3">
                    <p className="text-xs text-green-800 font-medium mb-1">
                      💡 כיסוי רב-משתמש
                    </p>
                    <p className="text-xs text-green-700">
                      משתמשים נוספים יכולים לכסות את השעות הנותרות
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <Button
              type="submit"
              disabled={isAccepting}
              className="w-full bg-gradient-to-r from-[#64B5F6] to-[#42A5F5] hover:from-[#42A5F5] hover:to-[#2196F3] text-white py-6 rounded-xl text-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isAccepting ? (
                <span className="flex items-center justify-center gap-2">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                  >
                    ⏳
                  </motion.div>
                  מעבד...
                </span>
              ) : (
                <span className="flex items-center justify-center gap-2">
                  <CheckCircle className="w-5 h-5" />
                  אשר כיסוי
                </span>
              )}
            </Button>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}