// tests/LoginForm.nuxt.test.ts
import { describe, it, expect } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import LoginForm from '../components/LoginForm.vue'

describe('LoginForm', () => {
  it('emits submit event with credentials when form is submitted', async () => {
    const wrapper = await mountSuspended(LoginForm)
    
    // Fill in the form
    await wrapper.find('input[placeholder="Email *"]').setValue('test@example.com')
    await wrapper.find('input[type="password"]').setValue('password123')
    
    // Submit the form
    await wrapper.find('form').trigger('submit')
    
    // Check the emitted event
    expect(wrapper.emitted('submit')?.[0][0]).toEqual({
      email: 'test@example.com',
      password: 'password123'
    })
  })
  
  it('disables inputs and button when loading', async () => {
    const wrapper = await mountSuspended(LoginForm, {
      props: {
        loading: true
      }
    })
    
    // Check inputs are disabled
    expect(wrapper.find('input[placeholder="Email *"]').attributes('disabled')).toBeDefined()
    expect(wrapper.find('input[type="password"]').attributes('disabled')).toBeDefined()
    
    // Check button is in loading state
    const button = wrapper.findComponent({ name: 'BarberButton' })
    expect(button.props('loading')).toBe(true)
  })
  
  it('shows validation errors for empty fields', async () => {
    const wrapper = await mountSuspended(LoginForm)
    
    // Submit empty form
    await wrapper.find('form').trigger('submit')
    
    // Check for validation errors
    expect(wrapper.text()).toContain('Email is required')
    expect(wrapper.text()).toContain('Password is required')
  })
  
  it('handles login error states', async () => {
    const wrapper = await mountSuspended(LoginForm)
    
    // Set error prop
    await wrapper.setProps({
      error: 'Invalid credentials'
    })
    
    // Check error message is displayed
    expect(wrapper.text()).toContain('Invalid credentials')
  })
})