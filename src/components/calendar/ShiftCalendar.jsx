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

export default function ShiftCalendar() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState('month');
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedShift, setSelectedShift] = useState(null);
  const [showSwapModal, setShowSwapModal] = useState(false);
  const [showPendingModal, setShowPendingModal] = useState(false);
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
          swap_end_time: swapData.endTime,
          swap_reason: swapData.reason
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
    mutationFn: async (shift) => {
      return base44.entities.Shift.update(shift.id, {
        status: 'swap_confirmed',
        confirmed_by: currentUser?.full_name || currentUser?.email,
        confirmed_by_email: currentUser?.email
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shifts'] });
      toast.success('ההחלפה אושרה בהצלחה');
    },
    onError: () => {
      toast.error('שגיאה באישור ההחלפה');
    }
  });

  const handleCellClick = (date, shift) => {
    setSelectedDate(date);
    setSelectedShift(shift);
    if (shift && shift.status === 'regular') {
      setShowSwapModal(true);
    } else if (shift) {
      setShowSwapModal(true);
    }
  };

  const handleSwapSubmit = (swapData) => {
    swapRequestMutation.mutate({
      date: selectedDate,
      swapData
    });
  };

  const handleAcceptSwap = (shift) => {
    acceptSwapMutation.mutate(shift);
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
          onAccept={handleAcceptSwap}
          isAccepting={acceptSwapMutation.isPending ? acceptSwapMutation.variables?.id : null}
          currentUserEmail={currentUser?.email}
        />
      </div>

      {/* Google Font Import */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Heebo:wght@300;400;500;600;700&display=swap');
      `}</style>
    </div>
  );
}