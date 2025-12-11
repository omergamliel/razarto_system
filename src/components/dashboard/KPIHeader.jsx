import React from 'react';
import { motion } from 'framer-motion';
import { AlertCircle, Clock, CheckCircle, Calendar } from 'lucide-react';
import { Card } from "@/components/ui/card";

export default function KPIHeader({ shifts, currentUserEmail, currentUserRole, onKPIClick }) {
  // Calculate KPIs
  const swapRequests = shifts.filter(s => s.status === 'swap_requested').length;
  const partialGaps = shifts.filter(s => s.status === 'partially_covered').length;
  const approved = shifts.filter(s => s.status === 'approved').length;
  // My shifts count with containment logic - regardless of status
  const myShifts = shifts.filter(s => {
    // Compare dates without time
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const shiftDate = new Date(s.date);
    shiftDate.setHours(0, 0, 0, 0);
    const isFutureShift = shiftDate >= today;
    
    if (!isFutureShift) return false;
    
    // Check if user role is contained in shift's role AND user is assigned
    if (currentUserRole && s.role && typeof s.role === 'string' && 
        s.role.includes(currentUserRole) && 
        s.assigned_email === currentUserEmail) {
      return true;
    }
    
    return false;
  }).length;

  const kpis = [
    {
      id: 'swap_requests',
      title: 'בקשות להחלפה',
      count: swapRequests,
      icon: AlertCircle,
      color: 'from-red-500 to-red-600',
      bgColor: 'bg-red-50',
      textColor: 'text-red-600',
      borderColor: 'border-red-200'
    },
    {
      id: 'partial_gaps',
      title: 'משמרות בפער חלקי',
      count: partialGaps,
      icon: Clock,
      color: 'from-yellow-500 to-yellow-600',
      bgColor: 'bg-yellow-50',
      textColor: 'text-yellow-600',
      borderColor: 'border-yellow-200'
    },
    {
      id: 'approved',
      title: 'החלפות שבוצעו',
      count: approved,
      icon: CheckCircle,
      color: 'from-green-500 to-green-600',
      bgColor: 'bg-green-50',
      textColor: 'text-green-600',
      borderColor: 'border-green-200'
    },
    {
      id: 'my_shifts',
      title: 'המשמרות העתידיות שלי',
      count: myShifts,
      icon: Calendar,
      color: 'from-blue-500 to-blue-600',
      bgColor: 'bg-blue-50',
      textColor: 'text-blue-600',
      borderColor: 'border-blue-200'
    }
  ];

  return (
    <div className="grid grid-cols-4 gap-2 md:gap-4 mb-6">
      {kpis.map((kpi, index) => (
        <motion.div
          key={kpi.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
        >
          <Card
            onClick={() => onKPIClick(kpi.id)}
            className={`cursor-pointer hover:shadow-lg transition-all duration-300 border-2 ${kpi.borderColor} ${kpi.bgColor} p-2 md:p-4`}
          >
            <div className="flex flex-col md:flex-row items-center justify-between mb-1 md:mb-3">
              <div className={`p-1 md:p-2 rounded-lg bg-gradient-to-br ${kpi.color}`}>
                <kpi.icon className="w-3 h-3 md:w-5 md:h-5 text-white" />
              </div>
              <span className={`text-xl md:text-3xl font-bold ${kpi.textColor}`}>
                {kpi.count}
              </span>
            </div>
            <h3 className="text-[10px] md:text-sm font-semibold text-gray-700 leading-tight">
              {kpi.title}
            </h3>
          </Card>
        </motion.div>
      ))}
    </div>
  );
}