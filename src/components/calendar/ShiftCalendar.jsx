import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { format, addDays, parseISO, differenceInMinutes } from 'date-fns';
import { toast } from 'sonner';

// Components
import BackgroundShapes from './BackgroundShapes';
import CalendarHeader from './CalendarHeader';
import CalendarGrid from './CalendarGrid';

// Existing Modals
import SwapRequestModal from './SwapRequestModal';
import PendingRequestsModal from './PendingRequestsModal';
import AddShiftModal from './AddShiftModal';
import AcceptSwapModal from './AcceptSwapModal';
import ShiftActionModal from './ShiftActionModal';
import EditRoleModal from './EditRoleModal';
import ShiftDetailsModal from './ShiftDetailsModal';
import CoverSegmentModal from './CoverSegmentModal';
import OnboardingModal from '../onboarding/OnboardingModal';
import KPIHeader from '../dashboard/KPIHeader';
import KPIListModal from '../dashboard/KPIListModal';
import AdminSettingsModal from '../admin/AdminSettingsModal';
import SwapSuccessModal from './SwapSuccessModal';
import SeedRolesData from '../admin/SeedRolesData';

// --- NEW MODALS ---
import HeadToHeadSelectorModal from './HeadToHeadSelectorModal';
import HeadToHeadApprovalModal from './HeadToHeadApprovalModal';
import HallOfFameModal from '../dashboard/HallOfFameModal';
import HelpSupportModal from '../dashboard/HelpSupportModal';

export default function ShiftCalendar() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState('month');
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedShift, setSelectedShift] = useState(null);
  
  // Modals state
  const [showSwapModal, setShowSwapModal] = useState(false);
  const [showPendingModal, setShowPendingModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showAcceptModal, setShowAcceptModal] = useState(false);
  const [showActionModal, setShowActionModal] = useState(false);
  const [showEditRoleModal, setShowEditRoleModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showCoverSegmentModal, setShowCoverSegmentModal] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showKPIList, setShowKPIList] = useState(false);
  const [kpiType, setKPIType] = useState('');
  const [showAdminSettings, setShowAdminSettings] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [lastUpdatedShift, setLastUpdatedShift] = useState(null);

  // --- NEW STATES FOR H2H & FEATURES ---
  const [showHeadToHeadSelector, setShowHeadToHeadSelector] = useState(false);
  const [showHeadToHeadApproval, setShowHeadToHeadApproval] = useState(false);
  const [h2hTargetId, setH2hTargetId] = useState(null);
  const [h2hOfferId, setH2hOfferId] = useState(null);
  
  const [showHallOfFame, setShowHallOfFame] = useState(false);
  const [showHelpSupport, setShowHelpSupport] = useState(false);

  const [currentUser, setCurrentUser] = useState(null);

  const queryClient = useQueryClient();

  // 1. Fetch User & Check Onboarding
  useEffect(() => {
    const fetchUser = async () => {
      const user = await base44.auth.me();
      setCurrentUser(user);
      
      if (!user.assigned_role) {
        setShowOnboarding(true);
      }
    };
    fetchUser();
  }, []);

  // 2. URL Listener for Head-to-Head Link (Receiver Logic)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const mode = params.get('mode');

    if (mode === 'head_to_head_approval') {
        const targetId = params.get('targetId');
        const offerId = params.get('offerId');

        if (targetId && offerId) {
            setH2hTargetId(targetId);
            setH2hOfferId(offerId);
            setShowHeadToHeadApproval(true);
            
            // Clean the URL so refresh doesn't trigger it again
            window.history.replaceState({}, document.title, window.location.pathname);
        }
    }
  }, []);

  // --- NEW FETCH LOGIC: Fetch Shifts + Assignments and Merge ---
  const { data: shifts = [], isLoading } = useQuery({
    queryKey: ['shifts-composite'],
    queryFn: async () => {
      // 1. Fetch raw shifts (The "Slots")
      const rawShifts = await base44.entities.Shifts.list();
      
      // 2. Fetch all assignments
      const allAssignments = await base44.entities.ShiftAssignments.list();
      
      // 3. Fetch all users (to map user_id to names/roles)
      const allUsers = await base44.entities.Users.list(); 

      // 4. Merge Logic
      const mergedShifts = rawShifts.map(shiftSlot => {
          // Find the active assignment for this shift
          // We assume one active assignment represents the "Main" owner.
          const assignment = allAssignments.find(a => a.shift_id === shiftSlot.id && a.status === 'מאושר');
          
          let assignedUser = null;
          if (assignment) {
              assignedUser = allUsers.find(u => u.id === assignment.user_id);
          }

          // Return a structure compatible with the frontend components
          return {
              id: shiftSlot.id, // The Shift ID
              date: shiftSlot.date,
              start_time: shiftSlot.start_time,
              end_time: shiftSlot.end_time,
              status: mapStatusToLegacy(shiftSlot.status), // Map Hebrew status to legacy English codes
              
              // Flattened User Info for ease of use in existing components
              assigned_person: assignedUser ? assignedUser.full_name : 'לא משובץ',
              assigned_role: assignedUser ? assignedUser.assigned_role : 'לא משובץ', // The important display name
              assigned_email: assignedUser ? assignedUser.email : null,
              
              department: 'כללי', // Or fetch from role definition if needed
              role: 'תורן', // Generic label or from shift type
              
              // Keep original objects for advanced logic if needed
              _rawAssignment: assignment,
              _rawShift: shiftSlot
          };
      });

      return mergedShifts;
    },
  });

  // Helper to map new Hebrew statuses to old English logic
  const mapStatusToLegacy = (hebrewStatus) => {
      const map = {
          'רגילה': 'regular',
          'בקשת החלפה': 'swap_requested', 
          'ממתין לאישור': 'pending_approval',
          'אושרה': 'approved',
          'מכוסה חלקית': 'partially_covered'
      };
      return map[hebrewStatus] || 'regular';
  };

  // --- MUTATIONS ---

  const addShiftMutation = useMutation({
    mutationFn: async ({ date, shiftData }) => {
      if (currentUser?.user_type !== 'admin') {
        throw new Error('רק מנהלים יכולים ליצור משמרות');
      }

      // 1. Find the User ID based on the selected Role Name
      // We assume shiftData.role holds the 'assigned_role' string.
      const users = await base44.entities.Users.list();
      const targetUser = users.find(u => u.assigned_role === shiftData.role);

      if (!targetUser) throw new Error('משתמש לא נמצא');

      // 2. Create the Shift (The Slot)
      const newShift = await base44.entities.Shifts.create({
        date: format(date, 'yyyy-MM-dd'),
        start_time: '09:00', // Default
        end_time: '09:00',   // Default
        status: 'רגילה'
      });

      // 3. Create the Assignment (The Person)
      await base44.entities.ShiftAssignments.create({
        shift_id: newShift.id,
        user_id: targetUser.id,
        status: 'מאושר',
        cover_start_date: format(date, 'yyyy-MM-dd'),
        cover_start_time: '09:00',
        cover_end_date: format(addDays(date, 1), 'yyyy-MM-dd'),
        cover_end_time: '09:00'
      });

      return newShift;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shifts-composite'] });
      setShowAddModal(false);
      toast.success('המשמרת נוספה בהצלחה (במבנה החדש)');
    },
    onError: (error) => {
      console.error(error);
      toast.error(error.message || 'שגיאה בהוספת המשמרת');
    }
  });

  const swapRequestMutation = useMutation({
    mutationFn: async ({ date, swapData }) => {
      const existingShift = shifts.find(s => s.date === format(date, 'yyyy-MM-dd'));

      if (existingShift) {
        // We need to update the SHIFT status in the new table 'Shifts'
        // Logic remains mostly same, but targeting the new table structure if fully migrated.
        // For hybrid approach (using legacy logic on new structure wrapper):
        
        const isPartial = swapData.swapType === 'partial';
        // Map legacy status to Hebrew status for DB
        const newStatusHebrew = isPartial ? 'מכוסה חלקית' : 'בקשת החלפה'; 

        // Update the PARENT shift record
        const updatedShift = await base44.entities.Shifts.update(existingShift.id, {
          status: newStatusHebrew,
          // Note: In new structure, request details should ideally go to 'SwapRequests' table.
          // If we stick to 'Shifts' table for requests temporarily:
          // We need custom fields there or a separate table. 
          // Assuming for now we just change status to signal the UI.
        });
        return updatedShift;
      }
      return null;
    },
    onSuccess: (updatedShift) => {
      queryClient.invalidateQueries({ queryKey: ['shifts-composite'] });
      setShowSwapModal(false);
      if (updatedShift) {
        // Mocking the return object to satisfy legacy modal needs
        setLastUpdatedShift({ ...updatedShift, status: 'swap_requested' }); 
        setShowSuccessModal(true);
      } else {
        toast.success('בקשת ההחלפה נשלחה בהצלחה');
      }
    },
    onError: () => {
      toast.error('שגיאה בשליחת הבקשה');
    }
  });

  // --- CANCEL SWAP REQUEST ---
  const cancelSwapMutation = useMutation({
    mutationFn: async (shiftId) => {
        // Reset shift to regular state in new 'Shifts' table
        return base44.entities.Shifts.update(shiftId, {
            status: 'רגילה',
            // Clear other request fields if they exist in the new table schema
        });
    },
    onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['shifts-composite'] });
        queryClient.invalidateQueries({ queryKey: ['shift-coverages'] }); 
        setShowDetailsModal(false);
        toast.success('הבקשה בוטלה בהצלחה, המשמרת חזרה למצב רגיל');
    },
    onError: () => {
        toast.error('שגיאה בביטול הבקשה');
    }
  });

  // --- THE FIXED COVER LOGIC (Adapted for New Tables) ---
  const offerCoverMutation = useMutation({
    mutationFn: async ({ shift, coverData }) => {
      // In new structure, covering means creating a NEW Assignment
      // 1. Find User ID
      const users = await base44.entities.Users.list();
      // Assuming currentUser has email available
      const coverUser = users.find(u => u.email === currentUser?.email);
      
      if (!coverUser) throw new Error('משתמש לא נמצא');

      // 2. Create Assignment
      await base44.entities.ShiftAssignments.create({
        shift_id: shift.id,
        user_id: coverUser.id,
        status: 'מאושר', // Or pending
        cover_start_date: coverData.startDate,
        cover_start_time: coverData.startTime,
        cover_end_date: coverData.endDate,
        cover_end_time: coverData.endTime
      });

      // 3. Update Parent Shift Status if needed (e.g. check if full)
      // (Simplified logic: if someone covers, we mark as approved for now)
      return base44.entities.Shifts.update(shift.id, { status: 'אושרה' });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shifts-composite'] });
      setShowAcceptModal(false);
      setShowCoverSegmentModal(false);
      toast.success('הכיסוי נקלט בהצלחה!');
    },
    onError: (e) => {
      console.error(e);
      toast.error('שגיאה בשמירת הכיסוי');
    }
  });

  // --- NEW: HEAD-TO-HEAD SWAP EXECUTION (Adapted) ---
  const headToHeadSwapMutation = useMutation({
    mutationFn: async () => {
        // Logic needs to swap USER_IDs in the ShiftAssignments table
        const allAssignments = await base44.entities.ShiftAssignments.list();
        
        // Find main assignment for target and offer shifts
        const targetAssign = allAssignments.find(a => a.shift_id === h2hTargetId && a.status === 'מאושר');
        const offerAssign = allAssignments.find(a => a.shift_id === h2hOfferId && a.status === 'מאושר');

        if (!targetAssign || !offerAssign) throw new Error('שיבוצים לא נמצאו');

        // Swap User IDs
        const targetUserId = targetAssign.user_id;
        const offerUserId = offerAssign.user_id;

        await base44.entities.ShiftAssignments.update(targetAssign.id, { user_id: offerUserId });
        await base44.entities.ShiftAssignments.update(offerAssign.id, { user_id: targetUserId });
        
        // Reset status of parent shifts to Regular/Approved
        await base44.entities.Shifts.update(h2hTargetId, { status: 'אושרה' });
        await base44.entities.Shifts.update(h2hOfferId, { status: 'אושרה' });
    },
    onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['shifts-composite'] });
        setShowHeadToHeadApproval(false);
        toast.success('ההחלפה ראש-בראש בוצעה בהצלחה! הלוח עודכן.');
    },
    onError: () => {
        toast.error('שגיאה בביצוע ההחלפה');
    }
  });

  const approveSwapMutation = useMutation({
    mutationFn: async (shift) => {
        // Logic to approve swap in new DB
        return base44.entities.Shifts.update(shift.id, { status: 'אושרה' });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shifts-composite'] });
      toast.success('ההחלפה אושרה בהצלחה');
    },
    onError: (error) => {
      toast.error(error.message || 'שגיאה באישור ההחלפה');
    }
  });

  const deleteShiftMutation = useMutation({
    mutationFn: async (shiftId) => {
      if (currentUser?.user_type !== 'admin') {
        throw new Error('רק מנהלים יכולים למחוק משמרות');
      }
      return base44.entities.Shifts.delete(shiftId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shifts-composite'] });
      setShowDetailsModal(false);
      toast.success('השיבוץ נמחק בהצלחה');
    },
    onError: (error) => {
      toast.error(error.message || 'שגיאה במחיקת השיבוץ');
    }
  });

  const editRoleMutation = useMutation({
    mutationFn: async ({ shift, roleData }) => {
      // In new structure, 'Role' is derived from User. To change role, we change User in Assignment.
      // Or if 'Role' is a property of Shift, we update Shift.
      // Assuming we just update metadata if needed.
      return null; 
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shifts-composite'] });
      setShowEditRoleModal(false);
      toast.success('התפקיד עודכן בהצלחה');
    },
    onError: () => {
      toast.error('שגיאה בעדכון התפקיד');
    }
  });

  // --- Handlers ---

  const handleCellClick = (date, shift) => {
    const validDate = new Date(date);
    setSelectedDate(validDate);
    setSelectedShift(shift);
    
    if (!shift) {
      if (isAdmin) setShowAddModal(true);
      return;
    }

    if (isAdmin) {
      if (shift.status === 'regular') setShowActionModal(true);
      else setShowDetailsModal(true);
      return;
    }

    const isMyShift = shift.assigned_email === currentUser?.email; 

    const isSwapActive = [
        'swap_requested', 
        'REQUIRES_FULL_COVERAGE', 
        'REQUIRES_PARTIAL_COVERAGE', 
        'partially_covered',
        'approved'
    ].includes(shift.status);

    if (isMyShift) {
        if (isSwapActive) {
            setShowDetailsModal(true);
        } else {
            setShowActionModal(true);
        }
    } else if (isSwapActive) {
      setShowDetailsModal(true);
    }
  };

  const handleKPIClick = (type) => {
    setKPIType(type);
    setShowKPIList(true);
  };

  const handleOfferCover = async (shift) => {
    setSelectedShift(shift);
    if (shift.date) setSelectedDate(new Date(shift.date));
    setShowCoverSegmentModal(true); 
  };

  const handleOnboardingComplete = () => {
    setShowOnboarding(false);
    base44.auth.me().then(user => setCurrentUser(user));
  };

  const isAdmin = ['admin', 'manager'].includes(currentUser?.user_type);

  return (
    <div className="min-h-screen bg-[#FAFAFA] relative overflow-hidden" dir="rtl" style={{ fontFamily: 'Heebo, sans-serif' }}>
      <SeedRolesData />
      <BackgroundShapes />
      
      <div className="relative z-10 max-w-7xl mx-auto px-4 py-6 md:py-8">
        <CalendarHeader
          currentDate={currentDate}
          setCurrentDate={setCurrentDate}
          viewMode={viewMode}
          setViewMode={setViewMode}
          isAdmin={isAdmin}
          onOpenAdminSettings={() => setShowAdminSettings(true)}
          onOpenHallOfFame={() => setShowHallOfFame(true)}
          onOpenHelp={() => setShowHelpSupport(true)}
          currentUser={currentUser}
          hideNavigation
        />

        <KPIHeader 
          shifts={shifts} 
          currentUser={currentUser} 
          onKPIClick={handleKPIClick} 
        />

        <CalendarHeader
          currentDate={currentDate}
          setCurrentDate={setCurrentDate}
          viewMode={viewMode}
          setViewMode={setViewMode}
          isAdmin={isAdmin}
          currentUser={currentUser}
          hideHeader
        />

        <CalendarGrid
          currentDate={currentDate}
          viewMode={viewMode}
          shifts={shifts}
          onCellClick={handleCellClick}
          currentUserEmail={currentUser?.email}
          currentUserRole={currentUser?.assigned_role}
          isAdmin={isAdmin}
        />

        <OnboardingModal isOpen={showOnboarding} onComplete={handleOnboardingComplete} />
        <KPIListModal isOpen={showKPIList} onClose={() => setShowKPIList(false)} type={kpiType} shifts={shifts} currentUser={currentUser} onOfferCover={handleOfferCover} onRequestSwap={(shift) => { setSelectedShift(shift); setSelectedDate(new Date(shift.date)); setShowKPIList(false); setShowSwapModal(true); }} />
        <AdminSettingsModal isOpen={showAdminSettings} onClose={() => setShowAdminSettings(false)} />
        
        <SwapRequestModal isOpen={showSwapModal} onClose={() => setShowSwapModal(false)} date={selectedDate} shift={selectedShift} onSubmit={(swapData) => swapRequestMutation.mutate({ date: selectedDate, swapData })} isSubmitting={swapRequestMutation.isPending} />
        <PendingRequestsModal isOpen={showPendingModal} onClose={() => setShowPendingModal(false)} requests={shifts} onAccept={handleOfferCover} isAccepting={false} currentUserEmail={currentUser?.email} />
        
        <AddShiftModal 
            isOpen={showAddModal} 
            onClose={() => setShowAddModal(false)} 
            date={selectedDate} 
            onSubmit={(shiftData) => addShiftMutation.mutate({ date: selectedDate, shiftData })} 
            isSubmitting={addShiftMutation.isPending} 
            currentUser={currentUser} 
        />
        
        <AcceptSwapModal isOpen={showAcceptModal} onClose={() => setShowAcceptModal(false)} shift={selectedShift} onAccept={(acceptData) => offerCoverMutation.mutate({ shift: selectedShift, coverData: acceptData })} isAccepting={offerCoverMutation.isPending} />
        <ShiftActionModal isOpen={showActionModal} onClose={() => setShowActionModal(false)} shift={selectedShift} date={selectedDate} onRequestSwap={() => { setShowActionModal(false); setShowSwapModal(true); }} onEditRole={() => { setShowActionModal(false); setShowEditRoleModal(true); }} onDelete={deleteShiftMutation.mutate} isAdmin={isAdmin} />
        <EditRoleModal isOpen={showEditRoleModal} onClose={() => setShowEditRoleModal(false)} date={selectedDate} shift={selectedShift} onSubmit={() => {}} isSubmitting={false} />
        
        <ShiftDetailsModal
          isOpen={showDetailsModal}
          onClose={() => setShowDetailsModal(false)}
          shift={selectedShift}
          date={selectedDate}
          onCoverSegment={handleOfferCover}
          onOfferCover={handleOfferCover}
          onHeadToHead={(shift) => { setSelectedShift(shift); setShowHeadToHeadSelector(true); }}
          onCancelRequest={(shift) => { cancelSwapMutation.mutate(shift.id); }}
          onDelete={deleteShiftMutation.mutate}
          onApprove={() => {}}
          currentUserEmail={currentUser?.email}
          isAdmin={isAdmin}
        />

        <CoverSegmentModal isOpen={showCoverSegmentModal} onClose={() => setShowCoverSegmentModal(false)} shift={selectedShift} date={selectedDate} onSubmit={() => {}} isSubmitting={false} />
        <SwapSuccessModal isOpen={showSuccessModal} onClose={() => setShowSuccessModal(false)} shift={lastUpdatedShift} />
        <HeadToHeadSelectorModal isOpen={showHeadToHeadSelector} onClose={() => setShowHeadToHeadSelector(false)} targetShift={selectedShift} currentUser={currentUser} />
        <HeadToHeadApprovalModal isOpen={showHeadToHeadApproval} onClose={() => setShowHeadToHeadApproval(false)} targetShiftId={h2hTargetId} offerShiftId={h2hOfferId} onApprove={() => headToHeadSwapMutation.mutate()} onDecline={() => setShowHeadToHeadApproval(false)} />
        <HallOfFameModal isOpen={showHallOfFame} onClose={() => setShowHallOfFame(false)} />
        <HelpSupportModal isOpen={showHelpSupport} onClose={() => setShowHelpSupport(false)} />
      </div>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Heebo:wght@300;400;500;600;700&display=swap');`}</style>
    </div>
  );
}