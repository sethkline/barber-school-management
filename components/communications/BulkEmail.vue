<template>
  <div v-if="isOpen" class="fixed inset-0 z-50 overflow-y-auto">
    <div class="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
      <!-- Background overlay -->
      <div class="fixed inset-0 transition-opacity" @click="closeModal">
        <div class="absolute inset-0 bg-gray-500 opacity-75"></div>
      </div>

      <!-- Modal panel -->
      <div class="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full">
        <div class="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
          <div class="sm:flex sm:items-start">
            <div class="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
              <h3 class="text-lg leading-6 font-medium text-gray-900 mb-4">
                Send Bulk Email
              </h3>
              
              <div class="mt-2">
                <BulkEmailForm 
                  :recipients="recipients"
                  :recipient-type="recipientType"
                  @sent="onSent"
                  @cancel="closeModal"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { defineProps, defineEmits, toRefs } from 'vue'

const props = defineProps({
  isOpen: {
    type: Boolean,
    default: false
  },
  recipients: {
    type: Array,
    default: () => []
  },
  recipientType: {
    type: String,
    default: 'student' // or 'lead'
  }
})

const emit = defineEmits(['close', 'sent'])

const { isOpen } = toRefs(props)

function closeModal() {
  emit('close')
}

function onSent() {
  emit('sent')
  closeModal()
}
</script>