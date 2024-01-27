<template>
  <hr />
  <div class="polls-container mb-3">
    <p v-if="currentOnlineUserCount && currentOnlineUserCount === 0">
      <u>
        {{ $t("view.polls.noActiveUser") }}
      </u>
    </p>
    <div v-if="polls" class="polls-listing-container">
      <h2 v-if="polls.length > 0">
        {{ $t("view.polls.headlines.listingTitle") }}
      </h2>
      <ul class="created-polls list-group">
        <li v-for="poll in polls" :key="poll.id" class="list-group-item">
          <h5 class="mb-1">
            {{ poll.title }}
          </h5>
          <button
            v-if="showStartButton"
            class="btn btn-success my-2 mr-2"
            :disabled="disabled || currentOnlineUserCount === 0"
            :title="$t('view.polls.listing.start')"
            @click="onStart(poll.id)"
          >
            <i class="bi bi-play-fill bi--2xl" />
          </button>
          <button
            class="btn btn-secondary my-2 mr-2"
            :title="$t('view.polls.listing.edit')"
            :disabled="disabled"
            @click="onEdit(poll.id)"
          >
            <i class="bi bi-pencil-square bi--2xl" />
          </button>
          <button
            class="btn btn-secondary my-2 mr-2"
            :title="$t('view.polls.listing.copy')"
            :disabled="disabled"
            @click="onCopy(poll.id)"
          >
            <i class="bi bi-files bi--2xl" />
          </button>
          <button
            class="btn btn-danger my-2 mr-2"
            :title="$t('view.polls.listing.delete')"
            :disabled="disabled"
            @click="onRemove(poll.id)"
          >
            <i class="bi bi-trash bi--2xl" />
          </button>
        </li>
      </ul>
    </div>
  </div>
</template>

<script setup>
defineProps({
  polls: {
    type: Array,
    required: true,
  },
  currentOnlineUserCount: {
    type: Number,
    default: null,
  },
  showStartButton: {
    type: Boolean,
    default: true,
  },
  disabled: {
    type: Boolean,
    default: false,
  },
});
const emit = defineEmits(["copy", "edit", "remove", "start"]);

// Events.

function onCopy(pollId) {
  emit("copy", pollId);
}

function onEdit(pollId) {
  emit("edit", pollId);
}

function onRemove(pollId) {
  emit("remove", pollId);
}

function onStart(pollId) {
  emit("start", pollId);
}
</script>
