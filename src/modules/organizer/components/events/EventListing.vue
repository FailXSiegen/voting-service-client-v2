<template>
  <div class="events-listing-container my-5">
    <h2
      v-if="headline"
      class="mb-3"
    >
      {{ headline }}
    </h2>
    <p class="hint small">
      {{ $t('view.event.listing.deleteInfo') }}
    </p>
    <table
      class="table table-responsive-md table-bordered table-hover table-sm"
    >
      <thead class="thead-light">
        <tr>
          <th scope="col">
            {{ $t('view.event.listing.name') }} <br>
            <small><b>{{ $t('view.event.listing.slug') }}</b></small><br>
            <hr>
            <small><b>{{
              $t('view.event.create.labels.description')
            }}</b></small>
          </th>
          <th
            v-if="showOrganizer"
            scope="col"
          >
            {{ $t('view.event.listing.organizer') }}
          </th>
          <th scope="col">
            {{ $t('view.event.listing.created') }}
          </th>
          <th scope="col">
            {{ $t('view.event.listing.scheduled') }}
          </th>
          <th
            scope="col"
            class="text-center"
          >
            {{ $t('view.event.listing.state') }}
          </th>
          <th
            v-if="eventsDetail"
            scope="col"
          >
            {{ $t('view.event.listing.actions.label') }}
          </th>
        </tr>
      </thead>
      <tbody>
        <EventRow
          v-for="(event, index) in events"
          :key="index"
          :event="event"
          :events-detail="eventsDetail"
          :show-organizer="showOrganizer"
          :events-show-delete="eventsShowDelete"
          :events-show-activate="eventsShowActivate"
          @delete="onDelete"
          @toggle-active="onToggleActive"
        />
      </tbody>
    </table>
  </div>
</template>

<script setup>
import EventRow from '@/modules/organizer/components/events/EventRow.vue';

const emit = defineEmits(['delete', 'toggleActive']);
defineProps({
  headline: {
    type: String,
    required: false,
    default: undefined
  },
  eventsDetail: {
    type: Boolean,
    required: true
  },
  eventsShowDelete: {
    type: Boolean
  },
  eventsShowActivate: {
    type: Boolean
  },
  events: {
    type: Array,
    required: false,
    default() {
      return [];
    }
  },
  showOrganizer: {
    type: Boolean,
    default() {
      return false;
    }
  }
});

function onDelete(event) {
  emit('delete', event);
}

function onToggleActive(event) {
  emit('toggleActive', event);
}
</script>

<style scoped>
.table td,
.table th {
  vertical-align: middle;
}
</style>
