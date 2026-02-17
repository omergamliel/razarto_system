import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { Button } from "@/components/ui/button";
import {
  normalizeShiftContext,
  computeCoverageSummary
} from './whatsappTemplates';

// Components
import BackgroundShapes from './BackgroundShapes';
import CalendarHeader from './CalendarHeader';
import CalendarGrid from './CalendarGrid';
import UserNotRegisteredError from '../UserNotRegisteredError';

// Modals
import SwapRequestModal from './SwapRequestModal';
import PendingRequestsModal from './PendingRequestsModal';
import AddShiftModal from './AddShiftModal';
import AcceptSwapModal from './AcceptSwapModal';
import ShiftActionModal from './ShiftActionModal';
import EditRoleModal from './EditRoleModal';
import ShiftDetailsModal from './ShiftDetailsModal';
import OnboardingModal from '../onboarding/OnboardingModal';
import KPIHeader from '../dashboard/KPIHeader';
import KPIListModal from '../dashboard/KPIListModal';
import AdminSettingsModal from '../admin/AdminSettingsModal';
import SwapSuccessModal from './SwapSuccessModal';
import SeedRolesData from '../admin/SeedRolesData';
import HeadToHeadSelectorModal from './HeadToHeadSelectorModal';
import HeadToHeadApprovalModal from './HeadToHeadApprovalModal';
import HallOfFameModal from '../dashboard/HallOfFameModal';
import HelpSupportModal from '../dashboard/HelpSupportModal';
import LoadingSkeleton from '../LoadingSkeleton';

export default function ShiftCalendar() {
  const queryClient = useQueryClient();
  
  // --- מצבים (States) ---
  const [currentDate, setCurrentDate] = useState(new Date());
  const [clickedDate, setClickedDate] = useState(null);
  const [viewMode, setViewMode] = useState('month');
  
  // מודאלים רגילים
  const [selectedShift, setSelectedShift] = useState(null);
  const [showSwapRequestModal, setShowSwapRequestModal] = useState(false);
  const [showAddShiftModal, setShowAddShiftModal] = useState(false);
  const [showAcceptSwapModal, setShowAcceptSwapModal] = useState(false);
  const [showActionModal, setShowActionModal] = useState(false);
  const [showEditRoleModal, setShowEditRoleModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showAdminSettings, setShowAdminSettings] = useState(false);
  const [showHallOfFame, setShowHallOfFame] = useState(false);
  const [showHelpSupport, setShowHelpSupport] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [deepLinkShiftId, setDeepLinkShiftId] = useState(null);
  
  // מודאלים של KPI והצלחה
  const [showKPIListModal, setShowKPIListModal] = useState(false);
  const [kpiListType, setKpiListType] = useState('swap_requests');
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [lastUpdatedShift, setLastUpdatedShift] = useState(null);

  // מצבים להחלפת ראש בראש (H2H)
  const [showHeadToHeadSelector, setShowHeadToHeadSelector] = useState(false);
  const [showHeadToHeadApproval, setShowHeadToHeadApproval] = useState(false);
  const [h2hTargetId, setH2hTargetId] = useState(null);
  const [h2hOfferId, setH2hOfferId] = useState(null);

  // --- זיהוי משתמש ואבטחה ---

  // 1. שליפת המשתמש המחובר מהמערכת
  const { data: currentUser, isLoading: isUserLoading } = useQuery({
    queryKey: ['current-user'],
    queryFn: async () => await base44.auth.me(),
  });

  const userEmail = currentUser?.email || currentUser?.Email;

  // 2. הצלבה מול טבלת המורשים (AuthorizedPerson)
  const { 
    data: authorizedPerson, 
    isLoading: isAuthCheckLoading,
    refetch: refreshAuthCheck 
  } = useQuery({
    queryKey: ['check-authorization', userEmail],
    queryFn: async () => {
      if (!userEmail) return null;
      const allPeople = await base44.entities.AuthorizedPerson.list();
      const normalizedUserEmail = userEmail.toLowerCase();
      // חיפוש המייל בטבלה תוך התעלמות מאותיות גדולות/קטנות
      return allPeople.find(person => person.email && person.email.toLowerCase() === normalizedUserEmail) || null; 
    },
    enabled: !!userEmail
  });

  // --- פונקציית כניסה למשתמש חדש (Onboarding) ---
  const linkUserMutation = useMutation({
    mutationFn: async () => {
      const serialId = currentUser?.serial_id || currentUser?.SerialId;
      if (!authorizedPerson?.id || !serialId) throw new Error("Missing identification");

      // קישור אוטומטי של ה-ID למייל בטבלה
      await base44.entities.AuthorizedPerson.update(authorizedPerson.id, {
        linked_user_id: Number(serialId) 
      });
      return true;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['check-authorization']);
      toast.success("החיבור בוצע בהצלחה! המערכת תתרענן כעת.");
      setTimeout(() => window.location.reload(), 1000); // רענון כפוי כדי להכניס את המשתמש פנימה
    },
    onError: () => toast.error("שגיאה בחיבור האוטומטי. פנה למנהל.")
  });

  // --- שאילתות נתונים מרכזיות ---
  const { data: shifts = [], isLoading: isShiftsLoading } = useQuery({
    queryKey: ['shifts'],
    queryFn: () => base44.entities.Shift.list(),
    enabled: !!authorizedPerson
  });

  const { data: allUsers = [] } = useQuery({
    queryKey: ['all-users'],
    queryFn: () => base44.entities.AuthorizedPerson.list(),
    enabled: !!authorizedPerson
  });

  const { data: swapRequests = [] } = useQuery({
    queryKey: ['swap-requests'],
    queryFn: () => base44.entities.SwapRequest.list(),
    enabled: !!authorizedPerson
  });

  const { data: coverages = [] } = useQuery({
    queryKey: ['coverages'],
    queryFn: () => base44.entities.ShiftCoverage.list(),
    enabled: !!authorizedPerson
  });

  // העשרת המשמרות בנתוני משתמשים וסטטוס החלפה
  const enrichedShifts = shifts.map(shift => normalizeShiftContext(shift, {
    allUsers, swapRequests, coverages, currentUser: authorizedPerson
  }));

  // --- לוגיקת קישורים עמוקים (Deep Links) ---
  useEffect(() => {
    if (typeof window === 'undefined' || !authorizedPerson) return;
    const params = new URLSearchParams(window.location.search);
    const headToHeadTarget = params.get('headToHeadTarget');
    const headToHeadOffer = params.get('headToHeadOffer');
    const openShiftId = params.get('openShiftId');

    // אם הקישור הגיע מהודעת WhatsApp של ראש בראש
    if (headToHeadTarget && headToHeadOffer) {
      setH2hTargetId(headToHeadTarget);
      setH2hOfferId(headToHeadOffer);
      setShowHeadToHeadApproval(true);
    } else if (openShiftId) {
      setDeepLinkShiftId(openShiftId);
    }
    // ניקוי ה-URL אחרי הקריאה
    window.history.replaceState({}, document.title, window.location.pathname);
  }, [authorizedPerson]);

  // --- פעולות (Mutations) ---

  // החלפת ראש בראש - הביצוע הסופי
  const headToHeadSwapMutation = useMutation({
    mutationFn: async () => {
      if (!h2hTargetId || !h2hOfferId) return;
      const targetShift = shifts.find(s => s.id === h2hTargetId);
      const offerShift = shifts.find(s => s.id === h2hOfferId);

      // בדיקת אבטחה: רק בעל המשמרת המקורית (דניאל) יכול לאשר את ההצעה ששלח חיים
      if (authorizedPerson.serial_id !== targetShift.original_user_id) {
        throw new Error("רק בעל המשמרת המקורית יכול לאשר את ההחלפה הזו!");
      }

      if (!targetShift || !offerShift) throw new Error('המשמרות לא נמצאו במערכת');

      // 1. החלפת הבעלים של שתי המשמרות
      await base44.entities.Shift.update(h2hTargetId, { original_user_id: offerShift.original_user_id, status: 'Active' });
      await base44.entities.Shift.update(h2hOfferId, { original_user_id: targetShift.original_user_id, status: 'Active' });

      // 2. עדכון סטטוס הבקשה ל'Approved'
      const h2hReq = swapRequests.find(r => r.shift_id === h2hTargetId && r.offered_shift_id === h2hOfferId && r.status === 'Pending');
      if (h2hReq) await base44.entities.SwapRequest.update(h2hReq.id, { status: 'Approved' });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['shifts']);
      queryClient.invalidateQueries(['swap-requests']);
      toast.success('ההחלפה בוצעה בהצלחה! השמות בלוח התעדכנו.');
      closeAllModals();
    },
    onError: (err) => toast.error(err.message || "שגיאה בביצוע ההחלפה")
  });

  // בקשת החלפה רגילה (אדומה)
  const requestSwapMutation = useMutation({
    mutationFn: async ({ shiftId, type, dates }) => {
      const shift = shifts.find(s => s.id === shiftId);
      const isFull = type === 'full';
      const payload = {
        shift_id: shiftId,
        requesting_user_id: authorizedPerson.serial_id,
        request_type: isFull ? 'Full' : 'Partial',
        req_start_date: isFull ? shift.start_date : (dates.startDate || shift.start_date),
        req_end_date: isFull ? (shift.end_date || shift.start_date) : (dates.endDate || shift.end_date || dates.startDate),
        req_start_time: isFull ? (shift.start_time || '09:00') : (dates.startTime || shift.start_time || '09:00'),
        req_end_time: isFull ? (shift.end_time || '09:00') : (dates.endTime || shift.end_time || '09:00'),
        status: 'Open'
      };
      await base44.entities.SwapRequest.create(payload);
      return await base44.entities.Shift.update(shiftId, { status: 'Swap_Requested' });
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries(['shifts']);
      queryClient.invalidateQueries(['swap-requests']);
      toast.success('בקשת ההחלפה פורסמה!');
      setLastUpdatedShift(data);
      closeAllModals();
      setShowSuccessModal(true);
    }
  });

  // ביטול בקשת החלפה
  const cancelSwapMutation = useMutation({
    mutationFn: async (shiftId) => {
      const activeRequest = swapRequests.find(sr => sr.shift_id === shiftId && sr.status === 'Open');
      if (activeRequest) await base44.entities.SwapRequest.update(activeRequest.id, { status: 'Cancelled' });
      return await base44.entities.Shift.update(shiftId, { status: 'Active' });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['shifts']);
      queryClient.invalidateQueries(['swap-requests']);
      toast.success('הבקשה בוטלה');
      setShowDetailsModal(false);
    }
  });

  // הוספת משמרת חדשה (מנהלים בלבד)
  const addShiftMutation = useMutation({
    mutationFn: async (data) => await base44.entities.Shift.create({ ...data, status: 'Active' }),
    onSuccess: () => { queryClient.invalidateQueries(['shifts']); toast.success('המשמרת נוספה'); setShowAddShiftModal(false); }
  });

  const logoutMutation = useMutation({
    mutationFn: async () => await base44.auth.logout(),
    onSuccess: () => window.location.href = '/'
  });

  // --- מטפלי אירועים (Handlers) ---
  const closeAllModals = () => {
    setShowSwapRequestModal(false); setShowAddShiftModal(false);
    setShowAcceptSwapModal(false); setShowActionModal(false); setShowEditRoleModal(false);
    setShowDetailsModal(false); setShowAdminSettings(false); setShowHallOfFame(false);
    setShowHelpSupport(false); setShowLogoutConfirm(false); setShowSuccessModal(false);
    setShowHeadToHeadSelector(false); setShowHeadToHeadApproval(false); setShowKPIListModal(false);
    setH2hTargetId(null); setH2hOfferId(null);
  };

  const handleCellClick = (date, shift) => {
    setClickedDate(date);
    const today = new Date(); today.setHours(0,0,0,0);
    const isPast = new Date(date) < today;

    if (!shift) { if (isAdmin && !isPast) setShowAddShiftModal(true); return; }
    
    const isMyShift = shift.original_user_id === authorizedPerson.serial_id;
    setSelectedShift(shift);
    if (isMyShift && !isPast) setShowActionModal(true);
    else setShowDetailsModal(true);
  };

  // פונקציית הקסם: מחברת בין הכפתור הירוק ברשימה הצהובה לבין מודאל האישור
  const handleOpenH2HApprovalFromList = (request) => {
    setH2hTargetId(request.shift_id);
    setH2hOfferId(request.offered_shift_id);
    setShowKPIListModal(false); // סוגרים את הרשימה כדי שלא תפריע
    setShowHeadToHeadApproval(true); // פותחים את מודאל האישור (המסך שמופיע בתמונה שלך)
  };

  // --- רינדור המסך ---
  if (isUserLoading || isAuthCheckLoading) return <div className="min-h-screen flex items-center justify-center text-gray-500">מאמת נתונים...</div>;
  if (!authorizedPerson) return <UserNotRegisteredError onRefresh={refreshAuthCheck} />;

  const isAdmin = authorizedPerson.permissions === 'Admin' || authorizedPerson.permissions === 'Manager';
  const isViewOnly = authorizedPerson.permissions === 'View';

  return (
    <div className="min-h-screen bg-[#F9FAFB] relative font-sans" dir="rtl">
      <BackgroundShapes />
      <SeedRolesData />

      <div className="max-w-7xl mx-auto px-4 py-6 md:py-8 relative z-10">
        <CalendarHeader 
          currentDate={currentDate} setCurrentDate={setCurrentDate} viewMode={viewMode} setViewMode={setViewMode}
          isAdmin={isAdmin} onOpenAdminSettings={() => setShowAdminSettings(true)}
          onOpenHallOfFame={() => setShowHallOfFame(true)} onOpenHelp={() => setShowHelpSupport(true)}
          onLogout={() => setShowLogoutConfirm(true)} currentUser={authorizedPerson}
        />

        <div className="mt-6 mb-2">
           <KPIHeader 
             shifts={enrichedShifts} currentUser={authorizedPerson}
             onKPIClick={(type) => { setKpiListType(type); setShowKPIListModal(true); }}
           />
        </div>

        <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-xl p-4 md:p-6 mt-4 border border-white/50">
          <CalendarGrid 
            currentDate={currentDate} viewMode={viewMode} shifts={enrichedShifts}
            onCellClick={handleCellClick} currentUserEmail={authorizedPerson.email}
            currentUserRole={authorizedPerson.full_name} isAdmin={isAdmin}
          />
        </div>
      </div>

      {/* --- מודאלים --- */}
      
      {/* מסך הצטרפות למשתמש חדש */}
      <OnboardingModal isOpen={!authorizedPerson.linked_user_id} authorizedData={authorizedPerson} onConfirm={() => linkUserMutation.mutate()} isLoading={linkUserMutation.isPending} />

      {/* מודאל פעולות על משמרת (החלפה/עריכה) */}
      <ShiftActionModal isOpen={showActionModal} onClose={closeAllModals} shift={selectedShift} date={currentDate} onRequestSwap={() => { closeAllModals(); setShowSwapRequestModal(true); }} onEditRole={() => { closeAllModals(); setShowEditRoleModal(true); }} onDelete={deleteShiftMutation.mutate} isAdmin={isAdmin} />
      
      {/* מודאל פרטי משמרת (צפייה לאחרים) */}
      <ShiftDetailsModal 
        isOpen={showDetailsModal} onClose={closeAllModals} shift={selectedShift} date={currentDate} 
        onOfferCover={(s) => { setSelectedShift(s); setShowAcceptSwapModal(true); }}
        onHeadToHead={(s) => { setSelectedShift(s); setShowHeadToHeadSelector(true); }}
        onCancelRequest={(s) => cancelSwapMutation.mutate(s.id)}
        onDelete={deleteShiftMutation.mutate}
        currentUser={authorizedPerson} isAdmin={isAdmin}
      />

      {/* מודאל בחירת משמרת להחלפת ראש בראש (חיים בוחר משמרת) */}
      <HeadToHeadSelectorModal isOpen={showHeadToHeadSelector} onClose={closeAllModals} targetShift={selectedShift} currentUser={authorizedPerson} />
      
      {/* מודאל אישור החלפת ראש בראש (דניאל מאשרת) - כולל בדיקת זהות */}
      <HeadToHeadApprovalModal 
        isOpen={showHeadToHeadApproval} onClose={closeAllModals} 
        targetShiftId={h2hTargetId} offerShiftId={h2hOfferId}
        currentUser={authorizedPerson}
        onApprove={() => headToHeadSwapMutation.mutate()} onDecline={closeAllModals}
      />

      {/* מודאל רשימת ה-KPI (החלונות הצהוב/אדום/כחול) */}
      <KPIListModal 
        isOpen={showKPIListModal} onClose={closeAllModals} type={kpiListType} currentUser={authorizedPerson}
        onOfferCover={(s) => { setSelectedShift(s); setShowAcceptSwapModal(true); }}
        // החיבור הקריטי שביקשת:
        onApproveHeadToHead={handleOpenH2HApprovalFromList}
        actionsDisabled={isViewOnly}
      />

      {/* מודאלים נוספים */}
      <AddShiftModal isOpen={showAddShiftModal} onClose={closeAllModals} date={clickedDate || currentDate} onSubmit={(data) => addShiftMutation.mutate(data)} isSubmitting={addShiftMutation.isPending} />
      <SwapRequestModal isOpen={showSwapRequestModal} onClose={closeAllModals} date={currentDate} shift={selectedShift} onSubmit={(data) => requestSwapMutation.mutate({ shiftId: selectedShift.id, type: data.type, dates: data })} isSubmitting={requestSwapMutation.isPending} />
      <SwapSuccessModal isOpen={showSuccessModal} onClose={closeAllModals} shift={lastUpdatedShift} />
      <HallOfFameModal isOpen={showHallOfFame} onClose={closeAllModals} />
      <HelpSupportModal isOpen={showHelpSupport} onClose={closeAllModals} />
      
      {/* מודאל התנתקות */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full text-center shadow-2xl border border-gray-100">
            <h3 className="text-xl font-bold mb-4">להתנתק מהמערכת?</h3>
            <div className="flex gap-3">
              <Button variant="outline" className="flex-1 rounded-xl h-11" onClick={() => setShowLogoutConfirm(false)}>ביטול</Button>
              <Button className="flex-1 bg-red-500 hover:bg-red-600 text-white rounded-xl h-11 shadow-md" onClick={() => logoutMutation.mutate()}>התנתק</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}