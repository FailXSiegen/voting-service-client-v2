<template>
  <div class="container-verified-user" v-if="eventUsers">
    <small class="d-inline-block text-muted mb-3">
      Benutzer müssen im Warteraum sein um sie zu löschen. <br />Editieren ->
      Haken bei "Freigeschaltet" entfernen. Benutzer erscheint wieder im
      Warteraum
    </small>
    <h3>Sortieren nach:</h3>
    <div class="row row-header sortable mb-3">
      <div class="col-auto mb-3">
        <span
          class="btn btn-info btn-sort"
          :class="activeSortParam('createDatetime')"
          @click.prevent="sortTable('createDatetime')"
        >
          Erstellungsdatum
        </span>
      </div>
      <div class="col-auto mb-3">
        <span
          class="btn btn-info btn-sort"
          :class="activeSortParam('username')"
          @click.prevent="sortTable('username')"
        >
          {{ localize('view.organizers.user') }}
        </span>
      </div>
      <div class="col-auto mb-3">
        <span
          class="btn btn-info btn-sort"
          :class="activeSortParam('publicName')"
          @click.prevent="sortTable('publicName')"
        >
          Angezeigter Name
        </span>
      </div>
      <div class="col-auto mb-3">
        <span
          class="btn btn-info btn-sort"
          :class="activeSortParam('online')"
          @click.prevent="sortTable('online')"
        >
          Online
        </span>
      </div>
    </div>
    <hr />
    <ul class="allowed-users list-group">
      <li
        v-for="(user, index) in eventUsers"
        :key="index"
        class="list-group-item my-2 border"
      >
        <div class="list-group-content">
          <div class="list-group-info">
            <div class="user-information">
              <h5 class="mb-1">
                {{ user.publicName }}
                <span
                  class="badge badge-success badge-pill status-indicator"
                  v-if="user.online"
                  >online</span
                >
                <span
                  class="badge badge-danger badge-pill status-indicator"
                  v-else
                  >offline</span
                >
                <span class="text-success small" v-if="user.allowToVote">
                  {{ localize('view.event.user.member') }}</span
                >
                <span class="text-info small" v-else>
                  {{ localize('view.event.user.visitor') }}</span
                >
              </h5>
              <p class="mb-0">
                {{ user.username }}
                <span v-if="user.voteAmount">
                  - {{ localize('view.event.listing.voteAmount') }}:
                  {{ user.voteAmount }}
                </span>
              </p>
            </div>
          </div>
          <div
            class="d-flex justify-content-center align-items-center btn-group"
          >
            <button
              v-if="!user.allowToVote"
              v-on:click="updateToParticipant(user)"
              class="h-100 btn btn-success"
            >
              {{ localize('view.event.user.setTo') }}
              {{ localize('view.event.user.member') }}
            </button>
            <button
              v-else-if="user.allowToVote"
              v-on:click="updateUserToGuest(user)"
              class="h-100 btn btn-info"
            >
              {{ localize('view.event.user.setTo') }}
              {{ localize('view.event.user.visitor') }}
            </button>
            <router-link
              :to="{
                name: 'UpdateEventUser',
                params: { eventUserRecord: user }
              }"
              class="btn h-100 btn-warning d-flex justify-content-center align-items-center"
            >
              <i class="bi-pencil align-middle"></i>
            </router-link>
          </div>
        </div>
      </li>
    </ul>
  </div>
</template>

<script>
import { localize } from '@/frame/lib/localization-helper'
import {
  UPDATE_USER_TO_GUEST,
  UPDATE_USER_TO_PARTICIPANT
} from '@/organizer/api/graphql/gql/mutations'

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
    updateUserToGuest (user) {
      const eventUserId = user.id
      this.$apollo
        .mutate({
          mutation: UPDATE_USER_TO_GUEST,
          variables: { eventUserId }
        })
        .then(() => {
          user.voteAmount = 0
        })
        .catch(error => {
          console.error(error)
        })
    },
    updateToParticipant (user) {
      const eventUserId = user.id
      this.$apollo
        .mutate({
          mutation: UPDATE_USER_TO_PARTICIPANT,
          variables: { eventUserId }
        })
        .then(() => {
          user.voteAmount = 1
        })
        .catch(error => {
          console.error(error)
        })
    }
  }
}
</script>

<style scoped>
.status-indicator {
  font-weight: initial;
  font-size: 0.7rem;
  margin-top: -2px;
}

.list-group-content {
  display: flex;
  width: 100%;
  margin-bottom: 1rem;
  flex-direction: column;
}

.list-group-info {
  width: 100%;
  display: flex;
  flex-direction: column;
  padding-right: 1.5rem;
}

.user-information {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

@media all and (min-width: 567px) {
  .list-group-content {
    justify-content: space-between;
    flex-direction: row;
    margin-bottom: 0;
  }

  .btn-group .btn {
    font-size: 0.8rem;
  }

  .list-group-info {
    flex-direction: column;
    justify-content: center;
  }
}
</style>
