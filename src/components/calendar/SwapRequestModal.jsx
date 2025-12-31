import React, { useState, useEffect, useRef } from 'react';
import { format, addDays, parseISO, differenceInMinutes, addMinutes } from 'date-fns';
import { he } from 'date-fns/locale';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Clock, Calendar, AlertCircle, Send, CheckCircle2, ArrowLeftRight } from 'lucide-react';
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
  
  // Shift Limits
  const shiftStartStr = shift?.start_time || '09:00';
  const shiftEndStr = shift?.end_time || '09:00';
  
  const [startDate, setStartDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endDate, setEndDate] = useState('');
  const [endTime, setEndTime] = useState('');

  // Slider State (0 to 100 representing percentage of shift duration)
  const [sliderRange, setSliderRange] = useState([0, 100]); 

  // Derived Full Dates
  const shiftStartH = parseInt(shiftStartStr.split(':')[0]);
  const shiftEndH = parseInt(shiftEndStr.split(':')[0]);
  const sDateObj = date ? new Date(date) : new Date();
  const isOvernight = shiftEndH <= shiftStartH && !(shiftStartH === 9 && shiftEndH === 9); // Basic check
  const eDateObj = isOvernight ? addDays(sDateObj, 1) : sDateObj;

  // Initialize
  useEffect(() => {
    if (isOpen && date && shift) {
      setStartDate(format(sDateObj, 'yyyy-MM-dd'));
      setStartTime(shiftStartStr);
      setEndDate(format(eDateObj, 'yyyy-MM-dd'));
      setEndTime(shiftEndStr);
      setSliderRange([0, 100]);
    }
  }, [isOpen, date, shift]);

  // Helper: Convert time string to minutes from start of shift
  const getMinutesFromStart = (dateStr, timeStr) => {
      const current = new Date(`${dateStr}T${timeStr}`);
      const start = new Date(`${format(sDateObj, 'yyyy-MM-dd')}T${shiftStartStr}`);
      return differenceInMinutes(current, start);
  };

  // Helper: Convert minutes from start to Time String & Date String
  const getTimeFromMinutes = (minutes) => {
      const start = new Date(`${format(sDateObj, 'yyyy-MM-dd')}T${shiftStartStr}`);
      const newTime = addMinutes(start, minutes);
      return {
          date: format(newTime, 'yyyy-MM-dd'),
          time: format(newTime, 'HH:mm')
      };
  };

  // Total duration in minutes
  const totalDuration = React.useMemo(() => {
      const start = new Date(`${format(sDateObj, 'yyyy-MM-dd')}T${shiftStartStr}`);
      const end = new Date(`${format(eDateObj, 'yyyy-MM-dd')}T${shiftEndStr}`);
      // Handle the edge case of exactly 24h (same time next day)
      if (end <= start) return 24 * 60; 
      return differenceInMinutes(end, start);
  }, [sDateObj, eDateObj, shiftStartStr, shiftEndStr]);

  // Handle Slider Change
  const handleSliderChange = (e, index) => {
      const val = parseInt(e.target.value);
      const newRange = [...sliderRange];
      newRange[index] = val;
      
      // Prevent crossover
      if (index === 0 && val >= newRange[1]) newRange[0] = newRange[1] - 5;
      if (index === 1 && val <= newRange[0]) newRange[1] = newRange[0] + 5;

      setSliderRange(newRange);

      // Update Inputs
      const minutes = Math.round((newRange[index] / 100) * totalDuration);
      const { date: d, time: t } = getTimeFromMinutes(minutes);
      
      if (index === 0) {
          setStartDate(d);
          setStartTime(t);
      } else {
          setEndDate(d);
          setEndTime(t);
      }
  };

  // Handle Input Change (Update Slider)
  const handleInputChange = (type, value) => {
      // Basic validation logic would go here to clamp values to shift limits
      if (type === 'startTime') {
          setStartTime(value);
          // Recalc slider pos... (simplified for this example)
      }
      // ... similar for others
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const status = swapType === 'full' ? 'REQUIRES_FULL_COVERAGE' : 'REQUIRES_PARTIAL_COVERAGE';
    
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
                <div className="bg-white/20 p-2.5 rounded-xl backdrop-blur-sm shadow-inner">
                    <Calendar className="w-6 h-6" />
                </div>
                <div>
                    <h2 className="text-xl font-bold tracking-wide">בקשת החלפה</h2>
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
                <div className="flex items-center justify-between bg-gray-50 rounded-2xl p-1 border border-gray-100 shadow-sm">
                    {/* Start */}
                    <div className="flex-1 text-center py-3 border-l border-gray-200">
                        <p className="text-xs font-semibold text-gray-400 mb-1">התחלה</p>
                        <p className="text-xl font-bold text-gray-800 font-mono">{shiftStartStr}</p>
                    </div>
                    
                    {/* Center Info */}
                    <div className="flex-[1.5] text-center px-2">
                        <p className="text-xs text-gray-500 font-medium mb-1">משובץ כרגע</p>
                        <h3 className="text-lg font-bold text-[#EF5350] leading-tight">
                            {shift.assigned_role || shift.role}
                        </h3>
                    </div>

                    {/* End */}
                    <div className="flex-1 text-center py-3 border-r border-gray-200">
                        <p className="text-xs font-semibold text-gray-400 mb-1">סיום</p>
                        <p className="text-xl font-bold text-gray-800 font-mono">{shiftEndStr}</p>
                    </div>
                </div>
            )}

            {/* Separator */}
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

            {/* Partial Selection UI */}
            <AnimatePresence>
              {swapType === 'partial' && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden space-y-6"
                >
                  <div className="relative flex items-center justify-center mt-6 mb-2">
                    <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-dashed border-gray-300"></div>
                    </div>
                    <div className="relative bg-white px-4 text-sm font-bold text-[#EF5350]">
                        יש לבחור את שעות ההחלפה
                    </div>
                  </div>

                  {/* Visual Range Slider */}
                  <div className="px-2 pt-4 pb-2">
                      <div className="relative h-2 bg-gray-200 rounded-full">
                          {/* Active Range Bar */}
                          <div 
                              className="absolute h-full bg-[#EF5350] rounded-full"
                              style={{ 
                                  left: `${sliderRange[0]}%`, 
                                  width: `${sliderRange[1] - sliderRange[0]}%` 
                              }}
                          />
                          
                          {/* Left Thumb */}
                          <input 
                              type="range" 
                              min="0" max="100" 
                              value={sliderRange[0]} 
                              onChange={(e) => handleSliderChange(e, 0)}
                              className="absolute w-full h-full opacity-0 cursor-pointer z-10"
                          />
                          <div 
                              className="absolute w-5 h-5 bg-white border-2 border-[#EF5350] rounded-full -top-1.5 shadow-md pointer-events-none"
                              style={{ left: `${sliderRange[0]}%`, transform: 'translateX(-50%)' }}
                          />

                          {/* Right Thumb */}
                          <input 
                              type="range" 
                              min="0" max="100" 
                              value={sliderRange[1]} 
                              onChange={(e) => handleSliderChange(e, 1)}
                              className="absolute w-full h-full opacity-0 cursor-pointer z-10"
                          />
                          <div 
                              className="absolute w-5 h-5 bg-white border-2 border-[#EF5350] rounded-full -top-1.5 shadow-md pointer-events-none"
                              style={{ left: `${sliderRange[1]}%`, transform: 'translateX(-50%)' }}
                          />
                      </div>
                      <div className="flex justify-between text-xs text-gray-400 mt-2">
                          <span>{shiftStartStr}</span>
                          <span>{shiftEndStr}</span>
                      </div>
                  </div>

                  {/* Manual Inputs */}
                  <div className="bg-gray-50 rounded-2xl p-4 grid grid-cols-2 gap-4 border border-gray-100">
                    <div className="space-y-1">
                        <Label className="text-xs text-gray-500">התחלה</Label>
                        <Input
                            type="time"
                            value={startTime}
                            onChange={(e) => {
                                setStartTime(e.target.value);
                                // Logic to sync slider would go here
                            }}
                            className="bg-white border-gray-200 text-center h-10 font-mono text-lg"
                            dir="ltr"
                        />
                        <div className="text-[10px] text-center text-gray-400 mt-1">{startDate}</div>
                    </div>
                    <div className="space-y-1">
                        <Label className="text-xs text-gray-500">סיום</Label>
                        <Input
                            type="time"
                            value={endTime}
                            onChange={(e) => setEndTime(e.target.value)}
                            className="bg-white border-gray-200 text-center h-10 font-mono text-lg"
                            dir="ltr"
                        />
                        <div className="text-[10px] text-center text-gray-400 mt-1">{endDate}</div>
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
                    className="flex-[2] h-12 bg-gradient-to-r from-[#EF5350] to-[#E53935] hover:from-[#E53935] hover:to-[#D32F2F] text-white rounded-xl shadow-lg shadow-red-500/20 text-lg font-bold"
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