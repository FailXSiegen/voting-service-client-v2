// Which manual chapters belong to which backend page, most specific route first.
const ROUTES = [
  [/\/event-user\/multiple-new$/, ['teilnehmer-anlegen', 'token-zugang', 'links-versenden']],
  [/\/event-user\/new$/, ['teilnehmer-anlegen', 'links-versenden']],
  [/\/event-user\/edit\//, ['teilnehmer-verwalten', 'stimmrecht-uebertragen']],
  [
    /^\/admin\/event\/member-room\//,
    ['teilnehmer-verwalten', 'stimmrecht-uebertragen', 'teilnehmer-anlegen', 'links-versenden'],
  ],
  [/^\/admin\/event\/lobby-room\//, ['warteraum-organisator', 'teilnehmer-verwalten']],
  [/\/poll\/(new|edit|copy)/, ['abstimmung-erstellen', 'briefwahl-organisator']],
  [
    /^\/admin\/event\/polls\//,
    ['abstimmung-durchfuehren', 'abstimmung-erstellen', 'briefwahl-organisator'],
  ],
  [/^\/admin\/event\/poll-results\//, ['ergebnisse', 'veranstaltung-loeschen']],
  [/^\/admin\/event\/new/, ['veranstaltung-erstellen', 'regeln-design', 'briefwahl-organisator']],
  [
    /^\/admin\/event\/edit\//,
    [
      'regeln-design',
      'veranstaltung-erstellen',
      'links-versenden',
      'videokonferenz',
      'briefwahl-organisator',
    ],
  ],
  [/^\/admin\/event\/?$/, ['veranstaltung-erstellen', 'veranstaltung-loeschen']],
  [/^\/admin\/video-conference/, ['videokonferenz']],
  [/^\/admin\/organizers/, ['organisatoren-verwalten', 'veranstaltung-uebertragen']],
  [
    /^\/admin\/(all-event|static-content|message-editor|global-settings)/,
    ['inhalte-einstellungen'],
  ],
  [/^\/admin\/profile/, ['konto']],
  [/^\/admin\/?$/, ['konto', 'veranstaltung-erstellen']],
];

export function chaptersForPath(path, chapters) {
  const ids = ROUTES.find(([pattern]) => pattern.test(path))?.[1] ?? [];
  return ids.map((id) => chapters.find((chapter) => chapter.id === id)).filter(Boolean);
}

const searchable = (chapter) =>
  [
    chapter.title,
    chapter.intro,
    ...chapter.steps,
    ...(chapter.limits || []),
    ...(chapter.pitfalls || []),
  ]
    .join(' ')
    .toLowerCase();

// All words must match; hits in the title rank first.
export function searchChapters(query, chapters) {
  const words = query.toLowerCase().split(/\s+/).filter(Boolean);
  if (!words.length) return [];
  return chapters
    .filter((chapter) => words.every((word) => searchable(chapter).includes(word)))
    .map((chapter) => ({
      chapter,
      inTitle: words.filter((word) => chapter.title.toLowerCase().includes(word)).length,
    }))
    .sort((a, b) => b.inTitle - a.inTitle)
    .map(({ chapter }) => chapter);
}

export const HELP_ROUTES = ROUTES;
