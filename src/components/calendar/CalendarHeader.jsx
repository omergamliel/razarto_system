import React, { useRef } from 'react';
import { Button } from "@/components/ui/button";
import { ChevronRight, ChevronLeft, Calendar, List, Settings, Upload, CheckCircle, Info } from 'lucide-react';
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

  // --- לוגיקה של לוגו (נשמר ברקע לשימוש עתידי או למקומות אחרים) ---
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

  // --- ניווט בתאריכים ---
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

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      updateLogoMutation.mutate(file_url);
      toast.success('הלוגו עודכן בהצלחה');
    } catch (error) {
      toast.error('שגיאה בהעלאת הלוגו');
    }
  };

  // --- פונקציה לכפתורים שעדיין לא פותחו ---
  const handleComingSoon = (featureName) => {
    toast.info(`פיצ'ר ${featureName} יהיה זמין בקרוב!`, {
        icon: <Info className="w-4 h-4 text-blue-500" />,
        duration: 2000,
        style: { direction: 'rtl', fontFamily: 'Heebo' }
    });
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative z-50 mb-6"
    >
      {!hideHeader && (
        // --- הבר העליון הסטיקי החדש ---
        // שים לב: -mx-4 ו-mt-6 נועדו "למתוח" את הבר לצדדים כדי שייראה כמו Header אמיתי
        <div className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-gray-200 shadow-sm px-6 py-3 rounded-2xl mb-6 flex items-center justify-between transition-all">
            
            {/* צד ימין: שלום למשתמש */}
            <div className="flex flex-col items-start">
                <span className="text-gray-500 text-xs font-medium">ברוך הבא,</span>
                <span className="text-gray-900 font-bold text-lg leading-tight">
                    {currentUser?.assigned_role || currentUser?.full_name || currentUser?.email || 'אורח'}
                </span>
            </div>

            {/* צד שמאל: שורת האייקונים */}
            <div className="flex items-center gap-3">
                
                {/* 1. היכל התהילה */}
                <button 
                    onClick={() => handleComingSoon('היכל התהילה')}
                    className="group relative p-2 rounded-xl hover:bg-gray-100 transition-all duration-200"
                    title="היכל התהילה"
                >
                    <img 
                        src="https://cdn-icons-png.flaticon.com/128/1021/1021202.png" 
                        alt="Hall of Fame" 
                        className="w-7 h-7 object-contain group-hover:scale-110 transition-transform"
                    />
                </button>

                {/* 2. הדרכה ועזרה */}
                <button 
                    onClick={() => handleComingSoon('הדרכה ועזרה')}
                    className="group relative p-2 rounded-xl hover:bg-gray-100 transition-all duration-200"
                    title="הדרכה ועזרה"
                >
                    <img 
                        src="https://cdn-icons-png.flaticon.com/128/189/189665.png" 
                        alt="Help" 
                        className="w-7 h-7 object-contain group-hover:scale-110 transition-transform"
                    />
                </button>

                {/* 3. לוח ניהול (רק למנהלים) */}
                {isAdmin && (
                    <button 
                        onClick={onOpenAdminSettings}
                        className="group relative p-2 rounded-xl hover:bg-blue-50 border border-transparent hover:border-blue-100 transition-all duration-200"
                        title="לוח ניהול"
                    >
                        <img 
                            src="https://cdn-icons-png.flaticon.com/128/2965/2965279.png" 
                            alt="Admin Panel" 
                            className="w-7 h-7 object-contain group-hover:scale-110 transition-transform"
                        />
                        {/* אינדיקטור קטן למנהל */}
                        <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full border border-white"></span>
                    </button>
                )}
            </div>
        </div>
      )}

      {/* --- סרגל הניווט התחתון (חודשי/שבועי) - נשאר ללא שינוי --- */}
      {!hideNavigation && (
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-sm border border-gray-100 p-4">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          
          {/* כפתורי תצוגה */}
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

          {/* חיצים וכותרת תאריך */}
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
    </motion.div>
  );
}