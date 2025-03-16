<template>
  <div class="certificate-generator p-4">
    <div class="flex justify-between items-center mb-6">
      <h1 class="text-2xl font-bold">Certificate Generator</h1>
      <div class="flex space-x-3">
        <NuxtLink 
          :to="`/certifications/${certificationId}`" 
          class="bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2 rounded"
        >
          Back to Details
        </NuxtLink>
        <button 
          @click="downloadPDF" 
          :disabled="!certification"
          class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded flex items-center space-x-2"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path>
          </svg>
          <span>Download Certificate</span>
        </button>
      </div>
    </div>

    <!-- Loading state -->
    <div v-if="loading" class="flex justify-center items-center py-8">
      <div class="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
    </div>

    <!-- Error state -->
    <div v-else-if="error" class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
      <p>{{ error }}</p>
      <button @click="fetchCertificationDetails" class="underline">Try again</button>
    </div>

    <!-- Certificate Controls and Preview -->
    <div v-else-if="certification" class="mb-6">
      <!-- Certificate Settings -->
      <div class="bg-white p-6 rounded shadow mb-6">
        <h2 class="text-lg font-bold mb-4">Certificate Settings</h2>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Certificate Template</label>
            <select v-model="templateId" class="w-full border rounded px-3 py-2">
              <option value="standard">Standard Certificate</option>
              <option value="professional">Professional Certificate</option>
              <option value="achievement">Achievement Certificate</option>
            </select>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Issued Date Format</label>
            <select v-model="dateFormat" class="w-full border rounded px-3 py-2">
              <option value="MMMM d, yyyy">Long (January 1, 2025)</option>
              <option value="MMM d, yyyy">Medium (Jan 1, 2025)</option>
              <option value="MM/dd/yyyy">Short (01/01/2025)</option>
            </select>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Signature</label>
            <select v-model="signatureType" class="w-full border rounded px-3 py-2">
              <option value="digital">Digital Signature</option>
              <option value="none">No Signature</option>
            </select>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Include QR Code</label>
            <select v-model="includeQR" class="w-full border rounded px-3 py-2">
              <option :value="true">Yes</option>
              <option :value="false">No</option>
            </select>
          </div>
        </div>
      </div>
      
      <!-- Certificate Preview -->
      <div class="bg-white p-8 rounded shadow">
        <h2 class="text-lg font-bold mb-4">Certificate Preview</h2>
        
        <!-- Certificate Preview Container -->
        <div ref="certificateRef" class="certificate-container border-4 border-gray-800 p-12 w-full aspect-[1.4]">
          <!-- Header -->
          <div class="text-center">
            <h1 :class="[
              'text-4xl font-bold mb-2',
              templateId === 'professional' ? 'text-blue-800' :
              templateId === 'achievement' ? 'text-purple-800' : 'text-gray-800'
            ]">CERTIFICATE</h1>
            <p class="text-xl mb-1">of</p>
            <h2 :class="[
              'text-2xl font-bold mb-8',
              templateId === 'professional' ? 'text-blue-700' :
              templateId === 'achievement' ? 'text-purple-700' : 'text-gray-700'
            ]">{{ certification.certification_name }}</h2>
          </div>
          
          <!-- Body -->
          <div class="text-center mb-8">
            <p class="text-lg mb-6">This is to certify that</p>
            <p class="text-3xl font-bold mb-6">{{ studentName }}</p>
            <p class="text-lg mb-2">has successfully completed the requirements</p>
            <p class="text-lg mb-8">and is hereby awarded this certificate</p>
            
            <div class="flex justify-center">
              <div class="border-t-2 border-gray-400 w-64 pt-2 text-center">
                <p class="text-lg">{{ formattedDate }}</p>
                <p class="text-sm text-gray-600">Date of Issue</p>
              </div>
            </div>
          </div>
          
          <!-- Footer -->
          <div class="flex justify-between items-end mt-8">
            <!-- QR Code Placeholder -->
            <div v-if="includeQR" class="qr-placeholder w-24 h-24 bg-gray-200 flex items-center justify-center">
              <p class="text-xs text-gray-600">QR Code</p>
            </div>
            <div v-else class="w-24"></div>
            
            <!-- Signature -->
            <div v-if="signatureType === 'digital'" class="text-center">
              <div class="signature-placeholder w-48 h-16 mb-2">
                <svg viewBox="0 0 200 50" xmlns="http://www.w3.org/2000/svg">
                  <path d="M10,30 C50,10 60,40 80,20 C100,0 120,30 140,25 C160,20 180,10 190,30" 
                        stroke="black" fill="transparent" stroke-width="2"/>
                </svg>
              </div>
              <div class="border-t border-gray-400 w-48 pt-2 text-center">
                <p class="text-sm">Authorized Signature</p>
              </div>
            </div>
            <div v-else class="w-48"></div>
            
            <!-- Official Seal -->
            <div class="seal-placeholder w-24 h-24 rounded-full border-2 border-gray-400 flex items-center justify-center">
              <p class="text-xs text-gray-600">Official Seal</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import { format, parseISO } from 'date-fns'
import useCertifications from '~/composables/useCertifications'
import type { Tables } from '~/types/supabase'

// Get route params
const route = useRoute()
const certificationId = computed(() => route.params.id as string)

// Use the certifications composable
const {
  certification,
  loading,
  error,
  fetchCertification
} = useCertifications()

// Certificate generator settings
const templateId = ref('standard')
const dateFormat = ref('MMMM d, yyyy')
const signatureType = ref('digital')
const includeQR = ref(true)
const certificateRef = ref<HTMLElement | null>(null)

// Computed properties
const studentName = computed(() => {
  if (!certification.value?.students) return 'Student Name'
  return `${certification.value.students.first_name} ${certification.value.students.last_name}`
})

const formattedDate = computed(() => {
  if (!certification.value?.awarded_date) return format(new Date(), dateFormat.value)
  
  try {
    // Parse the ISO date string
    const date = parseISO(certification.value.awarded_date)
    return format(date, dateFormat.value)
  } catch (error) {
    console.error('Error formatting date:', error)
    return format(new Date(), dateFormat.value)
  }
})

// Methods
const fetchCertificationDetails = async () => {
  if (!certificationId.value) return
  await fetchCertification(certificationId.value)
}

const downloadPDF = () => {
  // In a real application, you would use a library like html2pdf.js or jspdf
  // to generate a PDF from the certificate-container element
  
  alert('In a production application, this would generate and download a PDF of the certificate.')
  
  // Example implementation using html2pdf.js would look like:
  // import html2pdf from 'html2pdf.js'
  // const element = certificateRef.value
  // const opt = {
  //   margin: 0.5,
  //   filename: `${certification.value.certification_name}_certificate.pdf`,
  //   image: { type: 'jpeg', quality: 0.98 },
  //   html2canvas: { scale: 2 },
  //   jsPDF: { unit: 'in', format: 'letter', orientation: 'landscape' }
  // }
  // html2pdf().set(opt).from(element).save()
}

// Lifecycle hooks
onMounted(() => {
  fetchCertificationDetails()
})

// Watch for template changes to refresh the certificate preview
watch([templateId, dateFormat, signatureType, includeQR], () => {
  // In a real implementation, you might want to regenerate the preview
  // or apply CSS changes dynamically
})
</script>

<style scoped>
.certificate-container {
  background-color: white;
  background-image: 
    radial-gradient(circle at 10px 10px, rgba(0,0,0,0.05) 1px, transparent 0),
    radial-gradient(circle at 20px 20px, rgba(0,0,0,0.05) 1px, transparent 0);
  background-size: 30px 30px;
  position: relative;
  overflow: hidden;
}

.certificate-container::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-image: 
    linear-gradient(45deg, rgba(0,0,0,0.02) 25%, transparent 25%),
    linear-gradient(-45deg, rgba(0,0,0,0.02) 25%, transparent 25%),
    linear-gradient(45deg, transparent 75%, rgba(0,0,0,0.02) 75%),
    linear-gradient(-45deg, transparent 75%, rgba(0,0,0,0.02) 75%);
  background-size: 20px 20px;
  background-position: 0 0, 0 10px, 10px -10px, -10px 0px;
  z-index: -1;
}
</style>