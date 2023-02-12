import {describe, it, expect} from 'vitest';
import {mount} from '@vue/test-utils';
import EventUserLogin from '../EventUserLogin.vue';

// @todo Find a way to check for validation.

describe('EventUserLogin', () => {
    const wrapper = mount(EventUserLogin, {
        global: {
            mocks: {
                $t: () => 'Lorem ipsum'
            }
        }
    });

    it('Renders properly.', () => {
        expect(wrapper.html()).toContain('Lorem ipsum');
    });

    it('Event slug input and submit are present.', async () => {
        const eventSlugInput = wrapper.find('#event-user-login-event-slug');
        const loginButton = wrapper.find('#event-user-login-submit');

        expect(eventSlugInput).toBeTruthy();
        expect(loginButton).toBeTruthy();
    });
});
