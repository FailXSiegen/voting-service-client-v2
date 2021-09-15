<template>
  <div class="video-conference-container video-conference-listing">
    <app-navigation />
    <div class="container-fluid">
      <slot name="alerts"></slot>
      <div class="row">
        <div class="col-12 py-3 order-2 order-md-1">
          <h1>{{ headline }}</h1>
        </div>
      </div>
      <div class="row">
        <div class="col-3 py-3 order-2 order-md-1 mb-5">
          <div class="input-group" role="group" aria-label="Button group with nested dropdown">
            <select class="custom-select" v-model="selectedNewMeetingType">
              <option v-for="type in meetingTypes" :key="type.id" :value="type.id">{{ type.title }}</option>
            </select>
            <div class="input-group-append">
              <button @click.prevent="onNew" type="button" class="btn btn-success">
                <i class="bi-plus bi--1xl align-middle"></i>
                <span class="align-middle">Neu anlegen</span>
              </button>
            </div>
          </div>
        </div>
      </div>
      <div class="list-group">
        <app-listing-header/>
        <app-zoom-row v-for="(meeting, index) in organizer.zoomMeetings" :key="index" :meeting="meeting" @delete="onDelete"/>
      </div>
    </div>
  </div>
</template>

<script>
import AppNavigation from '@/organizer/components/Navigation'
import AppZoomRow from '@/organizer/components/video-conference/zoom/Row'
import AppListingHeader from '@/organizer/components/video-conference/ListingHeader'
import { ORGANIZER } from '@/organizer/api/graphql/gql/queries'
import { VideoConferenceType } from '@/enum'

export default {
  components: {
    AppNavigation,
    AppListingHeader,
    AppZoomRow
  },
  apollo: {
    organizer: {
      query: ORGANIZER,
      variables () {
        return {
          organizerId: this.$store.getters.getCurrentUserId
        }
      }
    }
  },
  created () {
    document.title = 'Videokonferenzsysteme - digitalwahl.org'
    if (this.$route.query.refresh === '1') {
      this.refresh()
      this.$router.push({ name: 'VideoConference' })
    }
  },
  data () {
    return {
      headline: 'Videokonferenzsysteme einrichten',
      organizer: {},
      saveSuccess: false,
      selectedNewMeetingType: VideoConferenceType.ZOOM
    }
  },
  computed: {
    meetingTypes () {
      return [
        {
          id: VideoConferenceType.ZOOM,
          title: 'Zoom Meeting'
        }
      ]
    }
  },
  methods: {
    onNew () {
      switch (this.selectedNewMeetingType) {
        case VideoConferenceType.ZOOM:
          this.$router.push({ name: 'NewZoomMeeting' })
          break
        default:
          throw new Error('Invalid meeting type!')
      }
    },
    onDelete ({ meeting }) {
      this.refresh()
    },
    refresh () {
      this.$apollo.queries.organizer.refetch()
    }
  }
}
</script>
