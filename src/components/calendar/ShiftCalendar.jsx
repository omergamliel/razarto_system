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

export default function ShiftCalendar() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState('month');
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedShift, setSelectedShift] = useState(null);
  const [showSwapModal, setShowSwapModal] = useState(false);
  const [showPendingModal, setShowPendingModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showAcceptModal, setShowAcceptModal] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);

  const queryClient = useQueryClient();

  // Fetch current user
  useEffect(() => {
    const fetchUser = async () => {
      const user = await base44.auth.me();
      setCurrentUser(user);
    };
    fetchUser();
  }, []);

  // Fetch shifts
  const { data: shifts = [], isLoading } = useQuery({
    queryKey: ['shifts'],
    queryFn: () => base44.entities.Shift.list(),
  });

  // Add shift mutation
  const addShiftMutation = useMutation({
    mutationFn: async ({ date, shiftData }) => {
      return base44.entities.Shift.create({
        date: format(date, 'yyyy-MM-dd'),
        department: shiftData.department,
        role: shiftData.role,
        assigned_person: currentUser?.full_name || currentUser?.email,
        assigned_email: currentUser?.email,
        status: 'regular'
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shifts'] });
      setShowAddModal(false);
      toast.success('המשמרת נוספה בהצלחה');
    },
    onError: () => {
      toast.error('שגיאה בהוספת המשמרת');
    }
  });

  // Create/Update shift mutation
  const swapRequestMutation = useMutation({
    mutationFn: async ({ date, swapData }) => {
      const existingShift = shifts.find(s => s.date === format(date, 'yyyy-MM-dd'));
      
      if (existingShift) {
        return base44.entities.Shift.update(existingShift.id, {
          status: 'swap_requested',
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

  // Accept swap mutation
  const acceptSwapMutation = useMutation({
    mutationFn: async ({ shift, acceptData }) => {
      const updateData = {
        confirmed_by: currentUser?.full_name || currentUser?.email,
        confirmed_by_email: currentUser?.email
      };

      if (acceptData.coverFull) {
        // Full coverage
        updateData.status = 'swap_confirmed';
      } else {
        // Partial coverage - calculate gap
        const requestedStart = shift.swap_type === 'full' ? '09:00' : shift.swap_start_time;
        const requestedEnd = shift.swap_type === 'full' ? '09:00 (למחרת)' : shift.swap_end_time;
        
        updateData.status = 'partially_covered';
        updateData.covered_start_time = acceptData.startTime;
        updateData.covered_end_time = acceptData.endTime;
        
        // Simple gap description
        if (acceptData.startTime !== requestedStart || acceptData.endTime !== requestedEnd) {
          updateData.gap_hours = `${requestedStart}-${acceptData.startTime}, ${acceptData.endTime}-${requestedEnd}`;
        }
      }

      return base44.entities.Shift.update(shift.id, updateData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shifts'] });
      setShowAcceptModal(false);
      toast.success('ההחלפה אושרה בהצלחה');
    },
    onError: () => {
      toast.error('שגיאה באישור ההחלפה');
    }
  });

  const handleCellClick = (date, shift) => {
    setSelectedDate(date);
    setSelectedShift(shift);
    
    if (!shift) {
      // Empty cell - show add modal
      setShowAddModal(true);
    } else if (shift.status === 'regular' && shift.assigned_email === currentUser?.email) {
      // Own shift - request swap
      setShowSwapModal(true);
    } else if (shift.status === 'swap_requested' && shift.assigned_email !== currentUser?.email) {
      // Someone else's swap request - show accept modal
      setShowAcceptModal(true);
    }
  };

  const handleAddShift = (shiftData) => {
    addShiftMutation.mutate({
      date: selectedDate,
      shiftData
    });
  };

  const handleSwapSubmit = (swapData) => {
    swapRequestMutation.mutate({
      date: selectedDate,
      swapData
    });
  };

  const handleAcceptSwap = (acceptData) => {
    acceptSwapMutation.mutate({
      shift: selectedShift,
      acceptData
    });
  };

  const handleAcceptFromList = (shift) => {
    setSelectedShift(shift);
    setShowPendingModal(false);
    setShowAcceptModal(true);
  };

  const pendingCount = shifts.filter(
    s => s.status === 'swap_requested' && s.assigned_email !== currentUser?.email
  ).length;

  return (
    <div 
      className="min-h-screen bg-[#FAFAFA] relative overflow-hidden"
      dir="rtl"
      style={{ fontFamily: 'Heebo, sans-serif' }}
    >
      <BackgroundShapes />
      
      <div className="relative z-10 max-w-7xl mx-auto px-4 py-6 md:py-8">
        <CalendarHeader
          currentDate={currentDate}
          setCurrentDate={setCurrentDate}
          viewMode={viewMode}
          setViewMode={setViewMode}
          onOpenPendingRequests={() => setShowPendingModal(true)}
          pendingCount={pendingCount}
        />

        <CalendarGrid
          currentDate={currentDate}
          viewMode={viewMode}
          shifts={shifts}
          onCellClick={handleCellClick}
        />

        <SwapRequestModal
          isOpen={showSwapModal}
          onClose={() => setShowSwapModal(false)}
          date={selectedDate}
          shift={selectedShift}
          onSubmit={handleSwapSubmit}
          isSubmitting={swapRequestMutation.isPending}
        />

        <PendingRequestsModal
          isOpen={showPendingModal}
          onClose={() => setShowPendingModal(false)}
          requests={shifts}
          onAccept={handleAcceptFromList}
          isAccepting={false}
          currentUserEmail={currentUser?.email}
        />

        <AddShiftModal
          isOpen={showAddModal}
          onClose={() => setShowAddModal(false)}
          date={selectedDate}
          onSubmit={handleAddShift}
          isSubmitting={addShiftMutation.isPending}
          currentUser={currentUser}
        />

        <AcceptSwapModal
          isOpen={showAcceptModal}
          onClose={() => setShowAcceptModal(false)}
          shift={selectedShift}
          onAccept={handleAcceptSwap}
          isAccepting={acceptSwapMutation.isPending}
        />
      </div>

      {/* Google Font Import */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Heebo:wght@300;400;500;600;700&display=swap');
      `}</style>
    </div>
  );
}