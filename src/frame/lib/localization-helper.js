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
          usernameHelp: 'Als Benutzername dient Ihre Mitgliedsnummer oder Ihre E-Mail Adresse. Die Informationen dienen zur Akkreditierung.',
          email: 'E-Mail*',
          password: 'Passwort*',
          passwordHelp: 'Bitte verwenden Sie ein Kennwort mit mindestens 6 Zeichen. Das Kennwort wird zur Wiedereinwahl zum Event benötigt, falls Sie wegen Inaktivität oder Unterbrechung wieder teilnehmen möchten.',
          publicName: 'Anzeige-Name*',
          publicNameHelp: 'Hier geben Sie bitte den Namen ein mit dem sie angezeigt werden möchten. Für den Login relevant sind allerdings die oberen 2 Felder.',
          eventIdent: 'Event-ID eingeben*'
        },
        headline: {
          title: 'digitalwahl.org',
          subtitle: 'Einfach die Wahl haben',
          orgaLogin: 'Als Organisator einloggen',
          userLogin: 'Als Besucher einloggen',
          eventIdent: 'Mit Event-ID einloggen',
          userWelcomeTo: 'Herzlich willkommen, bitte loggen Sie sich ein.',
          inactiveEvent: 'Das Event ist noch nicht freigeschaltet',
          orgaRegister: 'Als Organisator registrieren'
        },
        inactiveEventText: 'Bitte versuchen Sie es später noch einmal. Das Event ist noch nicht aktiv.',
        submit: 'Login',
        submitToEvent: 'In Event einloggen',
        registerAsOrganizer: 'Als Organisator registrieren',
        invalidCredentials: 'Invalid credentials'
      },
      register: {
        headline: 'Registrierung',
        subheadline: 'Hier können Sie eine Anfrage zur Registrierung abschicken',
        description: 'Sie müssen nach der Registrierung Ihre E-Mail Adresse bestätigen.<br />Nach Bestätigung erhält ein Administrator Ihre Registrierungsanfrage und schaltet Ihren Zugang frei.<hr class="my-4"><u class="h3">Die Plattform befindet sich im Beta-Status!</u>',
        label: {
          username: 'Benutzername *',
          email: 'E-Mail Adresse *',
          password: 'Passwort *',
          repeatPassword: 'Passwort wiederholen *',
          publicName: 'Ihr Name *',
          publicOrganisation: 'Ihre Organisation *',
          publicOrganisationHint: 'Die kostenlose Nutzung ist gemeinnützigen Organisationen und Verbänden vorbehalten.',
          dataProtection: '* Ich bestätige, dass ich die <a href="/datenschutz" target="_blank">Datenschutzerklärung</a> gelesen habe, zur Kenntnis nehme und mit den <a href="/nutzungsbedingungen" target="_blank">Nutzungsbedigungen</a> einverstanden bin.',
          beta: '* Ich nehme zur Kenntnis, dass die Plattform sich im Entwicklungszustand befindet und es dadurch zu Einschränkungen kommen kann.'
        },
        submit: 'Registrierung abschicken'
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
          block: 'Benutzer löschen',
          member: 'Teilnehmer',
          visitor: 'Besucher',
          online: 'Online',
          offline: 'Offline',
          all: 'Gesamt',
          allVoteAmount: 'Gesamtstimmen'
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
            submit: 'Dieses Event speichern',
            eventUser: {
              submit: 'Benutzer speichern',
              createNew: 'Neuen Benutzer erstellen',
              update: 'Benutzer bearbeiten',
              allowToVote: 'Teilnehmer mit Stimmrecht',
              verified: 'Freigeschaltet',
              publicName: 'Angezeigter Name',
              username: 'Benutzername',
              voteAmount: 'Anzahl der Stimmen'
            },
            eventMultipleUser: {
              submit: 'Benutzerliste speichern',
              createNew: 'Mehrere Benutzer erstellen',
              allowToVote: 'Teilnehmer mit Stimmrecht',
              usernames: 'Benutzernamen',
              usernamesHint: 'Immer ein Benutzer pro Zeile. Keine Leerzeichen im Benutzernamen. Keine leeren Zeilen',
              voteAmount: 'Anzahl der Stimmen'
            }
          }
        },
        listing: {
          name: 'Name',
          slug: 'Slug / Identifikator',
          created: 'Erstellt am',
          scheduled: 'Geplant am',
          state: 'Status',
          stateActive: 'Aktiv',
          stateLocked: 'Inaktiv',
          voteAmount: 'Stimmen',
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
        },
        modal: {
          submitPoll: 'Jetzt abstimmen',
          abstain: 'Enthaltung',
          abstainHelptext: 'Entwertet oben ausgewählte Felder; Stimme wird komplett als Enthaltung gezählt!',
          buttonStart: 'Abstimmung starten',
          maxVote1: 'Sie können eine Position auswählen',
          maxVoteGreater1: 'Achtung: Sie können mehrere Positionen auswählen: ',
          minVoteGreater0: 'Achtung: Sie müssen eine Mindestanzahl auswählen: '
        },
        active: {
          title: 'Aktuelle Abstimmung',
          close: 'Abstimmung beenden erzwingen'
        }
      },
      results: {
        givenVotes: 'Anzahl abgegebener Stimmen:',
        voters: 'Maximale Stimmenanzahl:',
        mainResult: 'Gesamtergebnis',
        showMemberList: 'Teilnehmerliste Anzeigen',
        detailResult: 'Detailergebnis',
        showDetailResult: 'Ergebnisliste anzeigen',
        type: {
          0: 'offen',
          1: 'geheim',
          SECRET: 'geheim',
          PUBLIC: 'offen'
        },
        showMore: 'Weitere Ergebnisse anzeigen',
        noMoreResults: 'Keine weitere Ergebnisse verfügbar'
      },
      user: {
        pending: {
          tankYou: 'Vielen Dank für Ihren Login.',
          loggedInAs: 'Sie sind angemeldet als:',
          bodyText: 'Ihr Login wird nun überprüft. Sobald sich Ihr Status ändert wird sich diese Ansicht automatisch aktualisieren.'
        },
        verified: {
          welcome: 'Willkommen',
          activePoll: 'Es findet zur Zeit eine Abstimmung statt.<br>' +
            'Bitte warten Sie auf das Ergebnis. Das Ergebnis erscheint automatisch.<br>' +
            'Sie müssen die Seite nicht aktualisieren.',
          voted: 'Erfolgreich abgestimmt',
          noActivePoll: 'Es findet zur Zeit keine Abstimmung statt.'
        }
      },
      organizers: {
        user: 'Benutzer',
        organisation: 'Organisation',
        state: 'Status',
        mail: 'E-Mail',
        confirmedMail: 'E-Mail bestätigt',
        actions: 'Aktionen',
        username: 'Benutzername',
        verified: 'aktiv',
        verify: 'aktivieren',
        denied: 'inaktiv',
        deny: 'deaktivieren',
        edit: 'bearbeiten',
        delete: 'löschen'
      }
    },
    pagination: {
      next: '>',
      previous: '<'
    },
    navigation: {
      myProfile: 'Mein Profil',
      logOut: 'Ausloggen',
      reload: 'Aktualisieren'
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
