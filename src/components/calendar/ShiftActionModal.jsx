import React, { useState } from 'react';
import { format } from 'date-fns';
import { he } from 'date-fns/locale';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Calendar, Trash2, AlertCircle, ShieldAlert } from 'lucide-react';
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

  // תיקון: שימוש בנתוני האמת מה-DB (תאריכים ושעות)
  const startDateObj = shift.start_date ? new Date(shift.start_date) : new Date(date);
  const endDateObj = shift.end_date ? new Date(shift.end_date) : new Date(date);
  
  const startTime = shift.start_time || '09:00';
  const endTime = shift.end_time || '09:00';

  return (
    <AnimatePresence>
      {isOpen && (
        <>
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
              className="relative bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden flex flex-col"
            >
              {/* Header Image/Gradient */}
              <div className="h-32 bg-gradient-to-r from-blue-500 to-indigo-600 relative flex items-end p-4">
                 <div className="absolute top-4 left-4 text-white/80 text-xs font-medium bg-black/20 px-2 py-1 rounded-full backdrop-blur-md border border-white/10">
                    פעולות על המשמרת
                 </div>
                 <div className="text-white">
                    <h2 className="text-2xl font-bold">{format(startDateObj, 'd בMMMM', { locale: he })}</h2>
                    <p className="text-blue-100 text-sm">{format(startDateObj, 'yyyy', { locale: he })}</p>
                 </div>

                 <button 
                    onClick={onClose}
                    className="absolute top-4 right-4 p-2 bg-white/10 rounded-full hover:bg-white/20 transition-colors text-white"
                  >
                    <X className="w-5 h-5" />
                  </button>
              </div>

              {/* Body Content */}
              <div className="p-6 space-y-6">
                
                {/* Status Badge & Name */}
                <div className="text-center">
                    <div className="inline-block px-3 py-1 rounded-full bg-gray-100 text-gray-600 text-xs font-bold mb-3">
                        משמרת רגילה
                    </div>
                    {/* תיקון פונט: font-sans והגדלה */}
                    <h3 className="text-2xl font-sans font-bold text-gray-900 leading-tight">
                        {shift.user_name || shift.role}
                    </h3>
                    <p className="text-sm text-gray-500 mt-1">
                       {shift.department ? `מחלקה ${shift.department}` : 'פרטי משמרת'}
                    </p>
                </div>

                {/* Times Display (Start -> End) */}
                <div className="bg-gray-50 rounded-2xl p-4 flex items-center justify-between border border-gray-100 relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-1 h-full bg-blue-500"></div>
                    
                    {/* Start */}
                    <div className="text-center flex-1">
                        <p className="text-xs text-gray-400 mb-1">התחלה</p>
                        <p className="font-bold text-gray-800 text-lg leading-none">{startTime}</p>
                        <p className="text-[10px] text-gray-500 mt-1">{format(startDateObj, 'dd/MM')}</p>
                    </div>

                    {/* Arrow Divider */}
                    <div className="flex flex-col items-center justify-center px-2 opacity-30">
                        <div className="w-8 h-[2px] bg-gray-400 rounded-full"></div>
                    </div>

                    {/* End */}
                    <div className="text-center flex-1">
                        <p className="text-xs text-gray-400 mb-1">סיום</p>
                        <p className="font-bold text-gray-800 text-lg leading-none">{endTime}</p>
                        <p className="text-[10px] text-gray-500 mt-1">{format(endDateObj, 'dd/MM')}</p>
                    </div>
                </div>

                {/* Action Buttons - Swapped Order for RTL */}
                <div className="flex gap-3 pt-2">
                   {/* כפתור בקשת החלפה (עכשיו בצד ימין - ראשון בקוד ב-RTL, או שני ב-Flex Row רגיל. נסדר לפי הסדר הויזואלי הרצוי) */}
                   {/* ב-RTL: אלמנט ראשון = ימין. אלמנט שני = שמאל. */}
                   
                   <Button 
                      onClick={onRequestSwap}
                      className="flex-[2] h-12 bg-gradient-to-r from-[#EF5350] to-[#E53935] hover:from-[#E53935] hover:to-[#D32F2F] text-white rounded-xl shadow-lg shadow-red-500/20 text-base font-bold"
                    >
                      בקש החלפה
                   </Button>

                   <Button 
                      onClick={onClose}
                      variant="outline"
                      className="flex-1 h-12 rounded-xl border-gray-200 text-gray-600 hover:bg-gray-50 text-base font-medium"
                    >
                      ביטול
                   </Button>
                </div>

                {/* Admin Actions */}
                <div className="flex justify-between items-center pt-4 border-t border-gray-100">
                    {isAdmin && (
                        <div className="flex gap-2 w-full">
                            <Button 
                                variant="ghost" 
                                onClick={onEditRole}
                                className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 text-xs flex-1"
                            >
                                ערוך שיבוץ
                            </Button>
                            <Button 
                                variant="ghost" 
                                onClick={() => setShowDeleteConfirm(true)}
                                className="text-red-400 hover:text-red-500 hover:bg-red-50 text-xs flex-1"
                            >
                                <Trash2 className="w-3 h-3 mr-1" />
                                מחק משמרת
                            </Button>
                        </div>
                    )}
                </div>

              </div>
            </motion.div>
          </div>

          {/* Delete Confirmation Dialog */}
          <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
            <DialogContent dir="rtl">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2 text-red-600">
                    <ShieldAlert className="w-5 h-5" />
                    מחיקת משמרת
                </DialogTitle>
                <DialogDescription>
                  האם אתה בטוח שברצונך למחוק את המשמרת של <b>{shift.user_name || shift.role}</b>?
                  <br/>
                  פעולה זו אינה הפיכה.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter className="gap-2 sm:gap-0">
                <Button variant="outline" onClick={() => setShowDeleteConfirm(false)}>ביטול</Button>
                <Button variant="destructive" onClick={handleDelete}>כן, מחק משמרת</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </>
      )}
    </AnimatePresence>
  );
}