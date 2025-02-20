// stories/dashboard/UpcomingTasksCard.stories.ts
import type { Meta, StoryObj } from '@storybook/vue3';
import UpcomingTasksCard from '~/components/dashboard/UpcomingTasksCard.vue';
import { useToast } from 'primevue/usetoast';

// Mock data
const mockTasksData = [
  {
    id: '1',
    description: 'Follow up with John Doe about enrollment',
    due_date: new Date().toISOString().split('T')[0], // Today
    assigned_to: 'Sarah Johnson',
    status: 'pending',
    priority: 'high',
    lead_id: '101'
  },
  {
    id: '2',
    description: 'Schedule interview with potential student',
    due_date: new Date(Date.now() + 86400000).toISOString().split('T')[0], // Tomorrow
    assigned_to: 'Mike Peters',
    status: 'in_progress',
    priority: 'medium',
    lead_id: '102'
  },
  {
    id: '3',
    description: 'Review application materials',
    due_date: new Date(Date.now() + 172800000).toISOString().split('T')[0], // Day after tomorrow
    assigned_to: 'Sarah Johnson',
    status: 'pending',
    priority: 'low',
    lead_id: '103'
  },
  {
    id: '4',
    description: 'Send welcome packet to new enrollees',
    due_date: new Date(Date.now() - 86400000).toISOString().split('T')[0], // Yesterday (overdue)
    assigned_to: 'David Williams',
    status: 'pending',
    priority: 'high',
    lead_id: '104'
  },
  {
    id: '5',
    description: 'Update course materials for next semester',
    due_date: new Date(Date.now() + 604800000).toISOString().split('T')[0], // Next week
    assigned_to: 'Jennifer Lopez',
    status: 'completed',
    priority: 'medium',
    lead_id: null
  }
];

// Mock the $fetch function
window.$fetch = async (url: string, options?: any) => {
  if (url === '/api/tasks/upcoming') {
    return Promise.resolve({ data: mockTasksData });
  }
  
  if (url.includes('/api/tasks/') && url.includes('/complete')) {
    const taskId = url.split('/')[2];
    // Return success response
    return Promise.resolve({ success: true });
  }
  
  return Promise.reject(new Error('Not found'));
};

// Mock the useToast function
window.useToast = () => ({
  add: (message: any) => console.log('Toast:', message)
});

const meta = {
  title: 'Dashboard/UpcomingTasksCard',
  component: UpcomingTasksCard,
  tags: ['autodocs'],
  argTypes: {
    limit: { control: 'number' }
  },
  args: {
    limit: 5
  },
  // Mock nuxt-link component
  parameters: {
    nuxtLink: {
      mockComponent: true
    }
  },
  decorators: [
    () => ({
      template: '<div style="max-width: 600px; margin: 0 auto;"><story /></div>'
    })
  ]
} satisfies Meta<typeof UpcomingTasksCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    limit: 5
  }
};

export const Loading: Story = {
  args: {
    limit: 5
  },
  decorators: [
    () => {
      // Override $fetch to make it take longer
      window.$fetch = () => new Promise(resolve => {
        // Never resolve to keep it in loading state
        setTimeout(() => {}, 10000);
      });
      
      return {};
    }
  ]
};

export const Error: Story = {
  args: {
    limit: 5
  },
  decorators: [
    () => {
      // Override $fetch to simulate an error
      window.$fetch = () => Promise.reject(new Error('Failed to connect to server'));
      return {};
    }
  ]
};

export const EmptyState: Story = {
  args: {
    limit: 5
  },
  decorators: [
    () => {
      // Override $fetch to return empty data
      window.$fetch = async () => ({ data: [] });
      return {};
    }
  ]
};

export const CompletedTasks: Story = {
  args: {
    limit: 5
  },
  decorators: [
    () => {
      // Override $fetch to return tasks that are all completed
      window.$fetch = async () => ({ 
        data: mockTasksData.map(task => ({ ...task, status: 'completed' }))
      });
      return {};
    }
  ]
};