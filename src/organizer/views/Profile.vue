<template>
  <div class="profile-container">
    <app-navigation />
    <div class="container-fluid">
      <slot name="alerts"></slot>
      <div class="alert alert-success text-center" v-if="saveSuccess">
        <h2>Erfolgreich gespeichert</h2>
        <a href="/admin" class="btn btn-primary">Zurück zur Übersicht</a>
      </div>
      <div class="row">
        <div class="col-12 py-3 order-2 order-md-1">
          <h1>{{ headline }}</h1>
          <app-form
            :organizer="organizer"
            @onUpdateOrganizer="updateOrganizer"
            @onUpdateOrganizerError="updateOrganizerError"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import AppNavigation from '@/organizer/components/Navigation'
import AppForm from '@/organizer/components/profile/Form'
import { ORGANIZER } from '@/organizer/api/graphql/gql/queries'
import { UPDATE_ORGANIZER } from '@/organizer/api/graphql/gql/mutations'
import {
  addDangerMessage,
  addSuccessMessage
} from '@/frame/lib/alert-helper.js'

export default {
  components: {
    AppNavigation,
    AppForm
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
  methods: {
    updateOrganizerError (data) {
      addDangerMessage(data.title, data.message)
    },
    async updateOrganizer (returnUpdateOrganizer) {
      const updatedOrganizerObject = JSON.parse(
        JSON.stringify(returnUpdateOrganizer)
      )
      const updatedOrganizer = updatedOrganizerObject.organizer
      delete updatedOrganizer.__typename
      delete updatedOrganizer.createDatetime
      delete updatedOrganizer.username
      this.$apollo
        .mutate({
          mutation: UPDATE_ORGANIZER,
          variables: { input: updatedOrganizer }
        })
        .then(() => {
          addSuccessMessage(
            'Erfolg',
            'Der Organisator wurde erfolgreich gespeichert. '
          )
          this.saveSuccess = true
        })
        .catch(error => {
          addDangerMessage(
            'Fehler!',
            'Der Organisator konnte nicht aktualisiert werden. Für mehr Informationen lohnt ein Blick in die Console.'
          )
          console.error(error)
        })
    }
  },
  created () {
    document.title = 'Profil bearbeiten - digitalwahl.org'
  },
  data () {
    return {
      headline: 'Profil bearbeiten',
      organizer: {},
      saveSuccess: false
    }
  }
}
</script>
