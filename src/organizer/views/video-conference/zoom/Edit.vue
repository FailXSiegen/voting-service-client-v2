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
      <app-zoom-data-form v-if="meeting" :meeting="meeting" @submit="onSubmit"/>
    </div>
  </div>
</template>

<script>
import AppNavigation from '@/organizer/components/Navigation'
import AppZoomDataForm from '@/organizer/components/video-conference/zoom/DataForm'
import { ZOOM_MEETING } from '@/organizer/api/graphql/gql/queries'
import { UPDATE_ZOOM_MEETING } from '@/organizer/api/graphql/gql/mutations'
import { addDangerMessage, addSuccessMessage } from '@/frame/lib/alert-helper'

export default {
  components: {
    AppNavigation,
    AppZoomDataForm
  },
  props: {
    id: {
      type: String,
      required: true
    }
  },
  apollo: {
    meeting: {
      query: ZOOM_MEETING,
      variables () {
        return {
          id: this.id
        }
      },
      update: data => data.zoomMeeting
    }
  },
  created () {
    document.title = 'Videokonferenzsysteme - digitalwahl.org'
  },
  data () {
    return {
      headline: 'Videokonferenzsysteme',
      meeting: null
    }
  },
  methods: {
    onSubmit ({ meeting }) {
      delete meeting.__typename
      this.$apollo
        .mutate({
          mutation: UPDATE_ZOOM_MEETING,
          variables: { input: meeting }
        })
        .then(response => {
          const updatedZoomMeeting = response.data.updateZoomMeeting
          if (updatedZoomMeeting) {
            addSuccessMessage('Erfolg', 'Zoom Meeting mit Titel "' + updatedZoomMeeting.title + '" aktualisiert!')
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
