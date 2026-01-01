import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Calendar, ArrowRight, Clock, AlertCircle, CalendarPlus, MessageCircle, ChevronDown } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { format } from 'date-fns';
import { he } from 'date-fns/locale';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';

export default function KPIListModal({ isOpen, onClose, type, currentUser, onOfferCover }) {
  
  const [visibleCount, setVisibleCount] = useState(10);
  const [listData, setListData] = useState([]); // Unified state for the list items

  useEffect(() => {
    if (isOpen) setVisibleCount(10);
  }, [isOpen, type]);

  // --- QUERY: Fetch Data Based on Type ---
  const { data: rawData = [], isLoading } = useQuery({
    queryKey: ['kpi-list-data', type, currentUser?.serial_id],
    queryFn: async () => {
        if (type === 'swap_requests') {
            // Fetch Open Full Requests + Join Shift Info
            const reqs = await base44.entities.SwapRequest.filter({ status: 'Open', request_type: 'Full' });
            return await enrichRequestsWithShiftInfo(reqs);
        }
        if (type === 'partial_gaps') {
            // Fetch Open/Partial Partial Requests
            const reqsOpen = await base44.entities.SwapRequest.filter({ status: 'Open', request_type: 'Partial' });
            const reqsPartial = await base44.entities.SwapRequest.filter({ status: 'Partially_Covered' });
            return await enrichRequestsWithShiftInfo([...reqsOpen, ...reqsPartial]);
        }
        if (type === 'approved') {
            // Fetch Completed Requests
            const reqs = await base44.entities.SwapRequest.filter({ status: 'Completed' });
            return await enrichRequestsWithShiftInfo(reqs);
        }
        if (type === 'my_shifts') {
            // Complex: Get My Shifts + My Coverages
            // For simplicity, fetching all shifts where original_user_id is me
            const myShifts = await base44.entities.Shift.filter({ original_user_id: currentUser.serial_id });
            const todayStr = new Date().toISOString().split('T')[0];
            const futureShifts = myShifts.filter(s => s.start_date >= todayStr);
            // Enrich them to look like requests for uniform display (or handle differently)
            return await enrichShiftsWithUserInfo(futureShifts);
        }
        return [];
    },
    enabled: isOpen && !!currentUser?.serial_id
  });

  // --- Helpers ---
  const enrichRequestsWithShiftInfo = async (requests) => {
      const shiftIds = [...new Set(requests.map(r => r.shift_id))];
      // Fetch all relevant shifts (Mocking bulk fetch via multiple calls or if API supports IN)
      const shifts = await Promise.all(shiftIds.map(id => base44.entities.Shift.get(id)));
      
      // Fetch users for names
      const userIds = [...new Set(shifts.map(s => s.original_user_id))];
      const users = await Promise.all(userIds.map(id => 
          base44.entities.AuthorizedPerson.filter({ serial_id: id }).then(res => res[0])
      ));

      return requests.map(req => {
          const shift = shifts.find(s => s.id === req.shift_id);
          const user = users.find(u => u?.serial_id === shift?.original_user_id);
          return {
              ...req,
              shift_date: shift?.start_date,
              user_name: user?.full_name || 'לא ידוע',
              original_shift: shift,
              is_request_object: true
          };
      });
  };

  const enrichShiftsWithUserInfo = async (shifts) => {
      // Just adding user name (me) for consistency
      return shifts.map(s => ({
          ...s,
          user_name: currentUser.full_name,
          shift_date: s.start_date,
          is_shift_object: true // Distinguish from request object
      }));
  };

  // --- Handlers ---
  const handleAddToCalendar = (item) => {
      // Logic for GCal
      const date = item.shift_date;
      const title = `משמרת - ${item.user_name}`;
      const gCalUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${date}/${date}`; // Simplified
      window.open(gCalUrl, '_blank');
  };

  const handleWhatsAppShare = (item) => {
      const appLink = window.location.origin;
      const message = `היי, זקוק להחלפה למשמרת ב-${item.shift_date}. עזרה? ${appLink}`;
      const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
      window.open(whatsappUrl, '_blank');
  };

  // --- Render ---
  const getTitleAndColor = () => {
    switch (type) {
      case 'swap_requests': return { title: 'בקשות להחלפה', color: 'from-red-500 to-red-600' };
      case 'partial_gaps': return { title: 'משמרות בפער חלקי', color: 'from-yellow-500 to-yellow-600' };
      case 'approved': return { title: 'החלפות שבוצעו', color: 'from-green-500 to-green-600' };
      case 'my_shifts': return { title: 'המשמרות העתידיות שלי', color: 'from-blue-500 to-blue-600' };
      default: return { title: '', color: '' };
    }
  };

  const { title, color } = getTitleAndColor();
  const displayedItems = rawData.slice(0, visibleCount);
  const hasMore = rawData.length > visibleCount;

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
        <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="relative bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
          
          <div className={`bg-gradient-to-r ${color} p-6 text-white`}>
            <button onClick={onClose} className="absolute top-4 left-4 p-2 rounded-full hover:bg-white/20 transition-colors"><X className="w-5 h-5" /></button>
            <h2 className="text-2xl font-bold">{title}</h2>
            <p className="text-white/90 text-sm mt-1">{rawData.length} רשומות</p>
          </div>

          <div className="flex-1 p-6 max-h-[60vh] overflow-y-auto">
            {isLoading ? <p className="text-center py-10 text-gray-500">טוען...</p> : 
             rawData.length === 0 ? (
              <div className="text-center py-12 text-gray-500"><p>אין נתונים להצגה</p></div>
            ) : (
              <div className="space-y-3">
                {displayedItems.map((item, idx) => {
                  const isMyRequest = item.requesting_user_id === currentUser?.serial_id;

                  return (
                    <div key={item.id || idx} className="bg-gray-50 rounded-xl p-4 border border-gray-200 hover:shadow-md transition-all">
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <Calendar className="w-4 h-4 text-gray-500" />
                            <span className="font-semibold text-gray-800">{item.shift_date ? format(new Date(item.shift_date), 'dd/MM/yyyy') : 'תאריך לא ידוע'}</span>
                          </div>
                          
                          <p className="text-sm text-gray-800 font-medium">{item.user_name}</p>

                          {/* Time display logic */}
                          <div className="mt-1 flex items-center gap-2 text-xs text-gray-600">
                             <Clock className="w-3 h-3" />
                             {item.is_request_object ? (
                                 <span>{item.req_start_time} - {item.req_end_time}</span>
                             ) : (
                                 <span>09:00 - 09:00</span>
                             )}
                          </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex items-center gap-2 flex-shrink-0">
                             
                             {/* If it's a request from someone else, show "I'll cover" */}
                             {item.is_request_object && !isMyRequest && type !== 'approved' && (
                                   <Button onClick={() => { onClose(); onOfferCover(item); }} size="sm" className="bg-blue-500 text-white hover:bg-blue-600 px-3 h-9">
                                       אחליף <ArrowRight className="w-4 h-4 mr-1" />
                                   </Button>
                             )}

                             {/* If it's my shift/request */}
                             {(item.is_shift_object || isMyRequest) && (
                                <>
                                    <Button onClick={() => handleAddToCalendar(item)} size="icon" variant="outline" className="rounded-full w-10 h-10 border-blue-200 text-blue-600 hover:bg-blue-50 transition-colors shadow-sm">
                                        <CalendarPlus className="w-5 h-5" />
                                    </Button>
                                    <Button onClick={() => handleWhatsAppShare(item)} size="icon" className="rounded-full w-10 h-10 bg-[#25D366] hover:bg-[#128C7E] text-white shadow-sm">
                                        <MessageCircle className="w-5 h-5" />
                                    </Button>
                                </>
                             )}
                        </div>
                      </div>
                    </div>
                  );
                })}

                {hasMore && (
                    <div className="pt-2 flex justify-center">
                        <Button variant="ghost" size="sm" onClick={() => setVisibleCount(prev => prev + 10)} className="text-gray-500 hover:text-gray-800 hover:bg-gray-100 w-full">
                            <ChevronDown className="w-4 h-4 mr-2" /> הצג עוד
                        </Button>
                    </div>
                )}
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}