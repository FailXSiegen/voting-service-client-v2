import * as R from 'ramda'

const localizations = {
  de_DE: {
    view: {
      login: {
        label: {
          email: 'E-Mail',
          password: 'Password',
          eventIdent: 'Enter Event ID'
        },
        headline: {
          title: 'Voting Service',
          userLogin: 'Login as User',
          eventIdent: 'Login by ID'
        },
        submit: 'Login',
        submitToEvent: 'Login to Event'
      },
      profile: {
        headline: '',
        label: {
          currentPassword: 'Current Password',
          newPassword: 'New Password',
          repeatPassword: 'Repeat Password',
          email: 'Email',
          fullName: 'Full Name',
          submit: 'submit'
        }
      },
      event: {
        user: {
          verifyAs: 'Verify as',
          member: 'Member',
          visitor: 'Visitor'
        }
      }
    },
    pagination: {
      next: '>',
      previous: '<'
    }
  }
}

export function localize (path, language) {
  path = language + '.' + path
  const pathParts = path.split('.')
  const value = R.path(pathParts, localizations)
  if (value === undefined || value === null) {
    throw new Error('Could not find localization for path "' + path + '" and language ' + language)
  }
  return value
}
