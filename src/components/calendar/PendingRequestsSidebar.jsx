import React from 'react';
import { format } from 'date-fns';
import { he } from 'date-fns/locale';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, Calendar, User, CheckCircle, AlertCircle } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";

export default function PendingRequestsSidebar({ 
  requests,
  onCoverShift,
  currentUserEmail
}) {
  const pendingRequests = requests.filter(
    r => r.status === 'swap_requested' && r.assigned_email !== currentUserEmail
  );

  if (pendingRequests.length === 0) {
    return (
      <div className="bg-white rounded-2xl shadow-md border border-gray-100 p-6">
        <div className="flex items-center gap-3 mb-4 pb-4 border-b border-gray-200">
          <div className="p-2 bg-[#E3F2FD] rounded-lg">
            <AlertCircle className="w-5 h-5 text-[#64B5F6]" />
          </div>
          <h3 className="text-lg font-bold text-gray-800">בקשות ממתינות להחלפה</h3>
        </div>
        <div className="text-center py-8">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
            <CheckCircle className="w-8 h-8 text-gray-400" />
          </div>
          <p className="text-gray-500 font-medium">אין בקשות ממתינות</p>
          <p className="text-gray-400 text-sm mt-1">כל המשמרות מסודרות</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-md border border-gray-100 overflow-hidden">
      <div className="flex items-center gap-3 p-6 pb-4 border-b border-gray-200 bg-gradient-to-r from-[#FFEBEE] to-[#FFCDD2]">
        <div className="p-2 bg-white rounded-lg shadow-sm">
          <AlertCircle className="w-5 h-5 text-[#E57373]" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-gray-800">בקשות ממתינות להחלפה</h3>
          <p className="text-sm text-gray-600">{pendingRequests.length} בקשות פתוחות</p>
        </div>
      </div>

      <ScrollArea className="h-[400px]">
        <div className="p-4 space-y-3">
          <AnimatePresence>
            {pendingRequests.map((request, index) => (
              <motion.div
                key={request.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className="bg-gradient-to-br from-gray-50 to-white rounded-xl p-4 border border-gray-200 hover:shadow-md transition-shadow"
              >
                {/* Request Header */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-[#E57373] to-[#EF5350] rounded-lg flex items-center justify-center shadow-sm">
                      <User className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-800">
                        {request.assigned_person}
                      </p>
                      {request.role && (
                        <p className="text-xs text-[#E57373] font-medium">
                          {request.role}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Request Details */}
                <div className="space-y-2 mb-3">
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="w-4 h-4 text-gray-400" />
                    <span className="text-gray-700 font-medium">
                      {format(new Date(request.date), 'EEEE, d בMMMM', { locale: he })}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Clock className="w-4 h-4 text-gray-400" />
                    <span className="text-gray-700">
                      {request.swap_type === 'full' 
                        ? `משמרת מלאה (24 שעות)`
                        : `${request.swap_start_time} - ${request.swap_end_time}`
                      }
                    </span>
                  </div>
                </div>

                {/* Cover Button */}
                <Button
                  onClick={() => onCoverShift(request)}
                  className="w-full bg-gradient-to-r from-[#64B5F6] to-[#42A5F5] hover:from-[#42A5F5] hover:to-[#2196F3] text-white rounded-lg text-sm py-2 shadow-sm"
                >
                  <span className="flex items-center justify-center gap-2">
                    <CheckCircle className="w-4 h-4" />
                    אכסה את המשמרת
                  </span>
                </Button>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </ScrollArea>
    </div>
  );
}