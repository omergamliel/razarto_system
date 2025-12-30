import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Trophy, Medal, TrendingUp } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';

export default function HallOfFameModal({ isOpen, onClose }) {
  
  // 1. שליפת כל הכיסויים מהדאטה-בייס
  const { data: allCoverages = [], isLoading } = useQuery({
    queryKey: ['all-coverages-hof'],
    queryFn: () => base44.entities.ShiftCoverage.list(),
    enabled: isOpen
  });

  // 2. עיבוד הנתונים לדירוג
  const topSwappers = React.useMemo(() => {
    if (!allCoverages || allCoverages.length === 0) return [];

    const stats = {};

    allCoverages.forEach(coverage => {
      const email = coverage.covering_email;
      if (!email) return;

      if (!stats[email]) {
        stats[email] = {
          name: coverage.covering_role || 'משתמש לא ידוע', 
          swaps: 0,
          email: email
        };
      }
      stats[email].swaps += 1;
    });

    return Object.values(stats)
      .sort((a, b) => b.swaps - a.swaps)
      .slice(0, 3)
      .map((user, index) => ({
        ...user,
        rank: index + 1,
        avatar: index === 0 ? '🏆' : index === 1 ? '🥈' : '🥉'
      }));
  }, [allCoverages]);

  if (!isOpen) return null;

  const getRankBadge = (rank) => {
    const badges = {
      1: { bg: 'from-yellow-400 to-yellow-500', icon: Trophy },
      2: { bg: 'from-gray-300 to-gray-400', icon: Medal },
      3: { bg: 'from-orange-400 to-orange-500', icon: Medal }
    };
    return badges[rank] || badges[3];
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[60] flex items-center justify-center p-4" dir="rtl">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        />

        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          // שינוי כאן: הגבלת גובה ושימוש ב-flex-col לגלילה פנימית
          className="relative bg-white rounded-3xl shadow-2xl w-full max-w-xl max-h-[85vh] flex flex-col overflow-hidden"
        >
          {/* Header - Fixed at top */}
          <div className="bg-gradient-to-r from-yellow-400 via-yellow-500 to-amber-500 p-5 md:p-6 text-white relative shrink-0">
            <div className="absolute inset-0 opacity-20 pointer-events-none">
              <div className="absolute top-10 right-10 animate-pulse">⭐</div>
              <div className="absolute bottom-10 left-10 animate-pulse delay-100">✨</div>
              <div className="absolute top-20 left-20 animate-pulse delay-200">🌟</div>
            </div>
            
            <button
              onClick={onClose}
              className="absolute top-4 left-4 p-2 rounded-full hover:bg-white/20 transition-colors z-10"
            >
              <X className="w-5 h-5" />
            </button>
            
            <div className="flex items-center gap-3 relative z-10">
              <div className="p-2.5 md:p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                <Trophy className="w-6 h-6 md:w-7 md:h-7" />
              </div>
              <div>
                <h2 className="text-2xl md:text-3xl font-bold mb-0.5">היכל התהילה 🏆</h2>
                <p className="text-white/90 text-xs md:text-sm">המחליפים המובילים בכל הזמנים</p>
              </div>
            </div>
          </div>

          {/* Content - Scrollable area */}
          <div className="p-5 md:p-6 overflow-y-auto">
            
            {isLoading ? (
                <div className="text-center py-10 text-gray-500">טוען נתונים...</div>
            ) : topSwappers.length === 0 ? (
                <div className="text-center py-10 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                    <p className="text-gray-500 text-lg font-medium">טרם בוצעו החלפות במערכת</p>
                    <p className="text-gray-400 text-sm">היה הראשון להחליף והופיע כאן! 🥇</p>
                </div>
            ) : (
                <div className="space-y-3 md:space-y-4 mb-6">
                {topSwappers.map((swapper, index) => {
                    const badge = getRankBadge(swapper.rank);
                    const BadgeIcon = badge.icon;
                    
                    return (
                    <motion.div
                        key={swapper.email}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className={`
                        relative rounded-2xl p-4 md:p-5 border-2 transition-all hover:shadow-lg
                        ${swapper.rank === 1 ? 'bg-gradient-to-br from-yellow-50 to-amber-50 border-yellow-300' : ''}
                        ${swapper.rank === 2 ? 'bg-gradient-to-br from-gray-50 to-slate-50 border-gray-300' : ''}
                        ${swapper.rank === 3 ? 'bg-gradient-to-br from-orange-50 to-amber-50 border-orange-300' : ''}
                        `}
                    >
                        {/* Rank Badge */}
                        <div className={`absolute -top-3 -right-3 w-8 h-8 md:w-10 md:h-10 rounded-full bg-gradient-to-br ${badge.bg} flex items-center justify-center shadow-lg`}>
                            <span className="text-white font-bold text-sm md:text-lg">#{swapper.rank}</span>
                        </div>

                        <div className="flex items-center gap-3 md:gap-4">
                            {/* Avatar */}
                            <div className="text-4xl md:text-5xl">{swapper.avatar}</div>
                            
                            {/* Info */}
                            <div className="flex-1 min-w-0"> {/* min-w-0 helps truncate text if needed */}
                                <h3 className="text-lg md:text-xl font-bold text-gray-800 mb-1 truncate">
                                    {swapper.name}
                                </h3>
                                
                                <div className="flex items-center gap-1 md:gap-2 text-sm">
                                    <TrendingUp className="w-4 h-4 text-green-600 shrink-0" />
                                    <span className="font-semibold text-gray-700">{swapper.swaps} החלפות</span>
                                </div>
                            </div>

                            {/* Icon */}
                            <div className={`p-2 md:p-3 bg-gradient-to-br ${badge.bg} rounded-xl shrink-0`}>
                                <BadgeIcon className="w-5 h-5 md:w-6 md:h-6 text-white" />
                            </div>
                        </div>
                    </motion.div>
                    );
                })}
                </div>
            )}

            {/* Info Box */}
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-4">
              <p className="text-xs md:text-sm text-blue-800">
                <span className="font-bold">💡 טיפ:</span> ככל שתעזור יותר לאחרים בהחלפות, כך תעלה בדירוג! 
                הנתונים מתעדכנים בזמן אמת.
              </p>
            </div>

            {/* Footer Button (Inside scrollable area, at bottom) */}
            <Button
              onClick={onClose}
              variant="outline"
              className="w-full h-12 rounded-xl border-2"
            >
              סגור
            </Button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}