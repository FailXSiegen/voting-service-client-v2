import * as R from 'ramda'

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
          email: 'E-Mail',
          password: 'Passwort',
          eventIdent: 'Event-ID eingeben'
        },
        headline: {
          title: 'Voting Service',
          userLogin: 'Als Besucher einloggen',
          eventIdent: 'Mit Event-ID einloggen'
        },
        submit: 'Login',
        submitToEvent: 'In Event einloggen'
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
          results: 'Ergebnisse'
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
            description: 'Event-Beschreibung',
            date: 'Start-Datum',
            activateLobby: 'Lobby aktivieren / vorzeitiger Login und Anzeige des Events auf der Startseite',
            submit: 'Dieses Event erstellen'
          }
        },
        listing: {
          name: 'Name',
          created: 'Erstellt am',
          finished: 'Beendet',
          actions: {
            label: 'Aktionen',
            edit: 'Bearbeiten',
            inviteLink: 'Einladungs-Link kopieren',
            newTab: 'Event in neuem Tab öffnen',
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
        showDetailResult: 'Ergebnisliste anzeigen'
      }
    },
    pagination: {
      next: '>',
      previous: '<'
    },
    navigation: {
      myProfile: 'Mein Profil'
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
