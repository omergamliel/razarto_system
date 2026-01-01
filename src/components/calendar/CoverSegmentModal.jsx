import React, { useState, useEffect, useRef } from 'react';
import { format, addDays, parseISO, isValid, differenceInMinutes, addMinutes } from 'date-fns';
import { he } from 'date-fns/locale';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Clock, CheckCircle, AlertCircle } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';

export default function CoverSegmentModal({ 
  isOpen, 
  onClose, 
  shift,
  date,
  onSubmit,
  isSubmitting
}) {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('09:00');
  const [coverageType, setCoverageType] = useState('full');
  const [error, setError] = useState('');

  const [range, setRange] = useState([0, 0]);
  const sliderRef = useRef(null);
  const totalDurationRef = useRef(0);
  const shiftStartObjRef = useRef(null);
  const shiftEndObjRef = useRef(null);

  const { data: existingCoverages = [] } = useQuery({
    queryKey: ['shift-coverages-modal', shift?.id],
    queryFn: async () => {
      if (!shift?.id) return [];
      return await base44.entities.ShiftCoverage.filter({ shift_id: shift.id });
    },
    enabled: !!shift?.id && isOpen
  });

  useEffect(() => {
    if (isOpen && shift) {
      try {
        const baseDateInput = date || shift.start_date || new Date();
        const baseDateObj = isValid(new Date(baseDateInput)) ? new Date(baseDateInput) : parseISO(baseDateInput);
        const shiftStartStr = shift.start_time || '09:00';
        const shiftEndStr = shift.end_time || '09:00';

        const startObj = new Date(`${format(baseDateObj, 'yyyy-MM-dd')}T${shiftStartStr}`);
        let endObj;
        if (shift.end_date) {
          endObj = new Date(`${shift.end_date}T${shiftEndStr}`);
        } else {
          const sH = parseInt(shiftStartStr.split(':')[0]);
          const eH = parseInt(shiftEndStr.split(':')[0]);
          const shouldEndNextDay = eH < sH || (sH === 9 && eH === 9);
          const endDateStr = shouldEndNextDay
            ? format(addDays(baseDateObj, 1), 'yyyy-MM-dd')
            : format(baseDateObj, 'yyyy-MM-dd');
          endObj = new Date(`${endDateStr}T${shiftEndStr}`);
        }

        shiftStartObjRef.current = startObj;
        shiftEndObjRef.current = endObj;
        const totalDuration = differenceInMinutes(endObj, startObj);
        totalDurationRef.current = totalDuration;

        let calcStart = startObj;
        let calcEnd = endObj;
        let type = 'full';

        if (existingCoverages.length > 0) {
          type = 'partial';
          const occupiedSegments = existingCoverages.map(c => ({
            start: new Date(`${c.start_date}T${c.start_time}`),
            end: new Date(`${c.end_date}T${c.end_time}`)
          }));

          const startsAtShiftStart = occupiedSegments.some(seg =>
            seg.start.getTime() === startObj.getTime()
          );

          if (startsAtShiftStart) {
            const maxEnd = new Date(Math.max(...occupiedSegments.map(s => s.end)));
            if (maxEnd < endObj) {
              calcStart = maxEnd;
              calcEnd = endObj;
            }
          } else {
            const minStart = new Date(Math.min(...occupiedSegments.map(s => s.start)));
            if (minStart > startObj) {
              calcStart = startObj;
              calcEnd = minStart;
            }
          }
        } else if (shift.swap_start_time && shift.swap_end_time) {
          const isFull24Hours = shift.swap_start_time === '09:00' && shift.swap_end_time === '09:00';
          if (!isFull24Hours) {
            type = 'partial';
            const startH = parseInt(shift.swap_start_time.split(':')[0]);
            const endH = parseInt(shift.swap_end_time.split(':')[0]);

            let sDate = startObj;
            if (startH < 9) sDate = addDays(baseDateObj, 1);
            calcStart = new Date(`${format(sDate, 'yyyy-MM-dd')}T${shift.swap_start_time}`);

            let eDate = sDate;
            if (endH <= startH) eDate = addDays(sDate, 1);
            calcEnd = new Date(`${format(eDate, 'yyyy-MM-dd')}T${shift.swap_end_time}`);
          }
        }

        setStartDate(format(calcStart, 'yyyy-MM-dd'));
        setStartTime(format(calcStart, 'HH:mm'));
        setEndDate(format(calcEnd, 'yyyy-MM-dd'));
        setEndTime(format(calcEnd, 'HH:mm'));
        setCoverageType(type);
        setRange([
          differenceInMinutes(calcStart, startObj),
          differenceInMinutes(calcEnd, startObj)
        ]);
        setError('');
      } catch (e) {
        console.error("Date calculation error:", e);
      }
    }
  }, [isOpen, date, shift, existingCoverages]);

  const handleTypeChange = (type) => {
    setCoverageType(type);
    setError('');

    if (type === 'full' && shiftStartObjRef.current && shiftEndObjRef.current) {
      setStartDate(format(shiftStartObjRef.current, 'yyyy-MM-dd'));
      setStartTime(format(shiftStartObjRef.current, 'HH:mm'));
      setEndDate(format(shiftEndObjRef.current, 'yyyy-MM-dd'));
      setEndTime(format(shiftEndObjRef.current, 'HH:mm'));
      setRange([0, totalDurationRef.current]);
    }

    if (type === 'partial' && shiftStartObjRef.current) {
      const startDateTime = new Date(`${startDate || format(shiftStartObjRef.current, 'yyyy-MM-dd')}T${startTime}`);
      const endDateTime = new Date(`${endDate || format(shiftEndObjRef.current || shiftStartObjRef.current, 'yyyy-MM-dd')}T${endTime}`);
      setRange([
        Math.max(0, differenceInMinutes(startDateTime, shiftStartObjRef.current)),
        Math.min(totalDurationRef.current, differenceInMinutes(endDateTime, shiftStartObjRef.current))
      ]);
    }
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

  const handleSliderDrag = (event, handleIndex) => {
    if (!sliderRef.current || totalDurationRef.current === 0) return;

    const rect = sliderRef.current.getBoundingClientRect();
    const clientX = event.type.includes('touch') ? event.touches[0].clientX : event.clientX;
    const distanceFromRight = rect.right - clientX;
    let percentage = distanceFromRight / rect.width;
    percentage = Math.max(0, Math.min(1, percentage));

    const step = 30;
    let minutes = Math.round((percentage * totalDurationRef.current) / step) * step;

    const newRange = [...range];
    newRange[handleIndex] = minutes;

    if (handleIndex === 0) {
      if (newRange[0] >= newRange[1]) newRange[0] = newRange[1] - step;
    } else {
      if (newRange[1] <= newRange[0]) newRange[1] = newRange[0] + step;
    }

    setRange(newRange);
    updateInputsFromRange(newRange);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');
    const finalStartDate = coverageType === 'full' && shiftStartObjRef.current
      ? format(shiftStartObjRef.current, 'yyyy-MM-dd')
      : startDate;
    const finalEndDate = coverageType === 'full' && shiftEndObjRef.current
      ? format(shiftEndObjRef.current, 'yyyy-MM-dd')
      : endDate;
    const finalStartTime = coverageType === 'full' && shiftStartObjRef.current
      ? format(shiftStartObjRef.current, 'HH:mm')
      : startTime;
    const finalEndTime = coverageType === 'full' && shiftEndObjRef.current
      ? format(shiftEndObjRef.current, 'HH:mm')
      : endTime;

    const startDateTime = new Date(`${finalStartDate}T${finalStartTime}`);
    const endDateTime = new Date(`${finalEndDate}T${finalEndTime}`);

    if (!isValid(startDateTime) || !isValid(endDateTime)) {
        setError('נא להזין תאריכים ושעות תקינים');
        return;
    }
    if (endDateTime <= startDateTime) {
        setError('שגיאה: שעת הסיום חייבת להיות אחרי שעת ההתחלה');
        return;
    }

    onSubmit({ 
      coverFull: coverageType === 'full' || (range[1] - range[0] === totalDurationRef.current),
      startDate: finalStartDate,
      startTime: finalStartTime,
      endDate: finalEndDate,
      endTime: finalEndTime,
      coverDate: finalStartDate,
      type: coverageType
    });
  };

  if (!isOpen || !shift) return null;

  const startPercent = totalDurationRef.current
    ? (range[0] / totalDurationRef.current) * 100
    : 0;
  const endPercent = totalDurationRef.current
    ? (range[1] / totalDurationRef.current) * 100
    : 0;
  const widthPercent = endPercent - startPercent;

  const formatDisplayDate = (isoDateStr) => {
    if (!isoDateStr) return '';
    return format(new Date(isoDateStr), 'dd/MM/yyyy');
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
        <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="relative bg-white rounded-3xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-hidden flex flex-col">
          
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
            <div className="bg-blue-50 rounded-2xl p-4 border border-blue-100 shadow-sm">
              <p className="text-xs text-gray-500 mb-1">משמרת</p>
              <h3 className="text-xl font-bold text-gray-800 mb-3">{shift.user_name || shift.role}</h3>

              <div className="bg-white rounded-2xl border border-gray-200 px-4 py-3 shadow-sm grid grid-cols-2 gap-4 text-center">
                <div className="space-y-1">
                  <p className="text-[10px] text-gray-400">התחלה</p>
                  <p className="text-lg font-bold text-gray-800">{startTime}</p>
                  <p className="text-[11px] text-gray-500">{startDate && format(new Date(startDate), 'dd/MM')}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] text-gray-400">סיום</p>
                  <p className="text-lg font-bold text-gray-800">{endTime}</p>
                  <p className="text-[11px] text-gray-500">{endDate && format(new Date(endDate), 'dd/MM')}</p>
                </div>
              </div>
            </div>

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

            <AnimatePresence>
              {coverageType === 'partial' && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="space-y-4 overflow-hidden"
                >
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 flex items-start gap-2 mt-2">
                    <AlertCircle className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
                    <p className="text-xs text-blue-700 leading-tight">
                      בחר את חלון הכיסוי המדויק מתוך המשמרת הקיימת.
                      <br />
                      <span dir="ltr" className="font-bold">
                        {startDate && format(new Date(startDate), 'd/M')} {startTime} - {endDate && format(new Date(endDate), 'd/M')} {endTime}
                      </span>
                    </p>
                  </div>

                  <div className="text-center mt-2">
                    <p className="text-sm font-bold text-[#1e88e5] mb-1">בחירת שעות הכיסוי</p>
                    <p className="text-xs text-gray-500">הזיזו את הסליידרים לבחירת תחילת וסוף הכיסוי</p>
                  </div>

                  <div className="px-4 py-8 select-none touch-none bg-gray-50 rounded-2xl border border-gray-100 shadow-sm relative">
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

                    <div ref={sliderRef} className="relative h-3 bg-gray-200 rounded-full cursor-pointer">
                      <div
                        className="absolute h-full bg-[#42A5F5] rounded-full opacity-90 shadow-sm"
                        style={{ right: `${startPercent}%`, width: `${widthPercent}%` }}
                      />

                      <div
                        className="absolute w-7 h-7 bg-white border-[3px] border-[#42A5F5] rounded-full -top-2 shadow-md cursor-grab active:cursor-grabbing flex items-center justify-center z-10 hover:scale-110 transition-transform outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#42A5F5]"
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
                        <div className="absolute -top-9 bg-[#42A5F5] text-white text-xs font-bold py-1 px-2 rounded-md shadow-sm whitespace-nowrap after:content-[''] after:absolute after:top-full after:left-1/2 after:-translate-x-1/2 after:border-4 after:border-transparent after:border-t-[#42A5F5]">
                          {startTime}
                        </div>
                      </div>

                      <div
                        className="absolute w-7 h-7 bg-white border-[3px] border-[#42A5F5] rounded-full -top-2 shadow-md cursor-grab active:cursor-grabbing flex items-center justify-center z-10 hover:scale-110 transition-transform outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#42A5F5]"
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
                        <div className="absolute -top-9 bg-[#42A5F5] text-white text-xs font-bold py-1 px-2 rounded-md shadow-sm whitespace-nowrap after:content-[''] after:absolute after:top-full after:left-1/2 after:-translate-x-1/2 after:border-4 after:border-transparent after:border-t-[#42A5F5]">
                          {endTime}
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {error && (
              <div className="text-red-500 text-sm text-center bg-red-50 p-2 rounded-lg border border-red-100 font-medium">
                {error}
              </div>
            )}

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

