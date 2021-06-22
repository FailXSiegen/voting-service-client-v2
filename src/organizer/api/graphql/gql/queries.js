import gql from 'graphql-tag'

export const UPCOMING_EVENTS = gql`
  query upcomingEvents($organizerId: ID) {
     upcomingEvents(organizerId: $organizerId) {
        id
        createDatetime
        modifiedDatetime
        title
        slug
        description
        scheduledDatetime
        lobbyOpen
        active
     }
  }
`

export const EXPIRED_EVENTS = gql`
  query expiredEvents($organizerId: ID!) {
     expiredEvents(organizerId: $organizerId) {
        id
        createDatetime
        modifiedDatetime
        title
        slug
        description
        scheduledDatetime
        lobbyOpen
        active
     }
  }
`

export const ALL_UPCOMING_EVENTS = gql`
  query allUpcomingEvents {
     allUpcomingEvents {
        id
        organizer {
          id
          publicName
          username
          email
        } 
        createDatetime
        modifiedDatetime
        title
        slug
        description
        scheduledDatetime
        lobbyOpen
        active
     }
  }
`

export const ALL_PAST_EVENTS = gql`
  query allPastEvents($page: Int, $pageSize: Int) {
     allPastEvents(page: $page, pageSize: $pageSize) {
        id
        organizer {
          id
          publicName
          username
          email
        } 
        createDatetime
        modifiedDatetime
        title
        slug
        description
        scheduledDatetime
        lobbyOpen
        active
     }
  }
`

export const EVENT_USERS_BY_EVENT = gql`
  query findEventUserByEvent($eventId: ID) {
    eventUsers(eventId: $eventId) {
      id
      eventId
      publicName
      verified
      allowToVote
      online
      username
      voteAmount
    }
  }
`

export const ORGANIZER = gql`
 query organizer($organizerId:ID!) {
  organizer(organizerId:$organizerId) {
    id
    username
    email
    password
    publicName
    publicOrganisation
    confirmedEmail
    verified
    superAdmin
    createDatetime
  }
}
`

export const ORGANIZERS = gql`
  query findOrganizers {
    organizers {
      id
      createDatetime
      username
      email
      password
      publicName
      publicOrganisation
      confirmedEmail
      superAdmin
      verified
      hash
    }
  }
`

export const POLLS_NO_RESULTS = gql`
  query findPollsWithNoResults($eventId: ID) {
    pollsWithNoResults(eventId: $eventId) {
      id
      title
      pollAnswer
      type
      list
      possibleAnswers {
        id
        content
      }
      minVotes
      maxVotes
      allowAbstain
    }
  }
`

export const ACTIVE_POLL = gql`
  query findActivePoll($eventId: ID) {
    activePoll(eventId: $eventId) {
      id
      title
      maxVotes
      answerCount
      pollUserCount
      pollUserVotedCount
    }
  }
`

export const ACTIVE_POLL_EVENT_USER = gql`
  query findActivePollEventUser($eventId: ID) {
    activePollEventUser(eventId: $eventId) {
      pollUser {
        id
        eventUserId
        publicName
      }
      pollUserVoted {
        id
        eventUserId
        publicName
        pollResultId
      }
    }
  }
`
