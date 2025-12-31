import React, { useState } from 'react';
import { format } from 'date-fns';
import { he } from 'date-fns/locale';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Calendar, Plus, Users } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';

export default function AddShiftModal({ 
  isOpen, 
  onClose, 
  date,
  onSubmit,
  isSubmitting
}) {
  const [selectedCustomId, setSelectedCustomId] = useState('');

  // שליפת משתמשים - ללא תלות במחלקה
  const { data: users = [] } = useQuery({
    queryKey: ['users-list-all'],
    queryFn: async () => {
      const res = await base44.entities.User.list();
      return res; 
    },
    enabled: isOpen
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!selectedCustomId) return;
    
    // שליחת ה-custom_id הנבחר
    onSubmit({
      userId: Number(selectedCustomId)
    });
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="absolute inset-0 bg-black/40 backdrop-blur-sm" />

        <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="relative bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col">
          
          <div className="bg-gradient-to-r from-[#64B5F6] to-[#42A5F5] p-6 text-white">
            <button onClick={onClose} className="absolute top-4 left-4 p-2 rounded-full hover:bg-white/20 transition-colors"><X className="w-5 h-5" /></button>
            <div className="flex items-center gap-3">
              <div className="p-3 bg-white/20 rounded-xl"><Calendar className="w-6 h-6" /></div>
              <div>
                <h2 className="text-xl font-bold">הוספת משמרת</h2>
                <p className="text-white/80 text-sm">{date && format(date, 'EEEE, d בMMMM yyyy', { locale: he })}</p>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            <div className="space-y-3">
              <Label className="text-gray-700 font-medium flex items-center gap-2">
                <Users className="w-4 h-4 text-[#64B5F6]" />
                בחר עובד לשיבוץ
              </Label>
              
              <Select value={selectedCustomId} onValueChange={setSelectedCustomId}>
                <SelectTrigger className="h-14 rounded-xl border-2 border-gray-200 focus:border-[#64B5F6] text-lg text-right">
                  <SelectValue placeholder="בחר עובד מהרשימה..." />
                </SelectTrigger>
                <SelectContent className="max-h-[250px]" dir="rtl">
                  {users && users.length > 0 ? (
                    users.map((user) => (
                      <SelectItem key={user.id} value={String(user.custom_id)}>
                        {/* תצוגה: קודם assigned_role, אם אין אז Name */}
                        {user.assigned_role || user.Name}
                      </SelectItem>
                    ))
                  ) : (
                    <div className="p-2 text-center text-gray-500">לא נמצאו משתמשים</div>
                  )}
                </SelectContent>
              </Select>
            </div>

            <Button type="submit" disabled={isSubmitting || !selectedCustomId} className="w-full bg-gradient-to-r from-[#64B5F6] to-[#42A5F5] hover:from-[#42A5F5] hover:to-[#2196F3] text-white py-6 rounded-xl text-lg font-medium disabled:opacity-50">
              {isSubmitting ? (
                <span className="flex items-center gap-2"><motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1 }}>⏳</motion.div>מוסיף...</span>
              ) : (
                <span className="flex items-center gap-2"><Plus className="w-5 h-5" />הוסף משמרת</span>
              )}
            </Button>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}