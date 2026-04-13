import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import { createPinia, setActivePinia, defineStore } from 'pinia';
import { ref } from 'vue';

// Create a minimal mock store that matches the real store's shape
// storeToRefs needs a real Pinia store, not a plain object
const mockOrganizer = ref({
  zoomMeetings: [
    { id: '1', title: 'Zoom Provider 1', __typename: 'ZoomMeeting' },
    { id: '2', title: 'Zoom Provider 2', __typename: 'ZoomMeeting' },
  ],
  jitsiMeetings: [{ id: '3', title: 'Jitsi Server', __typename: 'JitsiMeeting' }],
});

vi.mock('@/core/store/core', () => ({
  useCore: defineStore('core', {
    state: () => ({
      organizer: mockOrganizer.value,
    }),
    getters: {
      getOrganizer: (state) => state.organizer,
    },
  }),
}));

// Import after mock
const { default: VideoConferenceSelect } = await import('../VideoConferenceSelect.vue');

describe('VideoConferenceSelect', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  function createWrapper(props = {}) {
    return mount(VideoConferenceSelect, {
      props: {
        label: 'Video Conference',
        ...props,
      },
      global: {
        mocks: {
          $t: (key) => key,
        },
      },
    });
  }

  it('renders select element with label', () => {
    const wrapper = createWrapper();
    expect(wrapper.find('select').exists()).toBe(true);
    expect(wrapper.html()).toContain('Video Conference');
  });

  it('lists all video conferences from both Zoom and Jitsi', () => {
    const wrapper = createWrapper();
    const options = wrapper.findAll('option');

    // Default "---" option + 2 Zoom + 1 Jitsi = 4
    expect(options.length).toBe(4);
    expect(options[1].text()).toBe('Zoom Provider 1');
    expect(options[2].text()).toBe('Zoom Provider 2');
    expect(options[3].text()).toBe('Jitsi Server');
  });

  it('emits change event with selected conference object', async () => {
    const wrapper = createWrapper();
    const select = wrapper.find('select');

    // Select the Jitsi option (id: '3')
    await select.setValue('3');

    const emitted = wrapper.emitted('change');
    expect(emitted).toBeTruthy();
    expect(emitted[0][0].value).toMatchObject({
      id: '3',
      title: 'Jitsi Server',
      __typename: 'JitsiMeeting',
    });
  });

  it('emits change with undefined when default option is selected', async () => {
    const wrapper = createWrapper();
    const select = wrapper.find('select');

    await select.setValue('0');

    const emitted = wrapper.emitted('change');
    expect(emitted).toBeTruthy();
    expect(emitted[0][0].value).toBeUndefined();
  });
});
