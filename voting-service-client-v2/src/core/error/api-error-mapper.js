import { NetworkError } from "@/core/error/NetworkError";
import { InvalidAnonymousLoginError } from "@/core/error/event/InvalidAnonymousLoginError";
import { InactiveEventLoginError } from "@/core/error/event/InactiveEventLoginError";
import { EventNotFoundError } from "@/core/error/event/EventNotFoundError";

/**
 * @param {String} apiErrorName
 * @returns {Error}
 */
export function mapApiErrorToClientError(apiErrorName) {
  switch (apiErrorName) {
    case "EventNotFoundError":
      return new EventNotFoundError();
    case "InactiveEventLoginError":
      return new InactiveEventLoginError();
    case "InvalidAnonymousLoginError":
      return new InvalidAnonymousLoginError();
    default:
      return new NetworkError();
  }
}
