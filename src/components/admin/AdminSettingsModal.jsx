import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, Search, Filter, MoreVertical, 
  Edit2, Trash2, Shield, UserX
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
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
  
  // --- QUERIES ---

  // Fetch Authorized People (New Table)
  const { data: authorizedPeople = [], isLoading: isLoadingPeople } = useQuery({
    queryKey: ['authorized-people'],
    queryFn: () => base44.entities.AuthorizedPerson.list(),
    enabled: isOpen && activeTab === 'users'
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
        className="fixed inset-0 m-auto z-50 bg-[#F9FAFB] md:rounded-3xl shadow-2xl w-full max-w-5xl h-full md:h-[90vh] flex flex-col text-right overflow-hidden"
      >
        {/* Header */}
        <div className="bg-white px-6 py-4 md:px-8 md:py-6 border-b border-gray-100 flex items-center justify-between shrink-0">
          <div>
            <h2 className="text-xl md:text-2xl font-bold text-gray-800">ניהול מערכת</h2>
            <p className="text-gray-500 text-xs md:text-sm mt-1">ניהול משתמשים, הרשאות והגדרות</p>
          </div>
          <button 
            onClick={onClose}
            className="p-2 rounded-full hover:bg-gray-100 transition-colors"
          >
            <X className="w-6 h-6 text-gray-400" />
          </button>
        </div>

        {/* Tabs Navigation */}
        <div className="bg-white px-4 md:px-8 flex gap-6 md:gap-8 border-b border-gray-100 shrink-0 overflow-x-auto hide-scrollbar">
          <button
            onClick={() => setActiveTab('users')}
            className={`pb-3 md:pb-4 px-2 text-sm font-medium transition-all relative whitespace-nowrap ${
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
            className={`pb-3 md:pb-4 px-2 text-sm font-medium transition-all relative whitespace-nowrap ${
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
        <div className="flex-1 overflow-hidden bg-[#F9FAFB] p-4 md:p-8">
          
          {/* USERS TAB CONTENT */}
          {activeTab === 'users' && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="h-full flex flex-col gap-4 md:gap-6"
            >
              {/* Toolbar: Search & Filters */}
              <div className="bg-white p-3 md:p-4 rounded-2xl shadow-sm border border-gray-100 flex flex-col md:flex-row items-center justify-between gap-3 md:gap-4">
                
                {/* Search */}
                <div className="relative w-full md:w-96">
                  <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input 
                    placeholder="חיפוש לפי שם או מייל..." 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pr-10 h-10 md:h-11 bg-gray-50 border-gray-200 focus:bg-white rounded-xl text-sm"
                  />
                </div>

                {/* Filters */}
                <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto pb-1 md:pb-0 hide-scrollbar">
                  <span className="text-sm text-gray-500 ml-2 whitespace-nowrap flex items-center gap-1 shrink-0">
                    <Filter className="w-4 h-4" /> סינון:
                  </span>
                  {['ש', 'מ', 'ת'].map(dept => (
                    <button
                      key={dept}
                      onClick={() => toggleDepartmentFilter(dept)}
                      className={`
                        px-3 md:px-4 py-1.5 md:py-2 rounded-lg text-xs md:text-sm font-medium transition-all border shrink-0
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
                
                {/* Table Header - Hidden on Mobile */}
                <div className="hidden md:grid grid-cols-12 gap-4 p-4 border-b border-gray-100 bg-gray-50/50 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  <div className="col-span-3">שם מלא</div>
                  <div className="col-span-2">מחלקה</div>
                  <div className="col-span-3">אימייל</div>
                  <div className="col-span-2">הרשאות</div>
                  <div className="col-span-1 text-center">קישוריות</div>
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
                        className="grid grid-cols-12 gap-2 md:gap-4 p-3 md:p-4 border-b border-gray-50 items-center hover:bg-blue-50/30 transition-colors group relative"
                      >
                        {/* Name (Mobile: Takes more space) */}
                        <div className="col-span-7 md:col-span-3 flex flex-col justify-center">
                          <div className="font-bold text-gray-800 text-sm truncate flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-100 to-indigo-100 text-blue-600 flex items-center justify-center text-xs font-bold shrink-0">
                              {person.full_name?.charAt(0)}
                            </div>
                            <span className="truncate">{person.full_name}</span>
                          </div>
                          {/* Mobile Only Subtitle */}
                          <div className="md:hidden text-xs text-gray-400 mr-10 mt-0.5">
                            מחלקה {person.department} • {person.permissions || 'View'}
                          </div>
                        </div>

                        {/* Department (Hidden on Mobile) */}
                        <div className="hidden md:block col-span-2">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                            מחלקה {person.department}
                          </span>
                        </div>

                        {/* Email (Hidden on Mobile) */}
                        <div className="hidden md:block col-span-3 text-sm text-gray-500 truncate font-mono">
                          {person.email}
                        </div>

                        {/* Permissions (Hidden on Mobile) */}
                        <div className="hidden md:block col-span-2">
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

                        {/* Connectivity Icon (Updated) */}
                        <div className="col-span-3 md:col-span-1 flex justify-center items-center">
                          {person.linked_user_id ? (
                            <img 
                              src="https://i.imagesup.co/images2/30a37d06678a9808e762570c63cede181682172e.png" 
                              alt="Connected"
                              className="w-6 h-6 object-contain"
                              title="משתמש מחובר"
                            />
                          ) : (
                            <img 
                              src="https://i.imagesup.co/images2/b4873b1a4a57971b9ab6294adda44a6a184efc66.png" 
                              alt="Not Connected"
                              className="w-6 h-6 object-contain"
                              title="לא מחובר"
                            />
                          )}
                        </div>

                        {/* Actions (Always Visible) */}
                        <div className="col-span-2 md:col-span-1 flex justify-end md:justify-center">
                          <DropdownMenu dir="rtl">
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg hover:bg-gray-200">
                                <MoreVertical className="w-4 h-4 text-gray-500" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-40">
                              {/* RTL Adjusted Items: Flex with cursor-pointer, justify-end to align right */}
                              <DropdownMenuItem className="flex items-center justify-end gap-2 cursor-pointer text-gray-700">
                                <span>עריכה</span>
                                <Edit2 className="w-4 h-4" />
                              </DropdownMenuItem>
                              
                              <DropdownMenuItem className="flex items-center justify-end gap-2 cursor-pointer text-gray-700">
                                <span>ניהול הרשאות</span>
                                <Shield className="w-4 h-4" />
                              </DropdownMenuItem>
                              
                              <DropdownMenuItem className="flex items-center justify-end gap-2 cursor-pointer text-red-600 focus:text-red-600 focus:bg-red-50">
                                <span>מחיקה</span>
                                <Trash2 className="w-4 h-4" />
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>

                      </div>
                    ))
                  )}
                </div>
                
                {/* Footer Count */}
                <div className="p-3 bg-gray-50 border-t border-gray-100 text-xs text-gray-500 flex justify-between px-6 shrink-0">
                  <span>סה"כ רשומות: {filteredPeople.length}</span>
                  <span className="hidden md:inline">מציג {filteredPeople.length} מתוך {authorizedPeople.length}</span>
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