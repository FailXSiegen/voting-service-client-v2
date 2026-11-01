// Public, indexable pages. Used at runtime (CorePageLayout) and by scripts/seo-postbuild.mjs.
export const SEO_PAGES = {
  '/': {
    file: 'start',
    title: 'Digitale Wahlen und Abstimmungen für Vereine und Verbände',
    description:
      'digitalwahl.org: Online-Wahlen und Abstimmungen für Vereine und Verbände. Geheim oder offen, live oder als Briefwahl, mit Delegiertenstimmen und Stimmübertragung.',
  },
  '/anleitung': {
    file: 'anleitung',
    source: 'chapters',
    title: 'Anleitung mit Videos',
    description:
      'Schritt-für-Schritt-Anleitungen mit Videos für digitale Wahlen: für Teilnehmer, Organisatoren und Admins, inklusive Grenzen und typischer Fallstricke.',
  },
  '/funktionen-planung': {
    file: 'funktionen-planung',
    source: 'StaticPageFunctions.vue',
    title: 'Funktionen',
    description:
      'Funktionen von digitalwahl.org: synchrone Wahl und Briefwahl, geheime und offene Abstimmungen, Teilnehmerverwaltung, Stimmübertragung, Export und Videokonferenz.',
  },
  '/haeufige-fragen': {
    file: 'haeufige-fragen',
    source: 'faq',
    title: 'Häufige Fragen',
    description:
      'Antworten zu digitalen Wahlen mit digitalwahl.org: Voraussetzungen, Registrierung, Durchführung, Ergebnisse, Sicherheit und Support.',
  },
  '/impressum': {
    file: 'impressum',
    source: 'StaticPageImprint.vue',
    title: 'Impressum',
    description: 'Impressum und Anbieterkennzeichnung von digitalwahl.org.',
  },
  '/datenschutz': {
    file: 'datenschutz',
    source: 'StaticPageDataProtection.vue',
    title: 'Datenschutz',
    description:
      'Datenschutzerklärung von digitalwahl.org: welche Daten verarbeitet werden und welche Rechte Sie haben.',
  },
  '/nutzervereinbarung': {
    file: 'nutzervereinbarung',
    source: 'StaticPageUserAgreement.vue',
    title: 'Nutzervereinbarung',
    description: 'Nutzungsbedingungen für die Wahl- und Abstimmungsplattform digitalwahl.org.',
  },
};
