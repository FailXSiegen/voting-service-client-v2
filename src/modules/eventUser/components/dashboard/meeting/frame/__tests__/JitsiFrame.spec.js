import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
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
    vi.stubEnv('VITE_JITSI_ALLOWED_HOSTS', 'jitsi.failx.de');
    // Provide JitsiMeetExternalAPI globally so loadJitsiScript resolves immediately
    window.JitsiMeetExternalAPI = MockJitsiMeetExternalAPI;
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('renders the jitsi container element', () => {
    const wrapper = mount(JitsiFrame, {
      props: defaultProps,
      global: {
        mocks: { $t: () => '' },
      },
    });

    expect(wrapper.find('#jitsi-root').exists()).toBe(true);
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

  it('does not load a script from a host that is not whitelisted', async () => {
    const spy = vi.fn();
    window.JitsiMeetExternalAPI = spy;
    const appendSpy = vi.spyOn(document.head, 'appendChild');

    const wrapper = mount(JitsiFrame, {
      props: { ...defaultProps, serverUrl: 'https://evil.example.org' },
      global: {
        mocks: { $t: () => '' },
      },
    });

    await new Promise((r) => setTimeout(r, 50));

    expect(appendSpy).not.toHaveBeenCalled();
    expect(spy).not.toHaveBeenCalled();
    expect(wrapper.find('.alert-danger').exists()).toBe(true);
    expect(wrapper.find('#jitsi-root').exists()).toBe(false);
    appendSpy.mockRestore();
  });

  it('rejects server URLs with paths or credentials', async () => {
    window.JitsiMeetExternalAPI = MockJitsiMeetExternalAPI;
    for (const serverUrl of ['https://jitsi.failx.de@evil.example.org', 'jitsi.failx.de/x.js#']) {
      const wrapper = mount(JitsiFrame, {
        props: { ...defaultProps, serverUrl },
        global: { mocks: { $t: () => '' } },
      });
      await new Promise((r) => setTimeout(r, 10));
      expect(wrapper.find('.alert-danger').exists()).toBe(true);
    }
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
