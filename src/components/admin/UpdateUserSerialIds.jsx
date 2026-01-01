import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

export default function UpdateUserSerialIds() {
  const [isUpdating, setIsUpdating] = useState(false);
  const [hasRun, setHasRun] = useState(false);

  useEffect(() => {
    const updateSerialIds = async () => {
      if (hasRun || isUpdating) return;
      
      try {
        setIsUpdating(true);
        
        // Fetch all users
        const users = await base44.entities.User.list();
        
        // Filter users that don't have serial_id yet
        const usersNeedingUpdate = users.filter(u => !u.serial_id);
        
        if (usersNeedingUpdate.length === 0) {
          console.log('✅ All users already have serial_id');
          setHasRun(true);
          return;
        }
        
        // Get the highest existing serial_id
        const existingSerialIds = users
          .filter(u => u.serial_id)
          .map(u => u.serial_id);
        
        let nextSerialId = existingSerialIds.length > 0 
          ? Math.max(...existingSerialIds) + 1 
          : 1;
        
        // Update each user sequentially
        for (const user of usersNeedingUpdate) {
          await base44.entities.User.update(user.id, {
            serial_id: nextSerialId
          });
          console.log(`✅ Updated user ${user.email} with serial_id: ${nextSerialId}`);
          nextSerialId++;
        }
        
        console.log(`✅ Successfully updated ${usersNeedingUpdate.length} users with serial_id`);
        setHasRun(true);
        
      } catch (error) {
        console.error('❌ Error updating serial_ids:', error);
      } finally {
        setIsUpdating(false);
      }
    };
    
    updateSerialIds();
  }, [hasRun, isUpdating]);

  return null; // This component doesn't render anything
}