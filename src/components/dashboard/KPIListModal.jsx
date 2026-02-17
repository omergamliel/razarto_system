import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Calendar, ArrowRight, Clock, AlertCircle, CalendarPlus, ArrowLeftRight, ChevronDown, Send, MessageCircle, XCircle, CheckCircle } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { format, parseISO } from 'date-fns';
import { he } from 'date-fns/locale';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import LoadingSkeleton from '../LoadingSkeleton';

// --- פונקציות עזר (ללא שינוי) ---
const getDisplayDay = (dateStr) => {
  if (!dateStr) return '';
  const parsed = parseISO(dateStr);
  return isNaN(parsed) ? '' : format(parsed, 'EEEE', { locale: he });
};

const isOpenStatus = (status) => ['Open', 'Partially_Covered'].includes(status);

export default function KPIListModal({ 
  isOpen, 
  onClose, 
  type, 
  currentUser, 
  onOfferCover, 
  onRequestSwap, 
  onApproveHeadToHead, // לוגיקת הראש בראש
  actionsDisabled = false, 
  onCancelRequest 
}) {
  
  const [visibleCount, setVisibleCount] = useState(10);
  const [swapTab, setSwapTab] = useState('all');

  // שליפת נתונים מהשרת (נשאר ללא שינוי מהקוד המקורי שלך)
  const { data: swapRequestsAll = [], isLoading: isSwapLoading } = useQuery({
    queryKey: ['kpi-swap-requests-all'],
    queryFn: () => base44.entities.SwapRequest.list(),
    enabled: isOpen
  });

  const { data: shiftsAll = [], isLoading: isShiftsLoading } = useQuery({
    queryKey: ['kpi-shifts-all'],
    queryFn: () => base44.entities.Shift.list(),
    enabled: isOpen
  });

  const { data: authorizedUsers = [], isLoading: isUsersLoading } = useQuery({
    queryKey: ['kpi-users-all'],
    queryFn: () => base44.entities.AuthorizedPerson.list(),
    enabled: isOpen
  });

  const isLoading = isSwapLoading || isShiftsLoading || isUsersLoading;

  // --- לוגיקת העשרה (שחזור המקור + תוספת ראש בראש) ---
  const enrichData = useCallback((data, dataType) => {
    if (dataType === 'my_shifts') {
      return data.map(s => ({ ...s, is_shift_object: true, user_name: currentUser?.full_name, shift_date: s.start_date }));
    }

    return data.map(req => {
      const shift = shiftsAll.find(s => s.id === req.shift_id);
      const user = authorizedUsers.find(u => u.serial_id === shift?.original_user_id);
      
      // אם זה ראש בראש, נוסיף נתונים של שתי המשמרות
      if (req.request_type === 'Head2Head') {
        const offeredShift = shiftsAll.find(s => s.id === req.offered_shift_id);
        const proposer = authorizedUsers.find(u => u.serial_id === req.requesting_user_id);
        return {
          ...req,
          is_h2h: true,
          target_user_name: user?.full_name || 'לא ידוע',
          target_date: shift?.start_date,
          offered_user_name: proposer?.full_name || 'לא ידוע',
          offered_date: offeredShift?.start_date,
          recipient_id: shift?.original_user_id
        };
      }

      return {
        ...req,
        is_request_object: true,
        user_name: user?.full_name || 'לא ידוע',
        shift_date: shift?.start_date,
        start_time: shift?.start_time || '09:00',
        end_time: shift?.end_time || '09:00'
      };
    });
  }, [shiftsAll, authorizedUsers, currentUser]);

  const baseData = useMemo(() => {
    if (isLoading) return [];
    
    switch (type) {
      case 'swap_requests':
        const open = swapRequestsAll.filter(r => isOpenStatus(r.status) && r.request_type !== 'Head2Head');
        return enrichData(open, 'requests');
      
      case 'head_to_head_pending':
        const pendingH2H = swapRequestsAll.filter(r => r.status === 'Pending' && r.request_type === 'Head2Head');
        return enrichData(pendingH2H, 'requests');
      
      case 'approved':
        const approved = swapRequestsAll.filter(r => ['Completed', 'Closed', 'Approved'].includes(r.status));
        return enrichData(approved, 'requests');
      
      case 'my_shifts':
        const todayStr = new Date().toISOString().split('T')[0];
        const mine = shiftsAll.filter(s => s.original_user_id === currentUser?.serial_id && s.start_date >= todayStr);
        return enrichData(mine, 'my_shifts');
      
      default: return [];
    }
  }, [type, swapRequestsAll, shiftsAll, currentUser, isLoading, enrichData]);

  // --- עיצוב כותרות ---
  const { title, color } = (() => {
    switch (type) {
      case 'swap_requests': return { title: 'בקשות להחלפה', color: 'from-red-500 to-red-600' };
      case 'head_to_head_pending': return { title: 'ראש בראש בהמתנה', color: 'from-yellow-500 to-yellow-600' };
      case 'approved': return { title: 'היסטוריית החלפות', color: 'from-green-500 to-green-600' };
      case 'my_shifts': return { title: 'המשמרות שלי', color: 'from-blue-500 to-blue-600' };
      default: return { title: '', color: '' };
    }
  })();

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
        <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="relative bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[85vh] overflow-hidden flex flex-col">
          
          <div className={`bg-gradient-to-r ${color} p-6 text-white`}>
            <button onClick={onClose} className="absolute top-4 left-4 p-2 rounded-full hover:bg-white/20 transition-colors"><X className="w-5 h-5" /></button>
            <h2 className="text-2xl font-bold">{title}</h2>
            <p className="text-white/80 text-sm mt-1">{baseData.length} רשומות</p>
          </div>

          <div className="flex-1 p-6 overflow-y-auto space-y-3">
            {isLoading ? (
              <LoadingSkeleton className="h-20 w-full" />
            ) : baseData.length === 0 ? (
              <div className="text-center py-12 text-gray-500 italic">אין נתונים להצגה</div>
            ) : (
              baseData.slice(0, visibleCount).map((item, idx) => {
                
                // --- תצוגה ייחודית לראש בראש (צהוב) ---
                if (item.is_h2h) {
                  const isRecipient = currentUser?.serial_id === item.recipient_id;
                  return (
                    <div key={item.id || idx} className="bg-yellow-50 border border-yellow-200 rounded-2xl p-4 shadow-sm">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2 text-yellow-700 font-bold"><ArrowLeftRight className="w-5 h-5" /> <span>ראש בראש</span></div>
                      </div>
                      <div className="grid grid-cols-2 gap-3 mb-4 text-sm">
                        <div className="bg-white p-2 rounded-lg border">
                          <p className="text-[10px] text-gray-400 font-bold uppercase">מציע</p>
                          <p className="font-bold">{item.offered_user_name}</p>
                          <p className="text-gray-500">{item.offered_date}</p>
                        </div>
                        <div className="bg-white p-2 rounded-lg border">
                          <p className="text-[10px] text-gray-400 font-bold uppercase">צריך לאשר</p>
                          <p className="font-bold">{item.target_user_name}</p>
                          <p className="text-gray-500">{item.target_date}</p>
                        </div>
                      </div>
                      {isRecipient ? (
                        <Button onClick={() => onApproveHeadToHead(item)} className="w-full bg-green-600 text-white rounded-xl h-11 shadow-md gap-2"><CheckCircle className="w-4 h-4" /> אשר החלפה זו</Button>
                      ) : (
                        <p className="text-center text-xs text-yellow-600 italic">ממתין לאישור של הצד השני...</p>
                      )}
                    </div>
                  );
                }

                // --- תצוגה רגילה (אדום, ירוק, כחול) - החזרתי בדיוק את מה שהיה לך ---
                const isMyRequest = item.requesting_user_id === currentUser?.serial_id;
                return (
                  <div key={item.id || idx} className="bg-gray-50 border border-gray-200 rounded-2xl p-4 flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-gray-400" />
                        <span className="font-bold text-gray-800">{item.shift_date || item.start_date}</span>
                        <span className="text-xs text-gray-500">({getDisplayDay(item.shift_date || item.start_date)})</span>
                      </div>
                      <p className="text-sm font-medium text-gray-700 mt-1">{item.user_name}</p>
                    </div>

                    <div className="flex gap-2">
                      {/* כפתור אחליף - רק לבקשות של אחרים ב-Red KPI */}
                      {type === 'swap_requests' && !isMyRequest && (
                        <Button onClick={() => { onClose(); onOfferCover(item); }} size="sm" className="bg-blue-500 text-white rounded-xl h-9">אחליף <ArrowRight className="w-4 h-4 mr-1" /></Button>
                      )}
                      {/* כפתור הוספה ליומן - לכחול וירוק */}
                      {(type === 'my_shifts' || type === 'approved') && (
                        <Button variant="outline" size="icon" className="rounded-full border-blue-200 text-blue-600 h-10 w-10">
                          <CalendarPlus className="w-5 h-5" />
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}