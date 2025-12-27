import React, { useState } from 'react';
import { format, addDays } from 'date-fns';
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
  
  // זיהוי סטטוסים
  const isSwapRequested = shift.status === 'swap_requested' || shift.status === 'REQUIRES_FULL_COVERAGE';
  const isPartial = shift.status === 'partially_covered' || shift.status === 'REQUIRES_PARTIAL_COVERAGE';
  const isApproved = shift.status === 'approved';
  
  const needsCoverage = isSwapRequested || isPartial;

  // פונקציית עזר לחישוב נכון של טווח השעות (כולל יום למחרת)
  const formatShiftRange = (startStr, endStr, baseDate) => {
      if (!startStr || !endStr) return '09:00 - 09:00 (למחרת)';

      const startHour = parseInt(startStr.split(':')[0]);
      const endHour = parseInt(endStr.split(':')[0]);
      
      const shiftDate = new Date(baseDate);
      const isNextDay = endHour <= startHour; 
      
      const endDate = isNextDay ? addDays(shiftDate, 1) : shiftDate;

      return (
          <span className="font-bold text-lg dir-ltr">
              {format(shiftDate, 'd/M')} {startStr} - {format(endDate, 'd/M')} {endStr}
          </span>
      );
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
        <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="relative bg-white rounded-3xl shadow-2xl w-full max-w-lg max-h-[80vh] overflow-hidden flex flex-col">
          
          {/* Header */}
          <div className="bg-gradient-to-r from-gray-800 to-gray-900 p-6 text-white flex-shrink-0 relative">
            <div className="absolute top-4 left-4 flex gap-2">
                {isAdmin && (
                    <button onClick={() => setShowDeleteConfirm(true)} className="p-2 rounded-full hover:bg-white/20 transition-colors">
                        <Trash2 className="w-5 h-5 text-red-400" />
                    </button>
                )}
                <button onClick={onClose} className="p-2 rounded-full hover:bg-white/20">
                    <X className="w-5 h-5" />
                </button>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="p-3 bg-white/20 rounded-xl"><Calendar className="w-6 h-6" /></div>
              <div>
                <h2 className="text-xl font-bold">פרטי משמרת</h2>
                <p className="text-white/80 text-sm">{date && format(new Date(date), 'EEEE, d בMMMM yyyy', { locale: he })}</p>
              </div>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            
            {/* 1. מצב משמרת שאושרה (ירוק) */}
            {isApproved && (
                <div className="bg-green-50 border border-green-100 rounded-2xl p-6 text-center shadow-sm">
                    <div className="flex justify-center mb-2">
                        <CheckCircle className="w-10 h-10 text-green-500" />
                    </div>
                    <h2 className="text-2xl font-bold text-green-700 mb-1">המשמרת הוחלפה</h2>
                    <p className="text-gray-600 text-sm mb-4">פרטי המחליף:</p>
                    
                    <div className="bg-white rounded-xl p-4 border border-green-200">
                        <h3 className="font-bold text-lg text-gray-800">{shift.covering_person || 'מחליף לא ידוע'}</h3>
                        <p className="text-gray-500">{shift.role}</p>
                    </div>
                </div>
            )}

            {/* 2. מצב בקשת החלפה (אדום או צהוב) */}
            {needsCoverage && (
                <div className={`border rounded-2xl p-6 text-center shadow-sm ${
                    isPartial ? 'bg-yellow-50 border-yellow-100' : 'bg-red-50 border-red-100'
                }`}>
                    <h2 className={`text-3xl font-bold mb-2 ${
                        isPartial ? 'text-yellow-600' : 'text-red-500'
                    }`}>
                        {shift.role}
                    </h2>
                    
                    <div className={`border-t pt-3 mt-2 ${
                        isPartial ? 'border-yellow-200' : 'border-red-100'
                    }`}>
                        <div className="flex flex-col items-center">
                            <span className="text-gray-500 text-xs mb-1 flex items-center gap-1">
                                <AlertCircle className="w-3 h-3" />
                                {isPartial ? 'דרוש כיסוי חלקי' : 'דרוש כיסוי מלא'}:
                            </span>
                            {formatShiftRange(
                                shift.swap_start_time || '09:00', 
                                shift.swap_end_time || '09:00', 
                                shift.date
                            )}
                             {shift.remaining_hours && (
                                <span className="text-xs font-medium mt-1 text-gray-500">
                                    (נותרו: {shift.remaining_hours})
                                </span>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* 3. רשימת כיסויים קיימים (אם יש) */}
            {shiftCoverages.length > 0 && (
                <div className="space-y-2">
                    <h3 className="text-sm font-bold text-gray-500 px-1">מי כבר מכסה?</h3>
                    {shiftCoverages.map((cov) => (
                        <div key={cov.id} className="bg-gray-50 p-3 rounded-xl border border-gray-100 flex justify-between items-center text-sm">
                            {/* שינוי 1: הצגת תפקיד (covering_role) במקום שם */}
                            <span className="font-medium text-gray-700">{cov.covering_role}</span>
                            
                            {/* שינוי 2: הצגת טווח תאריכים מלא */}
                            <span className="text-gray-500 dir-ltr text-xs">
                                {format(new Date(cov.start_date), 'd/M')} {cov.start_time} - {format(new Date(cov.end_date), 'd/M')} {cov.end_time}
                            </span>
                        </div>
                    ))}
                </div>
            )}

            {/* כפתורים */}
            <div className="pt-2 space-y-3">
                {/* כפתור אני אחליף (למי שאינו המבקש) */}
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

                {/* כפתור ביטול בקשה (לבעל המשמרת) */}
                {needsCoverage && isOwnShift && (
                    <Button 
                        variant="destructive"
                        className="w-full h-14 text-lg rounded-xl shadow-lg bg-red-500 hover:bg-red-600"
                    >
                        בטל בקשה
                    </Button>
                )}
            </div>
            
          </div>
        </motion.div>

        {/* מודל אישור מחיקה */}
        <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-red-500" />
                אישור מחיקה
              </DialogTitle>
              <DialogDescription>
                האם אתה בטוח שברצונך למחוק את המשמרת הזו? פעולה זו אינה הפיכה.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowDeleteConfirm(false)}>
                ביטול
              </Button>
              <Button variant="destructive" onClick={handleDelete}>
                מחק משמרת
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

      </div>
    </AnimatePresence>
  );
}