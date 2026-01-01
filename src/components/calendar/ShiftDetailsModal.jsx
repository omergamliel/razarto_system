import React, { useState } from 'react';
import { format, addDays } from 'date-fns';
import { he } from 'date-fns/locale';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Calendar, Clock, User, Trash2, CheckCircle, AlertCircle, CalendarPlus, ArrowLeftRight, XCircle, Share2, Send } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

export default function ShiftDetailsModal({ 
  isOpen, 
  onClose, 
  shift,
  date,
  onOfferCover,
  onHeadToHead,
  onCancelRequest, 
  onDelete,
  onApprove,
  currentUserEmail,
  isAdmin
}) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // --- Fetch Active Request Info ---
  const { data: activeRequest } = useQuery({
    queryKey: ['shift-active-request-details', shift?.id],
    queryFn: async () => {
       if (!shift?.id) return null;
       const reqs = await base44.entities.SwapRequest.filter({ shift_id: shift.id, status: 'Open' });
       return reqs.length > 0 ? reqs[0] : null;
    },
    enabled: !!shift?.id && isOpen
  });

  // --- Fetch Coverages ---
  const { data: coverages = [] } = useQuery({
    queryKey: ['shift-coverages-details', activeRequest?.id],
    queryFn: async () => {
      if (!activeRequest?.id) return [];
      return await base44.entities.ShiftCoverage.filter({ request_id: activeRequest.id });
    },
    enabled: !!activeRequest?.id && isOpen
  });

  // --- Fetch Covering Users Info (to show names) ---
  const { data: coveringUsers = [] } = useQuery({
      queryKey: ['covering-users-info', coverages],
      queryFn: async () => {
          if (coverages.length === 0) return [];
          const userIds = coverages.map(c => c.covering_user_id);
          // Assuming we can fetch multiple or fetch all and filter
          // Optimized: Fetch all authorized (cached)
          const allAuth = await base44.entities.AuthorizedPerson.list();
          return allAuth.filter(u => userIds.includes(u.serial_id));
      },
      enabled: coverages.length > 0
  });

  const handleDelete = () => {
    onDelete(shift.id);
    setShowDeleteConfirm(false);
  };

  if (!isOpen || !shift) return null;

  // Determine State
  const isSwapMode = !!activeRequest;
  const isPartial = activeRequest?.request_type === 'Partial';
  const isFull = activeRequest?.request_type === 'Full';
  
  // Is this "My" shift? (Using email check as fallback, better to use ID if available)
  // We assume 'shift.user_name' holds the name, but for ownership we need checking against AuthorizedPerson list or ID.
  // For now let's assume if I can cancel it, it's mine.
  const isOwnShift = false; // TODO: Connect real ownership logic using currentUser serial_id

  const handleAddToCalendar = () => {
     // Google Calendar Logic... (Same as before)
     const title = `משמרת - ${shift.user_name}`;
     const gCalUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}`;
     window.open(gCalUrl, '_blank');
  };

  const handleWhatsAppShare = () => {
     const appLink = window.location.origin;
     const message = `היי, מבקש החלפה למשמרת ${shift.user_name} בתאריך ${format(new Date(shift.start_date), 'dd/MM')}. עזרה? ${appLink}`;
     const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
     window.open(whatsappUrl, '_blank');
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
        <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="relative bg-white rounded-3xl shadow-2xl w-full max-w-lg max-h-[80vh] overflow-hidden flex flex-col">
          
          {/* Header */}
          <div className="bg-gradient-to-r from-gray-800 to-gray-900 p-6 text-white flex-shrink-0 relative">
            <div className="absolute top-4 left-4 flex gap-2">
                {isAdmin && (
                    <button onClick={() => setShowDeleteConfirm(true)} className="p-2 rounded-full hover:bg-white/20 transition-colors">
                        <Trash2 className="w-5 h-5 text-red-400" />
                    </button>
                )}
                <button onClick={onClose} className="p-2 rounded-full hover:bg-white/20">
                    <X className="w-5 h-5" />
                </button>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="p-3 bg-white/20 rounded-xl"><Calendar className="w-6 h-6" /></div>
              <div>
                <h2 className="text-xl font-bold">פרטי משמרת</h2>
                <p className="text-white/80 text-sm">{date && format(new Date(date), 'EEEE, d בMMMM yyyy', { locale: he })}</p>
              </div>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            
            {/* Status Card */}
            <div className={`border rounded-2xl p-6 text-center shadow-sm ${
                isSwapMode ? (isPartial ? 'bg-yellow-50 border-yellow-100' : 'bg-red-50 border-red-100') : 'bg-gray-50 border-gray-100'
            }`}>
                <h2 className="text-3xl font-bold mb-2 text-gray-800">
                    {shift.user_name}
                </h2>
                <div className="text-sm text-gray-500">
                    {shift.department ? `מחלקה ${shift.department}` : ''}
                </div>
                
                {isSwapMode && (
                    <div className="mt-4 inline-flex items-center gap-2 px-3 py-1 bg-white rounded-full border border-gray-200 text-sm font-medium">
                        <AlertCircle className={`w-4 h-4 ${isPartial ? 'text-yellow-500' : 'text-red-500'}`} />
                        {isPartial ? 'בקשה לכיסוי חלקי' : 'בקשה לכיסוי מלא'}
                    </div>
                )}
            </div>

            {/* Coverage List */}
            {coverages.length > 0 && (
                <div className="space-y-3">
                    <h3 className="text-sm font-bold text-gray-500 border-b pb-2">מי מכסה?</h3>
                    {coverages.map(cov => {
                        const user = coveringUsers.find(u => u.serial_id === cov.covering_user_id);
                        return (
                            <div key={cov.id} className="flex justify-between items-center bg-green-50 p-3 rounded-xl border border-green-100">
                                <span className="font-bold text-green-800">{user?.full_name || 'מתנדב'}</span>
                                <span className="text-xs text-green-600 font-mono" dir="ltr">
                                    {cov.cover_start_time} - {cov.cover_end_time}
                                </span>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-col gap-3">
                {isSwapMode && !isOwnShift && (
                     <Button 
                        onClick={() => { onClose(); onOfferCover(activeRequest); }} // Pass the request, not just shift
                        className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-lg"
                     >
                        <CheckCircle className="w-5 h-5 ml-2" />
                        אני יכול/ה לכסות
                     </Button>
                )}

                {!isSwapMode && (
                     <Button onClick={handleAddToCalendar} variant="outline" className="w-full">
                        <CalendarPlus className="w-4 h-4 ml-2" />
                        הוסף ליומן
                     </Button>
                )}
                
                 <Button onClick={handleWhatsAppShare} className="w-full bg-[#25D366] hover:bg-[#128C7E] text-white">
                    <Send className="w-4 h-4 ml-2" />
                    שתף בווצאפ
                 </Button>
            </div>

          </div>
        </motion.div>

        {/* Delete Modal */}
        <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>מחיקת משמרת</DialogTitle>
              <DialogDescription>האם את/ה בטוח/ה? הפעולה לא ניתנת לביטול.</DialogDescription>
            </DialogHeader>
            <DialogFooter>
               <Button variant="outline" onClick={() => setShowDeleteConfirm(false)}>ביטול</Button>
               <Button variant="destructive" onClick={handleDelete}>מחק</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

      </div>
    </AnimatePresence>
  );
}