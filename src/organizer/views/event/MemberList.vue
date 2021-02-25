<template>
  <div class="memberlist-container">
    <slot name="alerts"></slot>
    <app-navigation :eventUsers="eventUsers" :eventRecord="eventRecord" />
    <div class="container-fluid">
      <div class="row">
        <div class="col-12 py-3 order-1 order-lg-2">
          <h1>{{ headline }}</h1>
          <router-link
            :to="{ name: 'CreateEventUser' }"
            class="btn btn-success my-3 mr-3"
          >
            <i class="bi-plus bi--2xl align-middle"></i>
            <span class="align-middle">{{
              localize('view.event.create.labels.eventUser.createNew')
            }}</span>
          </router-link>
          <router-link
            :to="{ name: 'CreateEventMultipleUser' }"
            class="btn btn-info my-3"
          >
            <i class="bi-list bi--2xl align-middle"></i>
            <span class="align-middle">{{
              localize('view.event.create.labels.eventMultipleUser.createNew')
            }}</span>
          </router-link>
          <hr />
          <div class="form-group">
            <label for="filterByUsername">Filter für Benutzernamen</label>
            <input
              type="text"
              class="form-control"
              id="filterByUsername"
              value=""
              placeholder="Filtern nach Benutzernamen"
              v-model="filterByUsername"
              @input="onFilter"
            />
          </div>
          <div
            class="filter-result"
            v-if="filteredEventUsers && filterByUsername"
          >
            <app-verified-users
              :eventUsers="filteredEventUsers"
              :eventRecord="eventRecord"
            />
          </div>
          <hr />
          <div class="container-member-status">
            <table class="table table-sm">
              <thead class="thead-light">
                <tr>
                  <th>
                    {{ localize('view.event.user.member') }} /
                    {{ localize('view.event.user.online') }} /
                    {{ localize('view.event.user.offline') }}
                  </th>
                  <th>
                    {{ localize('view.event.user.visitor') }} /
                    {{ localize('view.event.user.online') }} /
                    {{ localize('view.event.user.offline') }}
                  </th>
                  <th>
                    {{ localize('view.event.user.all') }} /
                    {{ localize('view.event.user.online') }} /
                    {{ localize('view.event.user.offline') }}
                  </th>
                  <th>
                    {{ localize('view.event.user.allVoteAmount') }} /
                    {{ localize('view.event.user.online') }} /
                    {{ localize('view.event.user.offline') }}
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>
                    {{ verifiedUsersCountAllowToVote }} /
                    {{ verifiedUsersCountAllowToVoteOnline }} /
                    {{ verifiedUsersCountAllowToVoteOffline }}
                  </td>
                  <td>
                    {{ verifiedUsersCountNotAllowToVote }} /
                    {{ verifiedUsersCountNotAllowToVoteOnline }} /
                    {{ verifiedUsersCountNotAllowToVoteOffline }}
                  </td>
                  <td>
                    {{ verifiedUsersCount }} / {{ verifiedUsersCountOnline }} /
                    {{ verifiedUsersCountOffline }}
                  </td>
                  <td>
                    {{ verifiedUsersVoteCount }} /
                    {{ verifiedUsersVoteCountOnline }} /
                    {{ verifiedUsersVoteCountOffline }}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <hr />
          <app-verified-users
            :eventUsers="verifiedUsers"
            :eventRecord="eventRecord"
          />
        </div>
      </div>
    </div>
  </div>
</template>
<script>
export { default } from '@/organizer/views/event/MemberList.vue.js'
</script>
