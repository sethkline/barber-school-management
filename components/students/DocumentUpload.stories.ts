// components/students/DocumentUpload.stories.ts
import type { Meta, StoryObj } from '@storybook/vue3';
import DocumentUpload from './DocumentUpload.vue';
import { ref } from 'vue';

// Define the component meta
const meta: Meta<typeof DocumentUpload> = {
  title: 'Students/DocumentUpload',
  component: DocumentUpload,
  tags: ['autodocs'],
  args: {
    visible: true,
    studentId: '123e4567-e89b-12d3-a456-426614174000',
    loading: false
  },
  argTypes: {
    'update:visible': { action: 'update:visible' },
    'upload-document': { action: 'upload-document' }
  }
};

export default meta;
type Story = StoryObj<typeof DocumentUpload>;

// Define stories
export const Default: Story = {
  render: (args) => ({
    components: { DocumentUpload },
    setup() {
      const visible = ref(args.visible);
      return { ...args, visible };
    },
    template: `
      <div class="p-4">
        <DocumentUpload
          v-model:visible="visible"
          :studentId="studentId"
          :loading="loading"
          @upload-document="args['upload-document']"
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

export const WithPrefilledDocumentName: Story = {
  render: (args) => ({
    components: { DocumentUpload },
    setup() {
      const visible = ref(true);
      
      // Simulate component with pre-filled data
      setTimeout(() => {
        const nameInput = document.getElementById('document_name') as HTMLInputElement;
        if (nameInput) {
          nameInput.value = 'Medical Certificate';
          nameInput.dispatchEvent(new Event('input'));
        }
      }, 100);
      
      return { ...args, visible };
    },
    template: `
      <div class="p-4">
        <DocumentUpload
          v-model:visible="visible"
          :studentId="studentId"
          :loading="loading"
          @upload-document="args['upload-document']"
        />
        <div class="mt-4 p-4 bg-blue-50 border border-blue-200 rounded text-sm">
          <strong>Note:</strong> This example pre-fills the document name field automatically
        </div>
      </div>
    `
  })
};

export const WithValidationErrors: Story = {
  render: (args) => ({
    components: { DocumentUpload },
    setup() {
      const visible = ref(true);
      // Function to simulate form submission with validation errors
      const onUpload = () => {
        args['upload-document']();
        // The component will handle showing validation errors internally when 
        // clicked without filling in required fields
      };
      return { ...args, visible, onUpload };
    },
    template: `
      <div class="p-4">
        <DocumentUpload
          v-model:visible="visible"
          :studentId="studentId"
          :loading="loading"
          @upload-document="onUpload"
        />
        <div class="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded text-sm">
          <strong>Note:</strong> Click Upload without filling required fields to see validation errors
        </div>
      </div>
    `
  })
};

export const WithExpirationDate: Story = {
  render: (args) => ({
    components: { DocumentUpload },
    setup() {
      const visible = ref(true);
      
      // Simulate component with expiration date selected
      setTimeout(() => {
        const nameInput = document.getElementById('document_name') as HTMLInputElement;
        if (nameInput) {
          nameInput.value = 'Driver\'s License';
          nameInput.dispatchEvent(new Event('input'));
        }
        
        // Note: Setting calendar value would require more complex DOM manipulation
        // that might not work reliably in Storybook
      }, 100);
      
      return { ...args, visible };
    },
    template: `
      <div class="p-4">
        <DocumentUpload
          v-model:visible="visible"
          :studentId="studentId"
          :loading="loading"
          @upload-document="args['upload-document']"
        />
        <div class="mt-4 p-4 bg-blue-50 border border-blue-200 rounded text-sm">
          <strong>Example:</strong> Driver's License upload would typically include an expiration date
        </div>
      </div>
    `
  })
};