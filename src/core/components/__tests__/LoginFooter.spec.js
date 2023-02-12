import {describe, it, expect} from 'vitest';
import {mount} from '@vue/test-utils';
import LoginFooter from '../LoginFooter.vue';

describe('LoginFooter', () => {
    const wrapper = mount(LoginFooter);

    it('Renders properly.', () => {
        expect(wrapper.html()).toContain('footer');
    });

});
