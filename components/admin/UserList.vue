<template>
  <div class="bg-white rounded-lg shadow">
    <div class="flex items-center justify-between p-4 border-b border-gray-200">
      <h2 class="text-lg font-medium text-gray-900">User Management</h2>
      <div class="flex items-center space-x-2">
        <span class="text-sm text-gray-500 mr-2"> {{ totalCount }} total users </span>
        <Button icon="pi pi-plus" label="Add User" class="p-button-primary" @click="openCreateModal" />
      </div>
    </div>

    <div v-if="isLoading" class="flex justify-center items-center p-6">
      <ProgressSpinner style="width: 50px; height: 50px" strokeWidth="4" />
    </div>

    <div v-else-if="error" class="p-6 text-center text-red-600">
      <i class="pi pi-exclamation-circle text-3xl mb-2"></i>
      <p>{{ error }}</p>
      <Button label="Try Again" icon="pi pi-refresh" class="mt-2" severity="secondary" @click="fetchUsers" />
    </div>

    <div v-else>
      <DataTable
        :value="users"
        :paginator="true"
        :rows="filters.limit"
        :totalRecords="totalCount"
        :rowsPerPageOptions="[10, 20, 50]"
        currentPageReportTemplate="Showing {first} to {last} of {totalRecords} users"
        paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
        responsiveLayout="scroll"
        stripedRows
        class="p-datatable-sm"
        @page="onPageChange($event.page + 1)"
        v-model:filters="tableFilters"
        filterDisplay="menu"
        :globalFilterFields="['first_name', 'last_name', 'email', 'role']"
      >
        <template #header>
          <div class="flex justify-between items-center">
            <div>
              <span class="p-input-icon-left">
                <IconField>
                  <InputIcon>
                    <i class="pi pi-search" />
                  </InputIcon>
                  <InputText
                    v-model="filters.search"
                    placeholder="Search users..."
                    class="p-inputtext-sm"
                    @input="onSearchChange"
                  />
                </IconField>
              </span>
            </div>
            <div>
              <Dropdown
                v-model="filters.role"
                :options="roleOptions"
                optionLabel="label"
                optionValue="value"
                placeholder="Filter by Role"
                class="w-48"
                @change="onRoleChange"
              />
            </div>
          </div>
        </template>

        <Column field="first_name" header="First Name" sortable>
          <template #body="{ data }">
            {{ data.first_name }}
          </template>
        </Column>

        <Column field="last_name" header="Last Name" sortable>
          <template #body="{ data }">
            {{ data.last_name }}
          </template>
        </Column>

        <Column field="email" header="Email">
          <template #body="{ data }">
            {{ data.email }}
          </template>
        </Column>

        <Column field="role" header="Role" sortable>
          <template #body="{ data }">
            <Tag :value="formatRole(data.role)" :severity="getRoleSeverity(data.role)" />
          </template>
        </Column>

        <Column field="is_active" header="Status" sortable>
          <template #body="{ data }">
            <Tag :value="data.is_active ? 'Active' : 'Inactive'" :severity="data.is_active ? 'success' : 'danger'" />
          </template>
        </Column>

        <Column header="Actions" :exportable="false" style="min-width: 12rem">
          <template #body="{ data }">
            <div class="flex gap-2">
              <Button
                icon="pi pi-pencil"
                rounded
                text
                severity="info"
                @click="openEditModal(data.id)"
                aria-label="Edit"
              />
              <Button
                icon="pi pi-key"
                rounded
                text
                severity="warning"
                @click="openResetPasswordModal(data)"
                aria-label="Reset Password"
              />
              <Button
                icon="pi pi-trash"
                rounded
                text
                severity="danger"
                @click="openDeleteModal(data)"
                aria-label="Delete"
              />
            </div>
          </template>
        </Column>
      </DataTable>
    </div>

    <!-- User Form Modal -->
    <AdminUserForm
      v-model:visible="isModalOpen"
      :user="selectedUser"
      :loading="isLoading"
      :mode="formMode"
      @save="handleSaveUser"
    />

    <!-- Delete User Confirmation Modal -->
    <Dialog
      v-model:visible="isDeleteModalOpen"
      :style="{ width: '450px' }"
      header="Confirm Deletion"
      :modal="true"
      :closable="!isLoading"
    >
      <div class="p-4">
        <div class="flex items-start">
          <i class="pi pi-exclamation-triangle text-red-500 text-2xl mr-4 mt-0.5"></i>
          <div>
            <h3 class="text-lg font-medium text-gray-900 mb-2">Delete User</h3>
            <p class="text-gray-600">
              Are you sure you want to delete
              <span class="font-medium text-gray-900">
                {{ selectedUser?.first_name }} {{ selectedUser?.last_name }}
              </span>
              from the system?
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
            @click="isDeleteModalOpen = false"
            class="p-button-text"
            :disabled="isLoading"
          />
          <Button label="Delete" icon="pi pi-trash" severity="danger" :loading="isLoading" @click="handleDeleteUser" />
        </div>
      </template>
    </Dialog>

    <!-- Reset Password Modal -->
    <Dialog
      v-model:visible="isResetPasswordModalOpen"
      :style="{ width: '450px' }"
      header="Reset Password"
      :modal="true"
      :closable="!isLoading"
    >
      <div class="p-4">
        <div class="mb-4">
          <p class="text-gray-600">
            Reset password for
            <span class="font-medium text-gray-900">
              {{ selectedUser?.first_name }} {{ selectedUser?.last_name }}
            </span>
          </p>
        </div>

        <div class="mb-4">
          <label for="new_password" class="block text-sm font-medium text-gray-700 mb-1"> New Password* </label>
          <Password
            id="new_password"
            v-model="newPassword"
            toggleMask
            :feedback="true"
            placeholder="Enter new password"
            class="w-full"
            :class="{ 'p-invalid': passwordError }"
          />
          <small class="p-error" v-if="passwordError">
            {{ passwordError }}
          </small>
        </div>

        <div class="mb-4">
          <label for="confirm_password" class="block text-sm font-medium text-gray-700 mb-1"> Confirm Password* </label>
          <Password
            id="confirm_password"
            v-model="confirmPassword"
            toggleMask
            :feedback="false"
            placeholder="Confirm new password"
            class="w-full"
            :class="{ 'p-invalid': confirmPasswordError }"
          />
          <small class="p-error" v-if="confirmPasswordError">
            {{ confirmPasswordError }}
          </small>
        </div>
      </div>

      <template #footer>
        <div class="flex justify-end gap-2">
          <Button
            label="Cancel"
            icon="pi pi-times"
            @click="isResetPasswordModalOpen = false"
            class="p-button-text"
            :disabled="isLoading"
          />
          <Button
            label="Reset Password"
            icon="pi pi-key"
            severity="warning"
            :loading="isLoading"
            @click="handleResetPassword"
          />
        </div>
      </template>
    </Dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue';
import { FilterMatchMode } from '@primevue/core/api';
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import Button from 'primevue/button';
import ProgressSpinner from 'primevue/progressspinner';
import InputText from 'primevue/inputtext';
import Dropdown from 'primevue/dropdown';
import Tag from 'primevue/tag';
import Dialog from 'primevue/dialog';
import Password from 'primevue/password';
import useUsers from '~/composables/useUsers';

const {
  users,
  selectedUser,
  isLoading,
  error,
  totalCount,
  filters,
  roleOptions,
  isModalOpen,
  isDeleteModalOpen,
  formMode,
  fetchUsers,
  fetchUserById,
  createUser,
  updateUser,
  deleteUser,
  resetPassword,
  openCreateModal,
  openEditModal,
  openDeleteModal,
  onPageChange,
  setFilter,
  formatRole
} = useUsers();

// Password reset
const isResetPasswordModalOpen = ref(false);
const newPassword = ref('');
const confirmPassword = ref('');
const passwordError = ref('');
const confirmPasswordError = ref('');

// Table filters for PrimeVue DataTable
const tableFilters = reactive({
  global: { value: null, matchMode: FilterMatchMode.CONTAINS }
});

// Load users when component mounts
onMounted(() => {
  fetchUsers();
});

// Filter handlers
function onSearchChange() {
  setFilter('search', filters.search);
}

function onRoleChange() {
  setFilter('role', filters.role);
}

// Handle save user (create or update)
async function handleSaveUser(userData: any) {
  try {
    if (formMode.value === 'create') {
      await createUser(userData);
    } else {
      await updateUser(userData.id, userData);
    }

    isModalOpen.value = false;
  } catch (err) {
    // Error is already handled in the composable
  }
}

// Handle delete user
async function handleDeleteUser() {
  if (!selectedUser.value) return;

  try {
    await deleteUser(selectedUser.value.id);
    isDeleteModalOpen.value = false;
  } catch (err) {
    // Error is already handled in the composable
  }
}

// Open reset password modal
function openResetPasswordModal(user: any) {
  selectedUser.value = user;
  newPassword.value = '';
  confirmPassword.value = '';
  passwordError.value = '';
  confirmPasswordError.value = '';
  isResetPasswordModalOpen.value = true;
}

// Handle reset password
async function handleResetPassword() {
  // Validate password
  let isValid = true;
  passwordError.value = '';
  confirmPasswordError.value = '';

  if (!newPassword.value) {
    passwordError.value = 'Password is required';
    isValid = false;
  } else if (newPassword.value.length < 8) {
    passwordError.value = 'Password must be at least 8 characters';
    isValid = false;
  }

  if (!confirmPassword.value) {
    confirmPasswordError.value = 'Please confirm your password';
    isValid = false;
  } else if (newPassword.value !== confirmPassword.value) {
    confirmPasswordError.value = 'Passwords do not match';
    isValid = false;
  }

  if (!isValid || !selectedUser.value) return;

  try {
    await resetPassword(selectedUser.value.id, newPassword.value);
    isResetPasswordModalOpen.value = false;
  } catch (err) {
    // Error is already handled in the composable
  }
}

// Get severity for role tag
function getRoleSeverity(role: string): string {
  switch (role) {
    case 'admin':
      return 'danger';
    case 'instructor':
      return 'info';
    case 'staff':
      return 'success';
    case 'receptionist':
      return 'warning';
    default:
      return 'secondary';
  }
}
</script>
