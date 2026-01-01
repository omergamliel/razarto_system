import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, UserCircle, Briefcase, CheckCircle2, Sparkles } from 'lucide-react';
import { Button } from "@/components/ui/button";

export default function OnboardingModal({ isOpen, authorizedData, onConfirm, isLoading }) {
  if (!isOpen || !authorizedData) return null;

  // חילוץ השם הפרטי לברכה אישית
  const firstName = authorizedData.full_name ? authorizedData.full_name.split(' ')[0] : 'חבר';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md" dir="rtl">
      
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ type: "spring", duration: 0.6 }}
        className="bg-white rounded-3xl shadow-2xl w-full max-w-sm md:max-w-md overflow-hidden relative border border-white/20"
      >
        {/* Decor Header */}
        <div className="h-40 bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-700 relative overflow-visible">
          {/* Abstract Shapes */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl"></div>
          <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/10 rounded-full translate-y-1/2 -translate-x-1/2 blur-2xl"></div>
          
          {/* Centered Avatar Icon */}
          <div className="absolute -bottom-12 left-0 right-0 flex justify-center">
            <div className="relative">
              <div className="w-24 h-24 bg-white rounded-full p-1.5 shadow-xl">
                <div className="w-full h-full bg-gradient-to-br from-blue-50 to-indigo-50 rounded-full flex items-center justify-center text-4xl shadow-inner overflow-hidden">
                  <img
                    src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6937baec9ffc8bc9b555aef5/5878c0ac6_LOGO.png"
                    alt="לוגו רזרטו"
                    className="w-full h-full object-contain p-2"
                    loading="lazy"
                  />
                </div>
              </div>
              <div className="absolute bottom-1 right-1 bg-green-500 w-6 h-6 rounded-full border-4 border-white"></div>
            </div>
          </div>
        </div>

        <div className="pt-16 pb-8 px-8 text-center">
          
          {/* Welcome Text */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <h2 className="text-2xl md:text-3xl font-bold text-gray-800 mb-2">
              היי, {firstName}! 👋🏼
            </h2>
            <p className="text-gray-500 text-sm md:text-base mb-8 leading-relaxed">
              איזה כיף שהצטרפת אלינו לרז"רתו<br/>
              המערכת זיהתה את הפרטים שלך באופן אוטומטי.
            </p>
          </motion.div>

          {/* User Identification Card */}
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-gradient-to-b from-gray-50 to-white rounded-2xl p-5 border border-gray-100 shadow-sm mb-8 text-right relative overflow-hidden"
          >
            {/* Top Shine */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-400 to-purple-400"></div>

            <div className="space-y-4">
              {/* Name Row */}
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center text-blue-600 shadow-sm">
                  <UserCircle className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-xs text-gray-400 font-medium">זיהינו אותך בתור</p>
                  <p className="text-base font-bold text-gray-800">{authorizedData.full_name}</p>
                </div>
              </div>
              
              {/* Divider */}
              <div className="h-px bg-gray-100 w-full"></div>

              {/* Department Row */}
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center text-purple-600 shadow-sm">
                  <Briefcase className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs text-gray-400 font-medium">המחלקה שלך</p>
                  <p className="text-base font-bold text-gray-800">
                    מחלקה {authorizedData.department}
                  </p>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Action Button */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Button 
              onClick={onConfirm}
              disabled={isLoading}
              className="w-full h-14 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-2xl shadow-lg shadow-blue-200 text-lg font-bold flex items-center justify-center gap-3 transition-all transform hover:scale-[1.02]"
            >
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-white rounded-full animate-bounce"></span>
                  <span className="w-2 h-2 bg-white rounded-full animate-bounce delay-75"></span>
                  <span className="w-2 h-2 bg-white rounded-full animate-bounce delay-150"></span>
                  מתחבר למערכת...
                </span>
              ) : (
                <>
                  כניסה למערכת
                  <ArrowRight className="w-6 h-6" />
                </>
              )}
            </Button>
            <p className="text-xs text-gray-400 mt-4 flex items-center justify-center gap-1">
              <Sparkles className="w-3 h-3" />
              לחיצה אחת ואתה בפנים
            </p>
          </motion.div>

        </div>
      </motion.div>
    </div>
  );
}

