import React from 'react';
import { Button } from "@/components/ui/button";
import { ChevronRight, ChevronLeft, Calendar, List, Settings } from 'lucide-react';
import { format, addMonths, subMonths, addWeeks, subWeeks } from 'date-fns';
import { he } from 'date-fns/locale';
import { motion } from 'framer-motion';

export default function CalendarHeader({ 
  currentDate, 
  setCurrentDate, 
  viewMode, 
  setViewMode,
  isAdmin,
  onOpenAdminSettings
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
      <div className="flex items-center justify-between mb-6 pt-2">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-gradient-to-br from-[#E57373] to-[#EF5350] rounded-xl shadow-lg flex items-center justify-center">
            <div className="text-white text-xs font-bold text-center leading-tight">
              חטיבת<br/>מבצעים
            </div>
          </div>
          <div>
            <h1 className="text-3xl md:text-4xl font-extrabold text-gray-800 tracking-wider" style={{ letterSpacing: '0.15em' }}>
              Razarto
            </h1>
            <p className="text-gray-600 text-sm md:text-base font-medium">
              מערכת לניהול משמרות רז"ר תורן
            </p>
          </div>
        </div>
        {isAdmin && (
          <Button
            onClick={onOpenAdminSettings}
            variant="outline"
            className="rounded-xl border-2 border-gray-300 hover:border-gray-400"
          >
            <Settings className="w-5 h-5 text-gray-600" />
          </Button>
        )}
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


        </div>
      </div>
    </motion.div>
  );
}