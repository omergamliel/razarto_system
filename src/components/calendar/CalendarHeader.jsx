import React from 'react';
import { Button } from "@/components/ui/button";
import { ChevronRight, ChevronLeft, Calendar, List } from 'lucide-react';
import { format, addMonths, subMonths, addWeeks, subWeeks } from 'date-fns';
import { he } from 'date-fns/locale';
import { motion } from 'framer-motion';

export default function CalendarHeader({ 
  currentDate, 
  setCurrentDate, 
  viewMode, 
  setViewMode,
  onOpenPendingRequests,
  pendingCount
}) {
  const navigatePrev = () => {
    if (viewMode === 'month') {
      setCurrentDate(subMonths(currentDate, 1));
    } else {
      setCurrentDate(subWeeks(currentDate, 1));
    }
  };

  const navigateNext = () => {
    if (viewMode === 'month') {
      setCurrentDate(addMonths(currentDate, 1));
    } else {
      setCurrentDate(addWeeks(currentDate, 1));
    }
  };

  const formatTitle = () => {
    if (viewMode === 'month') {
      return format(currentDate, 'MMMM yyyy', { locale: he });
    } else {
      return `שבוע ${format(currentDate, 'w', { locale: he })} - ${format(currentDate, 'MMMM yyyy', { locale: he })}`;
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative z-10 mb-6"
    >
      {/* Logo and Title */}
      <div className="flex flex-col items-center mb-6 pt-2">
        <h1 className="text-4xl md:text-5xl font-extrabold text-gray-800 tracking-wider mb-2" style={{ letterSpacing: '0.15em' }}>
          Razarto
        </h1>
        <p className="text-gray-600 text-base md:text-lg font-medium">
          מערכת לניהול משמרות רז"ר תורן
        </p>
        <p className="text-gray-400 text-sm mt-1">
          צפייה במשמרות | ביצוע החלפות מסודרות
        </p>
      </div>

      {/* Controls Bar */}
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-sm border border-gray-100 p-4">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          {/* View Toggle */}
          <div className="flex items-center bg-gray-100 rounded-xl p-1">
            <button
              onClick={() => setViewMode('month')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                viewMode === 'month' 
                  ? 'bg-white text-gray-800 shadow-sm' 
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <Calendar className="w-4 h-4" />
              חודשי
            </button>
            <button
              onClick={() => setViewMode('week')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                viewMode === 'week' 
                  ? 'bg-white text-gray-800 shadow-sm' 
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <List className="w-4 h-4" />
              שבועי
            </button>
          </div>

          {/* Navigation */}
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={navigateNext}
              className="rounded-xl hover:bg-gray-100"
            >
              <ChevronRight className="w-5 h-5" />
            </Button>
            
            <h2 className="text-lg md:text-xl font-semibold text-gray-800 min-w-[200px] text-center">
              {formatTitle()}
            </h2>
            
            <Button
              variant="ghost"
              size="icon"
              onClick={navigatePrev}
              className="rounded-xl hover:bg-gray-100"
            >
              <ChevronLeft className="w-5 h-5" />
            </Button>
          </div>

          {/* Pending Requests Button */}
          <Button
            onClick={onOpenPendingRequests}
            className="relative bg-gradient-to-r from-[#E57373] to-[#EF5350] hover:from-[#EF5350] hover:to-[#E53935] text-white rounded-xl shadow-md hover:shadow-lg transition-all"
          >
            בקשות ממתינות
            {pendingCount > 0 && (
              <span className="absolute -top-2 -left-2 bg-white text-[#E57373] text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center shadow-sm">
                {pendingCount}
              </span>
            )}
          </Button>
        </div>
      </div>
    </motion.div>
  );
}