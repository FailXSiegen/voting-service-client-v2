<template>
  <div class="memberlist-container container-fluid">
    <slot name="alerts"></slot>
    <div class="row">
      <div class="col-12 col-md-3 bg-dark text-white py-3 order-2 order-lg-1">
        <app-navigation :eventUsers="eventUsers" :eventRecord="eventRecord" />
      </div>
      <div class="col-12 col-md-9 py-3 order-1 order-lg-2">
        <h1>{{ headline }}</h1>
        <router-link
          :to="{ name: 'CreateEventUser' }"
          class="btn btn-success my-3"
        >
          <i class="bi-plus bi--2xl align-middle"></i>
          <span class="align-middle">{{
            localize('view.event.create.labels.eventUser.createNew')
          }}</span>
        </router-link>
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
</template>
<script>
export { default } from '@/organizer/views/event/MemberList.vue.js'
</script>
