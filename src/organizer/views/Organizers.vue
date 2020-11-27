<template>
  <div class="events-container container-fluid">
    <slot name="alerts"></slot>
    <div class="row">
      <div class="col-12 col-md-3 bg-dark text-white py-3 order-2 order-md-1">
        <app-navigation/>
      </div>
      <div class="col-12 col-md-9 py-3 order-1 order-md-2">
        <h1>{{ headline }}</h1>

        <p>TEST</p>
        <div v-for="(organizer, index) in organizers" :key="index" class="form-check">
          <p>{{ organizer.id }}</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import AppNavigation from '@/organizer/components/Navigation'
import { addSuccessMessage } from '@/frame/lib/alert-helper'
import { localize } from '@/frame/lib/localization-helper'
import { ORGANIZERS } from '@/organizer/api/graphql/gql/queries'

export default {
  components: {
    AppNavigation
  },
  apollo: {
    organizers: {
      query: ORGANIZERS
    }
  },
  data () {
    return {
      headline: 'Organizers',
      organizers: []
    }
  },
  methods: {
    localize (path) {
      return localize(path)
    },
    emittedAlert () {
      return addSuccessMessage('Erfolg', 'Keine Ahnung wie ich das gemacht habe.')
    }
  },
  async created () {
    console.log(this.organizers)
  }
}
</script>
