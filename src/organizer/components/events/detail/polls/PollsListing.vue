<template>
  <div class="polls-listing-container" v-if="pollsWithNoResults">
    <h2 v-if="pollsWithNoResults.length > 0">
      {{ localize('view.polls.headlines.listingTitle') }}
    </h2>
    <ul class="created-polls list-group">
      <li
        v-for="(poll, index) in pollsWithNoResults"
        :key="index"
        class="list-group-item"
      >
        <h5 class="mb-1">{{ poll.title }}</h5>
        <button
          class="btn btn-success my-2 mr-2"
          :disabled="currentOnlineUserCount === 0"
          @click="startPoll(poll.id)"
        >
          <i
            class="bi-play-fill bi--2xl"
            @title="
              {
                {
                  localize('view.polls.listing.start')
                }
              }
            "
          ></i>
        </button>
        <button class="btn btn-warning my-2 mr-2" @click="copyPoll(poll)">
          <i class="bi-files bi--2xl"></i>
        </button>
        <button class="btn btn-danger my-2 mr-2" @click="deletePoll(poll.id)">
          <i
            class="bi-trash bi--2xl"
            @title="
              {
                {
                  localize('view.polls.listing.delete')
                }
              }
            "
          ></i>
        </button>
      </li>
    </ul>
  </div>
</template>

<script>
import { localize } from '@/frame/lib/localization-helper'

export default {
  props: {
    pollsWithNoResults: {
      type: Array
    },
    currentOnlineUserCount: {
      type: Number
    }
  },
  methods: {
    startPoll (pollId) {
      if (confirm('Abstimmung starten?')) {
        this.$emit('onStartPoll', pollId)
      }
    },
    deletePoll (pollId) {
      if (confirm('Datensatz wirklich löschen?')) {
        this.$emit('onRemovePoll', pollId)
      }
    },
    async copyPoll (poll) {
      this.$emit('onCopyPoll', poll)
    },
    localize (path) {
      return localize(path)
    }
  }
}
</script>
