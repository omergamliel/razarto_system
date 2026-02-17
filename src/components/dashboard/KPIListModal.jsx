import React, { useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Calendar, ArrowRight, ArrowLeftRight, CheckCircle, XCircle, MessageCircle, CalendarPlus } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { format, parseISO } from 'date-fns';
import { he } from 'date-fns/locale';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import LoadingSkeleton from '../LoadingSkeleton';
// תיקון נתיב הייבוא - עכשיו המערכת תמצא את הקובץ
import { buildSwapTemplate } from '../calendar/whatsappTemplates';

export default function KPIListModal({ isOpen, onClose, type, currentUser, onOfferCover, onCancelRequest, onDeleteShift, onApproveHeadToHead, onRequestSwap }) {
  const [visibleCount, setVisibleCount] = useState(10);

  const { data: swapRequestsAll = [], isLoading: isSwapLoading } = useQuery({ queryKey: ['kpi-swap-reqs'], queryFn: () => base44.entities.SwapRequest.list(), enabled: isOpen });
  const { data: shiftsAll = [] } = useQuery({ queryKey: ['kpi-shifts-list'], queryFn: () => base44.entities.Shift.list(), enabled: isOpen });
  const { data: usersAll = [] } = useQuery({ queryKey: ['kpi-users-list'], queryFn: () => base44.entities.AuthorizedPerson.list(), enabled: isOpen });

  const enrichData = useCallback((data) => {
    return data.map(req => {
      const shift = shiftsAll.find(s => s.id === req.shift_id);
      const user = usersAll.find(u => u.serial_id === (shift?.original_user_id || req.requesting_user_id));
      
      if (req.request_type === 'Head2Head') {
        const targetS = shiftsAll.find(s => s.id === req.shift_id);
        const offerS = shiftsAll.find(s => s.id === req.offered_shift_id);
        return {
          ...req, is_h2h: true,
          target_name: usersAll.find(u => u.serial_id === targetS?.original_user_id)?.full_name || 'לא ידוע',
          target_date: targetS?.start_date,
          offered_name: usersAll.find(u => u.serial_id === offerS?.original_user_id)?.full_name || 'לא ידוע',
          offered_date: offerS?.start_date,
          recipient_id: targetS?.original_user_id
        };
      }
      return { ...req, user_name: user?.full_name || 'לא ידוע', shift_date: shift?.start_date, start_time: shift?.start_time || '09:00', end_time: shift?.end_time || '09:00' };
    });
  }, [shiftsAll, usersAll]);

  const baseData = useMemo(() => {
    switch (type) {
      case 'swap_requests':
        return enrichData(swapRequestsAll.filter(r => r.status === 'Open' && r.request_type !== 'Head2Head'));
      case 'head_to_head_pending':
        return enrichData(swapRequestsAll.filter(r => r.status === 'Pending' && r.request_type === 'Head2Head'));
      case 'approved':
        return enrichData(swapRequestsAll.filter(r => ['Completed', 'Closed', 'Approved'].includes(r.status)));
      case 'my_shifts':
        const today = new Date().toISOString().split('T')[0];
        return shiftsAll.filter(s => s.original_user_id === currentUser?.serial_id && s.start_date >= today).map(s => ({ ...s, is_shift: true, user_name: currentUser?.full_name, shift_date: s.start_date }));
      default: return [];
    }
  }, [type, swapRequestsAll, shiftsAll, currentUser, enrichData]);

  // פונקציה לשיתוף חוזר בווצאפ
  const handleWhatsapp = (item) => {
    const msg = buildSwapTemplate({ 
        employeeName: item.user_name, 
        startDate: item.shift_date, 
        startTime: item.start_time, 
        endDate: item.shift_date, 
        endTime: item.end_time, 
        approvalUrl: window.location.origin 
    });
    window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank');
  };

  if (!isOpen) return null;

  const headerColors = { swap_requests: 'from-red-500 to-red-600', head_to_head_pending: 'from-yellow-500 to-yellow-600', approved: 'from-green-500 to-green-600', my_shifts: 'from-blue-500 to-blue-600' };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm" dir="rtl">
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[85vh] overflow-hidden flex flex-col">
          <div className={`p-6 text-white bg-gradient-to-r ${headerColors[type]}`}>
            <button onClick={onClose} className="absolute top-4 left-4 p-2 rounded-full hover:bg-white/20"><X className="w-5 h-5" /></button>
            <h2 className="text-2xl font-bold">{type === 'swap_requests' ? 'בקשות להחלפה' : type === 'head_to_head_pending' ? 'ראש בראש בהמתנה' : type === 'approved' ? 'היסטוריית החלפות' : 'המשמרות שלי'}</h2>
          </div>

          <div className="flex-1 p-6 overflow-y-auto space-y-3">
            {baseData.length === 0 ? <p className="text-center py-10 text-gray-400">אין נתונים להצגה</p> : baseData.slice(0, visibleCount).map((item, idx) => (
              <div key={item.id || idx} className={`p-4 rounded-2xl border ${item.is_h2h ? 'bg-yellow-50 border-yellow-100' : 'bg-gray-50 border-gray-200'}`}>
                {item.is_h2h ? (
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-3 text-sm text-right">
                      <div className="bg-white p-2 rounded-lg border">
                        <p className="text-[10px] text-gray-400 font-bold uppercase">מציע</p>
                        <p className="font-bold">{item.offered_name}</p>
                        <p className="text-gray-500">{item.offered_date}</p>
                      </div>
                      <div className="bg-white p-2 rounded-lg border">
                        <p className="text-[10px] text-gray-400 font-bold uppercase">צריך לאשר</p>
                        <p className="font-bold">{item.target_name}</p>
                        <p className="text-gray-500">{item.target_date}</p>
                      </div>
                    </div>
                    {currentUser?.serial_id === item.recipient_id && (
                      <Button onClick={() => onApproveHeadToHead(item)} className="w-full bg-green-600 text-white rounded-xl h-11 gap-2 shadow-md"><CheckCircle className="w-4 h-4" /> אשר החלפה זו</Button>
                    )}
                  </div>
                ) : (
                  <div className="flex items-center justify-between">
                    <div className="text-right">
                      <div className="flex items-center gap-2 font-bold text-gray-800"><Calendar className="w-4 h-4 text-gray-400" /> {item.shift_date}</div>
                      <p className="text-sm text-gray-600 mt-1">{item.user_name}</p>
                    </div>
                    <div className="flex gap-2">
                      {item.requesting_user_id === currentUser?.serial_id && (
                        <>
                          <Button variant="outline" size="icon" className="rounded-full text-red-500 border-red-100" onClick={() => onCancelRequest(item)}><XCircle className="w-5 h-5" /></Button>
                          <Button variant="outline" size="icon" className="rounded-full text-green-600 border-green-100" onClick={() => handleWhatsapp(item)}><MessageCircle className="w-5 h-5" /></Button>
                        </>
                      )}
                      {type === 'swap_requests' && item.requesting_user_id !== currentUser?.serial_id && (
                        <Button onClick={() => { onClose(); onOfferCover(item); }} size="sm" className="bg-blue-500 text-white rounded-xl h-9 px-4">אחליף <ArrowRight className="w-4 h-4 mr-1" /></Button>
                      )}
                      {item.is_shift && (
                        <div className="flex gap-2">
                          <Button variant="outline" size="icon" className="rounded-full text-blue-500 border-blue-100"><CalendarPlus className="w-5 h-5" /></Button>
                          <Button variant="outline" size="icon" className="rounded-full text-red-500 border-red-100" onClick={() => onRequestSwap(item)}><ArrowLeftRight className="w-5 h-5" /></Button>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}