// Organization structure configuration
// This data is now stored in the database

export const organizationConfig = {
  // Default organization settings
  defaultSchoolName: 'AgendaIQ School',
  defaultDistrictName: 'AgendaIQ District',
  
  // Common department categories
  departmentCategories: [
    'Academic',
    'Administrative', 
    'Support Services',
    'Operations',
    'Leadership'
  ],
  
  // Common role categories
  roleCategories: [
    'Staff',
    'Teacher',
    'Administrator',
    'Support',
    'Substitute'
  ],
  
  // System roles that should always exist
  systemRoles: [
    'Administrator',
    'Principal',
    'Teacher'
  ],
  
  // System departments that should always exist
  systemDepartments: [
    'Administration',
    'Elementary Education Department',
    'Middle School Department',
    'High School Department'
  ]
};

// Helper functions for organization data
export const getOrganizationDefaults = () => organizationConfig;

export const isSystemRole = (roleTitle: string): boolean => {
  return organizationConfig.systemRoles.includes(roleTitle);
};

export const isSystemDepartment = (departmentName: string): boolean => {
  return organizationConfig.systemDepartments.includes(departmentName);
};

export default organizationConfig; 