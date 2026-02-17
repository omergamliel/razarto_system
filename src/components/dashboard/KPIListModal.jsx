import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Calendar, ArrowRight, Clock, AlertCircle, CalendarPlus, ArrowLeftRight, ChevronDown, MessageCircle, XCircle, CheckCircle } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { format, parseISO } from 'date-fns';
import { he } from 'date-fns/locale';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import LoadingSkeleton from '../LoadingSkeleton';

// --- פונקציות עזר לתצוגה ---
const getDisplayDay = (dateStr) => {
  if (!dateStr) return '';
  const parsed = parseISO(dateStr);
  return isNaN(parsed) ? '' : format(parsed, 'EEEE', { locale: he });
};

export default function KPIListModal({ 
  isOpen, 
  onClose, 
  type, 
  currentUser, 
  onOfferCover, 
  onRequestSwap, 
  onApproveHeadToHead, // פרופ חדש לפתיחת מודל האישור
  actionsDisabled = false, 
  onCancelRequest 
}) {
  
  const [visibleCount, setVisibleCount] = useState(10);
  const [swapTab, setSwapTab] = useState('all');

  // שליפת נתונים מהשרת
  const { data: swapRequestsAll = [], isLoading: isSwapRequestsLoading } = useQuery({
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

  const isLoading = isSwapRequestsLoading || isShiftsLoading || isUsersLoading;

  // --- לוגיקת העשרת נתונים לבקשות ראש בראש ---
  const enrichHeadToHeadInfo = useCallback((requests) => {
    return requests.map(req => {
      // המשמרת שאותה ביקשו להחליף (היעד)
      const targetShift = shiftsAll.find(s => s.id === req.shift_id);
      const recipient = authorizedUsers.find(u => u.serial_id === targetShift?.original_user_id);
      
      // המשמרת שהוצעה בתמורה
      const offeredShift = shiftsAll.find(s => s.id === req.offered_shift_id);
      const proposer = authorizedUsers.find(u => u.serial_id === req.requesting_user_id);

      return {
        ...req,
        target_shift_date: targetShift?.start_date,
        target_user_name: recipient?.full_name || 'לא ידוע',
        offered_shift_date: offeredShift?.start_date,
        offered_user_name: proposer?.full_name || 'לא ידוע',
        is_h2h: true
      };
    });
  }, [shiftsAll, authorizedUsers]);

  const baseData = useMemo(() => {
    if (isLoading) return [];
    
    switch (type) {
      case 'head_to_head_pending':
        const pendingH2H = swapRequestsAll.filter(r => r.status === 'Pending' && r.request_type === 'Head2Head');
        return enrichHeadToHeadInfo(pendingH2H);
      
      case 'my_shifts':
        const todayStr = new Date().toISOString().split('T')[0];
        return shiftsAll
          .filter(s => s.original_user_id === currentUser?.serial_id && s.start_date >= todayStr)
          .map(s => ({ ...s, is_shift_object: true, user_name: currentUser?.full_name }));
      
      default:
        // לוגיקה קיימת לשאר ה-KPIs
        return swapRequestsAll.filter(r => r.status === 'Open').map(req => {
          const s = shiftsAll.find(sh => sh.id === req.shift_id);
          const u = authorizedUsers.find(usr => usr.serial_id === s?.original_user_id);
          return { ...req, user_name: u?.full_name || 'לא ידוע', shift_date: s?.start_date };
        });
    }
  }, [type, swapRequestsAll, shiftsAll, authorizedUsers, currentUser, isLoading, enrichHeadToHeadInfo]);

  if (!isOpen) return null;

  const { title, color } = (() => {
    if (type === 'head_to_head_pending') return { title: 'ראש בראש בהמתנה', color: 'from-yellow-500 to-yellow-600' };
    if (type === 'my_shifts') return { title: 'המשמרות שלי', color: 'from-blue-500 to-blue-600' };
    return { title: 'בקשות להחלפה', color: 'from-red-500 to-red-600' };
  })();

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
        <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="relative bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[85vh] overflow-hidden flex flex-col">
          
          <div className={`bg-gradient-to-r ${color} p-6 text-white`}>
            <button onClick={onClose} className="absolute top-4 left-4 p-2 rounded-full hover:bg-white/20 transition-colors"><X className="w-5 h-5" /></button>
            <h2 className="text-2xl font-bold">{title}</h2>
            <p className="text-white/80 text-sm mt-1">{baseData.length} רשומות ממתינות</p>
          </div>

          <div className="flex-1 p-6 overflow-y-auto space-y-3">
            {isLoading ? (
              <LoadingSkeleton className="h-20 w-full" />
            ) : baseData.length === 0 ? (
              <div className="text-center py-12 text-gray-500 italic">אין בקשות פעילות כרגע</div>
            ) : (
              baseData.slice(0, visibleCount).map((item, idx) => {
                
                // --- לוגיקת תצוגה ייחודית לראש בראש ---
                if (item.is_h2h) {
                  const iAmRecipient = currentUser?.serial_id === item.requesting_user_id ? false : true; 
                  // הערה: בראש בראש, ה-requesting_user הוא זה שהציע. השני הוא ה-Recipient.

                  return (
                    <div key={item.id || idx} className="bg-yellow-50 border border-yellow-200 rounded-2xl p-4 shadow-sm">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2 text-yellow-700 font-bold">
                          <ArrowLeftRight className="w-5 h-5" /> <span>הצעת ראש בראש</span>
                        </div>
                        <span className="text-xs font-medium text-yellow-600 bg-white px-2 py-1 rounded-lg border border-yellow-100">ממתין לאישור</span>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        {/* הצד המציע */}
                        <div className="bg-white/60 p-3 rounded-xl border border-yellow-100">
                          <p className="text-[10px] text-gray-500 font-bold uppercase">המציע</p>
                          <p className="font-bold text-gray-800">{item.offered_user_name}</p>
                          <p className="text-sm text-gray-600">{item.offered_shift_date} ({getDisplayDay(item.offered_shift_date)})</p>
                        </div>
                        
                        {/* הצד שצריך לאשר */}
                        <div className="bg-white/60 p-3 rounded-xl border border-yellow-100">
                          <p className="text-[10px] text-gray-500 font-bold uppercase">צריך לאשר</p>
                          <p className="font-bold text-gray-800">{item.target_user_name}</p>
                          <p className="text-sm text-gray-600">{item.target_shift_date} ({getDisplayDay(item.target_shift_date)})</p>
                        </div>
                      </div>

                      {/* כפתור אישור - מופיע רק לנמען */}
                      {iAmRecipient && (
                        <Button 
                          onClick={() => { onClose(); onApproveHeadToHead(item); }}
                          className="w-full bg-green-600 hover:bg-green-700 text-white rounded-xl h-11 shadow-md gap-2"
                        >
                          <CheckCircle className="w-5 h-5" /> אשר החלפה זו
                        </Button>
                      )}
                    </div>
                  );
                }

                // --- לוגיקה קיימת לשאר סוגי המשמרות ---
                return (
                  <div key={item.id || idx} className="bg-gray-50 border border-gray-200 rounded-2xl p-4 flex items-center justify-between">
                    <div>
                      <p className="font-bold text-gray-800">{item.user_name}</p>
                      <div className="flex items-center gap-2 text-sm text-gray-500 mt-1">
                        <Calendar className="w-4 h-4" /> <span>{item.shift_date || item.start_date}</span>
                      </div>
                    </div>
                    {/* אייקון לוח שנה מופיע רק במשמרות שלי או בקשות רגילות */}
                    {!item.is_h2h && (
                      <Button variant="outline" size="icon" className="rounded-full border-blue-200 text-blue-600">
                        <CalendarPlus className="w-5 h-5" />
                      </Button>
                    )}
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