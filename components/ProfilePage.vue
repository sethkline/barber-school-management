<template>
  <div class="max-w-4xl mx-auto py-8 px-4">
    <div class="bg-white rounded-lg shadow p-6">
      <h1 class="text-2xl font-bold mb-6">User Profile</h1>
      
      <div class="flex flex-col md:flex-row gap-8">
        <!-- Profile photo section -->
        <div class="flex flex-col items-center">
          <div class="w-32 h-32 rounded-full overflow-hidden bg-gray-200 mb-4">
            <template v-if="profilePhotoUrl">
              <img :src="profilePhotoUrl" alt="Profile photo" class="w-full h-full object-cover" />
            </template>
            <template v-else>
              <div class="w-full h-full flex items-center justify-center bg-primary-500 text-white text-3xl font-bold">
                {{ userInitials }}
              </div>
            </template>
          </div>
          <input 
            ref="fileInput" 
            type="file" 
            accept="image/*" 
            class="hidden" 
            @change="onFileSelected"
          />
          <Button 
            label="Change Photo" 
            size="small"
            severity="secondary"
            class="mb-2"
            @click="triggerFileInput"
          />
        </div>
        
        <!-- Profile information -->
        <div class="flex-1">
          <form @submit.prevent="saveProfile" class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div class="field">
              <label for="firstName" class="block text-sm font-medium text-gray-700 mb-1">First Name</label>
              <InputText id="firstName" v-model="profile.firstName" class="w-full" />
            </div>
            
            <div class="field">
              <label for="lastName" class="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
              <InputText id="lastName" v-model="profile.lastName" class="w-full" />
            </div>
            
            <div class="field md:col-span-2">
              <label for="email" class="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <InputText id="email" v-model="profile.email" class="w-full" disabled />
              <small class="text-gray-500">Email cannot be changed</small>
            </div>
            
            <div class="field">
              <label for="phone" class="block text-sm font-medium text-gray-700 mb-1">Phone</label>
              <InputText id="phone" v-model="profile.phone" class="w-full" />
            </div>
            
            <div class="field">
              <label for="role" class="block text-sm font-medium text-gray-700 mb-1">Role</label>
              <InputText id="role" :value="formatRole(userStore.role)" class="w-full" disabled />
            </div>
            
            <div class="field md:col-span-2 mt-4">
              <Button type="submit" label="Save Changes" icon="pi pi-check" :loading="saving" />
            </div>
          </form>
        </div>
      </div>
    </div>
    
    <!-- Profile Image Cropper Component -->
    <ProfileImageCropper
      v-model="showCropper"
      :image-file="selectedImageFile"
      :user-id="userStore.id"
      @upload-success="onImageUploadSuccess"
      @upload-error="onImageUploadError"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useUserStore } from '~/stores/user';
import { useToast } from 'primevue/usetoast';
import { useSupabaseClient } from '#imports';
import ProfileImageCropper from '~/components/ProfileImageCropper.vue';

const userStore = useUserStore();
const toast = useToast();
const supabase = useSupabaseClient();
const saving = ref(false);
const profilePhotoUrl = ref('');
const fileInput = ref(null);
const showCropper = ref(false);
const selectedImageFile = ref(null);

// Profile form data
const profile = ref({
  firstName: '',
  lastName: '',
  email: '',
  phone: ''
});

// User initials for avatar
const userInitials = computed(() => {
  if (profile.value.firstName && profile.value.lastName) {
    return `${profile.value.firstName.charAt(0)}${profile.value.lastName.charAt(0)}`;
  }
  
  if (profile.value.email) {
    return profile.value.email.charAt(0).toUpperCase();
  }
  
  return '?';
});

// Format role for display
function formatRole(role) {
  if (!role) return 'Guest';
  
  return role.charAt(0).toUpperCase() + role.slice(1);
}

// Load user data
onMounted(() => {
  // Use values from user store
  profile.value = {
    firstName: userStore.firstName || '',
    lastName: userStore.lastName || '',
    email: userStore.email || '',
    phone: userStore.phone || ''
  };

  // Use profileImageUrl from user store if available
  if (userStore.profileImageUrl) {
    profilePhotoUrl.value = userStore.profileImageUrl;
  } else {
    // Fallback: try to get from metadata if not in store
    fetchProfileImage();
  }
});

// Fetch profile image from Supabase storage (fallback method)
async function fetchProfileImage() {
  try {
    // If we have user ID, try to get their profile image
    if (userStore.id) {
      const { data: userData } = await supabase.auth.getUser();
      
      if (userData?.user?.user_metadata?.profile_image_url) {
        profilePhotoUrl.value = userData.user.user_metadata.profile_image_url;
        
        // Also update the store so it's available next time
        userStore.setUser({
          profileImageUrl: userData.user.user_metadata.profile_image_url
        });
      }
    }
  } catch (error) {
    console.error('Failed to fetch profile image:', error);
  }
}

// Trigger the file input
function triggerFileInput() {
  fileInput.value.click();
}

// Handle file selection
function onFileSelected(event) {
  const file = event.target.files[0];
  if (!file) return;
  
  selectedImageFile.value = file;
  showCropper.value = true;
  
  // Reset the file input for future selections
  fileInput.value.value = '';
}

// Handle successful image upload
function onImageUploadSuccess(imageUrl) {
  profilePhotoUrl.value = imageUrl;
  
  // Also update the user store
  userStore.setUser({
    profileImageUrl: imageUrl
  });
  
  toast.add({
    severity: 'success',
    summary: 'Profile Photo Updated',
    detail: 'Your profile photo has been successfully updated',
    life: 3000
  });
}

// Handle image upload error
function onImageUploadError(errorMessage) {
  toast.add({
    severity: 'error',
    summary: 'Upload Failed',
    detail: errorMessage || 'There was an error uploading your profile photo',
    life: 3000
  });
}

// Save profile changes
async function saveProfile() {
  saving.value = true;
  
  try {
    // Update user profile via API
    const response = await $fetch('/api/user/profile', {
      method: 'PUT',
      body: profile.value
    });
    
    if (!response.success) {
      throw new Error(response.message || 'Failed to update profile');
    }
    
    // Update the store with all the profile data
    userStore.setUser({
      firstName: profile.value.firstName,
      lastName: profile.value.lastName,
      phone: profile.value.phone
    });
    
    toast.add({
      severity: 'success',
      summary: 'Profile Updated',
      detail: 'Your profile has been successfully updated',
      life: 3000
    });
  } catch (error) {
    console.error('Failed to update profile:', error);
    
    toast.add({
      severity: 'error',
      summary: 'Update Failed',
      detail: error.message || 'There was an error updating your profile',
      life: 3000
    });
  } finally {
    saving.value = false;
  }
}
</script>