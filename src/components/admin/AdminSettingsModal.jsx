import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, Search, Filter, MoreVertical, 
  Edit2, Trash2, Shield, UserX, Plus, UserPlus
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

export default function AdminSettingsModal({ isOpen, onClose }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDepartments, setSelectedDepartments] = useState([]);
  const [isAddUserOpen, setIsAddUserOpen] = useState(false);
  
  // State for new user form
  const [newUser, setNewUser] = useState({
    full_name: '',
    department: '',
    email: '',
    permissions: 'View' // Default
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const queryClient = useQueryClient();

  // --- QUERIES ---

  // Fetch Authorized People
  const { data: authorizedPeople = [], isLoading: isLoadingPeople } = useQuery({
    queryKey: ['authorized-people'],
    queryFn: () => base44.entities.AuthorizedPerson.list(),
    enabled: isOpen
  });

  // --- MUTATIONS ---

  const addUserMutation = useMutation({
    mutationFn: async (userData) => {
      // 1. Calculate next serial_id
      // We look at the current list (authorizedPeople) to find the max ID
      const maxId = authorizedPeople.reduce((max, person) => {
        return (person.serial_id || 0) > max ? person.serial_id : max;
      }, 0);
      
      const nextId = maxId + 1;

      // 2. Create the record
      return await base44.entities.AuthorizedPerson.create({
        ...userData,
        serial_id: nextId
      });
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries(['authorized-people']);
      toast.success(`המשתמש ${data.full_name} התווסף לרשימת המשתמשים המורשים!`);
      setIsAddUserOpen(false);
      setNewUser({ full_name: '', department: '', email: '', permissions: 'View' }); // Reset form
    },
    onError: () => {
      toast.error("שגיאה בהוספת המשתמש. אנא נסה שנית.");
    }
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

  const handleAddUserSubmit = async (e) => {
    e.preventDefault();
    if (!newUser.full_name || !newUser.department || !newUser.email) {
      toast.error("נא למלא את כל שדות החובה");
      return;
    }
    setIsSubmitting(true);
    try {
      await addUserMutation.mutateAsync(newUser);
    } catch (error) {
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
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

      {/* Main Modal Container */}
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
            <p className="text-gray-500 text-xs md:text-sm mt-1">רשימת משתמשים מורשים וניהול גישה</p>
          </div>
          <button 
            onClick={onClose}
            className="p-2 rounded-full hover:bg-gray-100 transition-colors"
          >
            <X className="w-6 h-6 text-gray-400" />
          </button>
        </div>

        {/* Removed Tabs Bar - Direct Content */}

        {/* --- MAIN CONTENT AREA --- */}
        <div className="flex-1 overflow-hidden bg-[#F9FAFB] p-4 md:p-8">
          
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="h-full flex flex-col gap-4 md:gap-6"
          >
            {/* Toolbar: Search, Filters & Add Button */}
            <div className="bg-white p-3 md:p-4 rounded-2xl shadow-sm border border-gray-100 flex flex-col md:flex-row items-center justify-between gap-3 md:gap-4">
              
              {/* Search */}
              <div className="relative w-full md:w-80 lg:w-96">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input 
                  placeholder="חיפוש לפי שם או מייל..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pr-10 h-10 md:h-11 bg-gray-50 border-gray-200 focus:bg-white rounded-xl text-sm"
                />
              </div>

              {/* Actions Right Side */}
              <div className="flex items-center gap-3 w-full md:w-auto overflow-x-auto hide-scrollbar pb-1 md:pb-0 justify-between md:justify-end">
                
                {/* Filters */}
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-500 ml-2 whitespace-nowrap flex items-center gap-1 shrink-0 hidden md:flex">
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
                      {dept}
                    </button>
                  ))}
                </div>

                {/* Add Button */}
                <Button 
                  onClick={() => setIsAddUserOpen(true)}
                  className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl gap-2 shadow-md shadow-blue-200 shrink-0 h-10 md:h-11 px-4"
                >
                  <img 
                    src="https://cdn-icons-png.flaticon.com/128/9131/9131530.png" 
                    alt="Add" 
                    className="w-5 h-5 invert brightness-0 filter" 
                    style={{ filter: 'brightness(0) invert(1)' }} 
                  />
                  <span className="hidden md:inline">הוספה</span>
                </Button>

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
                    <span>לא נמצאו משתמשים</span>
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
                        <div className="md:hidden text-xs text-gray-400 mr-10 mt-0.5 flex gap-2">
                           <span>{person.department}</span> • <span>{person.permissions}</span>
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
                          ${person.permissions === 'RR' 
                            ? 'bg-purple-50 text-purple-700 border-purple-100' 
                            : 'bg-white text-gray-600 border-gray-200'}
                        `}>
                          {person.permissions || 'View'}
                        </span>
                      </div>

                      {/* Connectivity Icon */}
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

                      {/* Actions */}
                      <div className="col-span-2 md:col-span-1 flex justify-end md:justify-center">
                        <DropdownMenu dir="rtl">
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg hover:bg-gray-200">
                              <MoreVertical className="w-4 h-4 text-gray-500" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-40">
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

        </div>
      </motion.div>

      {/* --- ADD USER DIALOG (Modal) --- */}
      <Dialog open={isAddUserOpen} onOpenChange={setIsAddUserOpen}>
        <DialogContent className="sm:max-w-[425px] text-right" dir="rtl">
          <DialogHeader className="text-right">
            <DialogTitle className="flex items-center gap-2 text-xl">
              <div className="bg-blue-100 p-2 rounded-full">
                <UserPlus className="w-5 h-5 text-blue-600" />
              </div>
              הוספת משתמש מורשה
            </DialogTitle>
            <p className="text-sm text-gray-500 mt-1">
              המשתמש שתוסיף יוכל להירשם למערכת. מזהה ייחודי יווצר אוטומטית.
            </p>
          </DialogHeader>

          <form onSubmit={handleAddUserSubmit} className="grid gap-4 py-4">
            
            {/* Full Name */}
            <div className="grid gap-2">
              <Label htmlFor="full_name" className="text-right">שם מלא</Label>
              <Input
                id="full_name"
                value={newUser.full_name}
                onChange={(e) => setNewUser({...newUser, full_name: e.target.value})}
                placeholder="לדוגמה: ישראל ישראלי"
                className="col-span-3"
                required
              />
            </div>

            {/* Department */}
            <div className="grid gap-2">
              <Label htmlFor="department" className="text-right">מחלקה</Label>
              <Select 
                value={newUser.department} 
                onValueChange={(val) => setNewUser({...newUser, department: val})}
                required
              >
                <SelectTrigger className="w-full text-right" dir="rtl">
                  <SelectValue placeholder="בחר מחלקה" />
                </SelectTrigger>
                <SelectContent dir="rtl">
                  <SelectItem value="ש">מחלקה ש</SelectItem>
                  <SelectItem value="מ">מחלקה מ</SelectItem>
                  <SelectItem value="ת">מחלקה ת</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Email */}
            <div className="grid gap-2">
              <Label htmlFor="email" className="text-right">כתובת מייל</Label>
              <Input
                id="email"
                type="email"
                value={newUser.email}
                onChange={(e) => setNewUser({...newUser, email: e.target.value})}
                placeholder="example@army.idf.il"
                className="col-span-3 text-left"
                dir="ltr" // Email is usually LTR
                required
              />
            </div>

            {/* Permissions */}
            <div className="grid gap-2">
              <Label htmlFor="permissions" className="text-right">רמת הרשאות</Label>
              <Select 
                value={newUser.permissions} 
                onValueChange={(val) => setNewUser({...newUser, permissions: val})}
              >
                <SelectTrigger className="w-full text-right" dir="rtl">
                  <SelectValue placeholder="בחר הרשאה" />
                </SelectTrigger>
                <SelectContent dir="rtl">
                  <SelectItem value="View">צפייה בלבד (View)</SelectItem>
                  <SelectItem value="RR">רלוונטיות (RR)</SelectItem>
                </SelectContent>
              </Select>
            </div>

          </form>

          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button variant="outline" onClick={() => setIsAddUserOpen(false)} className="w-full sm:w-auto">
              ביטול
            </Button>
            <Button 
              onClick={handleAddUserSubmit} 
              disabled={isSubmitting}
              className="bg-blue-600 hover:bg-blue-700 text-white w-full sm:w-auto"
            >
              {isSubmitting ? 'שומר...' : `הוסף ליוזרים המורשים`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AnimatePresence>
  );
}