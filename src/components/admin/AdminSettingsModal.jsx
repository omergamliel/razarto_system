import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, Search, Filter, MoreVertical, 
  Edit2, Trash2, Shield, UserX, UserPlus,
  AlertTriangle, Archive, Check, Send, CheckCircle2
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
  DialogDescription
} from "@/components/ui/dialog";

export default function AdminSettingsModal({ isOpen, onClose }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDepartments, setSelectedDepartments] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // --- MODAL STATES ---
  const [isAddUserOpen, setIsAddUserOpen] = useState(false);
  const [addUserStep, setAddUserStep] = useState('form'); // 'form' or 'success'
  const [addedUserData, setAddedUserData] = useState(null); // Stores the newly added user for the invite
  
  const [isEditUserOpen, setIsEditUserOpen] = useState(false);
  const [isPermissionsOpen, setIsPermissionsOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  // --- DATA STATES ---
  const [newUser, setNewUser] = useState({ full_name: '', department: '', email: '', permissions: 'View' });
  const [editingUser, setEditingUser] = useState(null);
  const [permissionUser, setPermissionUser] = useState(null);
  const [selectedPermission, setSelectedPermission] = useState('');
  const [userToDelete, setUserToDelete] = useState(null);
  
  // Archive Logic States
  const [isArchiveMode, setIsArchiveMode] = useState(false);
  const [archiveReason, setArchiveReason] = useState('');

  const queryClient = useQueryClient();

  // --- HELPER: Permission Colors ---
  const getPermissionStyle = (perm) => {
    switch (perm) {
      case 'RR': return { bg: '#fde4cf', text: '#5d3a1a', border: '#e8cdb3' };
      case 'View': return { bg: '#f1c0e8', text: '#682a5c', border: '#dcb0d4' };
      case 'Manager': return { bg: '#dfe7fd', text: '#1e40af', border: '#bfdbfe' }; // Updated Color
      case 'Admin': return { bg: '#b9fbc0', text: '#1e5e24', border: '#a3e5aa' };
      default: return { bg: '#f3f4f6', text: '#4b5563', border: '#e5e7eb' };
    }
  };

  // --- HELPER: WhatsApp Invite ---
  const handleSendInvite = (user) => {
    if (!user) return;
    const message = `היי *${user.full_name}* \nהוזמנת להצטרף למערכת Razarto\nיש להיכנס לקישור ולהתחבר באמצעות המייל האישי.\nקישור: https://razar-toran-b555aef5.base44.app`;    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };

  // --- QUERIES ---
  const { data: authorizedPeople = [], isLoading: isLoadingPeople } = useQuery({
    queryKey: ['authorized-people'],
    queryFn: () => base44.entities.AuthorizedPerson.list(),
    enabled: isOpen
  });

  // --- MUTATIONS ---

  // 1. Create User
  const addUserMutation = useMutation({
    mutationFn: async (userData) => {
      const maxId = authorizedPeople.reduce((max, person) => (person.serial_id || 0) > max ? person.serial_id : max, 0);
      return await base44.entities.AuthorizedPerson.create({ ...userData, serial_id: maxId + 1 });
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries(['authorized-people']);
      // Instead of closing, switch to success step
      setAddedUserData(data);
      setAddUserStep('success');
      setNewUser({ full_name: '', department: '', email: '', permissions: 'View' }); // Reset form
    },
    onError: () => toast.error("שגיאה בהוספת המשתמש.")
  });

  // 2. Update User
  const updateUserMutation = useMutation({
    mutationFn: async ({ id, data }) => {
      return await base44.entities.AuthorizedPerson.update(id, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['authorized-people']);
      toast.success("הפרטים עודכנו בהצלחה!");
      setIsEditUserOpen(false);
      setIsPermissionsOpen(false);
    },
    onError: () => toast.error("שגיאה בעדכון הפרטים.")
  });

  // 3. Delete User
  const deleteUserMutation = useMutation({
    mutationFn: async (id) => {
      return await base44.entities.AuthorizedPerson.delete(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['authorized-people']);
      toast.success("המשתמש הוסר מהמערכת בהצלחה.");
      setIsDeleteOpen(false);
      setUserToDelete(null);
    },
    onError: () => toast.error("שגיאה במחיקת המשתמש.")
  });

  // --- HANDLERS ---

  const handleAddUserSubmit = async (e) => {
    e.preventDefault();
    if (!newUser.full_name || !newUser.department || !newUser.email) return toast.error("נא למלא את כל שדות החובה");
    setIsSubmitting(true);
    try { await addUserMutation.mutateAsync(newUser); } finally { setIsSubmitting(false); }
  };

  const handleCloseAddUser = () => {
    setIsAddUserOpen(false);
    // Reset state after animation completes usually, but here immediate is fine for next open
    setTimeout(() => setAddUserStep('form'), 300);
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!editingUser.full_name || !editingUser.department || !editingUser.email) return toast.error("נא למלא את כל שדות החובה");
    setIsSubmitting(true);
    try { 
      await updateUserMutation.mutateAsync({ id: editingUser.id, data: editingUser }); 
    } finally { setIsSubmitting(false); }
  };

  const handleSavePermissions = async () => {
    if (!permissionUser || !selectedPermission) return;
    setIsSubmitting(true);
    try {
      await updateUserMutation.mutateAsync({ 
        id: permissionUser.id, 
        data: { permissions: selectedPermission } 
      });
    } finally { setIsSubmitting(false); }
  };

  const handleDeleteConfirm = async () => {
    if (isArchiveMode) {
      toast.success("הבקשה להעברה לארכיון התקבלה (סימולציה)");
      setIsDeleteOpen(false);
      setIsArchiveMode(false);
      setArchiveReason('');
    } else {
      if (userToDelete) {
        setIsSubmitting(true);
        try { await deleteUserMutation.mutateAsync(userToDelete.id); } finally { setIsSubmitting(false); }
      }
    }
  };

  // Filter Logic
  const getFilteredPeople = () => {
    return authorizedPeople.filter(person => {
      const searchMatch = person.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          person.email?.toLowerCase().includes(searchTerm.toLowerCase());
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
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-black/40 backdrop-blur-sm z-40"
      />

      {/* Main Container */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
        className="fixed inset-0 m-auto z-50 bg-[#F9FAFB] md:rounded-3xl shadow-2xl w-full max-w-5xl h-full md:h-[90vh] flex flex-col text-right overflow-hidden"
      >
        {/* Header */}
        <div className="bg-white px-6 py-4 md:px-8 md:py-6 border-b border-gray-100 flex items-center justify-between shrink-0">
          <div>
            <h2 className="text-xl md:text-2xl font-bold text-gray-800">ניהול מערכת</h2>
            <p className="text-gray-500 text-xs md:text-sm mt-1">רשימת משתמשים מורשים וניהול גישה</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-100 transition-colors">
            <X className="w-6 h-6 text-gray-400" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden bg-[#F9FAFB] p-4 md:p-8">
          <div className="h-full flex flex-col gap-4 md:gap-6">
            
            {/* Toolbar */}
            <div className="bg-white p-3 md:p-4 rounded-2xl shadow-sm border border-gray-100 flex flex-col md:flex-row items-center justify-between gap-3 md:gap-4">
              <div className="relative w-full md:w-80 lg:w-96">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input 
                  placeholder="חיפוש לפי שם או מייל..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pr-10 h-10 md:h-11 bg-gray-50 border-gray-200 focus:bg-white rounded-xl text-sm"
                />
              </div>

              <div className="flex items-center gap-3 w-full md:w-auto overflow-x-auto hide-scrollbar pb-1 md:pb-0 justify-between md:justify-end">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-500 ml-2 whitespace-nowrap flex items-center gap-1 shrink-0 hidden md:flex">
                    <Filter className="w-4 h-4" /> סינון:
                  </span>
                  {['ש', 'מ', 'ת'].map(dept => (
                    <button
                      key={dept}
                      onClick={() => {
                        setSelectedDepartments(prev => prev.includes(dept) ? prev.filter(d => d !== dept) : [...prev, dept]);
                      }}
                      className={`px-3 md:px-4 py-1.5 md:py-2 rounded-lg text-xs md:text-sm font-medium transition-all border shrink-0 ${
                        selectedDepartments.includes(dept) ? 'bg-blue-50 border-blue-200 text-blue-700 shadow-sm' : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                      }`}
                    >
                      {dept}
                    </button>
                  ))}
                </div>

                <Button 
                  onClick={() => { setAddUserStep('form'); setIsAddUserOpen(true); }}
                  className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl gap-2 shadow-md shadow-blue-200 shrink-0 h-10 md:h-11 px-4"
                >
                  <img src="https://cdn-icons-png.flaticon.com/128/9131/9131530.png" alt="Add" className="w-5 h-5 invert brightness-0 filter" style={{ filter: 'brightness(0) invert(1)' }} />
                  <span className="hidden md:inline">הוספה</span>
                </Button>
              </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 flex-1 overflow-hidden flex flex-col">
              <div className="hidden md:grid grid-cols-12 gap-4 p-4 border-b border-gray-100 bg-gray-50/50 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                <div className="col-span-3">שם מלא</div>
                <div className="col-span-2">מחלקה</div>
                <div className="col-span-3">אימייל</div>
                <div className="col-span-2">הרשאות</div>
                <div className="col-span-1 text-center">קישוריות</div>
                <div className="col-span-1 text-center">פעולות</div>
              </div>

              <div className="overflow-y-auto flex-1 custom-scrollbar">
                {isLoadingPeople ? (
                  <div className="flex items-center justify-center h-40 text-gray-400">טוען נתונים...</div>
                ) : filteredPeople.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-64 text-gray-400 gap-2">
                    <UserX className="w-10 h-10 opacity-20" />
                    <span>לא נמצאו משתמשים</span>
                  </div>
                ) : (
                  filteredPeople.map((person) => {
                    const permStyle = getPermissionStyle(person.permissions);
                    return (
                      <div key={person.id} className="grid grid-cols-12 gap-2 md:gap-4 p-3 md:p-4 border-b border-gray-50 items-center hover:bg-blue-50/30 transition-colors group relative">
                        {/* Name */}
                        <div className="col-span-7 md:col-span-3 flex flex-col justify-center">
                          <div className="font-bold text-gray-800 text-sm truncate flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-100 to-indigo-100 text-blue-600 flex items-center justify-center text-xs font-bold shrink-0">
                              {person.full_name?.charAt(0)}
                            </div>
                            <span className="truncate">{person.full_name}</span>
                          </div>
                          <div className="md:hidden text-xs text-gray-400 mr-10 mt-0.5 flex gap-2">
                            <span>{person.department}</span> • <span style={{ color: permStyle.text }}>{person.permissions}</span>
                          </div>
                        </div>

                        {/* Department */}
                        <div className="hidden md:block col-span-2">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                            מחלקה {person.department}
                          </span>
                        </div>

                        {/* Email */}
                        <div className="hidden md:block col-span-3 text-sm text-gray-500 truncate font-mono">
                          {person.email}
                        </div>

                        {/* Permissions (Styled) */}
                        <div className="hidden md:block col-span-2">
                          <span 
                            className="inline-flex items-center px-2.5 py-0.5 rounded-lg text-xs font-bold border shadow-sm"
                            style={{ 
                              backgroundColor: permStyle.bg, 
                              color: permStyle.text,
                              borderColor: permStyle.border
                            }}
                          >
                            {person.permissions || 'View'}
                          </span>
                        </div>

                        {/* Connectivity */}
                        <div className="col-span-3 md:col-span-1 flex justify-center items-center">
                          <img 
                            src={person.linked_user_id 
                              ? "https://i.imagesup.co/images2/30a37d06678a9808e762570c63cede181682172e.png" 
                              : "https://i.imagesup.co/images2/b4873b1a4a57971b9ab6294adda44a6a184efc66.png"} 
                            alt="Status"
                            className="w-6 h-6 object-contain"
                          />
                        </div>

                        {/* Actions */}
                        <div className="col-span-2 md:col-span-1 flex justify-end md:justify-center">
                          <DropdownMenu dir="rtl">
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg hover:bg-gray-200">
                                <MoreVertical className="w-4 h-4 text-gray-500" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-48">
                              <DropdownMenuItem onClick={() => { setEditingUser({...person}); setIsEditUserOpen(true); }} className="flex items-center justify-end gap-2 cursor-pointer text-gray-700">
                                <span>עריכה</span><Edit2 className="w-4 h-4" />
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => { setPermissionUser(person); setSelectedPermission(person.permissions || 'View'); setIsPermissionsOpen(true); }} className="flex items-center justify-end gap-2 cursor-pointer text-gray-700">
                                <span>ניהול הרשאות</span><Shield className="w-4 h-4" />
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleSendInvite(person)} className="flex items-center justify-end gap-2 cursor-pointer text-blue-600 focus:text-blue-700 focus:bg-blue-50">
                                <span>שליחת הזמנה</span><Send className="w-4 h-4" />
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => { setUserToDelete(person); setIsDeleteOpen(true); setIsArchiveMode(false); }} className="flex items-center justify-end gap-2 cursor-pointer text-red-600 focus:text-red-600 focus:bg-red-50 border-t mt-1 pt-1">
                                <span>מחיקה</span><Trash2 className="w-4 h-4" />
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
              
              <div className="p-3 bg-gray-50 border-t border-gray-100 text-xs text-gray-500 flex justify-between px-6 shrink-0">
                <span>סה"כ רשומות: {filteredPeople.length}</span>
                <span className="hidden md:inline">מציג {filteredPeople.length} מתוך {authorizedPeople.length}</span>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* --- 1. ADD USER MODAL (Multi-Step) --- */}
      <Dialog open={isAddUserOpen} onOpenChange={handleCloseAddUser}>
        <DialogContent className="sm:max-w-[425px] text-right" dir="rtl">
          
          {addUserStep === 'form' ? (
            <>
              <DialogHeader className="text-right">
                <DialogTitle className="flex items-center gap-2 text-xl">
                  <div className="bg-blue-100 p-2 rounded-full"><UserPlus className="w-5 h-5 text-blue-600" /></div>
                  הוספת משתמש מורשה
                </DialogTitle>
                <DialogDescription className="text-right">מלא את פרטי המשתמש החדש.</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleAddUserSubmit} className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="full_name" className="text-right">שם מלא</Label>
                  <Input id="full_name" value={newUser.full_name} onChange={(e) => setNewUser({...newUser, full_name: e.target.value})} required className="text-right"/>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="department" className="text-right">מחלקה</Label>
                  <Select value={newUser.department} onValueChange={(val) => setNewUser({...newUser, department: val})} required>
                    <SelectTrigger className="w-full text-right" dir="rtl"><SelectValue placeholder="בחר מחלקה" /></SelectTrigger>
                    <SelectContent dir="rtl">
                      <SelectItem value="ש">מחלקה ש</SelectItem>
                      <SelectItem value="מ">מחלקה מ</SelectItem>
                      <SelectItem value="ת">מחלקה ת</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="email" className="text-right">כתובת מייל</Label>
                  <Input id="email" type="email" value={newUser.email} onChange={(e) => setNewUser({...newUser, email: e.target.value})} dir="ltr" className="text-left" required/>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="permissions" className="text-right">רמת הרשאות</Label>
                  <Select value={newUser.permissions} onValueChange={(val) => setNewUser({...newUser, permissions: val})}>
                    <SelectTrigger className="w-full text-right" dir="rtl"><SelectValue placeholder="בחר הרשאה" /></SelectTrigger>
                    <SelectContent dir="rtl">
                      <SelectItem value="View">צפייה בלבד (View)</SelectItem>
                      <SelectItem value="RR">משתמש רגיל (RR)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </form>
              <DialogFooter className="flex-col sm:flex-row gap-2">
                <Button variant="outline" onClick={handleCloseAddUser}>ביטול</Button>
                <Button onClick={handleAddUserSubmit} disabled={isSubmitting} className="bg-blue-600 hover:bg-blue-700 text-white">{isSubmitting ? 'שומר...' : 'הוסף משתמש'}</Button>
              </DialogFooter>
            </>
          ) : (
            // --- SUCCESS STEP ---
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }} 
              animate={{ opacity: 1, scale: 1 }} 
              className="flex flex-col items-center text-center p-4 gap-4"
            >
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-2">
                <CheckCircle2 className="w-8 h-8 text-green-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-800">המשתמש התווסף!</h2>
              <p className="text-gray-600">
                המשתמש <b>{addedUserData?.full_name}</b> התווסף למערכת בהצלחה.
              </p>
              
              <div className="flex flex-col w-full gap-3 mt-4">
                <Button 
                  onClick={() => handleSendInvite(addedUserData)} 
                  className="w-full bg-[#25D366] hover:bg-[#128C7E] text-white gap-2 h-12 text-md rounded-xl"
                >
                  <img src="https://cdn-icons-png.flaticon.com/128/3670/3670051.png" alt="WhatsApp" className="w-5 h-5 brightness-0 invert" style={{filter: 'brightness(0) invert(1)'}} />
                  שתף הזמנה בוואטסאפ
                </Button>
                
                <Button variant="outline" onClick={handleCloseAddUser} className="w-full h-11 rounded-xl">
                  סגירה
                </Button>
              </div>
            </motion.div>
          )}

        </DialogContent>
      </Dialog>

      {/* --- 2. EDIT USER MODAL --- */}
      <Dialog open={isEditUserOpen} onOpenChange={setIsEditUserOpen}>
        <DialogContent className="sm:max-w-[425px] text-right" dir="rtl">
          <DialogHeader className="text-right">
            <DialogTitle className="flex items-center gap-2 text-xl">
              <div className="bg-indigo-100 p-2 rounded-full"><Edit2 className="w-5 h-5 text-indigo-600" /></div>
              עריכת פרטי משתמש
            </DialogTitle>
            <DialogDescription className="text-right">עדכן את פרטי המשתמש. שדה הרשאות מנוהל בנפרד.</DialogDescription>
          </DialogHeader>
          {editingUser && (
            <form onSubmit={handleEditSubmit} className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="edit_name" className="text-right">שם מלא</Label>
                <Input id="edit_name" value={editingUser.full_name} onChange={(e) => setEditingUser({...editingUser, full_name: e.target.value})} className="text-right" required/>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit_dept" className="text-right">מחלקה</Label>
                <Select value={editingUser.department} onValueChange={(val) => setEditingUser({...editingUser, department: val})} required>
                  <SelectTrigger className="w-full text-right" dir="rtl"><SelectValue /></SelectTrigger>
                  <SelectContent dir="rtl">
                    <SelectItem value="ש">מחלקה ש</SelectItem>
                    <SelectItem value="מ">מחלקה מ</SelectItem>
                    <SelectItem value="ת">מחלקה ת</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit_email" className="text-right">כתובת מייל</Label>
                <Input id="edit_email" value={editingUser.email} onChange={(e) => setEditingUser({...editingUser, email: e.target.value})} dir="ltr" className="text-left" required/>
              </div>
            </form>
          )}
          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button variant="outline" onClick={() => setIsEditUserOpen(false)}>ביטול</Button>
            <Button onClick={handleEditSubmit} disabled={isSubmitting} className="bg-indigo-600 hover:bg-indigo-700 text-white">{isSubmitting ? 'שומר...' : 'שמור שינויים'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* --- 3. PERMISSIONS MODAL --- */}
      <Dialog open={isPermissionsOpen} onOpenChange={setIsPermissionsOpen}>
        <DialogContent className="sm:max-w-[550px] text-right" dir="rtl">
          <DialogHeader className="text-right">
            <DialogTitle className="flex items-center gap-2 text-xl">
              <div className="bg-purple-100 p-2 rounded-full"><Shield className="w-5 h-5 text-purple-600" /></div>
              ניהול הרשאות
            </DialogTitle>
            <DialogDescription className="text-right">
              בחר את רמת ההרשאה עבור <b>{permissionUser?.full_name}</b>.
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
            {/* View Option */}
            <div 
              onClick={() => setSelectedPermission('View')}
              className={`cursor-pointer rounded-xl border-2 p-4 transition-all relative overflow-hidden group
                ${selectedPermission === 'View' ? 'border-purple-500 bg-purple-50' : 'border-gray-200 hover:border-purple-200 hover:bg-gray-50'}
              `}
            >
              <div className="flex flex-col items-center text-center gap-3">
                <img src="https://cdn-icons-png.flaticon.com/128/2235/2235419.png" alt="View" className="w-12 h-12" />
                <h3 className="font-bold text-gray-800">צפייה בלבד (View)</h3>
                <p className="text-xs text-gray-500 leading-tight">מאפשר צפייה במערכת בלבד ללא ביצוע פעולות</p>
              </div>
              {selectedPermission === 'View' && (
                <div className="absolute top-2 right-2 text-purple-600"><Check className="w-5 h-5" /></div>
              )}
            </div>

            {/* RR Option */}
            <div 
              onClick={() => setSelectedPermission('RR')}
              className={`cursor-pointer rounded-xl border-2 p-4 transition-all relative overflow-hidden group
                ${selectedPermission === 'RR' ? 'border-orange-400 bg-orange-50' : 'border-gray-200 hover:border-orange-200 hover:bg-gray-50'}
              `}
            >
              <div className="flex flex-col items-center text-center gap-3">
                <img src="https://cdn-icons-png.flaticon.com/128/4133/4133589.png" alt="RR" className="w-12 h-12" />
                <h3 className="font-bold text-gray-800">משתמש רגיל (RR)</h3>
                <p className="text-xs text-gray-500 leading-tight">מאפשר צפייה וביצוע פעולות במערכת</p>
              </div>
              {selectedPermission === 'RR' && (
                <div className="absolute top-2 right-2 text-orange-500"><Check className="w-5 h-5" /></div>
              )}
            </div>
          </div>

          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button variant="outline" onClick={() => setIsPermissionsOpen(false)}>ביטול</Button>
            <Button onClick={handleSavePermissions} disabled={isSubmitting} className="bg-purple-600 hover:bg-purple-700 text-white">{isSubmitting ? 'מעדכן...' : 'שמור הרשאות'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* --- 4. DELETE / ARCHIVE MODAL --- */}
      <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <DialogContent className="sm:max-w-[400px] text-right" dir="rtl">
          <DialogHeader className="text-right">
            <DialogTitle className="flex items-center gap-2 text-xl text-red-600">
              <div className="bg-red-100 p-2 rounded-full"><AlertTriangle className="w-5 h-5 text-red-600" /></div>
              {isArchiveMode ? 'העברה לארכיון' : 'מחיקת משתמש'}
            </DialogTitle>
          </DialogHeader>

          <div className="py-4 space-y-4">
            {!isArchiveMode ? (
              <p className="text-gray-600">
                האם הנך בטוח שברצונך להסיר את <b>{userToDelete?.full_name}</b> מהמערכת?
                <br />פעולה זו אינה הפיכה.
              </p>
            ) : (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}>
                <Label className="mb-2 block text-gray-700">סיבת העברה לארכיון:</Label>
                <Textarea 
                  value={archiveReason} 
                  onChange={(e) => setArchiveReason(e.target.value)} 
                  placeholder="הכנס סיבה או הערה..."
                  className="bg-gray-50 focus:bg-white min-h-[80px]"
                />
              </motion.div>
            )}
          </div>

          <DialogFooter className="flex flex-col gap-2 w-full">
            <div className="flex gap-2 w-full">
              <Button onClick={handleDeleteConfirm} disabled={isSubmitting} className={`flex-1 ${isArchiveMode ? 'bg-orange-500 hover:bg-orange-600' : 'bg-red-600 hover:bg-red-700'} text-white`}>
                {isSubmitting ? 'מעבד...' : (isArchiveMode ? 'העבר לארכיון' : 'כן, מחיקה')}
              </Button>
              <Button variant="outline" onClick={() => setIsDeleteOpen(false)} className="flex-1">לא, ביטול</Button>
            </div>
            
            {/* Archive Toggle Button (Only visible if not already in archive mode) */}
            {!isArchiveMode && (
              <Button 
                variant="ghost" 
                onClick={() => setIsArchiveMode(true)}
                className="w-full text-gray-500 hover:text-gray-700 hover:bg-gray-100 gap-2 mt-2"
              >
                <Archive className="w-4 h-4" /> אפשרויות ארכיון
              </Button>
            )}
            
            {/* Cancel Archive Mode (Go back to delete) */}
            {isArchiveMode && (
              <Button 
                variant="ghost" 
                onClick={() => setIsArchiveMode(false)}
                className="w-full text-sm text-gray-400 hover:text-gray-600"
              >
                חזרה למחיקה רגילה
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </AnimatePresence>
  );
}