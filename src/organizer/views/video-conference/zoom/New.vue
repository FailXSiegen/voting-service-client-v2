<template>
  <div class="video-conference-container video-conference-edit video-conference-edit-zoom">
    <app-navigation />
    <div class="container-fluid">
      <slot name="alerts"></slot>
      <div class="row">
        <div class="col-12 py-3 order-2 order-md-1">
          <h1>{{ headline }}</h1>
        </div>
      </div>
      <app-zoom-data-form @submit="onSubmit"/>
    </div>
  </div>
</template>

<script>
import AppNavigation from '@/organizer/components/Navigation'
import AppZoomDataForm from '@/organizer/components/video-conference/zoom/DataForm'
import { CREATE_ZOOM_MEETING } from '@/organizer/api/graphql/gql/mutations'
import { addDangerMessage, addSuccessMessage } from '@/frame/lib/alert-helper'

export default {
  components: {
    AppNavigation,
    AppZoomDataForm
  },
  created () {
    document.title = 'Videokonferenzsysteme - Neues Zoom Meeting erstellen - digitalwahl.org'
  },
  data () {
    return {
      headline: 'Neues Zoom Meeting erstellen'
    }
  },
  methods: {
    onSubmit ({ meeting }) {
      meeting.organizerId = this.$store.getters.getCurrentUserId
      this.$apollo
        .mutate({
          mutation: CREATE_ZOOM_MEETING,
          variables: { input: meeting }
        })
        .then(response => {
          const createdZoomMeeting = response.data.createZoomMeeting
          if (createdZoomMeeting) {
            addSuccessMessage('Erfolg', 'Zoom Meeting mit Titel "' + createdZoomMeeting.title + '" erstellt!')
            this.$router.push({ name: 'VideoConference', query: { refresh: '1' } })
          } else {
            addDangerMessage('Fehler', 'Zoom Meeting konnte nicht erstellt werden')
          }
        })
        .catch(error => {
          console.error(error)
        })
    }
  }
}
</script>
