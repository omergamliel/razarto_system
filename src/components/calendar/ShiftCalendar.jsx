import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { format, addDays, parseISO, differenceInMinutes } from 'date-fns';
import { toast } from 'sonner';

// Components
import BackgroundShapes from './BackgroundShapes';
import CalendarHeader from './CalendarHeader';
import CalendarGrid from './CalendarGrid';
import UserNotRegisteredError from './UserNotRegisteredError'; // מסך חסימה החדש

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

  // --- AUTH & USER IDENTIFICATION LOGIC ---

  // 1. Get Current Base44 User
  const { data: currentUser, isLoading: isUserLoading } = useQuery({
    queryKey: ['current-user'],
    queryFn: () => base44.auth.me(),
  });

  // 2. Check Authorization against AuthorizedPerson table
  const { 
    data: authorizedPerson, 
    isLoading: isAuthCheckLoading,
    refetch: refreshAuthCheck 
  } = useQuery({
    queryKey: ['check-authorization', currentUser?.email],
    queryFn: async () => {
      if (!currentUser?.email) return null;
      // Find person by email in the new table
      const people = await base44.entities.AuthorizedPerson.filter({ email: currentUser.email });
      return people.length > 0 ? people[0] : null; 
    },
    enabled: !!currentUser?.email
  });

  // --- MUTATION: Link User (Onboarding Completion) ---
  const linkUserMutation = useMutation({
    mutationFn: async () => {
      if (!authorizedPerson || !currentUser) return;

      // 1. Update AuthorizedPerson with linked_user_id
      // We use currentUser.serial_id which we added earlier to the User table
      await base44.entities.AuthorizedPerson.update(authorizedPerson.id, {
        linked_user_id: currentUser.serial_id 
      });

      // 2. Sync User object with permissions/name/dept if needed (Optional but recommended)
      // This keeps the legacy user object somewhat in sync just in case
      /* await base44.user.updateMe({
         name: authorizedPerson.full_name,
         department: authorizedPerson.department
      });
      */
      
      return true;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['check-authorization']);
      toast.success("החיבור בוצע בהצלחה! ברוכים הבאים.");
    },
    onError: () => {
      toast.error("שגיאה בחיבור המשתמש.");
    }
  });

  // --- MAIN DATA QUERIES (Shifts) ---
  const { data: shifts = [], isLoading: isShiftsLoading } = useQuery({
    queryKey: ['shifts'],
    queryFn: () => base44.entities.Shift.list(),
    enabled: !!authorizedPerson // Only fetch shifts if authorized
  });

  // --- MUTATIONS (Shift Operations) ---

  const requestSwapMutation = useMutation({
    mutationFn: async ({ shiftId, type, range, dates }) => {
      const updateData = {
        status: 'swap_requested',
        swap_type: type, // 'full' or 'partial'
        swap_start_time: dates.startTime,
        swap_end_time: dates.endTime
      };
      return await base44.entities.Shift.update(shiftId, updateData);
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries(['shifts']);
      setLastUpdatedShift(data);
      setShowSwapRequestModal(false);
      setShowActionModal(false);
      setShowSuccessModal(true);
    }
  });

  const cancelSwapMutation = useMutation({
    mutationFn: async (shiftId) => {
      return await base44.entities.Shift.update(shiftId, {
        status: 'regular',
        swap_type: null,
        swap_start_time: null,
        swap_end_time: null
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['shifts']);
      toast.success('הבקשה בוטלה והמשמרת חזרה לסטטוס רגיל');
      setShowDetailsModal(false);
    }
  });

  const offerCoverMutation = useMutation({
    mutationFn: async ({ shift, coverData }) => {
      // 1. Create Coverage Record
      await base44.entities.ShiftCoverage.create({
        shift_id: shift.id,
        covering_person: authorizedPerson.full_name,
        covering_email: authorizedPerson.email,
        covering_role: authorizedPerson.full_name, // Using name as role/identifier
        covering_department: authorizedPerson.department,
        start_time: coverData.startTime,
        end_time: coverData.endTime,
        coverage_type: coverData.type
      });

      // 2. Update Shift Status
      const isFullCover = coverData.type === 'full';
      return await base44.entities.Shift.update(shift.id, {
        status: isFullCover ? 'pending_approval' : 'partially_covered'
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['shifts']);
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
        ...newShiftData,
        status: 'regular'
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
    setSelectedShift(shift);
    
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

    // Determine if it's my shift
    const isMyShift = shift.assigned_email === authorizedPerson.email;

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
  const isAdmin = authorizedPerson.permissions === 'Admin' || authorizedPerson.permissions === 'Manager';

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
             shifts={shifts} 
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
            shifts={shifts}
            onCellClick={handleCellClick}
            currentUserEmail={authorizedPerson.email}
            currentUserRole={authorizedPerson.full_name} // Using full name as role identifier visually
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
        onSubmit={(data) => requestSwapMutation.mutate({ 
            shiftId: selectedShift.id, 
            type: data.type, 
            range: data.range, 
            dates: data 
        })}
        isSubmitting={requestSwapMutation.isPending}
      />

      <AddShiftModal
        isOpen={showAddShiftModal}
        onClose={() => setShowAddShiftModal(false)}
        date={currentDate} // Or specific clicked date if passed via state
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
        shifts={shifts}
        currentUser={authorizedPerson}
        onOfferCover={handleOfferCover}
      />

    </div>
  );
}