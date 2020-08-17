<template>
  <h1>Pending Users to be initialized.</h1>
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
