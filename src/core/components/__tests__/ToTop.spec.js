import {describe, it, expect} from 'vitest'

import {mount} from '@vue/test-utils'
import ToTop from '../ToTop.vue'

describe('ToTop', () => {
    it('renders properly', () => {
        const wrapper = mount(ToTop, {props: {msg: 'Hello Vitest'}})
        expect(wrapper.text()).toBe('')
    })
})



