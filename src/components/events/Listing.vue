<template>
  <div class="events-listing-container my-5">
    <h2 v-if="headline" class="mb-3"> {{ headline }} </h2>
    <table class="table table-responsive-md">
      <thead class="thead-light">
      <tr>
        <th scope="col">Event Name</th>
        <th scope="col">Created</th>
        <th scope="col">Finished</th>
        <th scope="col" v-if="eventsDetail">Actions</th>
      </tr>
      </thead>
      <tbody>
      <tr v-for="(event, index) in this.events" :key="index" class="table-event">
          <th scope="row">{{ event.title }}</th>
          <td>20.08.2020</td>
          <td>No</td>
          <td v-if="eventsDetail">
            <button @click="onEdit" class="btn btn-primary btn-block mx-1 my-2">Edit</button>
            <button @click="onInviteLink" class="btn btn-primary btn-block mx-1 my-2">Copy Invite Link</button>
            <router-link to="/event" target="_blank" class="btn btn-primary btn-block mx-1 my-2">Open in new Tab</router-link>
            <button @click="onClose" class="btn btn-primary btn-block mx-1 my-2">Close</button>
          </td>
      </tr>
      </tbody>
    </table>
  </div>
</template>

<script>
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
