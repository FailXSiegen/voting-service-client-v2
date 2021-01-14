<template>
  <div class="container-create-event-multiple-user">
    <slot name="alerts"></slot>
    <form @submit.prevent="createEventMultipleUser">
      <div class="form-check">
        <input
          v-model="eventMultipleUserRecord.allowToVote"
          class="form-check-input"
          type="checkbox"
          id="allowToVote"
        />
        <label for="allowToVote">
          {{ localize('view.event.create.labels.eventUser.allowToVote') }}
        </label>
      </div>
      <div
        class="participants-input"
        v-if="eventMultipleUserRecord.allowToVote"
      >
        <div class="form-group">
          <label for="voteAmount">{{
            localize('view.event.create.labels.eventUser.voteAmount')
          }}</label>
          <input
            v-model="eventMultipleUserRecord.voteAmount"
            type="number"
            class="form-control"
            id="voteAmount"
          />
        </div>
      </div>
      <div class="form-group">
        <label for="username" class="mb-0">{{
          localize('view.event.create.labels.eventMultipleUser.usernames')
        }}</label>
        <small class="form-text text-danger mb-2">
          {{
            localize('view.event.create.labels.eventMultipleUser.usernamesHint')
          }}
        </small>
        <textarea
          v-model="eventMultipleUserRecord.listOfUsers"
          type="text"
          class="form-control"
          id="username"
          required="required"
          rows="20"
          cols="5"
        ></textarea>
      </div>

      <button class="btn btn-primary mt-5 mb-3">
        <i class="bi-play bi--2xl align-middle"></i>
        <span class="align-middle">{{
          localize('view.event.create.labels.eventMultipleUser.submit')
        }}</span>
      </button>
    </form>
  </div>
</template>

<script>
import { localize } from '@/frame/lib/localization-helper'
import { addDangerMessage } from '@/frame/lib/alert-helper.js'
import $ from 'jquery'

export default {
  props: {
    eventMultipleUserRecord: {
      type: Object
    }
  },
  methods: {
    createEventMultipleUser () {
      $('#username').removeClass('is-invalid')
      this.eventMultipleUserRecord.listOfUsersArray = this.eventMultipleUserRecord.listOfUsers.split(
        '\n'
      )
      try {
        this.eventMultipleUserRecord.listOfUsersArray.forEach(
          (username, index) => {
            if (username === '' || username.trim().indexOf(' ') >= 0) {
              throw index
            }
          }
        )
        this.$emit('onCreateEventMultipleUser', {
          eventMultipleUserRecord: this.eventMultipleUserRecord
        })
      } catch (e) {
        $('#username').addClass('is-invalid')
        const numberOfRow = e + 1
        addDangerMessage(
          'Fehler',
          'Die Benutzerliste enthält fehlerhafte Eintragungen oder Leerzeilen in Zeile ' +
            numberOfRow
        )
      }
    },
    localize (path) {
      return localize(path)
    }
  }
}
</script>
