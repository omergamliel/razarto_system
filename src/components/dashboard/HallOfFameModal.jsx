import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Trophy, Medal, Star, TrendingUp } from 'lucide-react';
import { Button } from "@/components/ui/button";

export default function HallOfFameModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  // Mock data for top swappers
  const topSwappers = [
    { 
      rank: 1, 
      name: 'דני כהן', 
      role: 'רז"ר מבצעים', 
      swaps: 24, 
      helpScore: 95,
      avatar: '🏆'
    },
    { 
      rank: 2, 
      name: 'שירה לוי', 
      role: 'רע"ן תצפית', 
      swaps: 19, 
      helpScore: 88,
      avatar: '🥈'
    },
    { 
      rank: 3, 
      name: 'יוסי אברהם', 
      role: 'רז"ר קשר', 
      swaps: 16, 
      helpScore: 82,
      avatar: '🥉'
    }
  ];

  const getRankBadge = (rank) => {
    const badges = {
      1: { bg: 'from-yellow-400 to-yellow-500', icon: Trophy, text: 'מקום ראשון!' },
      2: { bg: 'from-gray-300 to-gray-400', icon: Medal, text: 'מקום שני' },
      3: { bg: 'from-orange-400 to-orange-500', icon: Medal, text: 'מקום שלישי' }
    };
    return badges[rank] || badges[3];
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
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
          className="relative bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden"
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-yellow-400 via-yellow-500 to-amber-500 p-6 text-white relative overflow-hidden">
            <div className="absolute inset-0 opacity-20">
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
              <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                <Trophy className="w-7 h-7" />
              </div>
              <div>
                <h2 className="text-3xl font-bold mb-1">היכל התהילה 🏆</h2>
                <p className="text-white/90 text-sm">המחליפים המובילים החודש</p>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="p-6">
            <div className="space-y-4 mb-6">
              {topSwappers.map((swapper, index) => {
                const badge = getRankBadge(swapper.rank);
                const BadgeIcon = badge.icon;
                
                return (
                  <motion.div
                    key={swapper.rank}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className={`
                      relative rounded-2xl p-5 border-2 transition-all hover:shadow-xl
                      ${swapper.rank === 1 ? 'bg-gradient-to-br from-yellow-50 to-amber-50 border-yellow-300 shadow-lg' : ''}
                      ${swapper.rank === 2 ? 'bg-gradient-to-br from-gray-50 to-slate-50 border-gray-300' : ''}
                      ${swapper.rank === 3 ? 'bg-gradient-to-br from-orange-50 to-amber-50 border-orange-300' : ''}
                    `}
                  >
                    {/* Rank Badge */}
                    <div className={`absolute -top-3 -right-3 w-10 h-10 rounded-full bg-gradient-to-br ${badge.bg} flex items-center justify-center shadow-lg`}>
                      <span className="text-white font-bold text-lg">#{swapper.rank}</span>
                    </div>

                    <div className="flex items-center gap-4">
                      {/* Avatar */}
                      <div className="text-5xl">{swapper.avatar}</div>
                      
                      {/* Info */}
                      <div className="flex-1">
                        <h3 className="text-xl font-bold text-gray-800 mb-1">{swapper.name}</h3>
                        <p className="text-sm text-gray-600 mb-2">{swapper.role}</p>
                        
                        <div className="flex items-center gap-4 text-sm">
                          <div className="flex items-center gap-1">
                            <TrendingUp className="w-4 h-4 text-green-600" />
                            <span className="font-semibold text-gray-700">{swapper.swaps} החלפות</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                            <span className="font-semibold text-gray-700">ציון {swapper.helpScore}</span>
                          </div>
                        </div>
                      </div>

                      {/* Icon */}
                      <div className={`p-3 bg-gradient-to-br ${badge.bg} rounded-xl`}>
                        <BadgeIcon className="w-6 h-6 text-white" />
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>

            {/* Info Box */}
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
              <p className="text-sm text-blue-800">
                <span className="font-bold">💡 טיפ:</span> ככל שתעזור יותר לאחרים בהחלפות, כך תעלה בדירוג! 
                היכל התהילה מתעדכן בסוף כל חודש.
              </p>
            </div>

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