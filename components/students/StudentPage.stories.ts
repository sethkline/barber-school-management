// pages/students/Students.stories.ts
import type { Meta, StoryObj } from '@storybook/vue3';
import Students from '~/components/students/StudentsPage.vue';

// Mock students data
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
  }
];

// Additional mock data for student details
const mockAssessments = [
  {
    id: 'ass-001',
    student_id: '123e4567-e89b-12d3-a456-426614174000',
    assessment_date: '2023-10-10',
    assessment_type: 'Midterm Exam',
    score: 85,
    comment: 'Good work on the practical portion. Theory needs improvement.',
    created_at: '2023-10-10T14:00:00Z'
  }
];

const mockAttendance = [
  {
    id: 'att-001',
    student_id: '123e4567-e89b-12d3-a456-426614174000',
    attendance_date: '2023-10-15',
    status: 'present',
    clock_in: '2023-10-15T08:45:00Z',
    clock_out: '2023-10-15T15:30:00Z',
    created_at: '2023-10-15T08:45:00Z'
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
  }
];

const mockCertifications = [
  {
    id: 'cert-001',
    student_id: '123e4567-e89b-12d3-a456-426614174000',
    certification_name: 'First Aid & CPR',
    awarded_date: '2023-09-15',
    expiration_date: '2025-09-15'
  }
];

// Define the component meta
const meta: Meta<typeof Students> = {
  title: 'Pages/Students',
  component: Students,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
    fetchMock: {
      mocks: [
        {
          matcher: {
            name: 'getStudents',
            url: '/api/students',
            method: 'GET',
            query: {
              page: '1',
              limit: '10'
            }
          },
          response: {
            status: 200,
            body: {
              data: mockStudents,
              count: mockStudents.length
            }
          }
        },
        {
          matcher: {
            name: 'getStudentDetails',
            url: '/api/students/123e4567-e89b-12d3-a456-426614174000',
            method: 'GET'
          },
          response: {
            status: 200,
            body: mockStudents[0]
          }
        },
        {
          matcher: {
            name: 'getStudentAssessments',
            url: '/api/students/123e4567-e89b-12d3-a456-426614174000/assessments',
            method: 'GET'
          },
          response: {
            status: 200,
            body: { data: mockAssessments }
          }
        },
        {
          matcher: {
            name: 'getStudentAttendance',
            url: '/api/students/123e4567-e89b-12d3-a456-426614174000/attendance',
            method: 'GET'
          },
          response: {
            status: 200,
            body: { data: mockAttendance }
          }
        },
        {
          matcher: {
            name: 'getStudentDocuments',
            url: '/api/students/123e4567-e89b-12d3-a456-426614174000/documents',
            method: 'GET'
          },
          response: {
            status: 200,
            body: { data: mockDocuments }
          }
        },
        {
          matcher: {
            name: 'getStudentCertifications',
            url: '/api/students/123e4567-e89b-12d3-a456-426614174000/certifications',
            method: 'GET'
          },
          response: {
            status: 200,
            body: { data: mockCertifications }
          }
        },
        {
          matcher: {
            name: 'createStudent',
            url: '/api/students',
            method: 'POST'
          },
          response: {
            status: 201,
            body: {
              id: '623e4567-e89b-12d3-a456-426614174005',
              ...mockStudents[0],
              first_name: 'New',
              last_name: 'Student',
              email: 'new.student@example.com'
            }
          }
        },
        {
          matcher: {
            name: 'updateStudent',
            url: '/api/students/123e4567-e89b-12d3-a456-426614174000',
            method: 'PUT'
          },
          response: {
            status: 200,
            body: mockStudents[0]
          }
        },
        {
          matcher: {
            name: 'deleteStudent',
            url: '/api/students/123e4567-e89b-12d3-a456-426614174000',
            method: 'DELETE'
          },
          response: {
            status: 200,
            body: { success: true }
          }
        },
        {
          matcher: {
            name: 'uploadDocument',
            url: '/api/students/123e4567-e89b-12d3-a456-426614174000/documents',
            method: 'POST'
          },
          response: {
            status: 201,
            body: {
              id: 'new-doc-001',
              student_id: '123e4567-e89b-12d3-a456-426614174000',
              document_name: 'Uploaded Document',
              file_url: 'https://example.com/documents/new-document.pdf',
              uploaded_at: new Date().toISOString(),
              expiration_date: null
            }
          }
        }
      ]
    }
  }
};

export default meta;
type Story = StoryObj<typeof Students>;

// Define stories
export const Default: Story = {};

export const WithStudentDetailsOpen: Story = {
  play: async ({ canvasElement }) => {
    // This would typically use a testing library like Playwright to simulate
    // user interactions, but for simplicity we'll just delay to allow the page to load
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Find and click the view button for the first student
    // Note: In a real scenario, you would use a more robust selector
    const viewButton = canvasElement.querySelector('.pi-eye');
    if (viewButton) {
      (viewButton as HTMLElement).click();
    }
  }
};

export const AddNewStudentFlow: Story = {
  play: async ({ canvasElement }) => {
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Find and click the Add Student button
    const addButton = Array.from(canvasElement.querySelectorAll('button'))
      .find(btn => btn.textContent?.includes('Add Student'));
    
    if (addButton) {
      addButton.click();
    }
  }
};