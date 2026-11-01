import { describe, expect, it } from 'vitest';
import { CHAPTERS } from './chapters.mjs';
import { chaptersForPath, HELP_ROUTES, searchChapters } from './help-context.mjs';

const ids = (path) => chaptersForPath(path, CHAPTERS).map((chapter) => chapter.id);

describe('help context', () => {
  it('only references existing chapters', () => {
    const known = CHAPTERS.map((chapter) => chapter.id);
    for (const [, routeIds] of HELP_ROUTES) {
      routeIds.forEach((id) => expect(known).toContain(id));
    }
  });

  it('prefers the most specific route', () => {
    expect(ids('/admin/event/member-room/1/event-user/multiple-new')[0]).toBe('teilnehmer-anlegen');
    expect(ids('/admin/event/member-room/1')[0]).toBe('teilnehmer-verwalten');
    expect(ids('/admin/event/polls/1/poll/new')[0]).toBe('abstimmung-erstellen');
    expect(ids('/admin/event/polls/1')[0]).toBe('abstimmung-durchfuehren');
    expect(ids('/admin/event/poll-results/1')[0]).toBe('ergebnisse');
    expect(ids('/admin/unbekannt')).toEqual([]);
  });

  it('searches all words and ranks title hits first', () => {
    expect(searchChapters('stimmrecht', CHAPTERS)[0].id).toBe('stimmrecht-uebertragen');
    expect(searchChapters('passwort vergessen', CHAPTERS).length).toBeGreaterThan(0);
    expect(searchChapters('gibtesnicht', CHAPTERS)).toEqual([]);
    expect(searchChapters('  ', CHAPTERS)).toEqual([]);
  });
});
