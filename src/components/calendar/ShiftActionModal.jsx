import React, { useState } from 'react';
import { format, addDays } from 'date-fns';
import { he } from 'date-fns/locale';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Calendar, ArrowLeftRight, Trash2, AlertCircle, ShieldAlert } from 'lucide-react';
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export default function ShiftActionModal({ 
  isOpen, 
  onClose, 
  shift,
  date,
  onRequestSwap,
  onEditRole,
  onDelete,
  isAdmin
}) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const handleDelete = () => {
    onDelete(shift.id);
    setShowDeleteConfirm(false);
    onClose();
  };

  if (!isOpen || !shift) return null;

  // חישוב שעות ותאריכים להצגה יפה
  const startTime = shift.start_time || '09:00';
  const endTime = shift.end_time || '09:00'; 
  const shiftDate = new Date(date);
  
  // בדיקה אם הסיום הוא ביום למחרת
  const startH = parseInt(startTime.split(':')[0]);
  const endH = parseInt(endTime.split(':')[0]);
  const isNextDay = endH <= startH && !(startH === 9 && endH === 9); // לוגיקה בסיסית, ניתן לדייק לפי הצורך
  const endDate = isNextDay ? addDays(shiftDate, 1) : shiftDate;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4" dir="rtl">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        />

        {/* Modal */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col"
        >
          {/* Header Colored Top Bar */}
          <div className="bg-[#2D3748] p-5 text-white flex justify-between items-center relative overflow-hidden">
             {/* Decorative Background Icon */}
             <Calendar className="absolute -left-4 -bottom-4 w-24 h-24 text-white/5 rotate-12" />
             
             <div className="flex items-center gap-3 z-10">
                <div className="bg-white/10 p-2.5 rounded-xl backdrop-blur-md shadow-inner">
                    <Calendar className="w-6 h-6" />
                </div>
                <div>
                    <h2 className="text-xl font-bold tracking-wide">פעולות על המשמרת</h2>
                    <p className="text-white/70 text-sm">
                        {date && format(date, 'd בMMMM yyyy', { locale: he })}
                    </p>
                </div>
             </div>

             <button
              onClick={onClose}
              className="p-2 bg-white/10 rounded-full hover:bg-white/20 transition-colors z-10"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body Content */}
          <div className="p-6 space-y-6">
            
            {/* Status Badge */}
            <div className="flex justify-center">
                <div className="bg-red-50 text-red-600 px-4 py-1.5 rounded-full text-sm font-bold border border-red-100 flex items-center gap-2 shadow-sm">
                    <ShieldAlert className="w-4 h-4" />
                    משמרת רגילה
                </div>
            </div>

            {/* Shift Details Box */}
            <div className="text-center space-y-5">
                <div>
                    <p className="text-sm text-gray-400 font-medium mb-1">פרטי המשמרת</p>
                    <h3 className="text-2xl font-extrabold text-gray-800 tracking-tight">
                        {shift.assigned_role || shift.role}
                    </h3>
                </div>

                {/* New Time Display Design */}
                <div className="flex items-center justify-between bg-gray-50 rounded-2xl p-1 border border-gray-100 shadow-sm">
                    {/* Start Time Block */}
                    <div className="flex-1 text-center py-3">
                        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">
                            {format(shiftDate, 'EEEE', { locale: he })}
                        </p>
                        <p className="text-2xl font-bold text-gray-800 leading-none mb-1 font-mono">
                            {startTime}
                        </p>
                        <p className="text-[10px] text-gray-400">
                            {format(shiftDate, 'dd/MM/yyyy')}
                        </p>
                    </div>

                    {/* Divider with Arrow */}
                    <div className="flex flex-col items-center justify-center px-2">
                        <div className="h-8 w-px bg-gray-200 mb-1"></div>
                        <ArrowLeftRight className="w-4 h-4 text-gray-300" />
                        <div className="h-8 w-px bg-gray-200 mt-1"></div>
                    </div>

                    {/* End Time Block */}
                    <div className="flex-1 text-center py-3">
                        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">
                            {format(endDate, 'EEEE', { locale: he })}
                        </p>
                        <p className="text-2xl font-bold text-gray-800 leading-none mb-1 font-mono">
                            {endTime}
                        </p>
                        <p className="text-[10px] text-gray-400">
                            {format(endDate, 'dd/MM/yyyy')}
                        </p>
                    </div>
                </div>
            </div>

            {/* Action Buttons - Row Layout */}
            <div className="flex gap-3 pt-4">
                <Button
                    onClick={onClose}
                    variant="outline"
                    className="flex-1 h-12 rounded-xl border-gray-200 text-gray-600 hover:bg-gray-50 text-base font-medium"
                >
                    ביטול
                </Button>
                
                <Button
                    onClick={onRequestSwap}
                    className="flex-[2] h-12 bg-gradient-to-r from-[#EF5350] to-[#E53935] hover:from-[#E53935] hover:to-[#D32F2F] text-white rounded-xl shadow-lg shadow-red-500/20 text-base font-bold transition-all transform hover:scale-[1.02]"
                >
                    <div className="flex items-center justify-center gap-2">
                        <ArrowLeftRight className="w-5 h-5" />
                        <span>בקש החלפה</span>
                    </div>
                </Button>
            </div>

            {/* Admin Delete (Optional) */}
            {isAdmin && (
                <button 
                    onClick={() => setShowDeleteConfirm(true)}
                    className="w-full text-center text-xs text-gray-400 hover:text-red-500 transition-colors flex items-center justify-center gap-1 py-2 opacity-60 hover:opacity-100"
                >
                    <Trash2 className="w-3 h-3" />
                    מחיקת משמרת (מנהל בלבד)
                </button>
            )}

          </div>
        </motion.div>

        {/* Delete Confirmation Dialog */}
        <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
          <DialogContent dir="rtl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-red-600">
                <AlertCircle className="w-5 h-5" />
                אישור מחיקה
              </DialogTitle>
              <DialogDescription className="text-right">
                האם אתה בטוח שברצונך למחוק את המשמרת הזו? פעולה זו אינה הפיכה.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="gap-2 sm:gap-0">
              <Button variant="outline" onClick={() => setShowDeleteConfirm(false)}>
                ביטול
              </Button>
              <Button variant="destructive" onClick={handleDelete}>
                אישור מחיקה
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AnimatePresence>
  );
}