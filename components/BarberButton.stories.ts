import type { Meta, StoryObj } from '@storybook/vue3'
import BarberButton from '~/components/BarberButton.vue'

const meta = {
  title: 'Components/BarberButton',
  component: BarberButton,
  tags: ['autodocs'],
  argTypes: {
    label: { control: 'text' },
    variant: {
      control: { type: 'select' },
      options: ['primary', 'secondary']
    },
    disabled: { control: 'boolean' },
    loading: { control: 'boolean' }
  }
} satisfies Meta<typeof BarberButton>

export default meta
type Story = StoryObj<typeof meta>

export const Primary: Story = {
  args: {
    label: 'Primary Button',
    variant: 'primary',
    loading: false
  }
}

export const Secondary: Story = {
  args: {
    label: 'Secondary Button',
    variant: 'secondary',
    loading: false
  }
}

export const Disabled: Story = {
  args: {
    label: 'Disabled Button',
    variant: 'primary',
    disabled: true,
    loading: false
  }
}

export const Loading: Story = {
  args: {
    label: 'Loading Button',
    variant: 'primary',
    loading: true
  }
}
