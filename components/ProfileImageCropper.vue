<template>
  <div>
    <Dialog v-model:visible="visible" :header="title" :modal="true" :style="{ width: '500px' }" :closable="!uploading">
      <div class="flex flex-col items-center">
        <div v-if="imageSource" class="w-full mb-4">
          <Cropper
            ref="cropperRef"
            class="cropper"
            :src="imageSource"
            :stencil-props="{
              aspectRatio: 1,
              handlers: {},
              movable: true,
              resizable: false
            }"
            :stencil-component="CircleStencil"
            image-restriction="stencil"
            @change="onChange"
          />
        </div>

        <div class="w-full flex justify-between mt-3">
          <Button label="Cancel" icon="pi pi-times" @click="cancelCrop" class="p-button-text" :disabled="uploading" />
          <Button label="Upload" icon="pi pi-check" @click="cropAndUpload" :loading="uploading" />
        </div>
      </div>
    </Dialog>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue';
import { Cropper, CircleStencil } from 'vue-advanced-cropper';
import 'vue-advanced-cropper/dist/style.css';
import { useSupabaseClient } from '#imports';
import Dialog from 'primevue/dialog';
import Button from 'primevue/button';

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false
  },
  imageFile: {
    type: File,
    default: null
  },
  userId: {
    type: String,
    required: true
  },
  title: {
    type: String,
    default: 'Crop Profile Image'
  },
  bucketName: {
    type: String,
    default: 'profile-images'
  }
});

const emit = defineEmits(['update:modelValue', 'upload-success', 'upload-error']);

const supabase = useSupabaseClient();
const cropperRef = ref(null);
const coordinates = ref(null);
const uploading = ref(false);
const imageSource = ref('');

// Two-way binding for dialog visibility
const visible = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
});

// Watch for image file changes
watch(
  () => props.imageFile,
  (newFile) => {
    if (newFile) {
      const reader = new FileReader();
      reader.onload = (e) => {
        imageSource.value = e.target.result;
      };
      reader.readAsDataURL(newFile);
    } else {
      imageSource.value = '';
    }
  },
  { immediate: true }
);

// Handle cropper change events
function onChange({ coordinates: coords }) {
  coordinates.value = coords;
}

// Cancel the crop operation
function cancelCrop() {
  visible.value = false;
  imageSource.value = '';
  emit('update:modelValue', false);
}

// Crop and upload the image
async function cropAndUpload() {
  if (!cropperRef.value || !props.imageFile) return;

  uploading.value = true;

  try {
    // Get the cropped canvas from the cropper
    const { canvas } = cropperRef.value.getResult();

    // Convert the canvas to a Blob with JPEG format
    const blob = await new Promise((resolve) => {
      canvas.toBlob(
        (blob) => {
          resolve(blob);
        },
        'image/jpeg',
        0.9
      );
    });

    // Create a File object with a unique name
    const fileName = `profile-${Date.now()}.jpg`;
    const file = new File([blob], fileName, { type: 'image/jpeg' });

    // Upload the file to Supabase Storage
    const filePath = `${props.userId}/profile.jpg`;
    const { data, error } = await supabase.storage.from(props.bucketName).upload(filePath, file, {
      upsert: true,
      contentType: 'image/jpeg'
    });

    if (error) throw error;

    // Get the private URL of the uploaded image
    const { data: signedUrlData, error: signUrlError } = await supabase.storage
      .from(props.bucketName)
      .createSignedUrl(filePath, 60 * 60 * 24 * 7); // 7 days

    if (signUrlError) throw signUrlError;
    const imageUrl = signedUrlData.signedUrl;

    // Update user metadata through API endpoint instead of direct auth call
    const response = await $fetch('/api/user/profile-image', {
      method: 'PUT',
      body: {
        imageUrl: imageUrl
      }
    });

    if (!response.success) {
      throw new Error(response.message || 'Failed to update profile image');
    }

    // Emit success event with the image URL
    emit('upload-success', imageUrl);

    // Close the dialog
    visible.value = false;
  } catch (error) {
    console.error('Failed to upload profile image:', error);
    emit('upload-error', error.message || 'Failed to upload image');
  } finally {
    uploading.value = false;
    imageSource.value = '';
  }
}
</script>

<style scoped>
.cropper {
  height: 350px;
  width: 100%;
  background: #f0f0f0;
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
  border-radius: 4px;
}
</style>
