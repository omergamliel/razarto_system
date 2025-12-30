import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Calendar, Clock, ArrowLeftRight, CheckCircle, XCircle } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { format } from 'date-fns';
import { he } from 'date-fns/locale';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';

export default function HeadToHeadApprovalModal({ 
  isOpen, 
  onClose, 
  targetShiftId, 
  offerShiftId,
  onApprove,
  onDecline 
}) {
  const { data: allShifts = [], isLoading } = useQuery({
    queryKey: ['all-shifts-h2h'],
    queryFn: () => base44.entities.Shift.list(),
    enabled: isOpen && !!targetShiftId && !!offerShiftId
  });

  const targetShift = allShifts.find(s => s.id === targetShiftId);
  const offerShift = allShifts.find(s => s.id === offerShiftId);

  if (!isOpen) return null;

  if (isLoading) {
    return (
      <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
        <div className="relative bg-white rounded-3xl p-8 text-center">
          <p className="text-gray-600">טוען פרטי משמרות...</p>
        </div>
      </div>
    );
  }

  if (!targetShift || !offerShift) {
    return (
      <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
        <div className="relative bg-white rounded-3xl p-8 text-center">
          <p className="text-gray-600 mb-4">לא נמצאו פרטי המשמרות</p>
          <Button onClick={onClose}>סגור</Button>
        </div>
      </div>
    );
  }

  const ShiftCard = ({ shift, title, colorClass }) => (
    <div className={`${colorClass} rounded-2xl p-5 border-2`}>
      <p className="text-sm font-semibold mb-3 text-gray-700">{title}</p>
      <div className="bg-white rounded-xl p-4 space-y-3">
        <div>
          <p className="text-xs text-gray-500 mb-1">תפקיד</p>
          <p className="font-bold text-gray-800 text-lg">{shift.role}</p>
        </div>
        <div className="border-t pt-3">
          <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
            <Calendar className="w-4 h-4" />
            <span className="font-medium">
              {format(new Date(shift.date), 'EEEE, d בMMMM yyyy', { locale: he })}
            </span>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Clock className="w-4 h-4" />
            <span>09:00 - 09:00 (משמרת מלאה)</span>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        />

        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative bg-white rounded-3xl shadow-2xl w-full max-w-3xl overflow-hidden"
        >
          <div className="bg-gradient-to-r from-purple-500 to-purple-600 p-6 text-white">
            <button
              onClick={onClose}
              className="absolute top-4 left-4 p-2 rounded-full hover:bg-white/20 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            
            <div className="flex items-center gap-3">
              <div className="p-3 bg-white/20 rounded-xl">
                <ArrowLeftRight className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-2xl font-bold">אישור החלפה ראש בראש</h2>
                <p className="text-white/90 text-sm mt-1">בדוק את פרטי ההצעה ואשר או דחה</p>
              </div>
            </div>
          </div>

          <div className="p-6">
            <div className="grid md:grid-cols-2 gap-4 mb-6">
              <ShiftCard 
                shift={targetShift} 
                title="המשמרת שלך (תעביר אותה)" 
                colorClass="bg-red-50 border-red-200"
              />
              
              <div className="hidden md:flex items-center justify-center">
                <div className="p-3 bg-purple-100 rounded-full">
                  <ArrowLeftRight className="w-6 h-6 text-purple-600" />
                </div>
              </div>
              
              <ShiftCard 
                shift={offerShift} 
                title="המשמרת המוצעת (תקבל אותה)" 
                colorClass="bg-green-50 border-green-200"
              />
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
              <p className="text-sm text-blue-800">
                <span className="font-bold">שים לב:</span> לאחר אישור ההחלפה, המשמרות יוחלפו באופן קבוע. 
                פעולה זו דורשת אישור מנהל נוסף.
              </p>
            </div>

            <div className="flex gap-3">
              <Button
                onClick={onDecline}
                variant="outline"
                className="flex-1 h-14 rounded-xl border-2 hover:bg-red-50 hover:border-red-200"
              >
                <XCircle className="w-5 h-5 ml-2" />
                דחה הצעה
              </Button>
              <Button
                onClick={onApprove}
                className="flex-1 h-14 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white rounded-xl shadow-lg"
              >
                <CheckCircle className="w-5 h-5 ml-2" />
                אשר החלפה
              </Button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}