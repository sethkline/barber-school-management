// stories/dashboard/RecentStudentsTable.stories.ts
import type { Meta, StoryObj } from '@storybook/vue3';
import RecentStudentsTable from '~/components/dashboard/RecentStudentsTable.vue';

// Mock data
const mockStudentsData = [
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
];

const meta = {
  title: 'Dashboard/RecentStudentsTable',
  component: RecentStudentsTable,
  tags: ['autodocs'],
  argTypes: {
    limit: { control: 'number' },
    mockData: { control: 'object' },
    isTesting: { control: 'boolean' }
  },
  parameters: {
    nuxtLink: {
      mockComponent: true
    }
  },
  decorators: [
    (story) => ({
      components: { story },
      template: '<div style="max-width: 900px; margin: 0 auto;"><story /></div>'
    })
  ]
} satisfies Meta<typeof RecentStudentsTable>;

export default meta;
type Story = StoryObj<typeof meta>;

// Use mock data approach for the Default story
export const Default: Story = {
  args: {
    limit: 5,
    mockData: mockStudentsData,
    isTesting: true
  }
};

export const Loading: Story = {
  args: {
    limit: 5,
    isTesting: false
  },
  decorators: [
    (story) => {
      // Override $fetch to make it take longer
      window.$fetch = () => new Promise(resolve => {
        // Never resolve to keep it in loading state
        setTimeout(() => {}, 10000);
      });
      
      return {
        components: { story },
        template: '<div style="max-width: 900px; margin: 0 auto;"><story /></div>'
      };
    }
  ]
};

export const Error: Story = {
  args: {
    limit: 5,
    isTesting: true,
    mockError: 'Failed to connect to server'
  }
};

export const EmptyState: Story = {
  args: {
    limit: 5,
    mockData: [],
    isTesting: true
  }
};