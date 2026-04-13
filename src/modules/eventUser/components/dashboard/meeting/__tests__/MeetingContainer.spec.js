import { describe, it, expect, vi } from 'vitest';
import { shallowMount } from '@vue/test-utils';

// Mock the deeply-imported modules that trigger Apollo/network calls
vi.mock('@/modules/eventUser/requests/fetch-zoom-signature', () => ({
  fetchSignature: vi.fn(),
}));
vi.mock('@zoom/meetingsdk', () => ({
  ZoomMtg: {
    setZoomJSLib: vi.fn(),
    preLoadWasm: vi.fn(),
    prepareWebSDK: vi.fn(),
    i18n: { load: vi.fn(), reload: vi.fn() },
    init: vi.fn(),
    join: vi.fn(),
    getAttendeeslist: vi.fn(),
    getCurrentUser: vi.fn(),
  },
}));
vi.mock('@/core/util/cookie', () => ({
  setCookie: vi.fn(),
}));

const { default: MeetingContainer } = await import('../MeetingContainer.vue');

describe('MeetingContainer', () => {
  function createWrapper(meetingData = {}) {
    return shallowMount(MeetingContainer, {
      props: {
        event: {
          slug: '/event/test',
          meeting: {
            credentials: { meetingId: '123', password: 'pw' },
            ...meetingData,
          },
        },
        eventUser: {
          publicName: 'Test User',
        },
      },
      global: {
        mocks: {
          $t: (key) => key,
        },
        stubs: {
          ZoomFrame: { template: '<div class="zoom-frame-stub" />' },
          JitsiFrame: { template: '<div class="jitsi-frame-stub" />' },
        },
      },
    });
  }

  it('renders ZoomFrame when meeting has no serverUrl (Zoom)', () => {
    const wrapper = createWrapper({
      credentials: { meetingId: '123456', password: 'secret' },
    });

    expect(wrapper.find('.zoom-frame-stub').exists()).toBe(true);
    expect(wrapper.find('.jitsi-frame-stub').exists()).toBe(false);
  });

  it('renders JitsiFrame when meeting has serverUrl (Jitsi)', () => {
    const wrapper = createWrapper({
      serverUrl: 'https://jitsi.failx.de',
      credentials: { roomName: 'test-room' },
    });

    expect(wrapper.find('.jitsi-frame-stub').exists()).toBe(true);
    expect(wrapper.find('.zoom-frame-stub').exists()).toBe(false);
  });

  it('does not show toggle button before meeting is loaded', () => {
    const wrapper = createWrapper();
    const buttons = wrapper.findAll('.btn-primary');
    expect(buttons.length).toBe(0);
  });

  it('renders neither frame when credentials are missing', () => {
    const wrapper = shallowMount(MeetingContainer, {
      props: {
        event: {
          slug: '/event/test',
          meeting: {
            credentials: null,
          },
        },
        eventUser: {
          publicName: 'Test User',
        },
      },
      global: {
        mocks: { $t: (key) => key },
        stubs: {
          ZoomFrame: { template: '<div class="zoom-frame-stub" />' },
          JitsiFrame: { template: '<div class="jitsi-frame-stub" />' },
        },
      },
    });

    expect(wrapper.find('.zoom-frame-stub').exists()).toBe(false);
    expect(wrapper.find('.jitsi-frame-stub').exists()).toBe(false);
  });
});
