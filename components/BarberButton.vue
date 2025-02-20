<template>
  <Button
    v-bind="$attrs"
    :class="[computedClasses, { 'relative overflow-hidden': loading }]"
    :disabled="disabled || loading"
  >
    <div v-if="loading" class="absolute inset-0 barber-pole-wrapper">
      <div class="barber-pole-loader" />
    </div>
    <div :class="{ 'opacity-0': loading }">
      <span v-if="label">{{ label }}</span>
      <slot v-else />
    </div>
  </Button>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import Button from 'primevue/button'

const props = defineProps<{
  label?: string;
  variant?: 'primary' | 'secondary';
  disabled?: boolean;
  loading?: boolean;
}>()

const computedClasses = computed(() => {
  const classes = ['my-button']
  
  if (props.variant === 'primary') {
    classes.push('bg-primary-600 text-white hover:bg-primary-700 focus:ring-2 focus:ring-primary-500 focus:ring-offset-2')
  } else if (props.variant === 'secondary') {
    classes.push('bg-secondary-600 text-white hover:bg-secondary-700 focus:ring-2 focus:ring-secondary-500 focus:ring-offset-2')
  }
  
  return classes.join(' ')
})
</script>

<style scoped>
.my-button {
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 0.375rem;
  transition: all 0.2s;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 120px;
  position: relative;
}

.barber-pole-wrapper {
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: inherit;
}

.barber-pole-loader {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  background-image: linear-gradient(
    45deg,
    rgba(255, 255, 255, 0.2) 25%,
    transparent 25%,
    transparent 50%,
    rgba(255, 255, 255, 0.2) 50%,
    rgba(255, 255, 255, 0.2) 75%,
    transparent 75%,
    transparent
  );
  background-size: 40px 40px;
  animation: barber-pole 1s linear infinite;
}

@keyframes barber-pole {
  from {
    background-position: 40px 0;
  }
  to {
    background-position: 0 0;
  }
}
</style>