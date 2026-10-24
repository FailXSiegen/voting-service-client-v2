import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import { createPinia } from 'pinia';
import LoginFooter from '../LoginFooter.vue';

describe('LoginFooter', () => {
  const wrapper = mount(LoginFooter, {
    global: {
      plugins: [createPinia()],
      mocks: { $t: (key) => key },
      stubs: { 'router-link': { template: '<a><slot /></a>' } },
    },
  });

  it('Renders properly.', () => {
    expect(wrapper.html()).toContain('footer');
  });
});
