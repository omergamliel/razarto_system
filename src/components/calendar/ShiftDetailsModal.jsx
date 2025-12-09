import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { he } from 'date-fns/locale';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Calendar, Clock, User, Trash2, Plus, AlertCircle } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';

export default function ShiftDetailsModal({ 
  isOpen, 
  onClose, 
  shift,
  date,
  onCoverSegment,
  onDelete,
  currentUserEmail
}) {
  const [segments, setSegments] = useState([]);

  // Fetch shift segments
  const { data: allSegments = [] } = useQuery({
    queryKey: ['shift-segments', shift?.id],
    queryFn: () => base44.entities.ShiftSegment.list(),
    enabled: !!shift?.id
  });

  useEffect(() => {
    if (shift && allSegments.length > 0) {
      const shiftSegs = allSegments.filter(s => s.shift_id === shift.id);
      setSegments(shiftSegs);
    }
  }, [shift, allSegments]);

  if (!isOpen || !shift) return null;

  // Calculate covered and gap hours
  const calculateCoverage = () => {
    if (segments.length === 0 && shift.status !== 'partially_covered') {
      return { covered: [], gaps: [{ start: '09:00', end: '09:00 (למחרת)' }] };
    }

    const covered = segments.map(s => ({
      start: s.start_time,
      end: s.end_time,
      person: s.assigned_person,
      role: s.role
    }));

    // Simple gap calculation - show if there are uncovered hours
    const gaps = [];
    if (shift.status === 'partially_covered' && shift.gap_hours) {
      gaps.push({ description: shift.gap_hours });
    }

    return { covered, gaps };
  };

  const { covered, gaps } = calculateCoverage();
  const hasGaps = gaps.length > 0 || shift.status === 'swap_requested';
  const isOwnShift = shift.assigned_email === currentUserEmail;

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
          className="relative bg-white rounded-3xl shadow-2xl w-full max-w-lg max-h-[80vh] overflow-hidden flex flex-col"
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-gray-700 to-gray-800 p-6 text-white flex-shrink-0">
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
                <h2 className="text-xl font-bold">פרטי משמרת</h2>
                <p className="text-white/80 text-sm">
                  {date && format(date, 'EEEE, d בMMMM yyyy', { locale: he })}
                </p>
              </div>
            </div>
          </div>

          {/* Content */}
          <ScrollArea className="flex-1">
            <div className="p-6 space-y-4">
              {/* Original Assignment */}
              <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-4 border border-gray-200">
                <p className="text-sm text-gray-500 mb-1">משובץ במקור</p>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-gray-800">{shift.assigned_person}</p>
                    {shift.role && (
                      <p className="text-sm text-[#E57373] font-medium">{shift.role}</p>
                    )}
                  </div>
                  {isOwnShift && (
                    <Button
                      onClick={() => onDelete(shift)}
                      variant="ghost"
                      size="sm"
                      className="text-red-500 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="w-4 h-4 mr-1" />
                      מחק שיבוץ
                    </Button>
                  )}
                </div>
                <div className="mt-2 pt-2 border-t border-gray-300">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Clock className="w-4 h-4" />
                    <span>09:00 - 09:00 (למחרת)</span>
                  </div>
                </div>
              </div>

              {/* Coverage Breakdown */}
              {covered.length > 0 && (
                <div className="space-y-2">
                  <h3 className="font-semibold text-gray-700 flex items-center gap-2">
                    <User className="w-4 h-4" />
                    כיסוי קיים
                  </h3>
                  {covered.map((cov, idx) => (
                    <div key={idx} className="bg-[#E3F2FD] rounded-xl p-3 border border-[#64B5F6]">
                      <p className="font-medium text-gray-800">{cov.person}</p>
                      {cov.role && (
                        <p className="text-xs text-[#64B5F6]">{cov.role}</p>
                      )}
                      <div className="flex items-center gap-2 text-sm text-gray-600 mt-1">
                        <Clock className="w-3 h-3" />
                        <span>{cov.start} - {cov.end}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Gaps */}
              {hasGaps && (
                <div className="space-y-2">
                  <h3 className="font-semibold text-gray-700 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-[#FFB74D]" />
                    פערים שנדרש לכסות
                  </h3>
                  {gaps.map((gap, idx) => (
                    <div key={idx} className="bg-gradient-to-br from-[#FFF3E0] to-[#FFE0B2] rounded-xl p-4 border border-[#FFB74D]">
                      {gap.description ? (
                        <p className="text-sm text-gray-700">{gap.description}</p>
                      ) : (
                        <div className="flex items-center gap-2 text-sm text-gray-700">
                          <Clock className="w-4 h-4" />
                          <span>{gap.start} - {gap.end}</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Cover Segment Button */}
              {hasGaps && !isOwnShift && (
                <Button
                  onClick={() => {
                    onClose();
                    onCoverSegment(shift);
                  }}
                  className="w-full bg-gradient-to-r from-[#64B5F6] to-[#42A5F5] hover:from-[#42A5F5] hover:to-[#2196F3] text-white py-6 rounded-xl text-lg font-medium shadow-md"
                >
                  <div className="flex items-center justify-center gap-3">
                    <Plus className="w-5 h-5" />
                    <span>לכיסוי מקטע במשמרת</span>
                  </div>
                </Button>
              )}
            </div>
          </ScrollArea>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}