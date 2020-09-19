<template>
  <tr class="table-event">
    <th scope="row">{{ event.title }} <br/>
      <small>{{ event.description}}</small>
    </th>
    <td>{{ getCreateDatetime }}</td>
    <td>{{ getScheduledDatetime }}</td>
    <td class="text-center text-success text-uppercase" v-if="!eventsDetail && event.active">
      {{ localize('view.event.listing.stateActive') }}
    <td class="text-center text-danger text-uppercase" v-else-if="!eventsDetail && !event.active">
      {{ localize('view.event.listing.stateLocked') }}
    </td>
    <td>
      <router-link :to="{ name: 'updateEvent', params: { eventRecord }}"
                   class="btn btn-primary mx-1 my-2"
              :title="localize('view.event.listing.actions.edit')">
        <i class="bi-pencil-square bi--2xl"></i>
      </router-link>
      <router-link :to="{ name: 'Event', params: { eventSlug: event.slug }}"
                   class="btn btn-secondary mx-1 my-2"
              :title="localize('view.event.listing.actions.inviteLink')">
        <i class="bi-files bi--2xl"></i>
      </router-link>
      <router-link :to="{ name: 'MemberList', params: { eventRecord }}"
         class="btn btn-info mx-1 my-2"
                   :title="localize('view.event.listing.actions.newTab')">
        <i class="bi-eye-fill bi--2xl"></i>
      </router-link>
      <button @click="onClose"
              class="btn btn-danger mx-1 my-2"
              :title="localize('view.event.listing.actions.close')">
        <i class="bi-shield-fill-exclamation bi--2xl"></i>
      </button>
    </td>
  </tr>
</template>

<script>
import { localize } from '@/helper/localization-helper'
import { createFormattedDateFromTimeStamp } from '@/lib/time-stamp'

export default {
  props: {
    event: {
      type: Object,
      required: true
    },
    eventsDetail: {
      type: Boolean,
      required: true
    }
  },
  data () {
    return {
      eventRecord: this.event
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
    onClose () {
      if (confirm('Event schließen?')) {
        alert('Close Event')
      }
    }
  },
  computed: {
    getCreateDatetime () {
      return createFormattedDateFromTimeStamp(this.event.createDatetime)
    },
    getScheduledDatetime () {
      return createFormattedDateFromTimeStamp(this.event.scheduledDatetime)
    }
  }
}
</script>
