// components/students/StudentDetail.stories.ts
import type { Meta, StoryObj } from '@storybook/vue3';
import StudentDetail from '~/components/students/StudentDetail.vue';
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

const mockAttendance = [
  {
    id: 'att-001',
    student_id: '123e4567-e89b-12d3-a456-426614174000',
    attendance_date: '2023-10-15',
    status: 'present',
    clock_in: '2023-10-15T08:45:00Z',
    clock_out: '2023-10-15T15:30:00Z',
    created_at: '2023-10-15T08:45:00Z'
  },
  {
    id: 'att-002',
    student_id: '123e4567-e89b-12d3-a456-426614174000',
    attendance_date: '2023-10-16',
    status: 'late',
    clock_in: '2023-10-16T09:15:00Z',
    clock_out: '2023-10-16T15:30:00Z',
    created_at: '2023-10-16T09:15:00Z'
  },
  {
    id: 'att-003',
    student_id: '123e4567-e89b-12d3-a456-426614174000',
    attendance_date: '2023-10-17',
    status: 'absent',
    clock_in: null,
    clock_out: null,
    created_at: '2023-10-17T08:00:00Z'
  }
];

const mockAssessments = [
  {
    id: 'ass-001',
    student_id: '123e4567-e89b-12d3-a456-426614174000',
    assessment_date: '2023-10-10',
    assessment_type: 'Midterm Exam',
    score: 85,
    comment: 'Good work on the practical portion. Theory needs improvement.',
    created_at: '2023-10-10T14:00:00Z'
  },
  {
    id: 'ass-002',
    student_id: '123e4567-e89b-12d3-a456-426614174000',
    assessment_date: '2023-11-05',
    assessment_type: 'Practical Skills Test',
    score: 92,
    comment: 'Excellent attention to detail and technique.',
    created_at: '2023-11-05T11:30:00Z'
  }
];

const mockDocuments = [
  {
    id: 'doc-001',
    student_id: '123e4567-e89b-12d3-a456-426614174000',
    document_name: 'Enrollment Agreement',
    file_url: 'https://example.com/documents/enrollment-agreement.pdf',
    uploaded_at: '2023-08-20T09:15:00Z',
    expiration_date: null
  },
  {
    id: 'doc-002',
    student_id: '123e4567-e89b-12d3-a456-426614174000',
    document_name: 'Health Insurance Card',
    file_url: 'https://example.com/documents/insurance-card.pdf',
    uploaded_at: '2023-08-22T14:30:00Z',
    expiration_date: '2024-12-31'
  }
];

const mockCertifications = [
  {
    id: 'cert-001',
    student_id: '123e4567-e89b-12d3-a456-426614174000',
    certification_name: 'First Aid & CPR',
    awarded_date: '2023-09-15',
    expiration_date: '2025-09-15'
  },
  {
    id: 'cert-002',
    student_id: '123e4567-e89b-12d3-a456-426614174000',
    certification_name: 'OSHA Safety',
    awarded_date: '2023-10-20',
    expiration_date: '2026-10-20'
  }
];

// Define the component meta
const meta: Meta<typeof StudentDetail> = {
  title: 'Students/StudentDetail',
  component: StudentDetail,
  tags: ['autodocs'],
  args: {
    visible: true,
    student: mockStudent,
    loading: false
  },
  argTypes: {
    'update:visible': { action: 'update:visible' },
    'edit-student': { action: 'edit-student' },
    'add-assessment': { action: 'add-assessment' },
    'upload-document': { action: 'upload-document' },
    'delete-document': { action: 'delete-document' },
    'add-certification': { action: 'add-certification' },
    'edit-certification': { action: 'edit-certification' },
    'delete-certification': { action: 'delete-certification' }
  },
  parameters: {
    fetchMock: {
      mocks: [
        {
          matcher: {
            name: 'getAttendance',
            url: `/api/students/${mockStudent.id}/attendance`,
            method: 'GET'
          },
          response: {
            status: 200,
            body: { data: mockAttendance }
          }
        },
        {
          matcher: {
            name: 'getAssessments',
            url: `/api/students/${mockStudent.id}/assessments`,
            method: 'GET'
          },
          response: {
            status: 200,
            body: { data: mockAssessments }
          }
        },
        {
          matcher: {
            name: 'getDocuments',
            url: `/api/students/${mockStudent.id}/documents`,
            method: 'GET'
          },
          response: {
            status: 200,
            body: { data: mockDocuments }
          }
        },
        {
          matcher: {
            name: 'getCertifications',
            url: `/api/students/${mockStudent.id}/certifications`,
            method: 'GET'
          },
          response: {
            status: 200,
            body: { data: mockCertifications }
          }
        }
      ]
    }
  }
};

export default meta;
type Story = StoryObj<typeof StudentDetail>;

// Define stories
export const Default: Story = {
  render: (args) => ({
    components: { StudentDetail },
    setup() {
      const visible = ref(args.visible);
      return { ...args, visible };
    },
    template: `
      <div class="p-4">
        <StudentDetail
          v-model:visible="visible"
          :student="student"
          :loading="loading"
          @edit-student="args['edit-student']"
          @add-assessment="args['add-assessment']"
          @upload-document="args['upload-document']"
          @delete-document="args['delete-document']"
          @add-certification="args['add-certification']"
          @edit-certification="args['edit-certification']"
          @delete-certification="args['delete-certification']"
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

export const StudentNotFound: Story = {
  args: {
    student: {} // Empty student object
  }
};

export const WithPhoto: Story = {
  args: {
    student: {
      ...mockStudent,
      photo_url: 'https://randomuser.me/api/portraits/women/45.jpg'
    }
  }
};

export const GraduatedStudent: Story = {
  args: {
    student: {
      ...mockStudent,
      status: 'graduated',
      expected_graduation_date: '2023-06-15'
    }
  }
};