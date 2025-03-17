<template>
  <div class="py-6">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="mb-6">
        <h1 class="text-2xl font-semibold text-gray-900">System Settings</h1>
        <p class="mt-1 text-sm text-gray-500">
          Configure your school's information, program requirements, and appearance
        </p>
      </div>
      
      <div class="space-y-6">
        <Tabs v-model:value="activeTab">
          <TabList>
            <Tab value="school">School Information</Tab>
            <Tab value="programs">Program Requirements</Tab>
            <Tab value="theme">Theme Settings</Tab>
          </TabList>
          <TabPanels>
            <TabPanel value="school">
              <SchoolSettings />
            </TabPanel>
            <TabPanel value="programs">
              <ProgramRequirements />
            </TabPanel>
            <TabPanel value="theme">
              <ThemeSettings />
            </TabPanel>
          </TabPanels>
        </Tabs>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import Tabs from 'primevue/tabs'
import TabList from 'primevue/tablist'
import Tab from 'primevue/tab'
import TabPanels from 'primevue/tabpanels'
import TabPanel from 'primevue/tabpanel'
import SchoolSettings from '~/components/admin/SchoolSettings.vue'
import ProgramRequirements from '~/components/admin/ProgramRequirements.vue'
import ThemeSettings from '~/components/admin/ThemeSettings.vue'

// Active tab
const activeTab = ref('school')

// Set page metadata
definePageMeta({
  layout: 'default',
  // middleware: ['admin-auth'] 
  // TODO add middleware
})
</script>