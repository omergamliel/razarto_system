import React, { useState, useEffect } from 'react';
import { format, addDays, parseISO, isValid } from 'date-fns';
import { he } from 'date-fns/locale';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Clock, CheckCircle, AlertCircle } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function CoverSegmentModal({ 
  isOpen, 
  onClose, 
  shift,
  date,
  onSubmit,
  isSubmitting
}) {
  // State initialization
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('09:00');
  const [coverageType, setCoverageType] = useState('full'); // 'full' or 'partial'
  
  const [error, setError] = useState('');

  // --- Date & Logic Initialization (The Brain) ---
  useEffect(() => {
    if (isOpen && date && shift) {
      try {
        let baseDate = new Date(date);
        if (!isValid(baseDate)) baseDate = parseISO(date);

        // 1. ברירת מחדל: משמרת מלאה (09:00 עד 09:00 למחרת)
        let newStartDate = format(baseDate, 'yyyy-MM-dd');
        let newStartTime = '09:00';
        let newEndDate = format(addDays(baseDate, 1), 'yyyy-MM-dd');
        let newEndTime = '09:00';
        let type = 'full';

        // בדיקה: האם השעות השמורות הן בעצם יום מלא?
        const isFull24Hours = shift.swap_start_time === '09:00' && shift.swap_end_time === '09:00';

        // 2. בדיקה אגרסיבית: אם יש שעות מוגדרות והן לא יום שלם - תשתמש בהן!
        // התעלמנו כאן בכוונה מהסטטוס (status) כדי למנוע פספוסים.
        // אם יש שעות, המערכת תמיד תציע אותן.
        if (shift.swap_start_time && shift.swap_end_time && !isFull24Hours) {
            type = 'partial'; // מעביר אוטומטית למצב "כיסוי חלקי"
            
            newStartTime = shift.swap_start_time;
            newEndTime = shift.swap_end_time;

            const startH = parseInt(newStartTime.split(':')[0]);
            const endH = parseInt(newEndTime.split(':')[0]);

            // --- לוגיקת תאריכים חכמה ---
            
            // חישוב תאריך התחלה:
            // אם שעת ההתחלה קטנה מ-9 (למשל 06:00), זה בהכרח היום למחרת
            let startBaseObj = baseDate;
            if (startH < 9) {
                startBaseObj = addDays(baseDate, 1);
            }
            newStartDate = format(startBaseObj, 'yyyy-MM-dd');

            // חישוב תאריך סיום:
            let endBaseObj = startBaseObj;
            
            // אם שעת הסיום קטנה משעת ההתחלה (למשל 23:00 עד 02:00), עברנו יום.
            // אם שעת הסיום שווה לשעת ההתחלה (נדיר), או גדולה ממנה - זה אותו יום.
            // במקרה שלך (06:00 עד 09:00): 9 > 6, לכן זה נשאר באותו יום (שהוא כבר היום למחרת).
            if (endH < startH) {
                endBaseObj = addDays(startBaseObj, 1);
            } 
            
            newEndDate = format(endBaseObj, 'yyyy-MM-dd');
        }

        // 3. עדכון ה-State הסופי
        setStartDate(newStartDate);
        setStartTime(newStartTime);
        setEndDate(newEndDate);
        setEndTime(newEndTime);
        setCoverageType(type);
        setError('');
        
      } catch (e) {
        console.error("Date init error:", e);
      }
    }
  }, [isOpen, date, shift]);

  // Handle Full/Partial Toggle
  const handleTypeChange = (type) => {
    setCoverageType(type);
    setError(''); 
    
    // אם המשתמש לוחץ ידנית על "כן" (מלא), נאפס לברירת המחדל של 24 שעות
    if (type === 'full') {
        setStartTime('09:00');
        setEndTime('09:00');
        
        let dateObj = new Date(date);
        if (isValid(dateObj)) {
            setStartDate(format(dateObj, 'yyyy-MM-dd'));
            setEndDate(format(addDays(dateObj, 1), 'yyyy-MM-dd'));
        }
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    const startDateTime = new Date(`${startDate}T${startTime}`);
    const endDateTime = new Date(`${endDate}T${endTime}`);

    if (!isValid(startDateTime) || !isValid(endDateTime)) {
        setError('נא להזין תאריכים ושעות תקינים');
        return;
    }

    if (endDateTime <= startDateTime) {
        setError('שגיאה: שעת הסיום חייבת להיות אחרי שעת ההתחלה');
        return;
    }

    onSubmit({
      startDate,
      startTime,
      endDate,
      endTime,
      role: '', 
      department: ''
    });
  };

  if (!isOpen || !shift) return null;

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
          className="relative bg-white rounded-3xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-hidden flex flex-col"
        >
          {/* Header */}
          <div className="bg-[#42A5F5] p-6 text-white text-center relative">
            <button onClick={onClose} className="absolute top-4 left-4 p-2 rounded-full hover:bg-white/20">
              <X className="w-5 h-5" />
            </button>
            <div className="flex flex-col items-center gap-1">
                <div className="bg-white/20 p-2 rounded-xl mb-1">
                    <CheckCircle className="w-6 h-6 text-white" />
                </div>
                <h2 className="text-xl font-bold">כיסוי משמרת</h2>
                <p className="text-white/90 text-sm">
                  {date && format(new Date(date), 'EEEE, d בMMMM', { locale: he })}
                </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-5 overflow-y-auto">
            
            {/* Requester Info Box */}
            <div className="bg-red-100 rounded-xl p-4 border border-red-200 text-center shadow-sm">
                <p className="text-xs text-gray-500 mb-1">מבקש</p>
                <h3 className="text-xl font-bold text-gray-800 mb-2">{shift.role}</h3>
                
                {/* הצגת השעות המקוריות לכיסוי רק אם זה חלקי */}
                {shift.swap_start_time && shift.swap_end_time && (shift.swap_start_time !== '09:00' || shift.swap_end_time !== '09:00') && (
                    <div className="flex items-center justify-center gap-2 text-xs text-gray-600 bg-white/60 py-1.5 px-3 rounded-full mx-auto w-fit border border-red-100 mb-2">
                        <Clock className="w-3 h-3" />
                        <span>דרוש: {shift.swap_start_time} - {shift.swap_end_time}</span>
                    </div>
                )}

                <div className="flex items-center justify-center gap-2 text-xs text-gray-600 bg-white/60 py-1.5 px-3 rounded-full mx-auto w-fit border border-red-100">
                    <Clock className="w-3 h-3" />
                    <span>משמרת מלאה (24 שעות)</span>
                </div>
            </div>

            {/* Coverage Type Toggle */}
            <div className="space-y-2">
                <Label className="text-center block text-gray-700 font-medium">לכסות משמרת מלאה?</Label>
                <div className="grid grid-cols-2 gap-3">
                    <button
                        type="button"
                        onClick={() => handleTypeChange('partial')}
                        className={`p-4 rounded-xl border-2 transition-all text-center ${
                            coverageType === 'partial' 
                            ? 'border-blue-500 bg-blue-50 text-blue-700 font-bold shadow-sm' 
                            : 'border-gray-200 text-gray-600 hover:border-blue-200'
                        }`}
                    >
                        <span className="block text-lg">לא</span>
                        <span className="text-xs opacity-70">כיסוי חלקי</span>
                    </button>
                    <button
                        type="button"
                        onClick={() => handleTypeChange('full')}
                        className={`p-4 rounded-xl border-2 transition-all text-center ${
                            coverageType === 'full' 
                            ? 'border-blue-500 bg-blue-50 text-blue-700 font-bold shadow-sm' 
                            : 'border-gray-200 text-gray-600 hover:border-blue-200'
                        }`}
                    >
                        <span className="block text-lg">כן</span>
                        <span className="text-xs opacity-70">24 שעות</span>
                    </button>
                </div>
            </div>

            {/* CONDITIONAL RENDERING: Only show inputs if Partial is selected */}
            <AnimatePresence>
                {coverageType === 'partial' && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="space-y-4 overflow-hidden"
                    >
                        {/* Info Alert */}
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 flex items-start gap-2 mt-2">
                            <AlertCircle className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
                            <p className="text-xs text-blue-700 leading-tight">
                                המערכת טענה את השעות הנדרשות לכיסוי.<br/>
                                <span dir="ltr" className="font-bold">{startDate} {startTime} - {endDate} {endTime}</span>
                            </p>
                        </div>

                        {/* Vertical Time Inputs */}
                        <div className="space-y-4">
                            {/* Start */}
                            <div className="space-y-2">
                                <Label className="text-gray-700 font-bold text-sm">החל מ:</Label>
                                <div className="space-y-2">
                                    <div className="relative">
                                        <Label className="text-xs text-gray-400 absolute -top-2 right-2 bg-white px-1">החל מתאריך</Label>
                                        <Input 
                                            type="date" 
                                            value={startDate}
                                            onChange={(e) => setStartDate(e.target.value)}
                                            className="h-12 rounded-xl text-center bg-gray-50 border-gray-200 focus:bg-white transition-colors"
                                        />
                                    </div>
                                    <div className="relative">
                                        <Label className="text-xs text-gray-400 absolute -top-2 right-2 bg-white px-1">החל משעה</Label>
                                        <Input 
                                            type="time" 
                                            value={startTime} 
                                            onChange={(e) => setStartTime(e.target.value)}
                                            className="h-12 rounded-xl text-center bg-gray-50 border-gray-200 focus:bg-white transition-colors text-lg"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* End */}
                            <div className="space-y-2">
                                <Label className="text-gray-700 font-bold text-sm">ועד ל:</Label>
                                <div className="space-y-2">
                                    <div className="relative">
                                        <Label className="text-xs text-gray-400 absolute -top-2 right-2 bg-white px-1">ועד לתאריך</Label>
                                        <Input 
                                            type="date" 
                                            value={endDate}
                                            onChange={(e) => setEndDate(e.target.value)}
                                            className="h-12 rounded-xl text-center bg-gray-50 border-gray-200 focus:bg-white transition-colors"
                                        />
                                    </div>
                                    <div className="relative">
                                        <Label className="text-xs text-gray-400 absolute -top-2 right-2 bg-white px-1">עד לשעה</Label>
                                        <Input 
                                            type="time" 
                                            value={endTime} 
                                            onChange={(e) => setEndTime(e.target.value)}
                                            className="h-12 rounded-xl text-center bg-gray-50 border-gray-200 focus:bg-white transition-colors text-lg"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Error Message */}
            {error && (
              <div className="text-red-500 text-sm text-center bg-red-50 p-2 rounded-lg border border-red-100 font-medium">
                {error}
              </div>
            )}

            {/* Submit Button */}
            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full h-14 text-lg bg-[#42A5F5] hover:bg-[#2196F3] text-white rounded-xl shadow-lg shadow-blue-500/20"
            >
              {isSubmitting ? 'מעבד נתונים...' : 'אשר כיסוי'}
            </Button>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}