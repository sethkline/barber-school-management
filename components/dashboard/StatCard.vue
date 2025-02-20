<!-- components/dashboard/StatCard.vue -->
<template>
  <div 
    class="bg-white rounded-lg shadow p-6 flex items-center"
    :class="[colorClass]"
  >
    <div class="mr-4">
      <div class="h-12 w-12 rounded-full flex items-center justify-center" :class="iconBgClass">
        <i :class="['text-xl', iconClass]"></i>
      </div>
    </div>
    <div>
      <h3 class="text-sm font-medium text-gray-500">{{ title }}</h3>
      <div class="flex items-end mt-1">
        <span class="text-2xl font-semibold">{{ value }}</span>
        <span 
          v-if="trend !== null"
          class="ml-2 text-sm flex items-center"
          :class="trendClass"
        >
          <i :class="trendIconClass" class="mr-1"></i>
          {{ Math.abs(trend) }}%
        </span>
      </div>
      <p v-if="subtitle" class="text-sm text-gray-500 mt-1">{{ subtitle }}</p>
    </div>
  </div>
</template>

<script setup lang="ts">
const props = defineProps({
  title: {
    type: String,
    required: true
  },
  value: {
    type: [String, Number],
    required: true
  },
  icon: {
    type: String,
    default: 'pi pi-users'
  },
  color: {
    type: String,
    default: 'blue',
    validator: (value: string) => ['blue', 'green', 'yellow', 'red', 'purple'].includes(value)
  },
  trend: {
    type: Number,
    default: null
  },
  subtitle: {
    type: String,
    default: ''
  }
})

// Compute color classes for different card variations
const colorClass = computed(() => {
  switch (props.color) {
    case 'blue': return 'border-l-4 border-blue-500';
    case 'green': return 'border-l-4 border-green-500';
    case 'yellow': return 'border-l-4 border-yellow-500';
    case 'red': return 'border-l-4 border-red-500';
    case 'purple': return 'border-l-4 border-purple-500';
    default: return 'border-l-4 border-blue-500';
  }
})

// Compute background color for icon
const iconBgClass = computed(() => {
  switch (props.color) {
    case 'blue': return 'bg-blue-100 text-blue-600';
    case 'green': return 'bg-green-100 text-green-600';
    case 'yellow': return 'bg-yellow-100 text-yellow-600';
    case 'red': return 'bg-red-100 text-red-600';
    case 'purple': return 'bg-purple-100 text-purple-600';
    default: return 'bg-blue-100 text-blue-600';
  }
})

// Get the actual icon class
const iconClass = computed(() => props.icon)

// Determine trend styling and icon
const trendClass = computed(() => {
  if (props.trend === null) return '';
  return props.trend >= 0 ? 'text-green-600' : 'text-red-600';
})

const trendIconClass = computed(() => {
  if (props.trend === null) return '';
  return props.trend >= 0 ? 'pi pi-arrow-up' : 'pi pi-arrow-down';
})
</script>