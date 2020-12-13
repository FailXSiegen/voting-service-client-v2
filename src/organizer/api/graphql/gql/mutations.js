import gql from 'graphql-tag'

export const CREATE_EVENT_USER = gql`mutation createEventUser($input: CreateEventUserInput!){
  createEventUser(input: $input) {
    id
    publicName
    username
    allowToVote
    verified
    voteAmount
  }
}`
export const UPDATE_EVENT_USER = gql`mutation updateEventUser($input: UpdateEventUserInput!){
  updateEventUser(input: $input) {
    id
    publicName
    username
    allowToVote
    verified
    voteAmount
  }
}`
export const UPDATE_USER_TO_GUEST = gql`mutation UpdateUserToGuest($eventUserId: ID!) {
  updateUserToGuest(eventUserId: $eventUserId) {
    id
    publicName
  }
}`
export const UPDATE_USER_TO_PARTICIPANT = gql`mutation UpdateUserToParticipant($eventUserId: ID!) {
  updateUserToParticipant(eventUserId: $eventUserId) {
    id
    publicName
  }
}`
export const CREATE_POLL = gql`mutation createPoll($input: CreateNewPollInput!, $instantStart: Boolean!){
  createPoll(input: $input, instantStart: $instantStart) {
    id
    eventId
    title
    type
    possibleAnswers {
      content
    }
  }
}`
export const REMOVE_POLL = gql`mutation removePoll($pollId: ID!){
  removePoll(id: $pollId)
}`
export const START_POLL = gql`mutation startPoll($pollId: ID!){
  startPoll(id: $pollId) {
    id
    eventId
    title
    type
    possibleAnswers {
      content
    }
  }
}`
export const STOP_POLL = gql`mutation stopPoll($id: ID!){
  stopPoll(id: $id)
}`

export const CREATE_EVENT_MUTATION = gql`
mutation CreateEvent($input: CreateEventInput!){
  createEvent(input: $input) {
    id
    createDatetime
    title
    slug
    description
    scheduledDatetime
    lobbyOpen
    active
  }
}`

export const UPDATE_EVENT_MUTATION = gql`
mutation UpdateEvent($input: UpdateEventInput!){
  updateEvent(input: $input) {
    id
    title
    slug
    description
    scheduledDatetime
    lobbyOpen
    active
  }
}`

export const UPDATE_ORGANIZER = gql`mutation updateOrganizer($input: UpdateOrganizerInput!){
  updateOrganizer(input: $input) {
    id
    publicName
    email
  }
}`
