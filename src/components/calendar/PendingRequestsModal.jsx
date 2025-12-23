import React from 'react';
import { format } from 'date-fns';
import { he } from 'date-fns/locale';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Clock, Calendar, CheckCircle, User, ArrowLeftRight } from 'lucide-react';
import { Button } from "@/components/ui/button";

export default function PendingRequestsModal({ 
  isOpen, 
  onClose, 
  requests,
  onAccept,
  isAccepting,
  currentUserEmail
}) {
  if (!isOpen) return null;

  const pendingRequests = requests.filter(
    r => r.status === 'swap_requested' && r.assigned_email !== currentUserEmail
  );

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
          <div className="bg-gradient-to-r from-[#64B5F6] to-[#42A5F5] p-6 text-white flex-shrink-0">
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
                <h2 className="text-xl font-bold">בקשות ממתינות</h2>
                <p className="text-white/80 text-sm">
                  {pendingRequests.length} בקשות פתוחות
                </p>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {pendingRequests.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="w-8 h-8 text-gray-400" />
                </div>
                <p className="text-gray-500 font-medium">אין בקשות ממתינות</p>
                <p className="text-gray-400 text-sm mt-1">כל המשמרות מסודרות</p>
              </div>
            ) : (
              pendingRequests.map((request, index) => (
                <motion.div
                  key={request.id}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-gradient-to-br from-[#FFEBEE] to-[#FFCDD2] rounded-2xl p-4 border border-[#E57373]/30"
                >
                  {/* Request Header */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm">
                        <User className="w-5 h-5 text-[#E57373]" />
                      </div>
                      <div>
                        <p className="font-semibold text-gray-800">
                          {request.role}
                        </p>
                        <p className="text-xs text-gray-500">מבקש החלפה</p>
                      </div>
                    </div>
                  </div>

                  {/* Request Details */}
                  <div className="bg-white/60 rounded-xl p-3 space-y-2 mb-3">
                    <div className="flex items-center gap-2 text-sm">
                      <Calendar className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-700">
                        {format(new Date(request.date), 'EEEE, d בMMMM', { locale: he })}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Clock className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-700">
                        {request.swap_type === 'full' 
                          ? 'משמרת מלאה (24 שעות)'
                          : `${request.swap_start_time} - ${request.swap_end_time}`
                        }
                      </span>
                    </div>

                  </div>

                  {/* Accept Button */}
                  <Button
                    onClick={() => onAccept(request)}
                    disabled={isAccepting}
                    className="w-full bg-gradient-to-r from-[#64B5F6] to-[#42A5F5] hover:from-[#42A5F5] hover:to-[#2196F3] text-white rounded-xl"
                  >
                    <span className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4" />
                      אני אכסה את המשמרת
                    </span>
                  </Button>
                </motion.div>
              ))
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}