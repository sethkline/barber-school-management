<template>
  <div class="bg-white rounded-lg shadow">
    <div class="flex items-center justify-between p-4 border-b border-gray-200">
      <h2 class="text-lg font-medium text-gray-900">Program Requirements</h2>
      <div>
        <Button
          type="button"
          label="Add Program"
          icon="pi pi-plus"
          @click="openCreateProgramModal"
          :loading="isLoading"
        />
      </div>
    </div>
    
    <div v-if="isLoading" class="flex justify-center items-center p-6">
      <ProgressSpinner style="width:50px;height:50px" strokeWidth="4" />
    </div>
    
    <div v-else-if="error" class="p-6 text-center text-red-600">
      <i class="pi pi-exclamation-circle text-3xl mb-2"></i>
      <p>{{ error }}</p>
      <Button 
        label="Try Again" 
        icon="pi pi-refresh" 
        class="mt-2" 
        severity="secondary"
        @click="fetchProgramRequirements"
      />
    </div>
    
    <div v-else-if="programRequirements.length === 0" class="p-6 text-center text-gray-500">
      <i class="pi pi-book text-3xl mb-2 text-gray-400"></i>
      <p>No program requirements found</p>
      <Button 
        label="Add Program Requirement" 
        icon="pi pi-plus" 
        class="mt-2" 
        @click="openCreateProgramModal"
      />
    </div>
    
    <div v-else>
      <DataTable
        :value="programRequirements"
        responsiveLayout="scroll"
        stripedRows
        class="p-datatable-sm"
      >
        <Column field="program_name" header="Program Name" sortable>
          <template #body="{ data }">
            {{ data.program_name }}
          </template>
        </Column>
        
        <Column field="required_hours" header="Required Hours" sortable>
          <template #body="{ data }">
            {{ data.required_hours }} hours
          </template>
        </Column>
        
        <Column field="certification_name" header="Certification" sortable>
          <template #body="{ data }">
            {{ data.certification_name }}
          </template>
        </Column>
        
        <Column field="is_active" header="Status" sortable>
          <template #body="{ data }">
            <Tag 
              :value="data.is_active ? 'Active' : 'Inactive'"
              :severity="data.is_active ? 'success' : 'danger'"
            />
          </template>
        </Column>
        
        <Column header="Actions" :exportable="false" style="min-width:12rem">
          <template #body="{ data }">
            <div class="flex gap-2">
              <Button
                icon="pi pi-pencil"
                rounded
                text
                severity="info"
                @click="openEditProgramModal(data)"
                aria-label="Edit"
              />
              <Button
                icon="pi pi-trash"
                rounded
                text
                severity="danger"
                @click="openDeleteProgramModal(data)"
                aria-label="Delete"
              />
            </div>
          </template>
        </Column>
      </DataTable>
    </div>
    
    <!-- Program Requirement Form Modal -->
    <Dialog
      v-model:visible="isProgramRequirementModalOpen"
      :style="{width: '550px'}"
      :header="requirementFormMode === 'create' ? 'Add Program Requirement' : 'Edit Program Requirement'"
      :modal="true"
      :closable="!isLoading"
    >
      <div v-if="isLoading" class="flex justify-center items-center p-4">
        <ProgressSpinner style="width:50px;height:50px" strokeWidth="4" />
      </div>
      <div v-else>
        <form @submit.prevent="handleSaveProgram" class="p-4">
          <!-- Program Name -->
          <div class="field mb-4">
            <label for="program_name" class="block text-sm font-medium text-gray-700 mb-1">
              Program Name*
            </label>
            <InputText
              id="program_name"
              v-model.trim="programForm.program_name"
              class="w-full"
              :class="{'p-invalid': programErrors.program_name}"
              placeholder="Enter program name"
            />
            <small class="p-error" v-if="programErrors.program_name">
              {{ programErrors.program_name }}
            </small>
          </div>
          
          <!-- Required Hours -->
          <div class="field mb-4">
            <label for="required_hours" class="block text-sm font-medium text-gray-700 mb-1">
              Required Hours*
            </label>
            <InputNumber
              id="required_hours"
              v-model="programForm.required_hours"
              class="w-full"
              :class="{'p-invalid': programErrors.required_hours}"
              placeholder="Enter required hours"
              :min="0"
            />
            <small class="p-error" v-if="programErrors.required_hours">
              {{ programErrors.required_hours }}
            </small>
          </div>
          
          <!-- Certification Name -->
          <div class="field mb-4">
            <label for="certification_name" class="block text-sm font-medium text-gray-700 mb-1">
              Certification Name*
            </label>
            <InputText
              id="certification_name"
              v-model.trim="programForm.certification_name"
              class="w-full"
              :class="{'p-invalid': programErrors.certification_name}"
              placeholder="Enter certification name"
            />
            <small class="p-error" v-if="programErrors.certification_name">
              {{ programErrors.certification_name }}
            </small>
          </div>
          
          <!-- Description -->
          <div class="field mb-4">
            <label for="description" class="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <Textarea
              id="description"
              v-model="programForm.description"
              rows="3"
              class="w-full"
              placeholder="Enter program description"
            />
          </div>
          
          <!-- Active Status -->
          <div class="field mb-4">
            <div class="flex items-center">
              <Checkbox
                id="is_active"
                v-model="programForm.is_active"
                :binary="true"
              />
              <label for="is_active" class="ml-2 text-sm text-gray-700">
                Active Program
              </label>
            </div>
          </div>
          
          <div class="flex justify-end gap-2 mt-4">
            <Button
              type="button"
              label="Cancel"
              icon="pi pi-times"
              @click="isProgramRequirementModalOpen = false"
              class="p-button-text"
              :disabled="isLoading"
            />
            <Button
              type="submit"
              label="Save"
              icon="pi pi-check"
              :loading="isLoading"
            />
          </div>
        </form>
      </div>
    </Dialog>
    
    <!-- Delete Program Confirmation Modal -->
    <Dialog
      v-model:visible="isDeleteProgramModalOpen"
      :style="{width: '450px'}"
      header="Confirm Deletion"
      :modal="true"
      :closable="!isLoading"
    >
      <div class="p-4">
        <div class="flex items-start">
          <i class="pi pi-exclamation-triangle text-red-500 text-2xl mr-4 mt-0.5"></i>
          <div>
            <h3 class="text-lg font-medium text-gray-900 mb-2">Delete Program Requirement</h3>
            <p class="text-gray-600">
              Are you sure you want to delete the program requirement for 
              <span class="font-medium text-gray-900">
                {{ selectedRequirement?.program_name }}
              </span>?
            </p>
            <div class="mt-3">
              <p class="text-sm text-red-600">This action cannot be undone.</p>
            </div>
          </div>
        </div>
      </div>
      
      <template #footer>
        <div class="flex justify-end gap-2">
          <Button
            label="Cancel"
            icon="pi pi-times"
            @click="isDeleteProgramModalOpen = false"
            class="p-button-text"
            :disabled="isLoading"
          />
          <Button
            label="Delete"
            icon="pi pi-trash"
            severity="danger"
            :loading="isLoading"
            @click="handleDeleteProgram"
          />
        </div>
      </template>
    </Dialog>
  </div>
</template>

<script setup lang="ts">
import { reactive, onMounted } from 'vue'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import Button from 'primevue/button'
import Dialog from 'primevue/dialog'
import InputText from 'primevue/inputtext'
import InputNumber from 'primevue/inputnumber'
import Textarea from 'primevue/textarea'
import Checkbox from 'primevue/checkbox'
import Tag from 'primevue/tag'
import ProgressSpinner from 'primevue/progressspinner'
import useSettings from '~/composables/useSettings'
import type { ProgramRequirement } from '~/server/services/settingsService'

const {
  programRequirements,
  selectedRequirement,
  isLoading,
  error,
  requirementFormMode,
  isProgramRequirementModalOpen,
  isDeleteProgramModalOpen,
  fetchProgramRequirements,
  addProgramRequirement,
  updateProgramRequirement,
  deleteProgramRequirement,
  openCreateProgramModal,
  openEditProgramModal,
  openDeleteProgramModal
} = useSettings()

// Form for program requirement
const programForm = reactive<ProgramRequirement>({
  program_name: '',
  required_hours: 0,
  certification_name: '',
  description: '',
  is_active: true
})

// Validation errors
const programErrors = reactive({
  program_name: '',
  required_hours: '',
  certification_name: ''
})

// Load program requirements when component mounts
onMounted(() => {
  fetchProgramRequirements()
})

// Reset validation errors
function resetProgramErrors() {
  Object.keys(programErrors).forEach(key => {
    programErrors[key] = ''
  })
}

// Form validation
function validateProgramForm() {
  let isValid = true
  resetProgramErrors()
  
  if (!programForm.program_name) {
    programErrors.program_name = 'Program name is required'
    isValid = false
  }
  
  if (programForm.required_hours === undefined || programForm.required_hours === null) {
    programErrors.required_hours = 'Required hours is required'
    isValid = false
  } else if (programForm.required_hours < 0) {
    programErrors.required_hours = 'Required hours must be a positive number'
    isValid = false
  }
  
  if (!programForm.certification_name) {
    programErrors.certification_name = 'Certification name is required'
    isValid = false
  }
  
  return isValid
}

// Save program requirement (create or update)
async function handleSaveProgram() {
  if (!validateProgramForm()) {
    return
  }
  
  try {
    if (requirementFormMode === 'create') {
      await addProgramRequirement(programForm)
    } else if (selectedRequirement?.id) {
      await updateProgramRequirement(selectedRequirement.id, programForm)
    }
    
    isProgramRequirementModalOpen.value = false
  } catch (err) {
    // Error is already handled in the composable
  }
}

// Delete program requirement
async function handleDeleteProgram() {
  if (!selectedRequirement?.id) return
  
  try {
    await deleteProgramRequirement(selectedRequirement.id)
    isDeleteProgramModalOpen.value = false
  } catch (err) {
    // Error is already handled in the composable
  }
}
</script>