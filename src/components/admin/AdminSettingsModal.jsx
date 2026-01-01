import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, Settings, Search, Filter, MoreVertical, 
  CheckSquare, Square, Edit2, Trash2, Shield,
  CheckCircle2, User, UserX
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function AdminSettingsModal({ isOpen, onClose }) {
  const [activeTab, setActiveTab] = useState('users');
  
  // --- STATES FOR USERS TAB ---
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDepartments, setSelectedDepartments] = useState([]);
  
  const queryClient = useQueryClient();

  // --- QUERIES ---

  // Fetch Authorized People (New Table)
  const { data: authorizedPeople = [], isLoading: isLoadingPeople } = useQuery({
    queryKey: ['authorized-people'],
    queryFn: () => base44.entities.AuthorizedPerson.list(),
    enabled: isOpen && activeTab === 'users'
  });

  // Fetch all users (Legacy/For permissions tab if needed later)
  const { data: allUsers = [] } = useQuery({
    queryKey: ['all-users'],
    queryFn: () => base44.entities.User.list(),
    enabled: isOpen && activeTab === 'permissions'
  });

  // --- HANDLERS ---

  const toggleDepartmentFilter = (dept) => {
    setSelectedDepartments(prev => 
      prev.includes(dept) 
        ? prev.filter(d => d !== dept)
        : [...prev, dept]
    );
  };

  const getFilteredPeople = () => {
    return authorizedPeople.filter(person => {
      // 1. Search Filter
      const searchMatch = person.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          person.email?.toLowerCase().includes(searchTerm.toLowerCase());
      
      // 2. Department Filter
      const deptMatch = selectedDepartments.length === 0 || selectedDepartments.includes(person.department);

      return searchMatch && deptMatch;
    });
  };

  const filteredPeople = getFilteredPeople();

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-black/40 backdrop-blur-sm z-40"
      />

      {/* Modal Container */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="fixed inset-0 m-auto z-50 bg-[#F9FAFB] rounded-3xl shadow-2xl w-full max-w-5xl h-[90vh] flex flex-col text-right overflow-hidden"
      >
        {/* Header */}
        <div className="bg-white px-8 py-6 border-b border-gray-100 flex items-center justify-between shrink-0">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">ניהול מערכת</h2>
            <p className="text-gray-500 text-sm mt-1">ניהול משתמשים, הרשאות והגדרות</p>
          </div>
          <button 
            onClick={onClose}
            className="p-2 rounded-full hover:bg-gray-100 transition-colors"
          >
            <X className="w-6 h-6 text-gray-400" />
          </button>
        </div>

        {/* Tabs Navigation */}
        <div className="bg-white px-8 flex gap-8 border-b border-gray-100 shrink-0">
          <button
            onClick={() => setActiveTab('users')}
            className={`pb-4 px-2 text-sm font-medium transition-all relative ${
              activeTab === 'users' ? 'text-blue-600' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            משתמשים
            {activeTab === 'users' && (
              <motion.div layoutId="activeTab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600" />
            )}
          </button>
          
          <button
            onClick={() => setActiveTab('permissions')}
            className={`pb-4 px-2 text-sm font-medium transition-all relative ${
              activeTab === 'permissions' ? 'text-blue-600' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            הרשאות מתקדמות
            {activeTab === 'permissions' && (
              <motion.div layoutId="activeTab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600" />
            )}
          </button>
        </div>

        {/* --- MAIN CONTENT AREA --- */}
        <div className="flex-1 overflow-hidden bg-[#F9FAFB] p-8">
          
          {/* USERS TAB CONTENT */}
          {activeTab === 'users' && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="h-full flex flex-col gap-6"
            >
              {/* Toolbar: Search & Filters */}
              <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex flex-col md:flex-row items-center justify-between gap-4">
                
                {/* Search */}
                <div className="relative w-full md:w-96">
                  <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input 
                    placeholder="חיפוש לפי שם או מייל..." 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pr-10 h-11 bg-gray-50 border-gray-200 focus:bg-white rounded-xl"
                  />
                </div>

                {/* Filters */}
                <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto pb-2 md:pb-0">
                  <span className="text-sm text-gray-500 ml-2 whitespace-nowrap flex items-center gap-1">
                    <Filter className="w-4 h-4" /> סינון:
                  </span>
                  {['ש', 'מ', 'ת'].map(dept => (
                    <button
                      key={dept}
                      onClick={() => toggleDepartmentFilter(dept)}
                      className={`
                        px-4 py-2 rounded-lg text-sm font-medium transition-all border
                        ${selectedDepartments.includes(dept)
                          ? 'bg-blue-50 border-blue-200 text-blue-700 shadow-sm'
                          : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                        }
                      `}
                    >
                      מחלקה {dept}
                    </button>
                  ))}
                </div>
              </div>

              {/* Data Table */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 flex-1 overflow-hidden flex flex-col">
                
                {/* Table Header */}
                <div className="grid grid-cols-12 gap-4 p-4 border-b border-gray-100 bg-gray-50/50 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  <div className="col-span-3">שם מלא</div>
                  <div className="col-span-2">מחלקה</div>
                  <div className="col-span-3">אימייל</div>
                  <div className="col-span-2">הרשאות</div>
                  <div className="col-span-1 text-center">סטטוס</div>
                  <div className="col-span-1 text-center">פעולות</div>
                </div>

                {/* Table Body - Scrollable */}
                <div className="overflow-y-auto flex-1 custom-scrollbar">
                  {isLoadingPeople ? (
                    <div className="flex items-center justify-center h-40 text-gray-400">
                      טוען נתונים...
                    </div>
                  ) : filteredPeople.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-64 text-gray-400 gap-2">
                      <UserX className="w-10 h-10 opacity-20" />
                      <span>לא נמצאו משתמשים התואמים לחיפוש</span>
                    </div>
                  ) : (
                    filteredPeople.map((person) => (
                      <div 
                        key={person.id} 
                        className="grid grid-cols-12 gap-4 p-4 border-b border-gray-50 items-center hover:bg-blue-50/30 transition-colors group"
                      >
                        {/* Name */}
                        <div className="col-span-3 font-bold text-gray-800 text-sm truncate flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-100 to-indigo-100 text-blue-600 flex items-center justify-center text-xs font-bold">
                            {person.full_name?.charAt(0)}
                          </div>
                          {person.full_name}
                        </div>

                        {/* Department */}
                        <div className="col-span-2">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                            מחלקה {person.department}
                          </span>
                        </div>

                        {/* Email */}
                        <div className="col-span-3 text-sm text-gray-500 truncate font-mono">
                          {person.email}
                        </div>

                        {/* Permissions */}
                        <div className="col-span-2">
                          <span className={`
                            inline-flex items-center px-2.5 py-0.5 rounded-lg text-xs font-medium border
                            ${person.permissions === 'Admin' 
                              ? 'bg-purple-50 text-purple-700 border-purple-100' 
                              : person.permissions === 'Manager'
                              ? 'bg-indigo-50 text-indigo-700 border-indigo-100'
                              : 'bg-white text-gray-600 border-gray-200'}
                          `}>
                            {person.permissions || 'View'}
                          </span>
                        </div>

                        {/* Status (Linked User) */}
                        <div className="col-span-1 flex justify-center">
                          {person.linked_user_id ? (
                            <div className="w-8 h-8 rounded-full bg-green-50 text-green-600 flex items-center justify-center" title="משתמש רשום ומקושר">
                              <CheckCircle2 className="w-5 h-5" />
                            </div>
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-gray-50 text-gray-300 flex items-center justify-center border border-gray-200 border-dashed" title="טרם נרשם">
                              <User className="w-4 h-4" />
                            </div>
                          )}
                        </div>

                        {/* Actions */}
                        <div className="col-span-1 flex justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg hover:bg-gray-200">
                                <MoreVertical className="w-4 h-4 text-gray-500" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-40">
                              <DropdownMenuItem className="gap-2 cursor-pointer">
                                <Edit2 className="w-4 h-4" /> עריכה
                              </DropdownMenuItem>
                              <DropdownMenuItem className="gap-2 cursor-pointer">
                                <Shield className="w-4 h-4" /> ניהול הרשאות
                              </DropdownMenuItem>
                              <DropdownMenuItem className="gap-2 cursor-pointer text-red-600 focus:text-red-600">
                                <Trash2 className="w-4 h-4" /> מחיקה
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>

                      </div>
                    ))
                  )}
                </div>
                
                {/* Footer Count */}
                <div className="p-3 bg-gray-50 border-t border-gray-100 text-xs text-gray-500 flex justify-between px-6">
                  <span>סה"כ רשומות: {filteredPeople.length}</span>
                  <span>מציג {filteredPeople.length} מתוך {authorizedPeople.length}</span>
                </div>

              </div>
            </motion.div>
          )}

          {/* PERMISSIONS TAB (Legacy Placeholder) */}
          {activeTab === 'permissions' && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center justify-center h-full text-gray-400 gap-4"
            >
              <Shield className="w-16 h-16 opacity-20" />
              <p>איזור ניהול הרשאות מתקדמות (בפיתוח)</p>
            </motion.div>
          )}

        </div>
      </motion.div>
    </AnimatePresence>
  );
}