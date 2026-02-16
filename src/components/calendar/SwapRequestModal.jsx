import React, { useState, useEffect, useRef } from 'react';
import { format, addDays, differenceInMinutes, addMinutes } from 'date-fns';
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
  // Always full swap - no partial option

  // No initialization needed - always full swap

  // No slider logic needed - always full swap

  // --- SUBMISSION LOGIC ---
  const handleSubmit = (e) => {
    if (e?.preventDefault) {
      e.preventDefault();
    }

    if (!onSubmit) {
      console.error('❌ onSubmit prop is missing in SwapRequestModal');
      return;
    }

    // Always full swap
    const payload = {
      type: 'full',
      startDate: shift?.start_date,
      startTime: shift?.start_time || '09:00',
      endDate: shift?.end_date || shift?.start_date,
      endTime: shift?.end_time || '09:00'
    };

    console.log('📤 [SwapRequestModal] Submitting Full Swap Request:', payload);
    onSubmit(payload);
  };
  
  if (!isOpen || !shift) return null;

  const shiftStartDate = shift?.start_date || format(new Date(date), 'yyyy-MM-dd');
  const shiftEndDate = shift?.end_date || shiftStartDate;
  const shiftStartTime = shift?.start_time || '09:00';
  const shiftEndTime = shift?.end_time || '09:00';

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
                <div className="space-y-2">
                    <p className="text-sm text-gray-500 font-medium">משובץ כרגע למשמרת</p>
                    <h3 className="text-2xl font-semibold text-gray-900 leading-none">
                        {shift.user_name || shift.role}
                    </h3>
                    {shift?.department && (
                      <span className="inline-flex items-center justify-center rounded-full bg-gray-50 px-3 py-1 text-xs font-semibold text-gray-700 border border-gray-200">
                        {`מחלקה ${shift.department}`}
                      </span>
                    )}
                </div>

                <div className="flex items-center justify-between bg-gray-50 rounded-2xl p-1 border border-gray-100 shadow-sm">
                    {/* Start Time Block */}
                    <div className="flex-1 text-center py-3">
                        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">
                            {shiftStartDate && format(new Date(shiftStartDate), 'EEEE', { locale: he })}
                        </p>
                        <p className="text-xl font-bold text-gray-800 leading-none mb-1 font-mono">
                            {shiftStartTime}
                        </p>
                        <p className="text-[11px] text-gray-400">
                            {shiftStartDate && format(new Date(shiftStartDate), 'dd/MM/yyyy')}
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
                            {shiftEndDate && format(new Date(shiftEndDate), 'EEEE', { locale: he })}
                        </p>
                        <p className="text-xl font-bold text-gray-800 leading-none mb-1 font-mono">
                            {shiftEndTime}
                        </p>
                        <p className="text-[11px] text-gray-400">
                            {shiftEndDate && format(new Date(shiftEndDate), 'dd/MM/yyyy')}
                        </p>
                    </div>
                </div>
            </div>

            <div className="relative flex items-center justify-center my-5">
                <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-200"></div></div>
                <div className="relative bg-white px-4 text-sm font-medium text-gray-500">בקשה להחלפת משמרת מלאה</div>
            </div>

            <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4 text-center">
                <Clock className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                <p className="text-sm font-bold text-blue-900">משמרת מלאה בלבד</p>
                <p className="text-xs text-blue-700 mt-1">הבקשה תכלול את כל שעות המשמרת</p>
            </div>

            {/* Hidden submit for form enter key */}
            <button type="submit" className="hidden" />
          </form>

          {/* Footer with Actions */}
          <div className="p-6 pt-0 border-t border-gray-50 mt-auto bg-white space-y-3">
            <div className="flex gap-3 mt-4">
                <Button
                   type="submit"
                   onClick={handleSubmit}
                   disabled={isSubmitting}
                   className="flex-[2] h-12 bg-gradient-to-r from-[#EF5350] to-[#E53935] hover:from-[#E53935] hover:to-[#D32F2F] text-white rounded-xl shadow-lg shadow-red-500/20 text-lg font-bold transition-all hover:scale-[1.02] active:scale-[0.98]"
                >
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