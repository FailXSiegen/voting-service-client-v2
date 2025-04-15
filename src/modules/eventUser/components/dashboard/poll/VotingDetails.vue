<template>
  <div
    v-if="activePollEventUser && activePollEventUser.pollUser"
    class="card mb-3"
  >
    <div class="card-header d-flex justify-content-between align-items-center">
      <h5 class="card-title mb-0">
        {{ $t("view.polls.active.title") }}
      </h5>
      <button 
        class="btn btn-sm btn-outline-secondary" 
        @click="isCollapsed = !isCollapsed"
      >
        <i :class="isCollapsed ? 'bi bi-chevron-down' : 'bi bi-chevron-up'"></i>
      </button>
    </div>
    <div v-show="!isCollapsed" class="card-body">
      <div class="row">
        <div class="d-flex flex-wrap">
          <div
            v-for="(pollUser, index) in sortedPollUsers"
            :key="pollUser.id"
            class="d-flex align-items-center px-3 mb-3"
            :class="{ 'border-end border-secondary': index < sortedPollUsers.length - 1 }"
          >
            <span v-html="hasVoted(pollUser) ? '<i class=\'bi bi-check-square text-success\'></i>' : '<i class=\'bi bi-x-square text-danger\'></i>'"></span>
            <span class="mx-2">{{ pollUser.publicName }}</span>
            <template v-if="getPollUserAnswers(pollUser.id).length">
              <span
                v-for="(count, answer) in groupUserAnswers(pollUser.id)"
                :key="answer"
                class="badge rounded-pill mt-0"
                :class="{
                  'bg-success': answer === 'Ja',
                  'bg-danger': answer === 'Nein',
                  'bg-secondary': answer !== 'Ja' && answer !== 'Nein'
                }"
              >
                {{ answer }} <template v-if="count > 1">x{{ count }}</template>
              </span>
            </template>
            <span v-else class="badge rounded-pill bg-secondary mt-0">?</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue';
import t from "@/core/util/l18n";

const STORAGE_KEY = 'active_poll_collapsed';

const stored = localStorage.getItem(STORAGE_KEY);
const isCollapsed = ref(stored ? JSON.parse(stored) : false);

watch(isCollapsed, (newValue) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(newValue));
});

const props = defineProps({
  activePollEventUser: {
    type: Object,
    required: true,
  },
});

const sortedPollUsers = computed(() => {
  if (!props.activePollEventUser?.pollUser) return [];
  
  return [...props.activePollEventUser.pollUser].sort((a, b) => {
    const aVoted = hasVoted(a);
    const bVoted = hasVoted(b);
    if (aVoted && !bVoted) return -1;
    if (!aVoted && bVoted) return 1;
    
    return a.publicName.localeCompare(b.publicName);
  });
});

function getPollUserAnswers(userId) {
  return props.activePollEventUser?.pollAnswers?.filter(
    (a) => a.pollUserId === userId
  ) || [];
}

function groupUserAnswers(userId) {
  const answers = getPollUserAnswers(userId);
  const grouped = {};
  
  answers.forEach((answer) => {
    grouped[answer.answerContent] = (grouped[answer.answerContent] || 0) + 1;
  });
  
  return grouped;
}

function hasVoted(pollUser) {
  return props.activePollEventUser?.pollUserVoted?.find((pollUserVoted) => {
    return (
      parseInt(pollUserVoted?.eventUserId, 10) ===
      parseInt(pollUser?.eventUserId, 10)
    );
  });
}
</script>