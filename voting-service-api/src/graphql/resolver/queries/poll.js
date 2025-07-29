import {
  findPollsWithNoResults,
  findOneById,
  findPollsByEventId,
} from "../../../repository/poll/poll-repository";
import { isAsyncEventStarted } from "../../../repository/event-repository";

export default {
  poll: async (_, { id }) => {
    return await findOneById(id);
  },
  pollsWithNoResults: async (_, { eventId }) => {
    // Prüfe ob asynchrone Events gestartet sind
    const canShowPolls = await isAsyncEventStarted(eventId);
    if (!canShowPolls) {
      return []; // Keine Polls für noch nicht gestartete async Events
    }
    return await findPollsWithNoResults(eventId);
  },
  polls: async (_, { eventId }) => {
    // Prüfe ob asynchrone Events gestartet sind
    const canShowPolls = await isAsyncEventStarted(eventId);
    if (!canShowPolls) {
      return []; // Keine Polls für noch nicht gestartete async Events
    }
    return await findPollsByEventId(eventId);
  },
};
