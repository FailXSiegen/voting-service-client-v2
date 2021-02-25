<template>
  <div class="profile-container">
    <app-navigation />
    <div class="container-fluid">
      <slot name="alerts"></slot>
      <div class="row">
        <div class="col-12 py-3 order-2 order-md-1">
          <h1>{{ headline }}</h1>
          <app-form
            :organizer="organizer"
            @onUpdateOrganizer="updateOrganizer"
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
    updateOrganizer (organizer) {
      delete this.organizer.__typename
      delete this.organizer.username
      delete this.organizer.password
      this.$apollo
        .mutate({
          mutation: UPDATE_ORGANIZER,
          variables: { input: this.organizer }
        })
        .then(() => {
          addSuccessMessage(
            'Erfolg',
            'Der Organisator wurde erfolgreich gespeichert. '
          )
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
      organizer: {}
    }
  }
}
</script>
