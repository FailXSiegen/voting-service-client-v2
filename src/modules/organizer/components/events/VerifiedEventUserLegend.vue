<template>
  <table class="table table-sm">
    <thead class="thead-light">
      <tr>
        <th>
          {{ $t("view.event.user.member") }} /
          {{ $t("view.event.user.online") }} /
          {{ $t("view.event.user.offline") }}
        </th>
        <th>
          {{ $t("view.event.user.visitor") }} /
          {{ $t("view.event.user.online") }} /
          {{ $t("view.event.user.offline") }}
        </th>
        <th>
          {{ $t("view.event.user.all") }} / {{ $t("view.event.user.online") }} /
          {{ $t("view.event.user.offline") }}
        </th>
        <th>
          {{ $t("view.event.user.allVoteAmount") }} /
          {{ $t("view.event.user.online") }} /
          {{ $t("view.event.user.offline") }}
        </th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>
          {{ verifiedUsersCountAllowToVote }} /
          {{ verifiedUsersCountAllowToVoteOnline }} /
          {{ verifiedUsersCountAllowToVoteOffline }}
        </td>
        <td>
          {{ verifiedUsersCountNotAllowToVote }} /
          {{ verifiedUsersCountNotAllowToVoteOnline }} /
          {{ verifiedUsersCountNotAllowToVoteOffline }}
        </td>
        <td>
          {{ verifiedUsersCount }} / {{ verifiedUsersCountOnline }} /
          {{ verifiedUsersCountOffline }}
        </td>
        <td>
          {{ verifiedUsersVoteCount }} / {{ verifiedUsersVoteCountOnline }} /
          {{ verifiedUsersVoteCountOffline }}
        </td>
      </tr>
    </tbody>
  </table>
</template>

<script setup>
import { computed } from "vue";

const props = defineProps({
  eventUsers: {
    type: Array,
    required: true,
  },
});

const verifiedUsersCount = computed(
  () => props.eventUsers.filter((eventUser) => eventUser.verified).length,
);
const verifiedUsersCountOnline = computed(
  () =>
    props.eventUsers.filter(
      (eventUser) => eventUser.verified && eventUser.online,
    ).length,
);
const verifiedUsersCountOffline = computed(
  () =>
    props.eventUsers.filter(
      (eventUser) => eventUser.verified && !eventUser.online,
    ).length,
);
const verifiedUsersCountAllowToVote = computed(
  () =>
    props.eventUsers.filter(
      (eventUser) => eventUser.verified && eventUser.allowToVote,
    ).length,
);
const verifiedUsersCountAllowToVoteOnline = computed(
  () =>
    props.eventUsers.filter(
      (eventUser) =>
        eventUser.verified && eventUser.online && eventUser.allowToVote,
    ).length,
);
const verifiedUsersCountAllowToVoteOffline = computed(
  () =>
    props.eventUsers.filter(
      (eventUser) =>
        eventUser.verified && !eventUser.online && eventUser.allowToVote,
    ).length,
);
const verifiedUsersCountNotAllowToVote = computed(
  () =>
    props.eventUsers.filter(
      (eventUser) => eventUser.verified && !eventUser.allowToVote,
    ).length,
);
const verifiedUsersCountNotAllowToVoteOnline = computed(
  () =>
    props.eventUsers.filter(
      (eventUser) =>
        eventUser.verified && eventUser.online && !eventUser.allowToVote,
    ).length,
);
const verifiedUsersCountNotAllowToVoteOffline = computed(
  () =>
    props.eventUsers.filter(
      (eventUser) =>
        eventUser.verified && !eventUser.online && !eventUser.allowToVote,
    ).length,
);
const verifiedUsersVoteCount = computed(() => {
  let voteCount = 0;
  props.eventUsers.forEach((eventUser) => {
    if (eventUser.verified && eventUser.allowToVote) {
      voteCount += eventUser.voteAmount;
    }
  });
  return voteCount;
});
const verifiedUsersVoteCountOnline = computed(() => {
  let voteCount = 0;
  props.eventUsers.forEach((eventUser) => {
    if (eventUser.verified && eventUser.online && eventUser.allowToVote) {
      voteCount += eventUser.voteAmount;
    }
  });
  return voteCount;
});
const verifiedUsersVoteCountOffline = computed(() => {
  let voteCount = 0;
  props.eventUsers.forEach((eventUser) => {
    if (eventUser.verified && !eventUser.online && eventUser.allowToVote) {
      voteCount += eventUser.voteAmount;
    }
  });
  return voteCount;
});
</script>
