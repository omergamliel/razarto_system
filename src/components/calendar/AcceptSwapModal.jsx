import React, { useState, useEffect, useMemo } from 'react';
import { format, addDays } from 'date-fns';
import { he } from 'date-fns/locale';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CheckCircle, Clock, Building2 } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from 'sonner';

// Local helpers to normalize swap context across entry points
const resolveSwapType = (shift, activeRequest) => {
  const explicit = activeRequest?.request_type || shift?.request_type || shift?.coverageType || shift?.swap_type;
  if (explicit && String(explicit).toLowerCase() === 'partial') return 'partial';
  if (explicit && String(explicit).toLowerCase() === 'full') return 'full';
  const start = activeRequest?.req_start_time || shift?.req_start_time || shift?.start_time;
  const end = activeRequest?.req_end_time || shift?.req_end_time || shift?.end_time;
  if (start && end && start !== end) return 'partial';
  return 'full';
};

const resolveRequestWindow = (shift, activeRequest) => {
  const startDate = activeRequest?.req_start_date || shift?.req_start_date || shift?.start_date || shift?.date;
  const endDate = activeRequest?.req_end_date || shift?.req_end_date || shift?.end_date || startDate;
  const startTime = activeRequest?.req_start_time || shift?.req_start_time || shift?.start_time || '09:00';
  const endTime = activeRequest?.req_end_time || shift?.req_end_time || shift?.end_time || startTime;
  return { startDate, endDate, startTime, endTime };
};

const normalizeShift = (shift) => {
  if (!shift) return null;
  const active_request = shift.active_request || shift.activeRequest || null;
  const window = resolveRequestWindow(shift, active_request);
  return {
    ...shift,
    active_request,
    request_type: active_request?.request_type || shift.request_type || (resolveSwapType(shift, active_request) === 'partial' ? 'Partial' : 'Full'),
    start_date: shift.start_date || window.startDate,
    end_date: shift.end_date || window.endDate,
    start_time: shift.start_time || window.startTime,
    end_time: shift.end_time || window.endTime
  };
};

export default function AcceptSwapModal({
  isOpen,
  onClose,
  shift,
  onAccept,
  isAccepting,
  existingCoverages = []
}) {
  const normalizedShift = useMemo(() => normalizeShift(shift), [shift]);
  const [coverFull, setCoverFull] = useState(true);
  const [coverageChoice, setCoverageChoice] = useState('full');
  const [startDate, setStartDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endDate, setEndDate] = useState('');
  const [endTime, setEndTime] = useState('');

  // --- Derived Request Context (keeps logic aligned with ShiftDetailsModal) ---
  const activeRequest = useMemo(() => normalizedShift?.active_request || normalizedShift?.activeRequest || null, [normalizedShift]);
  const requestType = useMemo(() => resolveSwapType(normalizedShift, activeRequest), [activeRequest, normalizedShift]);
  const requestWindow = useMemo(() => resolveRequestWindow(normalizedShift, activeRequest), [activeRequest, normalizedShift]);
  const requestStartDate = requestWindow.startDate;
  const requestEndDate = requestWindow.endDate;
  const requestStartTime = requestWindow.startTime;
  const requestEndTime = requestWindow.endTime;

  const isFullSwapRequest = useMemo(() => {
    if (requestType === 'Full' || requestType === 'full') return true;
    return (
      (requestStartTime === normalizedShift?.start_time && requestEndTime === normalizedShift?.end_time) ||
      (!requestStartTime && !requestEndTime)
    );
  }, [normalizedShift?.end_time, normalizedShift?.start_time, requestEndTime, requestStartTime, requestType]);

  // --- Display helpers ---
  const originalUserName = useMemo(() => {
    return (
      normalizedShift?.original_user_name ||
      normalizedShift?.assigned_person ||
      normalizedShift?.role ||
      normalizedShift?.user_name ||
      'לא ידוע'
    );
  }, [normalizedShift]);

  const coveringUserName = useMemo(() => {
    return normalizedShift?.current_user_name || normalizedShift?.covering_user_name || normalizedShift?.covering_name || 'את/ה';
  }, [normalizedShift]);

  const shiftDepartment = normalizedShift?.department || normalizedShift?.assigned_department || '';
  const shiftStartDate = normalizedShift?.start_date || normalizedShift?.date;
  const shiftEndDate = normalizedShift?.end_date || shiftStartDate;

  const fullRangeLabel = useMemo(() => {
    try {
      if (!shiftStartDate) return '';
      const start = `${shiftStartDate}T${normalizedShift?.start_time || requestStartTime || '09:00'}`;
      const endDateValue = shiftEndDate || shiftStartDate;
      const end = `${endDateValue}T${normalizedShift?.end_time || requestEndTime || '09:00'}`;
      const sameDay = shiftEndDate === shiftStartDate || !shiftEndDate;

      const startText = format(new Date(start), "EEEE, d בMMMM HH:mm", { locale: he });
      const endText = format(new Date(end), sameDay ? 'HH:mm' : "EEEE, d בMMMM HH:mm", { locale: he });
      return `${startText} - ${endText}`;
    } catch (err) {
      return '';
    }
  }, [requestEndTime, requestStartTime, shift?.end_time, shift?.start_time, shiftEndDate, shiftStartDate]);

  // Initialize and update values when modal opens or shift changes
  useEffect(() => {
    if (!normalizedShift || !isOpen) return;

    // Default Dates
    const defaultStartDate = shiftStartDate ? shiftStartDate : format(new Date(), 'yyyy-MM-dd');
    const defaultEndDate = shiftEndDate ? shiftEndDate : format(addDays(new Date(defaultStartDate), 1), 'yyyy-MM-dd');

    // Get original request times (aligned with ShiftDetailsModal logic)
    const originalStartTime = requestStartTime || normalizedShift?.start_time || '09:00';
    const originalEndTime = requestEndTime || normalizedShift?.end_time || '09:00';

    // Full swap flow: always start in full coverage mode (default YES for full swap requests)
    if (isFullSwapRequest) {
      setStartDate(requestStartDate || defaultStartDate);
      setStartTime(originalStartTime);
      setEndDate(requestEndDate || defaultEndDate);
      setEndTime(originalEndTime);
      setCoverFull(true);
      setCoverageChoice('full');
      return;
    }

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
        const calculatedEndDate = shiftEndDate || defaultEndDate;

        setStartDate(nextStartDate);
        setStartTime(nextStartTime);
        setEndDate(calculatedEndDate);
        setEndTime(originalEndTime);
        setCoverFull(false); // Force partial mode if there's already coverage

        return;
      }
    }

    // No existing coverages - clean slate
    const isPartialRequest =
      requestType === 'Partial' || requestType === 'partial' ||
      normalizedShift?.status === 'Partially_Covered' ||
      normalizedShift?.status === 'partial' ||
      normalizedShift?.coverageType === 'partial';

    if (isPartialRequest) {
       // Pre-fill with requested partial times
       setStartDate(requestStartDate || defaultStartDate);
       setStartTime(originalStartTime);
       setEndDate(requestEndDate || defaultEndDate);
       setEndTime(originalEndTime);
       setCoverFull(false);
       setCoverageChoice('partial');
    } else {
       // Default Full
       setStartDate(defaultStartDate);
       setStartTime(originalStartTime);
       setEndDate(defaultEndDate);
       setEndTime(originalEndTime);
       setCoverFull(true);
       setCoverageChoice('full');
    }

  }, [
    existingCoverages,
    isFullSwapRequest,
    isOpen,
    requestEndDate,
    requestEndTime,
    requestStartDate,
    requestStartTime,
    requestType,
    normalizedShift,
    shiftEndDate,
    shiftStartDate
  ]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Prepare Submission Data
    const wantsFull = coverageChoice === 'full';
    let submissionData = {
        type: wantsFull ? 'Full' : 'Partial',
        // If full, take defaults from shift, else take form inputs
        startTime: wantsFull ? (normalizedShift?.start_time || requestStartTime || '09:00') : startTime,
        endTime: wantsFull ? (normalizedShift?.end_time || requestEndTime || '09:00') : endTime,
        startDate: wantsFull ? (normalizedShift?.start_date || shiftStartDate) : startDate,
        endDate: wantsFull ? (normalizedShift?.end_date || shiftEndDate || shiftStartDate) : endDate
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

  if (!isOpen || !normalizedShift) return null;

  const displayDate = normalizedShift.date || normalizedShift.start_date; // Handle both key names

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4" dir="rtl">
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

          <form onSubmit={handleSubmit} className="p-6 space-y-5 overflow-y-auto flex-1" dir="rtl">

            {/* Top context box: original user, department and range */}
            <div className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm space-y-3 text-right">
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 text-gray-900 font-semibold text-lg">
                    <CheckCircle className="w-5 h-5 text-[#42A5F5]" />
                    <span>{originalUserName}</span>
                  </div>
                  {shiftDepartment && (
                    <div className="flex items-center gap-1 text-sm text-gray-600">
                      <Building2 className="w-4 h-4" />
                      <span>{shiftDepartment}</span>
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Clock className="w-4 h-4" />
                  <span>{fullRangeLabel || 'טווח זמן לא זמין'}</span>
                </div>
              </div>
            </div>

            {/* Decision UI shown for all cases */}
            <div className="space-y-4">
              <div className="bg-blue-50 border border-blue-100 p-4 rounded-2xl text-right">
                <p className="text-sm sm:text-base text-blue-900 font-semibold leading-relaxed">
                  עלתה בקשה מהמשתמש/ת <span className="font-bold">{originalUserName}</span> לכיסוי מלא של המשמרת, האם ברצונך לכסות משמרת מלאה?
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => { setCoverFull(true); setCoverageChoice('full'); }}
                  className={`w-full p-4 sm:p-5 rounded-2xl text-white font-bold text-lg transition-all shadow-md ${coverFull ? 'bg-green-600 ring-4 ring-green-200 scale-[1.02]' : 'bg-green-500 hover:bg-green-600'}`}
                >
                  כן, 24 שעות
                </button>
                <button
                  type="button"
                  onClick={() => { setCoverFull(false); setCoverageChoice('partial'); }}
                  className={`w-full p-4 sm:p-5 rounded-2xl text-white font-bold text-lg transition-all shadow-md ${!coverFull ? 'bg-red-600 ring-4 ring-red-200 scale-[1.02]' : 'bg-red-500 hover:bg-red-600'}`}
                >
                  לא, כיסוי חלקי
                </button>
              </div>
            </div>

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
                        <Input type="date" dir="ltr" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="text-center h-10 bg-white" />
                      </div>
                      <div className="flex-1">
                        <Label className="text-xs text-gray-500 mb-1">שעת התחלה</Label>
                        <Input type="time" dir="ltr" value={startTime} onChange={(e) => setStartTime(e.target.value)} className="text-center h-10 bg-white" />
                      </div>
                    </div>

                    {/* End Time */}
                    <div className="flex flex-col sm:flex-row gap-3">
                      <div className="flex-1">
                        <Label className="text-xs text-gray-500 mb-1">תאריך סיום</Label>
                        <Input type="date" dir="ltr" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="text-center h-10 bg-white" />
                      </div>
                      <div className="flex-1">
                        <Label className="text-xs text-gray-500 mb-1">שעת סיום</Label>
                        <Input type="time" dir="ltr" value={endTime} onChange={(e) => setEndTime(e.target.value)} className="text-center h-10 bg-white" />
                      </div>
                    </div>

                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {coverFull && (
              <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4 shadow-sm space-y-2 text-right">
                <p className="text-sm font-bold text-blue-900">סיכום השינויים</p>
                <p className="text-sm text-blue-800 leading-relaxed">
                  תתבצע החלפה במשמרת זו בין המשתמשים <span className="font-bold">{originalUserName}</span> (מקורי) לבין <span className="font-bold">{coveringUserName}</span> (המחליפ/ה).
                </p>
              </div>
            )}

            <Button
              type="submit"
              disabled={isAccepting}
              className="w-full bg-gradient-to-r from-[#64B5F6] to-[#42A5F5] hover:from-[#42A5F5] hover:to-[#2196F3] text-white py-6 rounded-xl text-lg font-medium shadow-lg mt-2"
            >
              {isAccepting ? 'מעבד...' : 'אשר כיסוי'}
            </Button>

          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}