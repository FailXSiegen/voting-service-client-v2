import * as R from 'ramda'
import store from '@/store'

const localizations = {
  de_DE: {
    general: {
      yes: 'Ja',
      no: 'Nein',
      abstention: 'Enthaltung',
      member: 'Teilnehmer'
    },
    view: {
      login: {
        label: {
          username: 'E-Mail oder Mitgliedsnummer*',
          usernameHelp: 'Als Benutzername dient Ihre Mitgliedsnummer oder Ihre E-Mail Adresse. Die Informationen dienen zur Akkredetierung.',
          email: 'E-Mail*',
          password: 'Passwort*',
          passwordHelp: 'Bitte verwenden Sie ein Kennwort mit mindestens 6 Zeichen. Das Kennwort wird zur Wiedereinwahl zum Event benötigt, falls Sie wegen Inaktivität oder Unterbrechung wieder teilnehmen möchten.',
          publicName: 'Anzeige-Name*',
          publicNameHelp: 'Hier geben Sie bitte den Namen ein mit dem sie angezeigt werden möchten. Für den Login relevant sind allerdings die unteren Felder.',
          eventIdent: 'Event-ID eingeben*'
        },
        headline: {
          title: 'Voting Service',
          orgaLogin: 'Als Organisator einloggen',
          userLogin: 'Als Besucher einloggen',
          eventIdent: 'Mit Event-ID einloggen',
          userWelcomeTo: 'Herzlich willkommen, bitte loggen Sie sich ein.'
        },
        submit: 'Login',
        submitToEvent: 'In Event einloggen',
        invalidCredentials: 'Invalid credentials'
      },
      profile: {
        headline: '',
        label: {
          currentPassword: 'Aktuelles Passwort',
          newPassword: 'Neues Passwort',
          repeatPassword: 'Neues Passwort erneut eingeben',
          email: 'E-Mail',
          fullName: 'Voller Name',
          submit: 'Speichern'
        }
      },
      event: {
        navigation: {
          members: 'Teilnehmer',
          waitingRoom: 'Warteraum',
          polls: 'Abstimmungen',
          results: 'Ergebnisse',
          back: 'Zurück zur Übersicht'
        },
        user: {
          verifyAs: 'Verifizieren als:',
          setTo: 'Setzen auf:',
          block: 'Benutzer blockieren',
          member: 'Teilnehmer',
          visitor: 'Besucher'
        },
        create: {
          createNew: 'Neues Event erstellen',
          labels: {
            title: 'Event-Titel',
            slug: 'Slug',
            description: 'Event-Beschreibung',
            descriptionHelp: 'Event-Beschreibung',
            scheduledDatetime: 'Start-Datum',
            lobbyOpen: 'Lobby aktivieren / vorzeitiger Login und Anzeige des Events auf der Startseite',
            submit: 'Dieses Event erstellen',
            eventUser: {
              submit: 'Benutzer speichern',
              createNew: 'Neuen Benutzer erstellen',
              update: 'Benutzer bearbeiten',
              allowToVote: 'Teilnehmer mit Stimmrecht',
              verified: 'Freigeschaltet',
              publicName: 'Angezeigter Name',
              username: 'Benutzername',
              amountVote: 'Anzahl der Stimmen'
            }
          }
        },
        listing: {
          name: 'Name',
          created: 'Erstellt am',
          scheduled: 'Geplant am',
          state: 'Status',
          stateActive: 'laufend',
          stateLocked: 'verschlossen',
          actions: {
            label: 'Aktionen',
            edit: 'Bearbeiten',
            inviteLink: 'Einladungs-Link kopieren',
            newTab: 'Event-Organisation in neuem Tab öffnen',
            close: 'Event beenden'
          }
        },
        upcoming: 'Bevorstehende Events',
        latest: 'Letzte Events'
      },
      polls: {
        headlines: {
          createTitle: 'Neue Abstimmung erstellen',
          answerOptionsTitle: 'Antwortoptionen für Abstimmung',
          listingTitle: 'Vorgefertigte Umfragen'
        },
        create: {
          labels: {
            title: 'Was soll abgestimmt werden?',
            yesNo: 'Ja/Nein',
            yesNoAbstain: 'Ja/Nein/Enthalten',
            custom: 'Individuelle Antwortoptionen',
            listOfAnswerOptions: 'Liste der Antwortoptionen',
            listOfAnswerOptionsInfo: 'Ein Eintrag pro Zeile entspricht einer Auswahlmöglichkeit',
            maxVotes: 'Maximal auszuwählen',
            maxVotesInfo: '0 = alle auswählbar',
            minVotes: 'Minimal auszuwählen',
            minVotesInfo: '0 = leere Abstimmung möglich',
            abstention: 'Enthaltungsfeld anzeigen',
            openPoll: 'Offene Abstimmung',
            secretPoll: 'Geheime Abstimmung',
            saveOnly: 'Abstimmung speichern',
            saveAndStart: 'Abstimmung speichern & sofort starten'
          }
        },
        listing: {
          start: 'Abstimmung starten',
          startConfirm: 'Möchtest du die Abstimmung starten?',
          delete: 'Abstimmung löschen',
          deleteConfirm: 'Möchtest du die Abstimmung wirklich löschen?'
        }
      },
      results: {
        givenVotes: 'Anzahl abgegebener Stimmen:',
        voters: 'Stimmberechtigte:',
        mainResult: 'Gesamtergebnis',
        showMemberList: 'Teilnehmerliste Anzeigen',
        detailResult: 'Detailergebnis',
        showDetailResult: 'Ergebnisliste anzeigen',
        type: {
          0: 'offen',
          1: 'geheim'
        }
      },
      user: {
        pending: {
          tankYou: 'Vielen Dank für Ihren Login.',
          bodyText: 'Ihr Login wird nun überprüft. Sobald sich Ihr Status ändert wird sich diese Ansicht automatisch aktualisieren.'
        },
        verified: {
          welcome: 'Willkommen'
        }
      }
    },
    pagination: {
      next: '>',
      previous: '<'
    },
    navigation: {
      myProfile: 'Mein Profil',
      logOut: 'Ausloggen'
    },
    error: {
      network: {
        internalServerError: 'Internal server error'
      }
    }
  }
}

export function localize (path) {
  const language = store.state.language
  path = language + '.' + path
  const pathParts = path.split('.')
  const value = R.path(pathParts, localizations)
  if (value === undefined || value === null) {
    throw new Error('Could not find localization for path "' + path + '" and language ' + language)
  }
  return value
}
