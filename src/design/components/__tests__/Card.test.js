import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import Card from '../Card.vue';
describe('Card', () => {
    it('renders with default props', () => {
        const wrapper = mount(Card, {
            slots: {
                default: '<p>Card content</p>'
            }
        });
        expect(wrapper.html()).toContain('<p>Card content</p>');
        expect(wrapper.classes()).toContain('bg-white');
        expect(wrapper.classes()).toContain('rounded-xl');
    });
    it('applies variant classes correctly', () => {
        const wrapper = mount(Card, {
            props: { variant: 'elevated' },
            slots: { default: 'Content' }
        });
        expect(wrapper.classes()).toContain('shadow-lg');
        expect(wrapper.classes()).not.toContain('border');
    });
    it('applies padding classes correctly', () => {
        const wrapper = mount(Card, {
            props: { padding: 'lg' },
            slots: { default: 'Content' }
        });
        expect(wrapper.classes()).toContain('p-8');
    });
    it('applies hover effect when hover prop is true', () => {
        const wrapper = mount(Card, {
            props: { hover: true },
            slots: { default: 'Content' }
        });
        expect(wrapper.classes()).toContain('hover:shadow-lg');
        expect(wrapper.classes()).toContain('cursor-pointer');
    });
    it('renders header slot when provided', () => {
        const wrapper = mount(Card, {
            slots: {
                header: '<h2>Card Header</h2>',
                default: 'Content'
            }
        });
        expect(wrapper.html()).toContain('<h2>Card Header</h2>');
        expect(wrapper.find('.card-header').exists()).toBe(true);
    });
    it('renders footer slot when provided', () => {
        const wrapper = mount(Card, {
            slots: {
                default: 'Content',
                footer: '<div>Card Footer</div>'
            }
        });
        expect(wrapper.html()).toContain('<div>Card Footer</div>');
        expect(wrapper.find('.card-footer').exists()).toBe(true);
    });
});
