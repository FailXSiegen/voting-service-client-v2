import { describe, it, expect } from "vitest";
import { mount } from "@vue/test-utils";
import ToTop from "../ToTop.vue";

describe("ToTop", () => {
  const wrapper = mount(ToTop);

  it("renders properly and empty", () => {
    expect(wrapper.text()).toBe("");
  });
});
