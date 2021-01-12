<template>
  <div class="organizers-container container-fluid" v-if="organizer.superAdmin">
    <slot name="alerts"></slot>
    <div class="row">
      <div class="col-12 col-md-3 bg-dark text-white py-3 order-2 order-md-1">
        <app-navigation />
      </div>
      <div class="col-12 col-md-9 py-3 order-1 order-md-2">
        <h1>{{ headline }}</h1>

        <div class="row">
          <div class="col-12 my-5">
            <table class="table table-responsive-md">
              <thead class="thead-light">
                <tr>
                  <th scope="col">{{ localize('view.organizers.user') }}</th>
                  <th scope="col">
                    {{ localize('view.organizers.organisation') }}
                  </th>
                  <th scope="col">{{ localize('view.organizers.mail') }}</th>
                  <th scope="col">
                    {{ localize('view.organizers.confirmedMail') }}
                  </th>
                  <th scope="col">{{ localize('view.organizers.state') }}</th>
                  <th scope="col">{{ localize('view.organizers.actions') }}</th>
                </tr>
              </thead>
              <tbody>
                <tr
                  class="table-organizer"
                  v-for="(organizerItem, index) in organizers"
                  :key="index"
                >
                  <th scope="row">
                    {{ organizerItem.publicName }} <br />
                    <small>
                      {{ localize('view.organizers.username') }}:
                      <strong>{{ organizerItem.username }}</strong>
                    </small>
                  </th>
                  <td>
                    {{ organizerItem.publicOrganisation }}
                  </td>
                  <td>
                    {{ organizerItem.email }}
                  </td>
                  <td
                    class="text-success text-uppercase"
                    v-if="organizerItem.confirmedEmail"
                  >
                    <i class="bi-envelope-open bi--xl"></i>
                  </td>
                  <td class="text-danger text-uppercase" v-else>
                    <i class="bi-envelope-fill bi--xl"></i>
                  </td>
                  <td
                    class="text-success text-uppercase"
                    v-if="organizerItem.verified"
                  >
                    {{ localize('view.organizers.verified') }}
                  </td>
                  <td class="text-danger text-uppercase" v-else>
                    <strong>{{ localize('view.organizers.denied') }}</strong>
                  </td>
                  <td
                    class="d-flex flex-row"
                    v-if="currentUserId != organizerItem.id"
                  >
                    <button
                      v-if="organizerItem.verified"
                      @click.prevent="onDeny(organizerItem)"
                      class="btn btn-danger mx-1 my-2 d-flex align-items-center justify-content-center"
                      :title="localize('view.organizers.deny')"
                    >
                      <i class="bi-dash-square bi--xl"></i>
                    </button>
                    <button
                      v-else
                      @click.prevent="onVerify(organizerItem)"
                      class="btn btn-success mx-1 my-2 d-flex align-items-center justify-content-center"
                      :title="localize('view.organizers.verify')"
                    >
                      <i class="bi-check2-square bi--xl"></i>
                    </button>
                    <button
                      @click.prevent="onDelete(organizerItem)"
                      class="btn btn-danger mx-1 my-2 d-flex align-items-center justify-content-center"
                      :title="localize('view.organizers.delete')"
                    >
                      <i class="bi-trash bi--xl"></i>
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import AppNavigation from '@/organizer/components/Navigation'
import { addSuccessMessage } from '@/frame/lib/alert-helper'
import { localize } from '@/frame/lib/localization-helper'
import { ORGANIZER, ORGANIZERS } from '@/organizer/api/graphql/gql/queries'
import {
  UPDATE_ORGANIZER_VERIFICATION,
  DELETE_ORGANIZER
} from '@/organizer/api/graphql/gql/mutations'

export default {
  components: {
    AppNavigation
  },
  apollo: {
    organizers: {
      query: ORGANIZERS
    },
    organizer: {
      query: ORGANIZER,
      variables () {
        return {
          organizerId: this.currentUserId
        }
      }
    }
  },
  data () {
    return {
      headline: 'Organizers',
      organizers: [],
      organizer: [],
      currentUserId: this.$store.state.currentUser.id
    }
  },
  methods: {
    localize (path) {
      return localize(path)
    },
    emittedAlert () {
      return addSuccessMessage(
        'Erfolg',
        'Keine Ahnung wie ich das gemacht habe.'
      )
    },
    // @todo: add real manipulation
    onDeny (organizer) {
      organizer.verified = false
      this.updateUnverifyOrganizer(organizer)
      return organizer.verified
    },
    onDelete (organizer) {
      if (confirm('Organisator wirklich löschen?')) {
        this.$apollo
          .mutate({
            mutation: DELETE_ORGANIZER,
            variables: { id: organizer.id }
          })
          .then(() => {
            this.$apollo.queries.organizers.refetch()
          })
          .catch(error => {
            console.error(error)
          })
      }
    },
    // @todo: add real manipulation
    async onVerify (organizer) {
      organizer.verified = true
      await this.updateVerifyOrganizer(organizer)
      return organizer.verified
    },
    updateUnverifyOrganizer (organizer) {
      const input = {
        id: organizer.id,
        verified: false
      }
      this.$apollo
        .mutate({
          mutation: UPDATE_ORGANIZER_VERIFICATION,
          variables: { input: input }
        })
        .then(() => {})
        .catch(error => {
          console.error(error)
        })
    },
    async updateVerifyOrganizer (organizer) {
      const input = {
        id: organizer.id,
        verified: true
      }
      this.$apollo
        .mutate({
          mutation: UPDATE_ORGANIZER_VERIFICATION,
          variables: { input: input }
        })
        .then(() => {})
        .catch(error => {
          console.error(error)
        })
    }
  }
}
</script>
