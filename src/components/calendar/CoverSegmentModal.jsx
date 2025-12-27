import React, { useState, useEffect } from 'react';
import { format, addDays, parseISO, isValid } from 'date-fns'; // הוספנו parseISO
import { he } from 'date-fns/locale';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Clock, AlertCircle } from 'lucide-react'; // ניקיתי אייקונים לא בשימוש
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
  // State initialization
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('09:00');
  
  const [department, setDepartment] = useState('');
  const [role, setRole] = useState('');
  const [error, setError] = useState('');

  // --- THE FIX: Aggressive Date Calculation ---
  useEffect(() => {
    if (isOpen && date) {
      try {
        // 1. נסה לפרסר את התאריך בכל דרך אפשרית
        let dateObj = new Date(date);
        if (!isValid(dateObj)) {
            dateObj = parseISO(date); // ניסיון נוסף אם זה סטרינג ISO
        }

        if (isValid(dateObj)) {
            // תאריך התחלה = התאריך שנבחר
            const startStr = format(dateObj, 'yyyy-MM-dd');
            setStartDate(startStr);

            // תאריך סיום = תאריך שנבחר + יום אחד בדיוק
            const nextDay = addDays(dateObj, 1);
            const endStr = format(nextDay, 'yyyy-MM-dd');
            setEndDate(endStr);
            
            console.log("Setting Dates:", { start: startStr, end: endStr }); // לוג לבדיקה בקונסול
        } else {
            // Fallback: אם התאריך לא תקין, קח את היום
            const today = new Date();
            setStartDate(format(today, 'yyyy-MM-dd'));
            setEndDate(format(addDays(today, 1), 'yyyy-MM-dd'));
        }

        // איפוס שעות
        setStartTime('09:00');
        setEndTime('09:00');
        setError('');
        
      } catch (e) {
        console.error("Critical Date Error:", e);
      }
    }
  }, [isOpen, date]);

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    // בדיקה: האם נבחר תפקיד?
    if (!department || !role) {
      setError('חובה לבחור מחלקה ותפקיד לפני השמירה');
      return;
    }

    // שליחת הנתונים
    console.log("Submitting Coverage:", { startDate, startTime, endDate, endTime, role });
    
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
            <button onClick={onClose} className="absolute top-4 left-4 p-2 rounded-full hover:bg-white/20">
              <X className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-3">
              <div className="p-3 bg-white/20 rounded-xl"><Clock className="w-6 h-6" /></div>
              <div>
                <h2 className="text-xl font-bold">כיסוי מקטע משמרת</h2>
                <p className="text-white/80 text-sm">הזנת פרטי מחליף</p>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-5 overflow-y-auto">
            {/* Error Message Area */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-3 flex items-center gap-2 text-red-700 font-medium">
                <AlertCircle className="w-5 h-5" />
                {error}
              </div>
            )}

            {/* Read Only: Shift Info */}
            <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
              <p className="text-xs text-gray-500">מבקש ההחלפה</p>
              <p className="font-bold text-gray-800 text-lg">{shift.assigned_person}</p>
              <p className="text-sm text-gray-500">
                 {shift.role} | {shift.startTime || '09:00'} - {shift.endTime || '09:00'}
              </p>
            </div>

            {/* Department & Role Selectors */}
            <div className="space-y-3">
              <Label className="text-gray-700 font-medium">מי המחליף?</Label>
              <div className="grid grid-cols-1 gap-3">
                <Select value={department} onValueChange={handleDepartmentChange}>
                  <SelectTrigger className="h-12 rounded-xl bg-white border-gray-200">
                    <SelectValue placeholder="בחר מחלקה" />
                  </SelectTrigger>
                  <SelectContent>
                    {departments.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                  </SelectContent>
                </Select>

                {department && (
                  <Select value={role} onValueChange={setRole}>
                    <SelectTrigger className="h-12 rounded-xl bg-white border-gray-200">
                      <SelectValue placeholder="בחר תפקיד (חובה)" />
                    </SelectTrigger>
                    <SelectContent>
                      {roles.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                    </SelectContent>
                  </Select>
                )}
              </div>
            </div>

            {/* Date & Time Inputs */}
            <div className="bg-blue-50/50 p-4 rounded-xl space-y-4 border border-blue-100">
              <Label className="text-blue-900 font-medium">זמני הכיסוי שלך</Label>
              
              <div className="grid grid-cols-2 gap-4">
                {/* Start */}
                <div className="space-y-1">
                  <Label className="text-xs text-gray-500">התחלה</Label>
                  <Input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="bg-white" />
                  <Input type="time" value={startTime} onChange={e => setStartTime(e.target.value)} className="bg-white" />
                </div>

                {/* End */}
                <div className="space-y-1">
                  <Label className="text-xs text-gray-500">סיום (יום למחרת)</Label>
                  <Input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="bg-white" />
                  <Input type="time" value={endTime} onChange={e => setEndTime(e.target.value)} className="bg-white" />
                </div>
              </div>
            </div>

            {/* Submit Button - ALWAYS ENABLED (Unless loading) */}
            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full h-14 text-lg bg-blue-500 hover:bg-blue-600 text-white rounded-xl shadow-lg shadow-blue-500/20"
            >
              {isSubmitting ? 'מעבד נתונים...' : 'אשר כיסוי'}
            </Button>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}