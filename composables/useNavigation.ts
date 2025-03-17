import { ref, computed } from '#imports'
import { useRouter } from '#app'

// Type definitions
interface MenuItem {
  label: string;
  icon?: string;
  path?: string;
  command?: () => void;
  items?: MenuItem[][][];
  visible?: boolean | ComputedRef<boolean>;
}

interface SectionItem {
  label: string;
  items: MenuItem[];
}

type Role = 'admin' | 'teacher' | 'counselor';

export function useNavigation() {
  const router = useRouter();
  const userRole = ref<Role>('admin');

  // Base menu items that will be used across roles
  const baseMenuItems: MenuItem[] = [
    {
      label: 'Dashboard',
      icon: 'pi pi-home',
      path: '/dashboard'
    },
    {
      label: 'Students',
      icon: 'pi pi-users',
      items: [
        [
          {
            label: 'Student Management',
            items: [
              { 
                label: 'All Students',
                icon: 'pi pi-list',
                path: '/students' 
              },
              { 
                label: 'Attendance',
                icon: 'pi pi-calendar-check',
                path: '/attendance' 
              },
              { 
                label: 'Assessments',
                icon: 'pi pi-chart-bar',
                path: '/assessments' 
              }
            ]
          },
          {
            label: 'Progress & Certifications',
            items: [
              { 
                label: 'Hours Tracking',
                icon: 'pi pi-clock',
                path: '/hours' 
              },
              { 
                label: 'Certifications',
                icon: 'pi pi-verified',
                path: '/certifications' 
              },
              { 
                label: 'Documents',
                icon: 'pi pi-file',
                path: '/documents' 
              }
            ]
          }
        ]
      ]
    },
    {
      label: 'Calendar',
      icon: 'pi pi-calendar',
      path: '/calendar'
    }
  ];

  // Role-specific menu items
  const roleSpecificMenuItems: Record<Role, MenuItem[]> = {
    admin: [
      {
        label: 'Leads',
        icon: 'pi pi-flag',
        path: '/leads'
      },
      {
        label: 'Tasks',
        icon: 'pi pi-check-square',
        path: '/tasks'
      },
      {
        label: 'Communications',
        icon: 'pi pi-envelope',
        items: [
          [
            {
              label: 'Communication Tools',
              items: [
                { 
                  label: 'Email Templates',
                  icon: 'pi pi-file-edit',
                  path: '/admin/templates' 
                },
                { 
                  label: 'Communication History',
                  icon: 'pi pi-history',
                  path: '/communications/history' 
                },
                { 
                  label: 'Bulk Messaging',
                  icon: 'pi pi-send',
                  path: '/communications/bulk' 
                }
              ]
            }
          ]
        ]
      },
      {
        label: 'Reports',
        icon: 'pi pi-chart-pie',
        path: '/reports'
      },
      {
        label: 'Administration',
        icon: 'pi pi-cog',
        items: [
          [
            {
              label: 'School Settings',
              items: [
                { 
                  label: 'User Management',
                  icon: 'pi pi-users',
                  path: '/admin/users' 
                },
                { 
                  label: 'System Settings',
                  icon: 'pi pi-cog',
                  path: '/admin/settings' 
                }
              ]
            }
          ]
        ]
      }
    ],
    teacher: [
      {
        label: 'Tasks',
        icon: 'pi pi-check-square',
        path: '/tasks'
      },
      {
        label: 'Communications',
        icon: 'pi pi-envelope',
        items: [
          [
            {
              label: 'Communication Tools',
              items: [
                { 
                  label: 'Communication History',
                  icon: 'pi pi-history',
                  path: '/communications/history' 
                }
              ]
            }
          ]
        ]
      }
    ],
    counselor: [
      {
        label: 'Leads',
        icon: 'pi pi-flag',
        path: '/leads'
      },
      {
        label: 'Tasks',
        icon: 'pi pi-check-square',
        path: '/tasks'
      },
      {
        label: 'Communications',
        icon: 'pi pi-envelope',
        items: [
          [
            {
              label: 'Communication Tools',
              items: [
                { 
                  label: 'Communication History',
                  icon: 'pi pi-history',
                  path: '/communications/history' 
                },
                { 
                  label: 'Bulk Messaging',
                  icon: 'pi pi-send',
                  path: '/communications/bulk' 
                }
              ]
            }
          ]
        ]
      },
      {
        label: 'Reports',
        icon: 'pi pi-chart-pie',
        path: '/reports/counselor'
      }
    ]
  };

  /**
   * Get navigation menu items based on current user role
   */
  const navigationItems = computed<MenuItem[]>(() => {
    // Combine base items with role-specific items
    const items = [...baseMenuItems];
    
    // Add role-specific items
    if (roleSpecificMenuItems[userRole.value]) {
      items.push(...roleSpecificMenuItems[userRole.value]);
    }
    
    // Add command functions to each item
    return addCommandsToItems(items);
  });

  /**
   * Get a flat list of all accessible routes for the current role
   */
  const accessibleRoutes = computed<string[]>(() => {
    const paths: string[] = [];
    
    // Extract all paths from the navigation structure
    function extractPaths(itemsArray: MenuItem[]) {
      itemsArray.forEach(item => {
        if (item.path) {
          paths.push(item.path);
        }
        
        if (item.items) {
          item.items.forEach(group => {
            group.forEach(section => {
              if (section.items) {
                extractPaths(section.items);
              }
            });
          });
        }
      });
    }
    
    extractPaths(navigationItems.value);
    return paths;
  });

  /**
   * Mobile-friendly menu items (converted from MegaMenu format to AccordionMenu format)
   */
  const mobileMenuItems = computed<MenuItem[]>(() => {
    return convertToMobileMenu(navigationItems.value);
  });

  /**
   * Set the user's role
   * @param {Role} role - User role (admin, teacher, counselor)
   */
  const setRole = (role: Role): void => {
    if (roleSpecificMenuItems[role]) {
      userRole.value = role;
    } else {
      console.warn(`Role "${role}" not found in navigation config`);
    }
  };

  /**
   * Check if a user has access to a specific route
   * @param {string} path - Route path to check
   * @returns {boolean} Whether the user has access
   */
  const hasRouteAccess = (path: string): boolean => {
    return accessibleRoutes.value.includes(path);
  };

  /**
   * Add command functions to menu items for router navigation
   * @param {MenuItem[]} items - Menu items
   * @returns {MenuItem[]} Menu items with command functions
   */
  function addCommandsToItems(items: MenuItem[]): MenuItem[] {
    return items.map(item => {
      const newItem = { ...item };
      
      // Add command function if item has a path
      if (newItem.path) {
        newItem.command = () => {
          router.push(newItem.path as string);
        };
      }
      
      // Process nested items
      if (newItem.items) {
        newItem.items = newItem.items.map(group => {
          return group.map(section => {
            return {
              ...section,
              items: section.items.map(subItem => {
                if (subItem.path) {
                  return {
                    ...subItem,
                    command: () => {
                      router.push(subItem.path as string);
                    }
                  };
                }
                return subItem;
              })
            };
          });
        });
      }
      
      return newItem;
    });
  }

  /**
   * Convert MegaMenu items to AccordionMenu format for mobile
   * @param {MenuItem[]} items - MegaMenu items
   * @returns {MenuItem[]} AccordionMenu items
   */
  function convertToMobileMenu(items: MenuItem[]): MenuItem[] {
    const mobileItems: MenuItem[] = [];
    
    items.forEach(item => {
      if (!item.items) {
        // Simple menu item
        mobileItems.push({
          label: item.label,
          icon: item.icon,
          command: item.command
        });
      } else {
        // Item with submenu
        const subItems: MenuItem[] = [];
        
        // Process each group and section
        item.items.forEach(group => {
          group.forEach(section => {
            // Add section items
            section.items.forEach(subItem => {
              subItems.push({
                label: subItem.label,
                icon: subItem.icon,
                command: subItem.command
              });
            });
          });
        });
        
        // Add the parent with children
        mobileItems.push({
          label: item.label,
          icon: item.icon,
          items: [subItems]
        });
      }
    });
    
    return mobileItems;
  }

  return {
    userRole,
    navigationItems,
    mobileMenuItems,
    accessibleRoutes,
    setRole,
    hasRouteAccess
  };
}