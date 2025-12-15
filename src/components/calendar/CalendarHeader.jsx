import React, { useRef, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { ChevronRight, ChevronLeft, Calendar, List, Settings, Upload, CheckCircle } from 'lucide-react';
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

  // Fetch logo from DB
  const { data: appSettings = [] } = useQuery({
    queryKey: ['app-settings'],
    queryFn: () => base44.entities.AppSettings.list(),
  });

  const logoUrl = appSettings.find(s => s.setting_key === 'logo')?.logo_url || '';

  // Update logo mutation
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

  const handleLogoClick = () => {
    if (isAdmin) {
      fileInputRef.current?.click();
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

  return (
    <motion.div 
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative z-10 mb-6"
    >
      {!hideHeader && (
      <div className="flex items-start justify-between mb-6 pt-2">
        {/* Logo - Right */}
        <div>
          {isAdmin && (
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileUpload}
              className="hidden"
            />
          )}
          <motion.div
            whileHover={isAdmin ? { scale: 1.05 } : {}}
            whileTap={isAdmin ? { scale: 0.95 } : {}}
            onClick={isAdmin ? handleLogoClick : undefined}
            className={`w-16 h-16 bg-gradient-to-br from-[#E57373] to-[#EF5350] rounded-xl shadow-lg flex items-center justify-center overflow-hidden relative ${isAdmin ? 'cursor-pointer group' : ''}`}
          >
            {logoUrl ? (
              <img src={logoUrl} alt="לוגו" className="w-full h-full object-cover" />
            ) : (
              <div className="text-white text-xs font-bold text-center leading-tight">
                חטיבת<br/>מבצעים
              </div>
            )}
            {isAdmin && (
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <Upload className="w-6 h-6 text-white" />
              </div>
            )}
          </motion.div>
        </div>

        {/* Center - Title */}
        <div className="flex-1 text-center">
          <h1 className="text-3xl md:text-4xl font-extrabold text-gray-800 tracking-wider mb-1" style={{ letterSpacing: '0.15em' }}>
            Razarto
          </h1>
          <p className="text-gray-600 text-sm md:text-base font-medium">
            מערכת לניהול משמרות
          </p>
          <p className="text-gray-400 text-xs md:text-sm mt-0.5">
            צפייה במשמרות | ביצוע החלפות מסודרות
          </p>
        </div>

        {/* Left - User Info & Settings */}
        <div className="flex flex-col items-start gap-2">
          {currentUser && (
            <div className="text-left">
              <p className="font-semibold text-gray-800 text-sm">
                שלום, {currentUser.full_name || currentUser.email}
              </p>
              {currentUser.assigned_role && (
                <p className="text-xs text-gray-500">
                  תפקידך: {currentUser.assigned_role}
                </p>
              )}
            </div>
          )}
          {isAdmin && (
            <Button
              onClick={onOpenAdminSettings}
              variant="outline"
              size="sm"
              className="rounded-xl border-2"
            >
              <Settings className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>
      )}

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
    </motion.div>
  );
}