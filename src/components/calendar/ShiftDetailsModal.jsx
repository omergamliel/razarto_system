import React, { useState } from 'react';
import { format } from 'date-fns';
import { he } from 'date-fns/locale';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Calendar, Clock, User, Trash2, Plus, AlertCircle, CheckCircle } from 'lucide-react';
import { Button } from "@/components/ui/button";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';

export default function ShiftDetailsModal({ 
  isOpen, 
  onClose, 
  shift,
  date,
  onCoverSegment,
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

  // Calculate coverage and gaps
  const shiftDuration = 24;
  let totalCoveredHours = 0;
  
  shiftCoverages.forEach(cov => {
    const start = parseInt(cov.start_time.split(':')[0]);
    const end = parseInt(cov.end_time.split(':')[0]);
    const hours = end > start ? end - start : (24 - start) + end;
    totalCoveredHours += hours;
  });

  const hasGap = shiftCoverages.length === 0 ? (shift.status === 'swap_requested') : (totalCoveredHours < shiftDuration);
  const remainingHours = Math.max(0, shiftDuration - totalCoveredHours);
  const isOwnShift = shift.assigned_email === currentUserEmail;

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
          className="relative bg-white rounded-3xl shadow-2xl w-full max-w-lg max-h-[80vh] overflow-hidden flex flex-col"
        >
          <div className="bg-gradient-to-r from-gray-700 to-gray-800 p-6 text-white flex-shrink-0">
            <div className="absolute top-4 left-4 flex gap-2">
              {isAdmin && (
                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  className="p-2 rounded-full hover:bg-white/20 transition-colors"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              )}
              <button
                onClick={onClose}
                className="p-2 rounded-full hover:bg-white/20 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="p-3 bg-white/20 rounded-xl">
                <Calendar className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-xl font-bold">פרטי משמרת</h2>
                <p className="text-white/80 text-sm">
                  {date && format(date, 'EEEE, d בMMMM yyyy', { locale: he })}
                </p>
              </div>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto" style={{ maxHeight: '60vh' }}>
            <div className="p-6 space-y-4">
              <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-6 border border-gray-200 text-center">
                {shift.role && (
                  <h2 className="text-3xl font-bold text-[#E57373] mb-3">{shift.role}</h2>
                )}
                <p className="text-lg font-semibold text-gray-800">{shift.assigned_person}</p>
                <div className="mt-2 pt-2 border-t border-gray-300">
                  <div className="flex items-center justify-center gap-2 text-sm text-gray-600">
                    <Clock className="w-4 h-4" />
                    <span>09:00 - 09:00 (למחרת)</span>
                  </div>
                </div>
              </div>





              {shift.status === 'swap_requested' && isOwnShift && (
                <Button
                  onClick={() => {
                    const updateMutation = async () => {
                      await base44.entities.Shift.update(shift.id, {
                        status: 'regular',
                        swap_request_by: null,
                        swap_type: null,
                        swap_start_time: null,
                        swap_end_time: null
                      });
                    };
                    updateMutation().then(() => {
                      onClose();
                      window.location.reload();
                    });
                  }}
                  className="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white py-6 rounded-xl text-lg font-medium shadow-md"
                >
                  <div className="flex items-center justify-center gap-3">
                    <X className="w-5 h-5" />
                    <span>בטל בקשת החלפה</span>
                  </div>
                </Button>
              )}

              {hasGap && !isOwnShift && onOfferCover && (
                <Button
                  onClick={() => {
                    onClose();
                    onOfferCover(shift);
                  }}
                  className="w-full bg-gradient-to-r from-[#64B5F6] to-[#42A5F5] hover:from-[#42A5F5] hover:to-[#2196F3] text-white py-6 rounded-xl text-lg font-medium shadow-md"
                >
                  <div className="flex items-center justify-center gap-3">
                    <CheckCircle className="w-5 h-5" />
                    <span>אני אחליף</span>
                  </div>
                </Button>
              )}

              {isAdmin && shift.status === 'pending_approval' && (
                <Button
                  onClick={() => {
                    onApprove();
                    onClose();
                  }}
                  className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white py-6 rounded-xl text-lg font-medium shadow-md"
                >
                  <div className="flex items-center justify-center gap-3">
                    <CheckCircle className="w-5 h-5" />
                    <span>אשר החלפה</span>
                  </div>
                </Button>
              )}
            </div>
          </div>
        </motion.div>

        <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-red-500" />
                אישור מחיקה
              </DialogTitle>
              <DialogDescription>
                האם אתה בטוח שברצונך למחוק את השיבוץ הזה?
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
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