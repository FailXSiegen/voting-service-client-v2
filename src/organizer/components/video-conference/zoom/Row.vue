<template>
  <div class="list-group-item list-group-item-action">
    <div class="row">
      <div class="col-1">
        Zoom
      </div>
      <div class="col-9">
        {{ meeting.title }}
      </div>
      <div class="col-2">
        <div class="btn-group float-right" role="group">
          <button @click.prevent="onEdit" type="button" class="btn btn-secondary">
            <i class="bi-pencil bi--xl"></i>
          </button>
          <button @click.prevent="onDelete" type="button" class="btn btn-danger">
            <i class="bi-trash bi--xl"></i>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { DELETE_ZOOM_MEETING } from '@/organizer/api/graphql/gql/mutations'
import { addDangerMessage, addSuccessMessage } from '@/frame/lib/alert-helper'

export default {
  props: {
    meeting: {
      type: Object,
      required: true
    }
  },
  methods: {
    onEdit () {
      this.$router.push({ name: 'EditZoomMeeting', params: { id: this.meeting.id } })
    },
    onDelete () {
      this.$apollo
        .mutate({
          mutation: DELETE_ZOOM_MEETING,
          variables: { id: this.meeting.id }
        })
        .then(response => {
          addSuccessMessage('Erfolg', 'Zoom Meeting mit Titel "' + this.meeting.title + '" entfernt!')
          this.$emit('delete', { meeting: this.meeting })
        })
        .catch(error => {
          addDangerMessage('Fehler', 'Zoom Meeting konnte nicht erstellt werden')
          console.error(error)
        })
    }
  }
}
</script>
