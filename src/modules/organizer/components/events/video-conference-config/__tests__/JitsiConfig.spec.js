import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import JitsiConfig from '../JitsiConfig.vue';

describe('JitsiConfig', () => {
  const defaultProps = {
    recordId: '42',
    config: JSON.stringify({
      id: 42,
      type: 2,
      credentials: {
        roomName: 'my-test-room',
      },
    }),
  };

  function createWrapper(props = {}) {
    return mount(JitsiConfig, {
      props: { ...defaultProps, ...props },
      global: {
        mocks: {
          $t: (key) => key,
        },
      },
    });
  }

  it('renders the room name input', () => {
    const wrapper = createWrapper();
    expect(wrapper.html()).toContain(
      'view.event.create.labels.videoConferenceConfig.jitsi.roomName'
    );
  });

  it('pre-fills room name from config', () => {
    const wrapper = createWrapper();
    const input = wrapper.find('input');
    expect(input.element.value).toBe('my-test-room');
  });

  it('emits change with type 2 and roomName on input change', async () => {
    const wrapper = createWrapper();
    const input = wrapper.find('input');

    await input.setValue('new-room-name');
    await input.trigger('change');

    const emitted = wrapper.emitted('change');
    expect(emitted).toBeTruthy();

    const lastEmit = emitted[emitted.length - 1][0];
    expect(lastEmit).toEqual({
      id: 42,
      type: 2,
      credentials: {
        roomName: 'new-room-name',
      },
    });
  });

  it('handles empty config gracefully', () => {
    const wrapper = createWrapper({
      config: JSON.stringify({}),
    });
    const input = wrapper.find('input');
    expect(input.element.value).toBe('');
  });
});
