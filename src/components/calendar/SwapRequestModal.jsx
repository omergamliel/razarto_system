import React, { useState, useEffect } from 'react';
import { format, addDays, parseISO, isValid } from 'date-fns';
import { he } from 'date-fns/locale';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Clock, Calendar, AlertCircle, Send, CheckCircle2 } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

export default function SwapRequestModal({ 
  isOpen, 
  onClose, 
  date, 
  shift,
  onSubmit,
  isSubmitting
}) {
  const [swapType, setSwapType] = useState('full');
  const [startDate, setStartDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endDate, setEndDate] = useState('');
  const [endTime, setEndTime] = useState('');
  
  // Shift Limits (Defaults)
  const shiftStart = shift?.start_time || '09:00';
  const shiftEnd = shift?.end_time || '09:00';

  // Set default dates when modal opens
  useEffect(() => {
    if (isOpen && date && shift) {
      const sDate = new Date(date);
      setStartDate(format(sDate, 'yyyy-MM-dd'));
      setStartTime(shiftStart); // Default to shift start
      
      // Calculate end date based on time logic
      const isOvernight = parseInt(shiftEnd.split(':')[0]) <= parseInt(shiftStart.split(':')[0]);
      const eDate = isOvernight ? addDays(sDate, 1) : sDate;
      
      setEndDate(format(eDate, 'yyyy-MM-dd'));
      setEndTime(shiftEnd); // Default to shift end
    }
  }, [isOpen, date, shift, shiftStart, shiftEnd]);

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // לוגיקה חדשה: קביעת הסטטוס לפי סוג ההחלפה
    const status = swapType === 'full' 
      ? 'REQUIRES_FULL_COVERAGE' 
      : 'REQUIRES_PARTIAL_COVERAGE';

    onSubmit({
      swapType,
      status, 
      startDate: swapType === 'partial' ? startDate : null,
      startTime: swapType === 'partial' ? startTime : null,
      endDate: swapType === 'partial' ? endDate : null,
      endTime: swapType === 'partial' ? endTime : null
    });
  };
  
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4" dir="rtl">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        />

        {/* Modal */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative bg-white rounded-3xl shadow-2xl w-full max-w-lg max-h-[85vh] overflow-hidden flex flex-col"
        >
          {/* Header */}
          <div className="bg-[#EF5350] p-5 text-white flex justify-between items-center shrink-0">
             <div className="flex items-center gap-3">
                <div className="bg-white/20 p-2 rounded-xl backdrop-blur-sm">
                    <Calendar className="w-6 h-6" />
                </div>
                <div>
                    <h2 className="text-xl font-bold">בקשת החלפה</h2>
                    <p className="text-white/80 text-sm">
                        {date && format(date, 'd בMMMM yyyy', { locale: he })}
                    </p>
                </div>
             </div>
             <button onClick={onClose} className="p-2 rounded-full hover:bg-white/20 transition-colors">
                <X className="w-5 h-5" />
             </button>
          </div>

          {/* Content */}
          <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
            
            {/* Current Assignment Card */}
            {shift && (
              <div className="bg-gray-50 border border-gray-100 rounded-2xl p-4 text-center">
                <p className="text-xs text-gray-400 font-medium mb-1">משובץ כרגע</p>
                <h3 className="text-xl font-bold text-gray-800">{shift.assigned_role || shift.role}</h3>
                <div className="flex justify-center items-center gap-2 mt-2 text-sm text-gray-500">
                    <Clock className="w-4 h-4" />
                    <span dir="ltr">{shiftStart} - {shiftEnd}</span>
                </div>
              </div>
            )}

            {/* Separator with Text */}
            <div className="relative flex items-center justify-center my-4">
                <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-200"></div>
                </div>
                <div className="relative bg-white px-4 text-sm font-medium text-gray-500">
                    יש לבחור את סוג ההחלפה
                </div>
            </div>

            {/* Swap Type Selection */}
            <RadioGroup 
                value={swapType} 
                onValueChange={setSwapType}
                className="grid grid-cols-2 gap-4"
            >
                {/* Full Shift Option */}
                <label className={`
                    relative flex flex-col items-center justify-center p-4 rounded-2xl border-2 cursor-pointer transition-all h-28
                    ${swapType === 'full' 
                    ? 'border-[#EF5350] bg-red-50 text-[#EF5350]' 
                    : 'border-gray-200 hover:border-gray-300 text-gray-600'
                    }
                `}>
                    <RadioGroupItem value="full" className="sr-only" />
                    <Clock className="w-6 h-6 mb-2" />
                    <span className="font-bold">משמרת מלאה</span>
                    <span className="text-xs opacity-70 mt-1">כל השעות</span>
                    {swapType === 'full' && (
                        <div className="absolute top-2 right-2 text-[#EF5350]">
                            <CheckCircle2 className="w-5 h-5" />
                        </div>
                    )}
                </label>
                
                {/* Partial Shift Option */}
                <label className={`
                    relative flex flex-col items-center justify-center p-4 rounded-2xl border-2 cursor-pointer transition-all h-28
                    ${swapType === 'partial' 
                    ? 'border-[#EF5350] bg-red-50 text-[#EF5350]' 
                    : 'border-gray-200 hover:border-gray-300 text-gray-600'
                    }
                `}>
                    <RadioGroupItem value="partial" className="sr-only" />
                    <AlertCircle className="w-6 h-6 mb-2" />
                    <span className="font-bold">החלפה חלקית</span>
                    <span className="text-xs opacity-70 mt-1">שעות מסוימות</span>
                    {swapType === 'partial' && (
                        <div className="absolute top-2 right-2 text-[#EF5350]">
                            <CheckCircle2 className="w-5 h-5" />
                        </div>
                    )}
                </label>
            </RadioGroup>

            {/* Date & Time Selection (for partial) */}
            <AnimatePresence>
              {swapType === 'partial' && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden"
                >
                  <div className="relative flex items-center justify-center my-6">
                    <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-dashed border-gray-300"></div>
                    </div>
                    <div className="relative bg-white px-4 text-sm font-bold text-[#EF5350]">
                        יש לבחור את שעות ההחלפה
                    </div>
                  </div>

                  <div className="bg-gray-50 rounded-2xl p-5 space-y-5 border border-gray-100">
                    {/* Start Time */}
                    <div className="space-y-2">
                        <Label className="text-gray-700 font-bold">החל מ:</Label>
                        <div className="flex gap-3">
                            <div className="relative flex-1">
                                <span className="absolute -top-2.5 right-3 bg-gray-50 px-1 text-xs text-gray-500">תאריך</span>
                                <Input
                                    type="date"
                                    value={startDate}
                                    onChange={(e) => setStartDate(e.target.value)}
                                    className="bg-white h-12 rounded-xl border-gray-200 focus:border-[#EF5350] text-center"
                                />
                            </div>
                            <div className="relative flex-1">
                                <span className="absolute -top-2.5 right-3 bg-gray-50 px-1 text-xs text-gray-500">שעה</span>
                                <Input
                                    type="time"
                                    value={startTime}
                                    onChange={(e) => setStartTime(e.target.value)}
                                    className="bg-white h-12 rounded-xl border-gray-200 focus:border-[#EF5350] text-center text-lg"
                                    dir="ltr"
                                />
                            </div>
                        </div>
                    </div>

                    {/* End Time */}
                    <div className="space-y-2">
                        <Label className="text-gray-700 font-bold">ועד ל:</Label>
                        <div className="flex gap-3">
                            <div className="relative flex-1">
                                <span className="absolute -top-2.5 right-3 bg-gray-50 px-1 text-xs text-gray-500">תאריך</span>
                                <Input
                                    type="date"
                                    value={endDate}
                                    onChange={(e) => setEndDate(e.target.value)}
                                    className="bg-white h-12 rounded-xl border-gray-200 focus:border-[#EF5350] text-center"
                                />
                            </div>
                            <div className="relative flex-1">
                                <span className="absolute -top-2.5 right-3 bg-gray-50 px-1 text-xs text-gray-500">שעה</span>
                                <Input
                                    type="time"
                                    value={endTime}
                                    onChange={(e) => setEndTime(e.target.value)}
                                    className="bg-white h-12 rounded-xl border-gray-200 focus:border-[#EF5350] text-center text-lg"
                                    dir="ltr"
                                />
                            </div>
                        </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

          </form>

          {/* Footer Actions */}
          <div className="p-6 pt-0 border-t border-gray-50 mt-auto bg-white">
            <div className="flex gap-3 mt-4">
                <Button
                    onClick={onClose}
                    variant="outline"
                    className="flex-1 h-12 rounded-xl border-gray-200 text-gray-600 hover:bg-gray-50"
                >
                    ביטול
                </Button>
                <Button
                    onClick={handleSubmit}
                    disabled={isSubmitting}
                    className="flex-[2] h-12 bg-[#EF5350] hover:bg-[#E53935] text-white rounded-xl shadow-lg shadow-red-500/20 text-lg font-medium"
                >
                    {isSubmitting ? 'שולח...' : (
                        <div className="flex items-center justify-center gap-2">
                            <span>בקש החלפה</span>
                            <Send className="w-4 h-4 rotate-180" />
                        </div>
                    )}
                </Button>
            </div>
          </div>

        </motion.div>
      </div>
    </AnimatePresence>
  );
}