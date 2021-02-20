<template>
  <div class="polls-container container-fluid">
    <slot name="alerts"></slot>
    <div class="row">
      <div class="col-12 col-md-3 bg-dark text-white py-3 order-2 order-lg-1">
        <app-navigation :eventUsers="eventUsers" :eventRecord="eventRecord" />
      </div>
      <div class="col-12 col-md-6 col-lg-4 py-3 order-1 order-lg-2">
        <h1>{{ headline }}</h1>
        <hr />
        <app-active-poll
          v-if="activePoll"
          :activePoll="activePoll"
          :copyPoll="copyPoll"
          :activePollAnswerCount="activePollAnswerCount"
          :activePollMaxAnswer="activePollMaxAnswer"
          :pollUserCount="pollUserCount"
          :pollUserVotedCount="pollUserVotedCount"
          @onCloseActivePoll="stopPoll"
        />
        <div
          class="container-no-active-poll text-center alert alert-warning d-flex justify-content-center align-items-center"
          role="alert"
          v-if="!activePoll"
        >
          <p class="mb-0">{{ localize('view.user.verified.noActivePoll') }}</p>
        </div>
        <span>
          Aktuelle Anzahl wahlberechtigter Teilnehmer:
          {{ verifiedUsersCountAllowToVoteOnline }}
        </span>
        <hr v-if="pollsWithNoResults" />
        <app-polls
          v-if="!activePoll"
          :pollsWithNoResults="pollsWithNoResults"
          :eventRecord="eventRecord"
          @onCreatePoll="createPoll"
          @onUpdatePoll="updatePoll"
          @onRemovePoll="removePoll"
          @onStartPoll="startPoll"
        />
      </div>
    </div>
  </div>
</template>
<script>
export { default } from '@/organizer/views/event/Polls.vue.js'
</script>
