<template>
  <div class="events-listing-container my-5">
    <h2 v-if="headline" class="mb-3"> {{ headline }} </h2>
    <table class="table table-responsive-md">
      <thead class="thead-light">
      <tr>
        <th scope="col">{{ localize('view.event.listing.name') }}</th>
        <th scope="col">{{ localize('view.event.listing.created') }}</th>
        <th scope="col">{{ localize('view.event.listing.finished') }}</th>
        <th scope="col" v-if="eventsDetail">{{ localize('view.event.listing.actions.label') }}</th>
      </tr>
      </thead>
      <tbody>
      <tr v-for="(event, index) in this.events" :key="index" class="table-event">
          <th scope="row">{{ event.title }}</th>
          <td>{{ event.created }}</td>
          <td v-if="event.finished">{{ localize('general.yes') }}</td>
          <td v-else>{{ localize('general.no') }}</td>
          <td v-if="eventsDetail">
            <button @click="onEdit" class="btn btn-primary btn-block mx-1 my-2">{{ localize('view.event.listing.actions.edit') }}</button>
            <button @click="onInviteLink" class="btn btn-primary btn-block mx-1 my-2">{{ localize('view.event.listing.actions.inviteLink') }}</button>
            <router-link to="/event" target="_blank" class="btn btn-primary btn-block mx-1 my-2">{{ localize('view.event.listing.actions.newTab') }}</router-link>
            <button @click="onClose" class="btn btn-primary btn-block mx-1 my-2">{{ localize('view.event.listing.actions.close') }}</button>
          </td>
      </tr>
      </tbody>
    </table>
  </div>
</template>

<script>
import { localize } from '@/helper/localization-helper'

export default {
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
      required: true
    }
  },
  methods: {
    localize (path) {
      return localize(path, this.$store.state.language)
    },
    onEdit () {
      alert('Edit')
    },
    onInviteLink () {
      alert('Copy invite link')
    },
    onClose () {
      alert('Close Event')
    }
  }
}
</script>

<style scoped>
  .table td, .table th {
    vertical-align: middle;
  }
</style>
