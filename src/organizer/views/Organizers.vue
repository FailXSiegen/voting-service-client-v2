<template>
  <div class="organizers-container container-fluid">
    <slot name="alerts"></slot>
    <div class="row">
      <div class="col-12 col-md-3 bg-dark text-white py-3 order-2 order-md-1">
        <app-navigation/>
      </div>
      <div class="col-12 col-md-9 py-3 order-1 order-md-2">
        <h1>{{ headline }}</h1>

        <div class="row">
          <div class="col-12 my-5">
            <table class="table table-responsive-md">
              <thead class="thead-light">
              <tr>
                <th scope="col">{{ localize('view.organizers.user') }}</th>
                <th scope="col">{{ localize('view.organizers.mail') }}</th>
                <th scope="col">{{ localize('view.organizers.state') }}</th>
                <th scope="col">{{ localize('view.organizers.actions') }}</th>
              </tr>
              </thead>
              <tbody>
              <tr class="table-organizer" v-for="(organizer, index) in organizers" :key="index">
                <th scope="row">
                  {{ organizer.publicName }} <br/>
                  <small>
                    {{ localize('view.organizers.username') }}: <strong>{{ organizer.username }}</strong>
                  </small>
                </th>
                <td>
                  {{ organizer.email }}
                </td>
                <td class="text-success text-uppercase" v-if="organizer.verified">
                  {{ localize('view.organizers.verified') }}
                <td class="text-danger text-uppercase" v-else>
                  <strong>{{ localize('view.organizers.denied') }}</strong>
                </td>
                <td class="d-flex flex-row" v-if="currentUserId != organizer.id">
                  <button v-if="organizer.verified" @click.prevent="onDeny(organizer)"
                          class="btn btn-danger mx-1 my-2 d-flex align-items-center justify-content-center"
                          :title="localize('view.organizers.deny')">
                    <i class="bi-trash bi--xl"></i>
                  </button>
                  <button v-else @click.prevent="onVerify(organizer)"
                          class="btn btn-success mx-1 my-2 d-flex align-items-center justify-content-center"
                          :title="localize('view.organizers.verify')">
                    <i class="bi-check2-square bi--xl"></i>
                  </button>
                  <button @click.prevent="onEdit(organizer)"
                          class="btn btn-warning mx-1 my-2 d-flex align-items-center justify-content-center text-white"
                          :title="localize('view.organizers.edit')">
                    <i class="bi-pencil-square bi--xl"></i>
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
import { ORGANIZERS } from '@/organizer/api/graphql/gql/queries'

export default {
  components: {
    AppNavigation
  },
  apollo: {
    organizers: {
      query: ORGANIZERS
    }
  },
  data () {
    return {
      headline: 'Organizers',
      organizers: [],
      currentUserId: this.$store.state.currentUser.id
    }
  },
  methods: {
    localize (path) {
      return localize(path)
    },
    emittedAlert () {
      return addSuccessMessage('Erfolg', 'Keine Ahnung wie ich das gemacht habe.')
    },
    // @todo: add real manipulation
    onDeny (organizer) {
      organizer.verified = false
      return organizer.verified
    },
    // @todo: add real manipulation
    onVerify (organizer) {
      organizer.verified = true
      return organizer.verified
    },
    onEdit (organizer) {
      console.log(organizer)
    }
  },
  async created () {
    console.log(this.organizers)
  }
}
</script>
