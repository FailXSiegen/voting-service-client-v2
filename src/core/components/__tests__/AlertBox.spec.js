import {describe, it, expect} from 'vitest';
import {mount} from '@vue/test-utils';
import AlertBox from '../AlertBox.vue';

describe('AlertBox', () => {
    it('Renders properly with default values', () => {
        const message = "this is a test";
        const wrapper = mount(AlertBox, {
            props: {message},
            global: {
                stubs: {
                    'router-link': {template: '<div/>'},
                },
            },
        });

        expect(wrapper.html()).toContain('alert alert-success');
    });

    it('Renders properly danger alerts', () => {
        const message = "this is a test";
        const type = 'danger';
        const wrapper = mount(AlertBox, {
            props: {message, type},
            global: {
                stubs: {
                    'router-link': {template: '<div/>'},
                },
            },
        });

        expect(wrapper.html()).toContain('alert alert-danger');
    });

    it('Renders properly warning alerts', () => {
        const message = "this is a test";
        const type = 'warning';
        const wrapper = mount(AlertBox, {
            props: {message, type},
            global: {
                stubs: {
                    'router-link': {template: '<div/>'},
                },
            },
        });

        expect(wrapper.html()).toContain('alert alert-warning');
    });

    it('Renders properly info alerts', () => {
        const message = "this is a test";
        const type = 'info';
        const wrapper = mount(AlertBox, {
            props: {message, type},
            global: {
                stubs: {
                    'router-link': {template: '<div/>'},
                },
            },
        });

        expect(wrapper.html()).toContain('alert alert-info');
    });
});
