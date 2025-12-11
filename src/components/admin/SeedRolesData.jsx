import { useEffect } from 'react';
import { base44 } from '@/api/base44Client';

const INITIAL_ROLES = [
  // Department 'ש'
  { department: 'ש', role_name: 'אוה"ד' },
  { department: 'ש', role_name: 'שליטה' },
  { department: 'ש', role_name: 'ביטחון' },
  { department: 'ש', role_name: 'דיגיטל' },
  { department: 'ש', role_name: 'צבאי מערכתי' },
  // Department 'מ'
  { department: 'מ', role_name: 'דרום' },
  { department: 'מ', role_name: 'מרכז' },
  { department: 'מ', role_name: 'צפון' },
  { department: 'מ', role_name: 'עורף' },
  { department: 'מ', role_name: 'מבצעים' },
  { department: 'מ', role_name: 'סייבר' },
  { department: 'מ', role_name: 'תה"ם' },
  // Department 'ת'
  { department: 'ת', role_name: 'תקיפה' },
  { department: 'ת', role_name: 'ח"ח' },
  { department: 'ת', role_name: 'רציפות התפקוד' },
  { department: 'ת', role_name: 'גיו"כ' },
  { department: 'ת', role_name: 'עומק' },
  { department: 'ת', role_name: 'מעג"ש' },
  { department: 'ת', role_name: 'תב"ל' },
  { department: 'ת', role_name: 'תכנון' }
];

export default function SeedRolesData() {
  useEffect(() => {
    const seedRoles = async () => {
      try {
        const existingRoles = await base44.entities.RoleDefinition.list();
        
        // Only seed if DB is empty
        if (existingRoles.length === 0) {
          await base44.entities.RoleDefinition.bulkCreate(INITIAL_ROLES);
          console.log('✅ RoleDefinition seeded with 20 roles');
        }
      } catch (error) {
        console.error('Failed to seed roles:', error);
      }
    };

    seedRoles();
  }, []);

  return null; // This is a utility component, renders nothing
}