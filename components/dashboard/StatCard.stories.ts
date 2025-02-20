// stories/dashboard/StatCard.stories.ts
import type { Meta, StoryObj } from '@storybook/vue3';
import StatCard from '~/components/dashboard/StatCard.vue';

const meta = {
  title: 'Dashboard/StatCard',
  component: StatCard,
  tags: ['autodocs'],
  argTypes: {
    title: { control: 'text' },
    value: { control: 'text' },
    icon: { control: 'text' },
    color: { 
      control: 'select', 
      options: ['blue', 'green', 'yellow', 'red', 'purple'] 
    },
    trend: { control: 'number' },
    subtitle: { control: 'text' }
  },
  args: {
    title: 'Total Students',
    value: '254',
    icon: 'pi pi-users',
    color: 'blue',
    trend: 12,
    subtitle: 'Past 30 days'
  }
} satisfies Meta<typeof StatCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    title: 'Total Students',
    value: '254',
    icon: 'pi pi-users',
    color: 'blue',
    trend: 12,
    subtitle: 'Past 30 days'
  },
};

export const GreenCard: Story = {
  args: {
    title: 'Attendance Rate',
    value: '95%',
    icon: 'pi pi-check-circle',
    color: 'green',
    trend: 3,
    subtitle: 'Compared to last month'
  },
};

export const RedCard: Story = {
  args: {
    title: 'Dropouts',
    value: '8',
    icon: 'pi pi-exclamation-triangle',
    color: 'red',
    trend: -15,
    subtitle: 'Since last quarter'
  },
};

export const YellowCard: Story = {
  args: {
    title: 'Pending Certifications',
    value: '42',
    icon: 'pi pi-clock',
    color: 'yellow',
    trend: null,
    subtitle: 'Awaiting approval'
  },
};

export const PurpleCard: Story = {
  args: {
    title: 'New Leads',
    value: '67',
    icon: 'pi pi-bell',
    color: 'purple',
    trend: 24,
    subtitle: 'This week'
  },
};