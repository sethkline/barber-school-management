// components/students/StudentDeleteConfirmation.stories.ts
import type { Meta, StoryObj } from '@storybook/vue3';
import StudentDeleteConfirmation from './StudentDeleteConfirmation.vue';
import { ref } from 'vue';

// Mock data
const mockStudent = {
  id: '123e4567-e89b-12d3-a456-426614174000',
  first_name: 'Jane',
  last_name: 'Smith',
  email: 'jane.smith@example.com',
  phone: '(555) 123-4567',
  status: 'current'
};

// Define the component meta
const meta: Meta<typeof StudentDeleteConfirmation> = {
  title: 'Students/StudentDeleteConfirmation',
  component: StudentDeleteConfirmation,
  tags: ['autodocs'],
  args: {
    visible: true,
    student: mockStudent,
    loading: false,
    archiveOption: true
  },
  argTypes: {
    'update:visible': { action: 'update:visible' },
    'confirm-delete': { action: 'confirm-delete' }
  }
};

export default meta;
type Story = StoryObj<typeof StudentDeleteConfirmation>;

// Define stories
export const Default: Story = {
  render: (args) => ({
    components: { StudentDeleteConfirmation },
    setup() {
      const visible = ref(args.visible);
      return { ...args, visible };
    },
    template: `
      <div class="p-4">
        <StudentDeleteConfirmation
          v-model:visible="visible"
          :student="student"
          :loading="loading"
          :archiveOption="archiveOption"
          @confirm-delete="args['confirm-delete']"
        />
      </div>
    `
  })
};

export const Loading: Story = {
  args: {
    loading: true
  }
};

export const WithoutArchiveOption: Story = {
  args: {
    archiveOption: false
  }
};

export const GraduatedStudent: Story = {
  args: {
    student: {
      ...mockStudent,
      status: 'graduated'
    }
  }
};

export const WithdrawStudent: Story = {
  args: {
    student: {
      ...mockStudent,
      status: 'withdrawn'
    }
  }
};