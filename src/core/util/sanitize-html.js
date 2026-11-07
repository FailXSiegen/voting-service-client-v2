import createDOMPurify from 'dompurify';

/**
 * Central HTML sanitizer for everything rendered as HTML (CMS pages, FAQ, translations).
 * Use the directive `v-safe-html` instead of `v-html`; user-provided plain text (poll answers,
 * names, titles) is rendered via `{{ }}` and never as HTML.
 */

const ALLOWED_TAGS = [
  'a',
  'abbr',
  'b',
  'blockquote',
  'br',
  'caption',
  'code',
  'col',
  'colgroup',
  'dd',
  'del',
  'div',
  'dl',
  'dt',
  'em',
  'figcaption',
  'figure',
  'h1',
  'h2',
  'h3',
  'h4',
  'h5',
  'h6',
  'hr',
  'i',
  'img',
  'ins',
  'kbd',
  'li',
  'mark',
  'ol',
  'p',
  'pre',
  's',
  'small',
  'span',
  'strong',
  'sub',
  'sup',
  'table',
  'tbody',
  'td',
  'tfoot',
  'th',
  'thead',
  'tr',
  'u',
  'ul',
];

const ALLOWED_ATTR = [
  'href',
  'target',
  'rel',
  'title',
  'src',
  'alt',
  'width',
  'height',
  'loading',
  'class',
  'id',
  'colspan',
  'rowspan',
  'scope',
  'start',
  'reversed',
  'style',
  'aria-label',
  'aria-hidden',
  'aria-expanded',
  'aria-controls',
  'aria-labelledby',
  'role',
  // Bootstrap collapse/accordion markup in CMS content.
  'data-bs-toggle',
  'data-bs-target',
  'data-bs-parent',
];

const FORBID_TAGS = [
  'script',
  'style',
  'iframe',
  'frame',
  'object',
  'embed',
  'form',
  'input',
  'button',
  'textarea',
  'select',
  'link',
  'meta',
  'base',
  'svg',
  'math',
  'template',
];

// CSS properties CKEditor produces (alignment, image size, table properties, list styles).
// Values must not load anything (url(), image-set(), expression(), @import).
const ALLOWED_STYLE_PROPERTIES = new Set([
  'text-align',
  'vertical-align',
  'width',
  'max-width',
  'min-width',
  'height',
  'float',
  'margin',
  'margin-top',
  'margin-right',
  'margin-bottom',
  'margin-left',
  'padding',
  'padding-top',
  'padding-right',
  'padding-bottom',
  'padding-left',
  'border',
  'border-width',
  'border-style',
  'border-color',
  'border-collapse',
  'color',
  'background-color',
  'font-weight',
  'font-style',
  'text-decoration',
  'list-style-type',
]);
const UNSAFE_STYLE_VALUE = /url\s*\(|image-set|expression|@import|javascript:|\\|<|>/i;

const SAFE_LINK = /^(?:https?:|mailto:)/i;
const SAFE_IMAGE = /^https:/i;
const DATA_BS_TOGGLE = /^collapse$/;
const DATA_BS_SELECTOR = /^#[A-Za-z][\w-]*$/;

/**
 * True for relative URLs ("/foo", "foo/bar", "#anchor", "?q"), false for anything with a scheme
 * and for protocol-relative URLs ("//evil.tld").
 */
function isRelativeUrl(value) {
  if (value.startsWith('//')) {
    return false;
  }
  // A colon before the first slash, question mark or hash means: URL with a scheme.
  return !/^[^/?#]*:/.test(value);
}

function normalizeUrl(value) {
  // Browsers ignore control characters and whitespace inside schemes ("java\nscript:").
  // eslint-disable-next-line no-control-regex
  return String(value).replace(/[\u0000- \u007f-\u009f]/g, '');
}

function filterStyle(value) {
  return String(value)
    .split(';')
    .map((declaration) => declaration.trim())
    .filter((declaration) => {
      const separator = declaration.indexOf(':');
      if (separator < 1) {
        return false;
      }
      const property = declaration.slice(0, separator).trim().toLowerCase();
      const propertyValue = declaration.slice(separator + 1);
      return ALLOWED_STYLE_PROPERTIES.has(property) && !UNSAFE_STYLE_VALUE.test(propertyValue);
    })
    .join('; ');
}

function sanitizeAttributes(node) {
  const tag = node.nodeName.toLowerCase();

  if (node.hasAttribute('href')) {
    const href = normalizeUrl(node.getAttribute('href'));
    if (tag !== 'a' || !(SAFE_LINK.test(href) || isRelativeUrl(href))) {
      node.removeAttribute('href');
    }
  }

  if (node.hasAttribute('src')) {
    const src = normalizeUrl(node.getAttribute('src'));
    if (tag !== 'img' || !(SAFE_IMAGE.test(src) || isRelativeUrl(src))) {
      node.removeAttribute('src');
    }
  }

  if (node.hasAttribute('target')) {
    if (node.getAttribute('target') === '_blank') {
      // Prevent reverse tabnabbing.
      node.setAttribute('rel', 'noopener noreferrer');
    } else {
      node.removeAttribute('target');
    }
  }

  if (node.hasAttribute('style')) {
    const style = filterStyle(node.getAttribute('style'));
    if (style) {
      node.setAttribute('style', style);
    } else {
      node.removeAttribute('style');
    }
  }

  if (
    node.hasAttribute('data-bs-toggle') &&
    !DATA_BS_TOGGLE.test(node.getAttribute('data-bs-toggle'))
  ) {
    node.removeAttribute('data-bs-toggle');
  }
  ['data-bs-target', 'data-bs-parent'].forEach((attribute) => {
    if (node.hasAttribute(attribute) && !DATA_BS_SELECTOR.test(node.getAttribute(attribute))) {
      node.removeAttribute(attribute);
    }
  });
}

let purifier = null;

function getPurifier() {
  if (purifier) {
    return purifier;
  }
  // Own instance: hooks must not leak into other DOMPurify users (e.g. CKEditor).
  purifier = createDOMPurify(window);
  purifier.addHook('afterSanitizeAttributes', sanitizeAttributes);
  return purifier;
}

const CONFIG = {
  ALLOWED_TAGS,
  ALLOWED_ATTR,
  FORBID_TAGS,
  FORBID_ATTR: ['srcset', 'srcdoc', 'formaction', 'xlink:href', 'action', 'background', 'ping'],
  ALLOW_DATA_ATTR: false,
  ALLOW_UNKNOWN_PROTOCOLS: false,
  // Only http(s), mailto and relative URLs; checked again in the hook.
  ALLOWED_URI_REGEXP: /^(?:(?:https?|mailto):|[^a-z]|[a-z+.-]+(?:[^a-z+.\-:]|$))/i,
  KEEP_CONTENT: true,
};

/**
 * @param {*} dirty
 * @return {String} sanitized HTML
 */
export function sanitizeHtml(dirty) {
  if (dirty === null || dirty === undefined || dirty === '') {
    return '';
  }
  return getPurifier().sanitize(String(dirty), CONFIG);
}

function render(el, binding) {
  el.innerHTML = sanitizeHtml(binding.value);
}

/**
 * Drop-in replacement for v-html: `<div v-safe-html="content" />`.
 */
export const safeHtmlDirective = {
  beforeMount: render,
  updated(el, binding) {
    if (binding.value !== binding.oldValue) {
      render(el, binding);
    }
  },
};
