import { describe, it, expect } from "vitest";
import { mount } from "@vue/test-utils";
import OrganizerRegister from "../OrganizerRegister.vue";

// @todo Find a way to check for validation.

describe("OrganizerRegister", () => {
  const wrapper = mount(OrganizerRegister, {
    global: {
      mocks: {
        $t: () => "Lorem ipsum",
      },
      stubs: {
        "router-link": { template: "<div/>" },
      },
    },
  });

  it("Renders properly.", () => {
    expect(wrapper.html()).toContain("Lorem ipsum");
  });

  it("Register link present.", async () => {
    const link = wrapper.find("#organizer-register-link");
    expect(link).toBeTruthy();
  });
});
