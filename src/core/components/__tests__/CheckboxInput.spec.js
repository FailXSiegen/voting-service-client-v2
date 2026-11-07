// @vitest-environment jsdom
// DOMPurify needs a spec-compliant DOM; happy-dom (default in vite.config.mjs) is not.
import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import CheckboxInput from '../form/CheckboxInput.vue';
import { safeHtmlDirective } from '@/core/util/sanitize-html';

const global = {
  directives: { 'safe-html': safeHtmlDirective },
  mocks: { $t: (key) => key },
};

describe('CheckboxInput', () => {
  it('renders the label (e.g. a poll answer) as plain text', () => {
    const wrapper = mount(CheckboxInput, {
      props: { label: '<img src=x onerror=alert(1)>Antwort' },
      global,
    });
    const label = wrapper.find('label');
    expect(label.find('img').exists()).toBe(false);
    expect(label.text()).toBe('<img src=x onerror=alert(1)>Antwort');
  });

  it('renders sanitized HTML only when label-html is set', () => {
    const wrapper = mount(CheckboxInput, {
      props: {
        label:
          'Ich akzeptiere die <a href="/datenschutz" onclick="alert(1)">Datenschutzerklärung</a>',
        labelHtml: true,
      },
      global,
    });
    const link = wrapper.find('label a');
    expect(link.exists()).toBe(true);
    expect(link.attributes('href')).toBe('/datenschutz');
    expect(link.attributes('onclick')).toBeUndefined();
  });
});
