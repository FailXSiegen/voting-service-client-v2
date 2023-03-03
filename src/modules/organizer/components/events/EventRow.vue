<template>
  <tr class="table-event">
    <td
      scope="row"
      class="pb-3"
    >
      <b>{{ event.title }}</b> <br>
      <small><u
        class="btn p-0"
        @click="copyTextToClipboard(location + '/' + event.slug)"
      >{{ event.slug }}</u></small><br>
      <hr v-if="event.description">
      <small>{{ event.description }}</small>
      <br>
      <button
        v-if="eventsShowDelete"
        class="btn btn-danger mx-1 my-2"
        :title="$t('view.event.listing.actions.delete')"
        :disabled="event.active"
        @click="onDelete(event.id, event.organizer.id)"
      >
        <i class="bi-trash bi--2xl" />
      </button>
      <button
        v-if="eventsShowActivate && !event.active"
        class="btn btn-warning mx-1 my-2"
        :title="$t('view.event.listing.actions.delete')"
        @click="onToggleActivate(event.id, true)"
      >
        <i class="bi-eye bi--2xl" />
      </button>
      <button
        v-if="eventsShowActivate && event.active"
        class="btn btn-info mx-1 my-2"
        :title="$t('view.event.listing.actions.delete')"
        @click="onToggleActivate(event, false)"
      >
        <i class="bi-eye-slash bi--2xl" />
      </button>
    </td>
    <td
      v-if="showOrganizer"
      class="align-middle"
    >
      <b>{{ event.organizer.publicName }}</b> <br>
      {{ event.organizer.username }}<br>
      {{ event.organizer.email }}<br>
    </td>
    <td class="align-middle">
      {{ getCreateDatetime }}
    </td>
    <td
      :class="{
        'bg-danger': getDaysSinceScheduledDateTime > 180 && showOrganizer
      }"
      class="align-middle"
    >
      {{ getScheduledDatetime }}
      <span v-if="showOrganizer">- {{ getDaysSinceScheduledDateTime }} Tage</span>
    </td>
    <td
      v-if="event.active"
      class="text-center text-success text-uppercase align-middle"
    >
      {{ $t('view.event.listing.stateActive') }}
    </td>

    <td
      v-else
      class="text-center text-danger text-uppercase align-middle"
    >
      {{ $t('view.event.listing.stateLocked') }}
    </td>

    <td
      v-if="eventsDetail"
      class="align-middle"
    >
      <router-link
        :to="{name: RouteOrganizerEventsEdit, params: { id: event.id }}"
        class="btn btn-primary mx-1 my-2"
      >
        <i class="bi-pencil-square bi--2xl" />
      </router-link>
      <span
        class="btn btn-secondary mx-1 my-2"
        :title="$t('view.event.listing.actions.inviteLink')"
        @click="copyTextToClipboard(location + '/' + event.slug)"
      >
        <i class="bi-link-45deg bi--2xl" />
      </span>
      <!-- @todo add missing link to member list! -->
      
      <!--      <router-link-->
      <!--        :to="{ name: 'MemberList', params: { eventSlug: event.slug } }"-->
      <!--        class="btn btn-info mx-1 my-2"-->
      <!--        :title="$t('view.event.listing.actions.newTab')"-->
      <!--      >-->
      <!--        <i class="bi-eye-fill bi&#45;&#45;2xl" />-->
      <!--      </router-link>-->
      <button
        class="btn btn-danger mx-1 my-2"
        :title="$t('view.event.listing.actions.delete')"
        :disabled="event.active"
        @click="onDelete(event?.id, event?.organizer?.id)"
      >
        <i class="bi-trash bi--2xl" />
      </button>
    </td>
  </tr>
</template>

<script setup>
import {createFormattedDateFromTimeStamp} from '@/core/util/time-stamp';
import {computed} from "vue";
import {toast} from "vue3-toastify";
import i18n from "@/l18n";
import {handleError} from "@/core/error/error-handler";
import {useCore} from "@/core/store/core";
import {createConfirmDialog} from "vuejs-confirm-dialog";
import ConfirmModal from "@/core/components/ConfirmModal.vue";
import {RouteOrganizerEventsEdit} from "@/router/routes";

const coreStore = useCore();

const emit = defineEmits(['delete', 'toggleActive']);
const props = defineProps({
  event: {
    type: Object,
    required: true
  },
  eventsDetail: {
    type: Boolean,
    required: true
  },
  showOrganizer: {
    type: Boolean,
    default() {
      return false;
    }
  },
  eventsShowDelete: {
    type: Boolean,
    default() {
      return false;
    }
  },
  eventsShowActivate: {
    type: Boolean,
    default() {
      return false;
    }
  }
});

const location = window.location.protocol + '//' + window.location.host;

// computed values.
const getCreateDatetime = computed(() => createFormattedDateFromTimeStamp(props.event.createDatetime));
const getScheduledDatetime = computed(() => createFormattedDateFromTimeStamp(props.event.scheduledDatetime));
const getDaysSinceScheduledDateTime = computed(() => {
  const $todayUnixTimeDate = Math.floor(Date.now() / 1000);
  const $unixDifference = $todayUnixTimeDate - props.event.scheduledDatetime;
  return parseInt($unixDifference / 86400);
});

function onDelete(eventId, organizerId) {
  const dialog = createConfirmDialog(ConfirmModal, {
    message: i18n.global.tc('view.event.listing.confirm.deleteQuestion')
  });
  dialog.onConfirm(() => {
    if (props.showOrganizer && organizerId) {
      emit('delete', {eventId, organizerId});
      return;
    }
    emit('delete', {
      eventId,
      organizerId: coreStore.user?.id ?? 0
    });
  });

  // Show confirm dialog.
  dialog.reveal();
}

function onToggleActivate(eventId, status) {
  const dialog = createConfirmDialog(ConfirmModal, {
    message: i18n.global.tc('view.event.listing.confirm.updateActiveStateQuestion')
  });
  dialog.onConfirm(() => {
    emit('toggleActive', {eventId, status});
  });

  // Show confirm dialog.
  dialog.reveal();
}

function fallbackCopyTextToClipboard(text) {
  // @todo move to service
  const textArea = document.createElement('textarea');
  textArea.value = text;
  // Avoid scrolling to bottom
  textArea.style.top = '0';
  textArea.style.left = '0';
  textArea.style.position = 'fixed';
  document.body.appendChild(textArea);
  textArea.focus();
  textArea.select();
  try {
    document.execCommand('copy');
    toast(i18n.global.tc('view.event.listing.textCopiedToClipboard'), {type: 'success'});
  } catch (error) {
    handleError(error);
  }
  document.body.removeChild(textArea);
}

function copyTextToClipboard(text) {
  if (!navigator.clipboard) {
    fallbackCopyTextToClipboard(text);
    return;
  }
  navigator.clipboard.writeText(text).then(
      function () {
        // @todo show copied text?
        toast(i18n.global.tc('view.event.listing.textCopiedToClipboard'), {type: 'success'});
      },
      function (error) {
        handleError(error);
      }
  );
}

</script>
