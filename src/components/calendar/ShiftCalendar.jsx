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
  
  // --- STATES ---
  const [currentDate, setCurrentDate] = useState(new Date());
  const [clickedDate, setClickedDate] = useState(null);
  const [viewMode, setViewMode] = useState('month');
  
  const [selectedShift, setSelectedShift] = useState(null);
  const [showSwapRequestModal, setShowSwapRequestModal] = useState(false);
  const [showPendingRequestsModal, setShowPendingRequestsModal] = useState(false);
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
  
  const [showKPIListModal, setShowKPIListModal] = useState(false);
  const [kpiListType, setKpiListType] = useState('swap_requests');
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [lastUpdatedShift, setLastUpdatedShift] = useState(null);

  const [showHeadToHeadSelector, setShowHeadToHeadSelector] = useState(false);
  const [showHeadToHeadApproval, setShowHeadToHeadApproval] = useState(false);
  const [h2hTargetId, setH2hTargetId] = useState(null);
  const [h2hOfferId, setH2hOfferId] = useState(null);

  // --- AUTH & USER IDENTIFICATION ---

  const { data: currentUser, isLoading: isUserLoading } = useQuery({
    queryKey: ['current-user'],
    queryFn: async () => await base44.auth.me(),
  });

  const userEmail = currentUser?.email || currentUser?.Email;

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
      return allPeople.find(person => person.email && person.email.toLowerCase() === normalizedUserEmail) || null; 
    },
    enabled: !!userEmail
  });

  // --- MUTATION: Link User (תיקון לאוטומציה של כניסת משתמש חדש) ---
  const linkUserMutation = useMutation({
    mutationFn: async () => {
      const serialId = currentUser?.serial_id || currentUser?.SerialId;
      if (!authorizedPerson?.id || !serialId) throw new Error("Missing identification");

      // עדכון ה-ID של המשתמש בטבלת המורשים באופן אוטומטי
      await base44.entities.AuthorizedPerson.update(authorizedPerson.id, {
        linked_user_id: Number(serialId) 
      });
      return true;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['check-authorization']);
      toast.success("החיבור בוצע! מרענן דף...");
      // רענון כפוי כדי להכניס את המשתמש למערכת מיד
      setTimeout(() => window.location.reload(), 1000);
    },
    onError: () => toast.error("שגיאה בחיבור האוטומטי.")
  });

  // --- DATA QUERIES ---
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

  const enrichedShifts = shifts.map(shift => normalizeShiftContext(shift, {
    allUsers, swapRequests, coverages, currentUser: authorizedPerson
  }));

  // --- DEEP LINK LOGIC ---
  useEffect(() => {
    if (typeof window === 'undefined' || !authorizedPerson) return;
    const params = new URLSearchParams(window.location.search);
    const openShiftId = params.get('openShiftId');
    const headToHeadTarget = params.get('headToHeadTarget');
    const headToHeadOffer = params.get('headToHeadOffer');

    if (headToHeadTarget && headToHeadOffer) {
      setH2hTargetId(headToHeadTarget);
      setH2hOfferId(headToHeadOffer);
      setShowHeadToHeadApproval(true);
    } else if (openShiftId) {
      setDeepLinkShiftId(openShiftId);
    }
    window.history.replaceState({}, document.title, window.location.pathname);
  }, [authorizedPerson]);

  // --- MUTATIONS ---

  const headToHeadSwapMutation = useMutation({
    mutationFn: async () => {
      if (!h2hTargetId || !h2hOfferId) return;
      const targetShift = shifts.find(s => s.id === h2hTargetId);
      const offerShift = shifts.find(s => s.id === h2hOfferId);

      // הגנת אבטחה: רק בעל המשמרת המקורית (הנמען) יכול לאשר
      if (authorizedPerson.serial_id !== targetShift.original_user_id) {
        throw new Error("רק הנמען יכול לאשר החלפה זו");
      }

      // החלפת בעלים בטבלה
      await base44.entities.Shift.update(h2hTargetId, { original_user_id: offerShift.original_user_id, status: 'Active' });
      await base44.entities.Shift.update(h2hOfferId, { original_user_id: targetShift.original_user_id, status: 'Active' });

      const h2hReq = swapRequests.find(r => r.shift_id === h2hTargetId && r.offered_shift_id === h2hOfferId && r.status === 'Pending');
      if (h2hReq) await base44.entities.SwapRequest.update(h2hReq.id, { status: 'Approved' });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['shifts']);
      queryClient.invalidateQueries(['swap-requests']);
      toast.success('ההחלפה בוצעה בהצלחה!');
      closeAllModals();
    },
    onError: (err) => toast.error(err.message || "שגיאה בביצוע ההחלפה")
  });

  // (שאר המוטציות הקיימות: requestSwapMutation, cancelSwapMutation, offerCoverMutation, וכו' נשארות ללא שינוי)
  const requestSwapMutation = useMutation({
    mutationFn: async ({ shiftId, type, dates }) => {
      const shift = shifts.find(s => s.id === shiftId);
      if (!shift) throw new Error('Shift not found');
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
      toast.success('בקשת ההחלפה נשלחה!');
      setLastUpdatedShift(data);
      setShowSwapRequestModal(false);
      setShowActionModal(false);
      setShowSuccessModal(true);
    }
  });

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

  const offerCoverMutation = useMutation({
    mutationFn: async ({ shift, coverData }) => {
      const activeRequest = swapRequests.find(sr => sr.shift_id === shift.id && sr.status === 'Open');
      if (!activeRequest) throw new Error('No active request');
      await base44.entities.ShiftCoverage.create({
        request_id: activeRequest.id,
        shift_id: shift.id,
        covering_user_id: authorizedPerson.serial_id,
        cover_start_date: shift.start_date,
        cover_end_date: shift.end_date || shift.start_date,
        cover_start_time: shift.start_time || '09:00',
        cover_end_time: shift.end_time || '09:00',
        status: 'Approved'
      });
      await base44.entities.SwapRequest.update(activeRequest.id, { status: 'Closed' });
      await base44.entities.Shift.update(shift.id, { status: 'Covered' });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['shifts']);
      queryClient.invalidateQueries(['swap-requests']);
      toast.success('הכיסוי בוצע בהצלחה!');
      setShowAcceptSwapModal(false);
      setShowDetailsModal(false);
    }
  });

  const addShiftMutation = useMutation({
    mutationFn: async (data) => await base44.entities.Shift.create({ ...data, status: 'Active' }),
    onSuccess: () => { queryClient.invalidateQueries(['shifts']); toast.success('המשמרת נוספה'); setShowAddShiftModal(false); }
  });

  const editRoleMutation = useMutation({
    mutationFn: async ({ id, ...data }) => await base44.entities.Shift.update(id, data),
    onSuccess: () => { queryClient.invalidateQueries(['shifts']); toast.success('עודכן'); closeAllModals(); }
  });

  const deleteShiftMutation = useMutation({
    mutationFn: async (id) => await base44.entities.Shift.delete(id),
    onSuccess: () => { queryClient.invalidateQueries(['shifts']); toast.success('נמחק'); closeAllModals(); }
  });

  const logoutMutation = useMutation({
    mutationFn: async () => await base44.auth.logout(),
    onSuccess: () => window.location.href = '/'
  });

  // --- HANDLERS ---
  const closeAllModals = () => {
    setShowSwapRequestModal(false); setShowPendingRequestsModal(false); setShowAddShiftModal(false);
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

  // פונקציית עזר לחיבור בין ה-KPI למודאל האישור
  const handleOpenH2HApprovalFromList = (request) => {
    setH2hTargetId(request.shift_id);
    setH2hOfferId(request.offered_shift_id);
    setShowHeadToHeadApproval(true);
  };

  // --- RENDER ---
  if (isUserLoading || isAuthCheckLoading) return <div className="min-h-screen flex items-center justify-center">טוען...</div>;
  if (!authorizedPerson) return <UserNotRegisteredError onRefresh={refreshAuthCheck} />;

  const isAdmin = authorizedPerson.permissions === 'Admin' || authorizedPerson.permissions === 'Manager';
  const isViewOnly = authorizedPerson.permissions === 'View';

  return (
    <div className="min-h-screen bg-[#F9FAFB] relative" dir="rtl">
      <BackgroundShapes />
      <SeedRolesData />

      <div className="max-w-7xl mx-auto px-4 py-8 relative z-10">
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

        <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-xl p-6 mt-4">
          <CalendarGrid 
            currentDate={currentDate} viewMode={viewMode} shifts={enrichedShifts}
            onCellClick={handleCellClick} currentUserEmail={authorizedPerson.email}
            currentUserRole={authorizedPerson.full_name} isAdmin={isAdmin}
          />
        </div>
      </div>

      {/* --- MODALS --- */}
      <OnboardingModal isOpen={!authorizedPerson.linked_user_id} authorizedData={authorizedPerson} onConfirm={() => linkUserMutation.mutate()} isLoading={linkUserMutation.isPending} />
      <AdminSettingsModal isOpen={showAdminSettings} onClose={closeAllModals} />
      <ShiftActionModal isOpen={showActionModal} onClose={closeAllModals} shift={selectedShift} date={currentDate} onRequestSwap={() => { closeAllModals(); setShowSwapRequestModal(true); }} onEditRole={() => { closeAllModals(); setShowEditRoleModal(true); }} onDelete={deleteShiftMutation.mutate} isAdmin={isAdmin} />
      <SwapRequestModal isOpen={showSwapRequestModal} onClose={closeAllModals} date={currentDate} shift={selectedShift} onSubmit={(data) => requestSwapMutation.mutate({ shiftId: selectedShift.id, type: data.type, dates: data })} isSubmitting={requestSwapMutation.isPending} />
      <AddShiftModal isOpen={showAddShiftModal} onClose={closeAllModals} date={clickedDate || currentDate} onSubmit={(data) => addShiftMutation.mutate(data)} isSubmitting={addShiftMutation.isPending} />
      <EditRoleModal isOpen={showEditRoleModal} onClose={closeAllModals} shift={selectedShift} date={currentDate} onSubmit={(data) => editRoleMutation.mutate({ id: selectedShift.id, ...data })} isSubmitting={editRoleMutation.isPending} />
      
      <ShiftDetailsModal 
        isOpen={showDetailsModal} onClose={closeAllModals} shift={selectedShift} date={currentDate} 
        onOfferCover={(s) => { setSelectedShift(s); setShowAcceptSwapModal(true); }}
        onHeadToHead={(s) => { setSelectedShift(s); setShowHeadToHeadSelector(true); }}
        onCancelRequest={(s) => cancelSwapMutation.mutate(s.id)}
        onDelete={deleteShiftMutation.mutate}
        currentUser={authorizedPerson} isAdmin={isAdmin}
      />

      <AcceptSwapModal isOpen={showAcceptSwapModal && !!selectedShift} onClose={closeAllModals} shift={selectedShift} onAccept={(data) => offerCoverMutation.mutate({ shift: selectedShift, coverData: data })} isAccepting={offerCoverMutation.isPending} />
      <HeadToHeadSelectorModal isOpen={showHeadToHeadSelector} onClose={closeAllModals} targetShift={selectedShift} currentUser={authorizedPerson} />
      
      {/* עדכון מודאל אישור ראש בראש עם פרמטר המשתמש הנוכחי לבדיקת אבטחה */}
      <HeadToHeadApprovalModal 
        isOpen={showHeadToHeadApproval} onClose={closeAllModals} 
        targetShiftId={h2hTargetId} offerShiftId={h2hOfferId}
        currentUser={authorizedPerson}
        onApprove={() => headToHeadSwapMutation.mutate()} onDecline={closeAllModals}
      />

      {/* חיבור ה-KPI הצהוב לפונקציית האישור */}
      <KPIListModal 
        isOpen={showKPIListModal} onClose={closeAllModals} type={kpiListType} currentUser={authorizedPerson}
        onOfferCover={(s) => { setSelectedShift(s); setShowAcceptSwapModal(true); }}
        onApproveHeadToHead={handleOpenH2HApprovalFromList}
        actionsDisabled={isViewOnly}
      />

      <SwapSuccessModal isOpen={showSuccessModal} onClose={closeAllModals} shift={lastUpdatedShift} />
      <HallOfFameModal isOpen={showHallOfFame} onClose={closeAllModals} />
      <HelpSupportModal isOpen={showHelpSupport} onClose={closeAllModals} />
      
      {showLogoutConfirm && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full text-center">
            <h3 className="text-xl font-bold mb-4">להתנתק מהמערכת?</h3>
            <div className="flex gap-3">
              <Button variant="outline" className="flex-1" onClick={() => setShowLogoutConfirm(false)}>לא</Button>
              <Button className="flex-1 bg-red-500 text-white" onClick={() => logoutMutation.mutate()}>כן</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}