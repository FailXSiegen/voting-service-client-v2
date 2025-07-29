import { NetworkError } from "@/core/error/NetworkError";
import { InvalidAnonymousLoginError } from "@/core/error/event/InvalidAnonymousLoginError";
import { InactiveEventLoginError } from "@/core/error/event/InactiveEventLoginError";
import { EventNotFoundError } from "@/core/error/event/EventNotFoundError";
import { UnauthorizedError } from "@/core/error/UnauthorizedError";

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
    case "InvalidCredentialsError":
    case "UnauthorizedError":
    case "InvalidPasswordError":
    case "AuthenticationError":
      return new UnauthorizedError();
    default:
      return new NetworkError();
  }
}
