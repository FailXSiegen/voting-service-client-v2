<template>
  <div class="events-listing-container my-5">
    <h2 v-if="headline" class="mb-3">{{ headline }}</h2>
    <p class="hint small">
      Nur inaktive Veranstaltungen können gelöscht werden
    </p>
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
          <th scope="col" v-if="showOrganizer">Veranstalter</th>
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
          :showOrganizer="showOrganizer"
          @onDeleteEvent="deleteEvent"
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
    },
    showOrganizer: {
      type: Boolean,
      default () {
        return false
      }
    }
  },
  methods: {
    localize (path) {
      return localize(path)
    },
    deleteEvent (eventId) {
      this.$emit('onDeleteEvent', eventId)
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
