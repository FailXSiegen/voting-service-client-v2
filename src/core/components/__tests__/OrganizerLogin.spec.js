import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import { createPinia } from 'pinia';
import OrganizerLogin from '../OrganizerLogin.vue';

// @todo Find a way to check for validation.

describe('OrganizerLogin', () => {
  const wrapper = mount(OrganizerLogin, {
    global: {
      plugins: [createPinia()],
      mocks: {
        $t: () => 'Lorem ipsum',
      },
      stubs: { 'router-link': { template: '<a><slot /></a>' } },
    },
  });

  it('Renders properly.', () => {
    expect(wrapper.html()).toContain('Lorem ipsum');
  });

  it('Username, password and submit are present.', async () => {
    const userNameInput = wrapper.find('input[name="username"]');
    const passwordInput = wrapper.find('input[name="password"]');
    const loginButton = wrapper.find('#organizer-login-submit');

    expect(userNameInput).toBeTruthy();
    expect(passwordInput).toBeTruthy();
    expect(loginButton).toBeTruthy();
  });
});
