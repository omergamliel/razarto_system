import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Settings, Plus, Trash2, Users, Edit2, AlertCircle } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card } from "@/components/ui/card";
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
  const [editMode, setEditMode] = useState(false);
  const [newRoles, setNewRoles] = useState({});
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const queryClient = useQueryClient();

  const { data: roles = [] } = useQuery({
    queryKey: ['role-definitions'],
    queryFn: () => base44.entities.RoleDefinition.list(),
    enabled: isOpen
  });

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

  const deleteRoleMutation = useMutation({
    mutationFn: (id) => base44.entities.RoleDefinition.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['role-definitions'] });
      toast.success('התפקיד נמחק');
      setDeleteConfirm(null);
    }
  });

  const removeUserMutation = useMutation({
    mutationFn: ({ id }) => 
      base44.entities.RoleDefinition.update(id, {
        assigned_user_name: '',
        assigned_user_email: ''
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['role-definitions'] });
      toast.success('המשתמש הוסר מהתפקיד');
      setDeleteConfirm(null);
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
      removeUserMutation.mutate({ id: item.id });
    }
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
          className="relative bg-white rounded-3xl shadow-2xl w-full max-w-4xl max-h-[85vh] overflow-hidden flex flex-col"
        >
          <div className="bg-gradient-to-r from-gray-700 to-gray-800 p-6 text-white">
            <button
              onClick={onClose}
              className="absolute top-4 left-4 p-2 rounded-full hover:bg-white/20 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Settings className="w-8 h-8" />
                <div>
                  <h2 className="text-2xl font-bold">ניהול מערכת</h2>
                  <p className="text-white/80 text-sm">מבנה ארגוני ותפקידים</p>
                </div>
              </div>
              <Button
                onClick={() => setEditMode(!editMode)}
                className={`${editMode ? 'bg-white text-gray-800' : 'bg-white/20'} hover:bg-white hover:text-gray-800`}
              >
                <Edit2 className="w-4 h-4 mr-2" />
                {editMode ? 'סיום עריכה' : 'מצב עריכה'}
              </Button>
            </div>
          </div>

          <ScrollArea className="flex-1 p-6">
            <div className="space-y-6">
              {departments.map((dept) => (
                <Card key={dept} className="p-6 border-2">
                  <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-[#64B5F6]" />
                    {dept}
                  </h3>

                  <div className="space-y-3 mb-4 max-h-64 overflow-y-auto">
                    {roles
                      .filter(r => r.department === dept)
                      .map((role) => (
                        <div
                          key={role.id}
                          className="bg-gray-50 rounded-xl p-4 flex items-center justify-between"
                        >
                          <div className="flex-1">
                            <p className="font-semibold text-gray-800">{role.role_name}</p>
                            {role.assigned_user_name && (
                              <div className="flex items-center gap-2 mt-1">
                                <Users className="w-3 h-3 text-gray-500" />
                                <span className="text-sm text-gray-600">
                                  {role.assigned_user_name}
                                </span>
                              </div>
                            )}
                          </div>
                          {editMode && (
                            <div className="flex gap-2">
                              {role.assigned_user_email && (
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => setDeleteConfirm({ type: 'user', id: role.id, name: role.assigned_user_name })}
                                  className="text-orange-500 hover:text-orange-700 hover:bg-orange-50"
                                >
                                  הסר משתמש
                                </Button>
                              )}
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => setDeleteConfirm({ type: 'role', id: role.id, name: role.role_name })}
                                className="text-red-500 hover:text-red-700 hover:bg-red-50"
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
                      className="rounded-xl"
                    />
                    <Button
                      onClick={() => handleAddRole(dept)}
                      disabled={!newRoles[dept]}
                      className="bg-[#64B5F6] hover:bg-[#42A5F5] rounded-xl"
                    >
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          </ScrollArea>
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