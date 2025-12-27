import React, { useState } from 'react';
import { format, addDays } from 'date-fns'; // הוספנו addDays
import { he } from 'date-fns/locale';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Calendar, Clock, User, Trash2, CheckCircle, AlertCircle } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';

export default function ShiftDetailsModal({ 
  isOpen, 
  onClose, 
  shift,
  date,
  onOfferCover,
  onDelete,
  onApprove,
  currentUserEmail,
  isAdmin
}) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const handleDelete = () => {
    onDelete(shift.id);
    setShowDeleteConfirm(false);
  };

  const { data: shiftCoverages = [] } = useQuery({
    queryKey: ['shift-coverages', shift?.id],
    queryFn: async () => {
      if (!shift?.id) return [];
      return await base44.entities.ShiftCoverage.filter({ shift_id: shift.id });
    },
    enabled: !!shift?.id && isOpen
  });

  if (!isOpen || !shift) return null;

  const isOwnShift = shift.assigned_email === currentUserEmail;
  const needsCoverage = ['swap_requested', 'partially_covered', 'REQUIRES_FULL_COVERAGE', 'REQUIRES_PARTIAL_COVERAGE'].includes(shift.status);

  // פונקציית עזר לחישוב נכון של טווח השעות (כולל יום למחרת)
  const formatShiftRange = () => {
      // ברירת מחדל
      const startStr = shift.swap_start_time || '09:00';
      const endStr = shift.swap_end_time || '09:00';
      
      const startHour = parseInt(startStr.split(':')[0]);
      const endHour = parseInt(endStr.split(':')[0]);
      
      const shiftDate = new Date(shift.date);
      // אם שעת הסיום קטנה או שווה לשעת ההתחלה - זה אומר שעברנו ליום הבא
      const isNextDay = endHour <= startHour; 
      
      const endDate = isNextDay ? addDays(shiftDate, 1) : shiftDate;

      return (
          <div className="flex flex-col items-center">
              <span className="text-gray-500 text-xs mb-1">
                 {shift.status.includes('partial') ? 'דרוש כיסוי חלקי' : 'דרוש כיסוי מלא'}:
              </span>
              <span className="font-bold text-lg dir-ltr">
                  {format(shiftDate, 'd/M')} {startStr} - {format(endDate, 'd/M')} {endStr}
              </span>
          </div>
      );
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
        <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="relative bg-white rounded-3xl shadow-2xl w-full max-w-lg max-h-[80vh] overflow-hidden flex flex-col">
          
          {/* Header */}
          <div className="bg-gradient-to-r from-gray-800 to-gray-900 p-6 text-white flex-shrink-0">
            <button onClick={onClose} className="absolute top-4 left-4 p-2 rounded-full hover:bg-white/20"><X className="w-5 h-5" /></button>
            <div className="flex items-center gap-3">
              <div className="p-3 bg-white/20 rounded-xl"><Calendar className="w-6 h-6" /></div>
              <div>
                <h2 className="text-xl font-bold">פרטי משמרת</h2>
                <p className="text-white/80 text-sm">{date && format(new Date(date), 'EEEE, d בMMMM yyyy', { locale: he })}</p>
              </div>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            
            {/* כרטיס סטטוס */}
            {needsCoverage && (
                <div className="bg-red-50 border border-red-100 rounded-2xl p-6 text-center shadow-sm">
                    <h2 className="text-3xl font-bold text-red-500 mb-2">{shift.role}</h2>
                    <div className="border-t border-red-100 pt-3 mt-2">
                        {formatShiftRange()}
                    </div>
                </div>
            )}

            {/* כפתור אני אחליף */}
            {needsCoverage && !isOwnShift && (
                <Button 
                    onClick={() => { onClose(); onOfferCover(shift); }}
                    className="w-full bg-blue-500 hover:bg-blue-600 text-white h-14 text-lg rounded-xl shadow-lg shadow-blue-500/20"
                >
                    <div className="flex items-center justify-center gap-2">
                        <CheckCircle className="w-5 h-5" />
                        <span>אני אחליף</span>
                    </div>
                </Button>
            )}

             {/* כפתור ביטול לבעל המשמרת */}
             {needsCoverage && isOwnShift && (
                <Button 
                    variant="destructive"
                    className="w-full h-14 text-lg rounded-xl shadow-lg"
                >
                    בטל בקשה
                </Button>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}