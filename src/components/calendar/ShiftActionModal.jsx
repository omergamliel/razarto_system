import React from 'react';
import { format } from 'date-fns';
import { he } from 'date-fns/locale';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Calendar, ArrowLeftRight, Edit3 } from 'lucide-react';
import { Button } from "@/components/ui/button";

export default function ShiftActionModal({ 
  isOpen, 
  onClose, 
  shift,
  date,
  onRequestSwap,
  onEditRole
}) {
  if (!isOpen || !shift) return null;

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
          <div className="bg-gradient-to-r from-gray-700 to-gray-800 p-6 text-white">
            <button
              onClick={onClose}
              className="absolute top-4 left-4 p-2 rounded-full hover:bg-white/20 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            
            <div className="flex items-center gap-3">
              <div className="p-3 bg-white/20 rounded-xl">
                <Calendar className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-xl font-bold">פעולות על המשמרת</h2>
                <p className="text-white/80 text-sm">
                  {date && format(date, 'EEEE, d בMMMM yyyy', { locale: he })}
                </p>
              </div>
            </div>
          </div>

          {/* Shift Info */}
          <div className="p-6 bg-gray-50 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">משובץ</p>
                <p className="font-semibold text-gray-800">{shift.assigned_person}</p>
              </div>
              {shift.role && (
                <div className="bg-white px-3 py-1 rounded-lg border border-gray-200">
                  <p className="text-xs text-gray-500">תפקיד</p>
                  <p className="font-medium text-[#E57373] text-sm">{shift.role}</p>
                </div>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="p-6 space-y-3">
            {/* Request Swap */}
            <Button
              onClick={onRequestSwap}
              className="w-full bg-gradient-to-r from-[#E57373] to-[#EF5350] hover:from-[#EF5350] hover:to-[#E53935] text-white py-6 rounded-xl text-lg font-medium shadow-md hover:shadow-lg transition-all"
            >
              <div className="flex items-center justify-center gap-3">
                <ArrowLeftRight className="w-5 h-5" />
                <span>בקש החלפה</span>
              </div>
            </Button>

            {/* Edit Role */}
            <Button
              onClick={onEditRole}
              className="w-full bg-gradient-to-r from-[#64B5F6] to-[#42A5F5] hover:from-[#42A5F5] hover:to-[#2196F3] text-white py-6 rounded-xl text-lg font-medium shadow-md hover:shadow-lg transition-all"
            >
              <div className="flex items-center justify-center gap-3">
                <Edit3 className="w-5 h-5" />
                <span>שנה משבץ</span>
              </div>
            </Button>

            {/* Cancel */}
            <Button
              onClick={onClose}
              variant="outline"
              className="w-full py-4 rounded-xl border-2 border-gray-300 hover:bg-gray-50"
            >
              ביטול
            </Button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}