import type { Meta, StoryObj } from '@storybook/vue3'
import MainNavBar from '~/components/MainNavBar.vue'
import { createPinia, setActivePinia } from 'pinia'
import { useUserStore } from '../stores/user'

// Mock the necessary composables
const mockRouter = {
  push: () => {}
}

const mockRoute = {
  path: '/dashboard'
}

const mockToast = {
  add: () => {}
}

// Mock the $fetch function
global.$fetch = async () => ({})

// Initialize Pinia
const pinia = createPinia()
setActivePinia(pinia)

const meta: Meta<typeof MainNavBar> = {
  title: 'Components/Navbar',
  component: MainNavBar,
  tags: ['autodocs'],
  decorators: [
    () => ({
      template: '<div style="padding: 1em;"><story /></div>',
      setup() {
        // Provide mocked composables
        provide('router', mockRouter)
        provide('route', mockRoute)
        provide('toast', mockToast)
      }
    })
  ],
  parameters: {
    layout: 'fullscreen',
  }
}

export default meta
type Story = StoryObj<typeof MainNavBar>

// Helper to setup user store with different states
const setupUserStore = (userData = {}) => {
  const store = useUserStore()
  store.setUser({
    id: '123',
    email: 'user@example.com',
    firstName: 'John',
    lastName: 'Doe',
    role: 'admin',
    isAuthenticated: true,
    ...userData
  })
  return store
}

export const LoggedIn: Story = {
  args: {},
  play: async ({ canvasElement }) => {
    setupUserStore()
  }
}

export const LoggedInNoName: Story = {
  args: {},
  play: async ({ canvasElement }) => {
    setupUserStore({
      firstName: null,
      lastName: null
    })
  }
}

export const MobileView: Story = {
  args: {},
  parameters: {
    viewport: {
      defaultViewport: 'mobile1'
    }
  },
  play: async ({ canvasElement }) => {
    setupUserStore()
  }
}