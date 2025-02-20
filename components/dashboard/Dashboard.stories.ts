import type { Meta, StoryObj } from '@storybook/vue3';
import { createPinia } from 'pinia';
import Dashboard from '~/components/dashboard/Dashboard.vue';
import { useUserStore } from '~/stores/user';

// Create store setup helper
const setupStore = (userData = {}) => {
  const pinia = createPinia();
  const userStore = useUserStore(pinia);
  userStore.setUser({
    id: '123',
    email: 'admin@example.com',
    firstName: 'Admin',
    lastName: 'User',
    role: 'admin',
    isAuthenticated: true,
    ...userData
  });
  return { pinia, userStore };
};

// Mock dashboard stats
const mockDashboardStats = {
  totalStudents: '254',
  studentsTrend: 12,
  newLeads: '67',
  leadsTrend: 24,
  attendanceRate: 95.2,
  attendanceTrend: 3.5,
  upcomingCerts: '42'
};

// Mock all the API calls needed by dashboard
window.$fetch = async (url: string) => {
  if (url === '/api/dashboard/stats') {
    return { data: mockDashboardStats };
  }
  
  // Handle component-specific API calls (reusing mock data from component stories)
  if (url === '/api/students/recent') {
    return {
      data: [
        {
          id: '1',
          first_name: 'John',
          last_name: 'Doe',
          email: 'john.doe@example.com',
          status: 'current',
          enrollment_date: '2023-09-01',
          photo_url: null
        },
        {
          id: '2',
          first_name: 'Jane',
          last_name: 'Smith',
          email: 'jane.smith@example.com',
          status: 'on_leave',
          enrollment_date: '2023-08-15', 
          photo_url: null
        },
        {
          id: '3',
          first_name: 'Michael',
          last_name: 'Johnson',
          email: 'michael.j@example.com',
          status: 'current',
          enrollment_date: '2023-07-20',
          photo_url: null
        },
        {
          id: '4',
          first_name: 'Emily',
          last_name: 'Williams',
          email: 'emily.w@example.com',
          status: 'graduated',
          enrollment_date: '2022-01-10',
          photo_url: null
        },
        {
          id: '5',
          first_name: 'David',
          last_name: 'Brown',
          email: 'david.b@example.com',
          status: 'withdrawn',
          enrollment_date: '2023-05-05',
          photo_url: null
        }
      ]
    };
  }
  
  if (url === '/api/students/status-counts') {
    return {
      data: [
        { status: 'current', count: 185 },
        { status: 'on_leave', count: 27 },
        { status: 'withdrawn', count: 32 },
        { status: 'graduated', count: 120 },
        { status: 'pending', count: 15 }
      ]
    };
  }
  
  if (url === '/api/tasks/upcoming') {
    return {
      data: [
        {
          id: '1',
          description: 'Follow up with John Doe about enrollment',
          due_date: new Date().toISOString().split('T')[0],
          assigned_to: 'Sarah Johnson',
          status: 'pending',
          priority: 'high',
          lead_id: '101'
        },
        {
          id: '2',
          description: 'Schedule interview with potential student',
          due_date: new Date(Date.now() + 86400000).toISOString().split('T')[0],
          assigned_to: 'Mike Peters',
          status: 'in_progress',
          priority: 'medium',
          lead_id: '102'
        },
        {
          id: '3',
          description: 'Review application materials',
          due_date: new Date(Date.now() + 172800000).toISOString().split('T')[0],
          assigned_to: 'Sarah Johnson',
          status: 'pending',
          priority: 'low',
          lead_id: '103'
        }
      ]
    };
  }
  
  if (url === '/api/attendance/dashboard') {
    return {
      data: {
        labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
        present: [42, 45, 40, 38, 44],
        absent: [5, 3, 7, 8, 4],
        late: [3, 2, 3, 4, 2],
        stats: [
          { type: 'present', label: 'Attendance Rate', value: 89, unit: '%' },
          { type: 'absent', label: 'Absence Rate', value: 6.8, unit: '%' },
          { type: 'late', label: 'Tardiness Rate', value: 4.2, unit: '%' }
        ]
      }
    };
  }
  
  return Promise.reject(new Error('Not found'));
};

// Mock the useToast function
window.useToast = () => ({
  add: (message: any) => console.log('Toast:', message)
});

const meta = {
  title: 'Pages/Dashboard',
  component: Dashboard,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
    nuxtLink: {
      mockComponent: true
    }
  },
  decorators: [
    (story) => {
      const { pinia } = setupStore();
      return {
        components: { story },
        setup() {
          return { pinia };
        },
        template: `
          <div>
            <story />
          </div>
        `,
      };
    }
  ]
} satisfies Meta<typeof Dashboard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Administrator: Story = {
  decorators: [
    () => {
      const { pinia } = setupStore({
        firstName: 'Jane',
        lastName: 'Admin',
        role: 'administrator'
      });
      return { pinia };
    }
  ]
};

export const Instructor: Story = {
  decorators: [
    () => {
      const { pinia } = setupStore({
        firstName: 'Michael',
        lastName: 'Teacher',
        role: 'instructor'
      });
      return { pinia };
    }
  ]
};

export const NoUserName: Story = {
  decorators: [
    () => {
      const { pinia } = setupStore({
        firstName: null,
        lastName: null
      });
      return { pinia };
    }
  ]
};

export const Mobile: Story = {
  parameters: {
    viewport: {
      defaultViewport: 'mobile1'
    }
  }
};

export const Tablet: Story = {
  parameters: {
    viewport: {
      defaultViewport: 'tablet'
    }
  }
};