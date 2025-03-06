// components/students/StudentList.stories.ts
import type { Meta, StoryObj } from '@storybook/vue3';
import StudentList from './StudentList.vue';

// Mock data
const mockStudents = [
  {
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
  },
  {
    id: '223e4567-e89b-12d3-a456-426614174001',
    first_name: 'John',
    last_name: 'Doe',
    email: 'john.doe@example.com',
    phone: '(555) 987-6543',
    address: '456 Oak Avenue',
    city: 'Springfield',
    zip_code: '12345',
    enrollment_date: '2023-08-15',
    expected_graduation_date: '2025-05-30',
    status: 'current',
    photo_url: null,
    created_at: '2023-08-10T09:45:00Z'
  },
  {
    id: '323e4567-e89b-12d3-a456-426614174002',
    first_name: 'Maria',
    last_name: 'Garcia',
    email: 'maria.garcia@example.com',
    phone: '(555) 456-7890',
    address: '789 Pine Street',
    city: 'Springfield',
    zip_code: '12345',
    enrollment_date: '2023-09-10',
    expected_graduation_date: '2025-06-30',
    status: 'on_leave',
    photo_url: null,
    created_at: '2023-09-05T14:20:00Z'
  },
  {
    id: '423e4567-e89b-12d3-a456-426614174003',
    first_name: 'David',
    last_name: 'Wilson',
    email: 'david.wilson@example.com',
    phone: '(555) 234-5678',
    address: '101 Maple Drive',
    city: 'Springfield',
    zip_code: '12345',
    enrollment_date: '2022-01-15',
    expected_graduation_date: '2024-01-15',
    status: 'graduated',
    photo_url: null,
    created_at: '2021-12-20T11:10:00Z'
  },
  {
    id: '523e4567-e89b-12d3-a456-426614174004',
    first_name: 'Sarah',
    last_name: 'Johnson',
    email: 'sarah.johnson@example.com',
    phone: '(555) 876-5432',
    address: '222 Elm Boulevard',
    city: 'Springfield',
    zip_code: '12345',
    enrollment_date: '2023-10-01',
    expected_graduation_date: '2025-07-15',
    status: 'pending',
    photo_url: null,
    created_at: '2023-09-25T16:35:00Z'
  }
];

// Define the component meta
const meta: Meta<typeof StudentList> = {
  title: 'Students/StudentList',
  component: StudentList,
  tags: ['autodocs'],
  args: {
    students: mockStudents,
    totalRecords: mockStudents.length,
    loading: false,
    error: '',
    limit: 10
  },
  argTypes: {
    'page-change': { action: 'page-change' },
    'reload': { action: 'reload' },
    'add-student': { action: 'add-student' },
    'edit-student': { action: 'edit-student' },
    'view-student': { action: 'view-student' },
    'delete-student': { action: 'delete-student' }
  }
};

export default meta;
type Story = StoryObj<typeof StudentList>;

// Define stories
export const Default: Story = {
  render: (args) => ({
    components: { StudentList },
    setup() {
      return { args };
    },
    template: `
      <div class="p-4">
        <StudentList
          :students="args.students"
          :totalRecords="args.totalRecords"
          :loading="args.loading"
          :error="args.error"
          :limit="args.limit"
          @page-change="args['page-change']"
          @reload="args.reload"
          @add-student="args['add-student']"
          @edit-student="args['edit-student']"
          @view-student="args['view-student']"
          @delete-student="args['delete-student']"
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

export const WithError: Story = {
  args: {
    error: 'Failed to load students. Please try again.',
    students: []
  }
};

export const EmptyList: Story = {
  args: {
    students: [],
    totalRecords: 0
  }
};

export const Pagination: Story = {
  args: {
    totalRecords: 50,
    students: mockStudents
  }
};

export const FilteredByStatus: Story = {
  render: (args) => ({
    components: { StudentList },
    setup() {
      // Filter to only show 'current' students
      const filteredStudents = mockStudents.filter(s => s.status === 'current');
      return { 
        ...args,
        filteredStudents,
        totalRecords: filteredStudents.length
      };
    },
    template: `
      <div class="p-4">
        <div class="mb-4 p-3 bg-blue-50 border border-blue-200 rounded text-sm">
          <strong>Note:</strong> This example shows the list filtered to only display students with 'current' status
        </div>
        <StudentList
          :students="filteredStudents"
          :totalRecords="totalRecords"
          :loading="args.loading"
          :error="args.error"
          :limit="args.limit"
          @page-change="args['page-change']"
          @reload="args.reload"
          @add-student="args['add-student']"
          @edit-student="args['edit-student']"
          @view-student="args['view-student']"
          @delete-student="args['delete-student']"
        />
      </div>
    `
  })
};