// stories/LoginForm.stories.ts
import type { Meta, StoryObj } from '@storybook/vue3'
import LoginForm from '../components/LoginForm.vue'

const meta = {
  title: 'Forms/LoginForm',
  component: LoginForm,
  args: {
    title: 'Login',
    submitLabel: 'Sign In',
    loading: false,
    error: '',
  },
  argTypes: {
    onSubmit: { action: 'submit' }
  },
} satisfies Meta<typeof LoginForm>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {}
}

export const Loading: Story = {
  args: {
    loading: true
  }
}

export const WithError: Story = {
  args: {
    error: 'Invalid credentials'
  }
}

export const CustomTitle: Story = {
  args: {
    title: 'Welcome Back',
    submitLabel: 'Continue'
  }
}