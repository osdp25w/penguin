import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import Button from '../Button.vue';
describe('Button', () => {
    it('renders with default props', () => {
        const wrapper = mount(Button, {
            slots: {
                default: 'Click me'
            }
        });
        expect(wrapper.text()).toBe('Click me');
        expect(wrapper.classes()).toContain('bg-brand-primary');
        expect(wrapper.attributes('type')).toBe('button');
    });
    it('applies variant classes correctly', () => {
        const wrapper = mount(Button, {
            props: { variant: 'secondary' },
            slots: { default: 'Secondary' }
        });
        expect(wrapper.classes()).toContain('bg-brand-secondary');
    });
    it('applies size classes correctly', () => {
        const wrapper = mount(Button, {
            props: { size: 'lg' },
            slots: { default: 'Large' }
        });
        expect(wrapper.classes()).toContain('px-6');
        expect(wrapper.classes()).toContain('py-3');
    });
    it('handles disabled state', () => {
        const wrapper = mount(Button, {
            props: { disabled: true },
            slots: { default: 'Disabled' }
        });
        expect(wrapper.attributes('disabled')).toBeDefined();
        expect(wrapper.classes()).toContain('disabled:opacity-50');
    });
    it('emits click event', async () => {
        const wrapper = mount(Button, {
            slots: { default: 'Click me' }
        });
        await wrapper.trigger('click');
        expect(wrapper.emitted('click')).toBeTruthy();
    });
    it('applies fullWidth prop', () => {
        const wrapper = mount(Button, {
            props: { fullWidth: true },
            slots: { default: 'Full width' }
        });
        expect(wrapper.classes()).toContain('w-full');
    });
});
