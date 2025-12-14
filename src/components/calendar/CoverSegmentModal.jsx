import React, { useState } from 'react';
import { format } from 'date-fns';
import { he } from 'date-fns/locale';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Calendar, Clock, Users, Briefcase, AlertCircle } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getDepartmentList, getRolesForDepartment } from './departmentData';

export default function CoverSegmentModal({ 
  isOpen, 
  onClose, 
  shift,
  date,
  onSubmit,
  isSubmitting
}) {
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('18:00');
  const [department, setDepartment] = useState('');
  const [role, setRole] = useState('');
  const [error, setError] = useState('');

  const validateTime = (start, end) => {
    // Convert time to minutes from 09:00
    const parseTime = (timeStr) => {
      const [hours, minutes] = timeStr.split(':').map(Number);
      // If hours < 9, it's next day
      const adjustedHours = hours < 9 ? hours + 24 : hours;
      return adjustedHours * 60 + minutes;
    };

    const startMinutes = parseTime(start);
    const endMinutes = parseTime(end);
    const shiftStart = 9 * 60; // 09:00
    const shiftEnd = 9 * 60 + 24 * 60; // 09:00 next day

    if (startMinutes < shiftStart || startMinutes >= shiftEnd) {
      return 'שעת התחלה חייבת להיות בין 09:00 ל-09:00 למחרת';
    }

    if (endMinutes <= startMinutes) {
      return 'שעת סיום חייבת להיות אחרי שעת ההתחלה';
    }

    if (endMinutes > shiftEnd) {
      return 'שעת סיום חייבת להיות עד 09:00 למחרת';
    }

    return null;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    if (!department || !role) {
      setError('יש לבחור מחלקה ותפקיד');
      return;
    }

    const validationError = validateTime(startTime, endTime);
    if (validationError) {
      setError(validationError);
      return;
    }

    onSubmit({
      startTime,
      endTime,
      department,
      role
    });
  };

  const handleDepartmentChange = (value) => {
    setDepartment(value);
    setRole('');
  };

  if (!isOpen || !shift) return null;

  const departments = getDepartmentList();
  const roles = department ? getRolesForDepartment(department) : [];

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
          className="relative bg-white rounded-3xl shadow-2xl w-full max-w-md max-h-[80vh] overflow-hidden flex flex-col"
        >
          <div className="bg-gradient-to-r from-[#64B5F6] to-[#42A5F5] p-6 text-white">
            <button
              onClick={onClose}
              className="absolute top-4 left-4 p-2 rounded-full hover:bg-white/20 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            
            <div className="flex items-center gap-3">
              <div className="p-3 bg-white/20 rounded-xl">
                <Clock className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-xl font-bold">כיסוי מקטע משמרת</h2>
                <p className="text-white/80 text-sm">
                  {date && format(date, 'EEEE, d בMMMM', { locale: he })}
                </p>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-5">
            {/* Error Display */}
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-red-50 border border-red-200 rounded-xl p-3 flex items-start gap-2"
              >
                <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-700">{error}</p>
              </motion.div>
            )}

            {/* Original Shift Info */}
            <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-4 border border-gray-200">
              <p className="text-sm text-gray-500 mb-1">משמרת מקורית</p>
              <p className="font-semibold text-gray-800">{shift.assigned_person}</p>
              {shift.role && (
                <p className="text-sm text-[#E57373]">{shift.role}</p>
              )}
            </div>

            {/* Department & Role Selection */}
            <div className="space-y-3">
              <Label className="text-gray-700 font-medium">זיהוי המכסה</Label>
              
              <div className="space-y-2">
                <Label className="text-sm text-gray-600 flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  בחר מחלקה שלך
                </Label>
                <Select value={department} onValueChange={handleDepartmentChange}>
                  <SelectTrigger className="h-12 rounded-xl">
                    <SelectValue placeholder="בחר מחלקה..." />
                  </SelectTrigger>
                  <SelectContent>
                    {departments.map((dept) => (
                      <SelectItem key={dept} value={dept}>
                        {dept}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <AnimatePresence>
                {department && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="space-y-2 overflow-hidden"
                  >
                    <Label className="text-sm text-gray-600 flex items-center gap-2">
                      <Briefcase className="w-4 h-4" />
                      בחר בע"ת שלך
                    </Label>
                    <Select value={role} onValueChange={setRole}>
                      <SelectTrigger className="h-12 rounded-xl">
                        <SelectValue placeholder="בחר בע״ת..." />
                      </SelectTrigger>
                      <SelectContent>
                        {roles.map((r) => (
                          <SelectItem key={r} value={r}>
                            {r}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Time Selection */}
            <div className="space-y-3">
              <Label className="text-gray-700 font-medium">שעות הכיסוי</Label>
              <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-3">
                <p className="text-xs text-yellow-800">
                  ⚠️ יש להזין שעות בטווח 09:00 עד 09:00 למחרת
                </p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs text-gray-500">משעה</Label>
                  <Input
                    type="time"
                    value={startTime}
                    onChange={(e) => {
                      setStartTime(e.target.value);
                      setError('');
                    }}
                    className="mt-1 text-center h-12 rounded-xl"
                    dir="ltr"
                  />
                </div>
                <div>
                  <Label className="text-xs text-gray-500">עד שעה</Label>
                  <Input
                    type="time"
                    value={endTime}
                    onChange={(e) => {
                      setEndTime(e.target.value);
                      setError('');
                    }}
                    className="mt-1 text-center h-12 rounded-xl"
                    dir="ltr"
                  />
                </div>
              </div>
            </div>

            {/* Submit */}
            <Button
              type="submit"
              disabled={isSubmitting || !department || !role}
              className="w-full bg-gradient-to-r from-[#64B5F6] to-[#42A5F5] hover:from-[#42A5F5] hover:to-[#2196F3] text-white py-6 rounded-xl text-lg font-medium disabled:opacity-50"
            >
              {isSubmitting ? 'שומר...' : 'שמור כיסוי'}
            </Button>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}