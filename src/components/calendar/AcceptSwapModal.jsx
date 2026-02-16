import React, { useState, useEffect, useMemo } from 'react';
import { format, addDays } from 'date-fns';
import { he } from 'date-fns/locale';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CheckCircle, Building2 } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from 'sonner';
import { buildDateTime, resolveSwapType, normalizeShiftContext, computeCoverageSummary, resolveShiftWindow } from './whatsappTemplates';

const formatSegmentText = (segment) => {
  const sameDay = format(segment.start, 'dd/MM') === format(segment.end, 'dd/MM');
  const datePart = sameDay
    ? `${format(segment.start, 'EEEE', { locale: he })} • ${format(segment.start, 'dd/MM', { locale: he })}`
    : `${format(segment.start, 'dd/MM')} → ${format(segment.end, 'dd/MM')}`;
  return `${format(segment.start, 'HH:mm')} – ${format(segment.end, 'HH:mm')} | ${datePart}`;
};

export default function AcceptSwapModal({
  isOpen,
  onClose,
  shift,
  onAccept,
  isAccepting,
  existingCoverages = []
}) {
  const normalizedShift = useMemo(
    () =>
      normalizeShiftContext(shift, {
        coverages: existingCoverages,
        activeRequest: shift?.active_request || shift?.activeRequest
      }),
    [existingCoverages, shift]
  );
  // Always full coverage - simplified

  // Always full swap - simplified logic

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
  const shiftStartDate = normalizedShift?.start_date;
  const shiftEndDate = normalizedShift?.end_date || shiftStartDate;
  const shiftStartTime = normalizedShift?.start_time || '09:00';
  const shiftEndTime = normalizedShift?.end_time || '09:00';

  // No initialization needed - always full coverage

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Always full coverage
    const submissionData = {
        type: 'Full',
        startTime: normalizedShift?.start_time || '09:00',
        endTime: normalizedShift?.end_time || '09:00',
        startDate: normalizedShift?.start_date,
        endDate: normalizedShift?.end_date || normalizedShift?.start_date
    };

    try {
      await onAccept(submissionData);
      toast.success('ההחלפה בוצעה בהצלחה!');
    } catch (err) {
      toast.error('אירעה שגיאה בעת שליחת הכיסוי');
    }
  };

  if (!isOpen || !normalizedShift) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4" dir="rtl">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="absolute inset-0 bg-black/40 backdrop-blur-sm" />

        <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="relative bg-white rounded-3xl shadow-2xl w-full max-w-md max-h-[80vh] overflow-hidden flex flex-col">

          <div className="bg-gradient-to-r from-[#64B5F6] to-[#42A5F5] p-6 text-white">
            <button onClick={onClose} className="absolute top-4 left-4 p-2 rounded-full hover:bg-white/20 transition-colors"><X className="w-5 h-5" /></button>
            <div className="flex items-center gap-3">
              <div className="p-3 bg-white/20 rounded-xl"><CheckCircle className="w-6 h-6" /></div>
              <div className="space-y-1">
                <h2 className="text-xl font-bold">כיסוי משמרת מלאה</h2>
                <p className="text-white/80 text-sm">כיסוי למשמרת שלמה</p>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-5 overflow-y-auto flex-1" dir="rtl">

            {/* Top context box: original user, department and range */}
            <div className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm space-y-4 text-right">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-blue-50 text-blue-600"><Building2 className="w-5 h-5" /></div>
                <div className="flex flex-col">
                  <span className="text-sm text-gray-500">משמרת של</span>
                  <span className="text-lg font-bold text-gray-900">{originalUserName}</span>
                  {shiftDepartment && <span className="text-xs text-gray-600">{shiftDepartment}</span>}
                </div>
              </div>

              <div className="bg-gray-50 rounded-2xl border border-gray-100 px-4 py-3 shadow-inner grid grid-cols-2 gap-4 text-center">
                <div className="space-y-1">
                  <p className="text-[10px] text-gray-400">התחלה</p>
                  <p className="text-lg font-bold text-gray-800">{normalizedShift?.start_time}</p>
                  <p className="text-[11px] text-gray-500">{shiftStartDate ? format(new Date(shiftStartDate), 'EEEE, dd/MM', { locale: he }) : ''}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] text-gray-400">סיום</p>
                  <p className="text-lg font-bold text-gray-800">{normalizedShift?.end_time}</p>
                  <p className="text-[11px] text-gray-500">{shiftEndDate ? format(new Date(shiftEndDate), 'EEEE, dd/MM', { locale: he }) : ''}</p>
                </div>
              </div>
            </div>

            {/* Confirmation UI */}
            <div className="space-y-4">
              <div className="bg-blue-50 border border-blue-100 p-4 rounded-xl text-right shadow-inner">
                <p className="text-sm sm:text-base text-blue-900 leading-relaxed">
                  המשתמש/ת <span className="font-bold">{originalUserName}</span> מבקש/ת החלפה מלאה למשמרת זו.
                </p>
              </div>

              <div className="bg-green-50 border border-green-100 rounded-2xl p-4 shadow-sm space-y-2 text-right">
                <p className="text-sm font-bold text-green-900">סיכום הכיסוי</p>
                <p className="text-sm text-green-800 leading-relaxed">
                  בלחיצה על "אשר כיסוי", תבצע/י החלפה מלאה עם <span className="font-bold">{originalUserName}</span> וכל המשמרת תועבר אליך.
                </p>
              </div>
            </div>

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