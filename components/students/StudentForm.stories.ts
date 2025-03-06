// components/students/StudentForm.stories.ts
import type { Meta, StoryObj } from '@storybook/vue3';
import StudentForm from './StudentForm.vue';
import { ref } from 'vue';

// Mock data
const mockStudent = {
  id: '123e4567-e89b-12d3-a456-426614174000',
  first_name: 'Jane',
  last_name: 'Smith',
  email: 'jane.smith@example.com',
  phone: '(555) 123-4567',
  address: '123 Main Street',
  city: 'Springfield',
  zip_code: '12345',
  enrollment_date: '2023-09-01',
  expected_graduation_date: '2025-06-15',
  status: 'current',
  photo_url: null,
  created_at: '2023-08-15T10:30:00Z'
};

// Define the component meta
const meta: Meta<typeof StudentForm> = {
  title: 'Students/StudentForm',
  component: StudentForm,
  tags: ['autodocs'],
  args: {
    visible: true,
    studentData: {},
    loading: false
  },
  argTypes: {
    'update:visible': { action: 'update:visible' },
    'save': { action: 'save' }
  }
};

export default meta;
type Story = StoryObj<typeof StudentForm>;

// Define stories
export const AddNewStudent: Story = {
  render: (args) => ({
    components: { StudentForm },
    setup() {
      const visible = ref(args.visible);
      return { ...args, visible };
    },
    template: `
      <div class="p-4">
        <StudentForm
          v-model:visible="visible"
          :studentData="studentData"
          :loading="loading"
          @save="args.save"
        />
      </div>
    `
  })
};

export const EditExistingStudent: Story = {
  args: {
    studentData: mockStudent
  }
};

export const LoadingState: Story = {
  args: {
    loading: true,
    studentData: mockStudent
  }
};

export const WithValidationErrors: Story = {
  render: (args) => ({
    components: { StudentForm },
    setup() {
      const visible = ref(true);
      // Function to simulate form submission with validation errors
      const onSave = (data) => {
        args.save(data);
        // The component will handle showing validation errors internally
      };
      return { ...args, visible, onSave };
    },
    template: `
      <div class="p-4">
        <StudentForm
          v-model:visible="visible"
          :studentData="{}"
          :loading="false"
          @save="onSave"
        />
        <div class="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded text-sm">
          <strong>Note:</strong> Click Save without filling required fields to see validation errors
        </div>
      </div>
    `
  })
};