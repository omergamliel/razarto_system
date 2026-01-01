import React, { useState } from 'react';
import { format, addDays } from 'date-fns';
import { he } from 'date-fns/locale';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Trash2, ShieldAlert } from 'lucide-react';
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

  // --- תיקון לוגיקת תאריכים ---
  // אם יש תאריכים מה-DB נשתמש בהם, אחרת נחשב לפי השעות
  const startTime = shift.start_time || '09:00';
  const endTime = shift.end_time || '09:00';
  
  const startDateObj = shift.start_date ? new Date(shift.start_date) : new Date(date);
  
  // חישוב חכם לתאריך סיום: אם אין תאריך סיום ב-DB, והשעה של הסיום קטנה/שווה להתחלה -> סימן שזה יום למחרת
  let endDateObj;
  if (shift.end_date) {
      endDateObj = new Date(shift.end_date);
  } else {
      const sH = parseInt(startTime.split(':')[0]);
      const eH = parseInt(endTime.split(':')[0]);
      // אם שעת סיום קטנה משעת התחלה, או שזה 09:00-09:00 (24 שעות) -> זה יום למחרת
      if (eH < sH || (sH === 9 && eH === 9)) {
          endDateObj = addDays(startDateObj, 1);
      } else {
          endDateObj = startDateObj;
      }
  }

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
              <div className="h-32 bg-gradient-to-r from-[#a9def9] to-[#a9def9] relative flex items-end p-4 text-[#0b3a5e]">
                 <div className="absolute top-4 left-4 text-[#0b3a5e] text-xs font-medium bg-white/50 px-2 py-1 rounded-full backdrop-blur-md border border-white/40">
                    פעולות על המשמרת
                 </div>
                 <div className="text-[#0b3a5e]">
                    <h2 className="text-2xl font-bold">{format(startDateObj, 'd בMMMM', { locale: he })}</h2>
                    <p className="text-sm opacity-80">{format(startDateObj, 'yyyy', { locale: he })}</p>
                 </div>

                 <button
                    onClick={onClose}
                    className="absolute top-4 right-4 p-2 bg-white/60 rounded-full hover:bg-white/80 transition-colors text-[#0b3a5e]"
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
                    {/* תיקון פונט: הוספנו font-sans */}
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
                   {/* כפתור בקשה - ראשון (ימין) */}
                   <Button 
                      onClick={onRequestSwap}
                      className="flex-[2] h-12 bg-gradient-to-r from-[#EF5350] to-[#E53935] hover:from-[#E53935] hover:to-[#D32F2F] text-white rounded-xl shadow-lg shadow-red-500/20 text-base font-bold"
                    >
                      בקש החלפה
                   </Button>

                   {/* כפתור ביטול - שני (שמאל) */}
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