import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { UserCircle, Building2, Briefcase } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';
import { DEPARTMENTS, getDepartmentList } from '../calendar/departmentData';

export default function OnboardingModal({ isOpen, onComplete }) {
  const [department, setDepartment] = useState('');
  const [role, setRole] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const departments = getDepartmentList();
  const roles = department ? DEPARTMENTS[department] || [] : [];

  const handleDepartmentChange = (value) => {
    setDepartment(value);
    setRole('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!department || !role) {
      toast.error('יש לבחור מחלקה ותפקיד');
      return;
    }

    setIsSubmitting(true);
    try {
      const user = await base44.auth.me();
      
      // Update user with role
      await base44.auth.updateMe({
        assigned_role: role,
        department: department
      });

      toast.success('התפקיד נשמר בהצלחה!');
      onComplete();
    } catch (error) {
      toast.error('שגיאה בשמירת התפקיד');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-[#64B5F6] to-[#42A5F5] p-8 text-white text-center">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring" }}
            className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4"
          >
            <UserCircle className="w-12 h-12" />
          </motion.div>
          <h2 className="text-2xl font-bold mb-2">שלום, מה התפקיד שלך?</h2>
          <p className="text-white/90 text-sm">
            בחר את המחלקה והתפקיד שלך כדי להתחיל
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          {/* Department Selection */}
          <div className="space-y-2">
            <Label className="text-gray-700 font-medium flex items-center gap-2">
              <Building2 className="w-4 h-4 text-[#64B5F6]" />
              בחר מחלקה
            </Label>
            <Select value={department} onValueChange={handleDepartmentChange}>
              <SelectTrigger className="h-12 rounded-xl border-2">
                <SelectValue placeholder="בחר מחלקה..." />
              </SelectTrigger>
              <SelectContent>
                {departments.map((dept) => (
                  <SelectItem key={dept} value={dept}>
                    {dept}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Role Selection */}
          {department && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="space-y-2"
            >
              <Label className="text-gray-700 font-medium flex items-center gap-2">
                <Briefcase className="w-4 h-4 text-[#64B5F6]" />
                בחר תפקיד
              </Label>
              <Select value={role} onValueChange={setRole}>
                <SelectTrigger className="h-12 rounded-xl border-2">
                  <SelectValue placeholder="בחר תפקיד..." />
                </SelectTrigger>
                <SelectContent>
                  {roles.map((r) => (
                    <SelectItem key={r} value={r}>
                      {r}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </motion.div>
          )}

          {/* Submit */}
          <Button
            type="submit"
            disabled={isSubmitting || !department || !role}
            className="w-full bg-gradient-to-r from-[#64B5F6] to-[#42A5F5] hover:from-[#42A5F5] hover:to-[#2196F3] text-white py-6 rounded-xl text-lg font-medium disabled:opacity-50"
          >
            {isSubmitting ? 'שומר...' : 'שמור והמשך'}
          </Button>
        </form>
      </motion.div>
    </div>
  );
}