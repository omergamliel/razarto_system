import React from 'react';
import { format } from 'date-fns';
import { he } from 'date-fns/locale';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CheckCircle, Calendar, Clock, User, AlertCircle, ArrowRight } from 'lucide-react';
import { Button } from "@/components/ui/button";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export default function PendingApprovalModal({ 
  isOpen, 
  onClose, 
  requests,
  onApprove,
  isApproving
}) {
  const [confirmApprove, setConfirmApprove] = React.useState(null);

  if (!isOpen) return null;

  const pendingApprovalRequests = requests.filter(
    r => r.status === 'pending_approval'
  );

  const handleApprove = () => {
    if (confirmApprove) {
      onApprove(confirmApprove);
      setConfirmApprove(null);
    }
  };

  const formatTimeBreakdown = (request) => {
    const isFull = request.covered_start_time === '09:00' && 
                   (request.covered_end_time === '09:00' || request.covered_end_time === '09:00 (למחרת)');
    
    if (isFull) {
      return '09:00 - 09:00 (למחרת) - החלפה מלאה';
    }

    return (
      <div className="space-y-1 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-red-400" />
          <span>09:00 - {request.covered_start_time}: {request.role} (מקורי)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-blue-400" />
          <span>{request.covered_start_time} - {request.covered_end_time}: {request.covering_role} (מחליף)</span>
        </div>
        {request.remaining_hours && (
          <div className="flex items-center gap-2 text-orange-600">
            <div className="w-2 h-2 rounded-full bg-orange-400" />
            <span>פער נותר: {request.remaining_hours}</span>
          </div>
        )}
      </div>
    );
  };

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
          className="relative bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[80vh] flex flex-col"
        >
          <div className="bg-gradient-to-r from-purple-500 to-purple-600 p-6 text-white flex-shrink-0">
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
                <h2 className="text-xl font-bold">החלפות לאישור</h2>
                <p className="text-white/80 text-sm">
                  {pendingApprovalRequests.length} החלפות ממתינות לאישורך
                </p>
              </div>
            </div>
          </div>

          <div className="flex-1 p-6 overflow-y-auto">
            {pendingApprovalRequests.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <CheckCircle className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                <p className="font-semibold">אין החלפות ממתינות</p>
                <p className="text-sm mt-1">כל הבקשות טופלו</p>
              </div>
            ) : (
              <div className="space-y-4">
                {pendingApprovalRequests.map((request) => (
                  <div
                    key={request.id}
                    className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-5 border-2 border-purple-200"
                  >
                    <div className="mb-4">
                      <div className="flex items-center gap-2 mb-3">
                        <Calendar className="w-5 h-5 text-purple-600" />
                        <span className="font-bold text-gray-800 text-lg">
                          {format(new Date(request.date), 'EEEE, d בMMMM', { locale: he })}
                        </span>
                      </div>

                      {/* Swap Parties */}
                      <div className="bg-white rounded-xl p-4 mb-3">
                        <div className="flex items-center justify-center gap-3 text-center">
                          <div className="flex-1">
                            <div className="text-xs text-gray-500 mb-1">תפקיד מקורי</div>
                            <div className="font-bold text-red-600 text-lg">{request.role}</div>
                          </div>
                          
                          <div className="flex flex-col items-center">
                            <ArrowRight className="w-6 h-6 text-purple-600" />
                            <span className="text-xs text-purple-600 font-medium">מחליף עם</span>
                          </div>
                          
                          <div className="flex-1">
                            <div className="text-xs text-gray-500 mb-1">תפקיד מחליף</div>
                            <div className="font-bold text-blue-600 text-lg">{request.covering_role}</div>
                          </div>
                        </div>
                      </div>

                      {/* Time Breakdown */}
                      <div className="bg-white rounded-xl p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <Clock className="w-4 h-4 text-gray-500" />
                          <span className="text-sm font-semibold text-gray-700">פילוח שעות:</span>
                        </div>
                        {formatTimeBreakdown(request)}
                      </div>
                    </div>

                    <Button
                      onClick={() => setConfirmApprove(request)}
                      disabled={isApproving}
                      className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white"
                    >
                      <CheckCircle className="w-4 h-4 mr-2" />
                      אשר החלפה
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </motion.div>

        {/* Approval Confirmation Dialog */}
        <Dialog open={!!confirmApprove} onOpenChange={() => setConfirmApprove(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-green-500" />
                אישור החלפה
              </DialogTitle>
              <DialogDescription>
                האם אתה בטוח שברצונך לאשר את ההחלפה? לאחר האישור, המשמרת תעודכן בלוח השנה.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setConfirmApprove(null)}>
                ביטול
              </Button>
              <Button
                className="bg-green-600 hover:bg-green-700"
                onClick={handleApprove}
              >
                אשר
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AnimatePresence>
  );
}