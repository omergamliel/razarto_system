import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Settings, Plus, Trash2, Users, Edit2, AlertCircle, Save, Search, Shield } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

export default function AdminSettingsModal({ isOpen, onClose }) {
  const [activeTab, setActiveTab] = useState('users');
  const [editMode, setEditMode] = useState(false);
  const [newRoles, setNewRoles] = useState({});
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [editingRole, setEditingRole] = useState(null);
  const [editedName, setEditedName] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  
  // New states for permissions
  const [showAddPermission, setShowAddPermission] = useState(false);
  const [selectedUser, setSelectedUser] = useState('');
  const [selectedRole, setSelectedRole] = useState('');
  
  const queryClient = useQueryClient();

  // Fetch roles
  const { data: roles = [] } = useQuery({
    queryKey: ['role-definitions'],
    queryFn: () => base44.entities.RoleDefinition.list(),
    enabled: isOpen && activeTab === 'users'
  });

  // Fetch all users
  const { data: allUsers = [] } = useQuery({
    queryKey: ['all-users'],
    queryFn: () => base44.entities.User.list(),
    enabled: isOpen && activeTab === 'permissions'
  });

  // Filter privileged users (admin or manager)
  const privilegedUsers = allUsers.filter(u => 
    u.user_type === 'admin' || u.user_type === 'manager'
  );

  // Filter regular users (for adding permissions)
  const regularUsers = allUsers.filter(u => 
    !u.user_type || u.user_type === 'user'
  );

  const addRoleMutation = useMutation({
    mutationFn: ({ department, roleName }) => 
      base44.entities.RoleDefinition.create({
        department,
        role_name: roleName
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['role-definitions'] });
      toast.success('התפקיד נוסף בהצלחה');
    }
  });

  const updateRoleMutation = useMutation({
    mutationFn: ({ id, roleName }) =>
      base44.entities.RoleDefinition.update(id, { role_name: roleName }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['role-definitions'] });
      toast.success('התפקיד עודכן');
      setEditingRole(null);
    }
  });

  const deleteRoleMutation = useMutation({
    mutationFn: (id) => base44.entities.RoleDefinition.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['role-definitions'] });
      toast.success('התפקיד נמחק');
      setDeleteConfirm(null);
    }
  });

  const removeUserMutation = useMutation({
    mutationFn: async ({ id, userEmail }) => {
      await base44.entities.RoleDefinition.update(id, {
        assigned_user_name: null,
        assigned_user_email: null
      });
      
      if (userEmail) {
        const users = await base44.entities.User.filter({ email: userEmail });
        if (users.length > 0) {
          await base44.entities.User.update(users[0].id, {
            assigned_role: null,
            department: null
          });
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['role-definitions'] });
      toast.success('המשתמש הוסר מהתפקיד');
      setDeleteConfirm(null);
    }
  });

  // NEW: Change user permission level
  const changePermissionMutation = useMutation({
    mutationFn: async ({ userId, newRole }) => {
      return base44.entities.User.update(userId, { user_type: newRole });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['all-users'] });
      toast.success('ההרשאה עודכנה בהצלחה');
    }
  });

  // NEW: Add permission to a user
  const addPermissionMutation = useMutation({
    mutationFn: async () => {
      const user = allUsers.find(u => u.id === selectedUser);
      if (!user) throw new Error('משתמש לא נמצא');
      
      return base44.entities.User.update(user.id, { 
        user_type: selectedRole 
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['all-users'] });
      toast.success('ההרשאה נוספה בהצלחה');
      setShowAddPermission(false);
      setSelectedUser('');
      setSelectedRole('');
    }
  });

  const departments = [...new Set(roles.map(r => r.department))];

  const handleAddRole = (department) => {
    const roleName = newRoles[department];
    if (!roleName) return;
    addRoleMutation.mutate({ department, roleName });
    setNewRoles({ ...newRoles, [department]: '' });
  };

  const handleDelete = (item) => {
    if (item.type === 'role') {
      deleteRoleMutation.mutate(item.id);
    } else if (item.type === 'user') {
      removeUserMutation.mutate({ id: item.id, userEmail: item.email });
    }
  };

  const handleEditStart = (role) => {
    setEditingRole(role.id);
    setEditedName(role.role_name);
  };

  const handleEditSave = (id) => {
    if (!editedName) return;
    updateRoleMutation.mutate({ id, roleName: editedName });
  };

  const handleRoleChange = (userId, newRole) => {
    changePermissionMutation.mutate({ userId, newRole });
  };

  const handleAddPermission = () => {
    if (!selectedUser || !selectedRole) {
      toast.error('נא לבחור משתמש ותפקיד');
      return;
    }
    addPermissionMutation.mutate();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        />

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="relative bg-white rounded-3xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col"
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-gray-700 to-gray-800 p-5 md:p-6 text-white flex-shrink-0 rounded-t-3xl">
            <button
              onClick={onClose}
              className="absolute top-4 left-4 p-2 rounded-full hover:bg-white/20 transition-colors z-10"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-3">
              <Settings className="w-7 h-7 md:w-8 md:h-8" />
              <div>
                <h2 className="text-xl md:text-2xl font-bold">ניהול מערכת</h2>
                <p className="text-white/80 text-xs md:text-sm">משתמשים והרשאות</p>
              </div>
            </div>
          </div>

          {/* Tabs Navigation - Sticky */}
          <div className="sticky top-0 z-20 bg-white border-b border-gray-200 px-4 flex-shrink-0">
            <div className="flex gap-2">
              <button
                onClick={() => setActiveTab('users')}
                className={`
                  flex-1 flex items-center justify-center gap-2 py-4 px-4 font-semibold text-sm md:text-base
                  transition-all relative
                  ${activeTab === 'users' 
                    ? 'text-blue-600' 
                    : 'text-gray-500 hover:text-gray-700'
                  }
                `}
              >
                <img 
                  src="https://cdn-icons-png.flaticon.com/128/1357/1357616.png" 
                  alt="Users" 
                  className="w-5 h-5 md:w-6 md:h-6 object-contain opacity-80"
                />
                <span>משתמשים</span>
                {activeTab === 'users' && (
                  <motion.div 
                    layoutId="activeTab"
                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600"
                  />
                )}
              </button>
              
              <button
                onClick={() => setActiveTab('permissions')}
                className={`
                  flex-1 flex items-center justify-center gap-2 py-4 px-4 font-semibold text-sm md:text-base
                  transition-all relative
                  ${activeTab === 'permissions' 
                    ? 'text-blue-600' 
                    : 'text-gray-500 hover:text-gray-700'
                  }
                `}
              >
                <img 
                  src="https://cdn-icons-png.flaticon.com/128/747/747211.png" 
                  alt="Permissions" 
                  className="w-5 h-5 md:w-6 md:h-6 object-contain opacity-80"
                />
                <span>הרשאות</span>
                {activeTab === 'permissions' && (
                  <motion.div 
                    layoutId="activeTab"
                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600"
                  />
                )}
              </button>
            </div>
          </div>

          {/* Tab Content */}
          <div className="flex-1 overflow-y-auto">
            <AnimatePresence mode="wait">
              {/* TAB 1: USERS */}
              {activeTab === 'users' && (
                <motion.div
                  key="users"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="p-4 md:p-6"
                >
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-bold text-gray-800">ניהול תפקידים</h3>
                    <Button
                      onClick={() => setEditMode(!editMode)}
                      size="sm"
                      className={`${editMode ? 'bg-gray-800 text-white' : 'bg-gray-100 text-gray-800'} rounded-xl`}
                    >
                      <Edit2 className="w-4 h-4 ml-2" />
                      {editMode ? 'סיום עריכה' : 'מצב עריכה'}
                    </Button>
                  </div>

                  <div className="space-y-4">
                    {departments.map((dept) => (
                      <Card key={dept} className="p-4 md:p-6 border-2">
                        <h3 className="text-lg md:text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-[#64B5F6]" />
                          {dept}
                        </h3>

                        <div className="space-y-2 mb-4">
                          {roles
                            .filter(r => r.department === dept)
                            .map((role) => (
                              <div
                                key={role.id}
                                className="bg-gray-50 rounded-xl p-3 md:p-4 flex items-center justify-between"
                              >
                                <div className="flex-1 min-w-0">
                                  {editingRole === role.id ? (
                                    <div className="flex items-center gap-2">
                                      <Input
                                        value={editedName}
                                        onChange={(e) => setEditedName(e.target.value)}
                                        className="max-w-xs"
                                      />
                                      <Button
                                        size="sm"
                                        onClick={() => handleEditSave(role.id)}
                                        className="bg-green-500 hover:bg-green-600"
                                      >
                                        <Save className="w-4 h-4" />
                                      </Button>
                                      <Button
                                        size="sm"
                                        variant="ghost"
                                        onClick={() => setEditingRole(null)}
                                      >
                                        ביטול
                                      </Button>
                                    </div>
                                  ) : (
                                    <>
                                      <p className="font-semibold text-gray-800 text-sm md:text-base truncate">
                                        {role.role_name}
                                      </p>
                                      {role.assigned_user_name && (
                                        <div className="flex items-center gap-2 mt-1">
                                          <Users className="w-3 h-3 text-gray-500" />
                                          <span className="text-xs md:text-sm text-gray-600">
                                            {role.assigned_user_name}
                                          </span>
                                        </div>
                                      )}
                                    </>
                                  )}
                                </div>
                                {editMode && editingRole !== role.id && (
                                  <div className="flex gap-1 md:gap-2 flex-shrink-0">
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      onClick={() => handleEditStart(role)}
                                      className="text-blue-500 hover:bg-blue-50 p-2"
                                    >
                                      <Edit2 className="w-4 h-4" />
                                    </Button>
                                    {role.assigned_user_email && (
                                      <Button
                                        size="sm"
                                        variant="ghost"
                                        onClick={() => setDeleteConfirm({ 
                                          type: 'user', 
                                          id: role.id, 
                                          name: role.assigned_user_name, 
                                          email: role.assigned_user_email 
                                        })}
                                        className="text-orange-500 hover:bg-orange-50 p-2 hidden md:flex"
                                      >
                                        הסר
                                      </Button>
                                    )}
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      onClick={() => setDeleteConfirm({ 
                                        type: 'role', 
                                        id: role.id, 
                                        name: role.role_name 
                                      })}
                                      className="text-red-500 hover:bg-red-50 p-2"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </Button>
                                  </div>
                                )}
                              </div>
                            ))}
                        </div>

                        <div className="flex gap-2">
                          <Input
                            placeholder="הוסף תפקיד חדש..."
                            value={newRoles[dept] || ''}
                            onChange={(e) => setNewRoles({ ...newRoles, [dept]: e.target.value })}
                            className="rounded-xl text-sm md:text-base"
                          />
                          <Button
                            onClick={() => handleAddRole(dept)}
                            disabled={!newRoles[dept]}
                            className="bg-[#64B5F6] hover:bg-[#42A5F5] rounded-xl px-3 md:px-4"
                          >
                            <Plus className="w-4 h-4" />
                          </Button>
                        </div>
                      </Card>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* TAB 2: PERMISSIONS */}
              {activeTab === 'permissions' && (
                <motion.div
                  key="permissions"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="p-4 md:p-6"
                >
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 mb-6">
                    <div>
                      <h3 className="text-lg font-bold text-gray-800">ניהול הרשאות</h3>
                      <p className="text-xs text-gray-500">מנהלים ומפקחים</p>
                    </div>
                    <Button
                      onClick={() => setShowAddPermission(!showAddPermission)}
                      className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-xl w-full md:w-auto"
                    >
                      <img 
                        src="https://cdn-icons-png.flaticon.com/128/753/753317.png" 
                        alt="Add" 
                        className="w-4 h-4 ml-2 brightness-0 invert"
                      />
                      נתינת הרשאות
                    </Button>
                  </div>

                  {/* Add Permission Section */}
                  <AnimatePresence>
                    {showAddPermission && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="bg-blue-50 border border-blue-200 rounded-2xl p-4 md:p-5 mb-6"
                      >
                        <h4 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
                          <Shield className="w-5 h-5 text-blue-600" />
                          הוספת הרשאה למשתמש
                        </h4>
                        <div className="space-y-3">
                          <div>
                            <label className="text-sm font-medium text-gray-700 block mb-2">
                              בחר משתמש
                            </label>
                            <Select value={selectedUser} onValueChange={setSelectedUser}>
                              <SelectTrigger className="w-full rounded-xl">
                                <SelectValue placeholder="בחר משתמש מהרשימה" />
                              </SelectTrigger>
                              <SelectContent>
                                {regularUsers.map(user => (
                                  <SelectItem key={user.id} value={user.id}>
                                    {user.full_name} ({user.email})
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>

                          <div>
                            <label className="text-sm font-medium text-gray-700 block mb-2">
                              בחר רמת הרשאה
                            </label>
                            <Select value={selectedRole} onValueChange={setSelectedRole}>
                              <SelectTrigger className="w-full rounded-xl">
                                <SelectValue placeholder="בחר תפקיד" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="manager">מפקח (Manager)</SelectItem>
                                <SelectItem value="admin">מנהל (Admin)</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          <div className="flex gap-2 pt-2">
                            <Button
                              onClick={() => setShowAddPermission(false)}
                              variant="outline"
                              className="flex-1 rounded-xl"
                            >
                              ביטול
                            </Button>
                            <Button
                              onClick={handleAddPermission}
                              disabled={!selectedUser || !selectedRole}
                              className="flex-1 bg-blue-500 hover:bg-blue-600 text-white rounded-xl"
                            >
                              הוסף הרשאה
                            </Button>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Privileged Users List */}
                  <div className="space-y-3">
                    {privilegedUsers.length === 0 ? (
                      <div className="text-center py-12 bg-gray-50 rounded-2xl border border-dashed border-gray-300">
                        <Shield className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                        <p className="text-gray-500 font-medium">אין משתמשים עם הרשאות מיוחדות</p>
                        <p className="text-xs text-gray-400 mt-1">לחץ על "נתינת הרשאות" כדי להוסיף</p>
                      </div>
                    ) : (
                      privilegedUsers.map(user => (
                        <Card key={user.id} className="p-4 border-2 hover:shadow-md transition-shadow">
                          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <Users className="w-4 h-4 text-gray-500 flex-shrink-0" />
                                <p className="font-bold text-gray-800 truncate">
                                  {user.full_name}
                                </p>
                              </div>
                              <p className="text-xs text-gray-500 truncate">{user.email}</p>
                            </div>
                            
                            <div className="flex items-center gap-2">
                              <Select 
                                value={user.user_type} 
                                onValueChange={(value) => handleRoleChange(user.id, value)}
                              >
                                <SelectTrigger className="w-full md:w-40 h-10 rounded-xl">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="admin">מנהל (Admin)</SelectItem>
                                  <SelectItem value="manager">מפקח (Manager)</SelectItem>
                                  <SelectItem value="user">משתמש רגיל</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                        </Card>
                      ))
                    )}
                  </div>

                  {/* Info Box */}
                  <div className="bg-gradient-to-br from-indigo-50 to-blue-50 border border-indigo-200 rounded-xl p-4 mt-6">
                    <p className="text-sm text-indigo-900">
                      <span className="font-bold">💡 הסבר:</span> מנהלים ומפקחים יכולים לנהל משמרות, לאשר החלפות ולערוך תפקידים. 
                      המערכת מעניקה להם גישה מלאה לכל הפונקציות הניהוליות.
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>

        {/* Delete Confirmation Dialog */}
        <Dialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-red-500" />
                אישור מחיקה
              </DialogTitle>
              <DialogDescription>
                {deleteConfirm?.type === 'role' 
                  ? `האם אתה בטוח שברצונך למחוק את התפקיד "${deleteConfirm?.name}"?`
                  : `האם אתה בטוח שברצונך להסיר את המשתמש "${deleteConfirm?.name}" מהתפקיד?`
                }
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDeleteConfirm(null)}>
                ביטול
              </Button>
              <Button
                variant="destructive"
                onClick={() => handleDelete(deleteConfirm)}
              >
                אישור מחיקה
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AnimatePresence>
  );
}