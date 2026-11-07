// @vitest-environment jsdom
// DOMPurify needs a spec-compliant DOM; happy-dom (default in vite.config.mjs) is not.
import { describe, it, expect } from 'vitest';
import { sanitizeHtml } from '../sanitize-html';
import { normalizeHost, whitelistedHost } from '../allowed-hosts';

describe('sanitizeHtml', () => {
  it('removes event handler attributes', () => {
    const result = sanitizeHtml('<img src=x onerror=alert(1)>');
    expect(result).not.toMatch(/onerror/i);
    expect(result).not.toMatch(/alert/);
  });

  it('removes script, style, iframe and object elements', () => {
    const result = sanitizeHtml(
      '<p>ok</p><script>alert(1)</script><style>body{}</style><iframe src="https://evil.tld"></iframe><object data="x"></object>'
    );
    expect(result).toBe('<p>ok</p>');
  });

  it('removes javascript: and data: links', () => {
    const result = sanitizeHtml(
      '<a href="javascript:alert(1)">a</a><a href=" java\nscript:alert(1)">b</a><a href="data:text/html,x">c</a>'
    );
    expect(result).not.toMatch(/javascript|script:|data:/i);
    expect(result).toContain('>a</a>');
  });

  it('keeps basic formatting and http(s)/mailto/relative links', () => {
    const html =
      '<b>fett</b> <strong>stark</strong> <a href="https://example.org/x">x</a> <a href="mailto:a@b.de">m</a> <a href="/datenschutz">d</a>';
    expect(sanitizeHtml(html)).toBe(html);
  });

  it('adds rel=noopener to target=_blank links', () => {
    const result = sanitizeHtml('<a href="/datenschutz" target="_blank">x</a>');
    expect(result).toContain('target="_blank"');
    expect(result).toContain('rel="noopener noreferrer"');
  });

  it('allows https and relative images only', () => {
    expect(sanitizeHtml('<img src="https://example.org/a.png" alt="a">')).toContain(
      'src="https://example.org/a.png"'
    );
    expect(sanitizeHtml('<img src="/uploads/a.png">')).toContain('src="/uploads/a.png"');
    expect(sanitizeHtml('<img src="http://example.org/a.png">')).not.toContain('src=');
    expect(sanitizeHtml('<img src="data:image/svg+xml;base64,AAAA">')).not.toContain('src=');
    expect(sanitizeHtml('<img src="//evil.tld/a.png">')).not.toContain('src=');
  });

  it('filters style attributes to a safe subset', () => {
    const result = sanitizeHtml(
      '<p style="text-align:center; background-image:url(https://evil.tld/x); position:fixed">x</p>'
    );
    expect(result).toBe('<p style="text-align:center">x</p>');
  });

  it('keeps translation markup', () => {
    expect(sanitizeHtml('Zeile 1<br />Zeile 2')).toBe('Zeile 1<br>Zeile 2');
  });

  it('returns an empty string for empty input', () => {
    expect(sanitizeHtml(null)).toBe('');
    expect(sanitizeHtml(undefined)).toBe('');
  });
});

describe('allowed hosts', () => {
  it('normalizes hosts and rejects URLs with paths or credentials', () => {
    expect(normalizeHost('https://meet.jit.si/')).toBe('meet.jit.si');
    expect(normalizeHost('meet.jit.si')).toBe('meet.jit.si');
    expect(normalizeHost('https://meet.jit.si@evil.tld')).toBeNull();
    expect(normalizeHost('meet.jit.si/evil.js#')).toBeNull();
    expect(normalizeHost('javascript:alert(1)')).toBeNull();
  });

  it('only accepts whitelisted hosts', () => {
    expect(whitelistedHost('https://meet.jit.si', ['meet.jit.si'])).toBe('meet.jit.si');
    expect(whitelistedHost('https://evil.tld', ['meet.jit.si'])).toBeNull();
  });
});
