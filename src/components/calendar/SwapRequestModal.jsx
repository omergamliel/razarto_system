import React, { useState, useEffect } from 'react';
import { format, addDays } from 'date-fns';
import { he } from 'date-fns/locale';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Clock, Calendar, AlertCircle, Send } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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
  const [startTime, setStartTime] = useState('14:00');
  const [endDate, setEndDate] = useState('');
  const [endTime, setEndTime] = useState('18:00');

  // Set default dates when modal opens
  React.useEffect(() => {
    if (isOpen && date) {
      setStartDate(format(date, 'yyyy-MM-dd'));
      setEndDate(format(date, 'yyyy-MM-dd'));
    }
  }, [isOpen, date]);
  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({
      swapType,
      startDate: swapType === 'partial' ? startDate : null,
      startTime: swapType === 'partial' ? startTime : null,
      endDate: swapType === 'partial' ? endDate : null,
      endTime: swapType === 'partial' ? endTime : null
    });
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        />

        {/* Modal */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative bg-white rounded-3xl shadow-2xl w-full max-w-md max-h-[80vh] overflow-hidden flex flex-col"
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-[#E57373] to-[#EF5350] p-6 text-white">
            <button
              onClick={onClose}
              className="absolute top-4 left-4 p-2 rounded-full hover:bg-white/20 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            
            <div className="flex items-center gap-3">
              <div className="p-3 bg-white/20 rounded-xl">
                <Calendar className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-xl font-bold">בקשת החלפה</h2>
                <p className="text-white/80 text-sm">
                  {date && format(date, 'EEEE, d בMMMM yyyy', { locale: he })}
                </p>
              </div>
            </div>
          </div>

          {/* Content */}
          <form onSubmit={handleSubmit} className="p-6 space-y-5 overflow-y-auto flex-1">
            {/* Current Assignment */}
            {shift && (
              <div className="bg-gray-50 rounded-xl p-4">
                <p className="text-sm text-gray-500 mb-1">משובץ כרגע</p>
                <p className="font-semibold text-gray-800">{shift.assigned_person}</p>
                <p className="text-xs text-gray-400 mt-1">09:00 - 09:00 (למחרת)</p>
              </div>
            )}

            {/* Swap Type Selection */}
            <div className="space-y-3">
              <Label className="text-gray-700 font-medium">סוג ההחלפה</Label>
              <RadioGroup 
                value={swapType} 
                onValueChange={setSwapType}
                className="grid grid-cols-2 gap-3"
              >
                <div className={`
                  relative flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all
                  ${swapType === 'full' 
                    ? 'border-[#E57373] bg-[#FFEBEE]' 
                    : 'border-gray-200 hover:border-gray-300'
                  }
                `}>
                  <RadioGroupItem value="full" id="full" className="sr-only" />
                  <label htmlFor="full" className="cursor-pointer w-full">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-[#E57373]" />
                      <span className="font-medium text-gray-800">משמרת מלאה</span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">24 שעות</p>
                  </label>
                </div>
                
                <div className={`
                  relative flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all
                  ${swapType === 'partial' 
                    ? 'border-[#E57373] bg-[#FFEBEE]' 
                    : 'border-gray-200 hover:border-gray-300'
                  }
                `}>
                  <RadioGroupItem value="partial" id="partial" className="sr-only" />
                  <label htmlFor="partial" className="cursor-pointer w-full">
                    <div className="flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 text-[#E57373]" />
                      <span className="font-medium text-gray-800">החלפה חלקית</span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">שעות מסוימות</p>
                  </label>
                </div>
              </RadioGroup>
            </div>

            {/* Date & Time Selection (for partial) */}
            <AnimatePresence>
              {swapType === 'partial' && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="space-y-4 overflow-hidden"
                >
                  {/* Start Date & Time */}
                  <div className="bg-gray-50 rounded-xl p-4 space-y-3">
                    <Label className="text-gray-700 font-semibold">החל מ:</Label>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label className="text-xs text-gray-500 mb-1 block">תאריך</Label>
                        <Input
                          type="date"
                          value={startDate}
                          onChange={(e) => setStartDate(e.target.value)}
                          className="text-center h-12 rounded-xl"
                        />
                      </div>
                      <div>
                        <Label className="text-xs text-gray-500 mb-1 block">שעה</Label>
                        <Input
                          type="time"
                          value={startTime}
                          onChange={(e) => setStartTime(e.target.value)}
                          className="text-center h-12 rounded-xl"
                          dir="ltr"
                        />
                      </div>
                    </div>
                  </div>

                  {/* End Date & Time */}
                  <div className="bg-gray-50 rounded-xl p-4 space-y-3">
                    <Label className="text-gray-700 font-semibold">ועד ל:</Label>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label className="text-xs text-gray-500 mb-1 block">תאריך</Label>
                        <Input
                          type="date"
                          value={endDate}
                          onChange={(e) => setEndDate(e.target.value)}
                          className="text-center h-12 rounded-xl"
                        />
                      </div>
                      <div>
                        <Label className="text-xs text-gray-500 mb-1 block">שעה</Label>
                        <Input
                          type="time"
                          value={endTime}
                          onChange={(e) => setEndTime(e.target.value)}
                          className="text-center h-12 rounded-xl"
                          dir="ltr"
                        />
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Submit Button */}
            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-gradient-to-r from-[#E57373] to-[#EF5350] hover:from-[#EF5350] hover:to-[#E53935] text-white py-6 rounded-xl text-lg font-medium"
            >
              {isSubmitting ? (
                <span className="flex items-center gap-2">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ repeat: Infinity, duration: 1 }}
                  >
                    ⏳
                  </motion.div>
                  שולח...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <Send className="w-5 h-5" />
                  שלח בקשה
                </span>
              )}
            </Button>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}