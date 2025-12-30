import React, { useRef } from 'react';
import { Button } from "@/components/ui/button";
import { ChevronRight, ChevronLeft, Calendar, List, CheckCircle } from 'lucide-react';
import { format, addMonths, subMonths, addWeeks, subWeeks } from 'date-fns';
import { he } from 'date-fns/locale';
import { motion } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

export default function CalendarHeader({ 
  currentDate, 
  setCurrentDate, 
  viewMode, 
  setViewMode,
  isAdmin,
  onOpenAdminSettings,
  currentUser,
  hideHeader = false,
  hideNavigation = false
}) {
  const fileInputRef = useRef(null);
  const queryClient = useQueryClient();

  // שמרתי את הלוגיקה של הלוגו ברקע למקרה שתצטרך אותה בעתיד, למרות שהיא לא מוצגת כרגע
  const { data: appSettings = [] } = useQuery({
    queryKey: ['app-settings'],
    queryFn: () => base44.entities.AppSettings.list(),
  });

  const updateLogoMutation = useMutation({
    mutationFn: async (url) => {
      const existing = appSettings.find(s => s.setting_key === 'logo');
      if (existing) {
        return base44.entities.AppSettings.update(existing.id, { logo_url: url });
      } else {
        return base44.entities.AppSettings.create({ setting_key: 'logo', logo_url: url });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['app-settings'] });
    }
  });

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

  // פונקציות עזר לכפתורים החדשים
  const handleComingSoon = (featureName) => {
    toast.info(`פיצ'ר ${featureName} יהיה זמין בקרוב!`, {
        icon: <CheckCircle className="w-4 h-4 text-blue-500" />,
        duration: 2000
    });
  };

  return (
    <div className="relative z-50 mb-6">
      
      {/* --- פס עליון סטיקי ומעוצב --- */}
      {!hideHeader && (
        <motion.div 
            initial={{ y: -50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="sticky top-0 z-50 bg-white/95 backdrop-blur-md shadow-sm border-b border-gray-200 px-6 py-3 flex items-center justify-between rounded-b-2xl mx-[-1rem] mt-[-1.5rem] mb-6"
        >
            {/* צד ימין: שלום למשתמש */}
            <div className="flex flex-col">
                <span className="text-gray-500 text-xs font-medium">ברוך הבא,</span>
                <span className="text-gray-800 font-bold text-lg leading-tight">
                    {currentUser?.assigned_role || currentUser?.full_name || 'אורח'}
                </span>
            </div>

            {/* צד שמאל: אייקונים וכפתורים */}
            <div className="flex items-center gap-4">
                
                {/* 1. היכל התהילה */}
                <button 
                    onClick={() => handleComingSoon('היכל התהילה')}
                    className="group relative flex flex-col items-center justify-center p-2 rounded-xl hover:bg-gray-50 transition-all duration-200"
                    title="היכל התהילה"
                >
                    <img 
                        src="https://cdn-icons-png.flaticon.com/128/1021/1021202.png" 
                        alt="Hall of Fame" 
                        className="w-6 h-6 object-contain group-hover:scale-110 transition-transform"
                    />
                </button>

                {/* 2. הדרכה ועזרה */}
                <button 
                    onClick={() => handleComingSoon('הדרכה ועזרה')}
                    className="group relative flex flex-col items-center justify-center p-2 rounded-xl hover:bg-gray-50 transition-all duration-200"
                    title="הדרכה ועזרה"
                >
                    <img 
                        src="https://cdn-icons-png.flaticon.com/128/189/189665.png" 
                        alt="Help" 
                        className="w-6 h-6 object-contain group-hover:scale-110 transition-transform"
                    />
                </button>

                {/* 3. לוח ניהול (רק למנהלים) */}
                {isAdmin && (
                    <button 
                        onClick={onOpenAdminSettings}
                        className="group relative flex flex-col items-center justify-center p-2 rounded-xl hover:bg-blue-50 transition-all duration-200 border border-transparent hover:border-blue-100"
                        title="לוח ניהול"
                    >
                        <img 
                            src="https://cdn-icons-png.flaticon.com/128/2965/2965279.png" 
                            alt="Admin Panel" 
                            className="w-6 h-6 object-contain group-hover:scale-110 transition-transform"
                        />
                    </button>
                )}
            </div>
        </motion.div>
      )}

      {/* --- סרגל ניווט תאריכים (נשאר למטה) --- */}
      {!hideNavigation && (
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
      )}
    </div>
  );
}