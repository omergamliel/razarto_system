import React, { useState, useEffect, useRef } from 'react';
import { format, addDays, parseISO, differenceInMinutes, addMinutes, startOfDay } from 'date-fns';
import { he } from 'date-fns/locale';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Clock, Calendar, AlertCircle, Send, CheckCircle2, ArrowLeftRight, CalendarDays, Timer } from 'lucide-react';
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
  
  // State for raw values (ISO for logic)
  const [startDate, setStartDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endDate, setEndDate] = useState('');
  const [endTime, setEndTime] = useState('');

  // Slider State
  const [range, setRange] = useState([0, 0]); 
  const sliderRef = useRef(null);

  // Derived Values
  const totalDurationRef = useRef(0);
  const shiftStartObjRef = useRef(null);
  const shiftEndObjRef = useRef(null);

  // Initialize
  useEffect(() => {
    if (isOpen && date && shift) {
      // Use DB dates if available, fallback to clicked date
      const sDateStr = shift.start_date || format(date, 'yyyy-MM-dd');
      const sDate = new Date(sDateStr);
      
      const sH = parseInt(shiftStartStr.split(':')[0]);
      const eH = parseInt(shiftEndStr.split(':')[0]);
      
      const startObj = new Date(sDateStr + 'T' + shiftStartStr);
      let endObj = shift.end_date 
          ? new Date(shift.end_date + 'T' + shiftEndStr)
          : new Date(sDateStr + 'T' + shiftEndStr);
      
      // Fix end date logic if not explicitly provided
      if (!shift.end_date && (endObj <= startObj || (sH === 9 && eH === 9))) {
          endObj = addDays(endObj, 1);
      }

      shiftStartObjRef.current = startObj;
      shiftEndObjRef.current = endObj;
      const duration = differenceInMinutes(endObj, startObj);
      totalDurationRef.current = duration;

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
      
      // RTL Calculation
      const distanceFromRight = rect.right - clientX;
      let percentage = (distanceFromRight / rect.width);
      percentage = Math.max(0, Math.min(1, percentage));

      let minutes = Math.round(percentage * totalDurationRef.current);
      
      // Snap to 30 minutes
      const step = 30; 
      minutes = Math.round(minutes / step) * step;

      const newRange = [...range];
      newRange[handleIndex] = minutes;

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
      if (type === 'startTime') setStartTime(val);
      if (type === 'endTime') setEndTime(val);
      // For simplicity, date inputs are read-only when using slider in this advanced mode
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Construct the payload for ShiftCalendar's requestSwapMutation
    // Important: For full swap, use original shift times/dates to ensure correctness
    const payload = {
      type: swapType, // 'full' or 'partial'
      startDate: swapType === 'partial' ? startDate : (shift.start_date || startDate),
      startTime: swapType === 'partial' ? startTime : (shift.start_time || '09:00'),
      endDate: swapType === 'partial' ? endDate : (shift.end_date || endDate),
      endTime: swapType === 'partial' ? endTime : (shift.end_time || '09:00')
    };

    onSubmit(payload);
  };
  
  if (!isOpen || !shift) return null;

  const startPercent = (range[0] / totalDurationRef.current) * 100;
  const endPercent = (range[1] / totalDurationRef.current) * 100;
  const widthPercent = endPercent - startPercent;

  // Calculate selected duration for display
  const selectedDurationMinutes = range[1] - range[0];
  const selectedDurationHours = selectedDurationMinutes / 60;
  const isFullDuration = selectedDurationMinutes === totalDurationRef.current;

  // Format date helper for display (dd/MM/yyyy)
  const formatDisplayDate = (isoDateStr) => {
      if (!isoDateStr) return '';
      return format(new Date(isoDateStr), 'dd/MM/yyyy');
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4" dir="rtl">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

        <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="relative bg-white rounded-3xl shadow-2xl w-full max-w-lg max-h-[95vh] overflow-hidden flex flex-col font-sans">
          
          {/* Header */}
          <div className="bg-[#EF5350] p-5 text-white flex justify-between items-center shrink-0">
             <div className="flex items-center gap-3">
                <div className="bg-white/20 p-2.5 rounded-xl backdrop-blur-sm shadow-inner">
                    <Calendar className="w-6 h-6" />
                </div>
                <div>
                    <h2 className="text-xl font-bold tracking-wide">בקשת החלפה</h2>
                    <p className="text-white/80 text-sm">{date && format(new Date(date), 'd בMMMM yyyy', { locale: he })}</p>
                </div>
             </div>
             <button onClick={onClose} className="p-2 rounded-full hover:bg-white/20 transition-colors">
                <X className="w-5 h-5" />
             </button>
          </div>

          <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent">
            
            {/* Current Assignment Card */}
            <div className="text-center space-y-4">
                <div>
                    <p className="text-sm text-gray-400 font-medium mb-1">משובץ כרגע לתפקיד</p>
                    <h3 className="text-3xl font-extrabold text-gray-800 leading-none font-sans">
                        {shift.user_name || shift.role}
                    </h3>
                </div>

                <div className="flex items-center justify-between bg-gray-50 rounded-2xl p-1 border border-gray-100 shadow-sm">
                    {/* Start Time Block */}
                    <div className="flex-1 text-center py-3">
                        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">
                            {shiftStartObjRef.current && format(shiftStartObjRef.current, 'EEEE', { locale: he })}
                        </p>
                        <p className="text-xl font-bold text-gray-800 leading-none mb-1 font-mono">
                            {shiftStartStr}
                        </p>
                        <p className="text-[11px] text-gray-400">
                            {shiftStartObjRef.current && format(shiftStartObjRef.current, 'dd/MM/yyyy')}
                        </p>
                    </div>

                    <div className="flex flex-col items-center justify-center px-2">
                        <div className="h-6 w-px bg-gray-200 mb-1"></div>
                        <ArrowLeftRight className="w-4 h-4 text-gray-300" />
                        <div className="h-6 w-px bg-gray-200 mt-1"></div>
                    </div>

                    {/* End Time Block */}
                    <div className="flex-1 text-center py-3">
                        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">
                            {shiftEndObjRef.current && format(shiftEndObjRef.current, 'EEEE', { locale: he })}
                        </p>
                        <p className="text-xl font-bold text-gray-800 leading-none mb-1 font-mono">
                            {shiftEndStr}
                        </p>
                        <p className="text-[11px] text-gray-400">
                            {shiftEndObjRef.current && format(shiftEndObjRef.current, 'dd/MM/yyyy')}
                        </p>
                    </div>
                </div>
            </div>

            <div className="relative flex items-center justify-center my-5">
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
                  
                  <div className="text-center mt-6 mb-2">
                    <p className="text-sm font-bold text-[#EF5350] mb-1">בחירת שעות ההחלפה</p>
                    <p className="text-xs text-gray-500">ניתן לבחור באמצעות הזזת הסליידר או הזנה ידנית במלבן שמתחת</p>
                  </div>

                  {/* --- PROFESSIONAL RANGE SLIDER --- */}
                  <div className="px-4 py-8 select-none touch-none bg-gray-50 rounded-2xl border border-gray-100 shadow-sm relative">
                      
                      {/* Top Labels */}
                      <div className="flex justify-between text-xs font-bold text-gray-600 mb-3 px-1">
                          <div className="text-center">
                              <span>התחלה</span>
                              <div className="text-[10px] font-normal text-gray-400 mt-0.5">{startDate && formatDisplayDate(startDate)}</div>
                          </div>
                          <div className="text-center">
                              <span>סיום</span>
                              <div className="text-[10px] font-normal text-gray-400 mt-0.5">{endDate && formatDisplayDate(endDate)}</div>
                          </div>
                      </div>

                      <div 
                        ref={sliderRef}
                        className="relative h-3 bg-gray-200 rounded-full cursor-pointer"
                      >
                          {/* Selected Range Bar */}
                          <div 
                              className="absolute h-full bg-[#EF5350] rounded-full opacity-90 shadow-sm"
                              style={{ 
                                  right: `${startPercent}%`, 
                                  width: `${widthPercent}%` 
                              }}
                          />

                          {/* Start Handle */}
                          <div 
                              className="absolute w-7 h-7 bg-white border-[3px] border-[#EF5350] rounded-full -top-2 shadow-md cursor-grab active:cursor-grabbing flex items-center justify-center z-10 hover:scale-110 transition-transform outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#EF5350]"
                              style={{ right: `${startPercent}%`, transform: 'translateX(50%)' }}
                              tabIndex={0}
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
                              <div className="absolute -top-9 bg-[#EF5350] text-white text-xs font-bold py-1 px-2 rounded-md shadow-sm whitespace-nowrap after:content-[''] after:absolute after:top-full after:left-1/2 after:-translate-x-1/2 after:border-4 after:border-transparent after:border-t-[#EF5350]">
                                  {startTime}
                              </div>
                          </div>

                          {/* End Handle */}
                          <div 
                              className="absolute w-7 h-7 bg-white border-[3px] border-[#EF5350] rounded-full -top-2 shadow-md cursor-grab active:cursor-grabbing flex items-center justify-center z-10 hover:scale-110 transition-transform outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#EF5350]"
                              style={{ right: `${endPercent}%`, transform: 'translateX(50%)' }}
                              tabIndex={0}
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
                              <div className="absolute -top-9 bg-[#EF5350] text-white text-xs font-bold py-1 px-2 rounded-md shadow-sm whitespace-nowrap after:content-[''] after:absolute after:top-full after:left-1/2 after:-translate-x-1/2 after:border-4 after:border-transparent after:border-t-[#EF5350]">
                                  {endTime}
                              </div>
                          </div>
                      </div>
                  </div>

                  {/* Dynamic Duration Labels */}
                  {!isFullDuration && (
                      <div className="flex justify-center -mt-3">
                          <motion.div 
                            initial={{ opacity: 0, y: -10 }} 
                            animate={{ opacity: 1, y: 0 }} 
                            className="bg-orange-100 text-orange-700 px-4 py-1.5 rounded-full text-sm font-bold flex items-center gap-2 shadow-sm border border-orange-200"
                          >
                              <Timer className="w-4 h-4" />
                              הטווח הנבחר: {selectedDurationHours} שעות במצטבר
                          </motion.div>
                      </div>
                  )}

                  {/* Manual Inputs */}
                  <div className="bg-white rounded-2xl p-5 grid grid-cols-2 gap-6 border border-gray-100 shadow-sm">
                    <div className="space-y-2">
                        <Label className="text-sm font-semibold text-gray-700 flex items-center gap-1.5">
                            <Clock className="w-4 h-4 text-gray-400" />
                            התחלה
                        </Label>
                        <div className="relative">
                            <Input type="time" value={startTime} onChange={(e) => handleManualInputChange('startTime', e.target.value)} className="pl-10 text-center h-14 font-mono text-xl border-gray-200 focus:border-[#EF5350] focus:ring-[#EF5350]" dir="ltr" />
                            <div className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 flex items-center justify-center pointer-events-none">
                                <span className="text-gray-400 text-xs">🕒</span>
                            </div>
                        </div>
                        <div className="flex items-center justify-center gap-1.5 text-xs font-medium text-gray-500 mt-1 bg-gray-50 py-1.5 rounded-md">
                            <CalendarDays className="w-3 h-3" />
                            {startDate && formatDisplayDate(startDate)}
                        </div>
                    </div>
                    
                    <div className="space-y-2">
                        <Label className="text-sm font-semibold text-gray-700 flex items-center gap-1.5">
                            <Clock className="w-4 h-4 text-gray-400" />
                            סיום
                        </Label>
                        <div className="relative">
                            <Input type="time" value={endTime} onChange={(e) => handleManualInputChange('endTime', e.target.value)} className="pl-10 text-center h-14 font-mono text-xl border-gray-200 focus:border-[#EF5350] focus:ring-[#EF5350]" dir="ltr" />
                            <div className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 flex items-center justify-center pointer-events-none">
                                <span className="text-gray-400 text-xs">🕒</span>
                            </div>
                        </div>
                        <div className="flex items-center justify-center gap-1.5 text-xs font-medium text-gray-500 mt-1 bg-gray-50 py-1.5 rounded-md">
                            <CalendarDays className="w-3 h-3" />
                            {endDate && formatDisplayDate(endDate)}
                        </div>
                    </div>
                  </div>

                </motion.div>
              )}
            </AnimatePresence>
          </form>

          <div className="p-6 pt-0 border-t border-gray-50 mt-auto bg-white">
            <div className="flex gap-3 mt-4">
                <Button onClick={handleSubmit} disabled={isSubmitting} className="flex-[2] h-12 bg-gradient-to-r from-[#EF5350] to-[#E53935] hover:from-[#E53935] hover:to-[#D32F2F] text-white rounded-xl shadow-lg shadow-red-500/20 text-lg font-bold transition-all hover:scale-[1.02] active:scale-[0.98]">
                    {isSubmitting ? 'שולח...' : <div className="flex items-center justify-center gap-2"><span>בקש החלפה</span><Send className="w-4 h-4 rotate-180" /></div>}
                </Button>
                <Button onClick={onClose} variant="outline" className="flex-1 h-12 rounded-xl border-gray-200 text-gray-600 hover:bg-gray-50">ביטול</Button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}