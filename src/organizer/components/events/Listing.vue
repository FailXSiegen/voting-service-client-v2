<template>
  <div class="events-listing-container my-5">
    <h2 v-if="headline" class="mb-3">{{ headline }}</h2>
    <table
      class="table table-responsive-md table-bordered table-hover table-sm"
    >
      <thead class="thead-light">
        <tr>
          <th scope="col">
            {{ localize('view.event.listing.name') }} <br />
            <small
              ><b>{{ localize('view.event.listing.slug') }}</b></small
            ><br />
            <hr />
            <small
              ><b>{{
                localize('view.event.create.labels.description')
              }}</b></small
            >
          </th>
          <th scope="col">{{ localize('view.event.listing.created') }}</th>
          <th scope="col">{{ localize('view.event.listing.scheduled') }}</th>
          <th scope="col" class="text-center">
            {{ localize('view.event.listing.state') }}
          </th>
          <th scope="col" v-if="eventsDetail">
            {{ localize('view.event.listing.actions.label') }}
          </th>
        </tr>
      </thead>
      <tbody>
        <app-row
          v-for="(event, index) in this.events"
          :key="index"
          :event="event"
          :eventsDetail="eventsDetail"
        />
      </tbody>
    </table>
  </div>
</template>

<script>
import { localize } from '@/frame/lib/localization-helper'
import AppRow from '@/organizer/components/events/listing/Row'

export default {
  components: {
    AppRow
  },
  props: {
    headline: {
      type: String
    },
    eventsDetail: {
      type: Boolean,
      required: true
    },
    events: {
      type: Array,
      required: false,
      default () {
        return []
      }
    }
  },
  methods: {
    localize (path) {
      return localize(path)
    }
  }
}
</script>

<style scoped>
.table td,
.table th {
  vertical-align: middle;
}
</style>
