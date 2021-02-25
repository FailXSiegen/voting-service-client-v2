<template>
  <div class="pending-users">
    <small class="d-inline-block text-muted mb-3">
      Benutzer müssen offline sein zum löschen
    </small>
    <h3>Sortieren nach:</h3>
    <div class="row row-header sortable mb-3">
      <div class="col-auto">
        <span
          class="btn btn-info btn-sort"
          :class="activeSortParam('createDatetime')"
          @click.prevent="sortTable('createDatetime')"
        >
          Erstellungsdatum
        </span>
      </div>
      <div class="col-auto">
        <span
          class="btn btn-info btn-sort"
          :class="activeSortParam('username')"
          @click.prevent="sortTable('username')"
        >
          {{ localize('view.organizers.user') }}
        </span>
      </div>
      <div class="col-auto">
        <span
          class="btn btn-info btn-sort"
          :class="activeSortParam('publicName')"
          @click.prevent="sortTable('publicName')"
        >
          Angezeigter Name
        </span>
      </div>
      <div class="col-auto">
        <span
          class="btn btn-info btn-sort"
          :class="activeSortParam('online')"
          @click.prevent="sortTable('online')"
        >
          Online
        </span>
      </div>
    </div>
    <ul class="allowed-users list-group">
      <li
        v-for="(user, index) in eventUsers"
        :key="index"
        class="list-group-item"
      >
        <div class="d-flex w-100 justify-content-between mb-3">
          <span class="user-information mb-1">
            <h5 class="mb-0">{{ user.publicName }}</h5>
            <small>{{ user.username }}</small>
          </span>
          <span
            class="badge badge-success badge-pill status-indicator"
            v-if="user.online"
          >
            online
          </span>
          <span class="badge badge-danger badge-pill status-indicator" v-else>
            offline
          </span>
        </div>
        <button
          class="btn btn-success mr-2"
          v-on:click="updateToParticipant(user.id)"
        >
          {{ localize('view.event.user.verifyAs') }}
          {{ localize('view.event.user.member') }}
        </button>
        <button
          class="btn btn-info mr-2"
          v-on:click="updateUserToGuest(user.id)"
        >
          {{ localize('view.event.user.verifyAs') }}
          {{ localize('view.event.user.visitor') }}
        </button>
        <button
          class="btn btn-danger mr-2"
          v-on:click="deletePendingUser(user.id)"
          :disabled="user.online"
        >
          {{ localize('view.event.user.block') }}
        </button>
      </li>
    </ul>
  </div>
</template>

<script>
import { localize } from '@/frame/lib/localization-helper'
import {
  UPDATE_USER_TO_GUEST,
  UPDATE_USER_TO_PARTICIPANT,
  DELETE_EVENT_USER
} from '@/organizer/api/graphql/gql/mutations'
import { createFormattedDateFromTimeStamp } from '@/frame/lib/time-stamp'

export default {
  props: {
    eventRecord: {
      type: Object,
      required: true
    },
    eventUsers: {
      type: Array,
      required: true
    },
    sortParam: {
      type: String
    }
  },
  data () {
    return {
      eventUsersByEvent: []
    }
  },
  methods: {
    localize (path) {
      return localize(path)
    },
    sortTable (sortParam) {
      this.$emit('onSort', sortParam)
    },
    activeSortParam (sortProperty) {
      if (sortProperty !== this.sortParam) {
        return
      }
      return 'active'
    },
    getCreateDatetimeFromTimestamp (item) {
      return createFormattedDateFromTimeStamp(item.createDatetime)
    },
    updateUserToGuest (eventUserId) {
      this.$apollo
        .mutate({
          mutation: UPDATE_USER_TO_GUEST,
          variables: { eventUserId }
        })
        .catch(error => {
          console.error(error)
        })
    },
    updateToParticipant (eventUserId) {
      this.$apollo
        .mutate({
          mutation: UPDATE_USER_TO_PARTICIPANT,
          variables: { eventUserId }
        })
        .catch(error => {
          console.error(error)
        })
    },
    deletePendingUser (eventUserId) {
      if (confirm('Benutzer wirklich löschen?')) {
        this.$apollo
          .mutate({
            mutation: DELETE_EVENT_USER,
            variables: { eventUserId }
          })
          .catch(error => {
            console.error(error)
          })
      }
    }
  }
}
</script>

<style scoped>
.status-indicator {
  display: table;
  font-weight: initial;
}
</style>
