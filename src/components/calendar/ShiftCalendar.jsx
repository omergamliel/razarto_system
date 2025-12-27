import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { format, addDays } from 'date-fns';
import { toast } from 'sonner';

import BackgroundShapes from './BackgroundShapes';
import CalendarHeader from './CalendarHeader';
import CalendarGrid from './CalendarGrid';
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
import SeedRolesData from '../admin/SeedRolesData';

export default function ShiftCalendar() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState('month');
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedShift, setSelectedShift] = useState(null);
  
  // Modals state
  const [showSwapModal, setShowSwapModal] = useState(false);
  const [showPendingModal, setShowPendingModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showAcceptModal, setShowAcceptModal] = useState(false); // We might not need this anymore for the main flow
  const [showActionModal, setShowActionModal] = useState(false);
  const [showEditRoleModal, setShowEditRoleModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showCoverSegmentModal, setShowCoverSegmentModal] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showKPIList, setShowKPIList] = useState(false);
  const [kpiType, setKPIType] = useState('');
  const [showAdminSettings, setShowAdminSettings] = useState(false);

  const [currentUser, setCurrentUser] = useState(null);

  const queryClient = useQueryClient();

  // Fetch current user and check onboarding
  useEffect(() => {
    const fetchUser = async () => {
      const user = await base44.auth.me();
      setCurrentUser(user);
      
      // Check if user needs onboarding
      if (!user.assigned_role) {
        setShowOnboarding(true);
      }
    };
    fetchUser();
  }, []);

  // Fetch shifts
  const { data: shifts = [], isLoading } = useQuery({
    queryKey: ['shifts'],
    queryFn: () => base44.entities.Shift.list(),
  });

  // Add shift mutation (only for admins)
  const addShiftMutation = useMutation({
    mutationFn: async ({ date, shiftData }) => {
      if (currentUser?.user_type !== 'admin') {
        throw new Error('רק מנהלים יכולים ליצור משמרות');
      }
      return base44.entities.Shift.create({
        date: format(date, 'yyyy-MM-dd'),
        department: shiftData.department,
        role: shiftData.role,
        assigned_person: shiftData.assignedPerson || currentUser?.full_name,
        assigned_email: shiftData.assignedEmail || currentUser?.email,
        status: 'regular'
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shifts'] });
      setShowAddModal(false);
      toast.success('המשמרת נוספה בהצלחה');
    },
    onError: (error) => {
      toast.error(error.message || 'שגיאה בהוספת המשמרת');
    }
  });

  // Swap request mutation
  const swapRequestMutation = useMutation({
    mutationFn: async ({ date, swapData }) => {
      const existingShift = shifts.find(s => s.date === format(date, 'yyyy-MM-dd'));

      if (existingShift) {
        return base44.entities.Shift.update(existingShift.id, {
          status: swapData.status || 'swap_requested', // Use the specific status (Full/Partial)
          swap_request_by: currentUser?.email,
          swap_type: swapData.swapType,
          swap_start_time: swapData.swapType === 'partial' ? swapData.startTime : '09:00',
          swap_end_time: swapData.swapType === 'partial' ? swapData.endTime : '09:00'
        });
      }
      return null;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shifts'] });
      setShowSwapModal(false);
      toast.success('בקשת ההחלפה נשלחה בהצלחה');
    },
    onError: () => {
      toast.error('שגיאה בשליחת הבקשה');
    }
  });

  // --- THE BRAIN: Logic for calculating Partial vs Full Coverage ---
  const offerCoverMutation = useMutation({
    mutationFn: async ({ shift, coverData }) => {
      // 1. Create a coverage record
      await base44.entities.ShiftCoverage.create({
        shift_id: shift.id,
        covering_person: currentUser?.full_name || currentUser?.email,
        covering_email: currentUser?.email,
        covering_role: coverData.role || currentUser?.assigned_role, // Ensure role comes from modal
        covering_department: coverData.department || currentUser?.department,
        start_date: coverData.startDate,
        start_time: coverData.startTime,
        end_date: coverData.endDate,
        end_time: coverData.endTime,
        status: 'approved'
      });

      // 2. Fetch all coverages for this shift to recalculate status
      const allCoverages = await base44.entities.ShiftCoverage.filter({ shift_id: shift.id });

      // 3. Sort coverages by start time
      const sortedCoverages = allCoverages.sort((a, b) => {
        const aTime = new Date(`${a.start_date}T${a.start_time}:00`);
        const bTime = new Date(`${b.start_date}T${b.start_time}:00`);
        return aTime - bTime;
      });

      // 4. Calculate Total Needed Minutes
      const originalStartTime = shift.swap_start_time || '09:00';
      const originalEndTime = shift.swap_end_time || '09:00';
      const requestedStart = new Date(`${shift.date}T${originalStartTime}:00`);
      let requestedEnd = new Date(`${shift.date}T${originalEndTime}:00`);
      
      // Handle next-day logic for the requested slot
      if (requestedEnd <= requestedStart) {
        requestedEnd = addDays(requestedEnd, 1);
      }
      
      const requestedMinutes = (requestedEnd - requestedStart) / (1000 * 60);

      // 5. Calculate Total Covered Minutes
      let totalCoveredMinutes = 0;
      sortedCoverages.forEach(cov => {
        const startDateTime = new Date(`${cov.start_date}T${cov.start_time}:00`);
        let endDateTime = new Date(`${cov.end_date}T${cov.end_time}:00`);
        
        // Safety check for next day in coverage
        if (endDateTime <= startDateTime) {
             endDateTime = addDays(endDateTime, 1);
        }

        const minutes = (endDateTime - startDateTime) / (1000 * 60);
        totalCoveredMinutes += minutes;
      });

      // 6. Determine Status
      // Allow a small buffer (e.g., 5 mins) for calculation errors
      const isFullyCovered = totalCoveredMinutes >= (requestedMinutes - 5);

      const updateData = {
        covering_person: sortedCoverages.map(c => c.covering_person).join(', '),
        covering_email: sortedCoverages.map(c => c.covering_email).join(', '),
        covering_role: sortedCoverages.map(c => c.covering_role).join(', '),
        covered_start_time: sortedCoverages[0]?.start_time,
        covered_end_time: sortedCoverages[sortedCoverages.length - 1]?.end_time
      };

      // Case A: Partial Coverage (Yellow)
      if (!isFullyCovered) {
        updateData.status = 'REQUIRES_PARTIAL_COVERAGE'; // Use our new status
        
        const remainingMinutes = Math.max(0, requestedMinutes - totalCoveredMinutes);
        const remainingHours = Math.floor(remainingMinutes / 60);
        const remainingMins = Math.round(remainingMinutes % 60);
        
        updateData.remaining_hours = remainingMins > 0 
            ? `${remainingHours}:${remainingMins.toString().padStart(2, '0')} שעות` 
            : `${remainingHours} שעות`;
      }

      // Case B: Fully Covered (Green)
      if (isFullyCovered) {
        updateData.status = 'approved';
        updateData.remaining_hours = null;
        updateData.original_assigned_person = shift.assigned_person;
        updateData.original_role = shift.role;
        updateData.assigned_person = sortedCoverages[0]?.covering_person;
        updateData.assigned_email = sortedCoverages[0]?.covering_email;
        updateData.role = sortedCoverages.map(c => c.covering_role).join(' + ');
      }

      return base44.entities.Shift.update(shift.id, updateData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shifts'] });
      queryClient.invalidateQueries({ queryKey: ['shift-coverages'] });
      
      // Close all relevant modals
      setShowAcceptModal(false);
      setShowCoverSegmentModal(false);
      
      toast.success('הכיסוי נקלט בהצלחה!');
    },
    onError: (e) => {
      console.error(e);
      toast.error('שגיאה בשמירת הכיסוי');
    }
  });

  // Approve swap mutation (admin only)
  const approveSwapMutation = useMutation({
    mutationFn: async (shift) => {
      if (currentUser?.user_type !== 'admin') {
        throw new Error('רק מנהלים יכולים לאשר החלפות');
      }

      const updateData = {
        status: 'approved',
        approved_by: currentUser?.full_name || currentUser?.email,
        approved_by_email: currentUser?.email,
        original_assigned_person: shift.assigned_person,
        original_role: shift.role,
        assigned_person: shift.covering_person,
        assigned_email: shift.covering_email,
        role: shift.covering_role,
        department: shift.covering_department
      };

      return base44.entities.Shift.update(shift.id, updateData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shifts'] });
      toast.success('ההחלפה אושרה בהצלחה');
    },
    onError: (error) => {
      toast.error(error.message || 'שגיאה באישור ההחלפה');
    }
  });

  // Delete shift mutation (admin only)
  const deleteShiftMutation = useMutation({
    mutationFn: async (shiftId) => {
      if (currentUser?.user_type !== 'admin') {
        throw new Error('רק מנהלים יכולים למחוק משמרות');
      }
      return base44.entities.Shift.delete(shiftId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shifts'] });
      setShowDetailsModal(false);
      toast.success('השיבוץ נמחק בהצלחה');
    },
    onError: (error) => {
      toast.error(error.message || 'שגיאה במחיקת השיבוץ');
    }
  });

  // Edit role mutation
  const editRoleMutation = useMutation({
    mutationFn: async ({ shift, roleData }) => {
      return base44.entities.Shift.update(shift.id, {
        department: roleData.department,
        role: roleData.role
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shifts'] });
      setShowEditRoleModal(false);
      toast.success('התפקיד עודכן בהצלחה');
    },
    onError: () => {
      toast.error('שגיאה בעדכון התפקיד');
    }
  });

  const handleCellClick = (date, shift) => {
    // Ensure date is a Date object
    const validDate = new Date(date);
    setSelectedDate(validDate);
    setSelectedShift(shift);
    
    // Empty slot - only admin can add
    if (!shift) {
      if (isAdmin) {
        setShowAddModal(true);
      }
      return;
    }

    // Admin can view all shifts
    if (isAdmin) {
      if (shift.status === 'regular') {
        setShowActionModal(true);
      } else {
        setShowDetailsModal(true);
      }
      return;
    }

    // Regular user logic
    const isMyShift = shift.role && currentUser?.assigned_role && 
                      typeof shift.role === 'string' && shift.role.includes(currentUser.assigned_role);

    // Check if swap is requested or active
    const isSwapActive = ['swap_requested', 'partially_covered', 'REQUIRES_FULL_COVERAGE', 'REQUIRES_PARTIAL_COVERAGE'].includes(shift.status);

    if (isMyShift) {
      setShowActionModal(true);
    } else if (isSwapActive) {
      setShowDetailsModal(true);
    }
  };

  const handleKPIClick = (type) => {
    setKPIType(type);
    setShowKPIList(true);
  };

  // --- FIX: Redirect "Offer Cover" to CoverSegmentModal ---
  const handleOfferCover = async (shift) => {
    setSelectedShift(shift);
    
    // Ensure the date is passed correctly
    if (shift.date) {
        setSelectedDate(new Date(shift.date));
    }
    
    // !!! THIS WAS THE BUG !!!
    // Old: setShowAcceptModal(true);
    // New: Open the detailed coverage modal
    setShowCoverSegmentModal(true); 
  };

  const handleOnboardingComplete = () => {
    setShowOnboarding(false);
    base44.auth.me().then(user => setCurrentUser(user));
  };

  const isAdmin = currentUser?.user_type === 'admin';

  return (
    <div 
      className="min-h-screen bg-[#FAFAFA] relative overflow-hidden"
      dir="rtl"
      style={{ fontFamily: 'Heebo, sans-serif' }}
    >
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
          currentUser={currentUser}
          hideNavigation
        />

        <KPIHeader
          shifts={shifts}
          currentUserEmail={currentUser?.email}
          currentUserRole={currentUser?.assigned_role}
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

        {/* Modals */}
        <OnboardingModal
          isOpen={showOnboarding}
          onComplete={handleOnboardingComplete}
        />

        <KPIListModal
          isOpen={showKPIList}
          onClose={() => setShowKPIList(false)}
          type={kpiType}
          shifts={shifts}
          currentUser={currentUser}
          onOfferCover={handleOfferCover}
          onRequestSwap={(shift) => {
            setSelectedShift(shift);
            setSelectedDate(new Date(shift.date));
            setShowKPIList(false);
            setShowSwapModal(true);
          }}
        />

        <AdminSettingsModal
          isOpen={showAdminSettings}
          onClose={() => setShowAdminSettings(false)}
        />

        <SwapRequestModal
          isOpen={showSwapModal}
          onClose={() => setShowSwapModal(false)}
          date={selectedDate}
          shift={selectedShift}
          onSubmit={(swapData) => swapRequestMutation.mutate({ date: selectedDate, swapData })}
          isSubmitting={swapRequestMutation.isPending}
        />

        <PendingRequestsModal
          isOpen={showPendingModal}
          onClose={() => setShowPendingModal(false)}
          requests={shifts}
          onAccept={handleOfferCover}
          isAccepting={false}
          currentUserEmail={currentUser?.email}
        />

        <AddShiftModal
          isOpen={showAddModal}
          onClose={() => setShowAddModal(false)}
          date={selectedDate}
          onSubmit={(shiftData) => addShiftMutation.mutate({ date: selectedDate, shiftData })}
          isSubmitting={addShiftMutation.isPending}
          currentUser={currentUser}
        />

        <AcceptSwapModal
          isOpen={showAcceptModal}
          onClose={() => setShowAcceptModal(false)}
          shift={selectedShift}
          onAccept={(acceptData) => offerCoverMutation.mutate({ shift: selectedShift, coverData: acceptData })}
          isAccepting={offerCoverMutation.isPending}
        />

        <ShiftActionModal
          isOpen={showActionModal}
          onClose={() => setShowActionModal(false)}
          shift={selectedShift}
          date={selectedDate}
          onRequestSwap={() => {
            setShowActionModal(false);
            setShowSwapModal(true);
          }}
          onEditRole={() => {
            setShowActionModal(false);
            setShowEditRoleModal(true);
          }}
          onDelete={deleteShiftMutation.mutate}
          isAdmin={isAdmin}
        />

        <EditRoleModal
          isOpen={showEditRoleModal}
          onClose={() => setShowEditRoleModal(false)}
          date={selectedDate}
          shift={selectedShift}
          onSubmit={(roleData) => editRoleMutation.mutate({ shift: selectedShift, roleData })}
          isSubmitting={editRoleMutation.isPending}
        />

        <ShiftDetailsModal
          isOpen={showDetailsModal}
          onClose={() => setShowDetailsModal(false)}
          shift={selectedShift}
          date={selectedDate}
          onCoverSegment={(shift) => {
            handleOfferCover(shift);
          }}
          onOfferCover={handleOfferCover} // Calls our fixed handler
          onDelete={deleteShiftMutation.mutate}
          onApprove={() => approveSwapMutation.mutate(selectedShift)}
          currentUserEmail={currentUser?.email}
          isAdmin={isAdmin}
        />

        {/* This modal now uses the SMART logic from offerCoverMutation */}
        <CoverSegmentModal
          isOpen={showCoverSegmentModal}
          onClose={() => setShowCoverSegmentModal(false)}
          shift={selectedShift}
          date={selectedDate}
          onSubmit={(segmentData) => offerCoverMutation.mutate({ shift: selectedShift, coverData: segmentData })}
          isSubmitting={offerCoverMutation.isPending}
        />
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Heebo:wght@300;400;500;600;700&display=swap');
      `}</style>
    </div>
  );
}