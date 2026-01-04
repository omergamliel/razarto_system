import React, { useEffect, useMemo, useState } from 'react';
import { format, addDays } from 'date-fns';
import { he } from 'date-fns/locale';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Calendar, User, Trash2, CheckCircle, AlertCircle, CalendarPlus, Send, UserRoundPen } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
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
  currentUser,
  isAdmin
}) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showReassignModal, setShowReassignModal] = useState(false);
  const [selectedDepartment, setSelectedDepartment] = useState('');
  const [selectedUserId, setSelectedUserId] = useState('');

  const queryClient = useQueryClient();

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

  const { data: authorizedUsers = [] } = useQuery({
    queryKey: ['authorized-users'],
    queryFn: () => base44.entities.AuthorizedPerson.list(),
    enabled: showReassignModal
  });

  const reassignMutation = useMutation({
    mutationFn: async (newUserId) => {
      return base44.entities.Shift.update(shift.id, { original_user_id: parseInt(newUserId, 10) });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['shifts']);
      toast.success('המשמרת הועברה למשתמש החדש');
      setShowReassignModal(false);
      setSelectedUserId('');
    },
    onError: () => {
      toast.error('אירעה שגיאה בעת עדכון המשמרת');
    }
  });

  useEffect(() => {
    if (isOpen && shift) {
      setSelectedDepartment(shift.department || '');
      setSelectedUserId('');
    }
  }, [isOpen, shift]);

  const departments = useMemo(() => {
    return [...new Set(authorizedUsers.map(u => u.department))].filter(Boolean).sort();
  }, [authorizedUsers]);

  const departmentUsers = useMemo(() => {
    return selectedDepartment ? authorizedUsers.filter(u => u.department === selectedDepartment) : [];
  }, [authorizedUsers, selectedDepartment]);

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

  const userEmail = currentUser?.email || currentUser?.Email;
  const isOwnShift = Boolean(
    (currentUser?.serial_id && shift?.original_user_id === currentUser.serial_id) ||
    (userEmail && shift?.assigned_email === userEmail) ||
    (currentUser?.full_name && shift?.user_name === currentUser.full_name)
  );

  const startTime = shift?.start_time || '09:00';
  const endTime = shift?.end_time || '09:00';
  const startDateObj = shift?.start_date ? new Date(shift.start_date) : new Date(date);

  let endDateObj;
  if (shift?.end_date) {
    endDateObj = new Date(shift.end_date);
  } else {
    const sH = parseInt(startTime.split(':')[0]);
    const eH = parseInt(endTime.split(':')[0]);
    if (eH < sH || (sH === 9 && eH === 9)) {
      endDateObj = addDays(startDateObj, 1);
    } else {
      endDateObj = startDateObj;
    }
  }

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
                  <>
                    <button
                      onClick={() => setShowReassignModal(true)}
                      className="p-2 rounded-full hover:bg-white/20 transition-colors"
                      aria-label="החלפת משתמש"
                    >
                      <UserRoundPen className="w-5 h-5 text-blue-200" />
                    </button>
                    <button onClick={() => setShowDeleteConfirm(true)} className="p-2 rounded-full hover:bg-white/20 transition-colors">
                        <Trash2 className="w-5 h-5 text-red-400" />
                    </button>
                  </>
                )}
                <button onClick={onClose} className="p-2 rounded-full hover:bg-white/20">
                    <X className="w-5 h-5" />
                </button>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="p-3 bg-white/20 rounded-xl"><Calendar className="w-6 h-6" /></div>
              <div className="space-y-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-xl font-bold">פרטי משמרת</h2>
                  {isSwapMode && (
                    <span className="inline-flex items-center rounded-full bg-white/10 px-3 py-1 text-xs font-semibold tracking-tight text-white backdrop-blur-sm">
                      {isPartial ? 'בקשה לכיסוי חלקי' : 'בקשה לכיסוי מלא'}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-6 space-y-6">

            {/* Status Card + Timing */}
            <div className="border rounded-2xl p-6 text-center shadow-sm space-y-4 bg-[#F4F4F6] border-gray-200">
              <div className="space-y-3">
                <p className="text-sm text-gray-500 font-medium">משובץ כרגע למשמרת</p>
                <h2 className="text-2xl font-semibold text-gray-900">{shift.user_name}</h2>
                {shift.department && (
                  <span className="inline-flex items-center justify-center rounded-full bg-white px-3 py-1 text-xs font-semibold text-gray-700 border border-gray-200">
                    {shift.department}
                  </span>
                )}
              </div>

              <div className="bg-white rounded-2xl border border-gray-200 px-4 py-3 shadow-sm grid grid-cols-2 gap-4 text-center">
                <div className="space-y-1">
                  <p className="text-[10px] text-gray-400">התחלה</p>
                  <p className="text-lg font-bold text-gray-800">{startTime}</p>
                  <p className="text-[11px] text-gray-500">{format(startDateObj, 'dd/MM')}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] text-gray-400">סיום</p>
                  <p className="text-lg font-bold text-gray-800">{endTime}</p>
                  <p className="text-[11px] text-gray-500">{format(endDateObj, 'dd/MM')}</p>
                </div>
              </div>
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
            <div className="flex flex-wrap gap-3 justify-center">
              {isSwapMode && isOwnShift && (
                <Button
                  onClick={() => onCancelRequest?.(shift)}
                  className="min-w-[160px] flex-1 sm:flex-none h-12 bg-red-600 hover:bg-red-700 text-white rounded-xl shadow-lg"
                >
                  <Trash2 className="w-5 h-5 ml-2" />
                  ביטול בקשת החלפה
                </Button>
              )}

              {isSwapMode && !isOwnShift && (
                <Button
                  onClick={() => {
                    onClose();
                    onOfferCover(shift);
                  }}
                  className="min-w-[160px] flex-1 sm:flex-none h-12 bg-[#7bf1a8] hover:bg-[#66e59a] text-gray-900 rounded-xl shadow-md flex flex-row-reverse items-center justify-center gap-2"
                >
                  <img src="https://cdn-icons-png.flaticon.com/128/9363/9363987.png" alt="עזרה" className="w-5 h-5" />
                  אני רוצה לעזור!
                </Button>
              )}

              {isSwapMode && !isOwnShift && (
                <Button
                  onClick={() => {
                    onClose();
                    onHeadToHead?.(shift);
                  }}
                  className="min-w-[140px] flex-1 sm:flex-none h-12 bg-[#ff70a6] hover:bg-[#ff5c98] text-white rounded-xl shadow-md flex flex-row-reverse items-center justify-center gap-2"
                >
                  <img src="https://cdn-icons-png.flaticon.com/128/1969/1969142.png" alt="ראש בראש" className="w-5 h-5" />
                  ראש בראש
                </Button>
              )}

              {!isSwapMode && !isAdmin && (
                <Button
                  onClick={handleAddToCalendar}
                  variant="outline"
                  className="min-w-[140px] flex-1 sm:flex-none h-12 rounded-xl"
                >
                  <CalendarPlus className="w-4 h-4 ml-2" />
                  הוסף ליומן
                </Button>
              )}

              {isOwnShift && !isAdmin && (
                <Button
                  onClick={handleWhatsAppShare}
                  className="min-w-[140px] flex-1 sm:flex-none h-12 bg-[#25D366] hover:bg-[#128C7E] text-white rounded-xl shadow-lg"
                >
                  <Send className="w-4 h-4 ml-2" />
                  שתף בווצאפ
                </Button>
              )}
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

        {/* Reassign Modal */}
        <Dialog open={showReassignModal} onOpenChange={setShowReassignModal}>
          <DialogContent className="sm:max-w-lg">
            <div className="rounded-2xl overflow-hidden shadow-lg">
              <div className="bg-gradient-to-r from-[#64B5F6] to-[#42A5F5] p-4 text-white flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-white/20 rounded-xl"><Calendar className="w-5 h-5" /></div>
                  <div>
                    <h3 className="text-lg font-bold">החלפת משתמש למשמרת</h3>
                    <p className="text-white/80 text-xs">בחר מחלקה ואז את המשתמש החדש</p>
                  </div>
                </div>
                <button onClick={() => setShowReassignModal(false)} className="p-2 rounded-full hover:bg-white/10 transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-5 space-y-4">
                <div className="space-y-2">
                  <Label className="text-gray-700 font-medium flex items-center gap-2">
                    <User className="w-4 h-4 text-[#64B5F6]" />
                    בחר מחלקה
                  </Label>
                  <Select value={selectedDepartment} onValueChange={(val) => { setSelectedDepartment(val); setSelectedUserId(''); }}>
                    <SelectTrigger className="h-12 rounded-xl border-2 border-gray-200 focus:border-[#64B5F6]">
                      <SelectValue placeholder="בחר מחלקה..." />
                    </SelectTrigger>
                    <SelectContent>
                      {departments.map((dept) => (
                        <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <AnimatePresence>
                  {selectedDepartment && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="space-y-2 overflow-hidden"
                    >
                      <Label className="text-gray-700 font-medium flex items-center gap-2">
                        <UserRoundPen className="w-4 h-4 text-[#64B5F6]" />
                        בחר משתמש
                      </Label>
                      <Select value={selectedUserId?.toString()} onValueChange={(val) => setSelectedUserId(val)}>
                        <SelectTrigger className="h-12 rounded-xl border-2 border-gray-200 focus:border-[#64B5F6]">
                          <SelectValue placeholder="בחר משתמש..." />
                        </SelectTrigger>
                        <SelectContent>
                          {departmentUsers.map((user) => (
                            <SelectItem key={user.serial_id} value={user.serial_id.toString()}>
                              {user.full_name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </motion.div>
                  )}
                </AnimatePresence>

                <Button
                  onClick={() => reassignMutation.mutate(selectedUserId)}
                  disabled={!selectedUserId || reassignMutation.isPending}
                  className="w-full bg-gradient-to-r from-[#64B5F6] to-[#42A5F5] hover:from-[#42A5F5] hover:to-[#2196F3] text-white py-3 rounded-xl text-base font-semibold disabled:opacity-60"
                >
                  {reassignMutation.isPending ? 'מעדכן...' : 'שמור והחלף משתמש'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

      </div>
    </AnimatePresence>
  );
}

