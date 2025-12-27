import React, { useState, useEffect } from 'react'; // Added useEffect
import { format, addDays } from 'date-fns'; // Added addDays
import { he } from 'date-fns/locale';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Clock, Users, Briefcase, AlertCircle } from 'lucide-react';
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
  // State for Dates (New)
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  
  // State for Times
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('18:00'); // Default end time
  
  const [department, setDepartment] = useState('');
  const [role, setRole] = useState('');
  const [error, setError] = useState('');

  // --- THE FIX: Initialize Dates when modal opens ---
  useEffect(() => {
    if (isOpen && date) {
      // Start Date = The clicked date
      setStartDate(format(date, 'yyyy-MM-dd'));
      
      // End Date = Start Date + 1 Day (Tomorrow)
      setEndDate(format(addDays(date, 1), 'yyyy-MM-dd')); //
    }
  }, [isOpen, date]);

  const validateTime = (start, end) => {
    // Basic validation logic
    const parseTime = (timeStr) => {
      const [hours, minutes] = timeStr.split(':').map(Number);
      const adjustedHours = hours < 9 ? hours + 24 : hours;
      return adjustedHours * 60 + minutes;
    };

    const startMinutes = parseTime(start);
    const endMinutes = parseTime(end);
    const shiftStart = 9 * 60; 
    const shiftEnd = 9 * 60 + 24 * 60; 

    // Note: This validation assumes the dates are correct (today -> tomorrow)
    // You might want to add date validation later if needed.
    
    return null;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    if (!department || !role) {
      setError('יש לבחור מחלקה ותפקיד');
      return;
    }

    // Include dates in submission
    onSubmit({
      startDate,
      startTime,
      endDate,
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
          {/* Header */}
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

          <form onSubmit={handleSubmit} className="p-6 space-y-5 overflow-y-auto">
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

            {/* Shift Info */}
            <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-4 border border-gray-200">
              <p className="text-sm text-gray-500 mb-1">משמרת מקורית</p>
              <p className="font-semibold text-gray-800">{shift.assigned_person}</p>
              {shift.role && (
                <p className="text-sm text-[#E57373]">{shift.role}</p>
              )}
            </div>

            {/* Department & Role */}
            <div className="space-y-3">
              <Label className="text-gray-700 font-medium">זיהוי המכסה</Label>
              <div className="space-y-2">
                <Select value={department} onValueChange={handleDepartmentChange}>
                  <SelectTrigger className="h-12 rounded-xl">
                    <SelectValue placeholder="בחר מחלקה..." />
                  </SelectTrigger>
                  <SelectContent>
                    {departments.map((dept) => (
                      <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {department && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="space-y-2"
                >
                  <Select value={role} onValueChange={setRole}>
                    <SelectTrigger className="h-12 rounded-xl">
                      <SelectValue placeholder="בחר בע״ת..." />
                    </SelectTrigger>
                    <SelectContent>
                      {roles.map((r) => (
                        <SelectItem key={r} value={r}>{r}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </motion.div>
              )}
            </div>

            {/* Date & Time Inputs */}
            <div className="space-y-4">
              <Label className="text-gray-700 font-medium">טווח כיסוי</Label>
              
              {/* Start Row */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs text-gray-500">החל מתאריך</Label>
                  <Input 
                    type="date" 
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="h-11 rounded-xl text-center"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-gray-500">בשעה</Label>
                  <Input 
                    type="time" 
                    value={startTime} 
                    onChange={(e) => setStartTime(e.target.value)}
                    className="h-11 rounded-xl text-center"
                  />
                </div>
              </div>

              {/* End Row */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs text-gray-500">עד תאריך</Label>
                  <Input 
                    type="date" 
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="h-11 rounded-xl text-center"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-gray-500">בשעה</Label>
                  <Input 
                    type="time" 
                    value={endTime} 
                    onChange={(e) => setEndTime(e.target.value)}
                    className="h-11 rounded-xl text-center"
                  />
                </div>
              </div>
            </div>

            {/* Submit */}
            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-gradient-to-r from-[#64B5F6] to-[#42A5F5] text-white py-6 rounded-xl text-lg font-medium"
            >
              {isSubmitting ? 'שומר...' : 'שמור כיסוי'}
            </Button>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}