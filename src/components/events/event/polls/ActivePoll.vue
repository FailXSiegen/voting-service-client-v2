<template>
 <div class="container-active-poll" v-if="activePoll.title">
  <h2>Aktive Abstimmung</h2>
  <p> {{ activePoll.title }}</p>
 </div>
</template>

<script>
import { localize } from '@/helper/localization-helper'

export default {
  props: {
    activePoll: {
      type: Object
    }
  },
  methods: {
    localize (path) {
      return localize(path)
    }
  }
}
</script>
