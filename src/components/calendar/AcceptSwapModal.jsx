import React, { useState } from 'react';
import { format } from 'date-fns';
import { he } from 'date-fns/locale';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CheckCircle, Calendar, Clock, Users, Briefcase } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getDepartmentList, getRolesForDepartment } from './departmentData';

export default function AcceptSwapModal({ 
  isOpen, 
  onClose, 
  shift,
  onAccept,
  isAccepting
}) {
  const [coverFull, setCoverFull] = useState(true);
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('18:00');
  const [department, setDepartment] = useState('');
  const [role, setRole] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!department || !role) return;
    
    onAccept({
      coverFull,
      startTime: coverFull ? null : startTime,
      endTime: coverFull ? null : endTime,
      department,
      role
    });
  };

  const handleDepartmentChange = (value) => {
    setDepartment(value);
    setRole(''); // Reset role when department changes
  };

  if (!isOpen || !shift) return null;

  const departments = getDepartmentList();
  const roles = department ? getRolesForDepartment(department) : [];

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
          className="relative bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden"
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
                <CheckCircle className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-xl font-bold">כיסוי משמרת</h2>
                <p className="text-white/80 text-sm">
                  {format(new Date(shift.date), 'EEEE, d בMMMM', { locale: he })}
                </p>
              </div>
            </div>
          </div>

          {/* Content */}
          <form onSubmit={handleSubmit} className="p-6 space-y-5">
            {/* Shift Details */}
            <div className="bg-gradient-to-br from-[#FFEBEE] to-[#FFCDD2] rounded-xl p-4">
              <p className="text-sm text-gray-600 mb-1">מבקש</p>
              <p className="font-semibold text-gray-800">{shift.assigned_person}</p>
              <div className="mt-2 pt-2 border-t border-[#E57373]/30">
                <div className="flex items-center gap-2 text-sm text-gray-700">
                  <Clock className="w-4 h-4" />
                  {shift.swap_type === 'full' 
                    ? 'משמרת מלאה (24 שעות)'
                    : `${shift.swap_start_time} - ${shift.swap_end_time}`
                  }
                </div>
              </div>
            </div>

            {/* Covering Person Info */}
            <div className="space-y-3">
              <Label className="text-gray-700 font-medium text-lg">
                זיהוי המכסה
              </Label>
              
              {/* Department Selection */}
              <div className="space-y-2">
                <Label className="text-gray-700 font-medium flex items-center gap-2">
                  <Users className="w-4 h-4 text-[#64B5F6]" />
                  בחר מחלקה שלך
                </Label>
                <Select value={department} onValueChange={handleDepartmentChange}>
                  <SelectTrigger className="h-12 rounded-xl border-2 border-gray-200 focus:border-[#64B5F6]">
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

              {/* Role Selection */}
              <AnimatePresence>
                {department && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="space-y-2 overflow-hidden"
                  >
                    <Label className="text-gray-700 font-medium flex items-center gap-2">
                      <Briefcase className="w-4 h-4 text-[#64B5F6]" />
                      בחר בע"ת שלך
                    </Label>
                    <Select value={role} onValueChange={setRole}>
                      <SelectTrigger className="h-12 rounded-xl border-2 border-gray-200 focus:border-[#64B5F6]">
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

            {/* Cover Full Shift Question */}
            <div className="space-y-3">
              <Label className="text-gray-700 font-medium text-lg">
                לכסות משמרת מלאה?
              </Label>
              
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setCoverFull(true)}
                  className={`
                    p-4 rounded-xl border-2 transition-all text-center
                    ${coverFull 
                      ? 'border-[#64B5F6] bg-[#E3F2FD] shadow-md' 
                      : 'border-gray-200 hover:border-gray-300'
                    }
                  `}
                >
                  <div className="font-semibold text-gray-800">כן</div>
                  <div className="text-xs text-gray-500 mt-1">24 שעות</div>
                </button>
                
                <button
                  type="button"
                  onClick={() => setCoverFull(false)}
                  className={`
                    p-4 rounded-xl border-2 transition-all text-center
                    ${!coverFull 
                      ? 'border-[#64B5F6] bg-[#E3F2FD] shadow-md' 
                      : 'border-gray-200 hover:border-gray-300'
                    }
                  `}
                >
                  <div className="font-semibold text-gray-800">לא</div>
                  <div className="text-xs text-gray-500 mt-1">כיסוי חלקי</div>
                </button>
              </div>
            </div>

            {/* Partial Coverage Time Selection */}
            <AnimatePresence>
              {!coverFull && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="space-y-3 overflow-hidden"
                >
                  <Label className="text-gray-700 font-medium">שעות הכיסוי שלך</Label>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-xs text-gray-500">משעה</Label>
                      <Input
                        type="time"
                        value={startTime}
                        onChange={(e) => setStartTime(e.target.value)}
                        className="mt-1 text-center h-12 rounded-xl"
                        dir="ltr"
                      />
                    </div>
                    <div>
                      <Label className="text-xs text-gray-500">עד שעה</Label>
                      <Input
                        type="time"
                        value={endTime}
                        onChange={(e) => setEndTime(e.target.value)}
                        className="mt-1 text-center h-12 rounded-xl"
                        dir="ltr"
                      />
                    </div>
                  </div>
                  
                  <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-3">
                    <p className="text-xs text-yellow-800">
                      ⚠️ השעות שלא יכוסו יופיעו כפער במערכת
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Submit Button */}
            <Button
              type="submit"
              disabled={isAccepting || !department || !role}
              className="w-full bg-gradient-to-r from-[#64B5F6] to-[#42A5F5] hover:from-[#42A5F5] hover:to-[#2196F3] text-white py-6 rounded-xl text-lg font-medium disabled:opacity-50"
            >
              {isAccepting ? (
                <span className="flex items-center gap-2">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ repeat: Infinity, duration: 1 }}
                  >
                    ⏳
                  </motion.div>
                  מאשר...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5" />
                  אשר כיסוי
                </span>
              )}
            </Button>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}