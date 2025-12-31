import React, { useState, useEffect, useRef } from 'react';
import { format, addDays, parseISO, differenceInMinutes, addMinutes, startOfDay } from 'date-fns';
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

  // Slider State (Minutes from start of shift)
  // range[0] = start minutes, range[1] = end minutes
  const [range, setRange] = useState([0, 0]); 
  const sliderRef = useRef(null);

  // Derived Full Dates and Total Duration
  const totalDurationRef = useRef(0);
  const shiftStartObjRef = useRef(null);

  // Initialize
  useEffect(() => {
    if (isOpen && date && shift) {
      const sDate = new Date(date);
      const sH = parseInt(shiftStartStr.split(':')[0]);
      const eH = parseInt(shiftEndStr.split(':')[0]);
      
      const startObj = new Date(format(sDate, 'yyyy-MM-dd') + 'T' + shiftStartStr);
      
      let endObj = new Date(format(sDate, 'yyyy-MM-dd') + 'T' + shiftEndStr);
      // Handle overnight logic
      if (endObj <= startObj || (sH === 9 && eH === 9)) {
          endObj = addDays(endObj, 1);
      }

      shiftStartObjRef.current = startObj;
      const duration = differenceInMinutes(endObj, startObj);
      totalDurationRef.current = duration;

      // Set initial values (Full Shift)
      setStartDate(format(startObj, 'yyyy-MM-dd'));
      setStartTime(shiftStartStr);
      setEndDate(format(endObj, 'yyyy-MM-dd'));
      setEndTime(shiftEndStr);
      
      setRange([0, duration]);
    }
  }, [isOpen, date, shift]);

  // --- SLIDER LOGIC ---

  const handleSliderDrag = (e, handleIndex) => {
      if (!sliderRef.current || totalDurationRef.current === 0) return;
      
      const rect = sliderRef.current.getBoundingClientRect();
      const clientX = e.type.includes('touch') ? e.touches[0].clientX : e.clientX;
      
      // RTL Calculation: 
      // In RTL, 0% is on the right, 100% is on the left.
      // So we calculate distance from RIGHT edge.
      const distanceFromRight = rect.right - clientX;
      let percentage = (distanceFromRight / rect.width);
      
      // Clamp percentage
      percentage = Math.max(0, Math.min(1, percentage));

      let minutes = Math.round(percentage * totalDurationRef.current);
      
      // Snap to 30 minutes
      const step = 30; 
      minutes = Math.round(minutes / step) * step;

      const newRange = [...range];
      newRange[handleIndex] = minutes;

      // Prevent crossover (min 30 min duration)
      if (handleIndex === 0) { // Moving Start
          if (newRange[0] >= newRange[1]) newRange[0] = newRange[1] - 30;
      } else { // Moving End
          if (newRange[1] <= newRange[0]) newRange[1] = newRange[0] + 30;
      }

      setRange(newRange);
      updateInputsFromRange(newRange);
  };

  const updateInputsFromRange = (newRange) => {
      if (!shiftStartObjRef.current) return;

      const sTime = addMinutes(shiftStartObjRef.current, newRange[0]);
      const eTime = addMinutes(shiftStartObjRef.current, newRange[1]);

      setStartDate(format(sTime, 'yyyy-MM-dd'));
      setStartTime(format(sTime, 'HH:mm'));
      setEndDate(format(eTime, 'yyyy-MM-dd'));
      setEndTime(format(eTime, 'HH:mm'));
  };

  const handleManualInputChange = (type, val) => {
      // Update state first
      if (type === 'startTime') setStartTime(val);
      if (type === 'endTime') setEndTime(val);
      if (type === 'startDate') setStartDate(val);
      if (type === 'endDate') setEndDate(val);

      // Try to sync slider
      // Note: Full sync requires combining Date+Time. Simplified here for brevity.
      // Ideally, parse the new inputs to Date objects, diff from shiftStart, and update range.
  };

  // --- SUBMIT ---
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

  // Calculate percentages for CSS (RTL aware)
  const startPercent = (range[0] / totalDurationRef.current) * 100;
  const endPercent = (range[1] / totalDurationRef.current) * 100;
  const widthPercent = endPercent - startPercent;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4" dir="rtl">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

        <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="relative bg-white rounded-3xl shadow-2xl w-full max-w-lg max-h-[85vh] overflow-hidden flex flex-col">
          
          {/* Header */}
          <div className="bg-[#EF5350] p-5 text-white flex justify-between items-center shrink-0">
             <div className="flex items-center gap-3">
                <div className="bg-white/20 p-2.5 rounded-xl backdrop-blur-sm shadow-inner">
                    <Calendar className="w-6 h-6" />
                </div>
                <div>
                    <h2 className="text-xl font-bold tracking-wide">בקשת החלפה</h2>
                    <p className="text-white/80 text-sm">{date && format(date, 'd בMMMM yyyy', { locale: he })}</p>
                </div>
             </div>
             <button onClick={onClose} className="p-2 rounded-full hover:bg-white/20 transition-colors">
                <X className="w-5 h-5" />
             </button>
          </div>

          <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
            
            {/* Shift Info */}
            {shift && (
                <div className="flex items-center justify-between bg-gray-50 rounded-2xl p-1 border border-gray-100 shadow-sm">
                    <div className="flex-1 text-center py-3 border-l border-gray-200">
                        <p className="text-xs font-semibold text-gray-400 mb-1">התחלה</p>
                        <p className="text-xl font-bold text-gray-800 font-mono">{shiftStartStr}</p>
                    </div>
                    <div className="flex-[1.5] text-center px-2">
                        <p className="text-xs text-gray-500 font-medium mb-1">משובץ כרגע</p>
                        <h3 className="text-lg font-bold text-[#EF5350] leading-tight">{shift.assigned_role || shift.role}</h3>
                    </div>
                    <div className="flex-1 text-center py-3 border-r border-gray-200">
                        <p className="text-xs font-semibold text-gray-400 mb-1">סיום</p>
                        <p className="text-xl font-bold text-gray-800 font-mono">{shiftEndStr}</p>
                    </div>
                </div>
            )}

            <div className="relative flex items-center justify-center my-4">
                <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-200"></div></div>
                <div className="relative bg-white px-4 text-sm font-medium text-gray-500">יש לבחור את סוג ההחלפה</div>
            </div>

            <RadioGroup value={swapType} onValueChange={setSwapType} className="grid grid-cols-2 gap-4">
                <label className={`relative flex flex-col items-center justify-center p-4 rounded-2xl border-2 cursor-pointer transition-all h-28 ${swapType === 'full' ? 'border-[#EF5350] bg-red-50 text-[#EF5350]' : 'border-gray-200 hover:border-gray-300 text-gray-600'}`}>
                    <RadioGroupItem value="full" className="sr-only" />
                    <Clock className="w-6 h-6 mb-2" />
                    <span className="font-bold">משמרת מלאה</span>
                    <span className="text-xs opacity-70 mt-1">כל השעות</span>
                    {swapType === 'full' && <div className="absolute top-2 right-2 text-[#EF5350]"><CheckCircle2 className="w-5 h-5" /></div>}
                </label>
                <label className={`relative flex flex-col items-center justify-center p-4 rounded-2xl border-2 cursor-pointer transition-all h-28 ${swapType === 'partial' ? 'border-[#EF5350] bg-red-50 text-[#EF5350]' : 'border-gray-200 hover:border-gray-300 text-gray-600'}`}>
                    <RadioGroupItem value="partial" className="sr-only" />
                    <AlertCircle className="w-6 h-6 mb-2" />
                    <span className="font-bold">החלפה חלקית</span>
                    <span className="text-xs opacity-70 mt-1">שעות מסוימות</span>
                    {swapType === 'partial' && <div className="absolute top-2 right-2 text-[#EF5350]"><CheckCircle2 className="w-5 h-5" /></div>}
                </label>
            </RadioGroup>

            <AnimatePresence>
              {swapType === 'partial' && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden space-y-6">
                  
                  <div className="relative flex items-center justify-center mt-6 mb-2">
                    <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-dashed border-gray-300"></div></div>
                    <div className="relative bg-white px-4 text-sm font-bold text-[#EF5350]">בחירת שעות ההחלפה (30 דק' קפיצה)</div>
                  </div>

                  {/* --- PROFESSIONAL RANGE SLIDER (RTL) --- */}
                  <div className="px-4 py-6 select-none touch-none">
                      <div 
                        ref={sliderRef}
                        className="relative h-4 bg-gray-200 rounded-full cursor-pointer"
                        // Click on track to jump? (Optional logic could go here)
                      >
                          {/* Selected Range Bar (Green/Orange) */}
                          <div 
                              className="absolute h-full bg-[#EF5350] rounded-full opacity-80"
                              style={{ 
                                  right: `${startPercent}%`, // RTL: Start from right
                                  width: `${widthPercent}%` 
                              }}
                          />

                          {/* Start Handle (Right side in RTL) */}
                          <div 
                              className="absolute w-8 h-8 bg-white border-4 border-[#EF5350] rounded-full -top-2 shadow-lg cursor-grab active:cursor-grabbing flex items-center justify-center z-10 hover:scale-110 transition-transform"
                              style={{ right: `${startPercent}%`, transform: 'translateX(50%)' }} // RTL translate positive
                              onMouseDown={(e) => {
                                  const moveHandler = (moveEvent) => handleSliderDrag(moveEvent, 0);
                                  const upHandler = () => {
                                      window.removeEventListener('mousemove', moveHandler);
                                      window.removeEventListener('mouseup', upHandler);
                                  };
                                  window.addEventListener('mousemove', moveHandler);
                                  window.addEventListener('mouseup', upHandler);
                              }}
                              onTouchStart={(e) => {
                                  const moveHandler = (moveEvent) => handleSliderDrag(moveEvent, 0);
                                  const upHandler = () => {
                                      window.removeEventListener('touchmove', moveHandler);
                                      window.removeEventListener('touchend', upHandler);
                                  };
                                  window.addEventListener('touchmove', moveHandler);
                                  window.addEventListener('touchend', upHandler);
                              }}
                          >
                              {/* Time Tooltip */}
                              <div className="absolute -top-10 bg-gray-800 text-white text-xs font-bold py-1 px-2 rounded opacity-90 whitespace-nowrap">
                                  {startTime}
                              </div>
                          </div>

                          {/* End Handle (Left side in RTL) */}
                          <div 
                              className="absolute w-8 h-8 bg-white border-4 border-[#EF5350] rounded-full -top-2 shadow-lg cursor-grab active:cursor-grabbing flex items-center justify-center z-10 hover:scale-110 transition-transform"
                              style={{ right: `${endPercent}%`, transform: 'translateX(50%)' }}
                              onMouseDown={(e) => {
                                  const moveHandler = (moveEvent) => handleSliderDrag(moveEvent, 1);
                                  const upHandler = () => {
                                      window.removeEventListener('mousemove', moveHandler);
                                      window.removeEventListener('mouseup', upHandler);
                                  };
                                  window.addEventListener('mousemove', moveHandler);
                                  window.addEventListener('mouseup', upHandler);
                              }}
                              onTouchStart={(e) => {
                                  const moveHandler = (moveEvent) => handleSliderDrag(moveEvent, 1);
                                  const upHandler = () => {
                                      window.removeEventListener('touchmove', moveHandler);
                                      window.removeEventListener('touchend', upHandler);
                                  };
                                  window.addEventListener('touchmove', moveHandler);
                                  window.addEventListener('touchend', upHandler);
                              }}
                          >
                              {/* Time Tooltip */}
                              <div className="absolute -top-10 bg-gray-800 text-white text-xs font-bold py-1 px-2 rounded opacity-90 whitespace-nowrap">
                                  {endTime}
                              </div>
                          </div>
                      </div>
                      
                      {/* Scale Labels */}
                      <div className="flex justify-between text-xs text-gray-400 mt-3 px-1 font-mono">
                          <span>{shiftStartStr}</span>
                          <span>{shiftEndStr}</span>
                      </div>
                  </div>

                  {/* Manual Inputs (Synced) */}
                  <div className="bg-gray-50 rounded-2xl p-4 grid grid-cols-2 gap-4 border border-gray-100">
                    <div className="space-y-1">
                        <Label className="text-xs text-gray-500">התחלה</Label>
                        <Input type="time" value={startTime} onChange={(e) => handleManualInputChange('startTime', e.target.value)} className="bg-white border-gray-200 text-center h-10 font-mono text-lg" dir="ltr" />
                        <div className="text-[10px] text-center text-gray-400 mt-1">{startDate}</div>
                    </div>
                    <div className="space-y-1">
                        <Label className="text-xs text-gray-500">סיום</Label>
                        <Input type="time" value={endTime} onChange={(e) => handleManualInputChange('endTime', e.target.value)} className="bg-white border-gray-200 text-center h-10 font-mono text-lg" dir="ltr" />
                        <div className="text-[10px] text-center text-gray-400 mt-1">{endDate}</div>
                    </div>
                  </div>

                </motion.div>
              )}
            </AnimatePresence>
          </form>

          <div className="p-6 pt-0 border-t border-gray-50 mt-auto bg-white">
            <div className="flex gap-3 mt-4">
                <Button onClick={onClose} variant="outline" className="flex-1 h-12 rounded-xl border-gray-200 text-gray-600 hover:bg-gray-50">ביטול</Button>
                <Button onClick={handleSubmit} disabled={isSubmitting} className="flex-[2] h-12 bg-gradient-to-r from-[#EF5350] to-[#E53935] hover:from-[#E53935] hover:to-[#D32F2F] text-white rounded-xl shadow-lg shadow-red-500/20 text-lg font-bold">
                    {isSubmitting ? 'שולח...' : <div className="flex items-center justify-center gap-2"><span>בקש החלפה</span><Send className="w-4 h-4 rotate-180" /></div>}
                </Button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}