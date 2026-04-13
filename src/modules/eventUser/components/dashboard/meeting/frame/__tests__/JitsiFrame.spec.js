import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import JitsiFrame from '../JitsiFrame.vue';

// Mock the Jitsi External API
const mockDispose = vi.fn();
const mockAddListener = vi.fn();

function MockJitsiMeetExternalAPI(domain, options) {
  this.domain = domain;
  this.options = options;
  this.dispose = mockDispose;
  this.addListener = mockAddListener;
}

describe('JitsiFrame', () => {
  const defaultProps = {
    serverUrl: 'https://jitsi.failx.de',
    roomName: 'test-room-123',
    nickname: 'Test User',
    returnUrl: '/event/test-event',
  };

  beforeEach(() => {
    vi.clearAllMocks();
    // Provide JitsiMeetExternalAPI globally so loadJitsiScript resolves immediately
    window.JitsiMeetExternalAPI = MockJitsiMeetExternalAPI;
  });

  it('renders the jitsi container element', () => {
    const wrapper = mount(JitsiFrame, {
      props: defaultProps,
      global: {
        mocks: { $t: () => '' },
      },
    });

    expect(wrapper.find('.jitsi-container').exists()).toBe(true);
  });

  it('initializes JitsiMeetExternalAPI with correct domain on mount', async () => {
    mount(JitsiFrame, {
      props: defaultProps,
      global: {
        mocks: { $t: () => '' },
      },
    });

    // Wait for onMounted async to complete
    (await vi.dynamicImportSettled?.()) || (await new Promise((r) => setTimeout(r, 50)));

    // The API should have been constructed — check via addListener calls
    expect(mockAddListener).toHaveBeenCalledWith('videoConferenceJoined', expect.any(Function));
    expect(mockAddListener).toHaveBeenCalledWith('readyToClose', expect.any(Function));
  });

  it('strips protocol from serverUrl for domain', async () => {
    const spy = vi.fn(function (domain, options) {
      this.domain = domain;
      this.options = options;
      this.dispose = vi.fn();
      this.addListener = vi.fn();
    });
    window.JitsiMeetExternalAPI = spy;

    mount(JitsiFrame, {
      props: defaultProps,
      global: {
        mocks: { $t: () => '' },
      },
    });

    await new Promise((r) => setTimeout(r, 50));

    expect(spy).toHaveBeenCalledWith(
      'jitsi.failx.de',
      expect.objectContaining({
        roomName: 'test-room-123',
        userInfo: { displayName: 'Test User' },
      })
    );
  });

  it('disposes API on unmount', async () => {
    const wrapper = mount(JitsiFrame, {
      props: defaultProps,
      global: {
        mocks: { $t: () => '' },
      },
    });

    await new Promise((r) => setTimeout(r, 50));

    wrapper.unmount();

    expect(mockDispose).toHaveBeenCalled();
  });

  it('emits loaded event when videoConferenceJoined fires', async () => {
    // Capture the listener callback
    let joinedCallback;
    const captureAddListener = vi.fn((event, cb) => {
      if (event === 'videoConferenceJoined') joinedCallback = cb;
    });
    window.JitsiMeetExternalAPI = function (domain, options) {
      this.domain = domain;
      this.options = options;
      this.dispose = vi.fn();
      this.addListener = captureAddListener;
    };

    const wrapper = mount(JitsiFrame, {
      props: defaultProps,
      global: {
        mocks: { $t: () => '' },
      },
    });

    await new Promise((r) => setTimeout(r, 50));

    // Simulate the joined event
    expect(joinedCallback).toBeDefined();
    joinedCallback();

    expect(wrapper.emitted('loaded')).toBeTruthy();
    expect(wrapper.emitted('loaded')).toHaveLength(1);
  });
});
