// stories/dashboard/AttendanceCard.stories.ts
import type { Meta, StoryObj } from '@storybook/vue3';
import AttendanceCard from '~/components/dashboard/AttendanceCard.vue';

// Mock data for different time periods
const mockAttendanceData = {
  week: {
    labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
    present: [42, 45, 40, 38, 44],
    absent: [5, 3, 7, 8, 4],
    late: [3, 2, 3, 4, 2],
    stats: [
      { type: 'present', label: 'Attendance Rate', value: 89, unit: '%' },
      { type: 'absent', label: 'Absence Rate', value: 6.8, unit: '%' },
      { type: 'late', label: 'Tardiness Rate', value: 4.2, unit: '%' }
    ]
  },
  month: {
    labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4'],
    present: [210, 205, 215, 209],
    absent: [18, 22, 15, 19],
    late: [12, 13, 10, 12],
    stats: [
      { type: 'present', label: 'Attendance Rate', value: 90.2, unit: '%' },
      { type: 'absent', label: 'Absence Rate', value: 5.9, unit: '%' },
      { type: 'late', label: 'Tardiness Rate', value: 3.9, unit: '%' }
    ]
  },
  quarter: {
    labels: ['Jan', 'Feb', 'Mar'],
    present: [840, 760, 820],
    absent: [75, 82, 70],
    late: [45, 38, 42],
    stats: [
      { type: 'present', label: 'Attendance Rate', value: 88.7, unit: '%' },
      { type: 'absent', label: 'Absence Rate', value: 7.1, unit: '%' },
      { type: 'late', label: 'Tardiness Rate', value: 4.2, unit: '%' }
    ]
  },
  year: {
    labels: ['Q1', 'Q2', 'Q3', 'Q4'],
    present: [2420, 2380, 2450, 2490],
    absent: [210, 230, 190, 180],
    late: [130, 140, 120, 110],
    stats: [
      { type: 'present', label: 'Attendance Rate', value: 89.3, unit: '%' },
      { type: 'absent', label: 'Absence Rate', value: 6.8, unit: '%' },
      { type: 'late', label: 'Tardiness Rate', value: 3.9, unit: '%' }
    ]
  }
};

// Mock the fetch function
window.$fetch = async (url: string, options: any) => {
  if (url === '/api/attendance/dashboard') {
    const period = options?.params?.period || 'week';
    return Promise.resolve({ data: mockAttendanceData[period as keyof typeof mockAttendanceData] });
  }
  return Promise.reject(new Error('Not found'));
};

const meta = {
  title: 'Dashboard/AttendanceCard',
  component: AttendanceCard,
  tags: ['autodocs'],
  argTypes: {
    initialPeriod: { 
      control: 'select',
      options: ['week', 'month', 'quarter', 'year']
    }
  },
  args: {
    initialPeriod: 'week'
  },
  decorators: [
    () => ({
      template: '<div style="max-width: 700px; margin: 0 auto;"><story /></div>'
    })
  ]
} satisfies Meta<typeof AttendanceCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const ThisWeek: Story = {
  args: {
    initialPeriod: 'week'
  }
};

export const ThisMonth: Story = {
  args: {
    initialPeriod: 'month'
  }
};

export const ThisQuarter: Story = {
  args: {
    initialPeriod: 'quarter'
  }
};

export const ThisYear: Story = {
  args: {
    initialPeriod: 'year'
  }
};

export const Loading: Story = {
  args: {
    initialPeriod: 'week'
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
    initialPeriod: 'week'
  },
  decorators: [
    () => {
      // Override $fetch to simulate an error
      window.$fetch = () => Promise.reject(new Error('Failed to fetch attendance data'));
      return {};
    }
  ]
};