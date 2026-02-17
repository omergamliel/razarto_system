import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { Button } from "@/components/ui/button";
import { normalizeShiftContext } from './whatsappTemplates';

// Components & Modals
import BackgroundShapes from './BackgroundShapes';
import CalendarHeader from './CalendarHeader';
import CalendarGrid from './CalendarGrid';
import UserNotRegisteredError from '../UserNotRegisteredError';
import SwapRequestModal from './SwapRequestModal';
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
  const [showAddShiftModal, setShowAddShiftModal] = useState(false);
  const [showAcceptSwapModal, setShowAcceptSwapModal] = useState(false);
  const [showActionModal, setShowActionModal] = useState(false);
  const [showEditRoleModal, setShowEditRoleModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showAdminSettings, setShowAdminSettings] = useState(false);
  const [showKPIListModal, setShowKPIListModal] = useState(false);
  const [kpiListType, setKpiListType] = useState('swap_requests');
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [lastUpdatedShift, setLastUpdatedShift] = useState(null);
  const [showHeadToHeadSelector, setShowHeadToHeadSelector] = useState(false);
  const [showHeadToHeadApproval, setShowHeadToHeadApproval] = useState(false);
  const [h2hTargetId, setH2hTargetId] = useState(null);
  const [h2hOfferId, setH2hOfferId] = useState(null);

  // --- AUTH ---
  const { data: currentUser, isLoading: isUserLoading } = useQuery({
    queryKey: ['current-user'],
    queryFn: async () => await base44.auth.me(),
  });

  const { data: authorizedPerson, isLoading: isAuthCheckLoading, refetch: refreshAuthCheck } = useQuery({
    queryKey: ['check-authorization', currentUser?.email],
    queryFn: async () => {
      if (!currentUser?.email) return null;
      const all = await base44.entities.AuthorizedPerson.list();
      const match = all.find(p => p.email?.toLowerCase() === currentUser.email.toLowerCase());
      return match || null;
    },
    enabled: !!currentUser?.email
  });

  // --- DATA ---
  const { data: shifts = [], isLoading: isShiftsLoading } = useQuery({ queryKey: ['shifts'], queryFn: () => base44.entities.Shift.list(), enabled: !!authorizedPerson });
  const { data: allUsers = [] } = useQuery({ queryKey: ['all-users'], queryFn: () => base44.entities.AuthorizedPerson.list(), enabled: !!authorizedPerson });
  const { data: swapRequests = [] } = useQuery({ queryKey: ['swap-requests'], queryFn: () => base44.entities.SwapRequest.list(), enabled: !!authorizedPerson });
  const { data: coverages = [] } = useQuery({ queryKey: ['coverages'], queryFn: () => base44.entities.ShiftCoverage.list(), enabled: !!authorizedPerson });

  const enrichedShifts = shifts.map(s => normalizeShiftContext(s, { allUsers, swapRequests, coverages, currentUser: authorizedPerson }));

  // --- MUTATIONS (תיקון: הוספה מחדש של הפעולות שחסרו) ---
  const deleteShiftMutation = useMutation({
    mutationFn: async (id) => await base44.entities.Shift.delete(id),
    onSuccess: () => { queryClient.invalidateQueries(['shifts']); toast.success('המשמרת נמחקה'); closeAllModals(); }
  });

  const cancelSwapMutation = useMutation({
    mutationFn: async (item) => {
      const shiftId = item.shift_id || item.id;
      const req = swapRequests.find(sr => sr.shift_id === shiftId && (sr.status === 'Open' || sr.status === 'Pending'));
      if (req) await base44.entities.SwapRequest.update(req.id, { status: 'Cancelled' });
      return await base44.entities.Shift.update(shiftId, { status: 'Active' });
    },
    onSuccess: () => { queryClient.invalidateQueries(['shifts', 'swap-requests']); toast.success('הבקשה בוטלה'); }
  });

  const headToHeadSwapMutation = useMutation({
    mutationFn: async () => {
      if (!h2hTargetId || !h2hOfferId) return;
      const target = shifts.find(s => s.id === h2hTargetId);
      const offer = shifts.find(s => s.id === h2hOfferId);
      if (authorizedPerson.serial_id !== target.original_user_id) throw new Error("רק הנמען יכול לאשר");
      await base44.entities.Shift.update(h2hTargetId, { original_user_id: offer.original_user_id, status: 'Active' });
      await base44.entities.Shift.update(h2hOfferId, { original_user_id: target.original_user_id, status: 'Active' });
      const req = swapRequests.find(r => r.shift_id === h2hTargetId && r.offered_shift_id === h2hOfferId && r.status === 'Pending');
      if (req) await base44.entities.SwapRequest.update(req.id, { status: 'Approved' });
    },
    onSuccess: () => { queryClient.invalidateQueries(['shifts', 'swap-requests']); toast.success('ההחלפה בוצעה!'); closeAllModals(); }
  });

  const closeAllModals = () => {
    setShowSwapRequestModal(false); setShowAddShiftModal(false); setShowAcceptSwapModal(false);
    setShowActionModal(false); setShowEditRoleModal(false); setShowDetailsModal(false);
    setShowAdminSettings(false); setShowHeadToHeadSelector(false); setShowHeadToHeadApproval(false);
    setShowKPIListModal(false); setShowSuccessModal(false);
  };

  const handleOpenH2HApprovalFromList = (request) => {
    setH2hTargetId(request.shift_id); setH2hOfferId(request.offered_shift_id);
    setShowKPIListModal(false); setShowHeadToHeadApproval(true);
  };

  if (isUserLoading || isAuthCheckLoading || isShiftsLoading) return <LoadingSkeleton className="h-screen w-full" />;
  if (!authorizedPerson) return <UserNotRegisteredError onRefresh={refreshAuthCheck} />;

  const isAdmin = authorizedPerson.permissions === 'Admin' || authorizedPerson.permissions === 'Manager';

  return (
    <div className="min-h-screen bg-[#F9FAFB] relative" dir="rtl">
      <BackgroundShapes />
      <div className="max-w-7xl mx-auto px-4 py-8 relative z-10">
        <CalendarHeader currentDate={currentDate} setCurrentDate={setCurrentDate} viewMode={viewMode} setViewMode={setViewMode} isAdmin={isAdmin} onLogout={() => base44.auth.logout()} currentUser={authorizedPerson} />
        <KPIHeader shifts={enrichedShifts} currentUser={authorizedPerson} onKPIClick={(type) => { setKpiListType(type); setShowKPIListModal(true); }} />
        <div className="bg-white/80 backdrop-blur-xl rounded-3xl p-6 mt-4 shadow-xl">
          <CalendarGrid currentDate={currentDate} viewMode={viewMode} shifts={enrichedShifts} onCellClick={(d, s) => { setSelectedShift(s); if (s?.original_user_id === authorizedPerson.serial_id) setShowActionModal(true); else setShowDetailsModal(true); }} currentUserEmail={authorizedPerson.email} isAdmin={isAdmin} />
        </div>
      </div>

      <KPIListModal 
        isOpen={showKPIListModal} onClose={closeAllModals} type={kpiListType} currentUser={authorizedPerson} 
        onCancelRequest={(item) => cancelSwapMutation.mutate(item)} 
        onApproveHeadToHead={handleOpenH2HApprovalFromList} 
        onOfferCover={(s) => { setSelectedShift(s); setShowAcceptSwapModal(true); }} 
        onRequestSwap={(s) => { setSelectedShift(s); setShowSwapRequestModal(true); }}
      />
      
      <HeadToHeadApprovalModal isOpen={showHeadToHeadApproval} onClose={closeAllModals} targetShiftId={h2hTargetId} offerShiftId={h2hOfferId} currentUser={authorizedPerson} onApprove={() => headToHeadSwapMutation.mutate()} onDecline={closeAllModals} />
      <ShiftDetailsModal isOpen={showDetailsModal} onClose={closeAllModals} shift={selectedShift} onHeadToHead={(s) => { setSelectedShift(s); setShowHeadToHeadSelector(true); }} onCancelRequest={(item) => cancelSwapMutation.mutate(item)} currentUser={authorizedPerson} isAdmin={isAdmin} />
      <HeadToHeadSelectorModal isOpen={showHeadToHeadSelector} onClose={closeAllModals} targetShift={selectedShift} currentUser={authorizedPerson} />
      <ShiftActionModal isOpen={showActionModal} onClose={closeAllModals} shift={selectedShift} onDelete={(id) => deleteShiftMutation.mutate(id)} onRequestSwap={() => setShowSwapRequestModal(true)} isAdmin={isAdmin} />
    </div>
  );
}