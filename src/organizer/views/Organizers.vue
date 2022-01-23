<template>
  <div class="organizers-container" v-if="organizer.superAdmin">
    <app-navigation />
    <div class="container-fluid">
      <slot name="alerts"></slot>
      <div class="row">
        <div class="col-12 py-3 order-1 order-md-2">
          <h1>{{ headline }}</h1>
          <hr />
          <p>Gesamt: {{ organizers.length }}</p>
          <hr />
          <div class="row">
            <div class="col-12 my-2">
              <table class="table table-responsive-md">
                <thead class="thead-light sortable">
                  <tr>
                    <th
                      scope="col"
                      :class="activeSortParam('username')"
                      @click.prevent="sortTable('username')"
                    >
                      {{ localize('view.organizers.user') }}
                    </th>
                    <th
                      scope="col"
                      :class="activeSortParam('createDatetime')"
                      @click.prevent="sortTable('createDatetime')"
                    >
                      {{ localize('view.organizers.createDatetime') }}
                    </th>
                    <th
                      scope="col"
                      :class="activeSortParam('publicOrganisation')"
                      @click.prevent="sortTable('publicOrganisation')"
                    >
                      {{ localize('view.organizers.organisation') }}
                    </th>
                    <th
                      scope="col"
                      :class="activeSortParam('email')"
                      @click.prevent="sortTable('email')"
                    >
                      {{ localize('view.organizers.mail') }}
                    </th>
                    <th
                      scope="col"
                      :class="activeSortParam('confirmedEmail')"
                      @click.prevent="sortTable('confirmedEmail')"
                    >
                      {{ localize('view.organizers.confirmedMail') }}
                    </th>
                    <th
                      scope="col"
                      :class="activeSortParam('verified')"
                      @click.prevent="sortTable('verified')"
                    >
                      {{ localize('view.organizers.state') }}
                    </th>
                    <th scope="col">
                      {{ localize('view.organizers.actions') }}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <tr
                    class="table-organizer"
                    v-for="(organizerItem, index) in sortedOrganizers"
                    :key="index"
                  >
                    <th scope="row">
                      {{ organizerItem.publicName }} <br />
                      <small>
                        {{ localize('view.organizers.username') }}:
                        <strong>{{ organizerItem.username }}</strong> </small
                      ><br />
                      <small>{{ organizerItem.hash }}</small>
                    </th>
                    <td>
                      {{ getCreateDatetimeFromTimestamp(organizerItem) }}
                    </td>
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
  </div>
</template>

<script>
import AppNavigation from '@/organizer/components/Navigation'
import { localize } from '@/frame/lib/localization-helper'
import { ORGANIZER, ORGANIZERS } from '@/organizer/api/graphql/gql/queries'
import {
  UPDATE_ORGANIZER_VERIFICATION,
  DELETE_ORGANIZER
} from '@/organizer/api/graphql/gql/mutations'
import { createFormattedDateFromTimeStamp } from '@/frame/lib/time-stamp'

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
      currentUserId: this.$store.state.currentUser.id,
      sortParam: 'createDatetime',
      sortOrderInvert: false
    }
  },
  created () {
    document.title = 'Organisatoren - digitalwahl.org'
  },
  methods: {
    localize (path) {
      return localize(path)
    },
    getCreateDatetimeFromTimestamp (item) {
      return createFormattedDateFromTimeStamp(item.createDatetime)
    },
    activeSortParam (sortProperty) {
      if (sortProperty !== this.sortParam) {
        return
      }
      return 'active'
    },
    sortTable (sortProperty) {
      if (sortProperty === this.sortParam) {
        this.sortOrderInvert = !this.sortOrderInvert
      }
      this.sortParam = sortProperty
    },
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
          .catch((error) => {
            console.error(error)
          })
      }
    },
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
        .catch((error) => {
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
        .catch((error) => {
          console.error(error)
        })
    }
  },
  computed: {
    sortedOrganizers: function () {
      const sortOrganizerArray = this.organizers
      const sortedArray = sortOrganizerArray.sort((a, b) =>
        a[this.sortParam] > b[this.sortParam]
          ? -1
          : a[this.sortParam] < b[this.sortParam]
            ? 1
            : 0
      )
      if (this.sortOrderInvert) {
        sortedArray.reverse()
      }
      return sortedArray
    }
  }
}
</script>
