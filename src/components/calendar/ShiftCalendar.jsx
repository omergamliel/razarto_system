import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { format, addDays, parseISO, differenceInMinutes } from 'date-fns';
import { toast } from 'sonner';

// Components
import BackgroundShapes from './BackgroundShapes';
import CalendarHeader from './CalendarHeader';
import CalendarGrid from './CalendarGrid';
import UserNotRegisteredError from '../UserNotRegisteredError'; // מסך חסימה החדש

// Modals
import SwapRequestModal from './SwapRequestModal';
import PendingRequestsModal from './PendingRequestsModal';
import AddShiftModal from './AddShiftModal';
import AcceptSwapModal from './AcceptSwapModal';
import ShiftActionModal from './ShiftActionModal';
import EditRoleModal from './EditRoleModal';
import ShiftDetailsModal from './ShiftDetailsModal';
import CoverSegmentModal from './CoverSegmentModal';
import OnboardingModal from '../onboarding/OnboardingModal'; // מסך כניסה החדש
import KPIHeader from '../dashboard/KPIHeader';
import KPIListModal from '../dashboard/KPIListModal';
import AdminSettingsModal from '../admin/AdminSettingsModal';
import SwapSuccessModal from './SwapSuccessModal';
import SeedRolesData from '../admin/SeedRolesData';
import HeadToHeadSelectorModal from './HeadToHeadSelectorModal';
import HeadToHeadApprovalModal from './HeadToHeadApprovalModal';
import HallOfFameModal from '../dashboard/HallOfFameModal';
import HelpSupportModal from '../dashboard/HelpSupportModal';

export default function ShiftCalendar() {
  const queryClient = useQueryClient();
  
  // --- STATES ---
  const [currentDate, setCurrentDate] = useState(new Date());
  const [clickedDate, setClickedDate] = useState(null); // Fix: Store specific clicked date
  const [viewMode, setViewMode] = useState('month');
  
  // Modal Visibilities
  const [selectedShift, setSelectedShift] = useState(null);
  const [showSwapRequestModal, setShowSwapRequestModal] = useState(false);
  const [showPendingRequestsModal, setShowPendingRequestsModal] = useState(false);
  const [showAddShiftModal, setShowAddShiftModal] = useState(false);
  const [showAcceptSwapModal, setShowAcceptSwapModal] = useState(false);
  const [showActionModal, setShowActionModal] = useState(false);
  const [showEditRoleModal, setShowEditRoleModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showCoverSegmentModal, setShowCoverSegmentModal] = useState(false);
  const [showAdminSettings, setShowAdminSettings] = useState(false);
  const [showHallOfFame, setShowHallOfFame] = useState(false);
  const [showHelpSupport, setShowHelpSupport] = useState(false);
  
  // KPI & Success Modals
  const [showKPIListModal, setShowKPIListModal] = useState(false);
  const [kpiListType, setKpiListType] = useState('swap_requests');
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [lastUpdatedShift, setLastUpdatedShift] = useState(null);

  // Head-to-Head States
  const [showHeadToHeadSelector, setShowHeadToHeadSelector] = useState(false);
  const [showHeadToHeadApproval, setShowHeadToHeadApproval] = useState(false);
  const [h2hTargetId, setH2hTargetId] = useState(null);
  const [h2hOfferId, setH2hOfferId] = useState(null);

  // --- DEBUG LOGS FOR SWAP REQUEST MODAL ---
  const [swapRequestLogs, setSwapRequestLogs] = useState([]);

  const appendSwapLog = (message, data) => {
    const timestamp = new Date().toLocaleTimeString('he-IL', { hour12: false });
    const payloadText = data ? ` | נתונים: ${JSON.stringify(data)}` : '';

    setSwapRequestLogs(prev => {
      const next = [...prev, `${timestamp} — ${message}${payloadText}`];
      return next.slice(-12); // cap to last 12 entries to avoid overflow
    });
  };

  // --- AUTH & USER IDENTIFICATION LOGIC ---

  // 1. Get Current Base44 User
  const { data: currentUser, isLoading: isUserLoading } = useQuery({
    queryKey: ['current-user'],
    queryFn: async () => {
      const user = await base44.auth.me();
      console.log("👤 [DEBUG] Fetched Current User:", user);
      return user;
    },
  });

  // *** FIX: Handle Case Sensitivity (Email vs email) ***
  const userEmail = currentUser?.email || currentUser?.Email;

  // 2. Check Authorization against AuthorizedPerson table
  const { 
    data: authorizedPerson, 
    isLoading: isAuthCheckLoading,
    refetch: refreshAuthCheck 
  } = useQuery({
    queryKey: ['check-authorization', userEmail],
    queryFn: async () => {
      if (!userEmail) {
        console.log("❌ [DEBUG] No email found to check authorization.");
        return null;
      }
      
      console.log("🔍 [DEBUG] Checking authorization for:", userEmail);

      // Fetch all authorized people and search case-insensitive on client-side
      const allPeople = await base44.entities.AuthorizedPerson.list();
      console.log("📄 [DEBUG] All AuthorizedPerson records:", allPeople);

      // Case-insensitive search
      const normalizedUserEmail = userEmail.toLowerCase();
      const match = allPeople.find(person => 
        person.email && person.email.toLowerCase() === normalizedUserEmail
      );

      console.log("✅ [DEBUG] Final Authorization Result:", match || null);
      
      return match || null; 
    },
    enabled: !!userEmail
  });

  // --- MUTATION: Link User (Onboarding Completion) ---
  const linkUserMutation = useMutation({
    mutationFn: async () => {
      if (!authorizedPerson || !currentUser) return;

      console.log("🔗 [DEBUG] Linking user...", { authId: authorizedPerson.id, serialId: currentUser.serial_id });

      // 1. Update AuthorizedPerson with linked_user_id
      await base44.entities.AuthorizedPerson.update(authorizedPerson.id, {
        linked_user_id: currentUser.serial_id 
      });
      
      return true;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['check-authorization']);
      toast.success("החיבור בוצע בהצלחה! ברוכים הבאים.");
    },
    onError: (err) => {
      console.error("❌ [DEBUG] Link Error:", err);
      toast.error("שגיאה בחיבור המשתמש.");
    }
  });

  // --- MAIN DATA QUERIES (Shifts, Users, Requests, Coverages) ---
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

  // Enrich shifts with user data and swap status
  const enrichedShifts = shifts.map(shift => {
    const user = allUsers.find(u => u.serial_id === shift.original_user_id);
    const activeRequest = swapRequests.find(sr => sr.shift_id === shift.id && sr.status === 'Open');
    const shiftCoverages = coverages.filter(c => c.shift_id === shift.id);
    
    return {
      ...shift,
      date: shift.start_date, // Map to old structure for compatibility
      role: user?.full_name || 'לא שובץ',
      department: user?.department || '',
      assigned_email: user?.email || '',
      assigned_person: user?.full_name || '',
      // Swap status mapping
      status: activeRequest 
        ? (activeRequest.request_type === 'Full' ? 'REQUIRES_FULL_COVERAGE' : 'REQUIRES_PARTIAL_COVERAGE')
        : shift.status === 'Covered' ? 'approved' : 'regular',
      swap_start_time: activeRequest?.req_start_time,
      swap_end_time: activeRequest?.req_end_time,
      swap_type: activeRequest?.request_type?.toLowerCase(),
      coverages: shiftCoverages
    };
  });

  // --- MUTATIONS (Shift Operations) ---

  const requestSwapMutation = useMutation({
    mutationFn: async ({ shiftId, type, dates }) => {
      const shift = shifts.find(s => s.id === shiftId);
      if (!shift) throw new Error('Shift not found');

      const isFull = type === 'full';
      const req_start_date = isFull ? shift.start_date : (dates.startDate || shift.start_date);
      const req_end_date = isFull ? (shift.end_date || shift.start_date) : (dates.endDate || shift.end_date || dates.startDate);
      const req_start_time = isFull ? (shift.start_time || '09:00') : (dates.startTime || shift.start_time || '09:00');
      const req_end_time = isFull ? (shift.end_time || req_start_time) : (dates.endTime || shift.end_time || req_start_time);

      const payload = {
        shift_id: shiftId,
        requesting_user_id: authorizedPerson.serial_id,
        request_type: isFull ? 'Full' : 'Partial',
        req_start_date,
        req_end_date,
        req_start_time,
        req_end_time,
        status: 'Open'
      };

      appendSwapLog('📨 שולח בקשה למסד', payload);
      console.log('📨 [ShiftCalendar] Creating SwapRequest with payload:', payload);

      await base44.entities.SwapRequest.create(payload);

      appendSwapLog('🔄 מעדכן סטטוס משמרת ל-Swap_Requested', { shiftId });
      return await base44.entities.Shift.update(shiftId, {
        status: 'Swap_Requested'
      });
    },
    onMutate: (variables) => {
      appendSwapLog('🚀 התחלת שליחה', variables);
    },
    onSuccess: (data) => {
      appendSwapLog('✅ הבקשה נשמרה והמשמרת עודכנה');
      queryClient.invalidateQueries(['shifts']);
      queryClient.invalidateQueries(['swap-requests']);
      toast.success('בקשת ההחלפה נשלחה בהצלחה!');
      setLastUpdatedShift(data);
      setShowSwapRequestModal(false);
      setShowActionModal(false);
      setShowSuccessModal(true);
    },
    onError: (error) => {
      appendSwapLog('❌ שגיאה בשליחת הבקשה', { error: error?.message || String(error) });
      console.error('❌ [ShiftCalendar] Swap request failed:', error);
      toast.error('שליחת בקשת ההחלפה נכשלה. נסו שוב.');
    }
  });

  const cancelSwapMutation = useMutation({
    mutationFn: async (shiftId) => {
      // Find and cancel the swap request
      const activeRequest = swapRequests.find(sr => sr.shift_id === shiftId && sr.status === 'Open');
      if (activeRequest) {
        await base44.entities.SwapRequest.update(activeRequest.id, { status: 'Cancelled' });
      }
      
      // Update shift status
      return await base44.entities.Shift.update(shiftId, { status: 'Active' });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['shifts']);
      queryClient.invalidateQueries(['swap-requests']);
      toast.success('הבקשה בוטלה והמשמרת חזרה לסטטוס רגיל');
      setShowDetailsModal(false);
    }
  });

  const offerCoverMutation = useMutation({
    mutationFn: async ({ shift, coverData }) => {
      // Find active swap request
      const activeRequest = swapRequests.find(sr => sr.shift_id === shift.id && sr.status === 'Open');
      if (!activeRequest) throw new Error('No active swap request found');

      // Create Coverage Record
      await base44.entities.ShiftCoverage.create({
        request_id: activeRequest.id,
        shift_id: shift.id,
        covering_user_id: authorizedPerson.serial_id,
        cover_start_date: coverData.startDate || coverData.coverDate,
        cover_end_date: coverData.endDate || coverData.coverDate,
        cover_start_time: coverData.startTime,
        cover_end_time: coverData.endTime,
        status: 'Approved'
      });

      // Update SwapRequest status
      const isFullCover = coverData.coverFull || coverData.type === 'full';
      if (isFullCover) {
        await base44.entities.SwapRequest.update(activeRequest.id, { status: 'Closed' });
        await base44.entities.Shift.update(shift.id, { status: 'Covered' });
      } else {
        await base44.entities.SwapRequest.update(activeRequest.id, { status: 'Partially_Covered' });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['shifts']);
      queryClient.invalidateQueries(['swap-requests']);
      queryClient.invalidateQueries(['coverages']);
      toast.success('הצעת הכיסוי נשלחה בהצלחה!');
      setShowCoverSegmentModal(false);
      setShowDetailsModal(false);
    }
  });

  const headToHeadSwapMutation = useMutation({
    mutationFn: async () => {
      if (!h2hTargetId || !h2hOfferId) return;

      // 1. Get Shifts
      const targetShift = shifts.find(s => s.id === h2hTargetId);
      const offerShift = shifts.find(s => s.id === h2hOfferId);

      // 2. Swap Assignees
      await base44.entities.Shift.update(h2hTargetId, {
        assigned_person: offerShift.assigned_person,
        assigned_email: offerShift.assigned_email,
        role: offerShift.role,
        department: offerShift.department,
        status: 'regular'
      });

      await base44.entities.Shift.update(h2hOfferId, {
        assigned_person: targetShift.assigned_person,
        assigned_email: targetShift.assigned_email,
        role: targetShift.role,
        department: targetShift.department,
        status: 'regular'
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['shifts']);
      toast.success('החלפה ראש בראש בוצעה בהצלחה!');
      setShowHeadToHeadApproval(false);
      setH2hTargetId(null);
      setH2hOfferId(null);
    }
  });

  const approveSwapMutation = useMutation({
    mutationFn: async (shift) => {
      // Find the pending coverage
      const coverages = await base44.entities.ShiftCoverage.filter({ shift_id: shift.id });
      const pendingCoverage = coverages[0]; // Assuming one pending for simplicity

      if (!pendingCoverage) return;

      // Update Shift with new assignee
      await base44.entities.Shift.update(shift.id, {
        assigned_person: pendingCoverage.covering_person,
        assigned_email: pendingCoverage.covering_email,
        role: pendingCoverage.covering_role, // Or keep original role name if preferred
        status: 'regular',
        swap_start_time: null,
        swap_end_time: null
      });
      
      // Update Coverage status (optional if you have status field on coverage)
      // await base44.entities.ShiftCoverage.update(pendingCoverage.id, { status: 'approved' });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['shifts']);
      toast.success('ההחלפה אושרה והלוח עודכן!');
      setShowDetailsModal(false);
    }
  });

  const addShiftMutation = useMutation({
    mutationFn: async (newShiftData) => {
      return await base44.entities.Shift.create({
        start_date: newShiftData.start_date,
        end_date: newShiftData.end_date,
        start_time: newShiftData.start_time || '09:00',
        end_time: newShiftData.end_time || '09:00',
        original_user_id: newShiftData.original_user_id,
        status: 'Active'
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['shifts']);
      toast.success('המשמרת נוספה בהצלחה');
      setShowAddShiftModal(false);
    }
  });

  const editRoleMutation = useMutation({
    mutationFn: async ({ id, ...data }) => {
      return await base44.entities.Shift.update(id, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['shifts']);
      toast.success('התפקיד עודכן בהצלחה');
      setShowEditRoleModal(false);
      setShowActionModal(false);
    }
  });

  const deleteShiftMutation = useMutation({
    mutationFn: async (id) => {
      return await base44.entities.Shift.delete(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['shifts']);
      toast.success('המשמרת נמחקה');
      setShowActionModal(false);
      setShowDetailsModal(false);
    }
  });

  // --- HANDLERS ---

  const handleCellClick = (date, shift) => {
    setClickedDate(date); // Fix: Save the clicked date for Add Modal

    // Check Date Validity (Prevent editing past)
    const clickedDate = new Date(date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    clickedDate.setHours(0, 0, 0, 0);
    const isPast = clickedDate < today;

    if (!shift) {
        if (isAdmin && !isPast) {
            setShowAddShiftModal(true);
        }
        return;
    }

    // Permissions & ownership
    const permissionLevel = authorizedPerson.permissions;
    const isViewOnly = permissionLevel === 'View';
    const isRR = permissionLevel === 'RR';
    const isMyShift = shift.original_user_id === authorizedPerson.serial_id || shift.assigned_email === authorizedPerson.email;
    const isCoveredShift = shift.status === 'approved' || shift.status === 'Covered';
    const isCoveringUser = (shift.coverages || []).some(cov => cov.covering_user_id === authorizedPerson.serial_id);

    // View-only users cannot open shifts at all
    if (isViewOnly) {
      return;
    }

    // Access rules for RR level
    if (isRR && !isAdmin) {
      if (shift.status === 'regular' && !isMyShift) {
        return;
      }

      if (isCoveredShift && !(isMyShift || isCoveringUser)) {
        return;
      }

      // Swap requests are always viewable for RR (covered by default fallthrough)
    }

    setSelectedShift(shift);

    // Determine if it's my shift
    if (shift.status === 'regular') {
        if (isMyShift && !isPast) {
            setShowActionModal(true);
        } else {
            setShowDetailsModal(true); // View details for others
        }
    } else {
        // Swap requested, Pending, etc.
        setShowDetailsModal(true);
    }
  };

  const handleOfferCover = (shift) => {
    setSelectedShift(shift);
    setShowCoverSegmentModal(true);
  };

  const handleOpenSwapRequest = (shift) => {
    setSwapRequestLogs([]);
    setSelectedShift(shift);
    setShowSwapRequestModal(true);
  };

  const handleSwapSubmit = (data) => {
    if (!selectedShift) {
      console.error('❌ [ShiftCalendar] No shift selected for swap request submission');
      appendSwapLog('❌ לא נבחרה משמרת לשליחה');
      return;
    }

    appendSwapLog('📝 נתוני בקשה מהמודל', data);
    console.log('📤 [ShiftCalendar] Submitting swap request from modal:', data);

    requestSwapMutation.mutate({
      shiftId: selectedShift.id,
      type: data.type,
      dates: data
    });
  };

  // --- RENDER LOGIC ---

  // 1. Loading State
  if (isUserLoading || isAuthCheckLoading) {
    return (
      <div className="min-h-screen bg-[#F9FAFB] flex items-center justify-center" dir="rtl">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
          <p className="text-gray-500 font-medium">מאמת נתונים...</p>
        </div>
      </div>
    );
  }

  // 2. Access Denied (User not in AuthorizedPerson table)
  if (!authorizedPerson) {
    return <UserNotRegisteredError onRefresh={refreshAuthCheck} />;
  }

  // 3. First Time Onboarding (User authorized but not linked)
  if (!authorizedPerson.linked_user_id) {
    return (
      <OnboardingModal 
        isOpen={true} 
        authorizedData={authorizedPerson}
        onConfirm={() => linkUserMutation.mutate()}
        isLoading={linkUserMutation.isPending}
      />
    );
  }

  // 4. Main App (User authorized and linked)
  const permissionLevel = authorizedPerson.permissions;
  const isAdmin = permissionLevel === 'Admin' || permissionLevel === 'Manager';
  const isViewOnly = permissionLevel === 'View';

  return (
    <div className="min-h-screen bg-[#F9FAFB] text-gray-900 font-sans selection:bg-blue-100 overflow-x-hidden relative" dir="rtl">
      <BackgroundShapes />
      
      {/* SEED DATA COMPONENT (Hidden) - Keeps roles synced if needed */}
      <SeedRolesData />

      <div className="max-w-7xl mx-auto px-4 py-4 md:py-8 relative z-10 flex flex-col min-h-screen">
        
        {/* Header */}
        <CalendarHeader 
          currentDate={currentDate}
          setCurrentDate={setCurrentDate}
          viewMode={viewMode}
          setViewMode={setViewMode}
          isAdmin={isAdmin}
          onOpenAdminSettings={() => setShowAdminSettings(true)}
          onOpenHallOfFame={() => setShowHallOfFame(true)}
          onOpenHelp={() => setShowHelpSupport(true)}
          currentUser={authorizedPerson} 
        />

        {/* KPI Header */}
        <div className="mt-6 mb-2">
           <KPIHeader 
             shifts={enrichedShifts} 
             currentUser={authorizedPerson}
             onKPIClick={(type) => {
               setKpiListType(type);
               setShowKPIListModal(true);
             }}
           />
        </div>

        {/* Calendar Grid */}
        <div className="flex-1 bg-white/80 backdrop-blur-xl rounded-3xl shadow-xl border border-white/50 p-2 md:p-6 mt-4 relative overflow-hidden">
          <CalendarGrid 
            currentDate={currentDate}
            viewMode={viewMode}
            shifts={enrichedShifts}
            onCellClick={handleCellClick}
            currentUserEmail={authorizedPerson.email}
            currentUserRole={authorizedPerson.full_name}
            isAdmin={isAdmin}
          />
        </div>
      </div>

      {/* --- MODALS --- */}
      
      <AdminSettingsModal 
        isOpen={showAdminSettings} 
        onClose={() => setShowAdminSettings(false)} 
      />

      <ShiftActionModal
        isOpen={showActionModal}
        onClose={() => setShowActionModal(false)}
        shift={selectedShift}
        date={currentDate}
        onRequestSwap={() => {
            setShowActionModal(false);
            setShowSwapRequestModal(true);
        }}
        onEditRole={() => {
            setShowActionModal(false);
            setShowEditRoleModal(true);
        }}
        onDelete={deleteShiftMutation.mutate}
        isAdmin={isAdmin}
      />

      <SwapRequestModal
        isOpen={showSwapRequestModal}
        onClose={() => setShowSwapRequestModal(false)}
        date={currentDate}
        shift={selectedShift}
        onSubmit={handleSwapSubmit}
        isSubmitting={requestSwapMutation.isPending}
        logMessages={swapRequestLogs}
      />

      <AddShiftModal
        isOpen={showAddShiftModal}
        onClose={() => setShowAddShiftModal(false)}
        date={clickedDate || currentDate}
        onSubmit={(data) => addShiftMutation.mutate({
            ...data,
            date: format(currentDate, 'yyyy-MM-dd') // Needs refinement if specific day clicked
        })}
        isSubmitting={addShiftMutation.isPending}
      />

      <EditRoleModal
        isOpen={showEditRoleModal}
        onClose={() => setShowEditRoleModal(false)}
        shift={selectedShift}
        date={currentDate}
        onSubmit={(data) => editRoleMutation.mutate({ id: selectedShift.id, ...data })}
        isSubmitting={editRoleMutation.isPending}
      />

      <ShiftDetailsModal
        isOpen={showDetailsModal}
        onClose={() => setShowDetailsModal(false)}
        shift={selectedShift}
        date={currentDate}
        onCoverSegment={(shift) => handleOfferCover(shift)}
        onOfferCover={handleOfferCover}
        onHeadToHead={(shift) => {
            setSelectedShift(shift);
            setShowHeadToHeadSelector(true);
        }}
        onCancelRequest={(shift) => cancelSwapMutation.mutate(shift.id)}
        onDelete={deleteShiftMutation.mutate}
        onApprove={() => approveSwapMutation.mutate(selectedShift)}
        currentUserEmail={authorizedPerson.email}
        isAdmin={isAdmin}
      />

      <CoverSegmentModal
        isOpen={showCoverSegmentModal}
        onClose={() => setShowCoverSegmentModal(false)}
        shift={selectedShift}
        date={selectedShift?.date}
        onSubmit={(segmentData) => offerCoverMutation.mutate({ shift: selectedShift, coverData: segmentData })}
        isSubmitting={offerCoverMutation.isPending}
      />

      <SwapSuccessModal
        isOpen={showSuccessModal}
        onClose={() => setShowSuccessModal(false)}
        shift={lastUpdatedShift}
      />

      <HeadToHeadSelectorModal
        isOpen={showHeadToHeadSelector}
        onClose={() => setShowHeadToHeadSelector(false)}
        targetShift={selectedShift}
        currentUser={authorizedPerson}
      />

      <HeadToHeadApprovalModal
        isOpen={showHeadToHeadApproval}
        onClose={() => setShowHeadToHeadApproval(false)}
        targetShiftId={h2hTargetId}
        offerShiftId={h2hOfferId}
        onApprove={() => headToHeadSwapMutation.mutate()}
        onDecline={() => setShowHeadToHeadApproval(false)}
      />

      <HallOfFameModal 
        isOpen={showHallOfFame}
        onClose={() => setShowHallOfFame(false)}
      />

      <HelpSupportModal
        isOpen={showHelpSupport}
        onClose={() => setShowHelpSupport(false)}
      />

      <KPIListModal
        isOpen={showKPIListModal}
        onClose={() => setShowKPIListModal(false)}
        type={kpiListType}
        currentUser={authorizedPerson}
        onOfferCover={handleOfferCover}
        onRequestSwap={handleOpenSwapRequest}
        actionsDisabled={isViewOnly}
      />

    </div>
  );
}


