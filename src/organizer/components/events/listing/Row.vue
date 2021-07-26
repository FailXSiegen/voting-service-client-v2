<template>
  <tr class="table-event">
    <td scope="row" class="pb-3">
      <b>{{ event.title }}</b> <br />
      <small
        ><u
          class="btn p-0"
          @click="copyTextToClipboard(location + '/' + event.slug)"
          >{{ event.slug }}</u
        ></small
      ><br />
      <hr v-if="event.description" />
      <small>{{ event.description }}</small>
      <br />
      <button
        @click="onDelete(event.id, event.organizer.id)"
        class="btn btn-danger mx-1 my-2"
        :title="localize('view.event.listing.actions.delete')"
        v-if="eventsShowDelete"
        :disabled="event.active"
      >
        <i class="bi-trash bi--2xl"></i>
      </button>
      <button
        @click="onToggleActivate(event.id, true)"
        class="btn btn-warning mx-1 my-2"
        :title="localize('view.event.listing.actions.delete')"
        v-if="eventsShowActivate && !event.active"
      >
        <i class="bi-eye bi--2xl"></i>
      </button>
      <button
        @click="onToggleActivate(event.id, false)"
        class="btn btn-info mx-1 my-2"
        :title="localize('view.event.listing.actions.delete')"
        v-if="eventsShowActivate && event.active"
      >
        <i class="bi-eye-slash bi--2xl"></i>
      </button>
    </td>
    <td class="align-middle" v-if="showOrganizer">
      <b>{{ event.organizer.publicName }}</b> <br />
      {{ event.organizer.username }}<br />
      {{ event.organizer.email }}<br />
    </td>
    <td class="align-middle">{{ getCreateDatetime }}</td>
    <td
      :class="{
        'bg-danger': getDaysSinceScheduledDateTime > 180 && showOrganizer
      }"
      class="align-middle"
    >
      {{ getScheduledDatetime }}
      <span v-if="showOrganizer"
        >- {{ getDaysSinceScheduledDateTime }} Tage</span
      >
    </td>
    <td
      class="text-center text-success text-uppercase align-middle"
      v-if="event.active"
    >
      {{ localize('view.event.listing.stateActive') }}
    </td>

    <td class="text-center text-danger text-uppercase align-middle" v-else>
      {{ localize('view.event.listing.stateLocked') }}
    </td>

    <td class="align-middle" v-if="eventsDetail">
      <router-link
        :to="{ name: 'updateEvent', params: { eventSlug: event.slug } }"
        class="btn btn-primary mx-1 my-2"
        :title="localize('view.event.listing.actions.edit')"
      >
        <i class="bi-pencil-square bi--2xl"></i>
      </router-link>
      <span
        @click="copyTextToClipboard(location + '/' + event.slug)"
        class="btn btn-secondary mx-1 my-2"
        :title="localize('view.event.listing.actions.inviteLink')"
      >
        <i class="bi-link-45deg bi--2xl"></i>
      </span>
      <router-link
        :to="{ name: 'MemberList', params: { eventSlug: event.slug } }"
        class="btn btn-info mx-1 my-2"
        :title="localize('view.event.listing.actions.newTab')"
      >
        <i class="bi-eye-fill bi--2xl"></i>
      </router-link>
      <button
        @click="onDelete(event.id)"
        class="btn btn-danger mx-1 my-2"
        :title="localize('view.event.listing.actions.delete')"
        :disabled="event.active"
      >
        <i class="bi-trash bi--2xl"></i>
      </button>
    </td>
  </tr>
</template>

<script>
import { localize } from '@/frame/lib/localization-helper'
import { createFormattedDateFromTimeStamp } from '@/frame/lib/time-stamp'
import { addSuccessMessage, addWarnMessage } from '@/frame/lib/alert-helper'

export default {
  props: {
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
      default () {
        return false
      }
    },
    eventsShowDelete: {
      type: Boolean,
      default () {
        return false
      }
    },
    eventsShowActivate: {
      type: Boolean,
      default () {
        return false
      }
    }
  },
  data () {
    return {
      eventRecord: this.event,
      location: window.location.protocol + '//' + window.location.host
    }
  },
  methods: {
    localize (path) {
      return localize(path)
    },
    onEdit () {
      alert('Edit')
    },
    onInviteLink () {
      alert('Copy invite link')
    },
    onDelete (eventId, organizerId) {
      if (
        confirm(
          'Veranstaltung wird komplett mit allen Informationen unwiederherstellbar gelöscht.\n\nSind Sie sich sicher?'
        )
      ) {
        if (this.showOrganizer && organizerId) {
          this.$emit('onDeleteEvent', eventId, organizerId)
        } else {
          this.$emit('onDeleteEvent', eventId, this.$store.state.currentUser.id)
        }
      }
    },
    onToggleActivate (eventId, status) {
      if (confirm('Veranstaltung wird bearbeitet.\n\nSind Sie sich sicher?')) {
        this.$emit('onToggleActivate', eventId, status)
      }
    },
    fallbackCopyTextToClipboard (text) {
      var textArea = document.createElement('textarea')
      textArea.value = text

      // Avoid scrolling to bottom
      textArea.style.top = '0'
      textArea.style.left = '0'
      textArea.style.position = 'fixed'

      document.body.appendChild(textArea)
      textArea.focus()
      textArea.select()

      try {
        document.execCommand('copy')
        addSuccessMessage('In Zwischenablage kopiert', text)
      } catch (err) {
        addWarnMessage('Fehlgeschlagen', err)
      }

      document.body.removeChild(textArea)
    },
    copyTextToClipboard (text) {
      if (!navigator.clipboard) {
        this.fallbackCopyTextToClipboard(text)
        return
      }
      navigator.clipboard.writeText(text).then(
        function () {
          addSuccessMessage('In Zwischenablage kopiert', text)
        },
        function (err) {
          addWarnMessage('Fehlgeschlagen', err)
        }
      )
    }
  },
  computed: {
    getCreateDatetime () {
      return createFormattedDateFromTimeStamp(this.event.createDatetime)
    },
    getScheduledDatetime () {
      return createFormattedDateFromTimeStamp(this.event.scheduledDatetime)
    },
    getDaysSinceScheduledDateTime () {
      const $todayUnixTimeDate = Math.floor(Date.now() / 1000)
      const $unixDifference = $todayUnixTimeDate - this.event.scheduledDatetime
      return parseInt($unixDifference / 86400)
    }
  }
}
</script>
