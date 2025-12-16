import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { format } from 'date-fns';
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
import PendingApprovalModal from './PendingApprovalModal';
import SeedRolesData from '../admin/SeedRolesData';

export default function ShiftCalendar() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState('month');
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedShift, setSelectedShift] = useState(null);
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
            status: swapData.swapType === 'partial' ? 'partially_covered' : 'swap_requested',
            swap_request_by: currentUser?.email,
            swap_type: swapData.swapType,
            swap_start_time: swapData.startTime,
            swap_end_time: swapData.endTime
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

  // Offer to cover mutation (multi-user partial support)
  const offerCoverMutation = useMutation({
    mutationFn: async ({ shift, coverData }) => {
      // Create a coverage record
      await base44.entities.ShiftCoverage.create({
        shift_id: shift.id,
        covering_person: currentUser?.full_name || currentUser?.email,
        covering_email: currentUser?.email,
        covering_role: currentUser?.assigned_role,
        covering_department: currentUser?.department,
        start_date: coverData.startDate || coverData.coverDate || shift.date,
        start_time: coverData.startTime,
        end_date: coverData.endDate || coverData.coverDate || shift.date,
        end_time: coverData.endTime,
        status: 'approved'
      });

      // Fetch all coverages for this shift
      const allCoverages = await base44.entities.ShiftCoverage.filter({ shift_id: shift.id });
      
      // Calculate total covered hours
      let totalCoveredMinutes = 0;
      allCoverages.forEach(cov => {
        const startDateTime = new Date(`${cov.start_date}T${cov.start_time}:00`);
        const endDateTime = new Date(`${cov.end_date}T${cov.end_time}:00`);
        const minutes = (endDateTime - startDateTime) / (1000 * 60);
        totalCoveredMinutes += minutes;
      });
      
      const totalCoveredHours = totalCoveredMinutes / 60;
      const isFullyCovered = totalCoveredHours >= 24;

      const updateData = {
        status: isFullyCovered ? 'approved' : 'partially_covered',
        covering_person: allCoverages.map(c => c.covering_person).join(', '),
        covering_email: allCoverages.map(c => c.covering_email).join(', '),
        covered_start_time: allCoverages[0]?.start_time,
        covered_end_time: allCoverages[allCoverages.length - 1]?.end_time
      };

      if (isFullyCovered) {
        // Save original assignment before replacing
        updateData.original_assigned_person = shift.assigned_person;
        updateData.original_role = shift.role;
        // Replace with first covering person for display
        updateData.assigned_person = allCoverages[0]?.covering_person;
        updateData.assigned_email = allCoverages[0]?.covering_email;
        updateData.role = allCoverages[0]?.covering_role;
      }

      return base44.entities.Shift.update(shift.id, updateData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shifts'] });
      queryClient.invalidateQueries({ queryKey: ['shift-coverages'] });
      setShowAcceptModal(false);
      toast.success('הכיסוי נוסף בהצלחה!');
    },
    onError: () => {
      toast.error('שגיאה בהוספת הכיסוי');
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
        // Save original assignment before replacing
        original_assigned_person: shift.assigned_person,
        original_role: shift.role,
        // Replace original assignment with covering person
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

  // Cover segment mutation
  const coverSegmentMutation = useMutation({
    mutationFn: async ({ shift, segmentData }) => {
      return base44.entities.ShiftSegment.create({
        shift_id: shift.id,
        date: shift.date,
        start_time: segmentData.startTime,
        end_time: segmentData.endTime,
        assigned_person: currentUser?.full_name || currentUser?.email,
        assigned_email: currentUser?.email,
        department: segmentData.department,
        role: segmentData.role
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shifts'] });
      queryClient.invalidateQueries({ queryKey: ['shift-segments'] });
      setShowCoverSegmentModal(false);
      toast.success('המקטע נוסף בהצלחה');
    },
    onError: () => {
      toast.error('שגיאה בכיסוי המקטע');
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
    setSelectedDate(date);
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

    // Allow clicking on: my shifts, swap requests, or partial coverage
    const isSwapRequested = shift.status === 'swap_requested';
    const isPartiallyCovered = shift.status === 'partially_covered';

    if (isMyShift) {
      setShowActionModal(true);
    } else if (isSwapRequested || isPartiallyCovered) {
      setShowDetailsModal(true);
    }
  };

  const handleKPIClick = (type) => {
    setKPIType(type);
    setShowKPIList(true);
  };

  const handleOfferCover = async (shift) => {
    setSelectedShift(shift);
    setShowAcceptModal(true);
  };

  const handleOnboardingComplete = () => {
    setShowOnboarding(false);
    // Refresh user
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
          existingCoverages={selectedShift ? queryClient.getQueryData(['shift-coverages', selectedShift.id]) || [] : []}
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
            setSelectedShift(shift);
            setShowCoverSegmentModal(true);
          }}
          onOfferCover={(shift) => {
            setSelectedShift(shift);
            setShowDetailsModal(false);
            setShowAcceptModal(true);
          }}
          onDelete={deleteShiftMutation.mutate}
          onApprove={() => approveSwapMutation.mutate(selectedShift)}
          currentUserEmail={currentUser?.email}
          isAdmin={isAdmin}
        />

        <CoverSegmentModal
          isOpen={showCoverSegmentModal}
          onClose={() => setShowCoverSegmentModal(false)}
          shift={selectedShift}
          date={selectedDate}
          onSubmit={(segmentData) => coverSegmentMutation.mutate({ shift: selectedShift, segmentData })}
          isSubmitting={coverSegmentMutation.isPending}
        />
      </div>

      {/* Google Font Import */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Heebo:wght@300;400;500;600;700&display=swap');
      `}</style>
    </div>
  );
}