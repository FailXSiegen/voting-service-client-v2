import * as R from 'ramda'

const localizations = {
  de_DE: {
    view: {
      article: {
        filter: {
          manufacturer: 'Manufacturer',
          articleTitle: 'Series',
          articleNumber: 'Article No.',
          submit: 'Search'
        },
        edit: {
          title: 'Title',
          ean: 'EAN',
          articleNumber: 'Article No.',
          series: 'Series',
          protectionClass: 'Protection Class',
          protectiveCap: 'Protective Cap',
          punctureProtection: 'Puncture Protection',
          sizeFrom: 'Size From',
          sizeTo: 'Size To',
          secosolCertified: 'Secosol Certified',
          instructionPresent: 'Instruction Present',
          instructionLink: 'Instruction Link',
          optionalFileLink: 'Optional File Link',
          certificate: 'Certificate',
          manufacturer: 'Manufacturer',
          submit: 'Save'
        }
      },
      manufacturer: {
        filter: {
          manufacturer: 'Manufacturer',
          submit: 'Search'
        },
        edit: {
          title: 'Title',
          logo: 'Logo',
          website: 'Website',
          submit: 'Save',
          selectMedia: 'Select media'
        }
      },
      media: {
        filter: {
          name: 'Name',
          submit: 'Filter',
          mediaType: 'Type'
        },
        upload: {
          headline: 'Upload file',
          label: 'Choose file',
          submit: 'Upload'
        },
        removeFile: 'Remove selected file'
      },
      login: {
        title: 'Hartmann OS Shoe finder Administration',
        headline: 'Login',
        emailLabel: 'E-Mail',
        passwordLabel: 'Password',
        submit: 'Login'
      }
    },
    pagination: {
      next: '>',
      previous: '<'
    },
    action: {
      import: 'Import CVS',
      addNew: '+'
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
