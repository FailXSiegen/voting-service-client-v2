<template>
  <p>Include allowed user listing</p>
</template>

<script>
import { localize } from '@/helper/localization-helper'

export default {
  data () {
    return {}
  },
  methods: {
    localize (path) {
      return localize(path, this.$store.state.language)
    }
  }
}
</script>
