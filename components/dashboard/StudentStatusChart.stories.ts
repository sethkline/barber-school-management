// stories/dashboard/StudentStatusChart.stories.ts
import type { Meta, StoryObj } from '@storybook/vue3';
import StudentStatusChart from '~/components/dashboard/StudentStatusChart.vue';

// Mock data for different time periods
const mockStatusData = {
  all: [
    { status: 'current', count: 185 },
    { status: 'on_leave', count: 27 },
    { status: 'withdrawn', count: 32 },
    { status: 'graduated', count: 120 },
    { status: 'pending', count: 15 }
  ],
  year: [
    { status: 'current', count: 112 },
    { status: 'on_leave', count: 18 },
    { status: 'withdrawn', count: 14 },
    { status: 'graduated', count: 45 },
    { status: 'pending', count: 12 }
  ],
  quarter: [
    { status: 'current', count: 54 },
    { status: 'on_leave', count: 8 },
    { status: 'withdrawn', count: 6 },
    { status: 'graduated', count: 12 },
    { status: 'pending', count: 9 }
  ],
  month: [
    { status: 'current', count: 22 },
    { status: 'on_leave', count: 3 },
    { status: 'withdrawn', count: 2 },
    { status: 'graduated', count: 5 },
    { status: 'pending', count: 4 }
  ]
};

// Mock the fetch function
window.$fetch = async (url: string, options: any) => {
  if (url === '/api/students/status-counts') {
    const period = options?.params?.period || 'all';
    return Promise.resolve({ data: mockStatusData[period as keyof typeof mockStatusData] });
  }
  return Promise.reject(new Error('Not found'));
};

const meta = {
  title: 'Dashboard/StudentStatusChart',
  component: StudentStatusChart,
  tags: ['autodocs'],
  argTypes: {
    initialPeriod: { 
      control: 'select',
      options: ['all', 'year', 'quarter', 'month']
    }
  },
  args: {
    initialPeriod: 'all'
  },
  decorators: [
    () => ({
      template: '<div style="max-width: 600px; margin: 0 auto;"><story /></div>'
    })
  ]
} satisfies Meta<typeof StudentStatusChart>;

export default meta;
type Story = StoryObj<typeof meta>;

export const AllTime: Story = {
  args: {
    initialPeriod: 'all'
  }
};

export const ThisYear: Story = {
  args: {
    initialPeriod: 'year'
  }
};

export const ThisQuarter: Story = {
  args: {
    initialPeriod: 'quarter'
  }
};

export const ThisMonth: Story = {
  args: {
    initialPeriod: 'month'
  }
};

export const Loading: Story = {
  args: {
    initialPeriod: 'all'
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
    initialPeriod: 'all'
  },
  decorators: [
    () => {
      // Override $fetch to simulate an error
      window.$fetch = () => Promise.reject(new Error('Failed to fetch status data'));
      return {};
    }
  ]
};

export const EmptyData: Story = {
  args: {
    initialPeriod: 'all'
  },
  decorators: [
    () => {
      // Override $fetch to return empty data
      window.$fetch = async () => ({ data: [] });
      return {};
    }
  ]
};